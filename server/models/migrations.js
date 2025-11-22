// models/Migration.js
const mongoose = require("mongoose");

const migrationSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true }, // unique migration key
    description: { type: String, default: "" },
    appliedAt: { type: Date, default: Date.now },
    meta: { type: Object, default: {} },
  },
  { timestamps: true, collection: "migrations" }
);

module.exports = mongoose.model("Migration", migrationSchema);
