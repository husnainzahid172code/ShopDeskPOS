// backend/controllers/dashboardController.js
const { supabaseAdmin: db } = require('../utils/supabase');

exports.getSummary = async (req, res, next) => {
  try {
    const today      = new Date().toISOString().split('T')[0];
    const monthStart = today.slice(0, 7) + '-01';
    const yesterday  = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    const [todayInv, yesterdayInv, monthInv, expMonth, lowStock, totalProducts] = await Promise.all([
      db.from('invoices').select('grand_total').eq('status','paid').gte('created_at', today),
      db.from('invoices').select('grand_total').eq('status','paid').gte('created_at', yesterday).lt('created_at', today),
      db.from('invoices').select('grand_total').eq('status','paid').gte('created_at', monthStart),
      db.from('expenses').select('amount').gte('date', monthStart),
      db.from('products').select('id', { count: 'exact', head: true }).lte('stock', 5).eq('is_active', true),
      db.from('products').select('id', { count: 'exact', head: true }).eq('is_active', true),
    ]);

    const todaySales    = (todayInv.data    || []).reduce((s,r) => s + +r.grand_total, 0);
    const yesterdaySales= (yesterdayInv.data|| []).reduce((s,r) => s + +r.grand_total, 0);
    const monthlySales  = (monthInv.data    || []).reduce((s,r) => s + +r.grand_total, 0);
    const monthExpenses = (expMonth.data    || []).reduce((s,r) => s + +r.amount, 0);

    res.json({ success: true, data: {
      today_sales:     +todaySales.toFixed(2),
      yesterday_sales: +yesterdaySales.toFixed(2),
      today_invoices:  todayInv.data?.length || 0,
      monthly_sales:   +monthlySales.toFixed(2),
      monthly_expenses:+monthExpenses.toFixed(2),
      monthly_profit:  +(monthlySales - monthExpenses).toFixed(2),
      low_stock_count: lowStock.count || 0,
      total_products:  totalProducts.count || 0,
    }});
  } catch (err) { next(err); }
};

exports.getSalesChart = async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    const from = new Date(Date.now() - days * 86400000).toISOString();
    const { data, error } = await db.from('invoices')
      .select('grand_total, created_at').eq('status','paid').gte('created_at', from)
      .order('created_at');
    if (error) throw error;

    // Group by date
    const grouped = {};
    (data || []).forEach(inv => {
      const d = inv.created_at.split('T')[0];
      grouped[d] = (grouped[d] || 0) + +inv.grand_total;
    });
    const chart = Object.entries(grouped).map(([date, total]) => ({ date, total: +total.toFixed(2) }));
    res.json({ success: true, data: chart });
  } catch (err) { next(err); }
};

exports.getTopProducts = async (req, res, next) => {
  try {
    const { limit = 5 } = req.query;
    const { data, error } = await db.from('invoice_items')
      .select('name, product_id, qty, line_total').order('qty', { ascending: false });
    if (error) throw error;

    const map = {};
    (data || []).forEach(item => {
      const key = item.product_id || item.name;
      if (!map[key]) map[key] = { name: item.name, total_qty: 0, total_revenue: 0 };
      map[key].total_qty      += item.qty;
      map[key].total_revenue  += +item.line_total;
    });
    const top = Object.values(map)
      .sort((a, b) => b.total_qty - a.total_qty).slice(0, +limit);
    res.json({ success: true, data: top });
  } catch (err) { next(err); }
};
