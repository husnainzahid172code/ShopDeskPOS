// backend/middleware/roleGuard.js
module.exports = (...allowedRoles) => (req, res, next) => {
  if (!allowedRoles.includes(req.userRole)) {
    return res.status(403).json({ success: false, message: `Access denied. Required: ${allowedRoles.join('/')}` });
  }
  next();
};
