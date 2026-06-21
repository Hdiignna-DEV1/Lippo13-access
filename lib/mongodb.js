import { MongoClient } from 'mongodb';

let clientPromise;

function getClientPromise() {
  if (clientPromise) return clientPromise;
  const uri = process.env.MONGO_URL;
  if (!uri) throw new Error('MONGO_URL environment variable is required');
  if (!global._mongoClientPromise) {
    const client = new MongoClient(uri);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
  return clientPromise;
}

export async function getDb() {
  const dbName = process.env.DB_NAME;
  if (!dbName) throw new Error('DB_NAME environment variable is required');
  const client = await getClientPromise();
  return client.db(dbName);
}

export default getClientPromise;
