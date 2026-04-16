import Sale from "../models/Sale.js";
import ledgerService from "../services/ledgerService.js";
import logService from "../services/logService.js";
import { ACCOUNT_TYPES } from "../utils/constants.js";
import mongoose from "mongoose";

/**
 * SMART PRODUCTION SALE CONTROLLER
 * ✔ Clean Ledger Sync (Physical Delete on Edit/Delete)
 * ✔ Correct Debit/Credit Logic
 * ✔ Audit Logs Integrated
 * ✔ Decimal Safe
 */

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

        // ✅ Create Sale
        const sale = new Sale({
            ...req.body,
            subTotal,
            performedBy: req.user?._id,
        });

        const savedSale = await sale.save({ session });

        // ✅ Ledger Entry - Goods
        await ledgerService.postTransaction(
            {
                partyId,
                type: ACCOUNT_TYPES.SALE || "SALE",
                debit: subTotal,
                credit: 0,
                description: `SALE GOODS VALUE - BILL: ${billNo}`.toUpperCase(),
                referenceId: savedSale._id,
                paymentMode: paymentMode || "CREDIT",
                performedBy: req.user?._id,
                date: txnDate,
            },
            session
        );

        // ✅ Ledger Entry - Freight
        if (freightAmt !== 0) {
            await ledgerService.postTransaction(
                {
                    partyId,
                    type: "ADJUSTMENT",
                    debit: freightAmt > 0 ? freightAmt : 0,
                    credit: freightAmt < 0 ? Math.abs(freightAmt) : 0,
                    description:
                        (freightAmt > 0
                            ? "FREIGHT CHARGES ADDED"
                            : "FREIGHT PAID BY PARTY (CR)") +
                        ` - BILL: ${billNo}`,
                    referenceId: savedSale._id,
                    paymentMode: "ADJUSTMENT",
                    performedBy: req.user?._id,
                    date: txnDate,
                },
                session
            );
        }

        // ✅ Audit Log
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
        console.error("❌ Create Sale Error:", error.message);

        res.status(400).json({
            success: false,
            message: error.message,
        });
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

        // 🔴 Get Old Data (for logging)
        const oldSale = await Sale.findById(saleId).lean();

        if (!oldSale) throw new Error("Sale record not found");

        // 1. Ledger Cleanup
        await ledgerService.deleteByReference(saleId, session);

        // 2. Recalculate subtotal
        const subTotal =
            goods?.reduce((acc, item) => acc + (Number(item.taxableAmount) || 0), 0) ||
            Number(grandTotal);

        // 3. Update Sale
        const updatedSale = await Sale.findByIdAndUpdate(
            saleId,
            { ...req.body, subTotal, performedBy: req.user?._id },
            { new: true, session, runValidators: true }
        );

        const freightAmt = Number(logistics?.freight || 0);
        const txnDate = date ? new Date(date) : new Date();

        // 4. Fresh Ledger Entry - Goods
        await ledgerService.postTransaction(
            {
                partyId,
                type: ACCOUNT_TYPES.SALE || "SALE",
                debit: subTotal,
                credit: 0,
                description: `UPDATED SALE GOODS - BILL: ${billNo}`,
                referenceId: updatedSale._id,
                paymentMode: paymentMode || "CREDIT",
                performedBy: req.user?._id,
                date: txnDate,
            },
            session
        );

        // 5. Freight Entry
        if (freightAmt !== 0) {
            await ledgerService.postTransaction(
                {
                    partyId,
                    type: "ADJUSTMENT",
                    debit: freightAmt > 0 ? freightAmt : 0,
                    credit: freightAmt < 0 ? Math.abs(freightAmt) : 0,
                    description: `UPDATED FREIGHT ADJ - BILL: ${billNo}`,
                    referenceId: updatedSale._id,
                    paymentMode: "ADJUSTMENT",
                    performedBy: req.user?._id,
                    date: txnDate,
                },
                session
            );
        }

        // ✅ Audit Log
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

        res.status(400).json({
            success: false,
            message: error.message,
        });
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

        // 1. Ledger Cleanup
        await ledgerService.deleteByReference(saleId, session);

        // 2. Delete Sale
        await Sale.findByIdAndDelete(saleId).session(session);

        // ✅ Audit Log
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

        res.status(400).json({
            success: false,
            message: error.message,
        });
    } finally {
        session.endSession();
    }
};

// ==========================================
// 4. GET ALL SALES
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
// 5. GET SINGLE SALE
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