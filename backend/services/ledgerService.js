import Transaction from "../models/Transaction.js";
import Party from "../models/Party.js";
import Staff from "../models/Staff.js";

/**
 * 🚀 FINAL LEDGER SERVICE (100% FIXED + HARDENED)
 */

class LedgerService {

    // ===============================
    // NORMALIZE
    // ===============================
    normalizeAmounts(type, debit, credit) {
        let d = Number(debit) || 0;
        let c = Number(credit) || 0;

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
    // ENTITY TYPE
    // ===============================
    getEntityType(entity) {
        const type = entity.partyType || entity.type;

        if (!type) throw new Error("Party type missing");

        return type.toUpperCase();
    }

    // ===============================
    // BALANCE CALCULATION
    // ===============================
    calculateBalance(type, lastBalance, debit, credit) {

        if (type === "SUPPLIER") {
            return lastBalance - debit + credit;
        }

        if (type === "CUSTOMER") {
            return lastBalance + debit - credit;
        }

        if (type === "BOTH") {
            return lastBalance + debit - credit;
        }

        throw new Error("Invalid party type");
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
                date
            } = data;

            let { debit, credit } = data;

            const model = partyId ? Party : Staff;
            const entityId = partyId || staffId;

            if (!entityId) throw new Error("partyId or staffId required");

            const entity = await model.findById(entityId).session(session);
            if (!entity) throw new Error("Entity not found");

            // NORMALIZE
            const { debit: d, credit: c } = this.normalizeAmounts(type, debit, credit);

            // ❌ BLOCK ZERO TRANSACTION
            if (d === 0 && c === 0) {
                throw new Error("Zero transaction blocked");
            }

            const lastBalance = Number(entity.currentBalance || 0);
            const entityType = this.getEntityType(entity);

            let newBalance = this.calculateBalance(entityType, lastBalance, d, c);
            newBalance = Math.round(newBalance * 100) / 100;

            const txn = new Transaction({
                partyId: partyId || null,
                staffId: staffId || null,
                type,
                description: description?.toUpperCase() || "NO DESCRIPTION",
                debit: d,
                credit: c,
                runningBalance: newBalance,
                paymentMode: paymentMode || "CREDIT",
                referenceId: referenceId || null,
                performedBy,
                date: date ? new Date(date) : new Date()
            });

            await txn.save({ session });

            entity.currentBalance = newBalance;
            await entity.save({ session });

            return txn;

        } catch (err) {
            console.error("❌ Ledger Error:", err.message);
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

            // ✅ FIXED
            await this.reSyncBalance(entityId, isStaff, session);

            return true;

        } catch (error) {
            console.error("❌ Delete Error:", error.message);
            throw error;
        }
    }

    // ===============================
    // FULL RESYNC (CRITICAL)
    // ===============================
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

                // ❌ SKIP ZERO BROKEN ENTRIES
                if (txn.debit === 0 && txn.credit === 0) continue;

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