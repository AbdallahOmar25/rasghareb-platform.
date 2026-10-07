# منصة رأس غارب — Ras Ghareb Local Platform

منصة رأس غارب المحلية تجمع السوق، المحترفين، المتاجر متعددة البائعين، ودليل الأعمال المحلية في مكان واحد.

## التقنيات

- Node.js 18+
- Express.js
- EJS
- MySQL
- phpMyAdmin
- XAMPP (لتشغيل MySQL محلياً)

الواجهة عربية RTL افتراضياً مع دعم الإنجليزية.

## التشغيل على Windows + XAMPP

### 1. المتطلبات

ثبّت:
- Node.js 18 أو أحدث
- XAMPP

### 2. تشغيل MySQL

افتح XAMPP وشغّل:

```text
MySQL
```

لا يحتاج المشروع إلى تحويل الـbackend إلى PHP. Node.js + Express يظل هو سيرفر التطبيق، بينما XAMPP يوفر MySQL وphpMyAdmin.

### 3. إنشاء قاعدة البيانات

افتح:

```text
http://localhost/phpmyadmin
```

ثم استورد الملف:

```text
 database.sql
```

أو أنشئ قاعدة باسم:

```text
rasghareb_platform
```

ثم نفّذ محتوى `database.sql`.

### 4. إعداد البيئة

انسخ:

```text
.env.example
```

إلى:

```text
.env
```

واستخدم إعدادات MySQL المحلية. مثال:

```env
PORT=3000
SESSION_SECRET=change-this-to-a-long-random-secret
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=rasghareb_platform
DB_USER=root
DB_PASSWORD=
DEFAULT_ADMIN_EMAIL=admin@rasghareb.local
DEFAULT_ADMIN_PASSWORD=Admin@12345
```

### 5. تثبيت الحزم

داخل مجلد المشروع:

```bash
npm install
```

### 6. نقل بيانات المشروع القديمة

المشروع يحتفظ بملف `data/db.json` كمصدر للبيانات القديمة. لتشغيل الترحيل إلى MySQL وإنشاء البيانات الأولية:

```bash
npm run seed
```

السكربت:
- ينقل البيانات الموجودة في `data/db.json` إلى MySQL.
- يحوّل الدور القديم `admin` إلى `primary_admin`.
- يضمن وجود Primary Admin واحد فقط.
- ينشئ التصنيفات الافتراضية إذا لم تكن موجودة.

### 7. تشغيل الموقع

```bash
npm start
```

ثم افتح:

```text
http://localhost:3000
```

## نظام الإدارة

يوجد مستويان للإدارة:

### Primary Admin

يوجد Primary Admin واحد فقط، وله صلاحيات كاملة على لوحة الإدارة. يستطيع إنشاء وإدارة Secondary Admins وتحديد صلاحياتهم.

### Secondary Admin

حساب إداري محدود الصلاحيات. الصلاحيات يتم تحديدها بواسطة Primary Admin، ويمكن أن تشمل:

- `users`
- `listings`
- `categories`
- `reports`
- `content`

Secondary Admin لا يستطيع ترقية نفسه، أو إنشاء Primary Admin آخر، أو تعديل/حذف Primary Admin. هذه القيود مطبقة في الـbackend/API وليس فقط في الواجهة.

## الأدوار الأساسية

```text
customer
seller
professional
business_owner
secondary_admin
primary_admin
```

## هيكل المشروع

```text
rasghareb4/
├── server.js
├── seed.js
├── database.sql
├── .env.example
├── middleware/
├── routes/
├── views/
├── public/
├── utils/
│   ├── db.js
│   └── i18n.js
└── data/
    └── db.json       # مصدر ترحيل البيانات القديمة
```

## ملاحظات مهمة

- كلمات المرور مخزنة باستخدام bcrypt ولا يتم حفظها كنص عادي.
- استعلامات MySQL تستخدم parameterized queries.
- `data/db.json` ليس قاعدة البيانات التشغيلية بعد التعديل، بل مصدر للترحيل/النسخة القديمة.
- لا ترفع ملف `.env` إلى Git أو إلى مستودع عام.
- لا تحتاج إلى تثبيت `lowdb` بعد هذا التعديل.

## Deployment

راجع `DEPLOY.md` للتشغيل على VPS باستخدام Node.js + MySQL + PM2 + Nginx.
