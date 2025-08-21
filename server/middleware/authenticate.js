const jwt = require("jsonwebtoken");

const authenticate = (req, res, next) => {
  // Get the token from the request header
  const authHeader = req.header("Authorization");

  // Check if the token is missing
  if (!authHeader) {
    return res.status(401).json({ error: "Unauthorized - Token missing" });
  }

  try {
    const token = authHeader.split(" ")[1];
    // Verify the token and decode its payload
    const decoded = jwt.verify(token, "ipg-automotive");

    // Attach the decoded payload to the request object
    req.user = decoded;
    console.log(" reqooooo", req.user);

    // Continue to the next middleware or route handler
    next();
  } catch (error) {
    // Token verification failed

    return res.status(401).json({ error: "Unauthorized - Invalid token" });
  }
};

module.exports = authenticate;
