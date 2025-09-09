// seed-user.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// ---- connection ----
const MONGO_URI =
  process.env.MONGO_URL ||
  "mongodb://root:password@127.0.0.1:17017/leaveSystem?authSource=admin&directConnection=true&serverSelectionTimeoutMS=5000";

(async function run() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // --- your schema (inline to avoid dual-instance issue) ---
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
          enum: ["admin", "employee", "manager", "hr", "finance"],
          default: "employee",
        },
        designation: { type: String, required: true, trim: true },
        reportingManager: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        totalLeaveQuota: { type: Number },
        leaveBalance: { type: Number },
        carryOverLeaves: { type: Number, required: true, default: 0 },
        currentYearLeaves: { type: Number, required: true, default: 0 },
      },
      { timestamps: true }
    );

    const User = mongoose.model("User", userSchema);

    // ---- seed data ----
    const employeeCode = "026";
    const plainPassword = "pass@123";
    const role = "admin";

    const hash = await bcrypt.hash(plainPassword, 10);

    const userData = {
      name: "Development Admin",
      password: hash,
      employeeCode,
      gender: "male",
      department: "IT",
      role,
      designation: "Software Engineer",
      totalLeaveQuota: 30,
      leaveBalance: 30,
      carryOverLeaves: 0,
      currentYearLeaves: 30,
    };

    const user = await User.findOneAndUpdate(
      { employeeCode },
      { $set: userData },
      { upsert: true, new: true }
    );

    console.log("✅ Seeded:", {
      _id: user._id.toString(),
      employeeCode: user.employeeCode,
      role: user.role,
    });
    await mongoose.disconnect();
  } catch (err) {
    console.error("❌ Error seeding user:", err);
    process.exit(1);
  }
})();
