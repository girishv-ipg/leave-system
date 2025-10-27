const Validator = require("validatorjs");
const User = require("../models/user");
const Leave = require("../models/leave");
const ExcelJS = require("exceljs");
const fs = require("fs");
const path = require("path");

/**
 * 🧮 Count working days excluding weekends and holidays
 */
const countWorkingDays = (start, end) => {
  const holidays = [
    "2025-01-01",
    "2025-01-14",
    "2025-01-26",
    "2025-02-26",
    "2025-04-18",
    "2025-05-01",
    "2025-08-15",
    "2025-08-27",
    "2025-10-01",
    "2025-10-02",
    "2025-10-20",
    "2025-11-01",
    "2025-10-25",
  ];

  const current = new Date(start);
  let count = 0;

  while (current <= end) {
    const day = current.getDay();
    const isWeekend = day === 0 || day === 6; // Sunday or Saturday
    const isHoliday = holidays.some(
      (h) => new Date(h).toDateString() === current.toDateString()
    );
    if (!isWeekend && !isHoliday) count++;
    current.setDate(current.getDate() + 1);
  }

  return count;
};

/**
 * 📅 Format date range (Oct-28–Oct-29)
 */
const formatDateRange = (start, end) => {
  const s = new Date(start);
  const e = new Date(end);
  const sMonth = s.toLocaleString("default", { month: "short" });

  if (s.toDateString() === e.toDateString()) return `${sMonth}-${s.getDate()}`;
  if (s.getMonth() === e.getMonth())
    return `${sMonth}-${s.getDate()}–${e.getDate()}`;

  const eMonth = e.toLocaleString("default", { month: "short" });
  return `${sMonth}-${s.getDate()} to ${eMonth}-${e.getDate()}`;
};

/**
 * 📤 POST /admin/reports/leaves
 * Body: { employeeId, year, month }
 */
const exportLeaveReport = async (req, res) => {
  try {
    const { employeeId, year, month } = req.body;

    // ✅ Validate request
    const rules = {
      year: "required|integer|min:2020|max:2030",
      month: "integer|min:1|max:12",
      employeeId: "string",
    };
    const validation = new Validator(req.body, rules);
    if (validation.fails()) {
      return res.status(400).json({
        error: "Validation failed",
        validationErrors: validation.errors.all(),
      });
    }

    // ✅ Determine date range
    const startDate = new Date(year, month ? month - 1 : 0, 1);
    const endDate = month
      ? new Date(year, month, 0, 23, 59, 59)
      : new Date(year, 11, 31, 23, 59, 59);

    // ✅ Query filter
    const filter = {
      startDate: { $lte: endDate },
      endDate: { $gte: startDate },
      status: "approved",
    };
    if (employeeId && employeeId !== "all") filter.user = employeeId;

    // ✅ Fetch data
    const leaves = await Leave.find(filter)
      .populate("user", "name employeeCode department designation")
      .sort({ startDate: 1 });

    if (!leaves.length) {
      return res.status(404).json({ message: "No records found" });
    }

    // ✅ Prepare export folder
    const exportDir = path.join(__dirname, "../../exports");
    if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir, { recursive: true });

    // ✅ Create workbook
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Leave Report");

    sheet.columns = [
      { header: "Employee", key: "employee", width: 25 },
      { header: "Employee Code", key: "employeeCode", width: 15 },
      { header: "Year", key: "year", width: 10 },
      { header: "Month", key: "month", width: 15 },
      { header: "No of working days", key: "workingDays", width: 20 },
      { header: "No of days worked", key: "daysWorked", width: 20 },
      { header: "Leaves Taken", key: "leavesTaken", width: 15 },
      { header: "Work from home", key: "wfh", width: 15 },
      { header: "On-duty", key: "onDuty", width: 15 },
      { header: "Comments", key: "comments", width: 80 },
    ];

    // ✅ Calculate total working days
    let totalWorkingDays = 0;
    if (month) {
      totalWorkingDays = countWorkingDays(
        new Date(year, month - 1, 1),
        new Date(year, month, 0)
      );
    } else {
      for (let m = 0; m < 12; m++) {
        totalWorkingDays += countWorkingDays(
          new Date(year, m, 1),
          new Date(year, m + 1, 0)
        );
      }
    }

    // ✅ Group by employee
    const grouped = {};
    for (const leave of leaves) {
      const userId = leave.user._id.toString();

      if (!grouped[userId]) {
        grouped[userId] = {
          employee: leave.user.name,
          employeeCode: leave.user.employeeCode,
          year,
          month: month
            ? new Date(year, month - 1).toLocaleString("default", {
                month: "long",
              })
            : "All Months",
          workingDays: totalWorkingDays,
          leavesTaken: 0,
          wfh: 0,
          onDuty: 0,
          comments: [],
        };
      }

      const days = leave.numberOfDays || 0;

      // ✅ Categorize leave types
      if (["casual", "sick", "earned", "leave"].includes(leave.leaveType))
        grouped[userId].leavesTaken += days;
      if (leave.leaveType === "wfh") grouped[userId].wfh += days;
      if (leave.leaveType === "on_duty") grouped[userId].onDuty += days;

      // ✅ Build readable comment: include date + leaveType
      const dateLabel = formatDateRange(leave.startDate, leave.endDate);
      const leaveType =
        leave.leaveType.charAt(0).toUpperCase() + leave.leaveType.slice(1);

      const commentParts = [`[${dateLabel} | ${leaveType}]`];
      if (leave.reason) commentParts.push(`Reason: ${leave.reason}`);
      if (leave.adminNote) commentParts.push(`Admin Note: ${leave.adminNote}`);

      grouped[userId].comments.push(commentParts.join(" | "));
    }

    // ✅ Write rows
    for (const id in grouped) {
      const data = grouped[id];
      const daysWorked = Math.max(data.workingDays - data.leavesTaken, 0);

      sheet.addRow({
        employee: data.employee,
        employeeCode: data.employeeCode,
        year: data.year,
        month: data.month,
        workingDays: data.workingDays,
        daysWorked,
        leavesTaken: data.leavesTaken || "",
        wfh: data.wfh || "",
        onDuty: data.onDuty || "",
        comments: data.comments[0] || "",
      });

      // add subsequent comments as separate rows
      for (let i = 1; i < data.comments.length; i++) {
        sheet.addRow({
          employee: "",
          employeeCode: "",
          year: "",
          month: "",
          workingDays: "",
          daysWorked: "",
          leavesTaken: "",
          wfh: "",
          onDuty: "",
          comments: data.comments[i],
        });
      }
    }

    // ✅ Style sheet
    sheet.getRow(1).font = { bold: true };
    sheet.columns.forEach((col) => {
      col.alignment = {
        vertical: "middle",
        horizontal: "left",
        wrapText: true,
      };
    });

    // ✅ Save and send
    const fileName = `Leave_Report_${year}_${month || "All"}.xlsx`;
    const filePath = path.join(exportDir, fileName);
    await workbook.xlsx.writeFile(filePath);

    res.download(filePath, fileName, (err) => {
      if (err) console.error("Download error:", err);
      fs.unlink(filePath, () => {}); // cleanup
    });
  } catch (error) {
    console.error("Error exporting Excel report:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { exportLeaveReport };
