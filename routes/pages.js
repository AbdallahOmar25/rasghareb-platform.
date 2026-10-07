const express = require('express');
const router = express.Router();
const db = require('../utils/db');
const { requireAuth } = require('../middleware/auth');

const siteContact = {
  whatsapp: 'https://wa.me/966500000000',
  email: 'info@rasghareb.com',
  facebook: 'https://facebook.com/rasghareb',
  instagram: 'https://instagram.com/rasghareb'
};

router.get('/', async (req, res, next) => {
  try {
    const [products, professionals, businesses, stores] = await Promise.all([
      db.findMany('products', { status: 'approved' }, { orderBy: 'createdAt DESC', limit: 8 }),
      db.findMany('professionals', { status: 'approved' }, { orderBy: 'createdAt DESC', limit: 8 }),
      db.findMany('businesses', { status: 'approved' }, { orderBy: 'createdAt DESC', limit: 8 }),
      db.findMany('stores', { status: 'approved' }, { orderBy: 'createdAt DESC', limit: 8 })
    ]);
    res.render('home', { products, professionals, businesses, stores, siteContact });
  } catch (err) { next(err); }
});

router.get('/search', (req, res) => {
  const { q, type } = req.query;
  const dest = { product: '/marketplace', professional: '/professionals', store: '/stores', business: '/businesses' };
  res.redirect((dest[type] || '/marketplace') + '?q=' + encodeURIComponent(q || ''));
});

router.get('/dashboard', requireAuth, async (req, res, next) => {
  try {
    const userId = req.session.user.id;
    const [myProducts, myProfessionalProfile, myStore, myBusinesses, myFavorites] = await Promise.all([
      db.findMany('products', { sellerId: userId }, { orderBy: 'createdAt DESC' }),
      db.findOne('professionals', { userId }),
      db.findOne('stores', { ownerId: userId }),
      db.findMany('businesses', { ownerId: userId }, { orderBy: 'createdAt DESC' }),
      db.findMany('favorites', { userId })
    ]);
    res.render('dashboard', { myProducts, myProfessionalProfile, myStore, myBusinesses, myFavorites });
  } catch (err) { next(err); }
});

router.get('/about', (req, res) => res.render('about', { siteContact }));
router.get('/contact', (req, res) => res.render('contact', { siteContact }));
router.get('/lumora', (req, res) => res.sendFile(require('path').join(__dirname, '../index.html')));

module.exports = router;
