import { z } from 'zod';

/**
 * Professional Request Validation Middleware
 * Dharashakti Agro Products ERP 3.0
 */

const validate = (schema) => (req, res, next) => {
    try {
        schema.parse({
            body: req.body,
            query: req.query,
            params: req.params,
        });
        next();
    } catch (error) {
        let errorMessage = "Validation failed";
        
        if (error.errors && Array.isArray(error.errors)) {
            // Zod errors ko readable string mein convert karna
            errorMessage = error.errors
                .map((err) => `${err.path.join('.')} : ${err.message}`)
                .join(', ');
        } else {
            errorMessage = error.message;
        }
        
        return res.status(400).json({
            success: false,
            message: "Validation Error",
            error: errorMessage
        });
    }
};

// --- Validation Schemas ---

// 1. 🛡️ Auth/User Validation (Updated for Employee ID support)
export const userSchema = z.object({
    body: z.object({
        name: z.string().min(2, "Name is too short").optional(),
        // FIX: email validation ko string banaya taaki DS-XXXX accept ho sake
        email: z.string().min(4, "Identity/Email is too short"), 
        password: z.string().min(4, "Password must be at least 4 characters"),
        role: z.enum(['ADMIN', 'MANAGER', 'ACCOUNTANT', 'STAFF']).optional(),
        phone: z.string().optional()
    })
});

// 2. 💼 Staff/Employee Validation
export const staffSchema = z.object({
    body: z.object({
        name: z.string().min(3, "Name is too short"),
        phone: z.string().length(10, "Phone must be 10 digits"),
        aadhar: z.string().length(12, "Aadhar must be 12 digits"),
        salary: z.preprocess((val) => Number(val), z.number().positive("Salary must be positive")),
        designation: z.string().min(2, "Designation is required"),
        password: z.string().min(4, "Security PIN must be at least 4 digits")
    })
});

// 3. 🛒 Sale Validation
export const saleSchema = z.object({
    body: z.object({
        partyId: z.string().length(24, "Invalid Party ID"),
        goods: z.array(z.object({
            productId: z.string().length(24),
            quantity: z.number().positive(),
            rate: z.number().positive()
        })).min(1),
        paymentMode: z.enum(['CASH', 'UPI', 'BANK', 'CREDIT']),
        gstType: z.enum(['CGST/SGST', 'IGST']),
    })
});

export default validate;