// migrations/2-backfill-approval-fields.js

/**
 * Backfill new approval fields:
 * - asset.assetStatus: default "Pending" (or "Accepted" if lifecycle Active and assignedTo exists)
 * - serial.deviceStatus: default "Pending"
 *
 * Uses unconditional pipeline updates with $isArray + $map (no $[], no $in).
 */
module.exports = {
  key: "2-backfill-approval-fields",
  description:
    "Backfill assetStatus and serialNumbers[].deviceStatus on existing documents",

  /**
   * @param {import('mongodb').Db} db
   * @param {Console} logger
   */
  async up(db, logger = console) {
    const collection = db.collection("assets");

    // 1) assetStatus: only fill when missing/null
    const r1 = await collection.updateMany(
      { $or: [{ assetStatus: { $exists: false } }, { assetStatus: null }] },
      [
        {
          $set: {
            assetStatus: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$status", "Active"] },
                    // assignedTo considered "present" if non-empty string
                    {
                      $gt: [{ $strLenCP: { $ifNull: ["$assignedTo", ""] } }, 0],
                    },
                  ],
                },
                "Accepted",
                "Pending",
              ],
            },
          },
        },
      ]
    );
    logger.log(
      `Backfilled assetStatus on ${r1.modifiedCount} documents (set Pending/Accepted)`
    );

    // 2) deviceStatus on each serial:
    //    Always run; protect with $isArray so non-arrays/absent paths are left untouched.
    const r2 = await collection.updateMany(
      {}, // no filter → let the pipeline guard with $isArray
      [
        {
          $set: {
            serialNumbers: {
              $cond: [
                { $isArray: "$serialNumbers" },
                {
                  $map: {
                    input: "$serialNumbers",
                    as: "sn",
                    in: {
                      $mergeObjects: [
                        "$$sn",
                        // if deviceStatus is missing OR null → "Pending"; otherwise keep as-is
                        {
                          deviceStatus: {
                            $ifNull: ["$$sn.deviceStatus", "Pending"],
                          },
                        },
                      ],
                    },
                  },
                },
                // not an array → leave as-is (no-op)
                "$serialNumbers",
              ],
            },
          },
        },
      ]
    );
    logger.log(
      `Backfilled deviceStatus on ${r2.modifiedCount} documents (normalized to Pending where missing/null)`
    );

    return { aborted: false };
  },
};
