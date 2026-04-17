import Purchase from "../models/Purchase.js";
import ledgerService from "../services/ledgerService.js";
import logService from "../services/logService.js";
import { ACCOUNT_TYPES } from "../utils/constants.js";
import mongoose from "mongoose";

// 🔧 Helpers
const toNumber = (val) => (isNaN(Number(val)) ? 0 : Number(val));

// ==========================================
// 1. CREATE PURCHASE
// ==========================================
export const createPurchase = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        let {
            supplierId, // OLD
            supplierName, // OLD
            partyId, // NEW
            customerName, // NEW
            billNo,
            grandTotal,
            paymentMode,
            logistics,
            purchaseDate,
            date
        } = req.body;

        // ✅ AUTO FIX OLD → NEW
        partyId = partyId || supplierId;
        customerName = customerName || supplierName;

        if (!partyId || !billNo) {
            throw new Error("Party ID and Bill Number are required");
        }

        const billAmount = toNumber(grandTotal);
        if (billAmount <= 0) {
            throw new Error("Invalid purchase amount");
        }

        const freightAmt = toNumber(logistics?.freight);

        const txnDate = date
            ? new Date(date)
            : purchaseDate
            ? new Date(purchaseDate)
            : new Date();

        // ✅ SAVE PURCHASE (ONLY NEW FIELDS)
        const purchase = new Purchase({
            ...req.body,
            partyId,
            customerName,
            date: txnDate,
            performedBy: req.user?._id,
        });

        const savedPurchase = await purchase.save({ session });

        // ===============================
        // ✅ LEDGER ENTRY (MAIN)
        // ===============================
        await ledgerService.postTransaction(
            {
                partyId,
                type: ACCOUNT_TYPES.PURCHASE || "PURCHASE",
                debit: 0,
                credit: billAmount,
                description: `PURCHASE BILL NO: ${billNo}`,
                referenceId: savedPurchase._id,
                paymentMode: paymentMode || "CREDIT",
                performedBy: req.user?._id,
                date: txnDate,
            },
            session
        );

        // ===============================
        // ✅ FREIGHT ENTRY
        // ===============================
        if (freightAmt !== 0) {
            await ledgerService.postTransaction(
                {
                    partyId,
                    type: "ADJUSTMENT",
                    credit: freightAmt > 0 ? freightAmt : 0,
                    debit: freightAmt < 0 ? Math.abs(freightAmt) : 0,
                    description:
                        (freightAmt > 0
                            ? "FREIGHT CHARGES ADDED"
                            : "FREIGHT PAID BY US") +
                        ` - BILL: ${billNo}`,
                    referenceId: savedPurchase._id,
                    paymentMode: "ADJUSTMENT",
                    performedBy: req.user?._id,
                    date: txnDate,
                },
                session
            );
        }

        // ===============================
        // ✅ LOG
        // ===============================
        await logService.createLog({
            performedBy: req.user?._id,
            action: "CREATE",
            module: "PURCHASE",
            documentId: savedPurchase._id,
            newValue: savedPurchase,
            remark: `Purchase created - Bill ${billNo}`,
            req,
        });

        await session.commitTransaction();

        res.status(201).json({
            success: true,
            message: "Purchase recorded successfully",
            data: savedPurchase,
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
// 2. UPDATE PURCHASE
// ==========================================
export const updatePurchase = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const purchaseId = req.params.id;

        let {
            supplierId,
            supplierName,
            partyId,
            customerName,
            billNo,
            grandTotal,
            logistics,
            purchaseDate,
            date,
            paymentMode
        } = req.body;

        // ✅ FIX OLD → NEW
        partyId = partyId || supplierId;
        customerName = customerName || supplierName;

        const oldPurchase = await Purchase.findById(purchaseId).lean();
        if (!oldPurchase) throw new Error("Purchase not found");

        // ✅ DELETE OLD LEDGER
        await ledgerService.deleteByReference(purchaseId, session);

        const billAmount = toNumber(grandTotal);
        const freightAmt = toNumber(logistics?.freight);

        const txnDate = date
            ? new Date(date)
            : purchaseDate
            ? new Date(purchaseDate)
            : new Date();

        // ✅ UPDATE PURCHASE
        const updatedPurchase = await Purchase.findByIdAndUpdate(
            purchaseId,
            {
                ...req.body,
                partyId,
                customerName,
                date: txnDate,
                performedBy: req.user?._id,
            },
            { new: true, session, runValidators: true }
        );

        // ===============================
        // ✅ RE-POST LEDGER
        // ===============================
        await ledgerService.postTransaction(
            {
                partyId,
                type: ACCOUNT_TYPES.PURCHASE || "PURCHASE",
                debit: 0,
                credit: billAmount,
                description: `UPDATED PURCHASE BILL: ${billNo}`,
                referenceId: updatedPurchase._id,
                paymentMode: paymentMode || "CREDIT",
                performedBy: req.user?._id,
                date: txnDate,
            },
            session
        );

        if (freightAmt !== 0) {
            await ledgerService.postTransaction(
                {
                    partyId,
                    type: "ADJUSTMENT",
                    credit: freightAmt > 0 ? freightAmt : 0,
                    debit: freightAmt < 0 ? Math.abs(freightAmt) : 0,
                    description: `UPDATED FREIGHT ADJ - BILL: ${billNo}`,
                    referenceId: updatedPurchase._id,
                    paymentMode: "ADJUSTMENT",
                    performedBy: req.user?._id,
                    date: txnDate,
                },
                session
            );
        }

        // ✅ LOG
        await logService.createLog({
            performedBy: req.user?._id,
            action: "UPDATE",
            module: "PURCHASE",
            documentId: updatedPurchase._id,
            oldValue: oldPurchase,
            newValue: updatedPurchase,
            remark: `Purchase updated - Bill ${billNo}`,
            req,
        });

        await session.commitTransaction();

        res.status(200).json({
            success: true,
            message: "Purchase updated successfully",
            data: updatedPurchase,
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
// 3. DELETE PURCHASE
// ==========================================
export const deletePurchase = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const purchaseId = req.params.id;

        const purchase = await Purchase.findById(purchaseId).lean();
        if (!purchase) throw new Error("Purchase not found");

        await ledgerService.deleteByReference(purchaseId, session);

        await Purchase.findByIdAndDelete(purchaseId).session(session);

        await logService.logDeletion(
            req.user?._id,
            "PURCHASE",
            purchaseId,
            purchase,
            req
        );

        await session.commitTransaction();

        res.status(200).json({
            success: true,
            message: "Purchase deleted successfully",
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
// 4. GET ALL PURCHASES
// ==========================================
export const getAllPurchases = async (req, res, next) => {
    try {
        const purchases = await Purchase.find()
            .populate("partyId", "name phone currentBalance")
            .sort({ date: -1, createdAt: -1 })
            .lean();

        res.status(200).json({
            success: true,
            count: purchases.length,
            data: purchases,
        });

    } catch (error) {
        next(error);
    }
};

// ==========================================
// 5. GET PURCHASE BY ID
// ==========================================
export const getPurchaseById = async (req, res, next) => {
    try {
        const purchase = await Purchase.findById(req.params.id)
            .populate("partyId", "name phone address gstin currentBalance")
            .populate("performedBy", "name")
            .lean();

        if (!purchase) {
            return res.status(404).json({
                success: false,
                message: "Purchase not found",
            });
        }

        res.status(200).json({
            success: true,
            data: purchase,
        });

    } catch (error) {
        next(error);
    }
};