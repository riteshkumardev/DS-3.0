import Sale from "../models/Sale.js";
import ledgerService from "../services/ledgerService.js";
import { ACCOUNT_TYPES } from "../utils/constants.js";
import mongoose from "mongoose";

/**
 * Professional Sale Controller (Fully Fixed)
 */

// ==========================
// 1. CREATE SALE
// ==========================
export const createSale = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { partyId, billNo, paymentMode, grandTotal, logistics } = req.body;

        if (!partyId) {
            throw new Error("Party is required");
        }

        const freightAmt = Number(logistics?.freight || 0);

        // A. Save Sale
        const sale = new Sale({
            ...req.body,
            performedBy: req.user._id
        });

        const savedSale = await sale.save({ session });

        // B. Main Ledger Entry
        await ledgerService.postTransaction({
            partyId,
            type: ACCOUNT_TYPES.SALE,
            debit: grandTotal,
            description: `SALE BILL NO: ${billNo}`,
            referenceId: savedSale._id,
            paymentMode,
            performedBy: req.user._id,
            date: req.body.date || new Date()
        }, session);

        // C. Freight Logic
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

        // D. Freight Entry
        await ledgerService.postTransaction({
            partyId,
            type: ACCOUNT_TYPES.ADJUSTMENT,
            debit: debitVal,
            credit: creditVal,
            description: freightDesc,
            referenceId: savedSale._id,
            paymentMode: "ADJUSTMENT",
            performedBy: req.user._id,
            date: req.body.date || new Date()
        }, session);

        await session.commitTransaction();

        res.status(201).json({
            success: true,
            message: "Sale Created Successfully",
            data: savedSale
        });

    } catch (error) {
        await session.abortTransaction();
        console.error("❌ Create Sale Error:", error);
        next(error);
    } finally {
        session.endSession();
    }
};

// ==========================
// 2. GET ALL SALES (FIXED)
// ==========================
export const getAllSales = async (req, res, next) => {
    try {
        const sales = await Sale.find()
            .populate("partyId", "name phone")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: sales.length,
            data: sales
        });

    } catch (error) {
        console.error("❌ Get All Sales Error:", error);
        next(error);
    }
};

// ==========================
// 3. GET SINGLE SALE (FIXED)
// ==========================
export const getSaleById = async (req, res, next) => {
    try {
        const sale = await Sale.findById(req.params.id)
            .populate("partyId", "name phone address");

        if (!sale) {
            return res.status(404).json({
                success: false,
                message: "Sale not found"
            });
        }

        res.status(200).json({
            success: true,
            data: sale
        });

    } catch (error) {
        console.error("❌ Get Sale By ID Error:", error);
        next(error);
    }
};

// ==========================
// 4. UPDATE SALE (same as yours, minor fix)
// ==========================
export const updateSale = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const saleId = req.params.id;

        const oldSale = await Sale.findById(saleId).session(session);
        if (!oldSale) {
            return res.status(404).json({ success: false, message: "Sale not found" });
        }

        const { partyId, billNo, paymentMode, grandTotal, logistics } = req.body;

        const oldFreight = Number(oldSale.logistics?.freight || 0);
        const newFreight = Number(logistics?.freight || 0);

        // Reverse Old Bill
        await ledgerService.postTransaction({
            partyId: oldSale.partyId,
            type: ACCOUNT_TYPES.REVERSAL,
            credit: oldSale.grandTotal,
            description: `REVERSAL: BILL ${oldSale.billNo}`,
            referenceId: oldSale._id,
            performedBy: req.user._id
        }, session);

        // Reverse Old Freight
        await ledgerService.postTransaction({
            partyId: oldSale.partyId,
            type: ACCOUNT_TYPES.REVERSAL,
            debit: oldFreight < 0 ? Math.abs(oldFreight) : 0,
            credit: oldFreight > 0 ? oldFreight : 0,
            description: `REVERSAL FREIGHT ${oldSale.billNo}`,
            referenceId: oldSale._id,
            performedBy: req.user._id
        }, session);

        // Update Sale
        const updatedSale = await Sale.findByIdAndUpdate(
            saleId,
            { ...req.body, performedBy: req.user._id },
            { new: true, session }
        );

        // New Bill Entry
        await ledgerService.postTransaction({
            partyId,
            type: ACCOUNT_TYPES.SALE,
            debit: grandTotal,
            description: `UPDATED BILL ${billNo}`,
            referenceId: updatedSale._id,
            paymentMode,
            performedBy: req.user._id
        }, session);

        // New Freight Entry
        await ledgerService.postTransaction({
            partyId,
            type: ACCOUNT_TYPES.ADJUSTMENT,
            debit: newFreight > 0 ? newFreight : 0,
            credit: newFreight < 0 ? Math.abs(newFreight) : 0,
            description: "UPDATED FREIGHT",
            referenceId: updatedSale._id,
            paymentMode: "ADJUSTMENT",
            performedBy: req.user._id
        }, session);

        await session.commitTransaction();

        res.status(200).json({
            success: true,
            message: "Sale Updated",
            data: updatedSale
        });

    } catch (error) {
        await session.abortTransaction();
        console.error("❌ Update Sale Error:", error);
        next(error);
    } finally {
        session.endSession();
    }
};

// ==========================
// 5. DELETE SALE
// ==========================
export const deleteSale = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const sale = await Sale.findById(req.params.id);
        if (!sale) throw new Error("Sale not found");

        const freightAmt = Number(sale.logistics?.freight || 0);

        // Reverse Bill
        await ledgerService.postTransaction({
            partyId: sale.partyId,
            type: ACCOUNT_TYPES.REVERSAL,
            credit: sale.grandTotal,
            description: `DELETE BILL ${sale.billNo}`,
            performedBy: req.user._id
        }, session);

        // Reverse Freight
        await ledgerService.postTransaction({
            partyId: sale.partyId,
            type: ACCOUNT_TYPES.REVERSAL,
            debit: freightAmt < 0 ? Math.abs(freightAmt) : 0,
            credit: freightAmt > 0 ? freightAmt : 0,
            description: `DELETE FREIGHT ${sale.billNo}`,
            performedBy: req.user._id
        }, session);

        await Sale.findByIdAndDelete(req.params.id).session(session);

        await session.commitTransaction();

        res.status(200).json({
            success: true,
            message: "Sale Deleted"
        });

    } catch (error) {
        await session.abortTransaction();
        console.error("❌ Delete Sale Error:", error);
        next(error);
    } finally {
        session.endSession();
    }
};