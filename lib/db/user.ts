import { ObjectId } from "mongodb";
import { getDb } from "./mongodb";
import type { Collection } from "mongodb";

export type UserRole = "interviewer" | "interviewee";

export type UserDocument = {
  _id?: ObjectId;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  createdAt: Date;
};

const COLLECTION_NAME = "users";

async function getUsersCollection() {
  const db = await getDb();
  return db.collection<UserDocument>(COLLECTION_NAME);
}

/**
 * Ensures the users collection has a unique index on email.
 * Call once at app startup or before first user insert.
 */
export async function ensureUserIndex(collection: Collection<UserDocument>) {
  await collection.createIndex({ email: 1 }, { unique: true });
}

/**
 * Finds a user by email.
 */
export async function findUserByEmail(email: string): Promise<UserDocument | null> {
  const col = await getUsersCollection();
  return col.findOne({ email: email.trim().toLowerCase() });
}

/**
 * Finds a user by ID.
 */
export async function findUserById(id: string): Promise<UserDocument | null> {
  const col = await getUsersCollection();
  try {
    return col.findOne({ _id: new ObjectId(id) });
  } catch {
    return null;
  }
}

/**
 * Inserts a new user. Caller must hash the password.
 * Ensures unique index on email before insert.
 */
export async function createUser(
  data: Omit<UserDocument, "_id" | "createdAt">
): Promise<UserDocument> {
  const col = await getUsersCollection();
  await ensureUserIndex(col);
  const doc: UserDocument = {
    ...data,
    email: data.email.trim().toLowerCase(),
    createdAt: new Date(),
  };
  const result = await col.insertOne(doc as UserDocument);
  return {
    ...doc,
    _id: result.insertedId,
  };
}
