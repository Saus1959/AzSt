// Запуск: npm run seed   (безопасно запускать повторно — существующие пользователи не трогаются)
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const USERS = [
  {"username": "ceyhun", "name": "Ceyhun Xəlilov", "position": "leadership", "title": "Director", "password": "7gr8-bwmj"},
  {"username": "kapitan1", "name": "Kapitan 1", "position": "leadership", "title": "Captain", "password": "7hdk-akpk"},
  {"username": "kapitan2", "name": "Kapitan 2", "position": "leadership", "title": "Captain", "password": "qhjm-5wwa"},
  {"username": "koordinator", "name": "Koordinator", "position": "leadership", "title": "Coordinator", "password": "thht-925z"},
  {"username": "kamran", "name": "Kamran Əsəsdov", "position": "electronics", "title": "Electronics Engineer", "password": "3kby-md5x"},
  {"username": "elvin", "name": "Elvin Mirzəzadə", "position": "electronics", "title": "Electronics Engineer", "password": "5eaw-af4c"},
  {"username": "efsane", "name": "Əfsanə Əsgərova", "position": "electronics", "title": "Electronics Engineer", "password": "em9k-v56p"},
  {"username": "necmin", "name": "Nəcmin Əliyev", "position": "mechanics", "title": "Mechanic", "password": "sbtm-fvy8"},
  {"username": "zeynal", "name": "Zeynal Qənbərov", "position": "mechanics", "title": "Mechanic", "password": "megj-6ja2"},
  {"username": "zahid", "name": "Zahid Məcidli", "position": "mechanics", "title": "Mechanic", "password": "342q-8u2f"},
  {"username": "bedir", "name": "Bədir Yolçuyev", "position": "mechanics", "title": "Mechanic", "password": "2dd3-e44b"},
  {"username": "maksim", "name": "Maksim Poner", "position": "mechanics", "title": "Mechanic", "password": "wrmy-6du3"},
  {"username": "pasa", "name": "Paşa Rüstəmov", "position": "mechanics", "title": "3D Mechanic", "password": "efu5-zqm3"},
  {"username": "tural", "name": "Tural Əliyev", "position": "programming", "title": "Programmer", "password": "3dyz-kpky"},
  {"username": "tahir", "name": "Tahir Dibirov", "position": "programming", "title": "Programmer", "password": "ep28-5vgt"},
];

await mongoose.connect(process.env.MONGODB_URI);
const db = mongoose.connection;
const now = new Date();

const users = db.collection('users');
await users.createIndex({ username: 1 }, { unique: true });
for (const { password, ...u } of USERS) {
  if (await users.findOne({ username: u.username })) { console.log('skip  ', u.username); continue; }
  await users.insertOne({ ...u, isAdmin: u.title === 'Director', passwordHash: await bcrypt.hash(password, 10), createdAt: now, updatedAt: now });
  console.log('create', u.username);
}

// ---- демо-данные (только если коллекции пустые) ----
const director = await users.findOne({ username: 'ceyhun' });

const R = (depo, name, category, quantity, status, location) =>
  ({ depo, name, category, quantity, status, location, notes: '', createdAt: now, updatedAt: now });
if (!(await db.collection('resources').countDocuments())) {
  await db.collection('resources').insertMany([
    R('electronics', 'Arduino Mega 2560', 'Boards', 8, 'ok', 'E-1'),
    R('electronics', 'Resistor kit 1%', 'Passive', 3, 'low', 'E-2'),
    R('electronics', 'LiPo 4S 5000mAh', 'Power', 0, 'out', 'E-3'),
    R('electronics', 'ESP32 DevKit', 'Boards', 12, 'ok', 'E-1'),
    R('mechanics', 'Bearing 608ZZ', 'Hardware', 40, 'ok', 'M-1'),
    R('mechanics', 'M3 screws (box)', 'Hardware', 2, 'low', 'M-2'),
    R('mechanics', 'Aluminium profile 2020', 'Frame', 15, 'ok', 'M-4'),
    R('mechanics', 'Soldering station', 'Tools', 1, 'broken', 'M-5'),
    R('central', 'Laptop (spare)', 'IT', 2, 'in_use', 'C-1'),
    R('central', 'PLA filament 1kg', 'Consumables', 6, 'ok', 'C-2'),
    R('central', 'Toolbox (main)', 'Tools', 1, 'ok', 'C-3'),
  ]);
}

const Dc = (department, title, content, tags) =>
  ({ department, title, content, tags, author: director._id, createdAt: now, updatedAt: now });
if (!(await db.collection('docs').countDocuments())) {
  await db.collection('docs').insertMany([
    Dc('all', 'Welcome to Team Dashboard', 'Bu panel komanda üçündür.\nThis dashboard is for our team: Docs, Depo and Team pages.', ['onboarding']),
    Dc('electronics', 'Wiring standard', 'Red = +V, Black = GND, Yellow = signal.\nAlways label both ends of a cable.', ['wiring', 'standard']),
    Dc('mechanics', 'Assembly checklist', '1. Check parts list\n2. Torque all M3 screws\n3. Final inspection', ['assembly']),
    Dc('programming', 'Code style guide', 'Use clear names, small functions, and commit often.', ['code']),
    Dc('leadership', 'Team plan Q4', 'Goals, deadlines and responsibilities.', ['plan']),
  ]);
}

console.log('done');
await mongoose.disconnect();
