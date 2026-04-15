import Purchase from "../models/Purchase.js";
import ledgerService from "../services/ledgerService.js";
import { ACCOUNT_TYPES } from "../utils/constants.js";
import mongoose from "mongoose";

/**
 * FINAL PRODUCTION PURCHASE CONTROLLER
 * ✔ Ledger Safe
 * ✔ Freight Always Tracked
 * ✔ Full Reversal System
 * ✔ Session Safe
 */

// ✅ CREATE PURCHASE
export const createPurchase = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const {
            supplierId,
            billNo,
            grandTotal,
            paymentMode,
            logistics,
            purchaseDate,
            date
        } = req.body;

        const freight = Number(logistics?.freight || 0);
        const txnDate = purchaseDate || date || new Date();

        // 🟢 SAVE PURCHASE
        const purchase = new Purchase({
            ...req.body,
            performedBy: req.user._id
        });

        const savedPurchase = await purchase.save({ session });

        // 🟢 MAIN BILL ENTRY (CREDIT SUPPLIER)
        await ledgerService.postTransaction({
            partyId: supplierId,
            type: ACCOUNT_TYPES.PURCHASE,
            debit: 0,
            credit: Number(grandTotal),
            description: `PURCHASE BILL NO: ${billNo}`.toUpperCase(),
            referenceId: savedPurchase._id,
            paymentMode: paymentMode || "CASH",
            performedBy: req.user._id,
            date: txnDate
        }, session);

        // 🟢 FREIGHT ENTRY (ALWAYS)
        let debitVal = 0;
        let creditVal = 0;
        let desc = "";

        if (freight > 0) {
            creditVal = freight;
            desc = `FREIGHT CHARGES ADDED (CR) - BILL: ${billNo}`;
        } else if (freight < 0) {
            debitVal = Math.abs(freight);
            desc = `FREIGHT DISCOUNT/PAID (DR) - BILL: ${billNo}`;
        } else {
            desc = `FREIGHT: SELF - BILL: ${billNo}`;
        }

        await ledgerService.postTransaction({
            partyId: supplierId,
            type: ACCOUNT_TYPES.ADJUSTMENT,
            debit: debitVal,
            credit: creditVal,
            description: desc.toUpperCase(),
            referenceId: savedPurchase._id,
            paymentMode: "ADJUSTMENT",
            performedBy: req.user._id,
            date: txnDate
        }, session);

        await session.commitTransaction();

        res.status(201).json({
            success: true,
            message: "Purchase Created + Ledger Updated",
            data: savedPurchase
        });

    } catch (error) {
        await session.abortTransaction();
        next(error);
    } finally {
        session.endSession();
    }
};



