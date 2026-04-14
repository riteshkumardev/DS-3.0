// invoiceNumber.js
/**
 * Professional Invoice Number Generator
 * Dharashakti Agro Products ERP
 */

const generateInvoiceNumber = (lastInvoiceNo, prefix = "DS") => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-12
    const currentYear = now.getFullYear();
    
    // 1. Calculate Financial Year (India: April to March)
    let financialYear = "";
    if (currentMonth >= 4) {
        financialYear = `${currentYear.toString().slice(-2)}-${(currentYear + 1).toString().slice(-2)}`;
    } else {
        financialYear = `${(currentYear - 1).toString().slice(-2)}-${currentYear.toString().slice(-2)}`;
    }

    // 2. Logic to increment number
    let nextNumber = 1;
    
    if (lastInvoiceNo) {
        // Purane number se serial nikalna (e.g., DS/26-27/005 -> 5)
        const parts = lastInvoiceNo.split('/');
        const lastSerial = parseInt(parts[parts.length - 1]);
        
        // Agar financial year wahi hai toh increment karein, warna reset to 1
        const lastFY = parts[1];
        if (lastFY === financialYear) {
            nextNumber = lastSerial + 1;
        }
    }

    // 3. Padding (e.g., 1 becomes 001)
    const paddedNumber = nextNumber.toString().padStart(3, '0');

    // Result: DS/26-27/001
    return `${prefix}/${financialYear}/${paddedNumber}`;
};

export default generateInvoiceNumber;