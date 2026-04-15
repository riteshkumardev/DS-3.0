import Sale from "../models/Sale.js";
import ledgerService from "../services/ledgerService.js";
import { ACCOUNT_TYPES } from "../utils/constants.js";
import mongoose from "mongoose";

/**
 * SMART PRODUCTION SALE CONTROLLER
 * ✔ Clean Ledger Sync (Physical Delete on Edit/Delete)
 * ✔ Correct Debit/Credit Logic for Statements
 * ✔ Decimal Precision Handled
 */

// ==========================================
// 1. CREATE SALE
// ==========================================
export const createSale = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { partyId, billNo, paymentMode, grandTotal, logistics, date, goods } = req.body;

        if (!partyId || !billNo) throw new Error("Party ID and Bill Number are required");

        // Logistics/Freight data
        const freightAmt = Number(logistics?.freight || 0);
        // Goods ki real value (Total minus freight adjustment)
        // Agar freight negative hai (paid by party), toh subTotal grandTotal se zyada hoga
        const subTotal = goods?.reduce((acc, item) => acc + (Number(item.taxableAmount) || 0), 0) || Number(grandTotal);
        const txnDate = date ? new Date(date) : new Date();

        // A. Save Sale Record to Database
        const sale = new Sale({
            ...req.body,
            subTotal: subTotal,
            performedBy: req.user?._id
        });
        const savedSale = await sale.save({ session });

        // B. Main Ledger Entry (Goods Value - Debit the Customer)
        // Table Row 1: SALE GOODS VALUE
        await ledgerService.postTransaction({
            partyId: partyId,
            type: ACCOUNT_TYPES.SALE || 'SALE',
            debit: subTotal,
            credit: 0,
            description: `SALE GOODS VALUE - BILL: ${billNo}`.toUpperCase(),
            referenceId: savedSale._id,
            paymentMode: paymentMode || 'CREDIT',
            performedBy: req.user?._id,
            date: txnDate
        }, session);

        // C. Freight Adjustment Entry (Table Row 2)
        if (freightAmt !== 0) {
            await ledgerService.postTransaction({
                partyId: partyId,
                type: 'ADJUSTMENT',
                // Positive freight: Party has to pay (Debit)
                // Negative freight: Party already paid/Discount (Credit)
                debit: freightAmt > 0 ? freightAmt : 0,
                credit: freightAmt < 0 ? Math.abs(freightAmt) : 0,
                description: (freightAmt > 0 ? `FREIGHT CHARGES ADDED` : `FREIGHT PAID BY PARTY (CR)`).toUpperCase() + ` - BILL: ${billNo}`,
                referenceId: savedSale._id,
                paymentMode: "ADJUSTMENT",
                performedBy: req.user?._id,
                date: txnDate
            }, session);
        }

        await session.commitTransaction();
        res.status(201).json({ success: true, message: "Sale created and ledger successfully synced.", data: savedSale });

    } catch (error) {
        await session.abortTransaction();
        console.error("❌ Sale Creation Error:", error.message);
        res.status(400).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};

// ==========================================
// 3. UPDATE SALE (Physical Ledger Cleanup)
// ==========================================
export const updateSale = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const saleId = req.params.id;
        const { partyId, billNo, grandTotal, logistics, date, paymentMode, goods } = req.body;

        // 1. Purane Ledger Records ko delete karein (No Reversal rows)
        await ledgerService.deleteByReference(saleId, session);

        // 2. Sale Document Update
        const subTotal = goods?.reduce((acc, item) => acc + (Number(item.taxableAmount) || 0), 0) || Number(grandTotal);
        
        const updatedSale = await Sale.findByIdAndUpdate(
            saleId,
            { ...req.body, subTotal, performedBy: req.user?._id },
            { new: true, session, runValidators: true }
        );

        if (!updatedSale) throw new Error("Sale record not found");

        // 3. Fresh Ledger Entries Post karein
        const freightAmt = Number(logistics?.freight || 0);
        const txnDate = date ? new Date(date) : new Date();

        // Fresh Main Bill Entry
        await ledgerService.postTransaction({
            partyId: partyId,
            type: ACCOUNT_TYPES.SALE || 'SALE',
            debit: subTotal,
            credit: 0,
            description: `UPDATED SALE GOODS - BILL: ${billNo}`.toUpperCase(),
            referenceId: updatedSale._id,
            paymentMode: paymentMode || 'CREDIT',
            performedBy: req.user?._id,
            date: txnDate
        }, session);

        // Fresh Freight Entry
        if (freightAmt !== 0) {
            await ledgerService.postTransaction({
                partyId: partyId,
                type: 'ADJUSTMENT',
                debit: freightAmt > 0 ? freightAmt : 0,
                credit: freightAmt < 0 ? Math.abs(freightAmt) : 0,
                description: `UPDATED FREIGHT ADJ - BILL: ${billNo}`.toUpperCase(),
                referenceId: updatedSale._id,
                paymentMode: "ADJUSTMENT",
                performedBy: req.user?._id,
                date: txnDate
            }, session);
        }

        await session.commitTransaction();
        res.status(200).json({ success: true, message: "Sale & Ledger updated successfully.", data: updatedSale });

    } catch (error) {
        await session.abortTransaction();
        res.status(400).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};

// ==========================================
// 4. DELETE SALE (Total Physical Cleanup)
// ==========================================
export const deleteSale = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const saleId = req.params.id;

        // 1. Ledger Cleanup (Balance revert + Row physical delete)
        await ledgerService.deleteByReference(saleId, session);

        // 2. Delete Sale record from DB
        const deletedSale = await Sale.findByIdAndDelete(saleId).session(session);
        if (!deletedSale) throw new Error("Sale record not found");

        await session.commitTransaction();
        res.status(200).json({ success: true, message: "Sale & Ledger records deleted successfully." });

    } catch (error) {
        await session.abortTransaction();
        res.status(400).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};

// ==========================================
// GET HELPERS (Optimized with Lean)
// ==========================================
export const getAllSales = async (req, res, next) => {
    try {
        const sales = await Sale.find()
            .populate("partyId", "name phone currentBalance")
            .sort({ date: -1, createdAt: -1 })
            .lean();
        res.status(200).json({ success: true, count: sales.length, data: sales });
    } catch (error) { next(error); }
};

export const getSaleById = async (req, res, next) => {
    try {
        const sale = await Sale.findById(req.params.id)
            .populate("partyId", "name phone address gstin currentBalance")
            .lean();
        if (!sale) return res.status(404).json({ success: false, message: "Sale record not found" });
        res.status(200).json({ success: true, data: sale });
    } catch (error) { next(error); }
};  