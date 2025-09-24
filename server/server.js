//server/server.js
const express = require("express");
const connect = require("./config/db");
const userController = require("./controllers/user");
const leaveController = require("./controllers/leaveRequest");
const User = require("./models/user");
const Leave = require("./models/leave");
const authenticate = require("./middleware/authenticate");
const cors = require("cors");

// Import the expense routes
const expenseRoutes = require("./routes/travelExpense");
const {
  submitAssetInformation,
  getAllAssets,
  getAssetById,
  updateAssetById,
  deleteAssetById,
} = require("./controllers/trackAssets");

const app = express();

// Increase payload size limits for bulk operations
app.use(
  express.json({
    limit: "50mb", // Increase JSON payload limit
  })
);

app.use(
  express.urlencoded({
    limit: "50mb", // Increase URL-encoded payload limit
    extended: true,
  })
);

// Updated CORS - add Authorization to allowed headers
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.get("/health", async (req, res) => {
  return res.send({ message: "Hello" });
});

// User routes
app.post("/users", userController.createUser);
app.put("/update-user/:id", userController.updateUser);
app.post("/login", userController.login);

// Leave routes
app.post("/request-leave", authenticate, leaveController.registerLeaveRequest);
app.get(
  "/admin/leave-requests/pending",
  authenticate,
  leaveController.getPendingLeaveRequests
);
app.get("/admin/user/:id", authenticate, userController.getUserById);
app.delete("/admin/user/:id", authenticate, userController.deleteUserById);
app.put(
  "/admin/leave-requests/:leaveId",
  authenticate,
  leaveController.updateLeaveStatus
);
app.patch(
  "/admin/leave-status/:leaveId",
  authenticate,
  leaveController.updateStatus
);
app.get(
  "/admin/employees/",
  authenticate,
  userController.getAllEmployeesWithLeaveHistory
);
app.get(
  "/employee-details/",
  authenticate,
  userController.getEmployeeWithLeaveHistory
);
app.put("/update-password", authenticate, userController.updateUserPassword);

app.post("/api/assets", submitAssetInformation);
app.get("/api/assets", getAllAssets);
app.get("/api/assets/:id", getAssetById);
app.put("/api/assets/:id", updateAssetById);
app.delete("/api/assets/:id", deleteAssetById);
// Use the expense routes (this will mount /api/expenses/* endpoints)
app.use(expenseRoutes);

// Server creation and database connection
app.listen(4000, async () => {
  try {
    await connect();
    console.log("Connected to MongoDB");
    // Force collection creation here
    await User.init();
    await Leave.init();
    console.log("User and Leave models initialized");
  } catch (err) {
    console.error("Error connecting to MongoDB:", err);
  }
});
