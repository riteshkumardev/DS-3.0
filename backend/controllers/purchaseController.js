// purchaseController.js
import Purchase from "../models/Purchase.js";
import inventoryService from "../services/inventoryService.js";
import ledgerService from "../services/ledgerService.js";
import { ACCOUNT_TYPES, STOCK_TRANSACTION_TYPES } from "../utils/constants.js";
import mongoose from "mongoose";

/**
 * Professional Purchase Controller - Dharashakti Agro Products ERP
 */

// 1. CREATE PURCHASE (Atomic Transaction)
export const createPurchase = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Frontend payload ke hisaab se destructuring
        const { supplierId, goods, billNo, date, grandTotal, paymentMode } = req.body;

        // A. Save Purchase Record
        const purchase = new Purchase({
            ...req.body,
            performedBy: req.user._id
        });
        
        const savedPurchase = await purchase.save({ session });

        // B. Update Inventory (INWARD) for each product
        for (const item of goods) {
            await inventoryService.updateStock({
                productId: item.productId,
                productName: item.productName,
                quantity: item.quantity,
                rate: item.rate, 
                type: STOCK_TRANSACTION_TYPES.INWARD,
                referenceId: savedPurchase._id, // ✅ FIXED: savedSale ki jagah savedPurchase
                performedBy: req.user._id,
                remarks: `PURCHASE BILL: ${billNo}`
            }, session);
        }

        // C. Update Ledger (Supplier Account)
        // Purchase increases payable (Credit entry for Party)
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
            message: "Purchase recorded successfully!", 
            data: savedPurchase 
        });

    } catch (error) {
        await session.abortTransaction();
        console.error("Purchase Error:", error.message);
        res.status(400).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};

// 2. GET ALL PURCHASES (With Advanced Filtering)
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

        res.status(200).json({ 
            success: true, 
            count: purchases.length, 
            data: purchases 
        });
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
            
        if (!purchase) return res.status(404).json({ success: false, message: "Purchase not found" });
        
        res.status(200).json({ success: true, data: purchase });
    } catch (error) {
        next(error);
    }
};

// 4. DELETE PURCHASE (With Stock & Ledger Reversal)
export const deletePurchase = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const purchase = await Purchase.findById(req.params.id);
        if (!purchase) throw new Error("Purchase record not found");

        // A. Reverse Stock (Maal wapas kam karein - OUTWARD)
        for (const item of purchase.goods) {
            await inventoryService.updateStock({
                productId: item.productId,
                quantity: item.quantity,
                type: STOCK_TRANSACTION_TYPES.OUTWARD,
                remarks: `REVERSED FROM DELETED PURCHASE BILL: ${purchase.billNo}`,
                performedBy: req.user._id
            }, session);
        }

        // B. Reverse Ledger (Debit the supplier account to clear the credit)
        await ledgerService.postTransaction({
            partyId: purchase.supplierId,
            type: ACCOUNT_TYPES.REVERSAL,
            debit: purchase.grandTotal,
            description: `DELETED PURCHASE BILL: ${purchase.billNo}`.toUpperCase(),
            performedBy: req.user._id
        }, session);

        await Purchase.findByIdAndDelete(req.params.id).session(session);

        await session.commitTransaction();
        res.status(200).json({ success: true, message: "Purchase deleted and Reversal successful" });

    } catch (error) {
        await session.abortTransaction();
        next(error);
    } finally {
        session.endSession();
    }
};