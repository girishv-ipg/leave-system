import User from "../models/user.js";
import cron from "node-cron";

/**
 * Carry forward unused leaves to the next year.
 * - Runs every year on Jan 1st, 00:00
 * - Carries forward a maximum of 15 unused leaves
 * - Resets currentYearLeaves to 30
 */

// "0 0 1 1 *"
cron.schedule("0 0 1 1 *", async () => {
  console.log("[CRON] Carry-forward job started for new year...");

  const NEW_YEAR_QUOTA = 30;
  const MAX_CARRY_FORWARD = 15;
  const currentYear = new Date().getFullYear();

  try {
    const users = await User.find({});

    for (const user of users) {
      const prevBalance = user.leaveBalance || 0;

      // Carry forward up to 15 from previous year
      const carryForward = Math.min(prevBalance, MAX_CARRY_FORWARD);

      // Calculate new total leave balance for this year
      const newBalance = carryForward + NEW_YEAR_QUOTA;

      // Update user's leave fields
      user.carryOverLeaves = carryForward;
      user.currentYearLeaves = NEW_YEAR_QUOTA;
      user.leaveBalance = newBalance;
      user.totalLeaveQuota = newBalance;

      // Optional: store the last year processed (to prevent reruns)
      if (
        !user.lastCarryForwardYear ||
        user.lastCarryForwardYear < currentYear
      ) {
        user.lastCarryForwardYear = currentYear;
        await user.save();
        console.log(
          `[CRON] ${
            user.name || user.employeeCode
          }: carried forward ${carryForward}, total ${newBalance}`
        );
      } else {
        console.log(
          `[CRON] ${
            user.name || user.employeeCode
          }: already processed for ${currentYear}, skipping.`
        );
      }
    }

    console.log("[CRON] Carry-forward job completed successfully.");
  } catch (err) {
    console.error("[CRON] Error during carry-forward job:", err);
  }
});
