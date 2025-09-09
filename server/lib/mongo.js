// server/lib/mongo.js
const { MongoClient } = require("mongodb");

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

module.exports = { getDb };
