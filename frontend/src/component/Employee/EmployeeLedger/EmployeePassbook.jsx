import React from 'react';
import { BookOpen, Printer, Calendar, ArrowRightCircle, PlusCircle, MinusCircle, FileText } from "lucide-react";

const getDaysInMonth = (month) => {
  const [year, m] = month.split('-').map(Number);
  return new Date(year, m, 0).getDate();
};

const EmployeePassbook = ({ selectedEmp, availableMonths, fullAttendanceData, allPayments }) => {

  const generatePassbookRows = () => {
    let rows = [];
    let cumulativeBalance = 0;

    // 1. Months ko purane se naye (Ascending) sort karein taaki balance correctly calculate ho
    const sortedMonths = [...availableMonths].sort((a, b) => new Date(a + "-01") - new Date(b + "-01"));

    sortedMonths.forEach(month => {
      // --- A. Monthly Salary Credit Logic ---
      const monthlySalary = Number(selectedEmp.baseSalary) || 0;
      const daysInMonth = getDaysInMonth(month);
      const dayRate = monthlySalary / daysInMonth;

      let p = 0, h = 0;
      Object.keys(fullAttendanceData || {}).forEach(date => {
        if (date.startsWith(month)) {
          const statusUpper = String(fullAttendanceData[date]).toUpperCase().trim();
          if (statusUpper === "PRESENT") p++;
          else if (statusUpper === "HALF_DAY" || statusUpper === "HALF-DAY") h++;
        }
      });

      const workedDays = p + (h * 0.5);
      const grossEarned = Math.round(dayRate * workedDays);

      // Salary credit entry (Agar mahine mein kaam kiya hai)
      if (workedDays > 0) {
        cumulativeBalance += grossEarned;
        rows.push({
          date: `${month}-28`, 
          displayDate: new Date(month + "-01").toLocaleString('default', { month: 'long', year: 'numeric' }),
          description: `Salary Credited (${workedDays} Days)`,
          voucherNo: "SYS-AUTO",
          type: 'EARNING',
          amount: grossEarned,
          balance: cumulativeBalance
        });
      }

      // --- B. Advance/Payments Debit Logic ---
      const monthlyAdvances = (allPayments || [])
        .filter(pay => {
          if (!pay.date) return false;
          return String(pay.date).substring(0, 7) === month;
        })
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      monthlyAdvances.forEach(adv => {
        cumulativeBalance -= Number(adv.amount || 0);
        
        // 🚀 BUG FIX: Agar backend se dynamically updated remark/description aaya hai to vahi use karein
        const dynamicDescription = adv.remark || adv.description || "Advance / Payment Taken";

        rows.push({
          date: adv.date,
          displayDate: new Date(adv.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
          description: dynamicDescription.toUpperCase(), // Text standardization inside ledger
          voucherNo: adv.billNo || "VCH-N/A", // 🚀 NEW FIELD: Voucher/Bill number extraction
          type: 'ADVANCE',
          amount: adv.amount,
          balance: cumulativeBalance
        });
      });
    });

    // 2. Display ke liye Naya record sabse upar (Descending)
    return rows.reverse();
  };

  const passbookRows = generatePassbookRows();

  // 🚀 PRINT SYSTEM OPTIMIZATION (Bina styles collapse kiye clean output data print karega)
  const handlePrint = () => {
    const sortedForPrint = [...passbookRows].reverse(); // Print hamesha oldest to newest standard passbook ki tarah hona chahiye
    
    let tableHtml = `
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Voucher No</th>
            <th>Description / Remarks</th>
            <th>Debit (Paid)</th>
            <th>Credit (Earned)</th>
            <th>Running Balance</th>
          </tr>
        </thead>
        <tbody>
    `;

    sortedForPrint.forEach(row => {
      tableHtml += `
        <tr>
          <td>${row.displayDate}</td>
          <td><strong>${row.voucherNo}</strong></td>
          <td>${row.description}</td>
          <td class="${row.type === 'ADVANCE' ? 'text-red' : ''}">${row.type === 'ADVANCE' ? '- ₹' + row.amount.toLocaleString() : '—'}</td>
          <td class="${row.type === 'EARNING' ? 'text-emerald' : ''}">${row.type === 'EARNING' ? '+ ₹' + row.amount.toLocaleString() : '—'}</td>
          <td style="font-weight: 900; background: #fbfbfb;">₹${row.balance.toLocaleString()}</td>
        </tr>
      `;
    });

    tableHtml += `</tbody></table>`;

    const win = window.open('', '', 'height=700,width=900');
    win.document.write(`
      <html>
        <head>
          <title>Passbook_${selectedEmp.employeeId}</title>
          <style>
            body { font-family: 'Segoe UI', system-ui, sans-serif; padding: 40px; color: #1c1917; }
            .header { border-bottom: 3px solid #059669; padding-bottom: 15px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: center; }
            .company-name { font-size: 24px; font-weight: 900; color: #059669; text-transform: uppercase; margin: 0; }
            .profile-block { text-align: right; font-size: 13px; line-height: 1.4; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #e7e5e4; padding: 10px 12px; font-size: 12px; text-align: left; }
            th { background: #f5f5f4; text-transform: uppercase; color: #44403c; font-weight: 800; font-size: 11px; tracking: 0.05em; }
            .text-emerald { color: #059669; font-weight: bold; }
            .text-red { color: #dc2626; font-weight: bold; }
            .footer { margin-top: 40px; font-size: 10px; color: #a8a29e; border-top: 1px solid #e7e5e4; padding-top: 10px; text-align: center; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 class="company-name">Dhara Shakti Agro Products</h1>
              <p style="margin: 4px 0 0 0; font-size: 14px; font-weight: 700; color: #44403c;">OFFICIAL EMPLOYEE PASSBOOK</p>
            </div>
            <div class="profile-block">
              <p style="margin: 0; font-size: 16px; font-weight: 900; color: #1c1917;">${selectedEmp.name.toUpperCase()}</p>
              <p style="margin: 2px 0;"><strong>ID:</strong> ${selectedEmp.employeeId}</p>
              <p style="margin: 0; font-size: 11px; color: #78716c;">DESIGNATION: ${selectedEmp.role || 'STAFF'}</p>
            </div>
          </div>
          ${tableHtml}
          <div class="footer">
            Generated on ${new Date().toLocaleString()} | Dharashakti ERP Internal Audit Ledger Statement
          </div>
        </body>
      </html>
    `);
    win.document.close();
    win.print();
  };

  return (
    <div className="mt-8 bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
      
      {/* Tool Header */}
      <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-800/30">
        <div>
          <h3 className="font-black text-zinc-800 dark:text-zinc-100 flex items-center gap-2 uppercase tracking-tighter">
            <BookOpen className="text-emerald-600" size={20}/> Financial Statement
          </h3>
          <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mt-0.5">Automated Transaction History</p>
        </div>
        <button 
          onClick={handlePrint} 
          className="flex items-center gap-2 px-6 py-2.5 bg-zinc-900 dark:bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg active:scale-95"
        >
          <Printer size={16}/> Print Statement
        </button>
      </div>

      {/* Ledger Table */}
      <div id="passbook-content" className="p-6 overflow-x-auto">
        <table className="w-full text-left border-separate border-spacing-y-2">
          <thead>
            <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
              <th className="px-6 py-4">Transaction Date</th>
              <th className="px-6 py-4">Voucher No</th>
              <th className="px-6 py-4">Description / Remark</th>
              <th className="px-6 py-4">Debit / Credit</th>
              <th className="px-6 py-4 text-right">Running Balance</th>
            </tr>
          </thead>
          <tbody className="text-xs font-bold">
            {passbookRows.map((row, index) => (
              <tr key={index} className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-all">
                <td className="px-6 py-5 dark:text-zinc-300 border-t border-zinc-50 dark:border-zinc-800 first:rounded-l-[1.5rem]">
                  <div className="flex items-center gap-3">
                    <Calendar size={14} className="text-zinc-400" />
                    {row.displayDate}
                  </div>
                </td>
                <td className="px-6 py-5 border-t border-zinc-50 dark:border-zinc-800 text-zinc-700 dark:text-zinc-400 font-mono text-[11px]">
                  {row.voucherNo}
                </td>
                <td className="px-6 py-5 dark:text-zinc-300 border-t border-zinc-50 dark:border-zinc-800">
                  <span className={`flex items-center gap-2 ${row.type === 'EARNING' ? 'text-emerald-600' : 'text-zinc-600 dark:text-zinc-300'}`}>
                    {row.type === 'EARNING' ? <PlusCircle size={14}/> : <FileText size={14} className="text-red-500/70" />}
                    {row.description}
                  </span>
                </td>
                <td className={`px-6 py-5 border-t border-zinc-50 dark:border-zinc-800 ${row.type === 'EARNING' ? 'text-emerald-600' : 'text-red-500'}`}>
                  {row.type === 'EARNING' ? '+' : '-'} ₹{Math.abs(row.amount).toLocaleString()}
                </td>
                <td className="px-6 py-5 text-right border-t border-zinc-50 dark:border-zinc-800 last:rounded-r-[1.5rem]">
                  <span className={`px-4 py-1.5 rounded-xl font-black ${row.balance >= 0 ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'}`}>
                    ₹{row.balance.toLocaleString()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {passbookRows.length === 0 && (
          <div className="py-24 text-center">
            <BookOpen size={48} className="mx-auto text-zinc-200 mb-4" />
            <p className="uppercase font-black tracking-widest text-zinc-400 text-[10px]">No transaction records found for this employee</p>
          </div>
        )}
      </div>

      {/* Footer Audit Note */}
      <div className="p-4 bg-zinc-50 dark:bg-zinc-800/20 border-t dark:border-zinc-800 flex items-center justify-center gap-3 text-[9px] font-black text-zinc-400 uppercase tracking-widest">
         <ArrowRightCircle size={14} className="text-emerald-500"/> This statement is auto-generated based on attendance and recorded advance payments.
      </div>
    </div>
  );
};

export default EmployeePassbook;