import { MongoClient, Db, GridFSBucket } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/VehicleRepairDB';
console.log('MongoDB URI:', uri);
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise;

// Helper function to get database
export async function getDatabase(): Promise<Db> {
  const client = await clientPromise;
  return client.db('VehicleRepairDB');
}

// Helper function to get GridFS bucket for image storage
export async function getGridFSBucket(): Promise<GridFSBucket> {
  try {
    console.log('Getting database connection...');
    const db = await getDatabase();
    console.log('Database connected, creating GridFS bucket...');
    const bucket = new GridFSBucket(db, { bucketName: 'images' });
    console.log('GridFS bucket created successfully');
    return bucket;
  } catch (error) {
    console.error('Error creating GridFS bucket:', error);
    throw error;
  }
}
