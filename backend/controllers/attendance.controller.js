import Attendance from "../models/Attendance.js";
import Employee from "../models/epmloyee.js"; 
import ActivityLog from "../models/activityLog.js";

// Helper: Audit Logger
const logAudit = async (adminName, action, module = "ATTENDANCE") => {
  try {
    await ActivityLog.create({
      adminName: adminName || "System",
      action: action,
      module: module,
      createdAt: new Date()
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
      return res.status(400).json({ success: false, message: "Required fields missing." });
    }
    
    const time = new Date().toLocaleTimeString('en-IN', { 
      hour: '2-digit', minute: '2-digit', hour12: true 
    });

    const record = await Attendance.findOneAndUpdate(
      { 
        employeeId: employeeId.toString(), 
        date: date 
      },
      { status, time, name, employeeId: employeeId.toString() }, 
      { upsert: true, new: true }
    );

    await logAudit(adminName, `Attendance Marked: ${name} (${status}) on ${date}`);
    res.status(200).json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =============================================
    2️⃣ Mark Bulk Attendance
============================================= */
export const markBulkAttendance = async (req, res) => {
  try {
    const { employeeIds, startDate, endDate, status, adminName } = req.body;

    if (!employeeIds?.length || !startDate || !endDate || !status) {
      return res.status(400).json({ success: false, message: "Required fields are missing." });
    }

    let start = new Date(startDate);
    let end = new Date(endDate);
    let dateList = [];
    while (start <= end) {
      dateList.push(start.toISOString().split('T')[0]);
      start.setDate(start.getDate() + 1);
    }

    const employees = await Employee.find({ 
      employeeId: { $in: employeeIds.map(id => id.toString()) } 
    });
    
    const employeeMap = {};
    employees.forEach(emp => { employeeMap[emp.employeeId.toString()] = emp.name; });

    const operations = [];
    for (const empId of employeeIds) {
      const stringId = empId.toString();
      const empName = employeeMap[stringId] || "Unknown Employee";

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

    await logAudit(adminName, `Bulk Entry: ${employeeIds.length} staff marked ${status}`);
    res.json({ success: true, message: "Bulk attendance processed! ✅" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =============================================
    3️⃣ Get ALL Attendance (FOR STAFF REPORT) ✅ NEW
============================================= */
// Yeh function aapke PDF report mein "Working Days" calculate karega
export const getAllAttendance = async (req, res) => {
  try {
    const data = await Attendance.find({}).sort({ date: -1 });
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =============================================
    4️⃣ Get Daily Attendance
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
    5️⃣ Monthly Report (Employee-wise)
============================================= */
export const getEmployeeMonthlyReport = async (req, res) => {
  try {
    const { empId } = req.params;
    
    const data = await Attendance.find({
      employeeId: empId.toString()
    }).sort({ date: 1 });

    // Isko list format mein hi bhejna behtar hai React ke liye
    res.json({ success: true, data }); 
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};