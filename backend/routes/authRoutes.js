// backend/routes/authRoutes.js
const express = require('express');
const r       = express.Router();
const c       = require('../controllers/authController');
const auth    = require('../middleware/authMiddleware');

r.post('/register', c.register);
r.post('/login',    c.login);
r.post('/logout',   c.logout);
r.get('/me',        auth, c.me);
r.post('/refresh',  c.refreshToken);

module.exports = r;
