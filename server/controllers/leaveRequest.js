const Validator = require("validatorjs");
const User = require("../models/user");
const Leave = require("../models/leave");

// Function to validate the leave data
const validateLeaveData = (data) => {
  const rules = {
    leaveType: "required|in:casual,sick",
    startDate: "required|date",
    endDate: "required|date|after_or_equal:startDate",
    reason: "required|string",
    leaveDuration: "required|in:full-day,half-day",
    halfDayType: "in:morning,afternoon", // Optional for half-day leaves
  };

  const validation = new Validator(data, rules);
  return validation;
};

// Register a leave request
const registerLeaveRequest = async (req, res) => {
  try {
    const {
      leaveType,
      startDate,
      endDate,
      reason,
      leaveDuration,
      halfDayType,
    } = req.body;

    // Get the userId from the authenticated user (from JWT token)
    const userId = req.user.userId;

    // Check if the user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Validate leave request data
    const validation = validateLeaveData(req.body);
    if (validation.fails()) {
      return res.status(400).json({
        error: "Validation failed",
        validationErrors: validation.errors.all(),
      });
    }

    // If leave is half-day, ensure that halfDayType is provided
    if (leaveDuration === "half-day" && !halfDayType) {
      return res.status(400).json({
        error: "Please specify whether it's a morning or afternoon half-day",
      });
    }

    // Create a new leave request
    const leaveRequest = new Leave({
      user: userId,
      leaveType,
      startDate,
      endDate,
      reason,
      leaveDuration,
      halfDayType,
    });

    // Save the leave request
    await leaveRequest.save();

    res.status(201).json({
      message: "Leave request submitted successfully",
      leaveRequest,
    });
  } catch (error) {
    console.error("Error registering leave:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// const getPendingLeaveRequests = async (req, res) => {
//   try {
//     // Get today's date at midnight
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);

//     // Get tomorrow to define range for "today"

//     const pendingOrUpcomingLeaves = await Leave.find({
//       status: {
//         $in: [
//           "pending",
//           "approved",
//           "cancelled",
//           "rejected",
//           "withdrawal-requested",
//         ],
//       },
//       startDate: { $gte: today }, // Today or future only
//     })
//       .populate("user", "name employeeCode designation gender role status")
//       .sort({ createdAt: -1 });

//     res.status(200).json({
//       message: "Pending and today's leave requests fetched successfully",
//       data: pendingOrUpcomingLeaves,
//     });
//   } catch (error) {
//     console.error("Error fetching leaves:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };

const getPendingLeaveRequests = async (req, res) => {
  try {
    // today at 00:00

    // Base‐query: status + upcoming startDate
    const baseQuery = {
      status: {
        $in: ["pending", "withdrawal-requested"],
      },
    };

    // fetch the logged‐in user
    const user = await User.findById(req.user.userId).exec();

    switch (user.role) {
      case "admin":
        // no additional filters: admin sees everything
        break;

      case "manager": {
        // restrict to users in the same department
        const departmentEmployees = await User.find({
          department: user.department,
        }).select("_id");
        const employeeIds = departmentEmployees.map((emp) => emp._id);
        baseQuery.user = { $in: employeeIds };
        break;
      }

      default:
        // any other role (e.g. "employee") → only their own requests
        baseQuery.user = user._id;
    }

    // execute query
    const pendingOrUpcomingLeaves = await Leave.find(baseQuery)
      .select("_id adminNote startDate endDate reason status")
      .populate("user")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Pending and upcoming leave requests fetched successfully",
      data: pendingOrUpcomingLeaves,
    });
  } catch (error) {
    console.error("Error fetching leaves:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const updateLeaveStatus = async (req, res) => {
  try {
    const { leaveId } = req.params;
    const { status, adminNote } = req.body;

    if (
      !["approved", "rejected", "withdrawal-requested", "cancelled"].includes(
        status
      )
    ) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    const leave = await Leave.findById(leaveId).populate("user");

    if (!leave) {
      return res.status(404).json({ error: "Leave request not found" });
    }

    leave.status = status;
    leave.adminNote = adminNote || "";
    leave.reviewedBy = req.user.userId;
    leave.reviewedOn = new Date();

    // If approved, update leave balance
    if (status === "approved") {
      const user = await User.findById(leave.user._id);

      let days = 1;

      if (leave.leaveDuration === "half-day") {
        days = 0.5;
      } else {
        const start = new Date(leave.startDate);
        const end = new Date(leave.endDate);
        const diffTime = Math.abs(end - start);
        days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // inclusive
      }

      user.leaveBalance = (user.leaveBalance || 0) - days;

      if (user.leaveBalance < 0) user.leaveBalance = 0; // prevent negative

      await user.save();
    }

    if (status === "cancelled") {
      const user = await User.findById(leave.user._id);

      let days = 1;

      if (leave.leaveDuration === "half-day") {
        days = 0.5;
      } else {
        const start = new Date(leave.startDate);
        const end = new Date(leave.endDate);
        const diffTime = Math.abs(end - start);
        days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // inclusive
      }

      // ✅ Add back leave balance and subtract from leaveTaken
      user.leaveBalance = (user.leaveBalance || 0) + days;
      user.leaveTaken = Math.max((user.leaveTaken || 0) - days, 0);

      await user.save();
    }

    await leave.save();

    res.status(200).json({ message: `Leave ${status} successfully`, leave });
  } catch (error) {
    console.error("Error updating leave status:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const updateStatus = async (req, res) => {
  try {
    const { leaveId } = req.params;
    const { status } = req.body;

    if (
      !["approved", "rejected", "cancelled", "withdrawal-requested"].includes(
        status
      )
    ) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    const leave = await Leave.findById(leaveId).populate("user");

    if (!leave) {
      return res.status(404).json({ error: "Leave request not found" });
    }

    leave.status = status;

    await leave.save();

    res.status(200).json({ message: `Leave ${status} successfully`, leave });
  } catch (error) {
    console.error("Error updating leave status:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  registerLeaveRequest,
  getPendingLeaveRequests,
  updateLeaveStatus,
  updateStatus,
};
