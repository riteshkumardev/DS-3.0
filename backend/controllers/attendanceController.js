import mongoose from "mongoose";
import Attendance from "../models/Attendance.js";
import Staff from "../models/Staff.js";
import logService from "../services/logService.js";

/**
 * 🔧 CRITICAL TIMEZONE OFFSET FIXER
 * String formats ko bina UTC system shift kiye midnight zero timestamp standard deta hai
 * Taaki single document pipeline checks hamesha index key se correctly hit hon.
 */
const toDateOnly = (dateStr) => {
    if (!dateStr) return new Date();
    // Agar input sirf date string hai "YYYY-MM-DD" to direct structure split extraction use karenge
    const parts = String(dateStr).split('T')[0].split('-');
    if (parts.length === 3) {
        return new Date(Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 0, 0, 0, 0));
    }
    const d = new Date(dateStr);
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
};

// ==========================================
// 1. MARK BULK ATTENDANCE (SAFE + ATOMIC)
// ==========================================
export const markBulkAttendance = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { attendanceData, date } = req.body;

        if (!attendanceData || !Array.isArray(attendanceData) || !date) {
            res.status(400);
            throw new Error("Attendance data list and target date are completely mandatory");
        }

        const formattedDate = toDateOnly(date);

        const operations = attendanceData.map((record) => {
            if (!record.staffId) throw new Error("Document structure anomaly: staffId missing in payload array row.");
            
            return {
                updateOne: {
                    filter: {
                        staffId: new mongoose.Types.ObjectId(record.staffId),
                        date: formattedDate
                    },
                    update: {
                        $set: {
                            staffId: new mongoose.Types.ObjectId(record.staffId),
                            employeeId: record.employeeId,
                            status: String(record.status).toUpperCase().trim(), // Strict uppercase casting to match active enums
                            overtimeHours: Number(record.overtimeHours || 0),
                            remark: record.remark || "DAILY ENTRY",
                            date: formattedDate,
                            performedBy: req.user?._id || record.performedBy
                        }
                    },
                    upsert: true
                }
            };
        });

        await Attendance.bulkWrite(operations, { session });

        await session.commitTransaction();
        session.endSession();

        // ✅ Audit Logging Pipeline Trigger
        try {
            await logService.createLog({
                performedBy: req.user?._id,
                action: "BULK_MARK",
                module: "ATTENDANCE",
                remark: `Bulk workforce attendance processed successfully (${attendanceData.length} employees) on date ${date}`,
                req,
            });
        } catch (logError) {
            console.error("Audit logging bypassed, database main operation safe:", logError);
        }

        res.status(200).json({
            success: true,
            message: `Attendance saved for ${attendanceData.length} employees`
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        next(error);
    }
};

// ==========================================
// 2. GET DAILY ATTENDANCE
// ==========================================
export const getDailyAttendance = async (req, res, next) => {
    try {
        const { date } = req.query;

        if (!date) {
            res.status(400);
            throw new Error("Target date parameter query is required");
        }

        const formattedDate = toDateOnly(date);

        const records = await Attendance.find({ date: formattedDate })
            .populate("staffId", "name role baseSalary accountNo phone")
            .lean();

        res.status(200).json({
            success: true,
            count: records.length,
            data: records
        });

    } catch (error) {
        next(error);
    }
};

// ==========================================
// 3. MONTHLY REPORT (FAST + AGGREGATE)
// ==========================================
export const getMonthlyReport = async (req, res, next) => {
    try {
        const { staffId } = req.params;
        const { month, year } = req.query;

        if (!staffId || !month || !year) {
            res.status(400);
            throw new Error("Parameters missing: staffId, month, and year are required");
        }

        // Exact padded strings ensure matching date limits inside the UTC timeline
        const paddedMonth = String(month).padStart(2, '0');
        const startDate = new Date(Date.UTC(Number(year), Number(paddedMonth) - 1, 1, 0, 0, 0, 0));
        
        // Target dynamic ending range parameter definition safely
        const lastDay = new Date(Number(year), Number(paddedMonth), 0).getDate();
        const endDate = new Date(Date.UTC(Number(year), Number(paddedMonth) - 1, lastDay, 23, 59, 59, 999));

        // ✅ Aggregation summary pipeline optimized to handle case anomalies securely
        const summaryAgg = await Attendance.aggregate([
            {
                $match: {
                    staffId: new mongoose.Types.ObjectId(staffId),
                    date: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: null,
                    PRESENT: {
                        $sum: { $cond: [{ $eq: ["$status", "PRESENT"] }, 1, 0] }
                    },
                    ABSENT: {
                        $sum: { $cond: [{ $eq: ["$status", "ABSENT"] }, 1, 0] }
                    },
                    HALF_DAY: {
                        $sum: { $cond: [{ $or: [{ $eq: ["$status", "HALF_DAY"] }, { $eq: ["$status", "HALF-DAY"] }] }, 1, 0] }
                    },
                    OVERTIME_TOTAL: {
                        $sum: { $ifNull: ["$overtimeHours", 0] }
                    }
                }
            }
        ]);

        // Detailed statement list rendering source
        const attendanceRecords = await Attendance.find({
            staffId: new mongoose.Types.ObjectId(staffId),
            date: { $gte: startDate, $lte: endDate }
        }).sort({ date: 1 }).lean();

        // Safe client side layout map normalization fallback format loop
        const normalizedData = attendanceRecords.map(record => ({
            ...record,
            date: record.date instanceof Date ? record.date.toISOString().split('T')[0] : record.date
        }));

        res.status(200).json({
            success: true,
            summary: summaryAgg[0] || {
                PRESENT: 0,
                ABSENT: 0,
                HALF_DAY: 0,
                OVERTIME_TOTAL: 0
            },
            data: normalizedData
        });

    } catch (error) {
        next(error);
    }
};

// ==========================================
// 4. STAFF ATTENDANCE SUMMARY (ALL STAFF)
// ==========================================
export const getStaffAttendanceSummary = async (req, res, next) => {
    try {
        const { month, year } = req.query;

        if (!month || !year) {
            res.status(400);
            throw new Error("Month and Year queries are completely required for cross-reference statements");
        }

        const paddedMonth = String(month).padStart(2, '0');
        const startDate = new Date(Date.UTC(Number(year), Number(paddedMonth) - 1, 1, 0, 0, 0, 0));
        const lastDay = new Date(Number(year), Number(paddedMonth), 0).getDate();
        const endDate = new Date(Date.UTC(Number(year), Number(paddedMonth) - 1, lastDay, 23, 59, 59, 999));

        const summary = await Attendance.aggregate([
            {
                $match: {
                    date: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: "$staffId",
                    PRESENT: {
                        $sum: { $cond: [{ $eq: ["$status", "PRESENT"] }, 1, 0] }
                    },
                    ABSENT: {
                        $sum: { $cond: [{ $eq: ["$status", "ABSENT"] }, 1, 0] }
                    },
                    HALF_DAY: {
                        $sum: { $cond: [{ $or: [{ $eq: ["$status", "HALF_DAY"] }, { $eq: ["$status", "HALF-DAY"] }] }, 1, 0] }
                    }
                }
            },
            {
                $lookup: {
                    from: "staffs", // Confirm validation matches database physical collection lookup tag naming convention
                    localField: "_id",
                    foreignField: "_id",
                    as: "staff"
                }
            },
            { $unwind: { path: "$staff", preserveNullAndEmptyArrays: true } }
        ]);

        res.status(200).json({
            success: true,
            data: summary
        });

    } catch (error) {
        next(error);
    }
};