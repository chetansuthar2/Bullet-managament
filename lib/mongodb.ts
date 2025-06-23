import { MongoClient, Db, GridFSBucket } from 'mongodb';

// Get MongoDB URI based on environment
const getMongoDBUri = () => {
  // Check if we're in production/deployment
  const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL || process.env.NETLIFY;

  if (isProduction) {
    // In production, try to use Atlas URI first, fallback to regular URI
    const atlasUri = process.env.MONGODB_ATLAS_URI || process.env.MONGODB_URI;
    if (!atlasUri || atlasUri.includes('127.0.0.1') || atlasUri.includes('localhost')) {
      console.error('❌ Production deployment detected but no cloud MongoDB URI found!');
      console.error('Please set MONGODB_ATLAS_URI environment variable with your MongoDB Atlas connection string');
      console.error('Example: mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/VehicleRepairDB');
      throw new Error('Cloud MongoDB URI required for production deployment');
    }
    return atlasUri;
  } else {
    // In development, use local URI
    return process.env.MONGODB_URI_LOCAL || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/VehicleRepairDB';
  }
};

const uri = getMongoDBUri();
console.log('Environment:', process.env.NODE_ENV || 'development');
console.log('MongoDB URI:', uri.includes('mongodb+srv') ? 'MongoDB Atlas (Cloud)' : 'Local MongoDB');
console.log('Database Name: VehicleRepairDB');
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
