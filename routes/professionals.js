const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../utils/db');
const upload = require('../middleware/upload');
const { requireAuth, isAdminRole } = require('../middleware/auth');

router.get('/', async (req, res, next) => {
  try {
    const { q, profession } = req.query;
    let items = await db.findMany('professionals', { status: 'approved' }, { orderBy: 'createdAt DESC' });
    if (q) { const query = q.toLowerCase(); items = items.filter(p => (p.name || '').toLowerCase().includes(query) || (p.profession_ar || '').toLowerCase().includes(query) || (p.profession_en || '').toLowerCase().includes(query)); }
    if (profession) items = items.filter(p => p.profession_ar === profession || p.profession_en === profession);
    const all = await db.findMany('professionals');
    const professionsList = [...new Set(all.map(p => p.profession_ar).filter(Boolean))];
    res.render('professionals/list', { items, professionsList, q: q || '', profession: profession || '' });
  } catch (err) { next(err); }
});

router.get('/new', requireAuth, (req, res) => res.render('professionals/form', { professional: null }));

router.post('/new', requireAuth, upload.single('photo'), async (req, res, next) => {
  try {
    const { name, profession_ar, profession_en, bio, phone, whatsapp, serviceArea, workingHours, services, socialLinks } = req.body;
    const professional = { id: uuidv4(), userId: req.session.user.id, name: name || req.session.user.name, profession_ar: profession_ar || '', profession_en: profession_en || profession_ar || '', bio: bio || '', phone: phone || '', whatsapp: whatsapp || phone || '', socialLinks: socialLinks || '', serviceArea: serviceArea || '', workingHours: workingHours || '', services: (services || '').split(',').map(s => s.trim()).filter(Boolean), photo: req.file ? '/uploads/' + req.file.filename : '', status: 'pending', createdAt: new Date().toISOString() };
    await db.insert('professionals', professional);
    res.redirect('/professionals/' + professional.id);
  } catch (err) { next(err); }
});

router.get('/:id/edit', requireAuth, async (req, res, next) => {
  try {
    const professional = await db.findOne('professionals', { id: req.params.id });
    if (!professional) return res.status(404).render('errors/404', { message_key: 'no_results' });
    if (professional.userId !== req.session.user.id && !isAdminRole(req.session.user.role)) return res.status(403).render('errors/404', { message_key: 'not_authorized' });
    res.render('professionals/form', { professional });
  } catch (err) { next(err); }
});

router.post('/:id/edit', requireAuth, upload.single('photo'), async (req, res, next) => {
  try {
    const professional = await db.findOne('professionals', { id: req.params.id });
    if (!professional) return res.status(404).render('errors/404', { message_key: 'no_results' });
    if (professional.userId !== req.session.user.id && !isAdminRole(req.session.user.role)) return res.status(403).render('errors/404', { message_key: 'not_authorized' });
    const { name, profession_ar, profession_en, bio, phone, whatsapp, serviceArea, workingHours, services, socialLinks } = req.body;
    await db.update('professionals', { id: req.params.id }, { name, profession_ar, profession_en: profession_en || profession_ar, bio, phone, whatsapp: whatsapp || phone, socialLinks: socialLinks || '', serviceArea, workingHours, services: (services || '').split(',').map(s => s.trim()).filter(Boolean), photo: req.file ? '/uploads/' + req.file.filename : professional.photo, status: 'pending' });
    res.redirect('/professionals/' + professional.id);
  } catch (err) { next(err); }
});

router.post('/:id/delete', requireAuth, async (req, res, next) => {
  try {
    const professional = await db.findOne('professionals', { id: req.params.id });
    if (!professional) return res.redirect('/professionals');
    if (professional.userId !== req.session.user.id && !isAdminRole(req.session.user.role)) return res.status(403).render('errors/404', { message_key: 'not_authorized' });
    await db.remove('professionals', { id: req.params.id });
    res.redirect('/professionals');
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const professional = await db.findOne('professionals', { id: req.params.id });
    if (!professional) return res.status(404).render('errors/404', { message_key: 'no_results' });
    const reviews = await db.findMany('reviews', { targetType: 'professional', targetId: professional.id }, { orderBy: 'createdAt DESC' });
    const avgRating = reviews.length ? (reviews.reduce((s, r) => s + Number(r.rating), 0) / reviews.length).toFixed(1) : null;
    res.render('professionals/show', { professional, reviews, avgRating });
  } catch (err) { next(err); }
});

module.exports = router;
