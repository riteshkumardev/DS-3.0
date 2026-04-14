// payrollService.js
import Staff from "../models/Staff.js";
import Attendance from "../models/Attendance.js";
import Transaction from "../models/Transaction.js";
import ledgerService from "./ledgerService.js";

/**
 * Professional Payroll & Salary Service
 * Dharashakti Agro Products ERP
 */
class PayrollService {
    
    /**
     * @desc    Calculate Monthly Salary based on Attendance & Advances
     * @param   {String} staffId 
     * @param   {Number} month (1-12)
     * @param   {Number} year
     */
    async calculateMonthlySalary(staffId, month, year) {
        try {
            const staff = await Staff.findById(staffId);
            if (!staff) throw new Error("Staff member not found");

            // 1. Get Date Range for the month
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0);

            // 2. Fetch Attendance Stats
            const attendanceRecords = await Attendance.find({
                staffId,
                date: { $gte: startDate, $lte: endDate }
            });

            const daysInMonth = endDate.getDate();
            const presentDays = attendanceRecords.filter(a => a.status === 'PRESENT').length;
            const halfDays = attendanceRecords.filter(a => a.status === 'HALF_DAY').length;
            const absentDays = attendanceRecords.filter(a => a.status === 'ABSENT').length;
            const overtimeHours = attendanceRecords.reduce((sum, a) => sum + (a.overtimeHours || 0), 0);

            // 3. Calculation Logic
            const dailyRate = staff.baseSalary / daysInMonth;
            const totalWorkingDays = presentDays + (halfDays * 0.5);
            
            let grossSalary = dailyRate * totalWorkingDays;
            
            // Overtime (Assuming double rate for OT or fixed - yahan hum 1.5x le rahe hain)
            const otRate = (dailyRate / 8) * 1.5; 
            const otAmount = overtimeHours * otRate;

            // 4. Final Calculation
            const netSalary = Math.round(grossSalary + otAmount);

            return {
                staffName: staff.name,
                baseSalary: staff.baseSalary,
                presentDays,
                halfDays,
                absentDays,
                overtimeHours,
                otAmount: Math.round(otAmount),
                netSalary,
                currentAdvance: staff.currentBalance // Staff model se advance balance uthayenge
            };
        } catch (error) {
            console.error("Payroll Calculation Error:", error);
            throw error;
        }
    }

    /**
     * @desc    Finalize and Post Salary to Ledger
     */
    async processSalaryPayment(data, performedBy) {
        const { staffId, amount, month, year, paymentMode, remarks } = data;

        // Session start karein (Transaction safety ke liye)
        // Yahan ledgerService khud session handle kar sakta hai
        
        const description = `SALARY FOR ${month}/${year} - ${remarks || ''}`;

        // Ledger Entry: Staff account ko Credit karein (Company ka kharcha)
        return await ledgerService.postTransaction({
            staffId,
            type: 'SALARY',
            credit: amount, // Liability/Expense for company
            description: description.toUpperCase(),
            paymentMode,
            performedBy
        });
    }
}

export default new PayrollService();