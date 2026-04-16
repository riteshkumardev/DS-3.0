import { z } from "zod";

/**
 * 🚀 Dharashakti ERP - Validation Middleware (Production Ready)
 */

// ===============================
// 🔹 MAIN VALIDATION MIDDLEWARE
// ===============================
const validate = (schema) => (req, res, next) => {
    try {
        // ✅ safeParse (better than parse)
        const result = schema.safeParse({
            body: req.body,
            query: req.query,
            params: req.params
        });

        if (!result.success) {
            const formattedErrors = result.error.errors.map(err => ({
                field: err.path.join("."),
                message: err.message
            }));

            return res.status(400).json({
                success: false,
                message: "Validation Error",
                errors: formattedErrors
            });
        }

        // ✅ Sanitized data replace (important)
        req.body = result.data.body;
        req.query = result.data.query;
        req.params = result.data.params;

        next();

    } catch (error) {
        console.error("Validation Middleware Error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Internal Validation Error"
        });
    }
};

// ===============================
// 🔹 COMMON HELPERS
// ===============================

// ObjectId validation
const objectId = z.string().length(24, "Invalid ObjectId");

// Number coercion (string → number safe)
const numberField = z.preprocess(
    (val) => (val === "" || val === null ? undefined : Number(val)),
    z.number({ invalid_type_error: "Must be a number" })
);

// Optional number
const optionalNumber = numberField.optional();

// ===============================
// 🔐 AUTH / USER SCHEMA
// ===============================
export const userSchema = z.object({
    body: z.object({
        name: z.string().min(2, "Name too short").optional(),

        // Email OR Employee ID (DS-XXXX)
        email: z.string().min(4, "Identity required"),

        password: z.string().min(4, "Password must be at least 4 characters"),

        role: z.enum(["ADMIN", "MANAGER", "ACCOUNTANT", "STAFF"]).optional(),

        phone: z.string().regex(/^[0-9]{10}$/, "Phone must be 10 digits").optional()
    }).strict()
});

// ===============================
// 👨‍💼 STAFF SCHEMA
// ===============================
export const staffSchema = z.object({
    body: z.object({
        name: z.string().min(3, "Name too short"),

        phone: z.string().regex(/^[0-9]{10}$/, "Phone must be 10 digits"),

        aadhar: z.string().regex(/^[0-9]{12}$/, "Aadhar must be 12 digits"),

        salary: numberField.refine(val => val > 0, "Salary must be positive"),

        designation: z.string().min(2, "Designation required"),

        password: z.string().min(4, "PIN must be at least 4 digits")
    }).strict()
});

// ===============================
// 🛒 SALE SCHEMA
// ===============================
export const saleSchema = z.object({
    body: z.object({
        partyId: objectId,

        goods: z.array(
            z.object({
                productId: objectId,
                quantity: numberField.refine(v => v > 0, "Qty must be positive"),
                rate: numberField.refine(v => v > 0, "Rate must be positive")
            })
        ).min(1, "At least 1 item required"),

        paymentMode: z.enum(["CASH", "UPI", "BANK", "CREDIT"]),

        gstType: z.enum(["CGST/SGST", "IGST"]).optional(),

        logistics: z.object({
            freight: optionalNumber
        }).optional(),

        date: z.string().optional()
    }).strict()
});

// ===============================
// 🧾 PURCHASE SCHEMA
// ===============================
export const purchaseSchema = z.object({
    body: z.object({
        supplierId: objectId,
        billNo: z.string().min(1, "Bill number required"),
        grandTotal: numberField,

        paymentMode: z.enum(["CASH", "UPI", "BANK", "CREDIT"]).optional(),

        logistics: z.object({
            freight: optionalNumber
        }).optional(),

        purchaseDate: z.string().optional()
    }).strict()
});

// ===============================
// 💰 TRANSACTION SCHEMA
// ===============================
export const transactionSchema = z.object({
    body: z.object({
        partyId: objectId,
        type: z.enum(["PAYMENT_IN", "PAYMENT_OUT"]),
        amount: numberField.refine(v => v > 0, "Amount must be positive"),
        paymentMode: z.enum(["CASH", "UPI", "BANK"]).optional(),
        description: z.string().optional()
    }).strict()
});

// ===============================
// 📦 STOCK SCHEMA
// ===============================
export const stockSchema = z.object({
    body: z.object({
        productId: z.string(), // ObjectId OR HSN (flexible)
        productName: z.string().optional(),

        quantity: optionalNumber,
        totalQuantity: optionalNumber,

        type: z.enum([
            "INWARD",
            "OUTWARD",
            "SALE",
            "WASTAGE",
            "RETURN_IN",
            "RETURN_OUT"
        ]),

        rate: optionalNumber,
        remarks: z.string().optional()
    }).refine(
        (data) => data.quantity || data.totalQuantity,
        {
            message: "Quantity or TotalQuantity required",
            path: ["quantity"]
        }
    ).strict()
});

// ===============================
// 📅 ATTENDANCE SCHEMA
// ===============================
export const attendanceSchema = z.object({
    body: z.object({
        date: z.string(),
        attendanceData: z.array(
            z.object({
                staffId: objectId,
                status: z.enum(["PRESENT", "ABSENT", "HALF_DAY"]),
                overtimeHours: optionalNumber
            })
        ).min(1)
    }).strict()
});

// ===============================
// 📊 REPORT QUERY SCHEMA
// ===============================
export const reportSchema = z.object({
    query: z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        partyId: objectId.optional()
    })
});

// ===============================
export default validate;