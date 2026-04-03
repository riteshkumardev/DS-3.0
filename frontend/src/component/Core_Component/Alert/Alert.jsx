import React from "react";
import "./Alert.css";

const Alert = ({ show, title, message, onClose }) => {
  if (!show) return null;

  return (
    <div className="alert-backdrop">
      <div className="alert-box">
        <div className="alert-icon">⚠️</div>

        <h2>{title}</h2>
        <p>{message}</p>

        <div className="alert-actions">
          <button className="btn cancel" onClick={onClose}>
            Cancel
          </button>
          <button className="btn ok" onClick={onClose}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default Alert;
