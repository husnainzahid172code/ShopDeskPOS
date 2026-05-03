// frontend/src/components/Dashboard/Dashboard.jsx
import React, { useEffect, useState } from 'react';
import { dashboardAPI } from '../../utils/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import './Dashboard.css';

export default function Dashboard() {
  const [summary,  setSummary]  = useState(null);
  const [chart,    setChart]    = useState([]);
  const [topProds, setTopProds] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    Promise.all([
      dashboardAPI.getSummary(),
      dashboardAPI.getSalesChart({ days: 14 }),
      dashboardAPI.getTopProducts({ limit: 5 }),
    ]).then(([s, c, t]) => {
      setSummary(s.data.data);
      setChart(c.data.data);
      setTopProds(t.data.data);
    }).finally(() => setLoading(false));
  }, []);

  const fmt = (n) => `PKR ${Number(n || 0).toLocaleString('en-PK', { minimumFractionDigits: 0 })}`;

  if (loading) return <div className="app-loading"><div className="spinner" /></div>;

  const salesChange = summary?.yesterday_sales > 0
    ? (((summary.today_sales - summary.yesterday_sales) / summary.yesterday_sales) * 100).toFixed(1)
    : null;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <span className="badge badge-green">● Live</span>
      </div>

      {/* KPI Grid */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Today's Sales</div>
          <div className="stat-value">{fmt(summary?.today_sales)}</div>
          {salesChange && <div className="stat-sub" style={{ color: salesChange >= 0 ? 'var(--green)' : 'var(--red)' }}>
            {salesChange >= 0 ? '▲' : '▼'} {Math.abs(salesChange)}% vs yesterday
          </div>}
        </div>
        <div className="stat-card">
          <div className="stat-label">Today's Invoices</div>
          <div className="stat-value">{summary?.today_invoices}</div>
          <div className="stat-sub">transactions today</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Monthly Revenue</div>
          <div className="stat-value">{fmt(summary?.monthly_sales)}</div>
          <div className="stat-sub">this month</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Monthly Profit</div>
          <div className="stat-value" style={{ color: summary?.monthly_profit >= 0 ? 'var(--green)' : 'var(--red)' }}>
            {fmt(summary?.monthly_profit)}
          </div>
          <div className="stat-sub">Revenue − Expenses</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Low Stock Items</div>
          <div className="stat-value" style={{ color: summary?.low_stock_count > 0 ? 'var(--orange)' : 'var(--green)' }}>
            {summary?.low_stock_count}
          </div>
          <div className="stat-sub">need restocking</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Products</div>
          <div className="stat-value">{summary?.total_products}</div>
          <div className="stat-sub">active products</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="dash-charts">
        <div className="card">
          <div className="card-title">Sales (Last 14 Days)</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chart}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => fmt(v)} labelFormatter={d => `Date: ${d}`} />
              <Bar dataKey="total" fill="#0f172a" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-title">Top 5 Products</div>
          <div className="top-products">
            {topProds.map((p, i) => (
              <div key={i} className="top-product-row">
                <div className="top-product-rank">{i + 1}</div>
                <div className="top-product-info">
                  <div className="top-product-name">{p.name}</div>
                  <div className="top-product-bar-wrap">
                    <div className="top-product-bar"
                      style={{ width: `${(p.total_qty / (topProds[0]?.total_qty || 1)) * 100}%` }} />
                  </div>
                </div>
                <div className="top-product-qty">{p.total_qty} sold</div>
              </div>
            ))}
            {topProds.length === 0 && <div className="tbl-empty">No sales data yet</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
