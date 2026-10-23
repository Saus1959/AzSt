// Run: npm run seed   (safe to run again — existing users and memberships are never touched)
// Passwords are generated here and printed ONCE to the console. They are not stored anywhere in the repo.
import crypto from 'node:crypto';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// username → account
const USERS = {
  ceyhun: { name: 'Ceyhun Xəlilov', admin: true }, // director, enters every group
  kamran: { name: 'Kamran Əsədov' },
  elvin: { name: 'Elvin Mirzəzadə' },
  efsane: { name: 'Əfsanə Əsgərova' },
  saxavet: { name: 'Səxavət Yahyayev' },
  ulvi: { name: 'Ülvi Babayev' },
  zahid: { name: 'Zahid Məcidli' },
  pasa: { name: 'Paşa Rüstəmov' },
  necmin: { name: 'Nəcmin Əliyev' },
  zeynal: { name: 'Zeynal Qənbərov' },
  maksim: { name: 'Maksim Poner' },
  bedir: { name: 'Bədir Yolçuyev' },
  tural: { name: 'Tural Əliyev' },
  tahir: { name: 'Tahir Dibirov' },
  ugur: { name: 'Uğur' },
  yusif: { name: 'Yusif' },
};

// Roster. Each place is [role, username]; username = null → vacancy ("npc").
const E = 'Electronics Engineer', M = 'Mechanical Engineer', S = 'Software Engineer';
const ROSTER = {
  roket: [
    ['TK Manager', 'kamran'], ['Captain', 'zahid'],
    [E, 'elvin'], [E, 'efsane'], [E, 'saxavet'], [E, 'ulvi'],
    [M, 'pasa'], [M, 'necmin'], [M, 'zeynal'], [M, 'maksim'], [M, 'bedir'],
    [S, 'tural'], [S, 'tahir'], [S, null], [S, null],
  ],
  ika: [
    ['TK Manager', 'kamran'], ['Captain', 'elvin'],
    [E, 'efsane'], [E, 'saxavet'],
    [M, 'zahid'], [M, 'necmin'], [M, 'pasa'],
    [S, 'tural'],
  ],
  k2k1: [
    ['TK Manager', 'kamran'], ['Captain', 'yusif'],
    [E, 'ugur'], [E, null],
    [M, null], [M, null], [M, null], [M, null],
    [S, null],
  ],
  aerostat: [
    ['AeroStat Manager', 'ulvi'],
    [E, 'elvin'], [E, 'efsane'], [E, 'saxavet'], [E, 'kamran'],
    [M, 'zeynal'], [M, 'pasa'], [M, 'necmin'], [M, 'zahid'], [M, 'maksim'], [M, 'bedir'],
    [S, 'tural'], [S, 'tahir'],
  ],
};

const newPassword = () => crypto.randomBytes(9).toString('base64url').slice(0, 12);

await mongoose.connect(process.env.MONGODB_URI);
const db = mongoose.connection;
const now = new Date();

const users = db.collection('users');
await users.createIndex({ username: 1 }, { unique: true });
const created = [];
for (const [username, u] of Object.entries(USERS)) {
  if (await users.findOne({ username })) { console.log('skip  ', username); continue; }
  const password = newPassword();
  await users.insertOne({
    username, name: u.name, isAdmin: !!u.admin,
    passwordHash: await bcrypt.hash(password, 10), createdAt: now, updatedAt: now,
  });
  created.push({ username, password });
  console.log('create', username);
}

const ms = db.collection('memberships');
await ms.createIndex({ group: 1, user: 1 }, { unique: true, partialFilterExpression: { user: { $type: 'objectId' } } });
if ((await ms.countDocuments()) === 0) {
  const rows = [];
  for (const [group, places] of Object.entries(ROSTER)) {
    for (const [title, username] of places) {
      const user = username ? await users.findOne({ username }) : null;
      rows.push({ group, title, user: user?._id ?? null, extraDepots: [], createdAt: now, updatedAt: now });
    }
  }
  await ms.insertMany(rows);
  console.log(`memberships: ${rows.length} created (${rows.filter((r) => !r.user).length} vacancies)`);
} else {
  console.log('memberships: already present, left untouched (change them on the Admin page)');
}

if (created.length) {
  console.log('\nNew accounts — save these passwords now, they are not shown again:');
  console.table(created);
}
console.log('done');
await mongoose.disconnect();
