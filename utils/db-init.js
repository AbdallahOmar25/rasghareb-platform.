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

// Preserved admin accounts with your exact password hash
const adminPasswordHash = "$2a$10$GzUcaPrGeQ3QNiT5jW5uBOadT17RuKD/dJeoI4Sm68mD0UdAgt0ky";

const defaultAdmins = [
  {
    id: "3ecf744c-2a5d-429a-a7f2-f871de747c7f",
    name: "Eng/AbdallahOmar",
    email: "bodaomar155@gmail.com",
    passwordHash: adminPasswordHash,
    role: "primary_admin",
    phone: "",
    whatsapp: "",
    status: "active",
    permissions: [],
    createdAt: "2026-09-30T23:52:15.423Z"
  },
  {
    id: "admin-gmail-id",
    name: "Eng/AbdallahOmar",
    email: "admin@gmail.com",
    passwordHash: adminPasswordHash,
    role: "primary_admin",
    phone: "",
    whatsapp: "",
    status: "active",
    permissions: [],
    createdAt: "2026-09-30T23:52:15.423Z"
  },
  {
    id: "admin-ras-id",
    name: "Eng/AbdallahOmar",
    email: "admin@ras.com",
    passwordHash: adminPasswordHash,
    role: "primary_admin",
    phone: "",
    whatsapp: "",
    status: "active",
    permissions: [],
    createdAt: "2026-09-30T23:52:15.423Z"
  },
  {
    id: "69e71069-c1f0-49c3-b41f-ee8ea8ae81f0",
    name: "Eng/MohamedOmar",
    email: "midoomar@gmail.com",
    passwordHash: "$2a$10$Tx0jyxqZQLm0hASfozMDjuglwirMHfJ/aoyrhjOlU.U0BHx1DLYEm",
    role: "secondary_admin",
    phone: "",
    whatsapp: "",
    status: "active",
    permissions: ["users", "listings", "categories", "reports", "content"],
    createdAt: "2026-10-03T23:38:34.212Z"
  }
];

async function initDatabase() {
  try {
    // 1. Read database.sql and execute table creation
    const sqlPath = path.join(__dirname, '..', 'database.sql');
    if (fs.existsSync(sqlPath)) {
      const sqlContent = fs.readFileSync(sqlPath, 'utf8');
      const statements = sqlContent
        .replace(/--.*$/gm, '')
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.toLowerCase().startsWith('create database') && !s.toLowerCase().startsWith('use '));

      for (const statement of statements) {
        try {
          await db.pool.query(statement);
        } catch (err) {
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

    // 3. Ensure all Admins exist and are active with correct password
    for (const adminUser of defaultAdmins) {
      const existing = await db.findOne('users', { email: adminUser.email });
      if (!existing) {
        await db.insert('users', adminUser);
        console.log(`✓ Created admin account: ${adminUser.email}`);
      } else {
        await db.update('users', { id: existing.id }, {
          role: adminUser.role,
          status: 'active',
          passwordHash: adminUser.passwordHash
        });
        console.log(`✓ Updated admin account: ${adminUser.email}`);
      }
    }

    console.log('✅ Database schema, categories, and admin accounts verified.');
  } catch (error) {
    console.error('Database auto-init error:', error.message);
  }
}

module.exports = { initDatabase };
