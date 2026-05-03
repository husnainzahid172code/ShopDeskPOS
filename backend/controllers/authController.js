// backend/controllers/authController.js
const { supabaseAnon, supabaseAdmin } = require('../utils/supabase');

exports.register = async (req, res, next) => {
  try {
    const { email, password, full_name, role = 'cashier' } = req.body;
    if (!email || !password || !full_name)
      return res.status(400).json({ success: false, message: 'email, password and full_name required' });

    // Validate role
    const validRoles = ['admin', 'manager', 'cashier'];
    const finalRole = validRoles.includes(role) ? role : 'cashier';

    // Use admin client to bypass email confirmation
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email, 
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: { full_name, role: finalRole } // Ensure role is in raw_user_meta_data
    });
    if (error) {
      console.error('Supabase registration error:', error);
      throw error;
    }

    // Verify profile was created by the trigger
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      console.warn('Profile creation may have failed:', profileError);
      // Don't fail registration - profile might exist with slight delay
    }

    res.status(201).json({ 
      success: true, 
      message: 'Registered successfully. You can now login.', 
      data: { ...data.user, profile } 
    });
  } catch (err) { 
    console.error('Registration error:', err);
    next(err); 
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { data, error } = await supabaseAnon.auth.signInWithPassword({ email, password });
    if (error) {
      console.error('Supabase login error:', error);
      return res.status(401).json({ success: false, message: error.message });
    }

    const { data: profile, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileErr) {
      console.error('Profile lookup error during login for user', data.user.id, ':', profileErr);
      // If profile doesn't exist, try to create it from auth metadata
      if (profileErr.code === 'PGRST116') { // not found
        const { error: createErr } = await supabaseAdmin
          .from('profiles')
          .insert({
            id: data.user.id,
            full_name: data.user.raw_user_meta_data?.full_name || data.user.email,
            role: data.user.raw_user_meta_data?.role || 'cashier'
          });
        if (createErr) {
          console.error('Failed to auto-create profile:', createErr);
          return res.status(500).json({ success: false, message: 'Profile not found and could not be created' });
        }
        // Profile was just created, fetch it
        const { data: newProfile } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();
        return res.json({
          success: true,
          token:   data.session.access_token,
          refresh: data.session.refresh_token,
          user:    { ...data.user, profile: newProfile },
        });
      }
    }

    res.json({
      success: true,
      token:   data.session.access_token,
      refresh: data.session.refresh_token,
      user:    { ...data.user, profile },
    });
  } catch (err) { 
    console.error('Login error:', err);
    next(err); 
  }
};

exports.logout = async (req, res, next) => {
  try {
    await supabaseAnon.auth.signOut();
    res.json({ success: true, message: 'Logged out' });
  } catch (err) { next(err); }
};

exports.me = async (req, res) => {
  res.json({ success: true, data: { user: req.user, profile: req.profile } });
};

exports.refreshToken = async (req, res, next) => {
  try {
    const { refresh_token } = req.body;
    const { data, error } = await supabaseAnon.auth.refreshSession({ refresh_token });
    if (error) throw error;
    res.json({ success: true, token: data.session.access_token });
  } catch (err) { next(err); }
};
