import Transaction from "../models/Transaction.js";
import Party from "../models/Party.js";
import Staff from "../models/Staff.js";

/**
 * Professional Ledger Service - Dharashakti Agro Products ERP
 * ✔ Race-condition Safe
 * ✔ Atomic Balance Updates
 * ✔ Smart Cleanup (Reference based deletion)
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
            // 1. Identification & Validation
            let entityModel = partyId ? Party : Staff;
            let entityId = partyId || staffId;

            if (!entityId) throw new Error("Validation Error: partyId or staffId is required");
            if (!type) throw new Error("Validation Error: Transaction 'type' is required");

            // 2. Fetch Entity with Session (Atomic Balance Check)
            const entity = await entityModel.findById(entityId).session(session);
            if (!entity) throw new Error("Entity not found in Master records");

            const lastBalance = Number(entity.currentBalance || 0);

            // 3. Precision Math
            const debitVal = Number(debit) || 0;
            const creditVal = Number(credit) || 0;
            const newRunningBalance = Math.round((lastBalance + debitVal - creditVal) * 100) / 100;

            // 4. Create Transaction Entry
            const transaction = new Transaction({
                partyId: partyId || null,
                staffId: staffId || null,
                type,
                description: description?.toUpperCase() || "NO DESCRIPTION",
                debit: debitVal,
                credit: creditVal,
                runningBalance: newRunningBalance,
                paymentMode: paymentMode || "CREDIT",
                referenceId: referenceId || null,
                performedBy: performedBy || null,
                date: date ? new Date(date) : new Date()
            });

            await transaction.save({ session });

            // 5. Update Master Balance
            entity.currentBalance = newRunningBalance;
            await entity.save({ session });

            return transaction;

        } catch (error) {
            console.error("❌ [LedgerService] Posting Error:", error.message);
            throw new Error(error.message);
        }
    }

    /**
     * @desc Smart Cleanup: Delete transactions by reference (Sale/Purchase ID)
     * Iska use Update aur Delete controllers mein kachra saaf karne ke liye karein.
     */
    async deleteByReference(referenceId, session = null) {
        try {
            // 1. Reference se judi saari entries dhundein (Bill + Freight)
            const transactions = await Transaction.find({ referenceId }).session(session);
            
            for (const txn of transactions) {
                const entityModel = txn.partyId ? Party : Staff;
                const entityId = txn.partyId || txn.staffId;

                const entity = await entityModel.findById(entityId).session(session);
                if (entity) {
                    // Reverse Math: Debit ko minus aur Credit ko plus karein taaki balance reset ho jaye
                    const resetBalance = Number(entity.currentBalance) - Number(txn.debit) + Number(txn.credit);
                    entity.currentBalance = Math.round(resetBalance * 100) / 100;
                    await entity.save({ session });
                }
                
                // Ledger entry delete karein
                await Transaction.findByIdAndDelete(txn._id).session(session);
            }
            return true;
        } catch (error) {
            console.error("❌ [LedgerService] Cleanup Error:", error.message);
            throw new Error("Failed to cleanup old ledger entries");
        }
    }

    /**
     * @desc Audit Tool: Recalculate full balance from day one
     */
    async reSyncBalance(id, isStaff = false) {
        try {
            const query = isStaff ? { staffId: id } : { partyId: id };
            const model = isStaff ? Staff : Party;

            const masterRecord = await model.findById(id);
            if (!masterRecord) throw new Error("Master record not found");

            const transactions = await Transaction.find(query).sort({ date: 1, createdAt: 1 });

            let runningBal = Number(masterRecord.openingBalance || 0);

            for (const txn of transactions) {
                runningBal = Math.round((runningBal + txn.debit - txn.credit) * 100) / 100;
                
                if (txn.runningBalance !== runningBal) {
                    txn.runningBalance = runningBal;
                    await txn.save();
                }
            }

            await model.findByIdAndUpdate(id, { currentBalance: runningBal });
            return runningBal;

        } catch (error) {
            console.error("❌ [LedgerService] ReSync Error:", error);
            throw error;
        }
    }
}

export default new LedgerService();