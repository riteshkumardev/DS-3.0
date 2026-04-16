import mongoose from "mongoose";
import Staff from "../models/Staff.js";
import Attendance from "../models/Attendance.js";
import Transaction from "../models/Transaction.js";
import ledgerService from "./ledgerService.js";

/**
 * 🚀 PROFESSIONAL PAYROLL SERVICE (FINAL)
 */
class PayrollService {

    /**
     * 🔧 VALIDATE INPUT
     */
    validate(month, year) {
        if (!month || month < 1 || month > 12) {
            throw new Error("Invalid month");
        }
        if (!year || year < 2000) {
            throw new Error("Invalid year");
        }
    }

    /**
     * @desc CALCULATE SALARY
     */
    async calculateMonthlySalary(staffId, month, year) {
        try {
            this.validate(month, year);

            const staff = await Staff.findById(staffId);
            if (!staff) throw new Error("Staff member not found");

            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0);

            // 🔥 Fetch attendance
            const attendanceRecords = await Attendance.find({
                staffId,
                date: { $gte: startDate, $lte: endDate }
            });

            // 🔥 REMOVE DUPLICATES (one record per day)
            const uniqueMap = new Map();
            attendanceRecords.forEach(a => {
                const key = new Date(a.date).toDateString();
                if (!uniqueMap.has(key)) {
                    uniqueMap.set(key, a);
                }
            });

            const records = Array.from(uniqueMap.values());

            const daysInMonth = endDate.getDate();

            let presentDays = 0;
            let halfDays = 0;
            let absentDays = 0;
            let overtimeHours = 0;

            records.forEach(a => {
                if (a.status === "PRESENT") presentDays++;
                else if (a.status === "HALF_DAY") halfDays++;
                else absentDays++;

                overtimeHours += Number(a.overtimeHours || 0);
            });

            const dailyRate = staff.baseSalary / daysInMonth;
            const workingDays = presentDays + (halfDays * 0.5);

            let grossSalary = dailyRate * workingDays;

            // 🔥 Overtime
            const otRate = (dailyRate / 8) * 1.5;
            const otAmount = overtimeHours * otRate;

            grossSalary += otAmount;

            // 🔥 ADVANCE ADJUSTMENT
            const advance = Number(staff.currentBalance || 0);
            const netSalary = Math.max(0, Math.round(grossSalary - advance));

            return {
                staffId,
                staffName: staff.name,
                baseSalary: staff.baseSalary,
                daysInMonth,
                presentDays,
                halfDays,
                absentDays,
                overtimeHours,
                otAmount: Math.round(otAmount),
                grossSalary: Math.round(grossSalary),
                advanceDeducted: advance,
                netSalary
            };

        } catch (error) {
            console.error("❌ Payroll Calculation Error:", error.message);
            throw error;
        }
    }

    /**
     * @desc PROCESS SALARY (SAFE + NO DUPLICATE)
     */
    async processSalaryPayment(data, performedBy) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const { staffId, amount, month, year, paymentMode, remarks } = data;

            this.validate(month, year);

            // 🔴 Prevent duplicate salary
            const existing = await Transaction.findOne({
                staffId,
                type: "SALARY",
                month,
                year
            }).session(session);

            if (existing) {
                throw new Error("Salary already processed for this month");
            }

            // 🔥 Ledger entry
            const description = `SALARY ${month}/${year} ${remarks || ""}`.toUpperCase();

            const txn = await ledgerService.postTransaction({
                staffId,
                type: "SALARY",
                credit: amount,
                description,
                paymentMode,
                month,
                year,
                performedBy,
                session
            });

            // 🔥 Reset advance after salary
            await Staff.findByIdAndUpdate(
                staffId,
                { currentBalance: 0 },
                { session }
            );

            await session.commitTransaction();
            session.endSession();

            return txn;

        } catch (error) {
            await session.abortTransaction();
            session.endSession();

            console.error("❌ Salary Processing Error:", error.message);
            throw error;
        }
    }

    /**
     * 📊 GET MONTHLY SUMMARY (NEW)
     */
    async getPayrollSummary(month, year) {
        this.validate(month, year);

        const result = await Transaction.aggregate([
            {
                $match: {
                    type: "SALARY",
                    month,
                    year
                }
            },
            {
                $group: {
                    _id: null,
                    totalSalaryPaid: { $sum: "$credit" },
                    totalEmployees: { $sum: 1 }
                }
            }
        ]);

        return result[0] || { totalSalaryPaid: 0, totalEmployees: 0 };
    }
}

export default new PayrollService();