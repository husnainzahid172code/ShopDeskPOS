// backend/controllers/userController.js
const { supabaseAdmin: db } = require('../utils/supabase');

exports.getAll = async (req, res, next) => {
  try {
    const { data, error } = await db.from('profiles').select('*').order('full_name');
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

exports.getById = async (req, res, next) => {
  try {
    const { data, error } = await db.from('profiles').select('*').eq('id', req.params.id).single();
    if (error) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

exports.updateRole = async (req, res, next) => {
  try {
    if (req.userRole !== 'admin')
      return res.status(403).json({ success: false, message: 'Admin only' });
    const { role } = req.body;
    const { data, error } = await db.from('profiles').update({ role })
      .eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

exports.toggleActive = async (req, res, next) => {
  try {
    if (req.userRole !== 'admin')
      return res.status(403).json({ success: false, message: 'Admin only' });
    const { data: user } = await db.from('profiles').select('is_active').eq('id', req.params.id).single();
    const { data, error } = await db.from('profiles')
      .update({ is_active: !user.is_active }).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) { next(err); }
};
