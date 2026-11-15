import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let memoryServer: MongoMemoryServer | null = null;

/**
 * Connects Mongoose to an embedded local MongoDB instance.
 * No MONGO_URI or external database configuration is required.
 */
export async function connectDB(): Promise<void> {
  const dbPath = path.resolve(process.cwd(), '.data', 'mongodb');

  try {
    fs.mkdirSync(dbPath, { recursive: true });
    memoryServer = await MongoMemoryServer.create({
      instance: {
        dbName: 'verdant_bowl',
        dbPath,
        storageEngine: 'wiredTiger',
      },
    });
  } catch {
    // Fallback to pure in-memory instance if wiredTiger lock is held
    memoryServer = await MongoMemoryServer.create({
      instance: {
        dbName: 'verdant_bowl',
      },
    });
  }

  const uri = memoryServer.getUri();
  await mongoose.connect(uri);
  console.log('Embedded local MongoDB connected via Mongoose (no MONGO_URI required)');
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
}
