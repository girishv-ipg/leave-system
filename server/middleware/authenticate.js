const jwt = require("jsonwebtoken");
const blackListTokens = require("../models/blackListTokens");

const authenticate = async (req, res, next) => {
  // Get token from Authorization header
  const authHeader = req.header("Authorization");

  if (!authHeader) {
    return res.status(401).json({ error: "Unauthorized - Token missing" });
  }

  try {
    const token = authHeader.split(" ")[1];

    // Check if token is blacklisted
    const blacklisted = await blackListTokens.findOne({ token });
    if (blacklisted) {
      return res.status(401).json({ error: "Unauthorized - Token expired" });
    }

    // Verify the token
    const decoded = jwt.verify(token, "ipg-automotive");

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Unauthorized - Invalid token" });
  }
};

module.exports = authenticate;
