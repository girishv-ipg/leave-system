const User = require("../models/user");
const Leave = require("../models/leave");
const bcrypt = require("bcrypt");
const Validator = require("validatorjs");
const jwt = require("jsonwebtoken");

const SALT_ROUNDS = 10;
const SECRET_KEY = "ipg-automotive";

// Register a new user
const createUser = async (req, res) => {
  try {
    const {
      name,
      password,
      employeeCode,
      gender,
      role,
      department,
      designation,
      carryOverLeaves,
      currentYearLeaves,
    } = req.body;

    // Check for duplicate
    const existingUser = await User.findOne({ $or: [{ employeeCode }] });
    if (existingUser) {
      return res.status(400).json({ error: "EmployeeCode already exists" });
    }

    // Validation
    const rules = {
      name: "required",
      password: "required|min:8",
      role: "required",
      employeeCode: "required",
    };

    const validation = new Validator(req.body, rules);
    if (validation.fails()) {
      return res.status(400).json({
        error: "Validation failed",
        validationErrors: validation.errors.all(),
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const newUser = new User({
      name,
      password: hashedPassword,
      gender,
      role,
      department,
      designation,
      totalLeaveQuota: Number(carryOverLeaves) + Number(currentYearLeaves),
      leaveBalance: Number(carryOverLeaves) + Number(currentYearLeaves),
      employeeCode,
      carryOverLeaves,
      currentYearLeaves,
    });

    await newUser.save();

    const userWithoutPassword = { ...newUser.toObject() };
    delete userWithoutPassword.password;

    res.status(201).json({
      message: "User registered successfully",
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Update an existing user
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      password,
      employeeCode,
      gender,
      role,
      department,
      designation,
      address,
      emergencyContact,
      totalLeaveQuota,
      carryOverLeaves,
      currentYearLeaves,
    } = req.body;

    // Find the existing user
    let user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check for duplicate employeeCode (if changed)
    if (employeeCode && employeeCode !== user.employeeCode) {
      const duplicate = await User.findOne({ employeeCode });
      if (duplicate) {
        return res.status(400).json({ error: "EmployeeCode already exists" });
      }
    }

    // Validation rules
    const rules = {
      name: "required",
      role: "required",
      employeeCode: "required",
    };
    const validation = new Validator(req.body, rules);
    if (validation.fails()) {
      return res.status(400).json({
        error: "Validation failed",
        validationErrors: validation.errors.all(),
      });
    }

    let totalLeaves = Number(carryOverLeaves) + Number(currentYearLeaves);

    let totalLeaveBalance =
      Number(totalLeaves) -
      Number(user.totalLeaveQuota) +
      Number(user.leaveBalance);

    // Update fields
    user.name = name;
    user.employeeCode = employeeCode;
    user.gender = gender;
    user.role = role;
    user.department = department;
    user.designation = designation;
    user.address = address;
    user.emergencyContact = emergencyContact;
    user.totalLeaveQuota = totalLeaves;
    user.leaveBalance = totalLeaveBalance;
    user.carryOverLeaves = carryOverLeaves;
    user.currentYearLeaves = currentYearLeaves;

    // Hash password only if it's provided and not empty
    if (password && password.trim() !== "") {
      if (password.length < 8) {
        return res
          .status(400)
          .json({ error: "Password must be at least 8 characters" });
      }
      user.password = await bcrypt.hash(password, SALT_ROUNDS);
    }

    user = await user.save();

    const userWithoutPassword = { ...user.toObject() };
    delete userWithoutPassword.password;

    res.status(200).json({
      message: "User updated successfully",
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const deleteUserById = async (req, res) => {
  try {
    let { id } = req.params;

    const user = await User.findById(id);
    // Delete all leaves associated with this user
    await Leave.deleteMany({ user: id });

    // Delete the user
    await user.deleteOne();

    return res.status(200).json({
      data: user,
    });
  } catch (error) {
    console.error("Error fetching employee leave history:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// User Login
const login = async (req, res) => {
  try {
    const { employeeCode, password } = req.body;

    const rules = {
      employeeCode: "required",
      password: "required|min:8",
    };

    const validation = new Validator(req.body, rules);
    if (validation.fails()) {
      return res.status(400).json({
        error: "Invalid input data",
        validationErrors: validation.errors.all(),
      });
    }

    // Find user by employeeCode
    const user = await User.findOne({ employeeCode });

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    // Compare hashed password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Incorrect password" });
    }

    // Generate token
    const token = jwt.sign({ userId: user._id }, SECRET_KEY);

    const userWithoutPassword = { ...user.toObject() };
    delete userWithoutPassword.password;

    return res.status(200).json({
      message: "Login successful",
      user: userWithoutPassword,
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const getAllEmployeesWithLeaveHistory = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    // By default (admin or others) we show everyone:
    let employeeQuery = {};

    if (user.role === "manager") {
      // Manager should see:
      // 1. All non-manager employees in their department
      // 2. Plus their own record
      employeeQuery = {
        $or: [
          { department: user.department, role: { $ne: "manager" } },
          { _id: user._id },
        ],
      };
    }

    const employees = await User.find(employeeQuery).select("-password");

    const employeesWithLeaves = await Promise.all(
      employees.map(async (emp) => {
        const leaveHistory = await Leave.find({ user: emp._id })
          .populate("reviewedBy")
          .sort({ createdAt: -1 });
        return {
          ...emp.toObject(),
          leaveHistory,
        };
      })
    );

    res.status(200).json({
      message: "User list with leave history fetched successfully",
      data: employeesWithLeaves,
    });
  } catch (error) {
    console.error("Error fetching user leave history:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// get employee byId
const getEmployeeWithLeaveHistory = async (req, res) => {
  try {
    // Fetch the logged-in employee (excluding password)
    const employee = await User.findById(req.user.userId).select("-password");

    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    // Get leave history for that employee
    const leaveHistory = await Leave.find({ user: employee._id })
      .populate("reviewedBy", "name") // Populate reviewedBy with only the name
      .sort({ createdAt: -1 });

    // Combine employee and leave history
    const employeeWithLeaves = {
      ...employee.toObject(),
      leaveHistory,
    };

    res.status(200).json({
      message: "Leave history fetched successfully",
      data: employeeWithLeaves,
    });
  } catch (error) {
    console.error("Error fetching employee leave history:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getUserById = async (req, res) => {
  try {
    let { id } = req.params;

    const user = await User.findById(id).select("-password");
    return res.status(200).json({
      data: user,
    });
  } catch (error) {
    console.error("Error fetching employee leave history:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const updateUserPassword = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password || password === "") {
      return res.status(400).json({ error: "Password is required" });
    }

    if (password.length < 8) {
      return res
        .status(400)
        .json({ error: "Password must be at least 8 characters long" });
    }

    // Find the user by ID
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(
      password.password.trim(),
      SALT_ROUNDS
    );

    // Update password and save
    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Error updating password:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  createUser,
  updateUser,
  login,
  getAllEmployeesWithLeaveHistory,
  getEmployeeWithLeaveHistory,
  getUserById,
  deleteUserById,
  updateUserPassword,
};
