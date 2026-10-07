const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../utils/db');
const upload = require('../middleware/upload');
const { requireAuth, isAdminRole } = require('../middleware/auth');

router.get('/', async (req, res, next) => {
  try {
    const { q } = req.query;
    let items = await db.findMany('stores', { status: 'approved' }, { orderBy: 'createdAt DESC' });
    if (q) { const query = q.toLowerCase(); items = items.filter(s => (s.name || '').toLowerCase().includes(query)); }
    res.render('stores/list', { items, q: q || '' });
  } catch (err) { next(err); }
});

router.get('/new', requireAuth, async (req, res, next) => {
  try {
    const myStore = await db.findOne('stores', { ownerId: req.session.user.id });
    if (myStore) return res.redirect('/stores/' + myStore.id + '/dashboard');
    res.render('stores/form', { store: null });
  } catch (err) { next(err); }
});

router.post('/new', requireAuth, upload.fields([{ name: 'logo', maxCount: 1 }, { name: 'cover', maxCount: 1 }]), async (req, res, next) => {
  try {
    const existing = await db.findOne('stores', { ownerId: req.session.user.id });
    if (existing) return res.redirect('/stores/' + existing.id + '/dashboard');
    const { name, description, phone, whatsapp, socialLinks } = req.body;
    const store = { id: uuidv4(), ownerId: req.session.user.id, name: name || '', description: description || '', phone: phone || '', whatsapp: whatsapp || phone || '', socialLinks: socialLinks || '', logo: req.files && req.files.logo ? '/uploads/' + req.files.logo[0].filename : '', cover: req.files && req.files.cover ? '/uploads/' + req.files.cover[0].filename : '', status: 'pending', createdAt: new Date().toISOString() };
    await db.insert('stores', store);
    res.redirect('/stores/' + store.id + '/dashboard');
  } catch (err) { next(err); }
});

router.get('/:id/dashboard', requireAuth, async (req, res, next) => {
  try {
    const store = await db.findOne('stores', { id: req.params.id });
    if (!store) return res.status(404).render('errors/404', { message_key: 'no_results' });
    if (store.ownerId !== req.session.user.id && !isAdminRole(req.session.user.role)) return res.status(403).render('errors/404', { message_key: 'not_authorized' });
    const products = await db.findMany('products', { storeId: store.id }, { orderBy: 'createdAt DESC' });
    res.render('stores/dashboard', { store, products });
  } catch (err) { next(err); }
});

router.post('/:id/edit', requireAuth, upload.fields([{ name: 'logo', maxCount: 1 }, { name: 'cover', maxCount: 1 }]), async (req, res, next) => {
  try {
    const store = await db.findOne('stores', { id: req.params.id });
    if (!store) return res.redirect('/stores');
    if (store.ownerId !== req.session.user.id && !isAdminRole(req.session.user.role)) return res.status(403).render('errors/404', { message_key: 'not_authorized' });
    const { name, description, phone, whatsapp, socialLinks } = req.body;
    await db.update('stores', { id: req.params.id }, { name, description, phone, whatsapp: whatsapp || phone, socialLinks: socialLinks || '', logo: req.files && req.files.logo ? '/uploads/' + req.files.logo[0].filename : store.logo, cover: req.files && req.files.cover ? '/uploads/' + req.files.cover[0].filename : store.cover });
    res.redirect('/stores/' + store.id + '/dashboard');
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const store = await db.findOne('stores', { id: req.params.id });
    if (!store) return res.status(404).render('errors/404', { message_key: 'no_results' });
    const [products, reviews] = await Promise.all([
      db.findMany('products', { storeId: store.id, status: 'approved' }, { orderBy: 'createdAt DESC' }),
      db.findMany('reviews', { targetType: 'store', targetId: store.id }, { orderBy: 'createdAt DESC' })
    ]);
    const avgRating = reviews.length ? (reviews.reduce((s, r) => s + Number(r.rating), 0) / reviews.length).toFixed(1) : null;
    res.render('stores/show', { store, products, reviews, avgRating });
  } catch (err) { next(err); }
});

module.exports = router;
