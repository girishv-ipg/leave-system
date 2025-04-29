// seedAdmin.js

const bcrypt = require("bcrypt");
const User = require("../models/user");

const connect = require("../config/db");

const seedAdmin = async () => {
  try {
    await connect();

    const hashedPassword = await bcrypt.hash("admin1234", 10);

    const adminUser = new User({
      name: "Admin",
      employeeCode: "admin1234",
      email: "admin@example.com",
      password: hashedPassword,
      role: "admin",
      designation: "Administrator",
      totalLeaveQuota: 30,
    });

    await adminUser.save();
    console.log("Admin user seeded successfully");
    process.exit(0);
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1);
  }
};

seedAdmin();
