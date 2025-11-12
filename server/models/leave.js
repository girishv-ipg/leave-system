const mongoose = require("mongoose");

const leaveSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    leaveType: {
      type: String,
      enum: ["casual", "sick", "wfh", "on_duty", "pl", "lop"],
      required: true,
    },

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
    },

    reason: {
      type: String,
      required: true,
      trim: true,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "approved",
        "rejected",
        "cancelled",
        "withdrawal-requested",
      ],
      default: "pending",
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    autoApprovedBySystem: {
      type: Boolean,
      default: false,
    },

    reviewedOn: {
      type: Date,
    },

    adminNote: {
      type: String,
      trim: true,
      default: "",
    },

    // New fields for managing half-day leave
    leaveDuration: {
      type: String,
      enum: ["full-day", "half-day"], // Can be full-day or half-day
      required: true,
    },

    halfDayType: {
      type: String,

      default: undefined, // Ensures Mongoose doesn't default to empty string
    },
    numberOfDays: {
      type: Number,
      default: 0, // Will be computed and stored after approval
    },
  },
  {
    timestamps: true,
  }
);

const Leave = mongoose.model("Leave", leaveSchema);

module.exports = Leave;
