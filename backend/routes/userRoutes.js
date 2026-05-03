// backend/routes/userRoutes.js
const express = require('express');
const r = express.Router();
const c = require('../controllers/userController');
r.get('/',                     c.getAll);
r.get('/:id',                  c.getById);
r.put('/:id/role',             c.updateRole);
r.put('/:id/toggle-active',    c.toggleActive);
module.exports = r;
