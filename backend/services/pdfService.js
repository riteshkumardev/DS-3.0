// pdfService.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
    Document,
    Packer,
    Paragraph,
    TextRun,
    Table,
    TableRow,
    TableCell
} from "docx"; // fallback support if needed

import { createWriteStream } from "fs";
import PDFDocument from "pdfkit";

/**
 * 🚀 Dharashakti ERP - PDF Service
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ===============================
// 🔹 COMMON PDF BUILDER
// ===============================
const createPDF = (filePath) => {
    const doc = new PDFDocument({ margin: 40 });
    const stream = createWriteStream(filePath);
    doc.pipe(stream);
    return { doc, stream };
};

// ===============================
// 🔹 1. SALE INVOICE PDF
// ===============================
export const generateSaleInvoicePDF = async (saleData) => {
    return new Promise((resolve, reject) => {
        try {
            const fileName = `invoice_${Date.now()}.pdf`;
            const filePath = path.join(__dirname, "../uploads", fileName);

            const { doc, stream } = createPDF(filePath);

            // ===============================
            // 🔹 HEADER
            // ===============================
            doc
                .fontSize(18)
                .text("DHARASHAKTI AGRO PRODUCTS", { align: "center" })
                .fontSize(10)
                .text("GSTIN: XXXXXXXX", { align: "center" })
                .moveDown();

            doc
                .fontSize(14)
                .text("SALE INVOICE", { align: "center", underline: true })
                .moveDown();

            // ===============================
            // 🔹 CUSTOMER DETAILS
            // ===============================
            doc.fontSize(10);
            doc.text(`Party: ${saleData.partyName}`);
            doc.text(`Date: ${saleData.date}`);
            doc.text(`Invoice No: ${saleData.invoiceNo}`);
            doc.moveDown();

            // ===============================
            // 🔹 TABLE HEADER
            // ===============================
            const tableTop = doc.y;

            const colX = [40, 200, 300, 380, 460];

            doc.fontSize(10).text("Item", colX[0], tableTop);
            doc.text("Qty", colX[1], tableTop);
            doc.text("Rate", colX[2], tableTop);
            doc.text("Amount", colX[3], tableTop);

            doc.moveDown();

            // ===============================
            // 🔹 TABLE ROWS
            // ===============================
            let y = tableTop + 20;

            saleData.items.forEach((item) => {
                doc.text(item.name, colX[0], y);
                doc.text(item.quantity.toString(), colX[1], y);
                doc.text(item.rate.toString(), colX[2], y);
                doc.text(item.amount.toString(), colX[3], y);
                y += 20;
            });

            doc.moveDown();

            // ===============================
            // 🔹 TOTAL
            // ===============================
            doc
                .fontSize(12)
                .text(`Total: ₹${saleData.total}`, { align: "right" });

            doc.moveDown();

            // ===============================
            // 🔹 FOOTER
            // ===============================
            doc
                .fontSize(10)
                .text("Thank you for your business!", { align: "center" });

            doc.end();

            stream.on("finish", () => {
                resolve({
                    filePath,
                    fileName
                });
            });

        } catch (error) {
            reject(error);
        }
    });
};

// ===============================
// 🔹 2. EXPENSE REPORT PDF
// ===============================
export const generateExpenseReportPDF = async (expenses) => {
    return new Promise((resolve, reject) => {
        try {
            const fileName = `expense_${Date.now()}.pdf`;
            const filePath = path.join(__dirname, "../uploads", fileName);

            const { doc, stream } = createPDF(filePath);

            doc
                .fontSize(16)
                .text("EXPENSE REPORT", { align: "center" })
                .moveDown();

            let total = 0;

            expenses.forEach((exp, index) => {
                doc.fontSize(10).text(
                    `${index + 1}. ${exp.title} | ₹${exp.amount} | ${exp.date}`
                );
                total += exp.amount;
            });

            doc.moveDown();
            doc.text(`Total Expense: ₹${total}`, { align: "right" });

            doc.end();

            stream.on("finish", () => {
                resolve({ filePath, fileName });
            });

        } catch (error) {
            reject(error);
        }
    });
};

// ===============================
// 🔹 3. STREAM PDF TO RESPONSE
// ===============================
export const sendPDF = (res, filePath, fileName) => {
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
};

// ===============================
// 🔹 4. CLEANUP (OPTIONAL)
// ===============================
export const deletePDF = (filePath) => {
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
};