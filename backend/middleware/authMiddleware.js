// backend/middleware/authMiddleware.js
const { supabaseAnon, supabaseAdmin } = require('../utils/supabase');

module.exports = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'No token provided' });

  const { data: { user }, error } = await supabaseAnon.auth.getUser(token);
  if (error || !user) return res.status(401).json({ success: false, message: 'Unauthorized' });

  // Fetch role from profiles
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role, is_active, full_name')
    .eq('id', user.id)
    .single();

  if (!profile?.is_active)
    return res.status(403).json({ success: false, message: 'Account disabled' });

  req.user     = user;
  req.profile  = profile;
  req.userRole = profile?.role || 'cashier';
  next();
};
