import React from "react";
import SinghImage from '../rkSig.png';

const EWayBillContainer = ({ data }) => {
  if (!data) return null;

  // 1. Function: Number to Words (Fixed potential index out of bound fallback)
  const amountInWords = (num) => {
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    // Convert to absolute integer to avoid decimal conflicts in string conversion
    let cleanNum = Math.round(Number(num || 0));
    if (cleanNum === 0) return 'Zero Only';
    if (cleanNum.toString().length > 9) return 'Overflow';
    
    let n = ('000000000' + cleanNum).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return ''; 
    let str = '';
    str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
    str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
    str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
    str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
    str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) + 'Only ' : 'Only';
    return str;
  };

  // 🚀 CALCULATION BUG FIXES: Strict database key mappings with fallbacks
  const goodsList = data?.goods || [];
  const totalWeight = goodsList.reduce((sum, item) => sum + Number(item.quantity || 0), 0) || 0;
  
  // Delivery Note check
  const totalBags = data?.deliveryNote || `${Math.ceil(totalWeight / 50)} BAGS`; 
  
  // Correct key integration matching backend object structure
  const subTotal = Number(data.subTotal || data.taxableValue || 0);
  const freightAmt = data.logistics?.freight ? Math.abs(Number(data.logistics.freight)) : 0;
  const roundOff = Number(data.roundOff || 0);
  const finalTotal = Number(data.grandTotal || data.totalAmount || 0);

  // 🚀 PROPERTY MAPPING BUG FIXES: Extracting keys from nested partyId & logistics schemas
  const invoiceData = {
    billNo: data?.billNo || "N/A",
    date: data?.date ? String(data.date).split('T')[0] : "N/A",
    vehicleNo: data?.logistics?.vehicleNo || "N/A",
    customerName: data?.customerName || data?.partyId?.name || "RITESH",
    customerAddress: data?.address || "N/A",
    customerGSTIN: data?.gstin || "N/A",
    customerMobile: data?.partyId?.phone || data?.mobile || "N/A",
    paymentMode: data?.paymentMode || "BY BANK",
    buyerOrderNo: data?.buyerOrderNo || "-",
    buyerOrderDate: data?.buyerOrderDate || "-",
    dispatchDocNo: data?.logistics?.lrRrNo || data?.dispatchDocNo || "-",
    dispatchDate: data?.date ? String(data.date).split('T')[0] : "-",
    dispatchedThrough: data?.logistics?.dispatchedThrough || "-",
    destination: data?.logistics?.destination || "-",
    lrRrNo: data?.logistics?.lrRrNo || "-",
    termsOfDelivery: data?.termsOfDelivery || "-",
    goods: goodsList
  };

  const uniqueHSNs = invoiceData.goods ? [...new Set(invoiceData.goods.map(item => item.hsn))].filter(h => h) : [];

  const handlePrint = () => {
    const printContent = document.getElementById('printableInvoice').innerHTML;
    const styleContent = document.getElementById('unifiedInvoiceStyles').innerHTML;
    const printWindow = window.open('', '_blank', 'width=900,height=800');

    printWindow.document.write(`
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
          <title>Bill No: ${invoiceData.billNo}</title>
          <style>${styleContent}</style>
        </head>
        <body onload="window.focus(); window.print(); window.close();">
          <div class="invoice-wrapper">${printContent}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="invoice-container-main">
      <style id="unifiedInvoiceStyles">
        {`
          * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          
          :root {
            --primary-border: #000;
            --text-color: #000;
            --bg-color: #fff;
          }

          @media screen and (prefers-color-scheme: dark) {
            .invoice-wrapper { background: #1a1a1a; color: #f0f0f0; border: 1px solid #444; }
            .main-border, .border-b, .info-row, .info-col, .items-table th, .items-table td, .hsn-tax-table td { border-color: #555 !important; }
          }

          .invoice-wrapper { 
            width: 210mm; 
            min-height: 290mm; 
            padding: 10mm; 
            margin: 10px auto; 
            background: var(--bg-color); 
            font-family: 'Arial Narrow', Arial, sans-serif; 
            font-size: 11px; 
            color: var(--text-color); 
            line-height: 1.3;
          }

          .main-border { border: 1.5px solid var(--primary-border); }
          .title-center { text-align: center; font-weight: bold; border-bottom: 1.5px solid var(--primary-border); padding: 4px; font-size: 12px; text-transform: uppercase; }
          .flex-container { display: flex; width: 100%; }
          .left-section { width: 50%; border-right: 1.5px solid var(--primary-border); }
          .right-section { width: 50%; }
          .p-5 { padding: 5px; }
          .border-b { border-bottom: 1px solid var(--primary-border); }
          
          .info-row { display: flex; border-bottom: 1px solid var(--primary-border); min-height: 38px; }
          .info-col { flex: 1; padding: 2px 5px; border-right: 1px solid var(--primary-border); }
          .info-col:last-child { border-right: none; }
          
          .items-table { width: 100%; border-collapse: collapse; }
          .items-table th, .items-table td { border-right: 1px solid var(--primary-border); padding: 6px 4px; text-align: center; vertical-align: top; border-bottom: 1px solid var(--primary-border); }
          .items-table th { font-weight: bold; background-color: rgba(0,0,0,0.02); }
          .items-table .text-left { text-align: left; padding-left: 8px; }
          .items-table .text-right { text-align: right; padding-right: 8px; }
          
          .spacer-row { height: 180px; }
          .spacer-row td { border-bottom: none !important; }
          
          .hsn-tax-table { width: 100%; border-collapse: collapse; }
          .hsn-tax-table td { border: 1px solid var(--primary-border); padding: 4px 8px; }
          
          .bottom-split { display: flex; border-top: 1px solid var(--primary-border); min-height: 120px; }
          .decl-box { width: 55%; padding: 8px; border-right: 1.5px solid var(--primary-border); font-size: 10px; text-align: justify; }
          .bank-sig-box { width: 45%; display: flex; flex-direction: column; }
          .bank-inner { padding: 5px; font-size: 10px; border-bottom: 1px solid var(--primary-border); flex-grow: 0; }
          .auth-sig-box { padding: 5px; text-align: right; height: 100px; display: flex; flex-direction: column; justify-content: space-between; }
          
          .no-print { 
            display: block; width: 220px; margin: 20px auto; padding: 12px; 
            background: #059669; color: white; border: none; border-radius: 8px; 
            cursor: pointer; text-align: center; font-weight: bold; font-size: 14px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }

          @media print {
            @page { size: A4; margin: 0; }
            body { background: white !important; -webkit-print-color-adjust: exact; }
            .invoice-wrapper { 
              width: 100% !important; 
              height: 100% !important;
              margin: 0 !important; 
              padding: 5mm !important; 
              border: none !important;
            }
            .no-print { display: none !important; }
            .main-border { border: 1.5px solid #000 !important; }
            .invoice-wrapper * { color: #000 !important; border-color: #000 !important; }
          }

          @media screen and (max-width: 768px) {
            .invoice-wrapper { width: 98%; padding: 5px; font-size: 10px; overflow-x: auto; }
            .no-print { width: 90%; }
          }
        `}
      </style>

      <div id="printableInvoice" className="invoice-wrapper">
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
                Mobile : {invoiceData.customerMobile}<br />
                State Name : Bihar, Code : 10
              </div>

              <div className="p-5" style={{minHeight: '90px'}}>
                <span>Buyer (Bill to)</span><br />
                <strong>{invoiceData.customerName}</strong><br />
                {invoiceData.customerAddress}<br />
                GSTIN/UIN : {invoiceData.customerGSTIN}<br />
                Mobile : {invoiceData.customerMobile}<br />
                State Name : Bihar, Code : 10
              </div>
            </div>

            <div className="right-section">
              <div className="info-row">
                <div className="info-col">Invoice No.<br/><strong>{invoiceData.billNo}</strong></div>
                <div className="info-col">Dated<br/><strong>{invoiceData.date}</strong></div>
              </div>
              <div className="info-row">
                <div className="info-col">Delivery Note<br/><strong>{totalBags}</strong></div>
                <div className="info-col">Mode/Terms of Payment<br/><strong>{invoiceData.paymentMode}</strong></div>
              </div>
              <div className="info-row">
                <div className="info-col">Buyer's Order No.<br/><strong>{invoiceData.buyerOrderNo}</strong></div>
                <div className="info-col">Dated<br/><strong>{invoiceData.buyerOrderDate}</strong></div>
              </div>
              <div className="info-row">
                <div className="info-col">Dispatch Doc No.<br/><strong>{invoiceData.dispatchDocNo}</strong></div>
                <div className="info-col">Delivery Note Date<br/><strong>{invoiceData.dispatchDate}</strong></div>
              </div>
              <div className="info-row">
                <div className="info-col">Dispatched through<br/><strong>{invoiceData.dispatchedThrough}</strong></div>
                <div className="info-col">Destination<br/><strong>{invoiceData.destination}</strong></div>
              </div>
              <div className="info-row">
                <div className="info-col">Bill of Lading/LR-RR No.<br/><strong>{invoiceData.lrRrNo}</strong></div>
                <div className="info-col">Motor Vehicle No.<br/><strong>{invoiceData.vehicleNo}</strong></div>
              </div>
              <div className="p-5" style={{height: '60px'}}>
                <strong>Terms of Delivery</strong><br/>
                {invoiceData.termsOfDelivery}
              </div>
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
                  {/* 🚀 BUG FIX: g.product ko badal kar g.productName kiya */}
                  <td className="text-left"><strong>{g.productName || g.product || "BROKEN RICE"}</strong></td>
                  <td>{g.hsn}</td>
                  <td><strong>{g.quantity} KGS</strong></td>  
                  <td>{g.rate}</td>
                  <td>{g.unit || "KGS"}</td>
                  {/* 🚀 BUG FIX: Schema match parameters calculation safety */}
                  <td className="text-right" style={{borderRight: 'none'}}>
                    {Number(g.taxableAmount || (g.quantity * g.rate)).toFixed(2)}
                  </td>
                </tr>
              ))}
              <tr className="spacer-row"><td></td><td></td><td></td><td></td><td></td><td></td><td style={{borderRight: 'none'}}></td></tr>
              
              <tr style={{borderTop: '1px solid #000'}}>
                <td colSpan="6" className="text-right"><strong>Sub-Total</strong></td>
                <td className="text-right" style={{borderRight: 'none'}}><strong>{subTotal.toFixed(2)}</strong></td>
              </tr>
              <tr>
                <td colSpan="3" className="text-left">Less:</td>
                <td colSpan="3" className="text-right"><strong>FREIGHT CHARGES</strong></td>
                {/* 🚀 BUG FIX: Displaying clear layout mapping for transport additions/deductions */}
                <td className="text-right" style={{borderRight: 'none'}}><strong>-({freightAmt.toFixed(2)})</strong></td>
              </tr>
              <tr>
                <td colSpan="3"></td>
                <td colSpan="3" className="text-right"><strong>ROUND OFF</strong></td>
                <td className="text-right" style={{borderRight: 'none'}}><strong>({roundOff.toFixed(2)})</strong></td>
              </tr>

              <tr style={{borderTop: '1.5px solid #000', fontWeight: 'bold'}}>
                <td colSpan="3" className="text-right">Total</td>
                <td>{totalWeight.toLocaleString()} KGS</td>
                <td colSpan="2"></td>
                <td className="text-right" style={{borderRight: 'none'}}>₹ {finalTotal.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          <div className="footer-section">
            <div className="p-5">
              Amount Chargeable (in words)<br />
              <strong style={{textTransform: 'uppercase'}}>INR {amountInWords(finalTotal)}</strong>
            </div>

            <table className="hsn-tax-table">
              <thead>
                <tr style={{textAlign: 'center', fontWeight: 'bold'}}>
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
                        .reduce((sum, item) => sum + Number(item.taxableAmount || (item.quantity * item.rate)), 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="p-5">Tax Amount (in words) : <strong>NIL</strong></div>

            <div className="bottom-split">
              <div className="decl-box">
                We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct. We hereby certify that food/ foods mentioned in this invoice is/are warranted to be of the nature and quality which it/these purports/purported to be.
              </div>
              <div className="bank-sig-box">
                <div className="bank-inner">
                  <strong>Company's Bank Details</strong><br />
                  Bank Name : <strong>Punjab National Bank</strong><br />
                  A/c No. : <strong>3504008700005079</strong><br />
                  IFS Code : <strong>PUNB0350400</strong>
                </div>
                <div className="auth-sig-box">
                  <span>for DHARA SHAKTI AGRO PRODUCTS</span>
                  <div style={{ textAlign: 'right', width: '100%', margin: '4px 0' }}>
                    <img src={SinghImage} alt="Singh" style={{ width: '80px', height: '35px', objectFit: 'contain' }} />
                  </div>
                  <strong style={{marginTop: 'auto'}}>Authorised Signatory</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <button className="no-print" onClick={handlePrint}>
        Print Bill (Mobile & Desktop)
      </button>
    </div>
  );
};

export default EWayBillContainer;