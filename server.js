require('dotenv').config();
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const path = require('path');

const { t } = require('./utils/i18n');
const db = require('./utils/db');

const app = express();
const PORT = process.env.PORT || 3000;

// ---------- View engine ----------
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layout');

// ---------- Core middleware ----------
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public'), { index: false }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 } // 7 days
  // ملاحظة: التخزين الافتراضي للجلسات في الذاكرة فقط، وسيُعاد ضبطه عند إعادة تشغيل السيرفر.
  // للإنتاج على نطاق أوسع يفضّل استخدام store خارجي (راجع DEPLOY.md).
}));

// ---------- Language handling ----------
app.use((req, res, next) => {
  let lang = req.cookies.lang || 'ar';
  if (req.query.lang && ['ar', 'en'].includes(req.query.lang)) {
    lang = req.query.lang;
    res.cookie('lang', lang, { maxAge: 365 * 24 * 60 * 60 * 1000 });
  }
  req.lang = lang;
  res.locals.lang = lang;
  res.locals.dir = lang === 'ar' ? 'rtl' : 'ltr';
  res.locals.t = (key) => t(key, lang);
  res.locals.currentUser = req.session.user || null;
  res.locals.currentPath = req.path;
  next();
});

// ---------- Routes ----------
app.use('/auth', require('./routes/auth'));
app.use('/marketplace', require('./routes/marketplace'));
app.use('/professionals', require('./routes/professionals'));
app.use('/stores', require('./routes/stores'));
app.use('/businesses', require('./routes/businesses'));
app.use('/reviews', require('./routes/reviews'));
app.use('/favorites', require('./routes/favorites'));
app.use('/admin', require('./routes/admin'));
app.use('/', require('./routes/pages'));

// ---------- 404 ----------
app.use((req, res) => {
  res.status(404).render('errors/404', { message_key: 'no_results' });
});

// ---------- Error handler ----------
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send('Server Error: ' + err.message);
});

const { initDatabase } = require('./utils/db-init');

initDatabase().finally(() => {
  app.listen(PORT, () => {
    console.log(`✅ منصة رأس غارب تعمل الآن على المنفذ ${PORT}`);
    console.log(`   افتح المتصفح على: http://localhost:${PORT}`);
  });
});
