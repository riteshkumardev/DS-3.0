import Attendance from "../models/Attendance.js";
import Employee from "../models/Employee.js"; // ✅ Fixed Typo (epmloyee -> employee)
import ActivityLog from "../models/ActivityLog.js"; // ✅ Match Case (Capital A/L)
import mongoose from "mongoose";

/* =============================================
    📜 Helper: Audit Logger (Safe Load)
============================================= */
const logAudit = async (adminName, action, module = "ATTENDANCE") => {
  try {
    await ActivityLog.create({
      adminName: adminName || "System",
      action: action,
      module: module,
    });
  } catch (err) {
    console.error("Audit Logging Failed:", err);
  }
};

/* =============================================
    1️⃣ Mark Single Attendance (Upsert)
============================================= */
export const markAttendance = async (req, res) => {
  try {
    const { employeeId, date, status, name, adminName } = req.body;

    if (!employeeId || !date || !status) {
      return res.status(400).json({ success: false, message: "Details missing!" });
    }
    
    // Standard Time Format (en-IN)
    const time = new Date().toLocaleTimeString('en-IN', { 
      hour: '2-digit', minute: '2-digit', hour12: true 
    });

    const record = await Attendance.findOneAndUpdate(
      { 
        employeeId: employeeId.toString(), 
        date: date 
      },
      { 
        status, 
        time, 
        name: name?.trim(), 
        employeeId: employeeId.toString() 
      }, 
      { upsert: true, new: true, runValidators: true }
    );

    await logAudit(adminName, `Attendance: ${name} marked ${status} on ${date}`);
    res.status(200).json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =============================================
    2️⃣ Mark Bulk Attendance (Optimized)
============================================= */
export const markBulkAttendance = async (req, res) => {
  try {
    const { employeeIds, startDate, endDate, status, adminName } = req.body;

    if (!employeeIds?.length || !startDate || !endDate || !status) {
      return res.status(400).json({ success: false, message: "Required fields missing." });
    }

    // Generate Date List
    let start = new Date(startDate);
    let end = new Date(endDate);
    let dateList = [];
    while (start <= end) {
      dateList.push(start.toISOString().split('T')[0]);
      start.setDate(start.getDate() + 1);
    }

    // Fetch Employees in one go to get Names
    const employees = await Employee.find({ 
      employeeId: { $in: employeeIds.map(id => id.toString()) } 
    });
    
    const employeeMap = {};
    employees.forEach(emp => { 
      employeeMap[emp.employeeId.toString()] = emp.name; 
    });

    // Prepare Bulk Operations
    const operations = [];
    for (const empId of employeeIds) {
      const stringId = empId.toString();
      const empName = employeeMap[stringId] || "Staff Member";

      for (const dateStr of dateList) {
        operations.push({
          updateOne: {
            filter: { employeeId: stringId, date: dateStr },
            update: { 
              name: empName, 
              status, 
              time: "Bulk Entry",
              employeeId: stringId 
            },
            upsert: true
          }
        });
      }
    }

    if (operations.length > 0) {
      await Attendance.bulkWrite(operations, { ordered: false });
    }

    await logAudit(adminName, `Bulk Attendance: ${employeeIds.length} staff marked ${status}`);
    res.json({ success: true, message: `Attendance processed for ${operations.length} entries ✅` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =============================================
    3️⃣ Get Monthly Report (Employee-wise)
============================================= */
export const getEmployeeMonthlyReport = async (req, res) => {
  try {
    const { empId } = req.params;
    const { month, year } = req.query; // Filter by Month if needed

    let query = { employeeId: empId.toString() };
    
    // Optional: Date range filter (Agar frontend se month/year aaye)
    if (month && year) {
      const startOfMonth = `${year}-${month.padStart(2, '0')}-01`;
      const endOfMonth = `${year}-${month.padStart(2, '0')}-31`;
      query.date = { $gte: startOfMonth, $lte: endOfMonth };
    }

    const data = await Attendance.find(query).sort({ date: 1 });
    res.json({ success: true, data }); 
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =============================================
    4️⃣ Get Daily Status (Dashboard)
============================================= */
export const getDailyAttendance = async (req, res) => {
  try {
    const { date } = req.params;
    const data = await Attendance.find({ date }).sort({ name: 1 });
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =============================================
    5️⃣ Get ALL Attendance (Global Report)
============================================= */
export const getAllAttendance = async (req, res) => {
  try {
    const data = await Attendance.find({}).sort({ date: -1 }).limit(1000);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};