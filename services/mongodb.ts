//lib/mongodb.ts

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

console.log('MONGODB_URI:', process.env.MONGODB_URI); // Debugging statement

import mongoose from 'mongoose';

if (!process.env.MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable in .env.local');
}

const MONGODB_URI = process.env.MONGODB_URI;

interface MongooseCache {
  conn: mongoose.Connection | null;
  promise: Promise<mongoose.Connection> | null;
}

declare global {
  var mongoose: MongooseCache;
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose): mongoose.Connection => {
      console.log('✅ Database connected successfully!');
      return mongoose.connection;
    });
    
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

export default dbConnect;
