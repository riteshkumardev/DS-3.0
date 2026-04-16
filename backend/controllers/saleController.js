import Sale from "../models/Sale.js";
import ledgerService from "../services/ledgerService.js";
import logService from "../services/logService.js";
import { ACCOUNT_TYPES } from "../utils/constants.js";
import mongoose from "mongoose";

// ==========================================
// HELPER: Freight Entry Logic (CENTRAL FIX)
// ==========================================
const getFreightEntry = (freightAmt) => {
    const amt = Math.abs(Number(freightAmt || 0));

    if (freightAmt > 0) {
        // ➜ Party se lena hai (Debit)
        return { debit: amt, credit: 0, label: "FREIGHT CHARGES ADDED" };
    } else {
        // ➜ Party ne diya (Credit)
        return { debit: 0, credit: amt, label: "FREIGHT PAID BY PARTY (CR)" };
    }
};

// ==========================================
// 1. CREATE SALE
// ==========================================
export const createSale = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { partyId, billNo, paymentMode, grandTotal, logistics, date, goods } = req.body;

        if (!partyId || !billNo) {
            throw new Error("Party ID and Bill Number are required");
        }

        const freightAmt = Number(logistics?.freight || 0);

        const subTotal =
            goods?.reduce((acc, item) => acc + (Number(item.taxableAmount) || 0), 0) ||
            Number(grandTotal);

        const txnDate = date ? new Date(date) : new Date();

        const sale = new Sale({
            ...req.body,
            subTotal,
            performedBy: req.user?._id,
        });

        const savedSale = await sale.save({ session });

        // ✅ GOODS ENTRY
        await ledgerService.postTransaction({
            partyId,
            type: ACCOUNT_TYPES.SALE || "SALE",
            debit: subTotal,
            credit: 0,
            description: `SALE GOODS VALUE - BILL: ${billNo}`,
            referenceId: savedSale._id,
            paymentMode: paymentMode || "CREDIT",
            performedBy: req.user?._id,
            date: txnDate,
        }, session);

        // ✅ FREIGHT ENTRY
        if (freightAmt !== 0) {
            const { debit, credit, label } = getFreightEntry(freightAmt);

            await ledgerService.postTransaction({
                partyId,
                type: "ADJUSTMENT",
                debit,
                credit,
                description: `${label} - BILL: ${billNo}`,
                referenceId: savedSale._id,
                paymentMode: "ADJUSTMENT",
                performedBy: req.user?._id,
                date: txnDate,
            }, session);
        }

        await logService.createLog({
            performedBy: req.user?._id,
            action: "CREATE",
            module: "SALE",
            documentId: savedSale._id,
            newValue: savedSale,
            remark: `Sale created - Bill ${billNo}`,
            req,
        });

        await session.commitTransaction();

        res.status(201).json({
            success: true,
            message: "Sale created & ledger synced",
            data: savedSale,
        });

    } catch (error) {
        await session.abortTransaction();
        res.status(400).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};

// ==========================================
// 2. UPDATE SALE
// ==========================================
export const updateSale = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const saleId = req.params.id;
        const { partyId, billNo, grandTotal, logistics, date, paymentMode, goods } = req.body;

        const oldSale = await Sale.findById(saleId).lean();
        if (!oldSale) throw new Error("Sale record not found");

        // ❌ Delete old ledger
        await ledgerService.deleteByReference(saleId, session);

        const subTotal =
            goods?.reduce((acc, item) => acc + (Number(item.taxableAmount) || 0), 0) ||
            Number(grandTotal);

        const updatedSale = await Sale.findByIdAndUpdate(
            saleId,
            { ...req.body, subTotal, performedBy: req.user?._id },
            { new: true, session, runValidators: true }
        );

        const freightAmt = Number(logistics?.freight || 0);
        const txnDate = date ? new Date(date) : new Date();

        // ✅ GOODS ENTRY
        await ledgerService.postTransaction({
            partyId,
            type: ACCOUNT_TYPES.SALE || "SALE",
            debit: subTotal,
            credit: 0,
            description: `UPDATED SALE GOODS - BILL: ${billNo}`,
            referenceId: updatedSale._id,
            paymentMode: paymentMode || "CREDIT",
            performedBy: req.user?._id,
            date: txnDate,
        }, session);

        // ✅ FREIGHT ENTRY
        if (freightAmt !== 0) {
            const { debit, credit, label } = getFreightEntry(freightAmt);

            await ledgerService.postTransaction({
                partyId,
                type: "ADJUSTMENT",
                debit,
                credit,
                description: `${label} - BILL: ${billNo}`,
                referenceId: updatedSale._id,
                paymentMode: "ADJUSTMENT",
                performedBy: req.user?._id,
                date: txnDate,
            }, session);
        }

        await logService.createLog({
            performedBy: req.user?._id,
            action: "UPDATE",
            module: "SALE",
            documentId: updatedSale._id,
            oldValue: oldSale,
            newValue: updatedSale,
            remark: `Sale updated - Bill ${billNo}`,
            req,
        });

        await session.commitTransaction();

        res.status(200).json({
            success: true,
            message: "Sale updated successfully",
            data: updatedSale,
        });

    } catch (error) {
        await session.abortTransaction();
        res.status(400).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};

// ==========================================
// 3. DELETE SALE
// ==========================================
export const deleteSale = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const saleId = req.params.id;

        const sale = await Sale.findById(saleId).lean();
        if (!sale) throw new Error("Sale record not found");

        await ledgerService.deleteByReference(saleId, session);
        await Sale.findByIdAndDelete(saleId).session(session);

        await logService.logDeletion(
            req.user?._id,
            "SALE",
            saleId,
            sale,
            req
        );

        await session.commitTransaction();

        res.status(200).json({
            success: true,
            message: "Sale deleted successfully",
        });

    } catch (error) {
        await session.abortTransaction();
        res.status(400).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};

// ==========================================
// 4. GET ALL SALES (FIXED ERROR)
// ==========================================
export const getAllSales = async (req, res, next) => {
    try {
        const sales = await Sale.find()
            .populate("partyId", "name phone currentBalance")
            .sort({ date: -1, createdAt: -1 })
            .lean();

        res.status(200).json({
            success: true,
            count: sales.length,
            data: sales,
        });
    } catch (error) {
        next(error);
    }
};

// ==========================================
// 5. GET SINGLE SALE (FIXED ERROR)
// ==========================================
export const getSaleById = async (req, res, next) => {
    try {
        const sale = await Sale.findById(req.params.id)
            .populate("partyId", "name phone address gstin currentBalance")
            .lean();

        if (!sale) {
            return res.status(404).json({
                success: false,
                message: "Sale not found",
            });
        }

        res.status(200).json({
            success: true,
            data: sale,
        });
    } catch (error) {
        next(error);  
    }
};