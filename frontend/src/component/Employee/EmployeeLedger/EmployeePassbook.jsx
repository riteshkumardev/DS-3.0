import React from 'react';
import { BookOpen, Printer, Calendar, ArrowRightCircle, IndianRupee, MinusCircle, PlusCircle } from "lucide-react";

const getDaysInMonth = (month) => {
  const [year, m] = month.split('-').map(Number);
  return new Date(year, m, 0).getDate();
};

const EmployeePassbook = ({ selectedEmp, availableMonths, fullAttendanceData, allPayments }) => {

  const generatePassbookRows = () => {
    let rows = [];
    let cumulativeBalance = 0;

    // 1. Pehle saare months ko purane se naye (Ascending) sort karein taaki balance sahi calculate ho
    const sortedMonths = [...availableMonths].sort((a, b) => new Date(a) - new Date(b));

    sortedMonths.forEach(month => {
      // --- A. Salary Calculation ---
      const monthlySalary = Number(selectedEmp.salary) || 0;
      const daysInMonth = getDaysInMonth(month);
      const dayRate = monthlySalary / daysInMonth;

      let p = 0, h = 0;
      Object.keys(fullAttendanceData || {}).forEach(date => {
        if (date.startsWith(month)) {
          if (fullAttendanceData[date] === "Present") p++;
          else if (fullAttendanceData[date] === "Half-Day") h++;
        }
      });

      const workedDays = p + (h * 0.5);
      const grossEarned = Math.round(dayRate * workedDays);

      // Salary entry tabhi add karein agar kaam kiya ho
      if (workedDays > 0) {
        cumulativeBalance += grossEarned;
        rows.push({
          date: `${month}-31`, // Mahine ke end ki date
          displayDate: new Date(month + "-01").toLocaleString('default', { month: 'short', year: 'numeric' }),
          description: `Salary (${workedDays} Days)`,
          type: 'EARNING',
          amount: grossEarned,
          balance: cumulativeBalance
        });
      }

      // --- B. Individual Advance Entries ---
      const monthlyAdvances = (allPayments || [])
        .filter(pay => pay.date?.substring(0, 7) === month)
        .sort((a, b) => new Date(a.date) - new Date(b.date)); // Date wise sort advances

      monthlyAdvances.forEach(adv => {
        cumulativeBalance -= Number(adv.amount || 0); // Advance se balance kam hota hai
        rows.push({
          date: adv.date,
          displayDate: new Date(adv.date).toLocaleDateString('en-IN'),
          description: `Advance Taken`,
          type: 'ADVANCE',
          amount: adv.amount,
          balance: cumulativeBalance
        });
      });
    });

    // 2. Display ke liye Naya upar (Descending) dikhane ke liye reverse karein
    return rows.reverse();
  };

  const passbookRows = generatePassbookRows();

  const handlePrint = () => {
    const printContent = document.getElementById("passbook-content").innerHTML;
    const fullHTML = `
      <html>
      <head>
      <title>Passbook - ${selectedEmp.name}</title>
      <style>
        body{ font-family: sans-serif; padding:40px; color: #18181b; }
        table{ width:100%; border-collapse:collapse; margin-top: 20px; }
        th,td{ border:1px solid #e4e4e7; padding:12px; font-size:12px; text-align: left; }
        th{ background:#f4f4f5; font-weight: bold; text-transform: uppercase; }
        .text-red{ color:#ef4444; }
        .text-emerald{ color:#10b981; }
        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #18181b; padding-bottom: 10px; }
      </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 style="margin:0">Employee Passbook</h1>
            <p style="margin:5px 0">Dhara Shakti Agro Management System</p>
          </div>
          <div style="text-align:right">
            <h3 style="margin:0">${selectedEmp.name}</h3>
            <p style="margin:5px 0">ID: ${selectedEmp.employeeId}</p>
          </div>
        </div>
        ${printContent}
      </body>
      </html>
    `;

    const blob = new Blob([fullHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const iframe = document.createElement('iframe');
    iframe.style.display = "none";
    iframe.src = url;
    document.body.appendChild(iframe);
    iframe.onload = () => {
      iframe.contentWindow.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
        URL.revokeObjectURL(url);
      }, 1000);
    };
  };

  return (
    <div className="mt-8 bg-white dark:bg-zinc-900 rounded-[2rem] shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
      
      {/* Header Section */}
      <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-800/30">
        <h3 className="font-black text-zinc-800 dark:text-zinc-100 flex items-center gap-2 uppercase tracking-tighter">
          <BookOpen className="text-emerald-600" size={20}/> Detailed Ledger
        </h3>
        <button 
          onClick={handlePrint} 
          className="flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all active:scale-95 shadow-lg"
        >
          <Printer size={16}/> Print Ledger
        </button>
      </div>

      {/* Table Section */}
      <div id="passbook-content" className="p-4 overflow-x-auto">
        <table className="w-full text-left border-separate border-spacing-y-2">
          <thead>
            <tr className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
              <th className="px-4 py-3">Date / Month</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3 text-right">Running Balance</th>
            </tr>
          </thead>
          <tbody className="text-xs font-bold">
            {passbookRows.map((row, index) => (
              <tr key={index} className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                <td className="px-4 py-4 dark:text-zinc-300 border-t border-zinc-50 dark:border-zinc-800 first:rounded-l-2xl">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-zinc-400" />
                    {row.displayDate}
                  </div>
                </td>
                <td className="px-4 py-4 dark:text-zinc-300 border-t border-zinc-50 dark:border-zinc-800">
                  <span className={`flex items-center gap-1 ${row.type === 'EARNING' ? 'text-emerald-600' : 'text-zinc-500'}`}>
                    {row.type === 'EARNING' ? <PlusCircle size={12}/> : <MinusCircle size={12}/>}
                    {row.description}
                  </span>
                </td>
                <td className={`px-4 py-4 border-t border-zinc-50 dark:border-zinc-800 ${row.type === 'EARNING' ? 'text-emerald-600' : 'text-red-500'}`}>
                  {row.type === 'EARNING' ? '+' : '-'} ₹{Math.abs(row.amount).toLocaleString()}
                </td>
                <td className="px-4 py-4 text-right border-t border-zinc-50 dark:border-zinc-800 last:rounded-r-2xl">
                  <span className={`px-3 py-1 rounded-full ${row.balance >= 0 ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'}`}>
                    ₹{row.balance.toLocaleString()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {passbookRows.length === 0 && (
          <div className="py-20 text-center opacity-20 italic text-zinc-500 uppercase tracking-widest text-xs font-black">
            No transaction history found
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-4 bg-zinc-50 dark:bg-zinc-800/20 border-t dark:border-zinc-800 flex items-center gap-2 text-[9px] font-black text-zinc-400 uppercase tracking-widest">
         <ArrowRightCircle size={12}/> Every advance entry is shown separately for transparency
      </div>
    </div>
  );
};

export default EmployeePassbook;