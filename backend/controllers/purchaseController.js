import Purchase from "../models/Purchase.js";
import ledgerService from "../services/ledgerService.js";
import { ACCOUNT_TYPES } from "../utils/constants.js";
import mongoose from "mongoose";

/**
 * FINAL PRODUCTION PURCHASE CONTROLLER
 * ✔ Smart Cleanup (No Reversal Entries in Ledger)
 * ✔ Atomic Transactions with Mongoose Sessions
 * ✔ Freight Logic (Supplier Credit/Debit)
 */

// ==========================================
// 1. CREATE PURCHASE
// ==========================================
export const createPurchase = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const {
            supplierId, billNo, grandTotal, paymentMode,
            logistics, purchaseDate, date
        } = req.body;

        if (!supplierId || !billNo) throw new Error("Validation Failed: Supplier ID and Bill Number are required");

        const freightAmt = Number(logistics?.freight || 0);
        const billAmount = Number(grandTotal || 0);
        const txnDate = purchaseDate ? new Date(purchaseDate) : (date ? new Date(date) : new Date());

        // A. SAVE PURCHASE RECORD
        const purchase = new Purchase({
            ...req.body,
            performedBy: req.user?._id
        });
        const savedPurchase = await purchase.save({ session });

        // B. MAIN BILL ENTRY (Supplier is Credited -> Liability badh rahi hai)
        await ledgerService.postTransaction({
            partyId: supplierId,
            type: ACCOUNT_TYPES.PURCHASE || 'PURCHASE',
            debit: 0,
            credit: billAmount,
            description: `PURCHASE BILL NO: ${billNo}`.toUpperCase(),
            referenceId: savedPurchase._id,
            paymentMode: paymentMode || "CREDIT",
            performedBy: req.user?._id,
            date: txnDate
        }, session);

        // C. FREIGHT ENTRY
        if (freightAmt !== 0) {
            await ledgerService.postTransaction({
                partyId: supplierId,
                type: 'ADJUSTMENT',
                // +ve: Supplier ne charge kiya (Credit), -ve: Humne pay kiya (Debit)
                credit: freightAmt > 0 ? freightAmt : 0,
                debit: freightAmt < 0 ? Math.abs(freightAmt) : 0,
                description: (freightAmt > 0 ? `FREIGHT CHARGES ADDED` : `FREIGHT DISCOUNT/PAID BY US`).toUpperCase() + ` - BILL: ${billNo}`,
                referenceId: savedPurchase._id,
                paymentMode: "ADJUSTMENT",
                performedBy: req.user?._id,
                date: txnDate
            }, session);
        }

        await session.commitTransaction();
        res.status(201).json({ success: true, message: "Purchase recorded and ledger updated.", data: savedPurchase });

    } catch (error) {
        await session.abortTransaction();
        console.error("❌ Purchase Creation Error:", error.message);
        res.status(400).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};

// ==========================================
// 2. UPDATE PURCHASE (Smart Sync - Cleanup Old, Post New)
// ==========================================
export const updatePurchase = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const purchaseId = req.params.id;
        const { supplierId, billNo, grandTotal, logistics, purchaseDate, date, paymentMode } = req.body;

        // 1. Purane Ledger records ko Cleanup karein (No Reversal)
        // Isse balance auto-reverse hoga aur Ledger saaf ho jayega
        await ledgerService.deleteByReference(purchaseId, session);

        // 2. Update Purchase Document
        const updatedPurchase = await Purchase.findByIdAndUpdate(
            purchaseId,
            { ...req.body, performedBy: req.user?._id },
            { new: true, session, runValidators: true }
        );

        if (!updatedPurchase) throw new Error("Purchase record not found");

        // 3. Fresh Ledger Entries Post Karein
        const billAmount = Number(grandTotal || 0);
        const freightAmt = Number(logistics?.freight || 0);
        const txnDate = purchaseDate ? new Date(purchaseDate) : (date ? new Date(date) : new Date());

        // Main Bill
        await ledgerService.postTransaction({
            partyId: supplierId,
            type: ACCOUNT_TYPES.PURCHASE || 'PURCHASE',
            debit: 0,
            credit: billAmount,
            description: `UPDATED PURCHASE BILL: ${billNo}`.toUpperCase(),
            referenceId: updatedPurchase._id,
            paymentMode: paymentMode || "CREDIT",
            performedBy: req.user?._id,
            date: txnDate
        }, session);

        // Freight
        if (freightAmt !== 0) {
            await ledgerService.postTransaction({
                partyId: supplierId,
                type: 'ADJUSTMENT',
                credit: freightAmt > 0 ? freightAmt : 0,
                debit: freightAmt < 0 ? Math.abs(freightAmt) : 0,
                description: `UPDATED FREIGHT ADJ - BILL: ${billNo}`.toUpperCase(),
                referenceId: updatedPurchase._id,
                paymentMode: "ADJUSTMENT",
                performedBy: req.user?._id,
                date: txnDate
            }, session);
        }

        await session.commitTransaction();
        res.status(200).json({ success: true, message: "Purchase and Ledger updated successfully.", data: updatedPurchase });

    } catch (error) {
        await session.abortTransaction();
        res.status(400).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};

// ==========================================
// 3. DELETE PURCHASE (Complete Cleanup)
// ==========================================
export const deletePurchase = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const purchaseId = req.params.id;

        // 1. Ledger se entries delete karein aur balance theek karein
        await ledgerService.deleteByReference(purchaseId, session);

        // 2. Purchase table se record hatayein
        const deletedPurchase = await Purchase.findByIdAndDelete(purchaseId).session(session);
        if (!deletedPurchase) throw new Error("Purchase record already deleted or not found");

        await session.commitTransaction();
        res.status(200).json({ success: true, message: "Purchase record and associated ledger entries deleted." });

    } catch (error) {
        await session.abortTransaction();
        res.status(400).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};

// ==========================================
// 4. GET ALL & BY ID
// ==========================================
export const getAllPurchases = async (req, res, next) => {
    try {
        const purchases = await Purchase.find()
            .populate("supplierId", "name phone currentBalance")
            .sort({ purchaseDate: -1, createdAt: -1 })
            .lean();
        res.status(200).json({ success: true, count: purchases.length, data: purchases });
    } catch (error) { next(error); }
};

export const getPurchaseById = async (req, res, next) => {
    try {
        const purchase = await Purchase.findById(req.params.id)
            .populate("supplierId", "name phone address gstin currentBalance")
            .populate("performedBy", "name")
            .lean();

        if (!purchase) return res.status(404).json({ success: false, message: "Purchase not found" });
        res.status(200).json({ success: true, data: purchase });
    } catch (error) { next(error); }
};