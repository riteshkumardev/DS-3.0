import Transaction from "../models/Transaction.js";
import Party from "../models/Party.js";
import ledgerService from "../services/ledgerService.js"; // 👈 Ledger Service use karenge
import mongoose from "mongoose";

/**
 * Professional Transaction Controller (Payments & Receipts)
 * ✔ Smart Ledger Integration
 * ✔ Physical Delete Sync
 * ✔ Correct Debit/Credit Logic
 */

// ==========================================
// 1. CREATE TRANSACTION (Payment In / Out)
// ==========================================
export const createTransaction = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { partyId, type, amount, date, paymentMode, description } = req.body;

        if (!partyId || !amount || !type) {
            throw new Error("Party, Amount and Transaction Type are required");
        }

        const amountVal = Number(amount);
        const txnDate = date ? new Date(date) : new Date();

        // 🟢 ACCOUNTING LOGIC:
        // PAYMENT_IN (Customer ne paise diye): Party Credit hogi (Liability kam ya Asset kam)
        // PAYMENT_OUT (Supplier ko paise diye): Party Debit hogi (Liability kam)
        let debit = 0;
        let credit = 0;

        if (type === 'PAYMENT_IN') {
            credit = amountVal;
        } else if (type === 'PAYMENT_OUT') {
            debit = amountVal;
        } else {
            throw new Error("Invalid Transaction Type");
        }

        // Ledger Service ka use karke Transaction aur Balance update karein
        // Isse aapka 'nature' (Dr/Cr) aur 'runningBalance' automatic sahi ho jayega
        const savedTransaction = await ledgerService.postTransaction({
            partyId,
            type,
            debit,
            credit,
            description: description?.toUpperCase() || `${type} VIA ${paymentMode}`,
            paymentMode,
            performedBy: req.user._id,
            date: txnDate
        }, session);

        await session.commitTransaction();
        res.status(201).json({ 
            success: true, 
            message: "Transaction recorded and Ledger updated",
            data: savedTransaction 
        });

    } catch (error) {
        await session.abortTransaction();
        console.error("❌ Transaction Error:", error.message);
        res.status(400).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};

// ==========================================
// 2. GET ALL TRANSACTIONS
// ==========================================
export const getAllTransactions = async (req, res, next) => {
    try {
        const { partyId, startDate, endDate, type } = req.query;
        let query = {};

        if (partyId) query.partyId = partyId;
        if (type) query.type = type;
        if (startDate && endDate) {
            query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }

        const transactions = await Transaction.find(query)
            .sort({ date: -1, createdAt: -1 })
            .populate('partyId', 'name currentBalance')
            .populate('performedBy', 'name')
            .lean();

        res.status(200).json({ 
            success: true, 
            count: transactions.length, 
            data: transactions 
        });
    } catch (error) {
        next(error);
    }
};

// ==========================================
// 3. DELETE TRANSACTION (Physical Cleanup)
// ==========================================
export const deleteTransaction = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const transactionId = req.params.id;
        const transaction = await Transaction.findById(transactionId);
        
        if (!transaction) throw new Error("Transaction not found");

        // 🚀 SMART CLEANUP:
        // Hum reversal entry nahi dalenge balki ledger se physical delete karenge
        // Iske liye humne LedgerService mein deleteByReference ya direct logic use kar sakte hain
        
        const entity = await Party.findById(transaction.partyId).session(session);
        if (entity) {
            // Balance Reverse: Debit ko minus, Credit ko plus
            entity.currentBalance = Number(entity.currentBalance) - Number(transaction.debit) + Number(transaction.credit);
            await entity.save({ session });
        }

        await Transaction.findByIdAndDelete(transactionId).session(session);

        await session.commitTransaction();
        res.status(200).json({ success: true, message: "Transaction deleted and balance restored" });

    } catch (error) {
        await session.abortTransaction();
        res.status(400).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};