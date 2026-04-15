import Purchase from "../models/Purchase.js";
import ledgerService from "../services/ledgerService.js";
import { ACCOUNT_TYPES } from "../utils/constants.js";
import mongoose from "mongoose";

/**
 * Professional Purchase Controller - Dharashakti Agro Products ERP
 * Includes Freight Adjustment Logic for Supplier Ledger
 */

// 1. CREATE PURCHASE
export const createPurchase = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { supplierId, billNo, grandTotal, paymentMode, logistics, date, purchaseDate } = req.body;
        const freightValue = Number(logistics?.freight || 0);
        const txnDate = purchaseDate || date || new Date();

        // A. Save Purchase Record
        const purchase = new Purchase({
            ...req.body,
            performedBy: req.user._id
        });
        const savedPurchase = await purchase.save({ session });

        // B. Ledger Entry (Main Bill - Credit the Supplier)
        await ledgerService.postTransaction({
            partyId: supplierId,
            type: ACCOUNT_TYPES.PURCHASE,
            credit: grandTotal, 
            debit: 0,
            description: `PURCHASE BILL NO: ${billNo}`.toUpperCase(),
            referenceId: savedPurchase._id,
            paymentMode: paymentMode || "CASH",
            performedBy: req.user._id,
            date: txnDate
        }, session);

        // C. Freight Adjustment Logic
        if (freightValue !== 0) {
            await ledgerService.postTransaction({
                partyId: supplierId,
                type: ACCOUNT_TYPES.ADJUSTMENT,
                // Freight +ve means we owe more (Credit), -ve means we owe less (Debit)
                credit: freightValue > 0 ? freightValue : 0,
                debit: freightValue < 0 ? Math.abs(freightValue) : 0,
                description: freightValue < 0 
                    ? `FREIGHT DISCOUNT/PAID (DR) - PUR BILL: ${billNo}`.toUpperCase()
                    : `FREIGHT CHARGES ADDED (CR) - PUR BILL: ${billNo}`.toUpperCase(),
                referenceId: savedPurchase._id,
                paymentMode: "ADJUSTMENT",
                performedBy: req.user._id,
                date: txnDate
            }, session);
        }

        await session.commitTransaction();
        res.status(201).json({ 
            success: true, 
            message: "Purchase processed and Ledger updated with Freight!", 
            data: savedPurchase 
        });

    } catch (error) {
        await session.abortTransaction();
        next(error);
    } finally {
        session.endSession();
    }
};

// 2. UPDATE PURCHASE (Reversal + Re-apply Freight Logic)
export const updatePurchase = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const purchaseId = req.params.id;
        const oldPurchase = await Purchase.findById(purchaseId).session(session);
        
        if (!oldPurchase) return res.status(404).json({ success: false, message: "Purchase not found" });

        const { supplierId, billNo, grandTotal, paymentMode, logistics, purchaseDate } = req.body;
        const newFreight = Number(logistics?.freight || 0);
        const oldFreight = Number(oldPurchase.logistics?.freight || 0);
        const txnDate = purchaseDate || new Date();

        // --- STEP A: REVERSE OLD LEDGER ENTRIES ---
        // Reverse Main Bill (Credit reversed by Debit)
        await ledgerService.postTransaction({
            partyId: oldPurchase.supplierId,
            type: ACCOUNT_TYPES.REVERSAL,
            debit: oldPurchase.grandTotal,
            description: `REVERSAL: PUR BILL ${oldPurchase.billNo}`.toUpperCase(),
            referenceId: oldPurchase._id,
            performedBy: req.user._id
        }, session);

        // Reverse Old Freight Adjustment
        if (oldFreight !== 0) {
            await ledgerService.postTransaction({
                partyId: oldPurchase.supplierId,
                type: ACCOUNT_TYPES.REVERSAL,
                credit: oldFreight < 0 ? Math.abs(oldFreight) : 0,
                debit: oldFreight > 0 ? oldFreight : 0,
                description: `REVERSAL: FREIGHT ADJ ${oldPurchase.billNo}`.toUpperCase(),
                referenceId: oldPurchase._id,
                performedBy: req.user._id
            }, session);
        }

        // --- STEP B: APPLY NEW DATA ---
        const updatedPurchase = await Purchase.findByIdAndUpdate(
            purchaseId,
            { ...req.body, performedBy: req.user._id },
            { new: true, session, runValidators: true }
        );

        // New Bill Entry
        await ledgerService.postTransaction({
            partyId: supplierId,
            type: ACCOUNT_TYPES.PURCHASE,
            credit: grandTotal,
            description: `UPDATED PUR BILL NO: ${billNo}`.toUpperCase(),
            referenceId: updatedPurchase._id,
            paymentMode: paymentMode || "CASH",
            performedBy: req.user._id,
            date: txnDate
        }, session);

        // New Freight Entry
        if (newFreight !== 0) {
            await ledgerService.postTransaction({
                partyId: supplierId,
                type: ACCOUNT_TYPES.ADJUSTMENT,
                credit: newFreight > 0 ? newFreight : 0,
                debit: newFreight < 0 ? Math.abs(newFreight) : 0,
                description: `UPDATED FREIGHT ADJ - PUR BILL: ${billNo}`.toUpperCase(),
                referenceId: updatedPurchase._id,
                paymentMode: "ADJUSTMENT",
                performedBy: req.user._id,
                date: txnDate
            }, session);
        }

        await session.commitTransaction();
        res.status(200).json({ success: true, message: "Purchase Updated", data: updatedPurchase });

    } catch (error) {
        await session.abortTransaction();
        next(error);
    } finally {
        session.endSession();
    }
};

// 3. DELETE PURCHASE (Full Reversal including Freight)
export const deletePurchase = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const purchase = await Purchase.findById(req.params.id);
        if (!purchase) throw new Error("Purchase not found");

        const freight = Number(purchase.logistics?.freight || 0);

        // Reverse Bill
        await ledgerService.postTransaction({
            partyId: purchase.supplierId,
            type: ACCOUNT_TYPES.REVERSAL,
            debit: purchase.grandTotal,
            description: `DELETE REVERSAL: PUR BILL ${purchase.billNo}`.toUpperCase(),
            performedBy: req.user._id
        }, session);

        // Reverse Freight
        if (freight !== 0) {
            await ledgerService.postTransaction({
                partyId: purchase.supplierId,
                type: ACCOUNT_TYPES.REVERSAL,
                credit: freight < 0 ? Math.abs(freight) : 0,
                debit: freight > 0 ? freight : 0,
                description: `DELETE FREIGHT REVERSAL: ${purchase.billNo}`.toUpperCase(),
                performedBy: req.user._id
            }, session);
        }

        await Purchase.findByIdAndDelete(req.params.id).session(session);
        await session.commitTransaction();
        res.status(200).json({ success: true, message: "Purchase Deleted" });

    } catch (error) {
        await session.abortTransaction();
        next(error);
    } finally {
        session.endSession();
    }
};

// GET Functions remain same...
export const getAllPurchases = async (req, res, next) => { /* Same as before */ };
export const getPurchaseById = async (req, res, next) => { /* Same as before */ };