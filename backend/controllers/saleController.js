import Sale from "../models/Sale.js";
import ledgerService from "../services/ledgerService.js";
import { ACCOUNT_TYPES } from "../utils/constants.js";
import mongoose from "mongoose";

/**
 * FINAL PRODUCTION SALE CONTROLLER (BUG-FREE & LEDGER SYNCED)
 * Dharashakti Agro Products ERP
 */

// ==========================================
// 1. CREATE SALE (Atomic & Freight Aware)
// ==========================================
export const createSale = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { partyId, billNo, paymentMode, grandTotal, logistics, date } = req.body;

        // Validation Checks
        if (!partyId) throw new Error("Validation Failed: Party ID is required");
        if (!billNo) throw new Error("Validation Failed: Bill Number is required");

        const freightAmt = Number(logistics?.freight || 0);
        const billAmount = Number(grandTotal || 0);
        const txnDate = date ? new Date(date) : new Date();

        // A. Save Sale Record
        const sale = new Sale({
            ...req.body,
            performedBy: req.user?._id // Null safety check
        });
        const savedSale = await sale.save({ session });

        // B. Main Ledger Entry (Debit the Customer)
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

        // C. Freight Entry Logic
        let debitVal = 0;
        let creditVal = 0;
        let freightDesc = "";

        if (freightAmt > 0) {
            debitVal = freightAmt;
            freightDesc = `FREIGHT CHARGES (DR) - BILL: ${billNo}`;
        } else if (freightAmt < 0) {
            creditVal = Math.abs(freightAmt);
            freightDesc = `FREIGHT PAID BY PARTY (CR) - BILL: ${billNo}`;
        } else {
            freightDesc = `FREIGHT SELF - BILL: ${billNo}`;
        }

        // D. Post Freight to Ledger (Always track even if 0 for audit)
        await ledgerService.postTransaction({
            partyId: partyId,
            type: ACCOUNT_TYPES.ADJUSTMENT || 'ADJUSTMENT',
            debit: debitVal,
            credit: creditVal,
            description: freightDesc.toUpperCase(),
            referenceId: savedSale._id,
            paymentMode: "ADJUSTMENT",
            performedBy: req.user?._id,
            date: txnDate
        }, session);

        await session.commitTransaction();
        res.status(201).json({
            success: true,
            message: "Sale created and ledger successfully synced.",
            data: savedSale
        });

    } catch (error) {
        await session.abortTransaction();
        console.error("❌ Sale Creation Bug:", error.message);
        res.status(400).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};

// ==========================================
// 2. GET ALL SALES (Optimized)
// ==========================================
export const getAllSales = async (req, res, next) => {
    try {
        // Optimized with Lean for faster performance
        const sales = await Sale.find()
            .populate("partyId", "name phone currentBalance")
            .sort({ date: -1, createdAt: -1 })
            .lean();

        res.status(200).json({
            success: true,
            count: sales.length,
            data: sales
        });
    } catch (error) {
        console.error("❌ Fetch Sales Error:", error.message);
        next(error);
    }
};

