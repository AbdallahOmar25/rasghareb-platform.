require('dotenv').config();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('./utils/db');

function readHiddenPassword() {
  return new Promise((resolve, reject) => {
    const input = process.stdin;
    if (!input.isTTY || typeof input.setRawMode !== 'function') {
      reject(new Error('Run this command in an interactive terminal.'));
      return;
    }

    let password = '';
    process.stdout.write('New admin password (8+ characters, hidden): ');
    input.setRawMode(true);
    input.resume();
    input.setEncoding('utf8');

    const cleanup = () => {
      input.setRawMode(false);
      input.pause();
      input.removeListener('data', onData);
      process.stdout.write('\n');
    };

    const onData = (chunk) => {
      for (const character of chunk) {
        if (character === '\u0003') {
          cleanup();
          reject(new Error('Password update cancelled.'));
          return;
        }
        if (character === '\r' || character === '\n') {
          cleanup();
          resolve(password);
          return;
        }
        if (character === '\u007f' || character === '\b') {
          password = password.slice(0, -1);
        } else if (character >= ' ') {
          password += character;
        }
      }
    };

    input.on('data', onData);
  });
}

async function main() {
  const [, , name, rawEmail, ...args] = process.argv;
  const forceReplace = args.includes('--force') || args.includes('--replace');
  const email = (rawEmail || '').trim().toLowerCase();

  if (!name || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Usage: node update-primary-admin.js "Name" "email@example.com" [--force]');
  }

  const existingPrimaryAdmins = await db.findMany('users', { role: 'primary_admin' }, { orderBy: 'createdAt ASC' });
  if (existingPrimaryAdmins.length > 1) {
    if (!forceReplace) {
      throw new Error(`Found ${existingPrimaryAdmins.length} primary admins. Use --force to replace them all.`);
    }
  }

  const existingEmail = await db.findOne('users', { email });
  if (existingEmail && !forceReplace) {
    const isCurrentPrimary = existingPrimaryAdmins.some(admin => admin.id === existingEmail.id);
    if (!isCurrentPrimary) {
      throw new Error('That email address is already used by another account.');
    }
  }

  const password = await readHiddenPassword();
  if (password.length < 8) throw new Error('Password must be at least 8 characters.');

  if (existingPrimaryAdmins.length) {
    if (!forceReplace) {
      throw new Error('A primary admin already exists. Use --force to remove it and create a new one.');
    }
    for (const admin of existingPrimaryAdmins) {
      await db.remove('users', { id: admin.id });
    }
  }

  const newAdmin = {
    id: uuidv4(),
    name: name.trim(),
    email,
    passwordHash: await bcrypt.hash(password, 10),
    role: 'primary_admin',
    phone: '',
    whatsapp: '',
    status: 'active',
    permissions: [],
    createdAt: new Date().toISOString()
  };

  await db.insert('users', newAdmin);
  console.log(`Primary admin replaced: ${newAdmin.name} <${newAdmin.email}>`);
  console.log('Log out of the site and sign in again with the new credentials.');
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => db.close());