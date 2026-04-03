import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import './ProfessionalPayslip.css';

const ProfessionalPayslip = ({ selectedEmp, stats, payroll, currentMonth }) => {
  // 🛡️ Guard Clause: Agar data loading state mein hai ya null hai
  if (!selectedEmp || !payroll || !stats) {
    return (
      <div className="no-print p-10 text-center text-zinc-400 font-bold uppercase tracking-widest">
        Generating Payslip Data... Please wait.
      </div>
    );
  }

  // ✅ Robust Date Parsing
  const getFormattedMonth = () => {
    try {
      // Agar currentMonth "2026-02" format mein hai
      const [year, month] = currentMonth.split("-");
      const dateObject = new Date(year, month - 1); 
      return dateObject.toLocaleString('default', { month: 'long', year: 'numeric' });
    } catch (e) {
      return "Invalid Period";
    }
  };

  const formattedMonth = getFormattedMonth();

  // ✅ Number to Words (Simple Fallback)
  const netAmount = Number(payroll?.netPayable) || 0;

  const qrData = `
    Staff: ${selectedEmp?.name}
    Period: ${formattedMonth}
    Net Pay: ₹${netAmount.toLocaleString()}
    Verified: Dhara Shakti Agro
  `.trim();

const handlePrint = () => {
    const printContent = document.getElementById("printablePayslip").innerHTML;
    const iframe = document.createElement('iframe');
    
    // Iframe ko chupa kar rakhein
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    
    // Saari CSS styles aur layout yahan define karein
    doc.open();
    doc.write(`
      <html>
        <head>
          <title>Payslip - ${selectedEmp.name}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; color: #333; }
            .payslip-wrapper { border: 1px solid #eee; padding: 20px; border-radius: 10px; }
            .header { display: flex; justify-content: space-between; border-bottom: 3px solid #065f46; padding-bottom: 20px; margin-bottom: 30px; }
            h1 { color: #065f46; margin: 0; font-size: 24px; font-weight: 900; }
            .address { font-size: 11px; color: #666; margin-top: 5px; }
            .payslip-title { background: #f4f4f5; padding: 5px 15px; border-radius: 5px; font-size: 14px; font-weight: 900; margin-top: 15px; display: inline-block; text-transform: uppercase; }
            .staff-info { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 30px; font-size: 13px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th { background: #f8fafc; text-align: left; padding: 12px; font-size: 11px; text-transform: uppercase; border: 1px solid #e4e4e7; }
            td { padding: 12px; font-size: 13px; border: 1px solid #e4e4e7; }
            .total-row { background: #ecfdf5; font-weight: bold; }
            .net-pay-box { background: #18181b; color: white; padding: 20px; border-radius: 15px; display: flex; justify-content: space-between; align-items: center; }
            .net-pay-box h3 { margin: 0; font-size: 18px; }
            .emerald-text { color: #10b981; }
            .signatures { display: flex; justify-content: space-between; margin-top: 60px; padding: 0 20px; }
            .sig-line { border-top: 1px solid #ccc; width: 150px; text-align: center; font-size: 10px; padding-top: 5px; }
            .disclaimer { text-align: center; font-size: 9px; color: #999; margin-top: 40px; border-top: 1px solid #eee; padding-top: 10px; font-style: italic; }
            @page { size: A4; margin: 0; }
          </style>
        </head>
        <body>
          <div class="payslip-wrapper">
            ${printContent}
          </div>
        </body>
      </html>
    `);
    doc.close();

    // Thoda delay taaki styles load ho jayein
    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      document.body.removeChild(iframe);
    }, 500);
  };

  return (
    <div className="payslip-container-main">
      {/* 1️⃣ Print Button */}
      <div className="no-print print-trigger-box" style={{ textAlign: 'center', margin: '20px 0' }}>
        <button className="view-btn-small print-action-btn" onClick={handlePrint} 
          style={{ background: '#10b981', color: 'white', padding: '10px 25px', borderRadius: '12px', fontWeight: '900', cursor: 'pointer', border: 'none' }}>
          🖨️ Print Employee Payslip
        </button>
      </div>

      {/* 2️⃣ Printable Content Area */}
      <div id="printablePayslip" className="payslip-wrapper bg-white p-8 text-zinc-900 border border-zinc-200 shadow-sm" style={{ width: '210mm', margin: '0 auto' }}>
        <div className="payslip-header-modern flex justify-between border-b-2 border-emerald-600 pb-5 mb-5">
          <div className="company-branding">
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '900', color: '#065f46' }}>DHARA SHAKTI AGRO PRODUCTS</h1>
            <p className="address-line text-xs text-zinc-500">Sri Pur Gahar, Khanpur, Samastipur, Bihar 848117 | +91 9088247314</p>
            <h2 className="payslip-title bg-zinc-100 px-3 py-1 rounded inline-block mt-3 text-sm font-black uppercase tracking-widest">
              PAY ADVICE - {formattedMonth}
            </h2>
          </div>
          <div className="qr-box text-center">
            <QRCodeSVG value={qrData} size={70} level="H" />
            <p style={{ fontSize: '8px', marginTop: '5px', fontWeight: 'bold' }}>SECURE VERIFIED</p>
          </div>
        </div>

        <div className="payslip-staff-info grid grid-cols-2 gap-10 mb-8 text-sm">
          <div className="info-col space-y-1">
            <p><b>Employee Name:</b> {selectedEmp?.name || "---"}</p>
            <p><b>Designation:</b> {selectedEmp?.designation || "---"}</p>
            <p><b>Employee ID:</b> {selectedEmp?.employeeId || 'DSA-STF-001'}</p>
          </div>
          <div className="info-col space-y-1 text-right">
            <p><b>Aadhar No:</b> {selectedEmp?.aadhar || "N/A"}</p>
            <p><b>Bank A/C:</b> {selectedEmp?.accountNo || 'XXXXXXXXXXXX'}</p>
            <p><b>Total Days Worked:</b> {stats?.effectiveDaysWorked || 0} Days</p>
          </div>
        </div>

        <table className="payslip-table-modern w-full border-collapse mb-8" style={{ border: '1px solid #e4e4e7' }}>
          <thead className="bg-zinc-50">
            <tr className="text-left text-xs uppercase font-black">
              <th className="p-3 border">Earnings Components</th>
              <th className="p-3 border">Amount (₹)</th>
              <th className="p-3 border">Deductions</th>
              <th className="p-3 border">Amount (₹)</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            <tr>
              <td className="p-3 border">Basic Salary (Earned)</td>
              <td className="p-3 border">{Number(payroll?.grossEarned || 0).toLocaleString()}</td>
              <td className="p-3 border">PF (Provident Fund)</td>
              <td className="p-3 border">{Number(payroll?.pfDeduction || 0).toLocaleString()}</td>
            </tr>
            <tr>
              <td className="p-3 border">Incentives & Bonus</td>
              <td className="p-3 border">{Number(payroll?.incentive || 0).toLocaleString()}</td>
              <td className="p-3 border">ESI (Medical Insurance)</td>
              <td className="p-3 border">{Number(payroll?.esiDeduction || 0).toLocaleString()}</td>
            </tr>
            <tr>
              <td className="p-3 border">Overtime Pay ({payroll?.overtimeHours || 0} Hrs)</td>
              <td className="p-3 border">{Math.round(payroll?.otEarning || 0).toLocaleString()}</td>
              <td className="p-3 border">Advances / Loan Adjust.</td>
              <td className="p-3 border text-red-500">-{Number(payroll?.totalAdvance || 0).toLocaleString()}</td>
            </tr>
            <tr className="payslip-total-row bg-emerald-50 font-black">
              <td className="p-3 border">Gross Earnings</td>
              <td className="p-3 border">₹{Number(payroll?.totalEarnings || 0).toLocaleString()}</td>
              <td className="p-3 border">Total Deductions</td>
              <td className="p-3 border text-red-600">₹{Number(payroll?.totalDeductions || 0).toLocaleString()}</td>
            </tr>
          </tbody>
        </table>

        <div className="payslip-footer-summary bg-zinc-900 text-white p-6 rounded-2xl flex justify-between items-center mb-10">
          <div className="net-pay-section">
            <h3 style={{ margin: 0, fontSize: '20px', letterSpacing: '-1px' }}>
              NET TAKE-HOME: <span className="text-emerald-400">₹{netAmount.toLocaleString()}</span>
            </h3>
            <p className="words text-[10px] opacity-70 mt-1 uppercase italic">Rupee {netAmount.toLocaleString()} Only</p>
          </div>
          <div className="verified-stamp border-2 border-emerald-500/30 px-4 py-1 rounded-full text-[10px] font-black text-emerald-400">
            SYSTEM GENERATED
          </div>
        </div>

        <div className="signatures flex justify-between px-5">
          <div className="sig-block text-center w-40">
            <div className="sig-line border-b border-zinc-400 mb-2"></div>
            <p className="text-[10px] font-bold">Employee Signature</p>
          </div>
          <div className="sig-block text-center w-40">
            <div className="sig-line border-b border-emerald-600 mb-2"></div>
            <p className="text-[10px] font-bold">Authorized Signatory</p>
          </div>
        </div>
        <p className="disclaimer text-center text-[8px] text-zinc-400 mt-12 italic border-t pt-2">
          This payslip is a computer-generated document of Dhara Shakti Agro Industries and does not require a physical stamp. [Generated on: {new Date().toLocaleString()}]
        </p>
      </div>
    </div>
  );
};

export default ProfessionalPayslip;