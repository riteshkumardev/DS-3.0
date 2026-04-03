import Transaction from '../models/Transaction.js';
import Supplier from '../models/Supplier.js';
import Sale from '../models/Sale.js';
import Purchase from '../models/Purchase.js';
import ActivityLog from "../models/ActivityLog.js"; // ✅ Match Case (Capital A/L)
import mongoose from 'mongoose';

/* =============================================
    📜 Helper: Audit Logger
============================================= */
const logAudit = async (adminName, action, module = "TRANSACTION") => {
  try {
    await ActivityLog.create({
      adminName: adminName || "System",
      action: action,
      module: module,
    });
  } catch (err) {
    console.error("Audit Logging Failed:", err);
  }
};

/**
 * ✅ CREATE: Smart Transaction
 */
export const addTransaction = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction(); 

  try {
    const { partyId, amount, type, description, paymentMethod, linkTo, adminName, partyModel } = req.body;
    const transactionAmount = Number(amount);

    if (!partyId || transactionAmount <= 0) {
      throw new Error("Invalid Party ID or Amount");
    }

    // 1. Dynamic Party Fetch (Supplier ya Customer)
    // Agar partyModel 'Sale' hai toh Sale table se, varna Supplier table se
    const targetModel = partyModel === 'Sale' ? Sale : Supplier;
    const party = await targetModel.findById(partyId).session(session);
    
    if (!party) throw new Error("Database mein party nahi mili");

    // 2. Precise Balance Calculation
    const currentBalance = Number(party.currentBalance || party.totalOwed || 0);
    // IN (Paisa Aaya) -> Balance kam, OUT (Paisa Gaya) -> Balance badha
    const newBalance = type === 'IN' ? currentBalance - transactionAmount : currentBalance + transactionAmount;

    // 3. Create Ledger Entry
    const [tx] = await Transaction.create([{
      partyId: party._id,
      partyModel: partyModel || 'Supplier',
      partyName: party.name || party.customerName,
      amount: transactionAmount,
      type,
      description: description || `Manual Entry (${linkTo || 'General'})`,
      paymentMethod: paymentMethod || "Cash",
      remainingBalance: newBalance,
      date: new Date().toISOString().split('T')[0], // ✅ Consistent String Date
      refNo: linkTo || "GENERAL"
    }], { session });

    // 4. MASTER SYNC
    if (linkTo === 'sale' && type === 'IN') {
      const latestSale = await Sale.findById(partyId).session(session);
      if (latestSale) {
        latestSale.amountReceived = (Number(latestSale.amountReceived) || 0) + transactionAmount;
        await latestSale.save({ session });
      }
    } 
    else if (linkTo === 'purchase' && type === 'OUT') {
      const latestPurchase = await Purchase.findOne({ 
        supplierName: party.name, 
        $expr: { $gt: ["$totalAmount", "$paidAmount"] }
      }).sort({ createdAt: -1 }).session(session);

      if (latestPurchase) {
        latestPurchase.paidAmount = (Number(latestPurchase.paidAmount) || 0) + transactionAmount;
        await latestPurchase.save({ session });
      }
    }

    // 5. Update Master Balance
    party.currentBalance = newBalance;
    party.totalOwed = newBalance;
    await party.save({ session });

    // ✅ AUDIT LOG
    const actionDesc = `${type === 'IN' ? 'Received' : 'Paid'}: ₹${transactionAmount.toLocaleString()} - ${party.name || party.customerName}`;
    await logAudit(adminName, actionDesc, "TRANSACTION");

    await session.commitTransaction();
    res.status(201).json({ 
      success: true, 
      message: "Transaction successful ✅",
      updatedBalance: newBalance 
    });

  } catch (error) {
    await session.abortTransaction();
    console.error("Smart Sync Error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
};

/**
 * ✅ READ: Get Transaction History
 */

export const getTransactionHistory = async (req, res) => {
  try {
    const { id } = req.params; // Ye Supplier/Customer ki ID hai
    const { name } = req.query; // Frontend se Party ka Name bhi bhejiye (e.g. "MAA DURGA" ya "PARAS")

    if (!id) return res.status(400).json({ success: false, message: "ID missing" });

    // ✅ SMART QUERY: Pehle ID se dhoondo, agar nahi mile toh Name se dhoondo
    const history = await Transaction.find({
      $or: [
        { partyId: id },
        { partyId: new mongoose.Types.ObjectId(id) },
        { partyName: name } // Purane data ke liye Name matching
      ]
    }).sort({ date: -1, createdAt: -1 });

    if (!history || history.length === 0) {
      // Agar Transaction table mein kuch nahi mila, toh Sale/Purchase table se direct history dikhao
      const sales = await Sale.find({ customerName: name }).sort({ date: -1 });
      const purchases = await Purchase.find({ supplierName: name }).sort({ date: -1 });
      
      // Dono ko combine karke bhej sakte hain
      const combinedData = [...sales, ...purchases];
      
      return res.status(200).json({
        success: true,
        message: "Fetched from Sale/Purchase records",
        data: combinedData
      });
    }

    res.status(200).json({ success: true, data: history });
  } catch (error) {
    console.error("History Error:", error);
    res.status(500).json({ success: false, message: "History fetch failed" });
  }
};