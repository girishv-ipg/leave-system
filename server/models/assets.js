const mongoose = require("mongoose");

const assetSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },

  type: {
    type: String,
    required: true,
    enum: [
      "Hardware",
      "Software",
      "Furniture",
      "Vehicle",
      "Real Estate",
      "Other",
    ],
    default: "Other",
  },

  description: {
    type: String,
    trim: true,
  },

  serialNumber: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
  },

  purchaseDate: {
    type: Date,
  },

  location: {
    type: String,
    trim: true,
  },

  value: {
    type: Number,
    min: 0,
  },

  status: {
    type: String,
    enum: ["Active", "In Maintenance", "Retired", "Lost", "Sold"],
    default: "Active",
  },

  assignedTo: {
    type: String,
    ref: "User",
    default: null,
  },

  tags: [
    {
      type: String,
      trim: true,
    },
  ],

  isDeleted: {
    type: Boolean,
    default: false,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },

  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Automatically update `updatedAt` before saving
assetSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const Assets = mongoose.model("Assets", assetSchema);

module.exports = Assets;
