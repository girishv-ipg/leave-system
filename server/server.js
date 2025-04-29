const express = require("express");
const connect = require("./config/db");
const userController = require("./controllers/user");
const leaveController = require("./controllers/leaveRequest");
const User = require("./models/user");
const Leave = require("./models/leave");
const authenticate = require("./middleware/authenticate");
const cors = require("cors");
const app = express();

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

// Use CORS middleware
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  })
);

app.get("/", authenticate, async (req, res) => {
  return res.send({ message: "Hello" });
});

//user
app.post("/users", userController.createUser);
app.put("/update-user/:id", userController.updateUser);
app.post("/login", userController.login);
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
// Server creation and database connection
app.listen(4000, async () => {
  try {
    await connect();
    console.log("Connected to MongoDB");
    // 👇 Force collection creation here
    await User.init();
    await Leave.init();
    console.log("User and Leave models initialized");
  } catch (err) {
    console.error("Error connecting to MongoDB:", err);
  }
});
