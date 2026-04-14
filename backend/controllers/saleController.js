// saleController.js
import Sale from "../models/Sale.js";
import ledgerService from "../services/ledgerService.js";
import inventoryService from "../services/inventoryService.js";
import { ACCOUNT_TYPES, STOCK_TRANSACTION_TYPES } from "../utils/constants.js";
import mongoose from "mongoose";

/**
 * Professional Sale Controller (Full CRUD with Advanced Filters)
 * Dharashakti Agro Products ERP
 */

// 1. CREATE SALE (Atomic Transaction)
export const createSale = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { partyId, goods, billNo, paymentMode, grandTotal } = req.body;

        // A. Sale Record Save Karein
        const sale = new Sale({
            ...req.body,
            performedBy: req.user._id
        });
        const savedSale = await sale.save({ session });

        // B. Stock Deduction (Inventory Sync)
        for (const item of goods) {
            await inventoryService.updateStock({
                productId: item.productId,
                quantity: item.quantity,
                type: STOCK_TRANSACTION_TYPES.OUTWARD,
                referenceId: savedSale._id,
                performedBy: req.user._id,
                remarks: `SALE BILL NO: ${billNo}`
            }, session);
        }

        // C. Ledger Entry (Party Balance update - Debit)
        await ledgerService.postTransaction({
            partyId: partyId,
            type: ACCOUNT_TYPES.SALE,
            debit: grandTotal,
            description: `SALE BILL NO: ${billNo}`.toUpperCase(),
            referenceId: savedSale._id,
            paymentMode: paymentMode,
            performedBy: req.user._id
        }, session);

        await session.commitTransaction();
        res.status(201).json({ success: true, message: "Sale processed successfully", data: savedSale });

    } catch (error) {
        await session.abortTransaction();
        next(error);
    } finally {
        session.endSession();
    }
};

// 2. GET ALL SALES (With Powerful Filters)
export const getAllSales = async (req, res, next) => {
    try {
        const { startDate, endDate, customerName, billNo, partyId } = req.query;
        let query = {};

        // Filter: Date Range
        if (startDate && endDate) {
            query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }

        // Filter: Search by Customer Name (Partial Search)
        if (customerName) {
            query.customerName = { $regex: customerName, $options: 'i' };
        }

        // Filter: Exact Bill Number
        if (billNo) {
            query.billNo = billNo;
        }

        // Filter: Specific Party
        if (partyId) {
            query.partyId = partyId;
        }

        const sales = await Sale.find(query)
            .sort({ date: -1, createdAt: -1 })
            .populate('partyId', 'name phone currentBalance');

        res.status(200).json({ 
            success: true, 
            count: sales.length, 
            data: sales 
        });
    } catch (error) {
        next(error);
    }
};

// 3. GET SINGLE SALE BY ID
export const getSaleById = async (req, res, next) => {
    try {
        const sale = await Sale.findById(req.params.id).populate('partyId performedBy');
        if (!sale) return res.status(404).json({ success: false, message: "Sale not found" });
        
        res.status(200).json({ success: true, data: sale });
    } catch (error) {
        next(error);
    }
};

// 4. DELETE SALE (Full Reversal Logic)
export const deleteSale = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const sale = await Sale.findById(req.params.id);
        if (!sale) throw new Error("Sale not found");

        // A. Reverse Stock (Maal wapas inventory mein add karein)
        for (const item of sale.goods) {
            await inventoryService.updateStock({
                productId: item.productId,
                quantity: item.quantity,
                type: STOCK_TRANSACTION_TYPES.INWARD,
                remarks: `REVERSED FROM DELETED SALE BILL: ${sale.billNo}`,
                performedBy: req.user._id
            }, session);
        }

        // B. Reverse Ledger (Amount ko Party balance se minus karein - Credit)
        await ledgerService.postTransaction({
            partyId: sale.partyId,
            type: ACCOUNT_TYPES.REVERSAL,
            credit: sale.grandTotal,
            description: `DELETED SALE BILL: ${sale.billNo}`.toUpperCase(),
            performedBy: req.user._id
        }, session);

        // C. Final Deletion
        await Sale.findByIdAndDelete(req.params.id).session(session);

        await session.commitTransaction();
        res.status(200).json({ success: true, message: "Sale deleted and data reversed" });

    } catch (error) {
        await session.abortTransaction();
        next(error);
    } finally {
        session.endSession();
    }
};
// 5. UPDATE SALE (Reversal + Re-apply Logic)
export const updateSale = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const saleId = req.params.id;
        const oldSale = await Sale.findById(saleId).session(session);
        
        if (!oldSale) {
            return res.status(404).json({ success: false, message: "Sale record not found" });
        }

        const { partyId, goods, billNo, paymentMode, grandTotal } = req.body;

        // --- STEP A: REVERSE OLD DATA ---
        
        // 1. Purana Stock wapas add karein (Inventory Reversal)
        for (const item of oldSale.goods) {
            await inventoryService.updateStock({
                productId: item.productId,
                quantity: item.quantity,
                type: STOCK_TRANSACTION_TYPES.INWARD, // Outward ka ulta Inward
                remarks: `STOCK REVERSAL (EDITING BILL: ${oldSale.billNo})`,
                performedBy: req.user._id,
                referenceId: oldSale._id
            }, session);
        }

        // 2. Purana Ledger Entry reverse karein (Credit the party to nullify old Debit)
        await ledgerService.postTransaction({
            partyId: oldSale.partyId,
            type: ACCOUNT_TYPES.REVERSAL,
            credit: oldSale.grandTotal,
            description: `REVERSAL FOR EDIT: BILL NO ${oldSale.billNo}`.toUpperCase(),
            referenceId: oldSale._id,
            performedBy: req.user._id
        }, session);


        // --- STEP B: APPLY NEW DATA ---

        // 3. Sale Document Update Karein
        const updatedSale = await Sale.findByIdAndUpdate(
            saleId,
            { ...req.body, performedBy: req.user._id },
            { new: true, session, runValidators: true }
        );

        // 4. Naya Stock deduct karein (New Inventory Sync)
        for (const item of goods) {
            await inventoryService.updateStock({
                productId: item.productId,
                quantity: item.quantity,
                type: STOCK_TRANSACTION_TYPES.OUTWARD,
                remarks: `UPDATED SALE BILL NO: ${billNo}`,
                performedBy: req.user._id,
                referenceId: updatedSale._id
            }, session);
        }

        // 5. Naya Ledger Entry post karein (New Debit)
        await ledgerService.postTransaction({
            partyId: partyId,
            type: ACCOUNT_TYPES.SALE,
            debit: grandTotal,
            description: `UPDATED SALE BILL NO: ${billNo}`.toUpperCase(),
            referenceId: updatedSale._id,
            paymentMode: paymentMode,
            performedBy: req.user._id
        }, session);

        // Transaction Commit
        await session.commitTransaction();
        res.status(200).json({ 
            success: true, 
            message: "Sale updated and inventory/ledger synced", 
            data: updatedSale 
        });

    } catch (error) {
        await session.abortTransaction();
        next(error);
    } finally {
        session.endSession();
    }
};