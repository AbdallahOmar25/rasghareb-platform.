require('dotenv').config();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('./utils/db');

const dataPath = path.join(__dirname, 'data', 'db.json');
const source = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

const tableFields = {
  users: ['id','name','email','passwordHash','role','phone','whatsapp','status','permissions','createdAt'],
  categories: ['id','name_ar','name_en','type'],
  products: ['id','sellerId','storeId','title_ar','title_en','description','price','categoryId','images','status','createdAt'],
  professionals: ['id','userId','name','profession_ar','profession_en','bio','phone','whatsapp','serviceArea','workingHours','services','photo','status','createdAt'],
  stores: ['id','ownerId','name','description','phone','whatsapp','logo','cover','status','createdAt'],
  businesses: ['id','ownerId','name','categoryId','description','address','phone','whatsapp','openingHours','socialLinks','photos','status','createdAt'],
  reviews: ['id','targetType','targetId','userId','userName','rating','comment','createdAt'],
  favorites: ['id','userId','targetType','targetId'],
  reports: ['id','reporterId','targetType','targetId','reason','status','createdAt']
};

async function migrateTable(table) {
  const rows = Array.isArray(source[table]) ? source[table] : [];
  for (const row of rows) {
    const data = {};
    for (const field of tableFields[table]) {
      if (Object.prototype.hasOwnProperty.call(row, field)) data[field] = row[field];
    }
    if (table === 'users') {
      if (data.role === 'admin') data.role = 'primary_admin';
      if (!data.permissions) data.permissions = [];
    }
    const existing = data.email ? await db.findOne(table, { email: data.email }) : await db.findOne(table, { id: data.id });
    if (existing) await db.update(table, { id: existing.id }, data);
    else await db.insert(table, data);
  }
}

async function ensurePrimaryAdmin() {
  const primaryAdmins = await db.findMany('users', { role: 'primary_admin' }, { orderBy: 'createdAt ASC' });
  let primary = primaryAdmins[0] || null;

  // Guarantee exactly one Primary Admin. Any legacy duplicate admin is demoted.
  for (const duplicate of primaryAdmins.slice(1)) {
    await db.update('users', { id: duplicate.id }, { role: 'secondary_admin', permissions: [] });
  }

  if (!primary) {
    const email = (process.env.DEFAULT_ADMIN_EMAIL || 'admin@rasghareb.local').toLowerCase();
    const password = process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@12345';
    const existing = await db.findOne('users', { email });
    if (existing) {
      await db.update('users', { id: existing.id }, { role: 'primary_admin', status: 'active', permissions: [] });
      primary = { ...existing, role: 'primary_admin' };
    } else {
      primary = { id: uuidv4(), name: 'Primary Admin', email, passwordHash: bcrypt.hashSync(password, 10), role: 'primary_admin', phone: '', whatsapp: '', status: 'active', permissions: [], createdAt: new Date().toISOString() };
      await db.insert('users', primary);
    }
    console.log('Primary Admin:', email);
    if (!existing) console.log('Password:', password);
  }
  await db.query('INSERT INTO platform_settings (settingKey, settingValue) VALUES (?, ?) ON DUPLICATE KEY UPDATE settingValue = VALUES(settingValue)', ['primary_admin_id', primary.id]);
}

async function seedCategories() {
  if (await db.count('categories') > 0) return;
  const productCategories = [['أثاث منزلي','Home Furniture'],['أجهزة إلكترونية','Electronics'],['ملابس','Clothing'],['سيارات وقطع غيار','Cars & Parts'],['عقارات','Real Estate'],['أخرى','Other']];
  const businessCategories = [['مطاعم وكافيهات','Restaurants & Cafes'],['سوبر ماركت','Supermarkets'],['صيدليات','Pharmacies'],['فنادق','Hotels'],['خدمات سيارات','Car Services'],['مكاتب وشركات','Offices & Companies']];
  for (const [ar,en] of productCategories) await db.insert('categories', { id: uuidv4(), name_ar: ar, name_en: en, type: 'product' });
  for (const [ar,en] of businessCategories) await db.insert('categories', { id: uuidv4(), name_ar: ar, name_en: en, type: 'business' });
}

(async () => {
  try {
    for (const table of Object.keys(tableFields)) await migrateTable(table);
    await ensurePrimaryAdmin();
    await seedCategories();
    console.log('Database migration/seed completed successfully.');
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  } finally {
    await db.close();
  }
})();
