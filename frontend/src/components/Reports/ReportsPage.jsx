// frontend/src/components/Reports/ReportsPage.jsx
import React, { useState } from 'react';
import { reportAPI } from '../../utils/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import toast from 'react-hot-toast';

const today      = new Date().toISOString().split('T')[0];
const monthStart = today.slice(0, 7) + '-01';

export default function ReportsPage() {
  const [tab,     setTab]     = useState('sales');
  const [from,    setFrom]    = useState(monthStart);
  const [to,      setTo]      = useState(today);
  const [data,    setData]    = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadReport = async () => {
    setLoading(true);
    try {
      if (tab === 'sales') {
        const { data: r } = await reportAPI.getSales({ from, to });
        setData(r.data); setSummary(r.summary);
      } else if (tab === 'expenses') {
        const { data: r } = await reportAPI.getExpenses({ from, to });
        setData(r.data); setSummary(r.summary);
      } else {
        const { data: r } = await reportAPI.getProfit({ from, to });
        setData(null); setSummary(r.data);
      }
    } catch { toast.error('Failed to load report'); }
    finally { setLoading(false); }
  };

  const downloadCSV = async () => {
    try {
      const type = tab === 'expenses' ? 'expenses' : 'sales';
      const { data: blob } = await reportAPI.downloadCSV(type, { from, to });
      const url = URL.createObjectURL(new Blob([blob]));
      const a   = document.createElement('a');
      a.href = url; a.download = `${type}-report-${from}-${to}.csv`; a.click();
      URL.revokeObjectURL(url);
      toast.success('CSV downloaded');
    } catch { toast.error('Download failed'); }
  };

  const fmt  = (n) => `PKR ${Number(n || 0).toLocaleString('en-PK', { minimumFractionDigits: 0 })}`;
  const COLORS = ['#0f172a', '#0ea5e9', '#059669', '#dc2626', '#6d28d9'];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Reports</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          {tab !== 'profit' && <button className="btn btn-ghost" onClick={downloadCSV}>⬇ CSV</button>}
          <button className="btn btn-primary" onClick={loadReport} disabled={loading}>
            {loading ? 'Loading…' : '▶ Run Report'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: '2px solid var(--border)' }}>
        {['sales','expenses','profit'].map(t => (
          <button key={t} onClick={() => { setTab(t); setData(null); setSummary(null); }}
            className="btn btn-ghost btn-sm"
            style={{ borderBottom: tab === t ? '2px solid var(--primary)' : '2px solid transparent',
              borderRadius: '4px 4px 0 0', color: tab === t ? 'var(--primary)' : '', fontWeight: tab === t ? 700 : 400 }}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Date filters */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="form-row">
          <div className="form-group"><label>From</label>
            <input className="form-control" type="date" value={from} onChange={e => setFrom(e.target.value)} /></div>
          <div className="form-group"><label>To</label>
            <input className="form-control" type="date" value={to}   onChange={e => setTo(e.target.value)} /></div>
        </div>
      </div>

      {/* Summary KPIs */}
      {summary && (
        <div className="stat-grid" style={{ marginBottom: 16 }}>
          {tab === 'sales' && <>
            <div className="stat-card"><div className="stat-label">Total Invoices</div>
              <div className="stat-value">{summary.total_invoices}</div></div>
            <div className="stat-card"><div className="stat-label">Total Revenue</div>
              <div className="stat-value">{fmt(summary.total_revenue)}</div></div>
          </>}
          {tab === 'expenses' && <>
            <div className="stat-card"><div className="stat-label">Total Expenses</div>
              <div className="stat-value">{summary.total_expenses}</div></div>
            <div className="stat-card"><div className="stat-label">Total Amount</div>
              <div className="stat-value" style={{ color: 'var(--red)' }}>{fmt(summary.total_amount)}</div></div>
          </>}
          {tab === 'profit' && <>
            <div className="stat-card"><div className="stat-label">Revenue</div>
              <div className="stat-value">{fmt(summary.revenue)}</div></div>
            <div className="stat-card"><div className="stat-label">Expenses</div>
              <div className="stat-value" style={{ color: 'var(--red)' }}>{fmt(summary.expenses)}</div></div>
            <div className="stat-card"><div className="stat-label">Profit</div>
              <div className="stat-value" style={{ color: summary.profit >= 0 ? 'var(--green)' : 'var(--red)' }}>
                {fmt(summary.profit)}</div></div>
            <div className="stat-card"><div className="stat-label">Margin</div>
              <div className="stat-value">{summary.margin}%</div></div>
          </>}
        </div>
      )}

      {/* Profit Chart */}
      {tab === 'profit' && summary && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 700, marginBottom: 12, color: 'var(--primary)' }}>Revenue vs Expenses</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={[{ name: 'Revenue', value: summary.revenue },
              { name: 'Expenses', value: summary.expenses }, { name: 'Profit', value: summary.profit }]}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={v => fmt(v)} />
              <Bar dataKey="value" fill="#0f172a" radius={[4,4,0,0]}>
                {[{ fill:'#0f172a' },{ fill:'#dc2626' },{ fill: summary?.profit >= 0 ? '#059669' : '#dc2626' }].map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Data Table */}
      {data && data.length > 0 && (
        <div className="card" style={{ padding: 0 }}>
          {tab === 'sales' && (
            <table className="tbl">
              <thead><tr><th>Invoice #</th><th>Date</th><th>Customer</th><th>Cashier</th><th>Payment</th><th>Status</th><th>Amount</th></tr></thead>
              <tbody>{data.map((r, i) => (
                <tr key={i}>
                  <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>{r.invoice_number}</td>
                  <td>{r.date}</td><td>{r.customer}</td><td>{r.cashier}</td>
                  <td style={{ textTransform: 'capitalize' }}>{r.payment}</td>
                  <td><span className={`badge ${r.status === 'paid' ? 'badge-green' : 'badge-gray'}`}>{r.status}</span></td>
                  <td style={{ fontWeight: 700 }}>{fmt(r.total)}</td>
                </tr>
              ))}</tbody>
            </table>
          )}
          {tab === 'expenses' && (
            <table className="tbl">
              <thead><tr><th>Date</th><th>Title</th><th>Category</th><th>Paid By</th><th>Notes</th><th>Amount</th></tr></thead>
              <tbody>{data.map((r, i) => (
                <tr key={i}>
                  <td>{r.date}</td>
                  <td style={{ fontWeight: 600 }}>{r.title}</td>
                  <td><span className="badge badge-blue">{r.category}</span></td>
                  <td>{r.paid_by}</td>
                  <td style={{ fontSize: 12, color: 'var(--ink-2)' }}>{r.notes}</td>
                  <td style={{ fontWeight: 700, color: 'var(--red)' }}>{fmt(r.amount)}</td>
                </tr>
              ))}</tbody>
            </table>
          )}
        </div>
      )}

      {!data && !summary && !loading && (
        <div className="card" style={{ textAlign: 'center', padding: 60, color: 'var(--ink-3)' }}>
          Select a date range and click <strong>Run Report</strong>
        </div>
      )}
    </div>
  );
}
