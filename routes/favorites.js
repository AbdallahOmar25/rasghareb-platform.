const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../utils/db');
const { requireAuth } = require('../middleware/auth');

router.post('/:type/:id', requireAuth, async (req, res, next) => {
  try {
    const { type, id } = req.params;
    const userId = req.session.user.id;
    const existing = await db.findOne('favorites', { userId, targetType: type, targetId: id });
    if (existing) await db.remove('favorites', { id: existing.id });
    else await db.insert('favorites', { id: uuidv4(), userId, targetType: type, targetId: id });
    res.redirect(req.get('Referrer') || '/');
  } catch (err) { next(err); }
});
module.exports = router;
