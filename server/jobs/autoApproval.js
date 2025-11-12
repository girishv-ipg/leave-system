import Leave from "../models/leave.js";
import User from "../models/user.js";
import cron from "node-cron";
import { holidays } from "../utils/helpers.js";

cron.schedule("0 */2 * * *", async () => {
  console.log("[CRON] Auto-approve pending leaves job started");

  const now = new Date();
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

  try {
    const pendingLeaves = await Leave.find({
      status: "pending",
      createdAt: { $lte: threeDaysAgo },
    }).populate("user");

    console.log(`[CRON] Found ${pendingLeaves.length} total pending leaves.`);

    // only non-employee users get auto-approved
    const leavesToApprove = pendingLeaves.filter(
      (leave) =>
        leave.user &&
        leave.user.role &&
        leave.user.role.toLowerCase() !== "employee"
    );

    console.log(
      `[CRON] ${leavesToApprove.length} leaves eligible for auto-approval (non-employee users).`
    );

    for (const leave of leavesToApprove) {
      const user = await User.findById(leave.user._id);
      if (!user) continue;

      let days = 1;
      if (leave.leaveDuration === "half-day") {
        days = 0.5;
      } else {
        const start = new Date(leave.startDate);
        const end = new Date(leave.endDate);
        days = countWorkingDays(start, end);
        leave.numberOfDays = days;
      }

      // CASE 1: Regular leave (not WFH / On Duty)
      if (!["wfh", "on_duty"].includes(leave.leaveType)) {
        user.leaveBalance = (user.leaveBalance || 0) - days;
        user.leaveTaken = (user.leaveTaken || 0) + days;
        await user.save();
      }

      // CASE 2: WFH / On Duty (just mark days, don’t adjust balance)
      if (["wfh", "on_duty"].includes(leave.leaveType)) {
        leave.numberOfDays = days;
        await user.save();
      }

      leave.status = "approved";
      leave.autoApproved = true;
      leave.autoApprovedBySystem = true;
      leave.adminNote = "Auto-approved by system after 3 days";
      leave.reviewedBy = null; // system job, not a user
      leave.reviewedOn = new Date();

      await leave.save();

      console.log(`[CRON] Auto-approved leave ${leave._id} for ${user.name}`);
    }

    console.log("[CRON] Auto-approve job finished.");
  } catch (err) {
    console.error("[CRON] Error auto-approving leaves:", err);
  }
});

/**
 * Helpers
 */
const countWorkingDays = (start, end) => {
  const current = new Date(start);
  let count = 0;
  while (current <= end) {
    if (!isWeekend(current) && !isHoliday(current, holidays)) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  return count;
};

const isWeekend = (date) => {
  const day = date.getDay();
  return day === 0 || day === 6;
};

const isHoliday = (date, holidays) => {
  return holidays.some(
    (h) => new Date(h).toDateString() === date.toDateString()
  );
};
