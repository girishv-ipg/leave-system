const User = require("../models/user");
const Leave = require("../models/leave");
const bcrypt = require("bcrypt");
const Validator = require("validatorjs");
const jwt = require("jsonwebtoken");

const SALT_ROUNDS = 10;
const SECRET_KEY = "girishv";

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
      address,
      emergencyContact,
      totalLeaveQuota,
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

    const leaveBalance = totalLeaveQuota;

    const newUser = new User({
      name,
      password: hashedPassword,
      gender,
      role,
      department,
      designation,
      totalLeaveQuota,
      leaveBalance,
      employeeCode,
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
    const token = jwt.sign({ userId: user._id }, SECRET_KEY, {
      expiresIn: "1h",
    });

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
    // Get all employees
    const employees = await User.find({}).select("-password");

    // For each employee, fetch their leave history from the Leave model
    const employeesWithLeaves = await Promise.all(
      employees.map(async (employee) => {
        const leaveHistory = await Leave.find({ user: employee._id })
          .populate("reviewedBy")
          .sort({
            createdAt: -1,
          });

        return {
          ...employee.toObject(),
          leaveHistory,
        };
      })
    );

    res.status(200).json({
      message: "Employee list with leave history fetched successfully",
      data: employeesWithLeaves,
    });
  } catch (error) {
    console.error("Error fetching employee leave history:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

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

module.exports = {
  createUser,
  login,
  getAllEmployeesWithLeaveHistory,
  getEmployeeWithLeaveHistory,
};
