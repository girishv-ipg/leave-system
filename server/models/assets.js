// const mongoose = require("mongoose");

// const assetSchema = new mongoose.Schema({
//   name: {
//     type: String,
//     required: true,
//     trim: true,
//   },

//   type: {
//     type: String,
//     required: true,
//     enum: [
//       "Hardware",
//       "Software",
//       "Furniture",
//       "Vehicle",
//       "Real Estate",
//       "Other",
//     ],
//     default: "Other",
//   },

//   description: {
//     type: String,
//     trim: true,
//   },

//   serialNumber: {
//     type: String,
//     unique: true,
//     sparse: true,
//     trim: true,
//   },

//   purchaseDate: {
//     type: Date,
//   },

//   location: {
//     type: String,
//     trim: true,
//   },

//   value: {
//     type: Number,
//     min: 0,
//   },

//   status: {
//     type: String,
//     enum: ["Active", "In Maintenance", "Retired", "Lost", "Sold"],
//     default: "Active",
//   },

//   assignedTo: {
//     type: String,
//     ref: "User",
//     default: null,
//   },

//   tags: [
//     {
//       type: String,
//       trim: true,
//     },
//   ],

//   isDeleted: {
//     type: Boolean,
//     default: false,
//   },

//   createdAt: {
//     type: Date,
//     default: Date.now,
//   },

//   updatedAt: {
//     type: Date,
//     default: Date.now,
//   },
// });

// // Automatically update `updatedAt` before saving
// assetSchema.pre("save", function (next) {
//   this.updatedAt = Date.now();
//   next();
// });

// const Assets = mongoose.model("Assets", assetSchema);

// module.exports = Assets;

// models/Asset.js
const mongoose = require("mongoose");

const serialEntrySchema = new mongoose.Schema(
  {
    deviceType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeviceType",
      required: true,
    },
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      required: true,
    },
    serial: {
      type: String,
      required: true,
      trim: true,
    },
    // optional fields, if you want:
    notes: { type: String, trim: true },
  },
  { _id: false } // subdoc doesn't need its own _id unless you want it
);

const assetSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      required: true,
      enum: ["Hardware", "Software", "Other"],
      default: "Other",
    },

    description: {
      type: String,
      trim: true,
    },

    // NEW: array of objects (deviceType, brand, serial)
    serialNumbers: {
      type: [serialEntrySchema],
      default: [],
      validate: {
        validator: function (arr) {
          // ensure no duplicates within the SAME asset document
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

    status: {
      type: String,
      enum: ["Active", "In Maintenance", "Retired", "Lost", "Sold"],
      default: "Active",
    },

    assignedTo: {
      type: String, // or mongoose.Schema.Types.ObjectId if you have a User collection
      ref: "User",
      default: null,
    },

    tags: [{ type: String, trim: true }],

    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true } // handles createdAt, updatedAt automatically
);

/**
 * Global uniqueness guarantee:
 * Enforce (deviceType, brand, serial) uniqueness across all assets.
 *
 * MongoDB supports unique compound indexes on multikey (array) fields with the
 * restriction that a single document must not contain duplicate combinations,
 * which we already validate above.
 *
 * This index ensures that two different assets cannot reuse the same tuple.
 */
assetSchema.index(
  {
    "serialNumbers.deviceType": 1,
    "serialNumbers.brand": 1,
    "serialNumbers.serial": 1,
  },
  { unique: true, sparse: true, name: "uniq_device_brand_serial" }
);

const Assets = mongoose.model("Assets", assetSchema);
module.exports = Assets;
