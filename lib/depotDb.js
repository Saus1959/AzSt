import Depot from "@/models/Depot";

export const DEFAULT_DEPOTS = [
  { key: "electronics", name: "Electronics Depo" },
  { key: "mechanics", name: "Mechanics Depo" },
  { key: "central", name: "Central Depo" },
];

// Создаёт три депо при первом обращении и возвращает их в фиксированном порядке.
// Подключение к БД уже выполнено в route() → getUser() → connectDB().
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
