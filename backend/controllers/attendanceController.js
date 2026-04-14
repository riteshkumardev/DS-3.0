import Attendance from "../models/Attendance.js";
import Staff from "../models/Staff.js";

/**
 * Dharashakti Agro Products - Attendance Controller
 */

// 1. MARK BULK ATTENDANCE (Ek saath sabki haajri)
export const markBulkAttendance = async (req, res, next) => {
    try {
        const { attendanceData, date, performedBy } = req.body;

        if (!attendanceData || !Array.isArray(attendanceData) || !date) {
            res.status(400);
            throw new Error("Invalid data format. Attendance list and date are required.");
        }

        // Sabhi entries ko bulkWrite ke liye prepare karna
        const operations = attendanceData.map((record) => ({
            updateOne: {
                filter: { staffId: record.staffId, date: date },
                update: { 
                    $set: { 
                        ...record, 
                        date, 
                        performedBy,
                        employeeId: record.employeeId // Data consistency ke liye
                    } 
                },
                upsert: true // Agar record nahi hai to naya banaye, hai to update kare
            }
        }));

        await Attendance.bulkWrite(operations);

        res.status(200).json({
            success: true,
            message: `Attendance processed for ${attendanceData.length} employees on ${date}`
        });
    } catch (error) {
        next(error);
    }
};

// 2. GET DAILY ATTENDANCE (Check karne ke liye ki aaj kiski lag chuki hai)
export const getDailyAttendance = async (req, res, next) => {
  try {
    const { date } = req.query; // Format: YYYY-MM-DD
    const records = await Attendance.find({ date }).populate('staffId', 'name designation');
    
    res.status(200).json({
      success: true,
      data: records
    });
  } catch (error) {
    next(error);
  }
};

// 3. GET MONTHLY REPORT (Payroll calculation ke liye)
export const getMonthlyReport = async (req, res, next) => {
  try {
    const { staffId } = req.params;
    const { month, year } = req.query; // e.g., 04, 2026

    // Regex to match dates starting with YYYY-MM
    const datePattern = new RegExp(`^${year}-${month}`);

    const attendance = await Attendance.find({
      staffId,
      date: { $regex: datePattern }
    }).sort({ date: 1 });

    // Summary calculation
    const summary = {
      PRESENT: attendance.filter(a => a.status === 'PRESENT').length,
      ABSENT: attendance.filter(a => a.status === 'ABSENT').length,
      HALF_DAY: attendance.filter(a => a.status === 'HALF_DAY').length,
      OVERTIME_TOTAL: attendance.reduce((sum, a) => sum + (a.overtimeHours || 0), 0)
    };

    res.status(200).json({
      success: true,
      summary,
      data: attendance
    });
  } catch (error) {
    next(error);
  }
};