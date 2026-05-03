// frontend/src/components/Invoice/InvoicePage.jsx
import React, { useState, useEffect } from 'react';
import InvoiceList from './InvoiceList';
import InvoiceView from './InvoiceView';
import { invoiceAPI, dashboardAPI } from '../../utils/api';
import './Invoice.css';

export default function InvoicePage() {
  const [summary, setSummary] = useState(null);
  const [viewing, setViewing] = useState(null);

  useEffect(() => {
    dashboardAPI.getSummary().then(({ data }) => setSummary(data.data));
  }, []);

  const fmt = (n) => `PKR ${Number(n || 0).toLocaleString('en-PK', { minimumFractionDigits: 0 })}`;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Invoices</h1>
      </div>

      {summary && (
        <div className="stat-grid" style={{ marginBottom: 20 }}>
          <div className="stat-card"><div className="stat-label">Today's Sales</div>
            <div className="stat-value">{fmt(summary.today_sales)}</div></div>
          <div className="stat-card"><div className="stat-label">Today's Invoices</div>
            <div className="stat-value">{summary.today_invoices}</div></div>
          <div className="stat-card"><div className="stat-label">Monthly Revenue</div>
            <div className="stat-value">{fmt(summary.monthly_sales)}</div></div>
        </div>
      )}

      <InvoiceList onView={setViewing} />
      {viewing && <InvoiceView invoice={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
}
