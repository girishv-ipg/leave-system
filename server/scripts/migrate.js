// scripts/migrate.js
require("dotenv").config();
const mongoose = require("mongoose");
const MigrationModel = require("../models/migrations");

const MIGRATIONS = [
  require("../migrations/1-update-searial-uniqueness"),
  require("../migrations/2-backfill-approval-fields"),
];

async function run() {
  let startedMongoose = false;

  if (mongoose.connection.readyState !== 1) {
    const mongoUrl = process.env.MONGO_URL;
    if (!mongoUrl) throw new Error("MONGO_URL env not set");
    await mongoose.connect(mongoUrl);
    startedMongoose = true;
  }

  const db = mongoose.connection.db;

  try {
    for (const m of MIGRATIONS) {
      const { key, description, up } = m;
      const already = await MigrationModel.findOne({ key });
      if (already) continue;

      const result = await up(db, console);
      if (result?.aborted) {
        process.exitCode = 2;
        break;
      }
      await MigrationModel.create({
        key,
        description,
        appliedAt: new Date(),
        meta: result || {},
      });
    }
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  } finally {
    if (startedMongoose) {
      await mongoose.disconnect().catch(() => {});
    }
  }
}

if (require.main === module) {
  run()
    .then(() => console.log("All migrations completed"))
    .catch((err) => {
      console.error("Migration run failed:", err);
      process.exit(1);
    });
}

module.exports = run;
