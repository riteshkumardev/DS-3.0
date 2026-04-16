// attendanceController.js
import mongoose from "mongoose";
import Attendance from "../models/Attendance.js";
import Staff from "../models/Staff.js";
import logService from "../services/logService.js";

// 🔧 Helper
const toDateOnly = (dateStr) => {
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    return d;
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
            throw new Error("Attendance data & date required");
        }

        const formattedDate = toDateOnly(date);

        const operations = attendanceData.map((record) => ({
            updateOne: {
                filter: {
                    staffId: record.staffId,
                    date: formattedDate
                },
                update: {
                    $set: {
                        ...record,
                        date: formattedDate,
                        performedBy: req.user?._id
                    }
                },
                upsert: true
            }
        }));

        await Attendance.bulkWrite(operations, { session });

        await session.commitTransaction();
        session.endSession();

        // ✅ Audit log
        await logService.createLog({
            performedBy: req.user?._id,
            action: "BULK_MARK",
            module: "ATTENDANCE",
            remark: `Bulk attendance marked (${attendanceData.length} records)`,
            req,
        });

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

        if (!date) throw new Error("Date required");

        const formattedDate = toDateOnly(date);

        const records = await Attendance.find({ date: formattedDate })
            .populate("staffId", "name designation")
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
            throw new Error("staffId, month, year required");
        }

        const startDate = new Date(`${year}-${month}-01`);
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1);

        // ✅ Aggregation summary (FAST)
        const summaryAgg = await Attendance.aggregate([
            {
                $match: {
                    staffId: new mongoose.Types.ObjectId(staffId),
                    date: { $gte: startDate, $lt: endDate }
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
                        $sum: { $cond: [{ $eq: ["$status", "HALF_DAY"] }, 1, 0] }
                    },
                    OVERTIME_TOTAL: {
                        $sum: { $ifNull: ["$overtimeHours", 0] }
                    }
                }
            }
        ]);

        // Detailed data
        const attendance = await Attendance.find({
            staffId,
            date: { $gte: startDate, $lt: endDate }
        }).sort({ date: 1 }).lean();

        res.status(200).json({
            success: true,
            summary: summaryAgg[0] || {
                PRESENT: 0,
                ABSENT: 0,
                HALF_DAY: 0,
                OVERTIME_TOTAL: 0
            },
            data: attendance
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

        const startDate = new Date(`${year}-${month}-01`);
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1);

        const summary = await Attendance.aggregate([
            {
                $match: {
                    date: { $gte: startDate, $lt: endDate }
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
                        $sum: { $cond: [{ $eq: ["$status", "HALF_DAY"] }, 1, 0] }
                    }
                }
            },
            {
                $lookup: {
                    from: "staffs",
                    localField: "_id",
                    foreignField: "_id",
                    as: "staff"
                }
            },
            { $unwind: "$staff" }
        ]);

        res.status(200).json({
            success: true,
            data: summary
        });

    } catch (error) {
        next(error);
    }
};