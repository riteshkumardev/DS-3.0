import Transaction from "../models/Transaction.js";
import Party from "../models/Party.js";
import Staff from "../models/Staff.js";

/**
 * Professional Ledger Service (FIXED & OPTIMIZED)
 */
class LedgerService {

    /**
     * @desc Post a transaction to the General Ledger
     */
    async postTransaction(data, session = null) {
        const {
            partyId,
            staffId,
            type,
            debit,
            credit,
            description,
            paymentMode,
            referenceId,
            performedBy,
            date
        } = data;

        try {
            let lastBalance = 0;
            let entityModel;
            let entityId;

            // ✅ 1. Identify Entity
            if (partyId) {
                entityModel = Party;
                entityId = partyId;
            } else if (staffId) {
                entityModel = Staff;
                entityId = staffId;
            } else {
                throw new Error("partyId or staffId is required");
            }

            // ✅ 2. FIXED QUERY (NO $or BUG)
            let query = {};
            if (partyId) {
                query = { partyId };
            } else {
                query = { staffId };
            }

            const lastEntry = await Transaction.findOne(query)
                .sort({ date: -1, createdAt: -1 })
                .session(session);

            // ✅ 3. Get Last Balance
            if (lastEntry) {
                lastBalance = lastEntry.runningBalance;
            } else {
                const entity = await entityModel.findById(entityId).session(session);
                lastBalance = entity?.openingBalance || entity?.currentBalance || 0;
            }

            // ✅ 4. Calculate Running Balance
            const debitVal = Number(debit) || 0;
            const creditVal = Number(credit) || 0;

            const newRunningBalance = lastBalance + debitVal - creditVal;

            // ✅ 5. Create Transaction
            const transaction = new Transaction({
                partyId,
                staffId,
                type,
                description: description?.toUpperCase(),
                debit: debitVal,
                credit: creditVal,
                runningBalance: newRunningBalance,
                paymentMode: paymentMode || "CREDIT",
                referenceId,
                performedBy,
                date: date || new Date()
            });

            await transaction.save({ session });

            // ✅ 6. Update Master Balance
            await entityModel.findByIdAndUpdate(
                entityId,
                { currentBalance: newRunningBalance },
                { session, new: true }
            );

            return transaction;

        } catch (error) {
            console.error("❌ Ledger Posting Error:", error);
            throw new Error("Failed to post ledger entry: " + error.message);
        }
    }

    /**
     * @desc Recalculate full balance (Audit / Fix tool)
     */
    async reSyncBalance(id, isStaff = false) {
        try {
            const query = isStaff ? { staffId: id } : { partyId: id };

            const transactions = await Transaction.find(query)
                .sort({ date: 1, createdAt: 1 });

            let runningBal = 0;

            const model = isStaff ? Staff : Party;
            const masterRecord = await model.findById(id);

            runningBal = masterRecord?.openingBalance || 0;

            for (const txn of transactions) {
                runningBal = runningBal + txn.debit - txn.credit;
                txn.runningBalance = runningBal;
                await txn.save();
            }

            await model.findByIdAndUpdate(id, {
                currentBalance: runningBal
            });

            return runningBal;

        } catch (error) {
            console.error("❌ ReSync Error:", error);
            throw error;
        }
    }
}

export default new LedgerService();