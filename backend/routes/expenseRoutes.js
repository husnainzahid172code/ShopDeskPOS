// backend/routes/expenseRoutes.js
const express = require('express');
const r = express.Router();
const c = require('../controllers/expenseController');
r.get('/',             c.getAll);
r.get('/categories',   c.getCategories);
r.post('/',            c.create);
r.put('/:id',          c.update);
r.delete('/:id',       c.remove);
module.exports = r;
