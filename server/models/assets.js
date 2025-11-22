// models/assets.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

/** Each device/serial attached to an asset */
const serialEntrySchema = new Schema(
  {
    deviceType: {
      type: Schema.Types.ObjectId,
      ref: "DeviceType",
      required: true,
    },
    brand: { type: Schema.Types.ObjectId, ref: "Brand", required: true },
    serial: { type: String, required: true, trim: true },
    notes: { type: String, trim: true },

    // lifecycle for the device is implied by the parent asset's lifecycle `status`
    // NEW: per-device approval (separate from lifecycle)
    deviceStatus: {
      type: String,
      enum: ["Pending", "Accepted", "Rejected"],
      default: "Pending",
      index: true,
    },

    // optional "who/when decided" for this serial
    decidedAt: { type: Date, default: null },
    decidedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  {
    _id: true, // keep subdoc _id so we can PATCH by /serials/:serialId
    timestamps: true, // createdAt / updatedAt per-serial (optional, nice to have)
  }
);

const assetSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },

    type: {
      type: String,
      required: true,
      enum: ["Hardware", "Software", "Other"],
      default: "Other",
      index: true,
    },

    description: { type: String, trim: true },

    serialNumbers: {
      type: [serialEntrySchema],
      default: [],
      validate: {
        validator(arr) {
          const seen = new Set();
          for (const s of arr) {
            const key = `${s.deviceType?.toString()}|${s.brand?.toString()}|${(
              s.serial || ""
            )
              .trim()
              .toLowerCase()}`;
            if (seen.has(key)) return false;
            seen.add(key);
          }
          return true;
        },
        message:
          "Duplicate (deviceType, brand, serial) entries are not allowed within the same asset.",
      },
    },

    purchaseDate: { type: Date },
    location: { type: String, trim: true },

    value: { type: Number, min: 0 },

    // LIFECYCLE (unchanged): "how the asset lives"
    status: {
      type: String,
      enum: ["Active", "In Maintenance", "Retired", "Lost", "Sold"],
      default: "Active",
      index: true,
    },

    // NEW: asset-level approval (separate from lifecycle)
    assetStatus: {
      type: String,
      enum: ["Pending", "Accepted", "Rejected"],
      default: "Pending",
      index: true,
    },

    // ownership reference (you used employeeCode as a string)
    assignedTo: { type: String, default: null, index: true },

    tags: [{ type: String, trim: true }],

    isDeleted: { type: Boolean, default: false, index: true },

    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

/** ----------------------------------------------------------------
 * Indexing
 * ---------------------------------------------------------------- */
// manage via migrations in prod
assetSchema.set("autoIndex", false);
assetSchema.set("autoCreate", true);

// Unique device tuple across ALL assets (keep from your existing setup)
assetSchema.index(
  {
    "serialNumbers.deviceType": 1,
    "serialNumbers.brand": 1,
    "serialNumbers.serial": 1,
  },
  {
    unique: true,
    name: "uniq_device_brand_serial_global",
    partialFilterExpression: {
      isDeleted: false,
      "serialNumbers.serial": { $type: "string" },
    },
    background: true,
  }
);

// Helpful filters
assetSchema.index({
  status: 1,
  assetStatus: 1,
  assignedTo: 1,
  isDeleted: 1,
  type: 1,
});

/** ----------------------------------------------------------------
 * Guards (optional)
 * ---------------------------------------------------------------- */
assetSchema.methods.canDecideAssetApproval = function () {
  return String(this.assetStatus) === "Pending";
};

assetSchema.methods.canDecideDeviceApproval = function (serialId) {
  const s = (this.serialNumbers || []).find(
    (x) => String(x._id) === String(serialId)
  );
  return !!s && String(s.deviceStatus) === "Pending";
};

assetSchema.statics.syncMyIndexes = async function () {
  await this.syncIndexes();
};

module.exports = mongoose.model("Assets", assetSchema);
