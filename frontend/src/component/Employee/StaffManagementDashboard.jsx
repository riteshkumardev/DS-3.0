// Dashboard control page sample logic flows
import React, { useState } from "react";
import EmployeeTable from "./EmployeeTable";
import EmployeeAdd from "./EmployeeAdd";

export default function StaffManagementDashboard(user) {
  const [viewMode, setViewMode] = useState("TABLE"); // Modes: "TABLE", "FORM"
  const [editTargetData, setEditTargetData] = useState(null);
  const [viewTargetData, setViewTargetData] = useState(null);

  const openAddForm = () => {
    setEditTargetData(null);
    setViewTargetData(null);
    setViewMode("FORM");
  };

  const openEditForm = (empRowData) => {
    setEditTargetData(empRowData);
    setViewTargetData(null);
    setViewMode("FORM");
  };

  const openViewOnlyForm = (empRowData) => {
    setViewTargetData(empRowData);
    setEditTargetData(null);
    setViewMode("FORM");
  };

  const handleReturnToTable = () => {
    setViewMode("TABLE");
  };
console.log(user.user,"user");
console.log(user.role,"user");


  return (
    <div>
      {viewMode === "TABLE" ? (
        <EmployeeTable
user={user.user}
          onOpenAdd={openAddForm} 
          onOpenEdit={openEditForm}
          onOpenView={openViewOnlyForm} // Optional view hook integration
        />
      ) : (
        <EmployeeAdd 
        user={user}
          editData={editTargetData}
          viewData={viewTargetData}
          onCancel={handleReturnToTable}
          onEntrySaved={handleReturnToTable}
        />
      )}
    </div>
  );
}