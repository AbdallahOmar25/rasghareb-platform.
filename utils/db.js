const mysql = require('mysql2/promise');
require('dotenv').config();

let poolConfig;
if (process.env.DATABASE_URL || process.env.MYSQL_URL) {
  const dbUri = process.env.DATABASE_URL || process.env.MYSQL_URL;
  poolConfig = {
    uri: dbUri,
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
    charset: 'utf8mb4'
  };
  if (process.env.DB_SSL === 'true' || (!dbUri.includes('localhost') && !dbUri.includes('127.0.0.1') && process.env.DB_SSL !== 'false')) {
    poolConfig.ssl = { rejectUnauthorized: false };
  }
} else {
  poolConfig = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'rasghareb_platform',
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
    charset: 'utf8mb4'
  };
  if (process.env.DB_SSL === 'true') {
    poolConfig.ssl = { rejectUnauthorized: false };
  }
}

const pool = mysql.createPool(poolConfig);

const jsonFields = new Set(['images', 'services', 'photos', 'permissions']);
const allowedTables = new Set([
  'users', 'categories', 'products', 'professionals', 'stores', 'businesses',
  'reviews', 'favorites', 'reports', 'platform_settings'
]);

function assertTable(table) {
  if (!allowedTables.has(table)) throw new Error(`Invalid table: ${table}`);
}

function toDbValue(key, value) {
  if (jsonFields.has(key)) return JSON.stringify(value ?? []);
  if (value instanceof Date) return value.toISOString();
  return value === undefined ? null : value;
}

function fromDbRow(row) {
  if (!row) return row;
  for (const key of jsonFields) {
    if (row[key] === null || row[key] === undefined) continue;
    if (typeof row[key] === 'string') {
      try { row[key] = JSON.parse(row[key]); } catch (_) { /* keep legacy text */ }
    }
  }
  return row;
}

function buildWhere(where = {}) {
  const keys = Object.keys(where);
  if (!keys.length) return { sql: '', params: [] };
  return {
    sql: ' WHERE ' + keys.map(k => `\`${k}\` = ?`).join(' AND '),
    params: keys.map(k => toDbValue(k, where[k]))
  };
}

async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return Array.isArray(rows) ? rows.map(fromDbRow) : rows;
}

async function findOne(table, where) {
  assertTable(table);
  const w = buildWhere(where);
  const rows = await query(`SELECT * FROM \`${table}\`${w.sql} LIMIT 1`, w.params);
  return rows[0] || null;
}

async function findMany(table, where = {}, options = {}) {
  assertTable(table);
  const w = buildWhere(where);
  const orderBy = options.orderBy || null;
  const orderSql = orderBy ? ` ORDER BY ${orderBy}` : '';
  const limitSql = options.limit ? ' LIMIT ' + Math.max(1, Number(options.limit)) : '';
  return query(`SELECT * FROM \`${table}\`${w.sql}${orderSql}${limitSql}`, w.params);
}

async function count(table, where = {}) {
  assertTable(table);
  const w = buildWhere(where);
  const rows = await query(`SELECT COUNT(*) AS count FROM \`${table}\`${w.sql}`, w.params);
  return Number(rows[0].count);
}

async function insert(table, data) {
  assertTable(table);
  const keys = Object.keys(data);
  if (!keys.length) throw new Error('Cannot insert empty data');
  const columns = keys.map(k => `\`${k}\``).join(', ');
  const placeholders = keys.map(() => '?').join(', ');
  const params = keys.map(k => toDbValue(k, data[k]));
  await query(`INSERT INTO \`${table}\` (${columns}) VALUES (${placeholders})`, params);
  return data;
}

async function update(table, where, data) {
  assertTable(table);
  const keys = Object.keys(data);
  if (!keys.length) return;
  const w = buildWhere(where);
  const setSql = keys.map(k => `\`${k}\` = ?`).join(', ');
  await query(`UPDATE \`${table}\` SET ${setSql}${w.sql}`, [...keys.map(k => toDbValue(k, data[k])), ...w.params]);
}

async function remove(table, where) {
  assertTable(table);
  const w = buildWhere(where);
  await query(`DELETE FROM \`${table}\`${w.sql}`, w.params);
}

async function transaction(callback) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await callback({
      query: async (sql, params = []) => {
        const [rows] = await conn.execute(sql, params);
        return Array.isArray(rows) ? rows.map(fromDbRow) : rows;
      }
    });
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function close() {
  await pool.end();
}

module.exports = { pool, query, findOne, findMany, count, insert, update, remove, transaction, close };
