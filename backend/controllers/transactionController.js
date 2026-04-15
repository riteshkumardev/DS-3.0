import Transaction from "../models/Transaction.js";
import Party from "../models/Party.js";
import ledgerService from "../services/ledgerService.js";
import mongoose from "mongoose";

/**
 * 🚀 SMART TRANSACTION CONTROLLER
 * ✔ Direct Ledger Post
 * ✔ Atomic Balance Recovery on Delete
 * ✔ Validation for Missing Amounts
// ==========================================
// 1. CREATE TRANSACTION (Payment In / Out)
// ==========================================
export const createTransaction = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { partyId, type, amount, date, paymentMode, description } = req.body;

        // Validation: Ensure mandatory fields exist
        if (!partyId) throw new Error("Validation Error: Party selection is required");
        if (!amount || Number(amount) <= 0) throw new Error("Validation Error: Valid amount is required");
        if (!type) throw new Error("Validation Error: Transaction type (IN/OUT) is required");

        const amountVal = Number(amount);
        const txnDate = date ? new Date(date) : new Date();

        // ACCOUNTING LOGIC:
        // PAYMENT_IN (Customer pays us) -> Party is Credited (Balance goes down)
        // PAYMENT_OUT (We pay Supplier) -> Party is Debited (Balance goes up/Liability down)
        let debit = 0;
        let credit = 0;

        if (type === 'PAYMENT_IN') {
            credit = amountVal;
        } else if (type === 'PAYMENT_OUT') {
            debit = amountVal;
        } else {
            throw new Error("Invalid Transaction Type provided");
        }

        // 1. Post to Ledger via Service (Handles nature, runningBalance & Party currentBalance)
        // Note: ReferenceId is NULL for direct payments as they are the primary record
        const savedTransaction = await ledgerService.postTransaction({
            partyId,
            type,
            debit,
            credit,
            description: description?.toUpperCase() || `${type} VIA ${paymentMode}`,
            paymentMode: paymentMode || "CASH",
            performedBy: req.user?._id,
            date: txnDate
        }, session);

        await session.commitTransaction();
        
        res.status(201).json({ 
            success: true, 
            message: "Payment successfully recorded and ledger synced.",
            data: savedTransaction 
        });

    } catch (error) {
        await session.abortTransaction();
        console.error("❌ Transaction Creation Bug:", error.message);
        res.status(400).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};

// ==========================================
// 2. GET ALL TRANSACTIONS (Filtered)
// ==========================================
export const getAllTransactions = async (req, res, next) => {
    try {
        const { partyId, startDate, endDate, type } = req.query;
        let query = {};

        if (partyId) query.partyId = partyId;
        if (type) query.type = type;
        if (startDate && endDate) {
            query.date = { 
                $gte: new Date(startDate), 
                $lte: new Date(endDate) 
            };
        }

        const transactions = await Transaction.find(query)
            .sort({ date: -1, createdAt: -1 })
            .populate('partyId', 'name currentBalance phone')
            .populate('performedBy', 'name')
            .lean();

        res.status(200).json({ 
            success: true, 
            count: transactions.length, 
            data: transactions 
        });
    } catch (error) {
        console.error("❌ Fetch Transactions Error:", error.message);
        res.status(500).json({ success: false, message: "Server Error while fetching transactions" });
    }
};

// ==========================================
// 3. DELETE TRANSACTION (Physical Recovery)
// ==========================================
export const deleteTransaction = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const transactionId = req.params.id;
        const transaction = await Transaction.findById(transactionId).session(session);
        
        if (!transaction) throw new Error("Transaction record not found");

        // 🟢 SMART RECOVERY:
        // Pehle Party ka balance reverse calculate karenge
        const entity = await Party.findById(transaction.partyId).session(session);
        
        if (entity) {
            // Reverse Logic: (Current - what was Debited + what was Credited)
            const resetBalance = Number(entity.currentBalance) - Number(transaction.debit) + Number(transaction.credit);
            entity.currentBalance = Math.round(resetBalance * 100) / 100;
            await entity.save({ session });
        }

        // Transaction record delete karein
        await Transaction.findByIdAndDelete(transactionId).session(session);

        await session.commitTransaction();
        res.status(200).json({ success: true, message: "Transaction removed and party balance restored." });

    } catch (error) {
        await session.abortTransaction();
        console.error("❌ Delete Transaction Error:", error.message);
        res.status(400).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};