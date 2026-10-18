import mongoose from "mongoose";
import Depot from "@/models/Depot";

export const DEFAULT_DEPOTS = [
  { key: "electronics", name: "Electronics Depo" },
  { key: "mechanics", name: "Mechanics Depo" },
  { key: "central", name: "Central Depo" },
];

const cache =
  globalThis._depotMongoose || (globalThis._depotMongoose = { promise: null });

// Если в проекте уже есть свой connect-хелпер (lib/db.js и т.п.) — можно заменить этой функцией его вызов.
export async function connect() {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (!cache.promise) cache.promise = mongoose.connect(process.env.MONGODB_URI);
  await cache.promise;
  return mongoose.connection;
}

// Создаёт три депо при первом обращении и возвращает их в фиксированном порядке.
export async function ensureDepots() {
  await Promise.all(
    DEFAULT_DEPOTS.map((d) =>
      Depot.updateOne(
        { key: d.key },
        { $setOnInsert: { name: d.name, columns: [], items: [] } },
        { upsert: true },
      ),
    ),
  );
  const found = await Depot.find({
    key: { $in: DEFAULT_DEPOTS.map((d) => d.key) },
  }).lean();
  return DEFAULT_DEPOTS.map((d) => found.find((f) => f.key === d.key)).filter(
    Boolean,
  );
}
