import express from 'express';
const router = express.Router();

// Controller functions ko import karein
// Ensure karein ki file name aur extension sahi ho
import { addTransaction, getTransactionHistory } from '../controllers/transaction.controller.js';

/**
 * ✅ 1. Smart Transaction Add (With Sale/Purchase Sync)
 * Frontend URL: http://localhost:5000/api/transactions/add-with-sync
 * Is route se Supplier Balance, Ledger, aur Invoices teeno ek saath update honge.
 */
router.post('/add-with-sync', addTransaction);

/**
 * ✅ 2. Get Transaction History (Party-wise)
 * URL: http://localhost:5000/api/transactions/history/:id
 * Isse Ledger table mein saara data (Sales/Purchases/Payments) dikhne lagega.
 */
router.get('/history/:id', getTransactionHistory);

// Purana simple add route (Optional - for backward compatibility)
router.post('/add', addTransaction);

export default router;