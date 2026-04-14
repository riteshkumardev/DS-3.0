// constants.js
/**
 * Global Constants & Configurations
 * Dharashakti Agro Products ERP
 */

export const ACCOUNT_TYPES = {
    PAYMENT_IN: 'PAYMENT_IN',
    PAYMENT_OUT: 'PAYMENT_OUT',
    SALE: 'SALE',
    PURCHASE: 'PURCHASE',
    SALARY: 'SALARY',
    REVERSAL: 'REVERSAL'
};

export const ROLES = {
    ADMIN: 'ADMIN',
    MANAGER: 'MANAGER',
    ACCOUNTANT: 'ACCOUNTANT',
    STAFF: 'STAFF'
};

export const EXPENSE_CATEGORIES = [
    'LOADING', 'UNLOADING', 'RASAN', 'WATER', 'MEDICAL', 
    'CA', 'ELECTRICAL', 'HARDWARE', 'STATIONARY', 
    'CONSTRUCTION', 'FUEL', 'SALARY', 'OTHER'
];

export const PAYMENT_MODES = ['CASH', 'BANK', 'UPI', 'CHEQUE'];

export const STOCK_TRANSACTION_TYPES = {
    INWARD: 'INWARD',
    OUTWARD: 'OUTWARD',
    RETURN_IN: 'RETURN_IN',
    RETURN_OUT: 'RETURN_OUT',
    WASTAGE: 'WASTAGE'
};

export const APP_CONFIG = {
    CURRENCY: 'INR',
    CURRENCY_SYMBOL: '₹',
    DEFAULT_GST_RATE: 5, // Agro products par aksar 5% hota hai
    COMPANY_NAME: 'DHARA SHAKTI AGRO PRODUCTS',
    FINANCIAL_YEAR_START_MONTH: 4 // April
};