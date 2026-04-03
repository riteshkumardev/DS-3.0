import React from "react";

const TaxInvoice = ({ data }) => {
  // Hardcoded data based on your specific requirements for format checking
  const invoiceData = data || {
    billNo: "PA/T/25-26/0458",
    date: "2-Jan-26",
    vehicleNo: "WB11D 8629",
    customerName: "ITC Limited Food Division (Panchla)",
    customerAddress: "Panchla Unit Mouza - Kulai , J.L No - 26, P.S - Panchla, District - Howrah",
    customerGSTIN: "19AAACI5950L1Z7",
    goods: [
      { sl: 1, desc: "RICE MEAL COARSE 65KG (NON BRANDED)", hsn: "11031900", qty: "23,075.00", rate: "28.45", per: "KGS", amt: "6,56,483.75" },
      { sl: 2, desc: "RICE MEAL FINE 65KG (NON BRANDED)", hsn: "11031900", qty: "1,950.00", rate: "28.45", per: "KGS", amt: "55,477.50" }
    ],
    totalAmt: "7,11,961.25"
  };

  return (
    <div className="invoice-wrapper">
      <style>
        {`
          .invoice-wrapper {
            width: 210mm;
            min-height: 290mm;
            padding: 5mm;
            margin: auto;
            background: #fff;
            font-family: 'Arial Narrow', Arial, sans-serif;
            font-size: 11px;
            color: #000;
            line-height: 1.3;
          }
          .main-border {
            border: 1.5px solid #000;
          }
          .title-center {
            text-align: center;
            font-weight: bold;
            border-bottom: 1.5px solid #000;
            padding: 2px;
            font-size: 12px;
          }
          .flex-container {
            display: flex;
            width: 100%;
          }
          .left-section {
            width: 50%;
            border-right: 1.5px solid #000;
          }
          .right-section {
            width: 50%;
          }
          .p-5 { padding: 5px; }
          
          /* Specific Borders for Sections */
          .border-b { border-bottom: 1px solid #000; }
          
          .info-row {
            display: flex;
            border-bottom: 1px solid #000;
            min-height: 35px;
          }
          .info-col {
            flex: 1;
            padding: 2px 5px;
            border-right: 1px solid #000;
          }
          .info-col:last-child { border-right: none; }

          .items-table {
            width: 100%;
            border-collapse: collapse;
            border-top: 1.5px solid #000;
          }
          .items-table th, .items-table td {
            border-right: 1px solid #000;
            padding: 4px 6px;
            text-align: center;
            vertical-align: top;
          }
          .items-table th { border-bottom: 1px solid #000; font-weight: normal; }
          .items-table .text-left { text-align: left; }
          .items-table .text-right { text-align: right; }
          .spacer-row { height: 200px; }

          .footer-section { border-top: 1.5px solid #000; }
          .bank-row { display: flex; border-top: 1px solid #000; }
          .bank-info { flex: 1; padding: 5px; font-size: 10px; }
          .decl-info { width: 55%; padding: 5px; font-size: 10px; border-right: 1px solid #000; }
          
          @media print { .no-print { display: none; } }
        `}
      </style>

      <div className="main-border">
        <div className="title-center">BILL OF SUPPLY (ORIGINAL FOR RECIPIENT)</div>

        <div className="flex-container">
          {/* LEFT: SELLER, CONSIGNEE, BUYER */}
          <div className="left-section">
            {/* Seller Section */}
            <div className="p-5 border-b">
              <strong style={{fontSize: '13px'}}>PITAMBARA AGROTECH PRODUCT</strong><br />
              Sankrail Industrial Park, Near Kothari Processor<br />
              Dhulagarh, Howrah-711302<br />
              FSSAI NO : 12821008000081<br />
              PAN : AAWFP6545M<br />
              GSTIN/UIN : 19AAWFP6545M1Z5<br />
              State Name : West Bengal, Code : 19<br />
              E-Mail : pitambaraagrotech@gmail.com
            </div>

            {/* Consignee (Ship to) - Your required border here */}
            <div className="p-5 border-b" style={{minHeight: '90px'}}>
              <span>Consignee (Ship to)</span><br />
              <strong>{invoiceData.customerName}</strong><br />
              {invoiceData.customerAddress}<br />
              GSTIN/UIN : {invoiceData.customerGSTIN}<br />
              State Name : West Bengal, Code : 19
            </div>

            {/* Buyer (Bill to) */}
            <div className="p-5" style={{minHeight: '90px'}}>
              <span>Buyer (Bill to)</span><br />
              <strong>{invoiceData.customerName}</strong><br />
              {invoiceData.customerAddress}<br />
              GSTIN/UIN : {invoiceData.customerGSTIN}<br />
              State Name : West Bengal, Code : 19
            </div>
          </div>

          {/* RIGHT: INVOICE DETAILS & TERMS */}
          <div className="right-section">
            <div className="info-row">
              <div className="info-col">Invoice No.<br/><strong>{invoiceData.billNo}</strong></div>
              <div className="info-col">Dated<br/><strong>{invoiceData.date}</strong></div>
            </div>
            <div className="info-row">
              <div className="info-col">Delivery Note<br/><strong>-</strong></div>
              <div className="info-col">Mode/Terms of Payment<br/><strong>BY BANK</strong></div>
            </div>
            <div className="info-row">
              <div className="info-col">Buyer's Order No.<br/><strong>-</strong></div>
              <div className="info-col">Dated<br/><strong>-</strong></div>
            </div>
            <div className="info-row">
              <div className="info-col">Dispatch Doc No.<br/><strong>-</strong></div>
              <div className="info-col">Delivery Note Date<br/><strong>-</strong></div>
            </div>
            <div className="info-row">
              <div className="info-col">Dispatched through<br/><strong>-</strong></div>
              <div className="info-col">Destination<br/><strong>-</strong></div>
            </div>
            <div className="info-row">
              <div className="info-col">Bill of Lading/LR-RR No.<br/><strong>-</strong></div>
              <div className="info-col">Motor Vehicle No.<br/><strong>{invoiceData.vehicleNo}</strong></div>
            </div>
            {/* Terms of Delivery - Right side khali jagah */}
            <div className="p-5" style={{height: '180px'}}>
              <strong>Terms of Delivery</strong>
            </div>
          </div>
        </div>

        {/* GOODS TABLE */}
        <table className="items-table">
          <thead>
            <tr>
              <th style={{width: '30px'}}>Sl No.</th>
              <th style={{width: '350px'}}>Description of Goods</th>
              <th>HSN/SAC</th>
              <th>Quantity</th>
              <th>Rate</th>
              <th>per</th>
              <th style={{borderRight: 'none'}}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoiceData.goods.map((g, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                <td className="text-left"><strong>{g.desc}</strong></td>
                <td>{g.hsn}</td>
                <td><strong>{g.qty} KGS</strong></td>
                <td>{g.rate}</td>
                <td>{g.per}</td>
                <td className="text-right" style={{borderRight: 'none'}}>{g.amt}</td>
              </tr>
            ))}
            <tr className="spacer-row">
              <td></td><td></td><td></td><td></td><td></td><td></td><td style={{borderRight: 'none'}}></td>
            </tr>
            <tr style={{borderTop: '1.5px solid #000', fontWeight: 'bold'}}>
              <td colSpan="3" className="text-right">Total</td>
              <td>25,025.00 KGS</td>
              <td colSpan="2"></td>
              <td className="text-right" style={{borderRight: 'none'}}>₹ {invoiceData.totalAmt}</td>
            </tr>
          </tbody>
        </table>

        {/* FOOTER */}
         {/* --- FOOTER SECTION (Updated as per your request) --- */}
        <div className="footer-section">
          <div className="p-5">
            Amount Chargeable (in words)<br />
            <strong style={{textTransform: 'uppercase'}}>INR Seven Lakh Eleven Thousand Nine Hundred Sixty One Only</strong>
          </div>

          {/* HSN/SAC Box with Border */}
          <table className="hsn-tax-table">
            <tr style={{textAlign: 'center', fontWeight: 'bold'}}>
              <td style={{width: '70%'}}>HSN/SAC</td>
              <td style={{borderRight: 'none'}}>Taxable Value</td>
            </tr>
            <tr>
              <td style={{textAlign: 'center'}}>11031900</td>
              <td style={{textAlign: 'right', borderRight: 'none'}}>{data?.totalAmount || "7,11,961.25"}</td>
            </tr>
            <tr style={{fontWeight: 'bold'}}>
              <td style={{textAlign: 'right'}}>Total</td>
              <td style={{textAlign: 'right', borderRight: 'none'}}>{data?.totalAmount || "7,11,961.25"}</td>
            </tr>
          </table>

          <div className="p-5">
            Tax Amount (in words) : <strong>NIL</strong>
          </div>

          <div className="bottom-split">
            {/* Declaration Left */}
            <div className="decl-box">
              <strong>Declaration</strong><br />
              We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct. We hereby certify that food/ foods mentioned in this invoice is/are warranted to be of the nature and quality which it/these purports/purported to be .
            </div>

            {/* Bank Details & Signature Right */}
            <div className="bank-sig-box">
              <div className="bank-inner">
                <strong>Company's Bank Details</strong><br />
                A/c Holder's Name : <strong>Pitambara Agrotech Product</strong><br />
                Bank Name : <strong>HDFC BANK</strong><br />
                A/c No. : <strong>50200036394259</strong><br />
                IFS Code : <strong>HDFC0000349</strong>
              </div>
              <div className="auth-sig-box">
                <span>for PITAMBARA AGROTECH PRODUCT</span>
                <strong>Authorised Signatory</strong>
              </div>
            </div>
          </div>

          <div style={{textAlign: 'center', fontSize: '9px', padding: '3px', borderTop: '1px solid #000'}}>
            SUBJECT TO HOWRAH JURISDICTION<br />
            This is a Computer Generated Invoice
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaxInvoice;