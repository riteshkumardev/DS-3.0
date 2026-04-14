import Party from "../models/Party.js";
import Transaction from "../models/Transaction.js";

/**
 * Professional Party Controller (Customers & Suppliers)
 * Dharashakti Agro Products ERP
 */

// 1. CREATE PARTY (Fixed for Nested Address)
export const createParty = async (req, res, next) => {
    try {
        const { name, phone, gstin, openingBalance, address, city, street, state, pincode } = req.body;

        // Duplicate Check
        const query = { $or: [{ phone }] };
        if (gstin) query.$or.push({ gstin });
        
        const exists = await Party.findOne(query);
        if (exists) {
            res.status(400);
            throw new Error("Party with this Phone or GSTIN already exists");
        }

        // Address object ko construct karein (agar frontend se direct object nahi aa raha)
        const partyAddress = {
            street: street || address || "", // Dono support karega
            city: city || 'Samastipur',
            state: state || 'Bihar',
            pincode: pincode || ""
        };

        const party = new Party({
            ...req.body,
            name: name.toUpperCase(),
            address: partyAddress, // Nested object yahan assign ho raha hai
            currentBalance: Number(openingBalance) || 0
        });

        const savedParty = await party.save();
        res.status(201).json({ success: true, data: savedParty });
    } catch (error) {
        next(error);
    }
};

// 2. GET ALL PARTIES (Search in nested fields)
export const getAllParties = async (req, res, next) => {
    try {
        const { type, search, city } = req.query;
        let query = {};

        if (type) query.partyType = type;

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
                { gstin: { $regex: search, $options: 'i' } },
                { "address.city": { $regex: search, $options: 'i' } } // Nested search
            ];
        }

        if (city) {
            query["address.city"] = { $regex: city, $options: 'i' };
        }

        const parties = await Party.find(query).sort({ name: 1 });
        
        res.status(200).json({ 
            success: true, 
            count: parties.length, 
            data: parties 
        });
    } catch (error) {
        next(error);
    }
};

// 3. GET PARTY BY ID
export const getPartyById = async (req, res, next) => {
    try {
        const party = await Party.findById(req.params.id);
        if (!party) {
            res.status(404);
            throw new Error("Party not found");
        }

        const recentTransactions = await Transaction.find({ partyId: party._id })
            .sort({ date: -1 })
            .limit(5);

        res.status(200).json({ 
            success: true, 
            data: party,
            recentActivity: recentTransactions
        });
    } catch (error) {
        next(error);
    }
};

// 4. UPDATE PARTY (Handling Nested Object)
export const updateParty = async (req, res, next) => {
    try {
        const { name, address, city, state, pincode, street, ...rest } = req.body;
        
        // Update object banayein
        let updateData = { ...rest };
        
        if (name) updateData.name = name.toUpperCase();
        
        // Agar address fields aa rahi hain, toh nested update karein
        if (address || city || street) {
            updateData.address = {
                street: street || address || "",
                city: city || "Samastipur",
                state: state || "Bihar",
                pincode: pincode || ""
            };
        }

        const updatedParty = await Party.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!updatedParty) {
            res.status(404);
            throw new Error("Party not found");
        }

        res.status(200).json({ success: true, data: updatedParty });
    } catch (error) {
        next(error);
    }
};

// 5. DELETE PARTY
export const deleteParty = async (req, res, next) => {
    try {
        const party = await Party.findById(req.params.id);
        if (!party) throw new Error("Party not found");

        const hasTransactions = await Transaction.exists({ partyId: party._id });
        if (hasTransactions) {
            res.status(400);
            throw new Error("Cannot delete party with transaction history.");
        }

        await Party.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: "Party removed successfully" });
    } catch (error) {
        next(error);
    }
};