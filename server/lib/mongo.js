// server/lib/mongo.js
const { MongoClient, GridFSBucket } = require("mongodb");

const uri = process.env.MONGO_URL; // same as docker-compose backend env
const DB_NAME = process.env.DB_NAME || "leaveSystem";

let clientPromise;

async function getClient() {
  if (!clientPromise) {
    const client = new MongoClient(uri, {});
    clientPromise = client.connect();
  }
  return clientPromise;
}

async function getDb() {
  const c = await getClient();
  return c.db(DB_NAME);
}

async function getBucket() {
  const db = await getDb();
  // bucket name = 'travel-expenses.files' / '.chunks'
  return new GridFSBucket(db, { bucketName: "travel-expenses" });
}

module.exports = { getDb, getBucket };
