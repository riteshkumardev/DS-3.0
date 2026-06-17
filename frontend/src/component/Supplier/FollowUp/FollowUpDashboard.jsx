import React, { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, Plus, Download } from 'lucide-react';
import { getActiveFollowUps, createFollowUp, updateLeadStatus } from '../../../api/leadApi';
import { fetchPartiesList } from '../../../api/partyApi';

// Sub Components Imports
import FollowUpForm from './FollowUpForm';
import FollowUpCard from './FollowUpCard';
import FollowUpTable from './FollowUpTable';

import Loader from "../../Core_Component/Loader/Loader";
import CustomSnackbar from "../../Core_Component/Snackbar/CustomSnackbar";

const FollowUpDashboard = () => {
  const [leads, setLeads] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedLeadId, setExpandedLeadId] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const initialFormState = {
    partyName: "",
    mobileNumber: "",
    address: "",
    remarks: "",
    status: "PENDING",
    followUpDate: new Date().toISOString().split('T')[0],
    actionTrigger: "DATE_BASED",
    routeLocation: ""
  };

  const [formData, setFormData] = useState(initialFormState);

  const showMsg = (msg, type = "success") => {
    setSnackbar({ open: true, message: msg, severity: type });
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [leadsRes, supRes] = await Promise.all([
        getActiveFollowUps(),
        fetchPartiesList('SUPPLIER')
      ]);
      if (leadsRes.data?.success) setLeads(leadsRes.data.data || []);
      if (supRes.data?.success) setSuppliers(supRes.data.data || []);
    } catch (err) {
      showMsg("Master synchronization pipelines failed to execute.", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCustomerSelect = (e) => {
    const val = e.target.value;
    if (!val) {
      setFormData(prev => ({ ...prev, partyName: "", mobileNumber: "", address: "" }));
      return;
    }
    if (val === "Local customer") {
      setFormData(prev => ({ ...prev, partyName: "LOCAL CUSTOMER", mobileNumber: "N/A", address: "LOCAL TRANSIT MARKET" }));
      return;
    }
    const matchedParty = suppliers.find(s => s.name === val);
    if (matchedParty) {
      let formattedAddress = "N/A";
      if (matchedParty.address) {
        if (typeof matchedParty.address === 'object') {
          const { street, city, state, pincode } = matchedParty.address;
          formattedAddress = [street, city, state, pincode].filter(Boolean).join(", ");
        } else {
          formattedAddress = String(matchedParty.address);
        }
      }
      setFormData(prev => ({
        ...prev,
        partyName: matchedParty.name,
        mobileNumber: matchedParty.phone || matchedParty.mobile || "N/A",
        address: formattedAddress.toUpperCase()
      }));
    }
  };

  const handleSubmitLead = async (e) => {
    e.preventDefault();
    if (!formData.partyName || !formData.remarks) return showMsg("Party Name and remarks are mandatory.", "warning");
    try {
      setSubmitLoading(true);
      const res = await createFollowUp(formData);
      if (res.data?.success) {
        showMsg("✅ Lead Action Registry Saved Complete!", "success");
        setFormData(initialFormState);
        setShowAddForm(false);
        const leadsRes = await getActiveFollowUps();
        if (leadsRes.data?.success) setLeads(leadsRes.data.data || []);
      }
    } catch (err) {
      showMsg("Failed to commit CRM payload record", "error");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleResolveStatus = async (id, currentStatus) => {
    try {
      setLoading(true);
      const targetStatus = currentStatus === "PENDING" ? "ORDER_RECEIVED" : "COMPLAINT_RESOLVED";
      const res = await updateLeadStatus(id, { status: targetStatus });
      if (res.data?.success) {
        showMsg(`✅ Transaction resolved as: ${targetStatus}`, "success");
        if (expandedLeadId === id) setExpandedLeadId(null);
        const leadsRes = await getActiveFollowUps();
        if (leadsRes.data?.success) setLeads(leadsRes.data.data || []);
      }
    } catch (err) {
      showMsg("Failed to execute status change operational patch.", "error");
    } finally {
      setLoading(false);
    }
  };

  // 🚀 FIXED PRINT ENGINE: Bypasses layout block completely via programmatic print injection
  const handleDownloadPDF = () => {
    if (leads.length === 0) {
      return showMsg("No actionable follow-up dataset logs present to generate report.", "warning");
    }

    showMsg("Generating isolated print compilation document...", "success");

    // Create a beautifully formatted HTML document string inside a separate browser environment scope
    let printContents = `
      <html>
        <head>
          <title>Dhara Shakti Agro Products - CRM Report</title>
          <style>
            body { font-family: sans-serif; padding: 20px; color: #1c1917; background-color: #ffffff; text-align: left; }
            .header { border-b: 4px solid #1c1917; padding-bottom: 15px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: flex-start; }
            .header h1 { font-size: 22px; font-weight: 900; margin: 0; text-transform: uppercase; letter-spacing: -0.05em; }
            .header p { font-size: 11px; font-weight: bold; color: #71717a; margin: 5px 0 0 0; text-transform: uppercase; }
            .meta-info { text-align: right; font-size: 11px; font-weight: bold; color: #52525b; line-height: 1.4; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th { background-color: #f4f4f5; color: #000000; font-weight: 900; border: 1px solid #000000; padding: 10px 8px; font-size: 11px; text-transform: uppercase; text-align: left; }
            td { border: 1px solid #e4e4e7; padding: 10px 8px; font-size: 11px; color: #18181b; font-weight: 600; text-align: left; }
            .sno { font-family: monospace; color: #71717a; }
            .party-title { font-weight: 900; font-size: 12px; text-transform: uppercase; }
            .badge { display: inline-block; font-size: 9px; font-weight: 900; background-color: #e0f2fe; color: #0369a1; padding: 2px 6px; rounded-radius: 4px; text-transform: uppercase; margin-top: 4px; }
            .remarks-box { text-transform: uppercase; font-size: 10.5px; background: #fafafa; padding: 6px; border-radius: 6px; border: 1px solid #f4f4f5; max-width: 300px; word-wrap: break-word; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1>DHARA SHAKTI AGRO PRODUCTS</h1>
              <p>CRM Follow-Up Ledger & Actionable Distribution Summary Report</p>
            </div>
            <div class="meta-info">
              <div>Date: ${new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}</div>
              <div>Active Reminders Count: ${leads.length}</div>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 5%">S.No.</th>
                <th style="width: 25%">Party Account Details</th>
                <th style="width: 25%">Destination Mapping / Route</th>
                <th style="width: 30%">Action Item Conversation Logs</th>
                <th style="width: 15%">Timeline / Trigger</th>
              </tr>
            </thead>
            <tbody>
              ${leads.map((lead, idx) => `
                <tr>
                  <td class="sno">${idx + 1}</td>
                  <td>
                    <div class="party-title">${lead.partyName}</div>
                    <div style="font-family: monospace; color: #71717a; margin-top: 2px;">${lead.mobileNumber}</div>
                  </td>
                  <td>
                    <div style="text-transform: uppercase;">${lead.address}</div>
                    ${lead.routeLocation ? `<div class="badge">Route: ${lead.routeLocation}</div>` : ''}
                  </td>
                  <td>
                    <div class="remarks-box">${lead.remarks}</div>
                  </td>
                  <td>
                    <div style="font-size: 10px; color: #71717a; text-transform: uppercase;">${lead.actionTrigger}</div>
                    <div style="font-size: 10px; color: #b45309; font-weight: bold; margin-top: 2px;">Target: ${lead.followUpDate ? String(lead.followUpDate).split('T')[0] : '—'}</div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    // Inject isolated data window scope execution 
    const printWindow = window.open('', '_blank');
    printWindow.document.open();
    printWindow.document.write(printContents);
    printWindow.document.close();

    // Trigger atomic native browser print engine on the new clean window context
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 350);
  };

  if (loading && leads.length === 0) return <Loader />;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-3 md:p-8 font-sans text-left transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* --- MAIN HEADER CONTROLLER --- */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-zinc-900 p-6 rounded-[2.5rem] shadow-xl border dark:border-zinc-800">
          <div>
            <h2 className="text-2xl font-black text-zinc-900 dark:text-white flex items-center gap-3 tracking-tight uppercase italic">
              <div className="p-2.5 bg-amber-500 rounded-xl text-white shadow-md">
                <AlertTriangle size={22} className="animate-pulse" />
              </div>
              CRM Lead & Order Tracker
            </h2>
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mt-1.5 ml-1">Automated dispatch reminders, client complaints & sales routing triggers</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <button
              onClick={handleDownloadPDF}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3.5 bg-zinc-900 dark:bg-zinc-100 hover:opacity-90 text-white dark:text-zinc-900 rounded-2xl font-black text-xs uppercase tracking-widest shadow-md transition-all active:scale-95"
            >
              <Download size={15} strokeWidth={3} /> Save PDF Report
            </button>
            
            <button 
              onClick={() => setShowAddForm(!showAddForm)}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3.5 ${showAddForm ? 'bg-zinc-700' : 'bg-emerald-600'} hover:opacity-90 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg transition-all active:scale-95`}
            >
              <Plus size={16} strokeWidth={3} /> {showAddForm ? "Close Input Panel" : "Create Follow-up"}
            </button>
          </div>
        </div>

        {/* --- FORM SUB-COMPONENT --- */}
        {showAddForm && (
          <FollowUpForm 
            formData={formData}
            handleInputChange={handleInputChange}
            handleCustomerSelect={handleCustomerSelect}
            suppliers={suppliers}
            handleSubmitLead={handleSubmitLead}
            submitLoading={submitLoading}
          />
        )}

        {/* --- CARDS GRID ALERTS SUB-COMPONENT --- */}
        <div className="space-y-4 text-left">
          <h3 className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-2">
            <AlertTriangle size={14} className="text-amber-500" /> Critical Pending Client Reminders Checklist ({leads.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {leads.map((lead) => (
              <FollowUpCard 
                key={lead._id}
                lead={lead}
                isExpanded={expandedLeadId === lead._id}
                toggleCardExpansion={setExpandedLeadId}
                handleResolveStatus={handleResolveStatus}
              />
            ))}
          </div>
        </div>

        {/* --- SYSTEM REGISTRY DATATABLE SUB-COMPONENT --- */}
        <FollowUpTable leads={leads} handleResolveStatus={handleResolveStatus} />

      </div>

      <CustomSnackbar open={snackbar.open} message={snackbar.message} severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })} />

      <style>{`
        .form-label-crm { font-size: 10px; font-weight: 900; text-transform: uppercase; color: #71717a; margin-left: 0.4rem; display: block; margin-bottom: 4px; }
        .form-input-crm { width: 100%; background: #f8fafc; border: 2px solid transparent; border-radius: 1.25rem; padding: 1rem 1.25rem; font-size: 0.85rem; outline: none; transition: all 0.3s; color: #1e293b; }
        .dark .form-input-crm { background: #18181b; color: white; border-color: #27272a; }
        .form-input-crm:focus { border-color: #f59e0b; background: white; }
        .dark .form-input-crm:focus { background: #09090b; }
      `}</style>
    </div>
  );
};

export default FollowUpDashboard;