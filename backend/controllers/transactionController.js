import Transaction from "../models/Transaction.js";
import Party from "../models/Party.js";
import mongoose from "mongoose";

/**
 * Professional Transaction Controller (Payments & Receipts)
 * Dharashakti Agro Products ERP
 */

// 1. CREATE TRANSACTION (Payment In / Payment Out)
export const createTransaction = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { partyId, type, amount, date, paymentMode, description } = req.body;

        const party = await Party.findById(partyId);
        if (!party) {
            res.status(404);
            throw new Error("Party not found");
        }

        // Logic: Payment IN (Customer se aaya) -> Balance kam hoga
        // Payment OUT (Supplier ko diya) -> Balance kam hoga (Udhari kam hogi)
        let adjustment = 0;
        if (type === 'PAYMENT_IN') adjustment = -amount;
        if (type === 'PAYMENT_OUT') adjustment = -amount;

        const transaction = new Transaction({
            ...req.body,
            performedBy: req.user._id,
            runningBalance: party.currentBalance + adjustment
        });

        const savedTransaction = await transaction.save({ session });

        // Update Party Master Balance
        party.currentBalance += adjustment;
        await party.save({ session });

        await session.commitTransaction();
        res.status(201).json({ success: true, data: savedTransaction });

    } catch (error) {
        await session.abortTransaction();
        next(error);
    } finally {
        session.endSession();
    }
};

// 2. GET ALL TRANSACTIONS (With Filters)
export const getAllTransactions = async (req, res, next) => {
    try {
        const { partyId, startDate, endDate } = req.query;
        let query = {};

        if (partyId) query.partyId = partyId;
        if (startDate && endDate) {
            query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }

        const transactions = await Transaction.find(query)
            .sort({ date: -1, createdAt: -1 })
            .populate('partyId', 'name');

        res.status(200).json({ success: true, count: transactions.length, data: transactions });
    } catch (error) {
        next(error);
    }
};

// 3. DELETE TRANSACTION (Reversal)
export const deleteTransaction = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const transaction = await Transaction.findById(req.params.id);
        if (!transaction) throw new Error("Transaction not found");

        const party = await Party.findById(transaction.partyId);
        
        // Reverse balance logic
        let reverseAdjustment = 0;
        if (transaction.type === 'PAYMENT_IN' || transaction.type === 'PAYMENT_OUT') {
            reverseAdjustment = transaction.amount;
        }

        party.currentBalance += reverseAdjustment;
        await party.save({ session });

        await Transaction.findByIdAndDelete(req.params.id).session(session);

        await session.commitTransaction();
        res.status(200).json({ success: true, message: "Transaction deleted and balance reversed" });

    } catch (error) {
        await session.abortTransaction();
        next(error);
    } finally {
        session.endSession();
    }
};