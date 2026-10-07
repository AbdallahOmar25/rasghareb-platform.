const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('./db');

const defaultCategories = [
  { id: 'cat-vehicles', name_ar: 'سيارات ومركبات', name_en: 'Vehicles', type: 'product' },
  { id: 'cat-real-estate', name_ar: 'عقارات وأراضي', name_en: 'Real Estate', type: 'product' },
  { id: 'cat-electronics', name_ar: 'إلكترونيات وأجهزة', name_en: 'Electronics', type: 'product' },
  { id: 'cat-home', name_ar: 'أثاث ومستلزمات منزل', name_en: 'Home & Furniture', type: 'product' },
  { id: 'cat-jobs', name_ar: 'وظائف شاغرة', name_en: 'Jobs', type: 'job' },
  { id: 'cat-services', name_ar: 'خدمات وحرفيون', name_en: 'Services', type: 'service' },
  { id: 'cat-stores', name_ar: 'متاجر ومطاعم', name_en: 'Stores & Food', type: 'store' }
];

async function initDatabase() {
  try {
    // 1. Read database.sql and execute table creation
    const sqlPath = path.join(__dirname, '..', 'database.sql');
    if (fs.existsSync(sqlPath)) {
      const sqlContent = fs.readFileSync(sqlPath, 'utf8');
      // Split by semicolon, filter comments and empty queries
      const statements = sqlContent
        .replace(/--.*$/gm, '')
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.toLowerCase().startsWith('create database') && !s.toLowerCase().startsWith('use '));

      for (const statement of statements) {
        try {
          await db.pool.query(statement);
        } catch (err) {
          // Ignore if table already exists or minor syntax variation
          if (!err.message.includes('already exists')) {
            console.warn('DB Init statement warning:', err.message);
          }
        }
      }
    }

    // 2. Ensure default categories
    const existingCatsCount = await db.count('categories');
    if (existingCatsCount === 0) {
      console.log('Seeding default categories...');
      for (const cat of defaultCategories) {
        await db.insert('categories', cat);
      }
      console.log('✓ Categories seeded.');
    }

    // 3. Ensure Primary Admin
    const primaryAdmins = await db.findMany('users', { role: 'primary_admin' });
    if (primaryAdmins.length === 0) {
      const email = (process.env.ADMIN_EMAIL || 'admin@ras.com').toLowerCase();
      const password = process.env.ADMIN_PASSWORD || 'Admin@12345';
      const existing = await db.findOne('users', { email });
      if (!existing) {
        console.log(`Creating default Primary Admin (${email})...`);
        await db.insert('users', {
          id: uuidv4(),
          name: 'مدير المنصة',
          email,
          passwordHash: bcrypt.hashSync(password, 10),
          role: 'primary_admin',
          phone: '',
          whatsapp: '',
          status: 'active',
          permissions: [],
          createdAt: new Date().toISOString()
        });
        console.log('✓ Primary Admin created.');
      } else {
        await db.update('users', { id: existing.id }, { role: 'primary_admin', status: 'active' });
      }
    }

    console.log('✅ Database schema and defaults verified.');
  } catch (error) {
    console.error('Database auto-init error (safe to ignore if already configured):', error.message);
  }
}

module.exports = { initDatabase };