// ✅ UPDATE PURCHASE (REVERSAL + RE-APPLY)
export const updatePurchase = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const purchaseId = req.params.id;

        const oldPurchase = await Purchase.findById(purchaseId).session(session);
        if (!oldPurchase) {
            return res.status(404).json({ success: false, message: "Purchase not found" });
        }

        const {
            supplierId,
            billNo,
            grandTotal,
            paymentMode,
            logistics,
            purchaseDate,
            date
        } = req.body;

        const oldFreight = Number(oldPurchase.logistics?.freight || 0);
        const newFreight = Number(logistics?.freight || 0);
        const txnDate = purchaseDate || date || new Date();

        // 🔴 REVERSE OLD BILL
        await ledgerService.postTransaction({
            partyId: oldPurchase.supplierId,
            type: ACCOUNT_TYPES.REVERSAL,
            debit: Number(oldPurchase.grandTotal),
            credit: 0,
            description: `REVERSAL PURCHASE BILL: ${oldPurchase.billNo}`.toUpperCase(),
            referenceId: oldPurchase._id,
            performedBy: req.user._id,
            date: txnDate
        }, session);

        // 🔴 REVERSE OLD FREIGHT (ALWAYS)
        await ledgerService.postTransaction({
            partyId: oldPurchase.supplierId,
            type: ACCOUNT_TYPES.REVERSAL,
            debit: oldFreight > 0 ? oldFreight : 0,
            credit: oldFreight < 0 ? Math.abs(oldFreight) : 0,
            description: `REVERSAL FREIGHT: ${oldPurchase.billNo}`.toUpperCase(),
            referenceId: oldPurchase._id,
            performedBy: req.user._id,
            date: txnDate
        }, session);

        // 🟢 UPDATE PURCHASE
        const updatedPurchase = await Purchase.findByIdAndUpdate(
            purchaseId,
            { ...req.body, performedBy: req.user._id },
            { new: true, session, runValidators: true }
        );

        // 🟢 NEW BILL ENTRY
        await ledgerService.postTransaction({
            partyId: supplierId,
            type: ACCOUNT_TYPES.PURCHASE,
            debit: 0,
            credit: Number(grandTotal),
            description: `UPDATED PURCHASE BILL: ${billNo}`.toUpperCase(),
            referenceId: updatedPurchase._id,
            paymentMode: paymentMode || "CASH",
            performedBy: req.user._id,
            date: txnDate
        }, session);

        // 🟢 NEW FREIGHT ENTRY (ALWAYS)
        await ledgerService.postTransaction({
            partyId: supplierId,
            type: ACCOUNT_TYPES.ADJUSTMENT,
            debit: newFreight < 0 ? Math.abs(newFreight) : 0,
            credit: newFreight > 0 ? newFreight : 0,
            description: (newFreight === 0
                ? `FREIGHT: SELF`
                : newFreight > 0
                    ? `FREIGHT CHARGES ADDED (CR)`
                    : `FREIGHT DISCOUNT/PAID (DR)`
            ).toUpperCase(),
            referenceId: updatedPurchase._id,
            paymentMode: "ADJUSTMENT",
            performedBy: req.user._id,
            date: txnDate
        }, session);

        await session.commitTransaction();

        res.status(200).json({
            success: true,
            message: "Purchase Updated Successfully",
            data: updatedPurchase
        });

    } catch (error) {
        await session.abortTransaction();
        next(error);
    } finally {
        session.endSession();
    }
};



// ✅ DELETE PURCHASE (FULL REVERSAL)
export const deletePurchase = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const purchase = await Purchase.findById(req.params.id).session(session);

        if (!purchase) {
            return res.status(404).json({ success: false, message: "Purchase not found" });
        }

        const freight = Number(purchase.logistics?.freight || 0);
        const txnDate = new Date();

        // 🔴 REVERSE BILL
        await ledgerService.postTransaction({
            partyId: purchase.supplierId,
            type: ACCOUNT_TYPES.REVERSAL,
            debit: Number(purchase.grandTotal),
            credit: 0,
            description: `DELETE PURCHASE: ${purchase.billNo}`.toUpperCase(),
            referenceId: purchase._id,
            performedBy: req.user._id,
            date: txnDate
        }, session);

        // 🔴 REVERSE FREIGHT (ALWAYS)
        await ledgerService.postTransaction({
            partyId: purchase.supplierId,
            type: ACCOUNT_TYPES.REVERSAL,
            debit: freight > 0 ? freight : 0,
            credit: freight < 0 ? Math.abs(freight) : 0,
            description: `DELETE FREIGHT: ${purchase.billNo}`.toUpperCase(),
            referenceId: purchase._id,
            performedBy: req.user._id,
            date: txnDate
        }, session);

        await Purchase.findByIdAndDelete(req.params.id).session(session);

        await session.commitTransaction();

        res.status(200).json({
            success: true,
            message: "Purchase Deleted & Ledger Reversed"
        });

    } catch (error) {
        await session.abortTransaction();
        next(error);
    } finally {
        session.endSession();
    }
};



// ✅ GET ALL PURCHASES
export const getAllPurchases = async (req, res, next) => {
    try {
        const purchases = await Purchase.find()
            .populate("supplierId", "name phone")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: purchases.length,
            data: purchases
        });

    } catch (error) {
        next(error);
    }
};


// ✅ GET PURCHASE BY ID
export const getPurchaseById = async (req, res, next) => {
    try {
        const purchase = await Purchase.findById(req.params.id)
            .populate("supplierId", "name phone address");

        if (!purchase) {
            return res.status(404).json({
                success: false,
                message: "Purchase not found"
            });
        }

        res.status(200).json({
            success: true,
            data: purchase
        });

    } catch (error) {
        next(error);
    }
};