const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../utils/db');

router.get('/register', (req, res) => {
  res.render('auth/register', { error: null, form: {} });
});

router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, phone, whatsapp, role } = req.body;
    const allowedRoles = ['customer', 'seller', 'professional', 'business_owner'];
    const finalRole = allowedRoles.includes(role) ? role : 'customer';

    if (!name || !email || !password) {
      return res.render('auth/register', { error: 'يرجى ملء جميع الحقول المطلوبة', form: req.body });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await db.findOne('users', { email: normalizedEmail });
    if (existing) {
      return res.render('auth/register', { error: 'هذا البريد الإلكتروني مسجل بالفعل', form: req.body });
    }

    const user = {
      id: uuidv4(), name: name.trim(), email: normalizedEmail,
      passwordHash: bcrypt.hashSync(password, 10), role: finalRole,
      phone: phone || '', whatsapp: whatsapp || phone || '', status: 'active',
      permissions: [], createdAt: new Date().toISOString()
    };
    await db.insert('users', user);

    req.session.user = { id: user.id, name: user.name, email: user.email, role: user.role, permissions: [] };
    res.redirect('/');
  } catch (err) { next(err); }
});

router.get('/login', (req, res) => {
  res.render('auth/login', { error: null, email: '' });
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await db.findOne('users', { email: (email || '').toLowerCase().trim() });
    if (!user || !bcrypt.compareSync(password || '', user.passwordHash)) {
      return res.render('auth/login', { error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة', email });
    }
    if (user.status === 'banned' || user.status === 'inactive') {
      return res.render('auth/login', { error: 'هذا الحساب غير نشط', email });
    }

    let role = user.role === 'admin' ? 'primary_admin' : user.role;
    if (role !== user.role) await db.update('users', { id: user.id }, { role });
    const permissions = Array.isArray(user.permissions) ? user.permissions : [];
    await db.update('users', { id: user.id }, { lastLogin: new Date().toISOString() });

    req.session.user = { id: user.id, name: user.name, email: user.email, role, permissions };
    const dest = req.session.returnTo || (role === 'primary_admin' || role === 'secondary_admin' ? '/admin' : '/');
    delete req.session.returnTo;
    res.redirect(dest);
  } catch (err) { next(err); }
});

router.post('/logout', (req, res) => req.session.destroy(() => res.redirect('/')));
router.get('/logout', (req, res) => req.session.destroy(() => res.redirect('/')));

module.exports = router;
