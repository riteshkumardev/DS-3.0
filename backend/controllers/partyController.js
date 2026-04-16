import mongoose from "mongoose";
import Party from "../models/Party.js";
import Transaction from "../models/Transaction.js";
import logService from "../services/logService.js";

// 🔧 Helpers
const normalize = (val) => (val ? val.toUpperCase().trim() : val);

// ==========================================
// 1. CREATE PARTY
// ==========================================
export const createParty = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        let { name, phone, gstin, openingBalance = 0 } = req.body;

        if (!name) throw new Error("Party name required");

        name = normalize(name);
        gstin = normalize(gstin);

        // ✅ Duplicate check
        const exists = await Party.findOne({
            $or: [{ phone }, { gstin }]
        });

        if (exists) {
            throw new Error("Party with phone or GSTIN already exists");
        }

        // ✅ Address
        const address = {
            street: req.body.street || req.body.address || "",
            city: req.body.city || "Samastipur",
            state: req.body.state || "Bihar",
            pincode: req.body.pincode || "",
        };

        // ✅ Create Party
        const party = await Party.create([{
            ...req.body,
            name,
            gstin,
            address,
            currentBalance: 0, // 🔴 always 0 (system controlled)
            performedBy: req.user?._id
        }], { session });

        let transaction = null;

        // ✅ Opening Balance Entry (IMPORTANT)
        if (openingBalance && Number(openingBalance) !== 0) {
            transaction = await Transaction.create([{
                partyId: party[0]._id,
                type: Number(openingBalance) > 0 ? "DEBIT" : "CREDIT",
                amount: Math.abs(openingBalance),
                source: "OPENING_BALANCE",
                date: new Date(),
                description: "Opening Balance",
                performedBy: req.user?._id,
            }], { session });
        }

        // ✅ Commit
        await session.commitTransaction();
        session.endSession();

        // ✅ Audit log
        await logService.createLog({
            performedBy: req.user?._id,
            action: "CREATE",
            module: "PARTY",
            documentId: party[0]._id,
            newValue: party[0],
            remark: `Party created - ${name}`,
            req,
        });

        res.status(201).json({
            success: true,
            data: party[0],
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        next(error);
    }
};

// ==========================================
// 2. GET ALL PARTIES
// ==========================================
export const getAllParties = async (req, res, next) => {
    try {
        const { type, search, city, isActive } = req.query;

        let query = {};

        if (type) query.partyType = type;

        if (isActive !== undefined) {
            query.isActive = isActive === "true";
        }

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { phone: { $regex: search, $options: "i" } },
                { gstin: { $regex: search, $options: "i" } },
                { "address.city": { $regex: search, $options: "i" } }
            ];
        }

        if (city) {
            query["address.city"] = { $regex: city, $options: "i" };
        }

        const parties = await Party.find(query)
            .sort({ name: 1 })
            .lean();

        res.status(200).json({
            success: true,
            count: parties.length,
            data: parties,
        });

    } catch (error) {
        next(error);
    }
};

// ==========================================
// 3. GET PARTY BY ID + LEDGER SUMMARY
// ==========================================
export const getPartyById = async (req, res, next) => {
    try {
        const party = await Party.findById(req.params.id).lean();
        if (!party) throw new Error("Party not found");

        const transactions = await Transaction.find({ partyId: party._id })
            .sort({ date: -1 })
            .limit(10)
            .lean();

        const balanceAgg = await Transaction.aggregate([
            { $match: { partyId: party._id } },
            {
                $group: {
                    _id: null,
                    balance: { $sum: "$amount" }
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: party,
            currentBalance: balanceAgg[0]?.balance || 0,
            recentTransactions: transactions,
        });

    } catch (error) {
        next(error);
    }
};

// ==========================================
// 4. UPDATE PARTY
// ==========================================
export const updateParty = async (req, res, next) => {
    try {
        const partyId = req.params.id;

        const oldParty = await Party.findById(partyId).lean();
        if (!oldParty) throw new Error("Party not found");

        // Normalize
        if (req.body.name) req.body.name = normalize(req.body.name);
        if (req.body.gstin) req.body.gstin = normalize(req.body.gstin);

        // ❗ Duplicate check (important)
        if (req.body.phone || req.body.gstin) {
            const duplicate = await Party.findOne({
                _id: { $ne: partyId },
                $or: [
                    { phone: req.body.phone },
                    { gstin: req.body.gstin }
                ]
            });

            if (duplicate) throw new Error("Duplicate phone or GSTIN");
        }

        // Address handling
        if (req.body.city || req.body.street || req.body.address) {
            req.body.address = {
                street: req.body.street || req.body.address || "",
                city: req.body.city || oldParty.address?.city,
                state: req.body.state || oldParty.address?.state,
                pincode: req.body.pincode || oldParty.address?.pincode,
            };
        }

        const updated = await Party.findByIdAndUpdate(
            partyId,
            { $set: req.body, performedBy: req.user?._id },
            { new: true, runValidators: true }
        );

        // ✅ Audit log
        await logService.createLog({
            performedBy: req.user?._id,
            action: "UPDATE",
            module: "PARTY",
            documentId: updated._id,
            oldValue: oldParty,
            newValue: updated,
            remark: `Party updated - ${updated.name}`,
            req,
        });

        res.status(200).json({
            success: true,
            data: updated,
        });

    } catch (error) {
        next(error);
    }
};

// ==========================================
// 5. DELETE PARTY (SOFT DELETE)
// ==========================================
export const deleteParty = async (req, res, next) => {
    try {
        const party = await Party.findById(req.params.id);
        if (!party) throw new Error("Party not found");

        const hasTransactions = await Transaction.exists({ partyId: party._id });

        if (hasTransactions) {
            // ❗ Soft delete
            party.isActive = false;
            await party.save();

            return res.status(200).json({
                success: true,
                message: "Party deactivated (transactions exist)",
            });
        }

        await Party.findByIdAndDelete(req.params.id);

        await logService.logDeletion(
            req.user?._id,
            "PARTY",
            party._id,
            party,
            req
        );

        res.status(200).json({
            success: true,
            message: "Party deleted",
        });

    } catch (error) {
        next(error);
    }
};