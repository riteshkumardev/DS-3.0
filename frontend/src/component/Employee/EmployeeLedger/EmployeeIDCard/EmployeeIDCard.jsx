import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Phone, MapPin, Calendar, Heart, ShieldCheck, Globe } from "lucide-react"; // Icons for back side
import './EmployeeIDCard.css';

const EmployeeIDCard = ({ selectedEmp }) => {
  if (!selectedEmp) return null;

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  const getPhotoURL = (photoPath) => {
    if (!photoPath) return "https://i.imgur.com/6VBx3io.png";
    return photoPath.startsWith('http') ? photoPath : `${API_URL}${photoPath}`;
  };

  const qrData = `Verified Employee\nID: ${selectedEmp.employeeId}\nName: ${selectedEmp.name}\nCompany: Dhara Shakti Agro`;

  const handlePrint = () => {
    const printContent = document.getElementById("printableIDCard").innerHTML;
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
      <html>
        <head>
          <title>ID Card - ${selectedEmp.name}</title>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; background: white; display: flex; justify-content: center; padding: 20px; }
            .id-card-visualizer { display: flex; gap: 30px; flex-wrap: wrap; }
            
            /* Card Base */
            .id-card { 
              width: 260px; height: 420px; border-radius: 20px; 
              overflow: hidden; position: relative; background: white; 
              border: 1px solid #e2e8f0;
              box-shadow: 0 10px 25px rgba(0,0,0,0.1); 
              -webkit-print-color-adjust: exact;
            }
            
            /* Header Styling */
            .card-header { background: linear-gradient(135deg, #064e3b 0%, #065f46 100%); color: white; padding: 20px 10px; text-align: center; border-bottom: 4px solid #fbbf24; }
            .company-name { font-size: 18px; font-weight: 900; letter-spacing: 1px; margin: 0; }
            .company-sub { font-size: 9px; font-weight: 700; opacity: 0.9; text-transform: uppercase; letter-spacing: 2px; }
            
            /* Photo Section */
            .photo-container { width: 110px; height: 110px; margin: 25px auto 15px; border-radius: 50%; border: 4px solid #065f46; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.2); }
            .photo-container img { width: 100%; height: 100%; object-fit: cover; }
            
            /* Front Text */
            .emp-details { text-align: center; padding: 0 15px; }
            .emp-name { font-size: 20px; font-weight: 900; color: #111827; margin: 5px 0; text-transform: uppercase; letter-spacing: -0.5px; }
            .emp-role { font-size: 13px; color: #059669; font-weight: 800; margin-bottom: 12px; text-transform: uppercase; }
            .id-pill { background: #f3f4f6; color: #374151; display: inline-block; padding: 5px 15px; border-radius: 30px; font-size: 11px; font-weight: 800; border: 1px solid #e5e7eb; }
            
            /* Back Side Content Fix */
            .back-content { padding: 25px 20px; height: 100%; display: flex; flex-direction: column; }
            .back-title { font-size: 12px; font-weight: 900; color: #065f46; border-bottom: 2px solid #fbbf24; display: inline-block; margin-bottom: 15px; padding-bottom: 2px; }
            .back-row { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; color: #374151; }
            .back-row strong { font-size: 10px; color: #6b7280; text-transform: uppercase; width: 80px; }
            .back-row span { font-size: 11px; font-weight: 700; flex: 1; }
            
            .qr-section { margin-top: auto; text-align: center; padding-bottom: 40px; }
            .qr-holder { display: inline-block; padding: 8px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; }
            .verify-text { font-size: 8px; font-weight: 800; color: #9ca3af; text-transform: uppercase; margin-top: 8px; letter-spacing: 1px; }
            
            .card-footer { position: absolute; bottom: 0; width: 100%; background: #064e3b; color: white; text-align: center; padding: 8px 0; font-size: 9px; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 5px; }
            
            @media print {
              body { padding: 0; margin: 0; }
              .id-card { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="id-card-visualizer">
            ${printContent}
          </div>
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      document.body.removeChild(iframe);
    }, 500);
  };

  return (
    <div className="id-card-generator-container">
      <div className="no-print" style={{ textAlign: 'center', marginBottom: '30px' }}>
        <button onClick={handlePrint} className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all active:scale-95 flex items-center gap-2 mx-auto">
          <ShieldCheck size={18} /> Print Premium ID Card
        </button>
      </div>

      <div id="printableIDCard" className="id-card-visualizer flex flex-wrap justify-center gap-10 p-10 bg-zinc-100 dark:bg-zinc-800/50 rounded-[4rem] border-2 border-dashed border-zinc-300 dark:border-zinc-700">
        
        {/* --- FRONT SIDE --- */}
        <div className="id-card front border-2 bg-white relative shadow-2xl" style={{ width: '260px', height: '420px', borderRadius: '20px', overflow: 'hidden' }}>
          <div className="card-header bg-emerald-900 p-6 text-center text-white border-b-4 border-amber-400">
            <h1 className="company-name text-lg font-black tracking-wider">DHARA SHAKTI</h1>
            <p className="company-sub text-[8px] tracking-[3px] font-bold opacity-80">Agro Products</p>
          </div>
          
          <div className="photo-container mx-auto my-8 w-28 h-28 rounded-full border-4 border-emerald-900 overflow-hidden shadow-xl ring-4 ring-emerald-50">
            <img 
              src={getPhotoURL(selectedEmp.photo)} 
              className="w-full h-full object-cover"
              alt="Profile" 
              onError={(e) => { e.target.src = "https://i.imgur.com/6VBx3io.png"; }}
            />
          </div>

          <div className="emp-details text-center">
            <h2 className="emp-name text-xl font-black text-zinc-900">{selectedEmp.name}</h2>
            <p className="emp-role text-xs font-bold text-emerald-600 tracking-widest uppercase">{selectedEmp.designation}</p>
            <div className="id-pill mt-2">ID: {selectedEmp.employeeId}</div>
          </div>

          <div className="card-footer absolute bottom-0 w-full bg-emerald-950 text-white text-center py-2 text-[10px] font-black tracking-widest uppercase">
             Employee Identity Card
          </div>
        </div>

        {/* --- BACK SIDE (FIXED & ATTRACTIVE) --- */}
        <div className="id-card back border-2 bg-white relative shadow-2xl" style={{ width: '260px', height: '420px', borderRadius: '20px', overflow: 'hidden' }}>
          <div className="back-content p-6 flex flex-col h-full">
            <div className="back-title text-[#064e3b] font-black text-sm border-b-2 border-amber-400 inline-block mb-6 uppercase">Personal Information</div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Calendar size={14} className="text-emerald-600" />
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-zinc-400 uppercase">Date of Birth</span>
                  <span className="text-xs font-black text-zinc-800">{selectedEmp.dob || '---'}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Heart size={14} className="text-red-500" />
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-zinc-400 uppercase">Blood Group</span>
                  <span className="text-xs font-black text-red-600">{selectedEmp.bloodGroup || 'N/A'}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Phone size={14} className="text-emerald-600" />
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-zinc-400 uppercase">Emergency Contact</span>
                  <span className="text-xs font-black text-zinc-800">{selectedEmp.phone}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin size={14} className="text-emerald-600 mt-1" />
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-zinc-400 uppercase">Office Address</span>
                  <span className="text-[10px] font-black text-zinc-600 leading-tight">Sri Pur Gahar, Khanpur,<br/>Samastipur, Bihar 848117</span>
                </div>
              </div>
            </div>
            
            <div className="qr-section mt-auto text-center mb-8">
              <div className="inline-block p-2 bg-zinc-50 rounded-2xl border border-zinc-200">
                <QRCodeSVG value={qrData} size={70} level="H" />
              </div>
              <p className="text-[8px] font-black text-zinc-400 uppercase mt-2 tracking-widest">Scan for Verification</p>
            </div>
          </div>
          <div className="card-footer absolute bottom-0 w-full bg-emerald-950 text-white text-center py-2 text-[9px] font-bold">
            <Globe size={10} /> www.dharashaktiagro.com
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeIDCard;