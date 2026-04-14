// purchaseController.js
import Purchase from "../models/Purchase.js";
import ledgerService from "../services/ledgerService.js"; // Sirf Ledger manage hoga
import { ACCOUNT_TYPES } from "../utils/constants.js";
import mongoose from "mongoose";

/**
 * Professional Purchase Controller - Dharashakti Agro Products ERP
 * (Inventory-Free Version: Manual Inventory Management)
 */

// 1. CREATE PURCHASE
export const createPurchase = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { supplierId, billNo, grandTotal, paymentMode } = req.body;

        // A. Save Purchase Record (Strictly Billing)
        const purchase = new Purchase({
            ...req.body,
            performedBy: req.user._id
        });
        
        const savedPurchase = await purchase.save({ session });

        // B. Update Ledger (Credit the Supplier)
        // Purchase matlab udhari badh rahi hai -> Supplier Ledger Credit
        await ledgerService.postTransaction({
            partyId: supplierId,
            type: ACCOUNT_TYPES.PURCHASE,
            credit: grandTotal, 
            description: `PURCHASE BILL NO: ${billNo}`.toUpperCase(),
            referenceId: savedPurchase._id,
            paymentMode: paymentMode || "CASH",
            performedBy: req.user._id
        }, session);

        await session.commitTransaction();
        res.status(201).json({ 
            success: true, 
            message: "Purchase recorded and Ledger updated!", 
            data: savedPurchase 
        });

    } catch (error) {
        await session.abortTransaction();
        res.status(400).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};

// 2. GET ALL PURCHASES
export const getAllPurchases = async (req, res, next) => {
    try {
        const { startDate, endDate, supplierName, billNo } = req.query;
        let query = {};

        if (startDate && endDate) {
            query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }
        if (supplierName) {
            query.supplierName = { $regex: supplierName, $options: 'i' };
        }
        if (billNo) {
            query.billNo = billNo;
        }

        const purchases = await Purchase.find(query)
            .sort({ date: -1, createdAt: -1 })
            .populate('supplierId', 'name phone currentBalance');

        res.status(200).json({ success: true, count: purchases.length, data: purchases });
    } catch (error) {
        next(error);
    }
};

// 3. GET SINGLE PURCHASE BY ID
export const getPurchaseById = async (req, res, next) => {
    try {
        const purchase = await Purchase.findById(req.params.id)
            .populate('supplierId')
            .populate('performedBy', 'name');
            
        if (!purchase) return res.status(404).json({ success: false, message: "Purchase record not found" });
        res.status(200).json({ success: true, data: purchase });
    } catch (error) {
        next(error);
    }
};

// 4. UPDATE PURCHASE (Ledger Reversal + Re-apply)
export const updatePurchase = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const purchaseId = req.params.id;
        const oldPurchase = await Purchase.findById(purchaseId).session(session);
        
        if (!oldPurchase) {
            return res.status(404).json({ success: false, message: "Purchase record not found" });
        }

        const { supplierId, billNo, grandTotal, paymentMode } = req.body;

        // --- STEP A: REVERSE OLD LEDGER ENTRY ---
        // Pehle purani amount ko Debit karke Supplier ka balance neutral karein
        await ledgerService.postTransaction({
            partyId: oldPurchase.supplierId,
            type: ACCOUNT_TYPES.REVERSAL,
            debit: oldPurchase.grandTotal,
            description: `REVERSAL FOR EDIT: PURCHASE BILL ${oldPurchase.billNo}`.toUpperCase(),
            referenceId: oldPurchase._id,
            performedBy: req.user._id
        }, session);


        // --- STEP B: APPLY NEW DATA ---

        // 1. Purchase Document Update
        const updatedPurchase = await Purchase.findByIdAndUpdate(
            purchaseId,
            { ...req.body, performedBy: req.user._id },
            { new: true, session, runValidators: true }
        );

        // 2. Naya Ledger Entry (New Credit)
        await ledgerService.postTransaction({
            partyId: supplierId,
            type: ACCOUNT_TYPES.PURCHASE,
            credit: grandTotal,
            description: `UPDATED PURCHASE BILL NO: ${billNo}`.toUpperCase(),
            referenceId: updatedPurchase._id,
            paymentMode: paymentMode || "CASH",
            performedBy: req.user._id
        }, session);

        await session.commitTransaction();
        res.status(200).json({ success: true, message: "Purchase updated and Ledger synced!", data: updatedPurchase });

    } catch (error) {
        await session.abortTransaction();
        res.status(400).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};

// 5. DELETE PURCHASE (With Ledger Reversal Only)
export const deletePurchase = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const purchase = await Purchase.findById(req.params.id);
        if (!purchase) throw new Error("Purchase record not found");

        // Reverse Ledger (Debit the supplier to clear the credit)
        await ledgerService.postTransaction({
            partyId: purchase.supplierId,
            type: ACCOUNT_TYPES.REVERSAL,
            debit: purchase.grandTotal,
            description: `DELETED PURCHASE BILL: ${purchase.billNo}`.toUpperCase(),
            performedBy: req.user._id
        }, session);

        await Purchase.findByIdAndDelete(req.params.id).session(session);

        await session.commitTransaction();
        res.status(200).json({ success: true, message: "Purchase deleted and Ledger adjusted" });

    } catch (error) {
        await session.abortTransaction();
        next(error);
    } finally {
        session.endSession();
    }
};