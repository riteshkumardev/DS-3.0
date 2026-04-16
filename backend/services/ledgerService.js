import Transaction from "../models/Transaction.js";
import Party from "../models/Party.js";
import Staff from "../models/Staff.js";

/**
 * 🚀 PROFESSIONAL LEDGER SERVICE (FIXED)
 * ✔ Correct Accounting Logic
 * ✔ Payment Validation
 * ✔ Supplier/Customer Handling
 * ✔ Safe Reverse & ReSync
 */

class LedgerService {

    /**
     * 🔹 Normalize Transaction (AUTO FIX BUGS)
     */
    normalizeAmounts(type, debit, credit) {
        let d = Number(debit) || 0;
        let c = Number(credit) || 0;

        // 🔥 AUTO FIX FOR PAYMENT BUG
        if (type === "PAYMENT_IN" && c === 0) {
            c = d || 0;
            d = 0;
        }

        if (type === "PAYMENT_OUT" && d === 0) {
            d = c || 0;
            c = 0;
        }

        return { debit: d, credit: c };
    }

    /**
     * @desc Post Transaction
     */
    async postTransaction(data, session = null) {
        try {
            const {
                partyId, staffId, type,
                description, paymentMode,
                referenceId, performedBy, date
            } = data;

            let { debit, credit } = data;

            // 1. ENTITY CHECK
            const entityModel = partyId ? Party : Staff;
            const entityId = partyId || staffId;

            if (!entityId) throw new Error("partyId or staffId required");

            const entity = await entityModel.findById(entityId).session(session);
            if (!entity) throw new Error("Entity not found");

            // 2. 🔥 FIX PAYMENT BUG AUTOMATICALLY
            const normalized = this.normalizeAmounts(type, debit, credit);
            const debitVal = normalized.debit;
            const creditVal = normalized.credit;

            if (debitVal === 0 && creditVal === 0) {
                throw new Error("Invalid Transaction: debit & credit both zero");
            }

            const lastBalance = Number(entity.currentBalance || 0);

            // 3. 🧠 PARTY TYPE LOGIC (VERY IMPORTANT)
            // Assume: entity.type = CUSTOMER | SUPPLIER
            let newRunningBalance = 0;

            if (entity.type === "SUPPLIER") {
                // Supplier: Credit increases liability
                newRunningBalance = lastBalance - debitVal + creditVal;
            } else {
                // Customer: Debit increases receivable
                newRunningBalance = lastBalance + debitVal - creditVal;
            }

            newRunningBalance = Math.round(newRunningBalance * 100) / 100;

            // 4. Nature
            const nature = debitVal > 0 ? "DEBIT" : "CREDIT";

            // 5. SAVE TRANSACTION
            const transaction = new Transaction({
                partyId: partyId || null,
                staffId: staffId || null,
                type,
                description: description?.toUpperCase() || "NO DESCRIPTION",
                debit: debitVal,
                credit: creditVal,
                runningBalance: newRunningBalance,
                nature,
                paymentMode: paymentMode || "CREDIT",
                referenceId: referenceId || null,
                performedBy: performedBy || null,
                date: date ? new Date(date) : new Date()
            });

            await transaction.save({ session });

            // 6. UPDATE MASTER
            entity.currentBalance = newRunningBalance;
            await entity.save({ session });

            return transaction;

        } catch (error) {
            console.error("❌ Ledger Error:", error.message);
            throw error;
        }
    }

    /**
     * 🔥 SAFE DELETE (REBUILD INSTEAD OF REVERSE)
     */
    async deleteByReference(referenceId, session = null) {
        try {
            const txns = await Transaction.find({ referenceId }).session(session);

            if (!txns.length) return true;

            const entityId = txns[0].partyId || txns[0].staffId;

            // Delete all
            await Transaction.deleteMany({ referenceId }).session(session);

            // 🔥 BEST PRACTICE: FULL RESYNC
            await this.reSyncBalance(entityId, !txns[0].partyId, session);

            return true;

        } catch (error) {
            console.error("❌ Delete Error:", error.message);
            throw error;
        }
    }

    /**
     * 🔁 FULL BALANCE REBUILD (ULTIMATE FIX)
     */
    async reSyncBalance(id, isStaff = false, session = null) {
        try {
            const model = isStaff ? Staff : Party;
            const query = isStaff ? { staffId: id } : { partyId: id };

            const master = await model.findById(id).session(session);
            if (!master) throw new Error("Master not found");

            const txns = await Transaction.find(query)
                .sort({ date: 1, createdAt: 1 })
                .session(session);

            let balance = Number(master.openingBalance || 0);

            for (const txn of txns) {
                if (master.type === "SUPPLIER") {
                    balance = balance - txn.debit + txn.credit;
                } else {
                    balance = balance + txn.debit - txn.credit;
                }

                balance = Math.round(balance * 100) / 100;

                const nature = txn.debit > 0 ? "DEBIT" : "CREDIT";

                if (txn.runningBalance !== balance || txn.nature !== nature) {
                    txn.runningBalance = balance;
                    txn.nature = nature;
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