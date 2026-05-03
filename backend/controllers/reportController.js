// backend/controllers/reportController.js
const { supabaseAdmin: db } = require('../utils/supabase');

const toCSV = (rows, cols) => {
  const header = cols.join(',');
  const body   = rows.map(r => cols.map(c => `"${r[c] ?? ''}"`).join(','));
  return [header, ...body].join('\n');
};

exports.getSalesReport = async (req, res, next) => {
  try {
    const { from, to, format = 'json' } = req.query;
    let q = db.from('invoices')
      .select('invoice_number, created_at, grand_total, payment_method, status, customers(name), profiles(full_name)')
      .order('created_at', { ascending: false });
    if (from) q = q.gte('created_at', from);
    if (to)   q = q.lte('created_at', to + 'T23:59:59');
    const { data, error } = await q;
    if (error) throw error;

    const flat = (data || []).map(r => ({
      invoice_number: r.invoice_number,
      date:           r.created_at?.split('T')[0],
      customer:       r.customers?.name || 'Walk-in',
      cashier:        r.profiles?.full_name,
      payment:        r.payment_method,
      status:         r.status,
      total:          r.grand_total,
    }));

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="sales-report.csv"');
      return res.send(toCSV(flat, ['invoice_number','date','customer','cashier','payment','status','total']));
    }

    const summary = {
      total_invoices: flat.length,
      total_revenue:  flat.reduce((s,r) => s + +r.total, 0).toFixed(2),
    };
    res.json({ success: true, data: flat, summary });
  } catch (err) { next(err); }
};

exports.getExpensesReport = async (req, res, next) => {
  try {
    const { from, to, format = 'json' } = req.query;
    let q = db.from('expenses')
      .select('title, amount, date, notes, expense_categories(name), profiles(full_name)')
      .order('date', { ascending: false });
    if (from) q = q.gte('date', from);
    if (to)   q = q.lte('date', to);
    const { data, error } = await q;
    if (error) throw error;

    const flat = (data || []).map(r => ({
      title:    r.title,
      amount:   r.amount,
      date:     r.date,
      category: r.expense_categories?.name,
      paid_by:  r.profiles?.full_name,
      notes:    r.notes || '',
    }));

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="expenses-report.csv"');
      return res.send(toCSV(flat, ['date','title','category','amount','paid_by','notes']));
    }

    const summary = {
      total_expenses: flat.length,
      total_amount:   flat.reduce((s,r) => s + +r.amount, 0).toFixed(2),
    };
    res.json({ success: true, data: flat, summary });
  } catch (err) { next(err); }
};

exports.getProfitReport = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const monthStart   = (from || new Date().toISOString().slice(0, 7) + '-01');
    const monthEnd     = to   || new Date().toISOString().split('T')[0];

    const [salesRes, expRes] = await Promise.all([
      db.from('invoices').select('grand_total').eq('status','paid')
        .gte('created_at', monthStart).lte('created_at', monthEnd + 'T23:59:59'),
      db.from('expenses').select('amount').gte('date', monthStart).lte('date', monthEnd),
    ]);

    const revenue  = (salesRes.data || []).reduce((s,r) => s + +r.grand_total, 0);
    const expenses = (expRes.data   || []).reduce((s,r) => s + +r.amount, 0);
    const profit   = revenue - expenses;

    res.json({ success: true, data: {
      from: monthStart, to: monthEnd,
      revenue:  +revenue.toFixed(2),
      expenses: +expenses.toFixed(2),
      profit:   +profit.toFixed(2),
      margin:   revenue > 0 ? +((profit / revenue) * 100).toFixed(1) : 0,
    }});
  } catch (err) { next(err); }
};
