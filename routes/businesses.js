const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../utils/db');
const upload = require('../middleware/upload');
const { requireAuth, isAdminRole } = require('../middleware/auth');

router.get('/', async (req, res, next) => {
  try {
    const { q, category } = req.query;
    let items = await db.findMany('businesses', { status: 'approved' }, { orderBy: 'createdAt DESC' });
    if (q) { const query = q.toLowerCase(); items = items.filter(b => (b.name || '').toLowerCase().includes(query)); }
    if (category) items = items.filter(b => b.categoryId === category);
    const categories = await db.findMany('categories', { type: 'business' });
    res.render('businesses/list', { items, categories, q: q || '', category: category || '' });
  } catch (err) { next(err); }
});

router.get('/new', requireAuth, async (req, res, next) => {
  try { res.render('businesses/form', { business: null, categories: await db.findMany('categories', { type: 'business' }) }); }
  catch (err) { next(err); }
});

router.post('/new', requireAuth, upload.array('photos', 6), async (req, res, next) => {
  try {
    const { name, categoryId, description, address, phone, whatsapp, openingHours, socialLinks } = req.body;
    const business = { id: uuidv4(), ownerId: req.session.user.id, name: name || '', categoryId: categoryId || '', description: description || '', address: address || '', phone: phone || '', whatsapp: whatsapp || phone || '', openingHours: openingHours || '', socialLinks: socialLinks || '', photos: (req.files || []).map(f => '/uploads/' + f.filename), status: 'pending', createdAt: new Date().toISOString() };
    await db.insert('businesses', business);
    res.redirect('/businesses/' + business.id);
  } catch (err) { next(err); }
});

router.get('/:id/edit', requireAuth, async (req, res, next) => {
  try {
    const business = await db.findOne('businesses', { id: req.params.id });
    if (!business) return res.status(404).render('errors/404', { message_key: 'no_results' });
    if (business.ownerId !== req.session.user.id && !isAdminRole(req.session.user.role)) return res.status(403).render('errors/404', { message_key: 'not_authorized' });
    const categories = await db.findMany('categories', { type: 'business' });
    res.render('businesses/form', { business, categories });
  } catch (err) { next(err); }
});

router.post('/:id/edit', requireAuth, upload.array('photos', 6), async (req, res, next) => {
  try {
    const business = await db.findOne('businesses', { id: req.params.id });
    if (!business) return res.status(404).render('errors/404', { message_key: 'no_results' });
    if (business.ownerId !== req.session.user.id && !isAdminRole(req.session.user.role)) return res.status(403).render('errors/404', { message_key: 'not_authorized' });
    const { name, categoryId, description, address, phone, whatsapp, openingHours, socialLinks } = req.body;
    const newPhotos = (req.files || []).map(f => '/uploads/' + f.filename);
    await db.update('businesses', { id: req.params.id }, { name, categoryId, description, address, phone, whatsapp: whatsapp || phone, openingHours, socialLinks, photos: newPhotos.length ? newPhotos : business.photos, status: 'pending' });
    res.redirect('/businesses/' + business.id);
  } catch (err) { next(err); }
});

router.post('/:id/delete', requireAuth, async (req, res, next) => {
  try {
    const business = await db.findOne('businesses', { id: req.params.id });
    if (!business) return res.redirect('/businesses');
    if (business.ownerId !== req.session.user.id && !isAdminRole(req.session.user.role)) return res.status(403).render('errors/404', { message_key: 'not_authorized' });
    await db.remove('businesses', { id: req.params.id });
    res.redirect('/businesses');
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const business = await db.findOne('businesses', { id: req.params.id });
    if (!business) return res.status(404).render('errors/404', { message_key: 'no_results' });
    const reviews = await db.findMany('reviews', { targetType: 'business', targetId: business.id }, { orderBy: 'createdAt DESC' });
    const avgRating = reviews.length ? (reviews.reduce((s, r) => s + Number(r.rating), 0) / reviews.length).toFixed(1) : null;
    res.render('businesses/show', { business, reviews, avgRating });
  } catch (err) { next(err); }
});

module.exports = router;