// ==========================================
// 3. UPDATE SALE (Reversal Integrity)
// ==========================================
export const updateSale = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const saleId = req.params.id;
        const oldSale = await Sale.findById(saleId).session(session);
        if (!oldSale) throw new Error("Sale record not found in database");

        const { partyId, billNo, paymentMode, grandTotal, logistics, date } = req.body;
        const oldFreight = Number(oldSale.logistics?.freight || 0);
        const newFreight = Number(logistics?.freight || 0);
        const newBillAmt = Number(grandTotal || 0);
        const txnDate = date ? new Date(date) : new Date();

        // STEP A: Reverse Old Bill (Debit reversed by Credit)
        await ledgerService.postTransaction({
            partyId: oldSale.partyId,
            type: ACCOUNT_TYPES.REVERSAL || 'REVERSAL',
            credit: Number(oldSale.grandTotal),
            debit: 0,
            description: `REVERSAL: BILL ${oldSale.billNo} FOR EDIT`,
            referenceId: oldSale._id,
            performedBy: req.user?._id,
            date: txnDate
        }, session);

        // STEP B: Reverse Old Freight
        await ledgerService.postTransaction({
            partyId: oldSale.partyId,
            type: ACCOUNT_TYPES.REVERSAL || 'REVERSAL',
            debit: oldFreight < 0 ? Math.abs(oldFreight) : 0,
            credit: oldFreight > 0 ? oldFreight : 0,
            description: `REVERSAL FREIGHT: ${oldSale.billNo}`,
            referenceId: oldSale._id,
            performedBy: req.user?._id,
            date: txnDate
        }, session);

        // STEP C: Atomic Document Update
        const updatedSale = await Sale.findByIdAndUpdate(
            saleId,
            { ...req.body, performedBy: req.user?._id },
            { new: true, session, runValidators: true }
        );

        // STEP D: Apply New Bill Entry
        await ledgerService.postTransaction({
            partyId: partyId,
            type: ACCOUNT_TYPES.SALE || 'SALE',
            debit: newBillAmt,
            credit: 0,
            description: `UPDATED BILL ${billNo}`,
            referenceId: updatedSale._id,
            paymentMode: paymentMode || 'CREDIT',
            performedBy: req.user?._id,
            date: txnDate
        }, session);

        // STEP E: Apply New Freight Entry
        await ledgerService.postTransaction({
            partyId: partyId,
            type: ACCOUNT_TYPES.ADJUSTMENT || 'ADJUSTMENT',
            debit: newFreight > 0 ? newFreight : 0,
            credit: newFreight < 0 ? Math.abs(newFreight) : 0,
            description: `UPDATED FREIGHT - BILL: ${billNo}`.toUpperCase(),
            referenceId: updatedSale._id,
            paymentMode: "ADJUSTMENT",
            performedBy: req.user?._id,
            date: txnDate
        }, session);

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
// 4. DELETE SALE (Full Cleanup)
// ==========================================
export const deleteSale = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const sale = await Sale.findById(req.params.id);
        if (!sale) throw new Error("Sale not found");

        const freightAmt = Number(sale.logistics?.freight || 0);

        // Reverse Main Bill
        await ledgerService.postTransaction({
            partyId: sale.partyId,
            type: ACCOUNT_TYPES.REVERSAL || 'REVERSAL',
            credit: Number(sale.grandTotal),
            debit: 0,
            description: `DELETE REVERSAL: BILL ${sale.billNo}`,
            performedBy: req.user?._id,
            date: new Date()
        }, session);

        // Reverse Freight
        if (freightAmt !== 0) {
            await ledgerService.postTransaction({
                partyId: sale.partyId,
                type: ACCOUNT_TYPES.REVERSAL || 'REVERSAL',
                debit: freightAmt < 0 ? Math.abs(freightAmt) : 0,
                credit: freightAmt > 0 ? freightAmt : 0,
                description: `DELETE REVERSAL FREIGHT: ${sale.billNo}`,
                performedBy: req.user?._id,
                date: new Date()
            }, session);
        }

        await Sale.findByIdAndDelete(req.params.id).session(session);
        await session.commitTransaction();
        res.status(200).json({ success: true, message: "Sale permanently deleted and ledger cleared." });

    } catch (error) {
        await session.abortTransaction();
        res.status(400).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};

// ==========================================
// 5. GET BY ID (Lean & Secure)
// ==========================================
export const getSaleById = async (req, res, next) => {
    try {
        const sale = await Sale.findById(req.params.id)
            .populate("partyId", "name phone address gstin currentBalance")
            .lean();
        
        if (!sale) return res.status(404).json({ success: false, message: "Sale record not found" });
        res.status(200).json({ success: true, data: sale });
    } catch (error) {
        next(error);
    }
};