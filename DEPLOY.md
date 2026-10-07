# Deployment Guide

## VPS: Node.js + MySQL + PM2 + Nginx

### 1. Install Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2. Install MySQL

```bash
sudo apt-get update
sudo apt-get install -y mysql-server
sudo systemctl enable --now mysql
```

Create the database:

```bash
sudo mysql
```

Then:

```sql
CREATE DATABASE rasghareb_platform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

### 3. Upload the project

```bash
cd /var/www
git clone YOUR_REPOSITORY_URL rasghareb
cd rasghareb
```

### 4. Install dependencies

```bash
npm install --production
cp .env.example .env
nano .env
```

Configure the MySQL values and a strong `SESSION_SECRET`.

### 5. Create the schema and migrate existing data

Import `database.sql` into MySQL, then run:

```bash
npm run seed
```

If you are using a fresh VPS database, `seed` can migrate the existing `data/db.json` data and create the Primary Admin.

### 6. Run with PM2

```bash
sudo npm install -g pm2
pm2 start server.js --name rasghareb
pm2 save
pm2 startup
```

Check:

```bash
pm2 status
pm2 logs rasghareb
```

### 7. Nginx

```bash
sudo apt-get install -y nginx
sudo nano /etc/nginx/sites-available/rasghareb
```

Use:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    client_max_body_size 20M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable it:

```bash
sudo ln -s /etc/nginx/sites-available/rasghareb /etc/nginx/sites-enabled/rasghareb
sudo nginx -t
sudo systemctl restart nginx
```

### 8. SSL

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

## Important security notes

- Never commit `.env`.
- Change the default Primary Admin password immediately.
- Use a long random `SESSION_SECRET`.
- Prefer a dedicated MySQL user instead of `root` on production.
- Back up the MySQL database and `public/uploads/` regularly.
