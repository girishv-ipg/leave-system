const User = require("../models/user");
const bcrypt = require("bcrypt");
const Validator = require("validatorjs");
const jwt = require("jsonwebtoken");
const blackListTokens = require("../models/blackListTokens");

// User Login
const login = async (req, res) => {
  try {
    const { employeeCode, password } = req.body;

    const rules = { employeeCode: "required", password: "required|min:8" };
    const validation = new Validator(req.body, rules);
    if (validation.fails()) {
      return res.status(400).json({ error: "Invalid input data" });
    }

    const user = await User.findOne({
      employeeCode: String(employeeCode).trim(),
    });
    if (!user) return res.status(401).json({ error: "User not found" });

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch)
      return res.status(401).json({ error: "Incorrect password" });

    // Include employeeCode and other needed fields in JWT
    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
        employeeCode: user.employeeCode,
        name: user.name,
      },
      "ipg-automotive",
      {
        expiresIn: "7d",
      }
    );

    const userWithoutPassword = user.toObject();
    delete userWithoutPassword.password;

    return res
      .status(200)
      .json({ message: "Login successful", user: userWithoutPassword, token });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

// User Logout
const logout = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) return res.status(400).json({ error: "Token missing" });

    // decode token (not verify)
    const decoded = jwt.decode(token);

    if (!decoded) return res.status(400).json({ error: "Invalid token" });

    // Add token to blacklist with its expiry time
    await blackListTokens.create({
      token,
      expiresAt: new Date(decoded.exp * 1000),
    });

    return res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  login,
  logout,
};
