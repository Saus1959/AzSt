import mongoose from "mongoose";

// Пользовательская колонка: key — стабильный ключ, label — заголовок в таблице
const ColumnSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
  },
  { _id: false },
);

// Объект депо. № считается автоматически по порядку строки.
// Значения пользовательских колонок лежат в props: { [column.key]: "значение" }
const ItemSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    stock: { type: String, default: "" },
    seriya: { type: String, default: "" },
    name: { type: String, default: "" },
    position: { type: String, default: "" },
    active: { type: Boolean, default: true },
    props: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: false, minimize: false },
);

const DepotSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    columns: { type: [ColumnSchema], default: [] },
    items: { type: [ItemSchema], default: [] },
  },
  { timestamps: true, minimize: false },
);

export default mongoose.models.Depot || mongoose.model("Depot", DepotSchema);
