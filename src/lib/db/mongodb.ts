import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

interface CachedConnection {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongoose: CachedConnection | undefined;
}

const cached: CachedConnection = global.mongoose || {
  conn: null,
  promise: null,
};

if (!global.mongoose) {
  global.mongoose = cached;
}

async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      // Index changes are applied by scripts/ (fix-user-identity-indexes,
      // migrate-therapist-email-index, fix-session-slot-index), never
      // implicitly. Mongoose cannot DROP an index, and a same-name build with
      // different options fails on an event nothing subscribes to — so the
      // automatic path silently leaves the old index in place and the
      // constraint you think you shipped does not exist. Left on in
      // development so a fresh local DB still gets its indexes.
      autoIndex: process.env.NODE_ENV !== 'production',
    };

    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined');
    }

    cached.promise = mongoose.connect(MONGODB_URI, opts);
  }

  try {
    cached.conn = await cached.promise;
  } catch (_error) {
    cached.promise = null;
    throw _error;
  }

  return cached.conn;
}

export default connectDB;
