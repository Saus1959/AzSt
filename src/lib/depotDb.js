import Depot from '@/models/Depot';

export const DEFAULT_DEPOTS = [
  { key: 'electronics', name: 'Electronics Depo' },
  { key: 'mechanics', name: 'Mechanics Depo' },
  { key: 'programming', name: 'Programming Depo' },
  { key: 'central', name: 'Central Depo' },
];

// Creates the three depots of a group on first use and returns them in a fixed order.
// The DB connection is already open (route() → getUser() → connectDB()).
export async function ensureDepots(group) {
  await Promise.all(
    DEFAULT_DEPOTS.map((d) =>
      Depot.updateOne(
        { group, key: d.key },
        { $setOnInsert: { name: d.name, labels: {}, columns: [], items: [] } },
        { upsert: true },
      ).catch((e) => { if (e.code !== 11000) throw e; }), // parallel first requests
    ),
  );
  const found = await Depot.find({ group }).lean();
  return DEFAULT_DEPOTS.map((d) => found.find((f) => f.key === d.key)).filter(Boolean);
}
