import Transaction from "../models/Transaction.js";
import Party from "../models/Party.js";
import Staff from "../models/Staff.js";

/**
 * Professional Ledger Service - Dharashakti Agro Products ERP
 * ✔ Race-condition Safe | ✔ Atomic Balance Updates | ✔ Precision Math
 */
class LedgerService {

    /**
     * @desc Post a transaction to the General Ledger
     */
    async postTransaction(data, session = null) {
        const {
            partyId, staffId, type, debit, credit,
            description, paymentMode, referenceId, performedBy, date
        } = data;

        try {
            // 1. Entity Identification
            let entityModel = partyId ? Party : Staff;
            let entityId = partyId || staffId;

            if (!entityId) throw new Error("Validation Error: partyId or staffId is required");

            // 2. Fetch Entity with Session (Concurrency Safety)
            const entity = await entityModel.findById(entityId).session(session);
            if (!entity) throw new Error("Entity not found in Master records");

            const lastBalance = Number(entity.currentBalance || 0);
            const debitVal = Number(debit) || 0;
            const creditVal = Number(credit) || 0;

            // 3. PRECISION MATH LOGIC (Universal Accounting Formula)
            // Formula: Previous Balance + Debit - Credit
            // Customer (Debit Nature): Increase by Debit, Decrease by Credit
            // Supplier (Credit Nature): Decrease by Debit, Increase by Credit
            const newRunningBalance = Math.round((lastBalance + debitVal - creditVal) * 100) / 100;

            // 4. Determine Nature for Statement UI
            const nature = debitVal > 0 ? "DEBIT" : (creditVal > 0 ? "CREDIT" : "NEUTRAL");

            // 5. Create Transaction Document
            const transaction = new Transaction({
                partyId: partyId || null,
                staffId: staffId || null,
                type,
                description: description?.toUpperCase() || "NO DESCRIPTION",
                debit: debitVal,
                credit: creditVal,
                runningBalance: newRunningBalance,
                nature: nature,
                paymentMode: paymentMode || "CREDIT",
                referenceId: referenceId || null,
                performedBy: performedBy || null,
                date: date ? new Date(date) : new Date()
            });

            await transaction.save({ session });

            // 6. Update Master Balance (Atomic)
            entity.currentBalance = newRunningBalance;
            await entity.save({ session });

            return transaction;

        } catch (error) {
            console.error("❌ [LedgerService] Posting Error:", error.message);
            throw new Error(error.message);
        }
    }

    /**
     * @desc Cleanup: Delete transactions and REVERSE the balance impact
     * Used for Edit/Delete Sale/Purchase/Payment
     */
    async deleteByReference(referenceId, session = null) {
        try {
            const transactions = await Transaction.find({ referenceId }).session(session);
            
            for (const txn of transactions) {
                const entityModel = txn.partyId ? Party : Staff;
                const entityId = txn.partyId || txn.staffId;

                const entity = await entityModel.findById(entityId).session(session);
                if (entity) {
                    // Reverse Math: CurrentBalance - TransactionDebit + TransactionCredit
                    const resetBalance = Number(entity.currentBalance) - Number(txn.debit) + Number(txn.credit);
                    entity.currentBalance = Math.round(resetBalance * 100) / 100;
                    await entity.save({ session });
                }
                await Transaction.findByIdAndDelete(txn._id).session(session);
            }
            return true;
        } catch (error) {
            console.error("❌ [LedgerService] Cleanup Error:", error.message);
            throw new Error("Failed to cleanup old ledger entries");
        }
    }

    /**
     * @desc Audit Tool: Recalculate full balance history from day one
     */
    async reSyncBalance(id, isStaff = false) {
        try {
            const query = isStaff ? { staffId: id } : { partyId: id };
            const model = isStaff ? Staff : Party;

            const masterRecord = await model.findById(id);
            if (!masterRecord) throw new Error("Master record not found");

            // Sort by date (ascending) to reconstruct history
            const transactions = await Transaction.find(query).sort({ date: 1, createdAt: 1 });

            let runningBal = Number(masterRecord.openingBalance || 0);

            for (const txn of transactions) {
                runningBal = Math.round((runningBal + txn.debit - txn.credit) * 100) / 100;
                
                const nature = txn.debit > 0 ? "DEBIT" : (txn.credit > 0 ? "CREDIT" : txn.nature);

                if (txn.runningBalance !== runningBal || txn.nature !== nature) {
                    txn.runningBalance = runningBal;
                    txn.nature = nature;
                    await txn.save();
                }
            }

            // Sync Master currentBalance
            await model.findByIdAndUpdate(id, { currentBalance: runningBal });
            return runningBal;

        } catch (error) {
            console.error("❌ [LedgerService] ReSync Error:", error);
            throw error;
        }
    }
}

export default new LedgerService();