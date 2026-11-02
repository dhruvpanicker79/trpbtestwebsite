import mongoose from 'mongoose';
import { env } from './env.js';

mongoose.set('strictQuery', true);

export async function connectDB(uri = env.mongoUri) {
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
    const { host, name } = mongoose.connection;
    console.log(`[db] MongoDB connected → ${host}/${name}`);
    return mongoose.connection;
  } catch (err) {
    console.error(`[db] Could not connect to MongoDB at ${uri.replace(/\/\/.*@/, '//***@')}`);
    console.error(`[db] ${err.message}`);
    throw err;
  }
}

export async function disconnectDB() {
  await mongoose.disconnect();
}
