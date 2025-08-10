const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    password: { type: String, required: true, minlength: 6 },

    employeeCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    gender: { type: String, enum: ["male", "female", "other"] },
    department: { type: String, required: false },

    role: {
      type: String,
      enum: ["admin", "employee", "manager", "hr"],
      default: "employee",
    },

    designation: { type: String, required: true, trim: true },
    reportingManager: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    // Total annual leave quota for this user (customizable per department/policy)
    totalLeaveQuota: {
      type: Number,
      required: false,
    },

    // Current leave balance
    leaveBalance: {
      type: Number,
      required: false,
    },

    // **New**: carry-over from last year
    carryOverLeaves: {
      type: Number,
      required: true,
      default: 0,
    },

    // **New**: fresh allocation for this year
    currentYearLeaves: {
      type: Number,
      required: true,
      default: 0,
    },
    // Date the employee joined the organization
    joiningDate: {
      type: Date,
      required: false,
      default: "", // make true if mandatory
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

const User = mongoose.model("User", userSchema);

module.exports = User;
