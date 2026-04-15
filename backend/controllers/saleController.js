import Sale from "../models/Sale.js";
import ledgerService from "../services/ledgerService.js";
import { ACCOUNT_TYPES } from "../utils/constants.js";
import mongoose from "mongoose";

/**
 * Professional Sale Controller (With Freight Adjustment Logic)
 * Dharashakti Agro Products ERP
 */

// 1. CREATE SALE (Atomic Transaction with Freight Adjustment)
export const createSale = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { partyId, billNo, paymentMode, grandTotal, logistics } = req.body;
        const freightValue = Number(logistics?.freight || 0);

        // A. Sale Record Save Karein
        const sale = new Sale({
            ...req.body,
            performedBy: req.user._id
        });
        const savedSale = await sale.save({ session });

        // B. Ledger Entry (Main Bill Amount - Debit)
        await ledgerService.postTransaction({
            partyId: partyId,
            type: ACCOUNT_TYPES.SALE,
            debit: grandTotal,
            credit: 0,
            description: `SALE BILL NO: ${billNo}`.toUpperCase(),
            referenceId: savedSale._id,
            paymentMode: paymentMode,
            performedBy: req.user._id
        }, session);

        // C. Freight Adjustment Logic (New Update)
        if (freightValue !== 0) {
            await ledgerService.postTransaction({
                partyId: partyId,
                type: ACCOUNT_TYPES.ADJUSTMENT,
                // Agar freight negative hai toh Credit, positive hai toh Debit
                debit: freightValue > 0 ? freightValue : 0,
                credit: freightValue < 0 ? Math.abs(freightValue) : 0,
                description: freightValue < 0 
                    ? `FREIGHT PAID BY PARTY (CR) - BILL: ${billNo}`.toUpperCase()
                    : `FREIGHT CHARGES (DR) - BILL: ${billNo}`.toUpperCase(),
                referenceId: savedSale._id,
                paymentMode: "ADJUSTMENT",
                performedBy: req.user._id
            }, session);
        }

        await session.commitTransaction();
        res.status(201).json({ 
            success: true, 
            message: "Sale processed and Ledger updated with Freight adjustment!", 
            data: savedSale 
        });

    } catch (error) {
        await session.abortTransaction();
        next(error);
    } finally {
        session.endSession();
    }
};

// 2. UPDATE SALE (Reversal + New Freight Logic)
export const updateSale = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const saleId = req.params.id;
        const oldSale = await Sale.findById(saleId).session(session);
        
        if (!oldSale) return res.status(404).json({ success: false, message: "Sale not found" });

        const { partyId, billNo, paymentMode, grandTotal, logistics } = req.body;
        const newFreight = Number(logistics?.freight || 0);
        const oldFreight = Number(oldSale.logistics?.freight || 0);

        // --- STEP A: REVERSE OLD DATA (Bill + Old Freight) ---
        // Reverse Bill
        await ledgerService.postTransaction({
            partyId: oldSale.partyId,
            type: ACCOUNT_TYPES.REVERSAL,
            credit: oldSale.grandTotal, // Reverse Debit with Credit
            description: `REVERSAL: BILL NO ${oldSale.billNo}`.toUpperCase(),
            referenceId: oldSale._id,
            performedBy: req.user._id
        }, session);

        // Reverse Old Freight
        if (oldFreight !== 0) {
            await ledgerService.postTransaction({
                partyId: oldSale.partyId,
                type: ACCOUNT_TYPES.REVERSAL,
                debit: oldFreight < 0 ? Math.abs(oldFreight) : 0,
                credit: oldFreight > 0 ? oldFreight : 0,
                description: `REVERSAL: FREIGHT ADJUSTMENT ${oldSale.billNo}`.toUpperCase(),
                referenceId: oldSale._id,
                performedBy: req.user._id
            }, session);
        }

        // --- STEP B: APPLY NEW DATA ---
        const updatedSale = await Sale.findByIdAndUpdate(
            saleId,
            { ...req.body, performedBy: req.user._id },
            { new: true, session, runValidators: true }
        );

        // New Bill Entry
        await ledgerService.postTransaction({
            partyId: partyId,
            type: ACCOUNT_TYPES.SALE,
            debit: grandTotal,
            description: `UPDATED SALE BILL NO: ${billNo}`.toUpperCase(),
            referenceId: updatedSale._id,
            paymentMode: paymentMode,
            performedBy: req.user._id
        }, session);

        // New Freight Entry
        if (newFreight !== 0) {
            await ledgerService.postTransaction({
                partyId: partyId,
                type: ACCOUNT_TYPES.ADJUSTMENT,
                debit: newFreight > 0 ? newFreight : 0,
                credit: newFreight < 0 ? Math.abs(newFreight) : 0,
                description: `UPDATED FREIGHT ADJ - BILL: ${billNo}`.toUpperCase(),
                referenceId: updatedSale._id,
                paymentMode: "ADJUSTMENT",
                performedBy: req.user._id
            }, session);
        }

        await session.commitTransaction();
        res.status(200).json({ success: true, message: "Update Success", data: updatedSale });

    } catch (error) {
        await session.abortTransaction();
        next(error);
    } finally {
        session.endSession();
    }
};

// 3. DELETE SALE (Full Reversal including Freight)
export const deleteSale = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const sale = await Sale.findById(req.params.id);
        if (!sale) throw new Error("Sale not found");

        const freight = Number(sale.logistics?.freight || 0);

        // Reverse Bill
        await ledgerService.postTransaction({
            partyId: sale.partyId,
            type: ACCOUNT_TYPES.REVERSAL,
            credit: sale.grandTotal,
            description: `DELETE REVERSAL: ${sale.billNo}`.toUpperCase(),
            performedBy: req.user._id
        }, session);

        // Reverse Freight
        if (freight !== 0) {
            await ledgerService.postTransaction({
                partyId: sale.partyId,
                type: ACCOUNT_TYPES.REVERSAL,
                debit: freight < 0 ? Math.abs(freight) : 0,
                credit: freight > 0 ? freight : 0,
                description: `DELETE FREIGHT REVERSAL: ${sale.billNo}`.toUpperCase(),
                performedBy: req.user._id
            }, session);
        }

        await Sale.findByIdAndDelete(req.params.id).session(session);
        await session.commitTransaction();
        res.status(200).json({ success: true, message: "Sale and Freight deleted" });

    } catch (error) {
        await session.abortTransaction();
        next(error);
    } finally {
        session.endSession();
    }
};

// Baki functions (getAllSales, getSaleById) same rahenge...
export const getAllSales = async (req, res, next) => { /* ... existing code ... */ };
export const getSaleById = async (req, res, next) => { /* ... existing code ... */ };