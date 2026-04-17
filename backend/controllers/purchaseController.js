import Purchase from "../models/Purchase.js";
import ledgerService from "../services/ledgerService.js";
import logService from "../services/logService.js";
import { ACCOUNT_TYPES } from "../utils/constants.js";
import mongoose from "mongoose";

// ==========================================
// HELPER: Freight Entry Logic (PURCHASE SPECIFIC)
// ==========================================
const getFreightEntry = (freightAmt) => {
    const amt = Math.abs(Number(freightAmt || 0));

    if (freightAmt > 0) {
        // ➜ Purchase mein freight add hua matlab humein supplier ko zyada dena hai (Credit)
        return { debit: 0, credit: amt, label: "FREIGHT CHARGES ADDED (CR)" };
    } else {
        // ➜ Negative freight matlab humne freight khud bhara ya discount mila (Debit)
        return { debit: amt, credit: 0, label: "FREIGHT PAID BY US (DR)" };
    }
};

// ==========================================
// 1. CREATE PURCHASE
// ==========================================
export const createPurchase = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { partyId, billNo, paymentMode, grandTotal, logistics, date, goods } = req.body;

        if (!partyId || !billNo) {
            throw new Error("Party ID and Bill Number are required");
        }

        const freightAmt = Number(logistics?.freight || 0);

        // Calculate subtotal from goods taxableAmount or fallback to grandTotal
        const subTotal =
            goods?.reduce((acc, item) => acc + (Number(item.taxableAmount) || 0), 0) ||
            Number(grandTotal);

        const txnDate = date ? new Date(date) : new Date();

        const purchase = new Purchase({
            ...req.body,
            subTotal,
            performedBy: req.user?._id,
        });

        const savedPurchase = await purchase.save({ session });

        // ✅ GOODS VALUE ENTRY (Purchase is a Credit entry for Suppliers)
        await ledgerService.postTransaction({
            partyId,
            type: ACCOUNT_TYPES.PURCHASE || "PURCHASE",
            debit: 0,
            credit: subTotal,
            description: `PURCHASE GOODS VALUE - BILL: ${billNo}`,
            referenceId: savedPurchase._id,
            paymentMode: paymentMode || "CREDIT",
            performedBy: req.user?._id,
            date: txnDate,
            goods: goods || [] // Passing goods for product-wise ledger sync
        }, session);

        // ✅ FREIGHT ENTRY
        if (freightAmt !== 0) {
            const { debit, credit, label } = getFreightEntry(freightAmt);

            await ledgerService.postTransaction({
                partyId,
                type: "ADJUSTMENT",
                debit,
                credit,
                description: `${label} - BILL: ${billNo}`,
                referenceId: savedPurchase._id,
                paymentMode: "ADJUSTMENT",
                performedBy: req.user?._id,
                date: txnDate,
            }, session);
        }

        await logService.createLog({
            performedBy: req.user?._id,
            action: "CREATE",
            module: "PURCHASE",
            documentId: savedPurchase._id,
            newValue: savedPurchase,
            remark: `Purchase created - Bill ${billNo}`,
            req,
        });

        await session.commitTransaction();

        res.status(201).json({
            success: true,
            message: "Purchase created & ledger synced",
            data: savedPurchase,
        });

    } catch (error) {
        await session.abortTransaction();
        res.status(400).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};

// ==========================================
// 2. UPDATE PURCHASE
// ==========================================
export const updatePurchase = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const purchaseId = req.params.id;
        const { partyId, billNo, grandTotal, logistics, date, paymentMode, goods } = req.body;

        const oldPurchase = await Purchase.findById(purchaseId).lean();
        if (!oldPurchase) throw new Error("Purchase record not found");

        // ❌ Delete old ledger entries linked to this purchase
        await ledgerService.deleteByReference(purchaseId, session);

        const subTotal =
            goods?.reduce((acc, item) => acc + (Number(item.taxableAmount) || 0), 0) ||
            Number(grandTotal);

        const updatedPurchase = await Purchase.findByIdAndUpdate(
            purchaseId,
            { ...req.body, subTotal, performedBy: req.user?._id },
            { new: true, session, runValidators: true }
        );

        const freightAmt = Number(logistics?.freight || 0);
        const txnDate = date ? new Date(date) : new Date();

        // ✅ RE-ENTRY: GOODS VALUE
        await ledgerService.postTransaction({
            partyId,
            type: ACCOUNT_TYPES.PURCHASE || "PURCHASE",
            debit: 0,
            credit: subTotal,
            description: `UPDATED PURCHASE GOODS - BILL: ${billNo}`,
            referenceId: updatedPurchase._id,
            paymentMode: paymentMode || "CREDIT",
            performedBy: req.user?._id,
            date: txnDate,
            goods: goods || []
        }, session);

        // ✅ RE-ENTRY: FREIGHT
        if (freightAmt !== 0) {
            const { debit, credit, label } = getFreightEntry(freightAmt);

            await ledgerService.postTransaction({
                partyId,
                type: "ADJUSTMENT",
                debit,
                credit,
                description: `${label} - BILL: ${billNo}`,
                referenceId: updatedPurchase._id,
                paymentMode: "ADJUSTMENT",
                performedBy: req.user?._id,
                date: txnDate,
            }, session);
        }

        await logService.createLog({
            performedBy: req.user?._id,
            action: "UPDATE",
            module: "PURCHASE",
            documentId: updatedPurchase._id,
            oldValue: oldPurchase,
            newValue: updatedPurchase,
            remark: `Purchase updated - Bill ${billNo}`,
            req,
        });

        await session.commitTransaction();

        res.status(200).json({
            success: true,
            message: "Purchase updated successfully",
            data: updatedPurchase,
        });

    } catch (error) {
        await session.abortTransaction();
        res.status(400).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};

// ==========================================
// 3. DELETE PURCHASE
// ==========================================
export const deletePurchase = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const purchaseId = req.params.id;

        const purchase = await Purchase.findById(purchaseId).lean();
        if (!purchase) throw new Error("Purchase record not found");

        await ledgerService.deleteByReference(purchaseId, session);
        await Purchase.findByIdAndDelete(purchaseId).session(session);

        await logService.logDeletion(
            req.user?._id,
            "PURCHASE",
            purchaseId,
            purchase,
            req
        );

        await session.commitTransaction();

        res.status(200).json({
            success: true,
            message: "Purchase deleted successfully",
        });

    } catch (error) {
        await session.abortTransaction();
        res.status(400).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};

// ==========================================
// 4. GET ALL PURCHASES (SORTED BY DATE)
// ==========================================
export const getAllPurchases = async (req, res, next) => {
    try {
        const purchases = await Purchase.find()
            .populate("partyId", "name phone currentBalance")
            .sort({ date: -1, createdAt: -1 })
            .lean();

        res.status(200).json({
            success: true,
            count: purchases.length,
            data: purchases,
        });
    } catch (error) {
        next(error);
    }
};

// ==========================================
// 5. GET SINGLE PURCHASE BY ID
// ==========================================
export const getPurchaseById = async (req, res, next) => {
    try {
        const purchase = await Purchase.findById(req.params.id)
            .populate("partyId", "name phone address gstin currentBalance")
            .populate("performedBy", "name")
            .lean();

        if (!purchase) {
            return res.status(404).json({
                success: false,
                message: "Purchase not found",
            });
        }

        res.status(200).json({
            success: true,
            data: purchase,
        });
    } catch (error) {
        next(error);  
    }
};