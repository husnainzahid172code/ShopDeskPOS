// backend/controllers/expenseController.js
const { supabaseAdmin: db } = require('../utils/supabase');

exports.getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, from, to, category_id } = req.query;
    const offset = (page - 1) * limit;
    let q = db.from('expenses')
      .select('*, expense_categories(name), profiles(full_name)', { count: 'exact' })
      .order('date', { ascending: false }).range(offset, offset + +limit - 1);
    if (from)        q = q.gte('date', from);
    if (to)          q = q.lte('date', to);
    if (category_id) q = q.eq('category_id', category_id);
    const { data, error, count } = await q;
    if (error) throw error;
    res.json({ success: true, data, meta: { total: count, page: +page } });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { data, error } = await db.from('expenses')
      .insert({ ...req.body, paid_by: req.user.id }).select('*, expense_categories(name)').single();
    if (error) throw error;
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const { data, error } = await db.from('expenses')
      .update(req.body).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    await db.from('expenses').delete().eq('id', req.params.id);
    res.json({ success: true, message: 'Deleted' });
  } catch (err) { next(err); }
};

exports.getCategories = async (req, res, next) => {
  try {
    const { data } = await db.from('expense_categories').select('*').order('name');
    res.json({ success: true, data });
  } catch (err) { next(err); }
};
