const User = require("../models/user");
const bcrypt = require("bcrypt");
const Validator = require("validatorjs");
const jwt = require("jsonwebtoken");

const SALT_ROUNDS = 10; // Number of salt rounds for bcrypt
const SECRET_KEY = "girishv";
// Create a new user and save it to the database
const createUser = async (req, res) => {
  try {
    const { name, password, phone, email ,restaurants} = req.body;

    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });

    if (existingUser) {
      return res
        .status(400)
        .json({ error: "Email or phone number already exists" });
    }

    const rules = {
      name: "required",
      password: "required|min:8",
      phone: "required|regex:/^[0-9]{10}$/",
      email: "required|email",
    };

    const validation = new Validator(req.body, rules);

    if (validation.fails()) {
      return res.status(400).json({
        error: "Invalid input data",
        validationErrors: validation.errors.all(),
      });
    }

    // Hash the password using bcrypt
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const newUser = new User({
      name,
      password: hashedPassword,
      phone,
      email,
      restaurants
    });

    await newUser.save();

    res
      .status(201)
      .json({ message: "User created successfully", user: newUser });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

const login = async (req, res) => {
  try {
    const { emailOrPhone, password } = req.body;

    const rules = {
      emailOrPhone: "required",
      password: "required|min:8",
    };

    const validation = new Validator(req.body, rules);

    if (validation.fails()) {
      return res.status(400).json({
        error: "Invalid input data",
        validationErrors: validation.errors.all(),
      });
    }

    // Check if the provided emailOrPhone is an email or a phone number
    let user;
    if (emailOrPhone.includes("@")) {
      user = await User.findOne({ email: emailOrPhone });
    } else {
      user = await User.findOne({ phone: emailOrPhone });
    }

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    // Check if the provided password matches the hashed password in the database
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: "Incorrect password" });
    }

    const token = jwt.sign({ userId: user._id }, SECRET_KEY, {
      expiresIn: "1h",
    });

    const userWithoutPassword = { ...user.toObject() };
    delete userWithoutPassword.password;

    res
      .status(200)
      .json({
        message: "Login successful",
        user: userWithoutPassword,
        token: token,
      });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  createUser,
  login,
};
