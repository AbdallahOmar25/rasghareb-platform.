const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../utils/db');
const { requireRole, requirePrimaryAdmin, requireAdminPermission } = require('../middleware/auth');

const collections = { products: 'products', professionals: 'professionals', stores: 'stores', businesses: 'businesses' };
const permissions = ['users', 'listings', 'categories', 'reports', 'content'];

router.use(requireRole('admin'));

router.get('/', async (req, res, next) => {
  try {
    const [users, products, professionals, stores, businesses, pendingProducts, pendingProfessionals, pendingStores, pendingBusinesses] = await Promise.all([
      db.count('users'), db.count('products'), db.count('professionals'), db.count('stores'), db.count('businesses'),
      db.count('products', { status: 'pending' }), db.count('professionals', { status: 'pending' }), db.count('stores', { status: 'pending' }), db.count('businesses', { status: 'pending' })
    ]);
    const stats = { users, products, professionals, stores, businesses, pendingProducts, pendingProfessionals, pendingStores, pendingBusinesses };
    res.render('admin/dashboard', { stats, permissions, isPrimary: req.session.user.role === 'primary_admin' });
  } catch (err) { next(err); }
});

router.get('/listings/:type', requireAdminPermission('listings'), async (req, res, next) => {
  try {
    const type = req.params.type;
    if (!collections[type]) return res.redirect('/admin');
    const filter = req.query.status;
    const items = await db.findMany(type, filter ? { status: filter } : {}, { orderBy: 'createdAt DESC' });
    res.render('admin/listings', { items, type, filter: filter || '' });
  } catch (err) { next(err); }
});

router.post('/listings/:type/:id/approve', requireAdminPermission('listings'), async (req, res, next) => {
  try { if (collections[req.params.type]) await db.update(req.params.type, { id: req.params.id }, { status: 'approved' }); res.redirect(req.headers.referer || '/admin'); }
  catch (err) { next(err); }
});
router.post('/listings/:type/:id/reject', requireAdminPermission('listings'), async (req, res, next) => {
  try { if (collections[req.params.type]) await db.update(req.params.type, { id: req.params.id }, { status: 'rejected' }); res.redirect(req.headers.referer || '/admin'); }
  catch (err) { next(err); }
});
router.post('/listings/:type/:id/delete', requireAdminPermission('listings'), async (req, res, next) => {
  try { if (collections[req.params.type]) await db.remove(req.params.type, { id: req.params.id }); res.redirect(req.headers.referer || '/admin'); }
  catch (err) { next(err); }
});

router.get('/users', requireAdminPermission('users'), async (req, res, next) => {
  try { res.render('admin/users', { users: await db.findMany('users', {}, { orderBy: 'createdAt DESC' }) }); }
  catch (err) { next(err); }
});
router.post('/users/:id/ban', requireAdminPermission('users'), async (req, res, next) => {
  try {
    const user = await db.findOne('users', { id: req.params.id });
    if (user && ['primary_admin', 'admin'].includes(user.role)) return res.status(403).render('errors/404', { message_key: 'not_authorized' });
    await db.update('users', { id: req.params.id }, { status: 'banned' }); res.redirect('/admin/users');
  } catch (err) { next(err); }
});
router.post('/users/:id/unban', requireAdminPermission('users'), async (req, res, next) => {
  try { await db.update('users', { id: req.params.id }, { status: 'active' }); res.redirect('/admin/users'); }
  catch (err) { next(err); }
});

router.get('/categories', requireAdminPermission('categories'), async (req, res, next) => {
  try { res.render('admin/categories', { categories: await db.findMany('categories') }); }
  catch (err) { next(err); }
});
router.post('/categories/new', requireAdminPermission('categories'), async (req, res, next) => {
  try {
    const { name_ar, name_en, type } = req.body;
    await db.insert('categories', { id: uuidv4(), name_ar: name_ar || '', name_en: name_en || name_ar || '', type: type === 'business' ? 'business' : 'product' });
    res.redirect('/admin/categories');
  } catch (err) { next(err); }
});
router.post('/categories/:id/delete', requireAdminPermission('categories'), async (req, res, next) => {
  try { await db.remove('categories', { id: req.params.id }); res.redirect('/admin/categories'); }
  catch (err) { next(err); }
});

// Primary Admin only: administrator management.
router.get('/admins', requirePrimaryAdmin, async (req, res, next) => {
  try { res.render('admin/admins', { admins: await db.findMany('users', {}, { orderBy: 'createdAt DESC' }), permissions }); }
  catch (err) { next(err); }
});

router.post('/admins/new', requirePrimaryAdmin, async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const selected = Array.isArray(req.body.permissions) ? req.body.permissions : (req.body.permissions ? [req.body.permissions] : []);
    if (!name || !email || !password) return res.redirect('/admin/admins?error=missing');
    const normalizedEmail = email.toLowerCase().trim();
    if (await db.findOne('users', { email: normalizedEmail })) return res.redirect('/admin/admins?error=exists');
    await db.insert('users', {
      id: uuidv4(), name: name.trim(), email: normalizedEmail, passwordHash: bcrypt.hashSync(password, 10),
      role: 'secondary_admin', phone: '', whatsapp: '', status: 'active', permissions: selected.filter(p => permissions.includes(p)), createdAt: new Date().toISOString()
    });
    res.redirect('/admin/admins');
  } catch (err) { next(err); }
});

router.post('/admins/:id/update', requirePrimaryAdmin, async (req, res, next) => {
  try {
    const admin = await db.findOne('users', { id: req.params.id });
    if (!admin || admin.role !== 'secondary_admin') return res.status(403).render('errors/404', { message_key: 'not_authorized' });
    const selected = Array.isArray(req.body.permissions) ? req.body.permissions : (req.body.permissions ? [req.body.permissions] : []);
    const email = (req.body.email || admin.email).toLowerCase().trim();
    const existingEmail = await db.findOne('users', { email });
    if (existingEmail && existingEmail.id !== admin.id) return res.redirect('/admin/admins?error=exists');
    const data = { name: req.body.name || admin.name, email, permissions: selected.filter(p => permissions.includes(p)), status: req.body.status === 'inactive' ? 'inactive' : 'active' };
    if (req.body.password) data.passwordHash = bcrypt.hashSync(req.body.password, 10);
    await db.update('users', { id: req.params.id }, data);
    res.redirect('/admin/admins');
  } catch (err) { next(err); }
});

router.post('/admins/:id/delete', requirePrimaryAdmin, async (req, res, next) => {
  try {
    const admin = await db.findOne('users', { id: req.params.id });
    if (!admin || admin.role !== 'secondary_admin') return res.status(403).render('errors/404', { message_key: 'not_authorized' });
    await db.remove('users', { id: req.params.id });
    res.redirect('/admin/admins');
  } catch (err) { next(err); }
});

module.exports = router;
