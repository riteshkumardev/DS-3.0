import Transaction from "../models/Transaction.js";
import Party from "../models/Party.js";
import Staff from "../models/Staff.js";

/**
 * 🚀 UPDATED LEDGER SERVICE (SCHEMA SYNCED)
 */
class LedgerService {

    // ===============================
    // NORMALIZE AMOUNTS
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
    // GET ENTITY TYPE
    // ===============================
    getEntityType(entity) {
        // Dhara Shakti ledger format ke hisaab se type check [cite: 7, 10]
        const type = entity.partyType || entity.type;
        if (!type) throw new Error("Party type missing");
        return type.toUpperCase();
    }

    // ===============================
    // BALANCE CALCULATION logic
    // ===============================
    calculateBalance(type, lastBalance, debit, credit) {
        // SUPPLIER ke liye credit balance badhta hai
        if (type === "SUPPLIER") {
            return lastBalance - debit + credit;
        }
        // CUSTOMER/BOTH ke liye debit balance badhta hai 
        if (type === "CUSTOMER" || type === "BOTH") {
            return lastBalance + debit - credit;
        }
        throw new Error("Invalid party type");
    }

    // ===============================
    // POST TRANSACTION (UPDATED WITH GOODS & BILL NO)
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
                billNo,      // ✅ Added for invoice tracking
                goods        // ✅ Added for product details in ledger
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
                billNo: billNo || "-", // ✅ Mapping bill number 
                type,
                description: description?.toUpperCase() || "NO DESCRIPTION",
                debit: d,
                credit: c,
                runningBalance: newBalance,
                paymentMode: paymentMode || "CREDIT",
                referenceId: referenceId || null,
                performedBy,
                date: date ? new Date(date) : new Date(),
                goods: goods || [] // ✅ Storing product info (Name, Qty, Rate)
            });

            await txn.save({ session });

            // Update Entity Balance
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

            // Re-sync balance after deletion
            await this.reSyncBalance(entityId, isStaff, session);
            return true;

        } catch (error) {
            console.error("❌ Delete Error:", error.message);
            throw error;
        }
    }

    // ===============================
    // FULL RESYNC (CRITICAL FOR ACCURACY)
    // ===============================
    async reSyncBalance(id, isStaff = false, session = null) {
        try {
            const model = isStaff ? Staff : Party;
            const query = isStaff ? { staffId: id } : { partyId: id };

            const master = await model.findById(id).session(session);
            if (!master) throw new Error("Master not found");

            const entityType = this.getEntityType(master);

            // Date aur Creation order dono se sort karna zaroori hai
            const txns = await Transaction.find(query)
                .sort({ date: 1, createdAt: 1 })
                .session(session);

            let balance = Number(master.openingBalance || 0);

            for (const txn of txns) {
                if (txn.debit === 0 && txn.credit === 0) continue;

                balance = this.calculateBalance(
                    entityType,
                    balance,
                    txn.debit,
                    txn.credit
                );

                balance = Math.round(balance * 100) / 100;

                // Agar DB balance match nahi karta to update karein
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