import Transaction from "../models/Transaction.js";
import Party from "../models/Party.js";
import ledgerService from "../services/ledgerService.js";
import mongoose from "mongoose";

/**
 * 🚀 FINAL SMART TRANSACTION CONTROLLER
 */

const VALID_TYPES = ["PAYMENT_IN", "PAYMENT_OUT"];

// 🔧 Safe Number
const toSafeNumber = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
};

// ==========================================
// 1. CREATE TRANSACTION
// ==========================================
export const createTransaction = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        let { partyId, type, amount, date, paymentMode, description, referenceId } = req.body;

        // 🔒 Normalize
        type = String(type || "").toUpperCase();

        // 🔴 Validation
        if (!partyId) throw new Error("Party is required");
        if (!VALID_TYPES.includes(type)) throw new Error("Invalid transaction type");
        if (!amount || toSafeNumber(amount) <= 0) throw new Error("Valid amount required");

        const amountVal = toSafeNumber(amount);
        const txnDate = date ? new Date(date) : new Date();

        // 🔴 Prevent duplicate (idempotency)
        if (referenceId) {
            const existing = await Transaction.findOne({ referenceId }).session(session);
            if (existing) {
                throw new Error("Duplicate transaction detected");
            }
        }

        // 🔥 Accounting Logic
        let debit = 0, credit = 0;

        if (type === "PAYMENT_IN") {
            credit = amountVal;
        } else {
            debit = amountVal;
        }

        // 🔥 Ledger Entry (Single Source of Truth)
        const savedTransaction = await ledgerService.postTransaction({
            partyId,
            type,
            debit,
            credit,
            description: (description || `${type} VIA ${paymentMode || "CASH"}`).toUpperCase(),
            paymentMode: paymentMode || "CASH",
            performedBy: req.user?._id,
            date: txnDate,
            referenceId
        }, session);

        await session.commitTransaction();

        res.status(201).json({
            success: true,
            message: "Transaction recorded successfully",
            data: savedTransaction
        });

    } catch (error) {
        await session.abortTransaction();
        console.error("❌ CREATE TXN ERROR:", error.message);

        res.status(400).json({
            success: false,
            message: error.message
        });
    } finally {
        session.endSession();
    }
};

// ==========================================
// 2. GET ALL TRANSACTIONS
// ==========================================
export const getAllTransactions = async (req, res) => {
    try {
        const { partyId, startDate, endDate, type, page = 1, limit = 50 } = req.query;

        let query = {};

        if (partyId) query.partyId = partyId;
        if (type) query.type = String(type).toUpperCase();

        if (startDate && endDate) {
            query.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const skip = (Number(page) - 1) * Number(limit);

        const [transactions, total] = await Promise.all([
            Transaction.find(query)
                .sort({ date: -1, createdAt: -1 })
                .skip(skip)
                .limit(Number(limit))
                .populate("partyId", "name currentBalance phone")
                .populate("performedBy", "name")
                .lean(),

            Transaction.countDocuments(query)
        ]);

        res.status(200).json({
            success: true,
            total,
            page: Number(page),
            pages: Math.ceil(total / limit),
            data: transactions
        });

    } catch (error) {
        console.error("❌ FETCH TXN ERROR:", error.message);

        res.status(500).json({
            success: false,
            message: "Error fetching transactions"
        });
    }
};

// ==========================================
// 3. DELETE TRANSACTION (SAFE REVERSAL)
// ==========================================
export const deleteTransaction = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const transactionId = req.params.id;

        const transaction = await Transaction.findById(transactionId).session(session);
        if (!transaction) throw new Error("Transaction not found");

        // 🔒 Authorization (basic)
        if (!req.user) throw new Error("Unauthorized");

        // 🔥 Reverse Ledger Entry instead of manual balance hack
        await ledgerService.postTransaction({
            partyId: transaction.partyId,
            type: "REVERSAL",
            debit: transaction.credit,
            credit: transaction.debit,
            description: `REVERSAL OF ${transaction._id}`,
            paymentMode: "SYSTEM",
            performedBy: req.user._id,
            referenceId: transaction._id
        }, session);

        // 🔥 Delete original transaction
        await Transaction.findByIdAndDelete(transactionId).session(session);

        await session.commitTransaction();

        res.status(200).json({
            success: true,
            message: "Transaction reversed and deleted successfully"
        });

    } catch (error) {
        await session.abortTransaction();
        console.error("❌ DELETE TXN ERROR:", error.message);

        res.status(400).json({
            success: false,
            message: error.message
        });
    } finally {
        session.endSession();
    }
};