import { MongoClient, type Db } from "mongodb";

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("MONGODB_URI is not defined in environment variables.");
}

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

/**
 * Cached MongoDB client promise to avoid reconnecting on every API call.
 * Uses global in development to survive HMR.
 */
const getClientPromise = (): Promise<MongoClient> => {
  if (global._mongoClientPromise) {
    return global._mongoClientPromise;
  }
  global._mongoClientPromise = new MongoClient(uri).connect();
  return global._mongoClientPromise;
};

/**
 * Returns the MongoDB database instance for the default database.
 */
export async function getDb(dbName?: string): Promise<Db> {
  const client = await getClientPromise();
  return client.db(dbName);
}
