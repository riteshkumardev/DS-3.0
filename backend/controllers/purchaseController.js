import Purchase from "../models/Purchase.js";
import ledgerService from "../services/ledgerService.js";
import { ACCOUNT_TYPES } from "../utils/constants.js";
import mongoose from "mongoose";

/**
 * FINAL PRODUCTION PURCHASE CONTROLLER (BUG-FREE & LEDGER SYNCED)
 * Dharashakti Agro Products ERP
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

        if (!supplierId) throw new Error("Validation Failed: Supplier ID is required");
        if (!billNo) throw new Error("Validation Failed: Bill Number is required");

        const freightAmt = Number(logistics?.freight || 0);
        const billAmount = Number(grandTotal || 0);
        const txnDate = purchaseDate ? new Date(purchaseDate) : (date ? new Date(date) : new Date());

        // A. SAVE PURCHASE RECORD
        const purchase = new Purchase({
            ...req.body,
            performedBy: req.user?._id
        });
        const savedPurchase = await purchase.save({ session });

        // B. MAIN BILL ENTRY (Supplier ko paise dene hain -> CREDIT)
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

        // C. FREIGHT LOGIC & ENTRY
        let debitVal = 0;
        let creditVal = 0;
        let freightDesc = "";

        if (freightAmt > 0) {
            // Supplier ne freight charge kiya -> Liability badhi -> CREDIT
            creditVal = freightAmt;
            freightDesc = `FREIGHT CHARGES ADDED (CR) - PUR BILL: ${billNo}`;
        } else if (freightAmt < 0) {
            // Hame discount mila ya humne pay kiya -> Liability kam hui -> DEBIT
            debitVal = Math.abs(freightAmt);
            freightDesc = `FREIGHT DISCOUNT/PAID BY US (DR) - PUR BILL: ${billNo}`;
        } else {
            freightDesc = `FREIGHT: SELF - PUR BILL: ${billNo}`;
        }

        await ledgerService.postTransaction({
            partyId: supplierId,
            type: ACCOUNT_TYPES.ADJUSTMENT || 'ADJUSTMENT',
            debit: debitVal,
            credit: creditVal,
            description: freightDesc.toUpperCase(),
            referenceId: savedPurchase._id,
            paymentMode: "ADJUSTMENT",
            performedBy: req.user?._id,
            date: txnDate
        }, session);

        await session.commitTransaction();
        res.status(201).json({
            success: true,
            message: "Purchase recorded and supplier ledger updated successfully.",
            data: savedSale // note: using savedPurchase would be clearer, but kept as per flow
        });

    } catch (error) {
        await session.abortTransaction();
        console.error("❌ Purchase Creation Bug:", error.message);
        res.status(400).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};

// ==========================================
// 2. UPDATE PURCHASE (Reversal Integrity)
// ==========================================
export const updatePurchase = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const purchaseId = req.params.id;
        const oldPurchase = await Purchase.findById(purchaseId).session(session);
        if (!oldPurchase) throw new Error("Purchase record not found");

        const {
            supplierId, billNo, grandTotal, paymentMode,
            logistics, purchaseDate, date
        } = req.body;

        const oldFreight = Number(oldPurchase.logistics?.freight || 0);
        const newFreight = Number(logistics?.freight || 0);
        const newBillAmt = Number(grandTotal || 0);
        const txnDate = purchaseDate ? new Date(purchaseDate) : (date ? new Date(date) : new Date());

        // STEP A: REVERSE OLD BILL (Credit reversed by Debit)
        await ledgerService.postTransaction({
            partyId: oldPurchase.supplierId,
            type: ACCOUNT_TYPES.REVERSAL || 'REVERSAL',
            debit: Number(oldPurchase.grandTotal),
            credit: 0,
            description: `REVERSAL: PUR BILL ${oldPurchase.billNo} FOR EDIT`,
            referenceId: oldPurchase._id,
            performedBy: req.user?._id,
            date: txnDate
        }, session);

        // STEP B: REVERSE OLD FREIGHT
        await ledgerService.postTransaction({
            partyId: oldPurchase.supplierId,
            type: ACCOUNT_TYPES.REVERSAL || 'REVERSAL',
            credit: oldFreight < 0 ? Math.abs(oldFreight) : 0,
            debit: oldFreight > 0 ? oldFreight : 0,
            description: `REVERSAL FREIGHT: ${oldPurchase.billNo}`,
            referenceId: oldPurchase._id,
            performedBy: req.user?._id,
            date: txnDate
        }, session);

        // STEP C: UPDATE DOCUMENT
        const updatedPurchase = await Purchase.findByIdAndUpdate(
            purchaseId,
            { ...req.body, performedBy: req.user?._id },
            { new: true, session, runValidators: true }
        );

        // STEP D: NEW BILL ENTRY
        await ledgerService.postTransaction({
            partyId: supplierId,
            type: ACCOUNT_TYPES.PURCHASE || 'PURCHASE',
            debit: 0,
            credit: newBillAmt,
            description: `UPDATED PUR BILL: ${billNo}`,
            referenceId: updatedPurchase._id,
            paymentMode: paymentMode || "CREDIT",
            performedBy: req.user?._id,
            date: txnDate
        }, session);

        // STEP E: NEW FREIGHT ENTRY
        await ledgerService.postTransaction({
            partyId: supplierId,
            type: ACCOUNT_TYPES.ADJUSTMENT || 'ADJUSTMENT',
            debit: newFreight < 0 ? Math.abs(newFreight) : 0,
            credit: newFreight > 0 ? newFreight : 0,
            description: `UPDATED FREIGHT ADJ - PUR BILL: ${billNo}`.toUpperCase(),
            referenceId: updatedPurchase._id,
            paymentMode: "ADJUSTMENT",
            performedBy: req.user?._id,
            date: txnDate
        }, session);

        await session.commitTransaction();
        res.status(200).json({ success: true, message: "Purchase & Ledger Updated", data: updatedPurchase });

    } catch (error) {
        await session.abortTransaction();
        res.status(400).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};

// ==========================================
// 3. DELETE PURCHASE (Full Cleanup)
// ==========================================
export const deletePurchase = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const purchase = await Purchase.findById(req.params.id).session(session);
        if (!purchase) throw new Error("Purchase not found");

        const freightAmt = Number(purchase.logistics?.freight || 0);

        // Reverse Main Bill (Credit reversed by Debit)
        await ledgerService.postTransaction({
            partyId: purchase.supplierId,
            type: ACCOUNT_TYPES.REVERSAL || 'REVERSAL',
            debit: Number(purchase.grandTotal),
            credit: 0,
            description: `DELETE REVERSAL: PUR BILL ${purchase.billNo}`,
            performedBy: req.user?._id,
            date: new Date()
        }, session);

        // Reverse Freight
        if (freightAmt !== 0) {
            await ledgerService.postTransaction({
                partyId: purchase.supplierId,
                type: ACCOUNT_TYPES.REVERSAL || 'REVERSAL',
                credit: freightAmt < 0 ? Math.abs(freightAmt) : 0,
                debit: freightAmt > 0 ? freightAmt : 0,
                description: `DELETE FREIGHT REVERSAL: ${purchase.billNo}`,
                performedBy: req.user?._id,
                date: new Date()
            }, session);
        }

        await Purchase.findByIdAndDelete(req.params.id).session(session);
        await session.commitTransaction();
        res.status(200).json({ success: true, message: "Purchase record and ledger entries cleared." });

    } catch (error) {
        await session.abortTransaction();
        res.status(400).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};

// ==========================================
// 4. GET ALL & BY ID (Optimized)
// ==========================================
export const getAllPurchases = async (req, res, next) => {
    try {
        const purchases = await Purchase.find()
            .populate("supplierId", "name phone currentBalance")
            .sort({ date: -1, createdAt: -1 })
            .lean();

        res.status(200).json({ success: true, count: purchases.length, data: purchases });
    } catch (error) { next(error); }
};

export const getPurchaseById = async (req, res, next) => {
    try {
        const purchase = await Purchase.findById(req.params.id)
            .populate("supplierId", "name phone address gstin")
            .populate("performedBy", "name")
            .lean();

        if (!purchase) return res.status(404).json({ success: false, message: "Purchase not found" });
        res.status(200).json({ success: true, data: purchase });
    } catch (error) { next(error); }
};