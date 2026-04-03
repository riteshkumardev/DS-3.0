import React from "react";

const PartyDetails = ({ from, to }) => (
  <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed", marginTop: "10px" }}>
    <tbody>
      <tr>
        <th style={{ width: "50%", border: "1px solid #000", padding: "8px", background: "#f2f2f2" }}>From</th>
        <th style={{ width: "50%", border: "1px solid #000", padding: "8px", background: "#f2f2f2" }}>To</th>
      </tr>
      <tr>
        <td style={{ border: "1px solid #000", padding: "10px", verticalAlign: "top" }}>
          <b>{from.name}</b><br />
          GSTIN: {from.gst}<br />
          {from.address}
          <br />
          {" 7325055939, 8102720905"}
        </td>
        <td style={{ border: "1px solid #000", padding: "10px", verticalAlign: "top" }}>
          <b>{to.name}</b><br />
          GSTIN: {to.gst}<br />,
          {to.address} <br /> {to.phone}
        </td>
      </tr>
    </tbody>
  </table>
);

export default PartyDetails;