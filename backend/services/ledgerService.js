import Transaction from "../models/Transaction.js";
import Party from "../models/Party.js";
import Staff from "../models/Staff.js";

/**
 * 🚀 FINAL LEDGER SERVICE (BUG FIXED + HARDENED)
 */

class LedgerService {

    /**
     * 🔹 Normalize Transaction (AUTO FIX)
     */
    normalizeAmounts(type, debit, credit) {
        let d = Number(debit) || 0;
        let c = Number(credit) || 0;

        // PAYMENT_IN → always credit
        if (type === "PAYMENT_IN") {
            c = c || d;
            d = 0;
        }

        // PAYMENT_OUT → always debit
        if (type === "PAYMENT_OUT") {
            d = d || c;
            c = 0;
        }

        return {
            debit: Math.round(d * 100) / 100,
            credit: Math.round(c * 100) / 100
        };
    }

    /**
     * 🔹 Get Correct Party Type (FIXED CORE BUG)
     */
    getEntityType(entity) {
        const type = entity.type || entity.partyType;

        if (!type) {
            throw new Error("Party type missing (CUSTOMER / SUPPLIER required)");
        }

        return type.toUpperCase();
    }

    /**
     * 🔹 Calculate Running Balance (FIXED LOGIC)
     */
    calculateBalance(type, lastBalance, debit, credit) {
        if (type === "SUPPLIER") {
            // Supplier: Credit ↑ liability
            return lastBalance - debit + credit;
        }

        if (type === "CUSTOMER") {
            // Customer: Debit ↑ receivable
            return lastBalance + debit - credit;
        }

        throw new Error("Invalid party type");
    }

    /**
     * 🔹 POST TRANSACTION
     */
    async postTransaction(data, session = null) {
        try {
            const {
                partyId,
                staffId,
                type,
                description,
                paymentMode,
                referenceId,
                performedBy,
                date
            } = data;

            let { debit, credit } = data;

            // 1. ENTITY CHECK
            const entityModel = partyId ? Party : Staff;
            const entityId = partyId || staffId;

            if (!entityId) throw new Error("partyId or staffId required");

            const entity = await entityModel.findById(entityId).session(session);
            if (!entity) throw new Error("Entity not found");

            // 2. NORMALIZE
            const normalized = this.normalizeAmounts(type, debit, credit);
            const debitVal = normalized.debit;
            const creditVal = normalized.credit;

            if (debitVal === 0 && creditVal === 0) {
                throw new Error("Invalid transaction: both debit & credit are zero");
            }

            const lastBalance = Number(entity.currentBalance || 0);

            // 🔥 FIXED: SAFE TYPE FETCH
            const entityType = this.getEntityType(entity);

            // 🔥 FIXED: CORRECT BALANCE CALCULATION
            let newRunningBalance = this.calculateBalance(
                entityType,
                lastBalance,
                debitVal,
                creditVal
            );

            newRunningBalance = Math.round(newRunningBalance * 100) / 100;

            // 3. SAVE TRANSACTION
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

            // 4. UPDATE MASTER BALANCE
            entity.currentBalance = newRunningBalance;
            await entity.save({ session });

            return transaction;

        } catch (error) {
            console.error("❌ Ledger Error:", error.message);
            throw error;
        }
    }

    /**
     * 🔥 DELETE + RESYNC
     */
    async deleteByReference(referenceId, session = null) {
        try {
            const txns = await Transaction.find({ referenceId }).session(session);

            if (!txns.length) return true;

            const entityId = txns[0].partyId || txns[0].staffId;

            await Transaction.deleteMany({ referenceId }).session(session);

            await this.reSyncBalance(entityId, !txns[0].partyId, session);

            return true;

        } catch (error) {
            console.error("❌ Delete Error:", error.message);
            throw error;
        }
    }

    /**
     * 🔁 FULL RESYNC (CRITICAL FIX)
     */
    async reSyncBalance(id, isStaff = false, session = null) {
        try {
            const model = isStaff ? Staff : Party;
            const query = isStaff ? { staffId: id } : { partyId: id };

            const master = await model.findById(id).session(session);
            if (!master) throw new Error("Master not found");

            const entityType = this.getEntityType(master);

            const txns = await Transaction.find(query)
                .sort({ date: 1, createdAt: 1 })
                .session(session);

            let balance = Number(master.openingBalance || 0);

            for (const txn of txns) {
                balance = this.calculateBalance(
                    entityType,
                    balance,
                    txn.debit,
                    txn.credit
                );

                balance = Math.round(balance * 100) / 100;

                if (txn.runningBalance !== balance) {
                    txn.runningBalance = balance;
                    await txn.save({ session });
                }
            }

            master.currentBalance = balance;
            await master.save({ session });

            return balance;

        } catch (error) {
            console.error("❌ ReSync Error:", error.message);
            throw error;
        }
    }
}

export default new LedgerService();