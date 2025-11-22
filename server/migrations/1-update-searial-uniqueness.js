// migrations/1-update-serial-uniqueness.js

/**
 * Migration: update unique index for device/brand/serial
 *
 * - Old index (if exists): different name or sparse
 * - New index: unique + partialFilterExpression on serialNumbers.serial (string)
 */
module.exports = {
  key: "1-update-serial-uniqueness",
  description:
    "Ensure unique (deviceType, brand, serial) with partialFilterExpression on serialNumbers.serial",

  /**
   * @param {import('mongodb').Db} db
   * @param {Console} logger
   */
  async up(db, logger = console) {
    const collection = db.collection("assets"); // collection name
    const newIndexName = "uniq_device_brand_serial_global";

    // 1) Drop old indexes that conflict with the new one
    const indexes = await collection.indexes();
    const conflicting = indexes.filter(
      (idx) =>
        idx.name === "uniq_device_brand_serial" ||
        idx.name === "uniq_device_brand_serial_global"
    );

    for (const idx of conflicting) {
      logger.log(`Dropping old/conflicting index: ${idx.name}`);
      try {
        await collection.dropIndex(idx.name);
      } catch (e) {
        logger.warn(`Drop failed (ignored): ${idx.name}`, e.message);
      }
    }

    // 2) Create the new index
    logger.log(`Creating new index: ${newIndexName}`);
    await collection.createIndex(
      {
        "serialNumbers.deviceType": 1,
        "serialNumbers.brand": 1,
        "serialNumbers.serial": 1,
      },
      {
        unique: true,
        name: newIndexName,
        partialFilterExpression: {
          isDeleted: false,
          "serialNumbers.serial": { $type: "string" },
        },
        background: true,
      }
    );

    logger.log(`Index created: ${newIndexName}`);
    return { droppedOld: conflicting.length > 0, aborted: false };
  },
};
