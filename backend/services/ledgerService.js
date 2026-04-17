import Transaction from "../models/Transaction.js";
import Party from "../models/Party.js";
import Staff from "../models/Staff.js";

/**
 * 🚀 FINAL LEDGER SERVICE (v3 - HARDENED)
 * Optimized for Dharashakti Agro Management System [cite: 1, 9]
 */
class LedgerService {

    // ===============================
    // NORMALIZE AMOUNTS
    // ===============================
    normalizeAmounts(type, debit, credit) {
        let d = Number(debit) || 0;
        let c = Number(credit) || 0;

        // Payment logic normalization
        if (type === "PAYMENT_IN") {
            c = c || d;
            d = 0;
        }
        if (type === "PAYMENT_OUT") {
            d = d || c;
            c = 0;
        }

        return {
            debit: Math.round(d * 100) / 100,
            credit: Math.round(c * 100) / 100
        };
    }

    // ===============================
    // GET ENTITY TYPE
    // ===============================
    getEntityType(entity) {
        // PartyType check for Supplier/Customer classification [cite: 10]
        const type = entity.partyType || entity.type;
        if (!type) throw new Error("Party type missing in Master");
        return type.toUpperCase();
    }

    // ===============================
    // BALANCE CALCULATION LOGIC
    // ===============================
    calculateBalance(type, lastBalance, debit, credit) {
        // SUPPLIER: Credit increases balance, Debit decreases it
        if (type === "SUPPLIER") {
            return lastBalance - debit + credit;
        }
        // CUSTOMER/BOTH: Debit increases balance, Credit decreases it
        if (type === "CUSTOMER" || type === "BOTH") {
            return lastBalance + debit - credit;
        }
        throw new Error("Invalid entity type for balance calculation");
    }

    // ===============================
    // POST TRANSACTION
    // ===============================
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
                date,
                billNo,      // Invoice tracking 
                goods        // Product-wise details (Name, Qty, Rate) 
            } = data;

            let { debit, credit } = data;

            const model = partyId ? Party : Staff;
            const entityId = partyId || staffId;

            if (!entityId) throw new Error("partyId or staffId is required");

            const entity = await model.findById(entityId).session(session);
            if (!entity) throw new Error("Entity master record not found");

            // NORMALIZE
            const { debit: d, credit: c } = this.normalizeAmounts(type, debit, credit);

            // ❌ BLOCK ZERO TRANSACTIONS
            if (d === 0 && c === 0) {
                throw new Error("Cannot post a zero-value transaction");
            }

            const lastBalance = Number(entity.currentBalance || 0);
            const entityType = this.getEntityType(entity);

            let newBalance = this.calculateBalance(entityType, lastBalance, d, c);
            newBalance = Math.round(newBalance * 100) / 100;

            const txn = new Transaction({
                partyId: partyId || null,
                staffId: staffId || null,
                billNo: billNo || "-", 
                type,
                description: description?.toUpperCase() || "TRANSACTION RECORDED",
                debit: d,
                credit: c,
                runningBalance: newBalance,
                paymentMode: paymentMode || "CREDIT",
                referenceId: referenceId || null,
                performedBy,
                date: date ? new Date(date) : new Date(),
                goods: goods || [] 
            });

            await txn.save({ session });

            // Update Master Balance
            entity.currentBalance = newBalance;
            await entity.save({ session });

            return txn;

        } catch (err) {
            console.error("❌ Ledger POST Error:", err.message);
            throw err;
        }
    }

    // ===============================
    // DELETE + RESYNC
    // ===============================
    async deleteByReference(referenceId, session = null) {
        try {
            const txns = await Transaction.find({ referenceId }).session(session);
            if (!txns.length) return true;

            const isStaff = !!txns[0].staffId;
            const entityId = txns[0].partyId || txns[0].staffId;

            await Transaction.deleteMany({ referenceId }).session(session);

            // Trigger re-sync to fix running balances of all subsequent entries
            await this.reSyncBalance(entityId, isStaff, session);
            return true;

        } catch (error) {
            console.error("❌ Ledger DELETE Error:", error.message);
            throw error;
        }
    }

    // ===============================
    // FULL RESYNC (THE BRAIN OF ACCURACY)
    // ===============================
    async reSyncBalance(id, isStaff = false, session = null) {
        try {
            const model = isStaff ? Staff : Party;
            const query = isStaff ? { staffId: id } : { partyId: id };

            const master = await model.findById(id).session(session);
            if (!master) throw new Error("Master record not found for resync");

            const entityType = this.getEntityType(master);

            // ✅ CRITICAL FIX: Sort by Date AND createdAt to handle multiple entries on same day
            const txns = await Transaction.find(query)
                .sort({ date: 1, createdAt: 1 }) 
                .session(session);

            let balance = Number(master.openingBalance || 0);

            for (const txn of txns) {
                // Skip broken or zero entries
                if (txn.debit === 0 && txn.credit === 0) continue;

                balance = this.calculateBalance(
                    entityType,
                    balance,
                    txn.debit,
                    txn.credit
                );

                balance = Math.round(balance * 100) / 100;

                // Sync runningBalance if discrepancy found
                if (txn.runningBalance !== balance) {
                    txn.runningBalance = balance;
                    await txn.save({ session });
                }
            }

            // Update final balance in master
            master.currentBalance = balance;
            await master.save({ session });

            return balance;

        } catch (error) {
            console.error("❌ Ledger RESYNC Error:", error.message);
            throw error;
        }
    }
}

export default new LedgerService();