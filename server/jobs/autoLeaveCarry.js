import User from "../models/user.js";
import cron from "node-cron";

/**
 * New Year Carry-Forward Cron
 * Runs every Jan 1st at 00:00
 * Carry Rules:
 *  - Prev year unused: max 15 carried
 *  - Current year unused: max 15 carried
 *  - Total possible carry: 30
 *  - New year's fresh leaves: 30
 */

cron.schedule("0 0 1 1 *", async () => {
  console.log("[CRON] Carry-forward process started...");

  const NEW_YEAR_QUOTA = 30;
  const MAX_PER_BUCKET = 15;
  const currentYear = new Date().getFullYear();

  try {
    const users = await User.find({});

    for (const user of users) {
      // Skip if already done earlier
      if (user.lastCarryForwardYear === currentYear) {
        console.log(`[CRON] ${user.name}: already processed.`);
        continue;
      }

      const prevCarry = user.carryOverLeaves || 0; // leftover from last year
      const currentYearAlloc = user.currentYearLeaves || NEW_YEAR_QUOTA;
      const balance = Math.max(0, user.leaveBalance || 0);

      const totalStartOfYear = prevCarry + currentYearAlloc;

      const used = totalStartOfYear - balance;

      // Calculate remaining in each bucket
      const remainingCurrentYear = Math.max(0, currentYearAlloc - used);
      const consumedCurrentYear = Math.min(used, currentYearAlloc);
      const remainingPrevYear = Math.max(
        0,
        prevCarry - (used - consumedCurrentYear)
      );

      //  Apply your rule: max 15 from each bucket
      const carryPrev = Math.min(remainingPrevYear, MAX_PER_BUCKET);
      const carryCurrent = Math.min(remainingCurrentYear, MAX_PER_BUCKET);

      const totalCarry = carryPrev + carryCurrent;

      //  New year’s balance
      const newBalance = totalCarry + NEW_YEAR_QUOTA;

      // Update user
      user.carryOverLeaves = totalCarry;
      user.currentYearLeaves = NEW_YEAR_QUOTA;
      user.leaveBalance = newBalance;
      user.totalLeaveQuota = newBalance;
      user.lastCarryForwardYear = currentYear;

      await user.save();

      console.log(
        `[CRON] ${user.name}: prev=${carryPrev}, current=${carryCurrent}, totalCarry=${totalCarry}, newBalance=${newBalance}`
      );
    }

    console.log("[CRON] Carry-forward completed.");
  } catch (err) {
    console.error("[CRON] Error:", err);
  }
});
