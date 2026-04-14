// ledgerService.js
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
            description, paymentMode, referenceId, performedBy 
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
            const lastEntry = await Transaction.findOne({ 
                $or: [{ partyId }, { staffId }] 
            })
            .sort({ date: -1, createdAt: -1 })
            .session(session);

            if (lastEntry) {
                lastBalance = lastEntry.runningBalance;
            } else if (entityModel) {
                // Agar pehli transaction hai, toh Opening Balance check karein
                const entity = await entityModel.findById(entityId).session(session);
                lastBalance = entity?.openingBalance || 0;
            }

            // 3. Calculate New Running Balance
            // Logic: Balance + Debit (Lena hai) - Credit (Dena hai)
            const newRunningBalance = lastBalance + (debit || 0) - (credit || 0);

            // 4. Create Transaction Entry
            const transaction = new Transaction({
                partyId,
                staffId,
                type,
                description: description?.toUpperCase(),
                debit: debit || 0,
                credit: credit || 0,
                runningBalance: newRunningBalance,
                paymentMode,
                referenceId,
                performedBy,
                date: new Date()
            });

            await transaction.save({ session });

            // 5. Sync Current Balance in Master Model (Party or Staff)
            if (entityModel) {
                await entityModel.findByIdAndUpdate(
                    entityId, 
                    { currentBalance: newRunningBalance },
                    { session }
                );
            }

            return transaction;
        } catch (error) {
            console.error("Ledger Posting Error:", error);
            throw new Error("Failed to post ledger entry: " + error.message);
        }
    }

    /**
     * @desc    Calculate Party/Staff Balance from scratch (Re-sync)
     * @param   {String} id - Party or Staff ID
     */
    async reSyncBalance(id, isStaff = false) {
        const query = isStaff ? { staffId: id } : { partyId: id };
        const transactions = await Transaction.find(query).sort({ date: 1, createdAt: 1 });
        
        let runningBal = 0;
        // Business logic for re-calculation if needed
        // ... (This can be used for audit purposes)
    }
}

export default new LedgerService();