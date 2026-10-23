// Run ONCE on an existing database before starting the new version:  npm run migrate
// Safe to run again.
//  1. drops the old unique index depots.key (depots are now unique per group + key)
//  2. puts existing depots and docs into the group "roket"
//  3. creates the new indexes
// Then run `npm run seed` to create the group places (memberships) from the roster.
import mongoose from 'mongoose';

const DEFAULT_GROUP = 'roket';

await mongoose.connect(process.env.MONGODB_URI);
const db = mongoose.connection;

try {
  await db.collection('depots').dropIndex('key_1');
  console.log('dropped index depots.key_1');
} catch (e) {
  console.log('index depots.key_1:', e.codeName || e.message);
}

for (const name of ['depots', 'docs']) {
  const r = await db.collection(name).updateMany({ group: { $exists: false } }, { $set: { group: DEFAULT_GROUP } });
  console.log(`${name}: ${r.modifiedCount} moved to "${DEFAULT_GROUP}"`);
}
await db.collection('depots').createIndex({ group: 1, key: 1 }, { unique: true });
await db.collection('docs').createIndex({ group: 1 });
await db.collection('memberships').createIndex(
  { group: 1, user: 1 },
  { unique: true, partialFilterExpression: { user: { $type: 'objectId' } } },
);

const legacy = await db.collection('users').find({ position: { $exists: true } }).project({ username: 1 }).toArray();
console.log(`accounts with the old single role field: ${legacy.length} (the field is ignored now; access comes from memberships)`);
console.log('done');
await mongoose.disconnect();
