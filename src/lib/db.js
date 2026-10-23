import mongoose from 'mongoose';

const g = globalThis;
g._mongoose ||= { conn: null, promise: null };

export async function connectDB() {
  if (g._mongoose.conn) return g._mongoose.conn;
  g._mongoose.promise ||= mongoose.connect(process.env.MONGODB_URI, { bufferCommands: false });
  g._mongoose.conn = await g._mongoose.promise;
  return g._mongoose.conn;
}
