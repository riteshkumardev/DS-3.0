import React from 'react';

const LedgerPrint = ({ dataWithBalance, filterParty, startDate, endDate, totals }) => {
    return (
        <div className="printable-statement">
            {/* Yeh CSS yahan likhne se yeh ensure hota hai ki jab 
               bhi yeh component render ho, print engine ko sahi 
               instructions milein, chahe external CSS load ho ya na ho.
            */}
            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    /* Sab kuch hide karo dashboard ka */
                    body * { visibility: hidden; }
                    
                    /* Sirf is printable area aur uske bacchon ko dikhao */
                    .printable-statement, .printable-statement * { 
                        visibility: visible !important; 
                    }
                    
                    /* Ise page ke bilkul upar position karo */
                    .printable-statement {
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        display: block !important;
                    }

                    /* Browser ke default margins ko control karo */
                    @page {
                        size: auto;
                        margin: 15mm 10mm;
                    }

                    /* Scrolling containers ko unlock karo */
                    html, body {
                        height: auto !important;
                        overflow: visible !important;
                    }

                    /* Table Styling for B&W/Color Print */
                    .passbook-table {
                        width: 100% !important;
                        border-collapse: collapse !important;
                        border: 1px solid #000 !important;
                    }
                    .passbook-table th, .passbook-table td {
                        border: 1px solid #000 !important;
                        padding: 8px !important;
                        color: #000 !important;
                    }
                    .text-green { color: #059669 !important; }
                    .text-red { color: #dc2626 !important; }
                }
            `}} />

            {/* --- HEADER --- */}
            <div className="print-only-header">
                <h1 style={{ textAlign: 'center', margin: '0 0 5px 0' }}>DHARA SHAKTI AGRO PRODUCTS</h1>
                <p className="sub-title" style={{ textAlign: 'center', fontWeight: 'bold', margin: '0' }}>Party Transaction Ledger</p>
                <div className="header-meta" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px', borderBottom: '1px solid #000', paddingBottom: '5px' }}>
                    <span>Party: <strong>{filterParty}</strong></span>
                    <span>Period: {startDate || 'Beginning'} to {endDate || 'Today'}</span>
                </div>
            </div>

            {/* --- TABLE --- */}
            <table className="passbook-table" style={{ marginTop: '20px', width: '100%' }}>
                <thead>
                    <tr>
                        <th style={{ textAlign: 'left' }}>Date</th>
                        <th style={{ textAlign: 'left' }}>Narration / Txn ID</th>
                        <th className="text-right">Credit (In)</th>
                        <th className="text-right">Debit (Out)</th>
                        <th className="text-right">Balance</th>
                    </tr>
                </thead>
                <tbody>
                    {dataWithBalance.map((txn, i) => (
                        <tr key={txn._id || i}>
                            <td className="nowrap">
                                {new Date(txn.date).toLocaleDateString('en-GB')}
                            </td>
                            <td>
                                <div className="bold" style={{ fontWeight: 'bold' }}>{txn.partyName}</div>
                                <div className="remark-text" style={{ fontStyle: 'italic', fontSize: '12px' }}>{txn.remark || '---'}</div>
                                <small className="txn-id-text" style={{ color: '#666' }}>Ref: {txn.txnId || 'N/A'}</small>
                            </td>
                            <td className="text-right text-green" style={{ textAlign: 'right' }}>
                                {txn.type === 'Payment In' ? `₹${Number(txn.amount).toLocaleString()}` : '-'}
                            </td>
                            <td className="text-right text-red" style={{ textAlign: 'right' }}>
                                {txn.type === 'Payment Out' ? `₹${Number(txn.amount).toLocaleString()}` : '-'}
                            </td>
                            <td className={`text-right bold`} style={{ textAlign: 'right', fontWeight: 'bold' }}>
                                ₹{Math.abs(txn.currentBalance).toLocaleString()} {txn.currentBalance >= 0 ? 'Cr' : 'Dr'}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* --- FOOTER --- */}
            <div className="print-only-footer" style={{ marginTop: '30px' }}>
                <div className="footer-summary" style={{ textAlign: 'right', lineHeight: '1.6' }}>
                    <p style={{ margin: '2px 0' }}>Total Credit (In): ₹{totals.totalIn.toLocaleString()}</p>
                    <p style={{ margin: '2px 0' }}>Total Debit (Out): ₹{totals.totalOut.toLocaleString()}</p>
                    <p className="bold" style={{ fontWeight: 'bold', fontSize: '16px', borderTop: '1px solid #000', display: 'inline-block', paddingTop: '5px' }}>
                        Closing: ₹{Math.abs(totals.net).toLocaleString()} {totals.net >= 0 ? '(Adv)' : '(Due)'}
                    </p>
                </div>
                <div className="signature-box" style={{ marginTop: '60px', textAlign: 'right' }}>
                    <div className="sig-line" style={{ borderTop: '1px solid #000', width: '200px', marginLeft: 'auto' }}></div>
                    <p style={{ marginRight: '40px' }}>Authorized Signatory</p>
                </div>
            </div>
        </div>
    );
};

export default LedgerPrint;