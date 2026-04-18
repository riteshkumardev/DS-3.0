import mongoose from "mongoose";
import ExcelJS from "exceljs";
import logger from "../utils/logger.js";

// Models
import Staff from "../models/Staff.js";
import Product from "../models/Product.js";
import Sale from "../models/Sale.js";
import Purchase from "../models/Purchase.js";
import Ledger from "../models/Ledger.js";
import StockLog from "../models/StockLog.js";

// ==========================================
// 🚀 1. GENERATE FULL JSON BACKUP
// ==========================================
export const generateBackup = async (req, res, next) => {
    try {
        const [staff, products, sales, purchases, ledgers, stockLogs] = await Promise.all([
            Staff.find({}),
            Product.find({}),
            Sale.find({}).populate('goods.productId'),
            Purchase.find({}).populate('goods.productId'),
            Ledger.find({}),
            StockLog.find({}).populate('productId')
        ]);

        const backupData = {
            appName: "Dharashakti Agro Management",
            version: "3.0",
            timestamp: new Date(),
            generatedBy: req.user?.name || "Master Admin",
            collections: {
                count: {
                    staff: staff.length,
                    products: products.length,
                    sales: sales.length,
                    purchases: purchases.length
                },
                data: { staff, products, sales, purchases, ledgers, stockLogs }
            }
        };

        logger.info(`💾 Master JSON Backup Exported by ${req.user?.name}`);

        res.status(200).json({
            success: true,
            message: "All collections compiled successfully",
            backupFile: backupData
        });
    } catch (error) {
        next(error);
    }
};

// ==========================================
// 📊 2. EXPORT TO EXCEL (Full System Report)
// ==========================================
export const exportToExcel = async (req, res, next) => {
    try {
        const workbook = new ExcelJS.Workbook();
        
        // --- 1. Products Sheet ---
        const prodSheet = workbook.addWorksheet('Inventory Master');
        prodSheet.columns = [
            { header: 'Product ID', key: 'id', width: 20 },
            { header: 'Name', key: 'name', width: 30 },
            { header: 'HSN', key: 'hsn', width: 15 },
            { header: 'Current Stock', key: 'stock', width: 15 },
            { header: 'Unit', key: 'unit', width: 10 }
        ];
        const products = await Product.find({});
        products.forEach(p => prodSheet.addRow({ id: p._id, name: p.name, hsn: p.hsnCode, stock: p.currentStock, unit: p.unit }));

        // --- 2. Sales Sheet ---
        const saleSheet = workbook.addWorksheet('Sales History');
        saleSheet.columns = [
            { header: 'Date', key: 'date', width: 15 },
            { header: 'Bill No', key: 'billNo', width: 15 },
            { header: 'Party Name', key: 'party', width: 30 },
            { header: 'Total Value', key: 'total', width: 15 },
            { header: 'Status', key: 'status', width: 12 }
        ];
        const sales = await Sale.find({});
        sales.forEach(s => saleSheet.addRow({ 
            date: s.date.toLocaleDateString(), 
            billNo: s.billNo, 
            party: s.partyName, 
            total: s.grandTotal, 
            status: s.status 
        }));

        // Logics for PDF/Excel download
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=DharaShakti_Master_Report.xlsx`);

        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        next(error);
    }
};

// ==========================================
// 📥 3. RESTORE BACKUP (JSON Injection)
// ==========================================
export const restoreBackup = async (req, res, next) => {
    try {
        const { backupFile } = req.body;

        if (!backupFile || !backupFile.collections) {
            throw new Error("Invalid format. Please upload valid Dharashakti Backup file.");
        }

        const { data } = backupFile.collections;

        // ⚠️ Clear current DB
        await Promise.all([
            Staff.deleteMany({}),
            Product.deleteMany({}),
            Sale.deleteMany({}),
            Purchase.deleteMany({}),
            Ledger.deleteMany({}),
            StockLog.deleteMany({})
        ]);

        // 💉 Inject Backup Data
        await Promise.all([
            Staff.insertMany(data.staff),
            Product.insertMany(data.products),
            Sale.insertMany(data.sales),
            Purchase.insertMany(data.purchases),
            Ledger.insertMany(data.ledgers),
            StockLog.insertMany(data.stockLogs)
        ]);

        logger.warn(`🚨 SYSTEM DATA RECOVERY COMPLETED by ${req.user?.name}`);

        res.status(200).json({
            success: true,
            message: "System successfully restored to timestamp: " + backupFile.timestamp
        });
    } catch (error) {
        next(error);
    }
};