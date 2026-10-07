const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../utils/db');
const upload = require('../middleware/upload');
const { requireAuth, isAdminRole } = require('../middleware/auth');

router.get('/', async (req, res, next) => {
  try {
    const { q, category } = req.query;
    let items = await db.findMany('products', { status: 'approved' }, { orderBy: 'createdAt DESC' });
    if (q) {
      const query = q.toLowerCase();
      items = items.filter(p => (p.title_ar || '').toLowerCase().includes(query) || (p.title_en || '').toLowerCase().includes(query) || (p.description || '').toLowerCase().includes(query));
    }
    if (category) items = items.filter(p => p.categoryId === category);
    const categories = await db.findMany('categories', { type: 'product' });
    res.render('marketplace/list', { items, categories, q: q || '', category: category || '' });
  } catch (err) { next(err); }
});

router.get('/new', requireAuth, async (req, res, next) => {
  try {
    const [categories, myStore] = await Promise.all([
      db.findMany('categories', { type: 'product' }), db.findOne('stores', { ownerId: req.session.user.id })
    ]);
    res.render('marketplace/form', { categories, product: null, myStore });
  } catch (err) { next(err); }
});

router.post('/new', requireAuth, upload.array('images', 5), async (req, res, next) => {
  try {
    const { title_ar, title_en, description, price, categoryId } = req.body;
    const myStore = await db.findOne('stores', { ownerId: req.session.user.id });
    const product = { id: uuidv4(), sellerId: req.session.user.id, storeId: myStore ? myStore.id : null, title_ar: title_ar || '', title_en: title_en || title_ar || '', description: description || '', price: parseFloat(price) || 0, categoryId: categoryId || '', images: (req.files || []).map(f => '/uploads/' + f.filename), status: 'pending', createdAt: new Date().toISOString() };
    await db.insert('products', product);
    res.redirect('/marketplace/' + product.id);
  } catch (err) { next(err); }
});

router.get('/:id/edit', requireAuth, async (req, res, next) => {
  try {
    const product = await db.findOne('products', { id: req.params.id });
    if (!product) return res.status(404).render('errors/404', { message_key: 'no_results' });
    if (product.sellerId !== req.session.user.id && !isAdminRole(req.session.user.role)) return res.status(403).render('errors/404', { message_key: 'not_authorized' });
    const categories = await db.findMany('categories', { type: 'product' });
    res.render('marketplace/form', { categories, product, myStore: null });
  } catch (err) { next(err); }
});

router.post('/:id/edit', requireAuth, upload.array('images', 5), async (req, res, next) => {
  try {
    const product = await db.findOne('products', { id: req.params.id });
    if (!product) return res.status(404).render('errors/404', { message_key: 'no_results' });
    if (product.sellerId !== req.session.user.id && !isAdminRole(req.session.user.role)) return res.status(403).render('errors/404', { message_key: 'not_authorized' });
    const { title_ar, title_en, description, price, categoryId } = req.body;
    const newImages = (req.files || []).map(f => '/uploads/' + f.filename);
    await db.update('products', { id: req.params.id }, { title_ar, title_en: title_en || title_ar, description, price: parseFloat(price) || 0, categoryId, images: newImages.length ? newImages : product.images, status: 'pending' });
    res.redirect('/marketplace/' + product.id);
  } catch (err) { next(err); }
});

router.post('/:id/delete', requireAuth, async (req, res, next) => {
  try {
    const product = await db.findOne('products', { id: req.params.id });
    if (!product) return res.redirect('/marketplace');
    if (product.sellerId !== req.session.user.id && !isAdminRole(req.session.user.role)) return res.status(403).render('errors/404', { message_key: 'not_authorized' });
    await db.remove('products', { id: req.params.id });
    res.redirect('/marketplace');
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const product = await db.findOne('products', { id: req.params.id });
    if (!product) return res.status(404).render('errors/404', { message_key: 'no_results' });
    const [seller, store, reviews] = await Promise.all([
      db.findOne('users', { id: product.sellerId }),
      product.storeId ? db.findOne('stores', { id: product.storeId }) : null,
      db.findMany('reviews', { targetType: 'product', targetId: product.id }, { orderBy: 'createdAt DESC' })
    ]);
    res.render('marketplace/show', { product, seller, store, reviews });
  } catch (err) { next(err); }
});

module.exports = router;
