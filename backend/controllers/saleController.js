import Sale from "../models/Sale.js";
import ledgerService from "../services/ledgerService.js";
import { ACCOUNT_TYPES } from "../utils/constants.js";
import mongoose from "mongoose";

/**
 * SMART PRODUCTION SALE CONTROLLER
 * ✔ Clean Ledger Sync (No Reversal Rows)
 * ✔ Atomic Transactions
 * ✔ Freight Logic Included
 */

// ==========================================
// 1. CREATE SALE
// ==========================================
export const createSale = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { partyId, billNo, paymentMode, grandTotal, logistics, date } = req.body;

        if (!partyId || !billNo) throw new Error("Party ID and Bill Number are required");

        const freightAmt = Number(logistics?.freight || 0);
        const billAmount = Number(grandTotal || 0);
        const txnDate = date ? new Date(date) : new Date();

        // A. Save Sale Record
        const sale = new Sale({
            ...req.body,
            performedBy: req.user?._id
        });
        const savedSale = await sale.save({ session });

        // B. Main Ledger Entry (Debit)
        await ledgerService.postTransaction({
            partyId: partyId,
            type: ACCOUNT_TYPES.SALE || 'SALE',
            debit: billAmount,
            credit: 0,
            description: `SALE BILL NO: ${billNo}`.toUpperCase(),
            referenceId: savedSale._id,
            paymentMode: paymentMode || 'CREDIT',
            performedBy: req.user?._id,
            date: txnDate
        }, session);

        // C. Freight Adjustment Entry (Separate Row)
        if (freightAmt !== 0) {
            await ledgerService.postTransaction({
                partyId: partyId,
                type: 'ADJUSTMENT',
                debit: freightAmt > 0 ? freightAmt : 0,
                credit: freightAmt < 0 ? Math.abs(freightAmt) : 0,
                description: (freightAmt > 0 ? `FREIGHT CHARGES (DR)` : `FREIGHT PAID BY PARTY (CR)`).toUpperCase() + ` - BILL: ${billNo}`,
                referenceId: savedSale._id,
                paymentMode: "ADJUSTMENT",
                performedBy: req.user?._id,
                date: txnDate
            }, session);
        }

        await session.commitTransaction();
        res.status(201).json({ success: true, message: "Sale created and ledger synced.", data: savedSale });

    } catch (error) {
        await session.abortTransaction();
        res.status(400).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};

// ==========================================
// 3. UPDATE SALE (Clean Ledger Logic)
// ==========================================
export const updateSale = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const saleId = req.params.id;
        const { partyId, billNo, grandTotal, logistics, date, paymentMode } = req.body;

        // 1. Purane Ledger Records ko delete karein (Reversal ki jagah cleanup)
        // Note: ledgerService.deleteByReference function humne pehle discuss kiya tha
        await ledgerService.deleteByReference(saleId, session);

        // 2. Sale Document Update Karein
        const updatedSale = await Sale.findByIdAndUpdate(
            saleId,
            { ...req.body, performedBy: req.user?._id },
            { new: true, session, runValidators: true }
        );

        if (!updatedSale) throw new Error("Sale record not found");

        // 3. Naye Fresh Ledger Entries banayein
        const billAmount = Number(grandTotal || 0);
        const freightAmt = Number(logistics?.freight || 0);
        const txnDate = date ? new Date(date) : new Date();

        // Fresh Main Bill Entry
        await ledgerService.postTransaction({
            partyId: partyId,
            type: ACCOUNT_TYPES.SALE || 'SALE',
            debit: billAmount,
            description: `UPDATED SALE BILL: ${billNo}`.toUpperCase(),
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
                description: `UPDATED FREIGHT - BILL: ${billNo}`.toUpperCase(),
                referenceId: updatedSale._id,
                paymentMode: "ADJUSTMENT",
                performedBy: req.user?._id,
                date: txnDate
            }, session);
        }

        await session.commitTransaction();
        res.status(200).json({ success: true, message: "Sale & Ledger Updated Successfully", data: updatedSale });

    } catch (error) {
        await session.abortTransaction();
        res.status(400).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};

// ==========================================
// 4. DELETE SALE (Total Cleanup)
// ==========================================
export const deleteSale = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const saleId = req.params.id;

        // 1. Ledger entries ko Reference ID se gayab karein (Balance auto-correct hoga)
        await ledgerService.deleteByReference(saleId, session);

        // 2. Sale table se record delete karein
        const deletedSale = await Sale.findByIdAndDelete(saleId).session(session);
        if (!deletedSale) throw new Error("Sale record already deleted or not found");

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
// 2 & 5. GET ALL & BY ID
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