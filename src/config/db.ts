import { MongoClient, Db } from "mongodb";

let client: MongoClient;
let db: Db;

export async function connectDB(): Promise<Db> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is missing in the .env file");
  }

  client = new MongoClient(uri);
  await client.connect();

  db = client.db(process.env.DB_NAME || "equipment_rental");
  console.log("Connected to MongoDB");
  return db;
}

export function getDB(): Db {
  if (!db) {
    throw new Error("Database is not connected. Call connectDB() first.");
  }
  return db;
}