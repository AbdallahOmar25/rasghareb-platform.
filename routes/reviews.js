const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../utils/db');
const { requireAuth } = require('../middleware/auth');
const redirectMap = { product: '/marketplace/', professional: '/professionals/', store: '/stores/', business: '/businesses/' };

router.post('/:type/:id', requireAuth, async (req, res, next) => {
  try {
    const { type, id } = req.params;
    if (!redirectMap[type]) return res.status(400).send('Invalid target type');
    const { rating, comment } = req.body;
    await db.insert('reviews', { id: uuidv4(), targetType: type, targetId: id, userId: req.session.user.id, userName: req.session.user.name, rating: Math.min(5, Math.max(1, parseInt(rating) || 5)), comment: comment || '', createdAt: new Date().toISOString() });
    res.redirect(redirectMap[type] + id);
  } catch (err) { next(err); }
});
module.exports = router;
