// mathHelpers.js
/**
 * Professional Math Helpers for Financial Calculations
 * Dharashakti Agro Products ERP
 */

/**
 * @desc    Round numbers to a specific decimal place (Default: 2)
 * @param   {Number} value 
 * @param   {Number} decimals 
 */
export const roundTo = (value, decimals = 2) => {
    return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals) || 0;
};

/**
 * @desc    Calculate GST amount from taxable value
 * @param   {Number} taxableAmount 
 * @param   {Number} rate (Percentage e.g., 5, 12, 18)
 */
export const calculateGST = (taxableAmount, rate) => {
    const totalGST = (taxableAmount * rate) / 100;
    const splitGST = roundTo(totalGST / 2); // For CGST & SGST
    return {
        totalGST: roundTo(totalGST),
        splitGST: splitGST
    };
};

/**
 * @desc    Calculate Round-off value for a grand total
 * @param   {Number} total 
 * @returns {Object} { roundedTotal: 501, roundOffValue: 0.40 }
 */
export const calculateRoundOff = (total) => {
    const roundedTotal = Math.round(total);
    const roundOffValue = roundTo(roundedTotal - total);
    return {
        roundedTotal,
        roundOffValue
    };
};

/**
 * @desc    Calculate Profit Percentage
 * @param   {Number} cost 
 * @param   {Number} revenue 
 */
export const calculateMargin = (cost, revenue) => {
    if (revenue === 0) return 0;
    const profit = revenue - cost;
    return roundTo((profit / revenue) * 100);
};

/**
 * @desc    Safe Number conversion (Prevents NaN errors)
 */
export const toSafeNumber = (val) => {
    const num = parseFloat(val);
    return isNaN(num) ? 0 : num;
};