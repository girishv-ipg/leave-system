// models/deviceType.js
const mongoose = require("mongoose");

const deviceTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true, // "Laptop", "Monitor", "Keyboard", etc.
    },
    icon: {
      type: String, // optional: you can store a lucide/mui icon name if you want
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const DeviceType = mongoose.model("DeviceType", deviceTypeSchema);
module.exports = DeviceType;
