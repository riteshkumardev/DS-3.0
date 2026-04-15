import Transaction from "../models/Transaction.js";
import Party from "../models/Party.js";
import Staff from "../models/Staff.js";

/**
 * Professional Ledger Service
 * Dharashakti Agro Products ERP
 */
class LedgerService {
    
    /**
     * @desc    Post a transaction to the General Ledger
     * @param   {Object} data - Transaction details
     * @param   {Object} session - Mongoose session for atomic operations
     */
    async postTransaction(data, session = null) {
        const { 
            partyId, staffId, type, debit, credit, 
            description, paymentMode, referenceId, performedBy, date 
        } = data;

        try {
            let lastBalance = 0;
            let entityModel;
            let entityId;

            // 1. Identify Entity (Party or Staff)
            if (partyId) {
                entityModel = Party;
                entityId = partyId;
            } else if (staffId) {
                entityModel = Staff;
                entityId = staffId;
            }

            // 2. Get Last Running Balance
            // Hum hamesha latest entry check karenge balance calculate karne ke liye
            const lastEntry = await Transaction.findOne({ 
                $or: [{ partyId }, { staffId }] 
            })
            .sort({ date: -1, createdAt: -1 }) // Latest date and latest created record
            .session(session);

            if (lastEntry) {
                lastBalance = lastEntry.runningBalance;
            } else if (entityModel) {
                // Agar pehli transaction hai, toh Master model se balance uthayein
                const entity = await entityModel.findById(entityId).session(session);
                lastBalance = entity?.openingBalance || entity?.currentBalance || 0;
            }

            // 3. Calculate New Running Balance
            // Standard Accounting Logic: 
            // Assets/Receivables (Debit +) | Liability/Payables (Credit +)
            // Dharashakti Context: Balance + Debit (Udhari/Sales) - Credit (Payment/Purchases)
            const newRunningBalance = lastBalance + (Number(debit) || 0) - (Number(credit) || 0);

            // 4. Create Transaction Entry
            const transaction = new Transaction({
                partyId,
                staffId,
                type,
                description: description?.toUpperCase(),
                debit: Number(debit) || 0,
                credit: Number(credit) || 0,
                runningBalance: newRunningBalance,
                paymentMode: paymentMode || 'CREDIT',
                referenceId,
                performedBy,
                date: date || new Date() // Use actual transaction date instead of current time
            });

            await transaction.save({ session });

            // 5. Sync Current Balance in Master Model (Party or Staff)
            if (entityModel) {
                await entityModel.findByIdAndUpdate(
                    entityId, 
                    { currentBalance: newRunningBalance },
                    { session, new: true }
                );
            }

            return transaction;
        } catch (error) {
            console.error("Ledger Posting Error:", error);
            throw new Error("Failed to post ledger entry: " + error.message);
        }
    }

    /**
     * @desc    Calculate Party/Staff Balance from scratch (Audit/Re-sync)
     * @param   {String} id - Party or Staff ID
     */
    async reSyncBalance(id, isStaff = false) {
        const query = isStaff ? { staffId: id } : { partyId: id };
        
        // Purani date se lekar ab tak saari transactions uthayein
        const transactions = await Transaction.find(query).sort({ date: 1, createdAt: 1 });
        
        let runningBal = 0;
        
        // Pehle opening balance lein (Master record se)
        const model = isStaff ? Staff : Party;
        const masterRecord = await model.findById(id);
        runningBal = masterRecord?.openingBalance || 0;

        for (const txn of transactions) {
            runningBal = runningBal + txn.debit - txn.credit;
            txn.runningBalance = runningBal;
            await txn.save(); // Har entry ka balance theek karein
        }

        // Master balance update karein
        await model.findByIdAndUpdate(id, { currentBalance: runningBal });
        
        return runningBal;
    }
}

export default new LedgerService();