// purchaseController.js
import Purchase from "../models/Purchase.js";
import inventoryService from "../services/inventoryService.js";
import ledgerService from "../services/ledgerService.js";
import { ACCOUNT_TYPES, STOCK_TRANSACTION_TYPES } from "../utils/constants.js";
import mongoose from "mongoose";

/**
 * Professional Purchase Controller (Full CRUD with Filters)
 * Dharashakti Agro Products ERP
 */

// 1. CREATE PURCHASE
export const createPurchase = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { supplierId, goods, purchaseBillNo, purchaseDate, grandTotal, paymentMode } = req.body;

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
                quantity: item.quantity,
                rate: item.rate, // Average price calculation ke liye zaruri hai
                type: STOCK_TRANSACTION_TYPES.INWARD,
                referenceId: savedSale._id,
                performedBy: req.user._id,
                remarks: `PURCHASE BILL: ${purchaseBillNo}`
            }, session);
        }

        // C. Update Ledger (Supplier Account)
        // Purchase matlab humein supplier ko paise dene hain (Credit entry for Party)
        await ledgerService.postTransaction({
            partyId: supplierId,
            type: ACCOUNT_TYPES.PURCHASE,
            credit: grandTotal, 
            description: `PURCHASE BILL NO: ${purchaseBillNo}`.toUpperCase(),
            referenceId: savedPurchase._id,
            paymentMode: paymentMode,
            performedBy: req.user._id
        }, session);

        await session.commitTransaction();
        res.status(201).json({ success: true, message: "Purchase recorded, Stock & Ledger updated!", data: savedPurchase });

    } catch (error) {
        await session.abortTransaction();
        next(error);
    } finally {
        session.endSession();
    }
};

// 2. GET ALL PURCHASES (With Advanced Filtering)
export const getAllPurchases = async (req, res, next) => {
    try {
        const { startDate, endDate, supplierName, billNo } = req.query;
        let query = {};

        // Date Range Filter
        if (startDate && endDate) {
            query.purchaseDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }

        // Search by Supplier Name
        if (supplierName) {
            query.supplierName = { $regex: supplierName, $options: 'i' };
        }

        // Search by Bill Number
        if (billNo) {
            query.purchaseBillNo = billNo;
        }

        const purchases = await Purchase.find(query)
            .sort({ purchaseDate: -1 })
            .populate('supplierId', 'name phone');

        res.status(200).json({ 
            success: true, 
            count: purchases.length, 
            data: purchases 
        });
    } catch (error) {
        next(error);
    }
};

// 3. UPDATE PURCHASE
export const updatePurchase = async (req, res, next) => {
    // Note: Professional ERP mein Purchase update karne ke liye 
    // pehle purana stock/ledger reverse karna hota hai.
    // Recommended: Purana delete karke naya banayein ya status 'Cancelled' karein.
    try {
        const updatedPurchase = await Purchase.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json({ success: true, data: updatedPurchase });
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

        // Reverse Stock (Maal wapas kam karein kyunki entry delete ho rahi hai)
        for (const item of purchase.goods) {
            await inventoryService.updateStock({
                productId: item.productId,
                quantity: item.quantity,
                type: STOCK_TRANSACTION_TYPES.OUTWARD,
                remarks: `REVERSED FROM DELETED PURCHASE BILL: ${purchase.purchaseBillNo}`,
                performedBy: req.user._id
            }, session);
        }

        // Reverse Ledger (Debit the supplier account to clear the credit)
        await ledgerService.postTransaction({
            partyId: purchase.supplierId,
            type: ACCOUNT_TYPES.REVERSAL,
            debit: purchase.grandTotal,
            description: `DELETED PURCHASE BILL: ${purchase.purchaseBillNo}`.toUpperCase(),
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