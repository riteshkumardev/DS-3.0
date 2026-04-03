import React from "react";

const EWayBillContainer = ({ data }) => {
  if (!data) return null;

  // 1. Function: Number to Words (INR)
  const amountInWords = (num) => {
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    if ((num = Math.floor(num).toString()).length > 9) return 'Overflow';
    let n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return ''; 
    let str = '';
    str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
    str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
    str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
    str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
    str += (n[5] != 0) ? ((str !== '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) + 'Only ' : 'Only';
    return str;
  };

  // 2. Logic: Data Sanitization
  const invoiceData = {
    billNo: data?.billNo || "N/A",
    date: data?.date || "N/A",
    vehicleNo: data?.vehicleNo || data?.vehicle?.vehicleNo || "N/A",
    customerName: data?.customerName || data?.to?.name || "N/A",
    customerAddress: data?.customerAddress || data?.to?.address || "N/A",
    customerGSTIN: data?.customerGSTIN || data?.to?.gst || "N/A",
    goods: data?.goods || [],
    freight: Number(data?.freight || data?.travelingCost || 0) // Supporting both field names
  };

  // 3. Logic: Final Calculations
  const totalWeight = invoiceData.goods.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const totalBags = Math.ceil(totalWeight / 50); 
  const taxableSubTotal = invoiceData.goods.reduce((sum, item) => sum + Number(item.taxableAmount || 0), 0);
  
  const totalWithFreight = taxableSubTotal + invoiceData.freight;
  const finalTotal = Math.round(totalWithFreight);
  const roundOffValue = (finalTotal - totalWithFreight).toFixed(2);

  const uniqueHSNs = invoiceData.goods ? [...new Set(invoiceData.goods.map(item => item.hsn))].filter(h => h) : [];

  return (
    <div className="invoice-wrapper">
      <style>
        {`
          .invoice-wrapper { width: 210mm; min-height: 290mm; padding: 5mm; margin: auto; background: #fff; font-family: 'Arial Narrow', Arial, sans-serif; font-size: 11px; color: #000; line-height: 1.3; }
          .main-border { border: 1.5px solid #000; }
          .title-center { text-align: center; font-weight: bold; border-bottom: 1.5px solid #000; padding: 2px; font-size: 12px; }
          .flex-container { display: flex; width: 100%; }
          .left-section { width: 50%; border-right: 1.5px solid #000; }
          .right-section { width: 50%; }
          .p-5 { padding: 5px; }
          .border-b { border-bottom: 1px solid #000; }
          .info-row { display: flex; border-bottom: 1px solid #000; min-height: 35px; }
          .info-col { flex: 1; padding: 2px 5px; border-right: 1px solid #000; }
          .info-col:last-child { border-right: none; }
          .items-table { width: 100%; border-collapse: collapse; border-top: 1.5px solid #000; }
          .items-table th, .items-table td { border-right: 1px solid #000; padding: 4px 6px; text-align: center; vertical-align: top; }
          .items-table th { border-bottom: 1px solid #000; font-weight: normal; }
          .items-table .text-left { text-align: left; }
          .items-table .text-right { text-align: right; }
          .spacer-row { height: 140px; }
          .footer-section { border-top: 1.5px solid #000; }
          .hsn-tax-table { width: 100%; border-collapse: collapse; border-top: 1px solid #000; }
          .hsn-tax-table td { border: 1px solid #000; padding: 3px 8px; }
          .bottom-split { display: flex; border-top: 1px solid #000; min-height: 120px; }
          .decl-box { width: 50%; padding: 5px; border-right: 1px solid #000; font-size: 10px; text-align: justify; }
          .bank-sig-box { width: 50%; display: flex; flex-direction: column; }
          .bank-inner { padding: 5px; font-size: 10px; border-bottom: 1px solid #000; flex-grow: 1; }
          .auth-sig-box { padding: 5px; text-align: right; height: 80px; display: flex; flex-direction: column; justify-content: space-between; }
          @media print { .no-print { display: none; } }
        `}
      </style>

      <div className="main-border">
        <div className="title-center">BILL OF SUPPLY (ORIGINAL FOR RECIPIENT)</div>

        <div className="flex-container">
          <div className="left-section">
            <div className="p-5 border-b">
              <strong style={{fontSize: '13px'}}>DHARA SHAKTI AGRO PRODUCTS</strong><br />
              Sri Pur Gahar, Khanpur, Samastipur, Bihar-848117<br />
              GSTIN/UIN: 10DZTPM1457E1ZE | FSSAI: 2042331000141<br />
              E-Mail: dharashaktiagroproducts@gmail.com
            </div>

            <div className="p-5 border-b" style={{minHeight: '90px'}}>
              <span>Consignee (Ship to)</span><br />
              <strong>{invoiceData.customerName}</strong><br />
              {invoiceData.customerAddress}<br />
              GSTIN/UIN : {invoiceData.customerGSTIN}<br />
              State Name : Bihar, Code : 10
            </div>

            <div className="p-5" style={{minHeight: '90px'}}>
              <span>Buyer (Bill to)</span><br />
              <strong>{invoiceData.customerName}</strong><br />
              {invoiceData.customerAddress}<br />
              GSTIN/UIN : {invoiceData.customerGSTIN}<br />
              State Name : Bihar, Code : 10
            </div>
          </div>

          <div className="right-section">
            <div className="info-row">
              <div className="info-col">Invoice No.<br/><strong>{invoiceData.billNo}</strong></div>
              <div className="info-col">Dated<br/><strong>{invoiceData.date}</strong></div>
            </div>
            <div className="info-row">
              <div className="info-col">Delivery Note<br/><strong>{totalBags} BAGS</strong></div>
              <div className="info-col">Mode/Terms of Payment<br/><strong>BY BANK</strong></div>
            </div>
            <div className="info-row">
              <div className="info-col">Bill of Lading/LR-RR No.<br/><strong>dt. {invoiceData.date}</strong></div>
              <div className="info-col">Motor Vehicle No.<br/><strong>{invoiceData.vehicleNo}</strong></div>
            </div>
            <div className="p-5" style={{height: '145px'}}><strong>Terms of Delivery:</strong> Goods once sold will not be taken back.</div>
          </div>
        </div>

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
                <td className="text-left"><strong>{g.product || g.desc} (NON BRANDED)</strong></td>
                <td>{g.hsn}</td>
                <td><strong>{g.quantity} KGS</strong></td>
                <td>{Number(g.rate).toFixed(2)}</td>
                <td>KGS</td>
                <td className="text-right" style={{borderRight: 'none'}}>{Number(g.taxableAmount).toFixed(2)}</td>
              </tr>
            ))}
            <tr className="spacer-row"><td></td><td></td><td></td><td></td><td></td><td></td><td style={{borderRight: 'none'}}></td></tr>
            
            {/* Sub Total Row */}
            <tr style={{borderTop: '1px solid #000'}}>
              <td colSpan="6" className="text-right">Taxable Value</td>
              <td className="text-right" style={{borderRight: 'none'}}><strong>{taxableSubTotal.toFixed(2)}</strong></td>
            </tr>

            {/* Freight Row */}
            {invoiceData.freight > 0 && (
              <tr>
                <td colSpan="2" className="text-left">Add:</td>
                <td colSpan="3" className="text-right"><strong>FREIGHT CHARGES (+)</strong></td>
                <td></td>
                <td className="text-right" style={{borderRight: 'none'}}><strong>{invoiceData.freight.toFixed(2)}</strong></td>
              </tr>
            )}

            {/* Round Off Row */}
            <tr>
              <td colSpan="2" className="text-left">Adjustment:</td>
              <td colSpan="3" className="text-right"><strong>ROUND OFF</strong></td>
              <td></td>
              <td className="text-right" style={{borderRight: 'none'}}><strong>{roundOffValue}</strong></td>
            </tr>

            {/* Final Total */}
            <tr style={{borderTop: '1.5px solid #000', fontWeight: 'bold', fontSize: '12px'}}>
              <td colSpan="3" className="text-right">Total Quantity / Net Amount</td>
              <td>{totalWeight.toLocaleString()} KGS</td>
              <td colSpan="2"></td>
              <td className="text-right" style={{borderRight: 'none'}}>₹ {finalTotal.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        <div className="footer-section">
          <div className="p-5">
            Amount Chargeable (in words): <br />
            <strong style={{textTransform: 'uppercase'}}>INR {amountInWords(finalTotal)}</strong>
          </div>

          <table className="hsn-tax-table">
            <thead>
              <tr style={{textAlign: 'center', fontWeight: 'bold', background: '#f9f9f9'}}>
                <td style={{width: '70%'}}>HSN/SAC</td>
                <td style={{borderRight: 'none'}}>Taxable Value</td>
              </tr>
            </thead>
            <tbody>
              {uniqueHSNs.map((hsnCode, idx) => (
                <tr key={idx}>
                  <td style={{textAlign: 'center'}}>{hsnCode}</td>
                  <td style={{textAlign: 'right', borderRight: 'none'}}>
                    {invoiceData.goods.filter(item => item.hsn === hsnCode)
                      .reduce((sum, item) => sum + Number(item.taxableAmount || 0), 0).toFixed(2)}
                  </td>
                </tr>
              ))}
              <tr style={{fontWeight: 'bold'}}>
                <td style={{textAlign: 'right'}}>Total Taxable Value</td>
                <td style={{textAlign: 'right', borderRight: 'none'}}>{taxableSubTotal.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          <div className="p-5" style={{fontSize: '10px'}}>Tax Amount (in words) : <strong>NIL (EXEMPTED)</strong></div>

          <div className="bottom-split">
            <div className="decl-box">
              <strong>Declaration:</strong><br />
              We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct. We hereby certify that food/ foods mentioned in this invoice is/are warranted to be of the nature and quality which it/these purports/purported to be.
            </div>
            <div className="bank-sig-box">
              <div className="bank-inner">
                <strong>Company's Bank Details:</strong><br />
                A/c Holder: <strong>Dhara Shakti Agro Products</strong><br />
                Bank: <strong>Punjab National Bank</strong> | A/c: <strong>3504008700005079</strong><br />
                IFSC: <strong>PUNB0350400</strong>
              </div>
              <div className="auth-sig-box">
                <span>for DHARA SHAKTI AGRO PRODUCTS</span>
                <br /><br />
                <strong>Authorised Signatory</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="no-print" style={{display: 'flex', gap: '10px', marginTop: '20px'}}>
        <button onClick={() => window.print()} style={{padding: '10px 25px', cursor: 'pointer', background: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold'}}>Print Invoice</button>
      </div>
    </div>
  );
};

export default EWayBillContainer;