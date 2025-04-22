const express = require("express");
const connect = require("./config/db");
const userController = require("./controllers/user");
const leaveController = require("./controllers/leaveRequest");
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
app.post("/login", userController.login);
app.post("/request-leave", authenticate, leaveController.registerLeaveRequest);
app.get(
  "/admin/leave-requests/pending",
  authenticate,
  leaveController.getPendingLeaveRequests
);

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
// Server creation and database connection
app.listen(3001, "172.30.60.22", async () => {
  try {
    await connect();
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("Error connecting to MongoDB:", err);
  }
});
