import React from 'react';
import { FileText } from 'lucide-react';

const FollowUpForm = ({ formData, handleInputChange, handleCustomerSelect, suppliers, handleSubmitLead, submitLoading }) => {
  return (
    <div className="bg-white dark:bg-zinc-900 p-8 rounded-[3rem] shadow-2xl border border-zinc-200 dark:border-zinc-800 animate-in fade-in zoom-in-95 duration-200">
      <h3 className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-2 border-b dark:border-zinc-800 pb-4 mb-6">
        <FileText size={16} className="text-emerald-500" /> New Customer Engagement Matrix Entry
      </h3>
      <form onSubmit={handleSubmitLead} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="space-y-2">
          <label className="form-label-crm">Master Corporate Account Lookup *</label>
          <select onChange={handleCustomerSelect} className="form-input-crm font-bold text-xs" required>
            <option value="">-- Select Customer Account --</option>
            <option value="Local customer">Local customer</option>
            {suppliers.map(s => <option key={s._id} value={s.name}>{s.name}</option>)}
          </select>
        </div>

        <div className="space-y-2">
          <label className="form-label-crm">Verified Account Entity Name</label>
          <input type="text" name="partyName" value={formData.partyName} className="form-input-crm font-black uppercase" placeholder="AUTO-LOAD METRIC NAME" required readOnly />
        </div>

        <div className="space-y-2">
          <label className="form-label-crm">Reference Mobile Number</label>
          <input type="text" name="mobileNumber" value={formData.mobileNumber} onChange={handleInputChange} className="form-input-crm font-mono tracking-wider font-bold" placeholder="CONTACT REFERENCE" required />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="form-label-crm">Operational Plant Location / Target Address</label>
          <input type="text" name="address" value={formData.address} onChange={handleInputChange} className="form-input-crm uppercase" placeholder="FULL DESTINATION ADDR MAP FIELD" />
        </div>

        <div className="space-y-2">
          <label className="form-label-crm">Target Action/Call Reminder Timeline</label>
          <input type="date" name="followUpDate" value={formData.followUpDate} onChange={handleInputChange} className="form-input-crm font-bold" required />
        </div>

        <div className="space-y-2">
          <label className="form-label-crm">Action Matrix Processing Rule</label>
          <select name="actionTrigger" value={formData.actionTrigger} onChange={handleInputChange} className="form-input-crm font-black text-xs">
            <option value="DATE_BASED">DATE TIMELINE DISPATCH REMINDER</option>
            <option value="VEHICLE_ROUTE_BASED">ON TRANSIT FLEET REACH GATE ALERT</option>
            <option value="IMMEDIATE">CRITICAL TOP SPEED RUNTIME EVENT</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="form-label-crm">Target Fleet Route Intersection (Location)</label>
          <input type="text" name="routeLocation" value={formData.routeLocation} onChange={handleInputChange} className="form-input-crm uppercase font-black" placeholder="E.G. LAKHISARAI / DUMKA" />
        </div>

        <div className="space-y-2">
          <label className="form-label-crm">Engagement Mode Status Map</label>
          <select name="status" value={formData.status} onChange={handleInputChange} className="form-input-crm font-black text-xs">
            <option value="PENDING">PENDING ENGAGEMENT SYSTEM LOG</option>
            <option value="CALLBACK_REQUIRED">CALLBACK REQUIRED MONITOR</option>
          </select>
        </div>

        <div className="space-y-2 md:col-span-3">
          <label className="form-label-crm">Log Conversation Instruction Details / Action Items *</label>
          <textarea rows="2" name="remarks" value={formData.remarks} onChange={handleInputChange} className="form-input-crm uppercase text-xs" placeholder="SPECIFY DETAILED REMARKS..." required />
        </div>

        <div className="md:col-span-3 flex justify-end pt-2">
          <button 
            type="submit" 
            disabled={submitLoading} 
            className="px-14 py-4 bg-zinc-950 dark:bg-emerald-600 text-white font-black text-xs rounded-2xl uppercase tracking-widest hover:opacity-90 transition-all shadow-xl"
          >
            {submitLoading ? "DEPLOYING PARAMETERS..." : "Deploy Active Follow-Up"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FollowUpForm;