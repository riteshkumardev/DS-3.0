// saleController.js
import Sale from "../models/Sale.js";
import ledgerService from "../services/ledgerService.js";
import { ACCOUNT_TYPES } from "../utils/constants.js";
import mongoose from "mongoose";

/**
 * Professional Sale Controller (Manual Inventory Management)
 * Dharashakti Agro Products ERP
 */

// 1. CREATE SALE (Atomic Transaction)
export const createSale = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { partyId, billNo, paymentMode, grandTotal } = req.body;

        // A. Sale Record Save Karein
        const sale = new Sale({
            ...req.body,
            performedBy: req.user._id
        });
        const savedSale = await sale.save({ session });

        // B. Ledger Entry (Party Balance update - Debit)
        // Sale matlab customer par udhari badh rahi hai -> Party Ledger Debit
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
        res.status(201).json({ 
            success: true, 
            message: "Sale processed and Ledger updated!", 
            data: savedSale 
        });

    } catch (error) {
        await session.abortTransaction();
        next(error);
    } finally {
        session.endSession();
    }
};

// 2. GET ALL SALES (With Filters)
export const getAllSales = async (req, res, next) => {
    try {
        const { startDate, endDate, customerName, billNo, partyId } = req.query;
        let query = {};

        if (startDate && endDate) {
            query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }
        if (customerName) {
            query.customerName = { $regex: customerName, $options: 'i' };
        }
        if (billNo) {
            query.billNo = billNo;
        }
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

// 4. UPDATE SALE (Reversal + Re-apply Logic)
export const updateSale = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const saleId = req.params.id;
        const oldSale = await Sale.findById(saleId).session(session);
        
        if (!oldSale) {
            return res.status(404).json({ success: false, message: "Sale record not found" });
        }

        const { partyId, billNo, paymentMode, grandTotal } = req.body;

        // --- STEP A: REVERSE OLD LEDGER DATA ---
        // Purane bill amount ko Credit karke balance neutral karein
        await ledgerService.postTransaction({
            partyId: oldSale.partyId,
            type: ACCOUNT_TYPES.REVERSAL,
            credit: oldSale.grandTotal,
            description: `REVERSAL FOR EDIT: BILL NO ${oldSale.billNo}`.toUpperCase(),
            referenceId: oldSale._id,
            performedBy: req.user._id
        }, session);


        // --- STEP B: APPLY NEW DATA ---

        // 1. Sale Document Update Karein
        const updatedSale = await Sale.findByIdAndUpdate(
            saleId,
            { ...req.body, performedBy: req.user._id },
            { new: true, session, runValidators: true }
        );

        // 2. Naya Ledger Entry post karein (New Debit)
        await ledgerService.postTransaction({
            partyId: partyId,
            type: ACCOUNT_TYPES.SALE,
            debit: grandTotal,
            description: `UPDATED SALE BILL NO: ${billNo}`.toUpperCase(),
            referenceId: updatedSale._id,
            paymentMode: paymentMode,
            performedBy: req.user._id
        }, session);

        await session.commitTransaction();
        res.status(200).json({ 
            success: true, 
            message: "Sale updated and Ledger synced", 
            data: updatedSale 
        });

    } catch (error) {
        await session.abortTransaction();
        next(error);
    } finally {
        session.endSession();
    }
};

// 5. DELETE SALE (Full Reversal Logic)
export const deleteSale = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const sale = await Sale.findById(req.params.id);
        if (!sale) throw new Error("Sale not found");

        // Reverse Ledger (Amount ko Party balance se minus karein - Credit)
        await ledgerService.postTransaction({
            partyId: sale.partyId,
            type: ACCOUNT_TYPES.REVERSAL,
            credit: sale.grandTotal,
            description: `DELETED SALE BILL: ${sale.billNo}`.toUpperCase(),
            performedBy: req.user._id
        }, session);

        // Final Deletion
        await Sale.findByIdAndDelete(req.params.id).session(session);

        await session.commitTransaction();
        res.status(200).json({ success: true, message: "Sale deleted and Ledger reversed" });

    } catch (error) {
        await session.abortTransaction();
        next(error);
    } finally {
        session.endSession();
    }
};