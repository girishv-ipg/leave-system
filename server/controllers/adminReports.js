const Validator = require("validatorjs");
const User = require("../models/user");
const Leave = require("../models/leave");
const ExcelJS = require("exceljs");
const fs = require("fs");
const path = require("path");
const { holidays } = require("../utils/helpers");

/**
 * ✅ Count working days excluding weekends & holidays
 */
const countWorkingDays = (start, end) => {
  const current = new Date(start);
  let count = 0;

  while (current <= end) {
    const day = current.getDay();
    const isWeekend = day === 0 || day === 6;
    const isHoliday = holidays.some(
      (h) => new Date(h).toDateString() === current.toDateString()
    );

    if (!isWeekend && !isHoliday) count++;
    current.setDate(current.getDate() + 1);
  }

  return count;
};

/**
 * ✅ Format date range (Oct-12–Oct-15)
 */
const formatDateRange = (start, end) => {
  const s = new Date(start);
  const e = new Date(end);
  const sM = s.toLocaleString("default", { month: "short" });

  if (s.toDateString() === e.toDateString()) return `${sM}-${s.getDate()}`;

  if (s.getMonth() === e.getMonth())
    return `${sM}-${s.getDate()}–${e.getDate()}`;

  const eM = e.toLocaleString("default", { month: "short" });
  return `${sM}-${s.getDate()} to ${eM}-${e.getDate()}`;
};

/**
 * ✅ Calculate number of leave days with full/half-day support
 */
const calculateLeaveDays = (leave) => {
  if (leave.leaveDuration === "half-day") return 0.5;

  return countWorkingDays(new Date(leave.startDate), new Date(leave.endDate));
};

/**
 * ✅ Format leave comments
 */
const formatComment = (leave) => {
  const dateLabel = formatDateRange(leave.startDate, leave.endDate);
  const type =
    leave.leaveType.charAt(0).toUpperCase() + leave.leaveType.slice(1);

  const durationLabel =
    leave.leaveDuration === "half-day"
      ? `Half Day (${leave.halfDayType})`
      : "Full Day";

  const parts = [`[${dateLabel} | ${type} | ${durationLabel}]`];

  if (leave.reason) parts.push(`Reason: ${leave.reason}`);
  if (leave.adminNote) parts.push(`Admin Note: ${leave.adminNote}`);

  return parts.join(" | ");
};

/**
 * ✅ POST /admin/reports/leaves
 */
const exportLeaveReport = async (req, res) => {
  try {
    const { employeeId, year, month } = req.body;

    // ✅ Validate request
    const validation = new Validator(req.body, {
      year: "required|integer|min:2020|max:2035",
      month: "integer|min:1|max:12",
      employeeId: "string",
    });

    if (validation.fails()) {
      return res.status(400).json({
        error: "Validation failed",
        validationErrors: validation.errors.all(),
      });
    }

    // ✅ Build date range
    const startDate = new Date(year, month ? month - 1 : 0, 1);
    const endDate = month
      ? new Date(year, month, 0, 23, 59, 59)
      : new Date(year, 11, 31, 23, 59, 59);

    // ✅ Fetch users (exclude admin unless specifically chosen)
    let userFilter = { employeeCode: { $ne: "admin1234" } };
    if (employeeId && employeeId !== "all") userFilter = { _id: employeeId };

    const users = await User.find(
      userFilter,
      "name employeeCode department designation"
    );

    // ✅ Fetch leaves
    const filter = {
      startDate: { $lte: endDate },
      endDate: { $gte: startDate },
      status: "approved",
    };
    if (employeeId && employeeId !== "all") filter.user = employeeId;

    const leaves = await Leave.find(filter)
      .populate("user", "name employeeCode department designation")
      .sort({ startDate: 1 });

    // ✅ Ensure export folder
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
      { header: "Working Days", key: "workingDays", width: 20 },
      { header: "Days Worked", key: "daysWorked", width: 20 },
      { header: "Leaves Taken", key: "leavesTaken", width: 15 },
      { header: "WFH", key: "wfh", width: 15 },
      { header: "On-duty", key: "onDuty", width: 15 },
      { header: "Comments", key: "comments", width: 80 },
    ];

    // ✅ Calculate total working days
    const totalWorkingDays = month
      ? countWorkingDays(new Date(year, month - 1, 1), new Date(year, month, 0))
      : Array.from({ length: 12 }, (_, m) =>
          countWorkingDays(new Date(year, m, 1), new Date(year, m + 1, 0))
        ).reduce((a, b) => a + b, 0);

    // ✅ Group leaves per employee
    const grouped = {};

    for (const leave of leaves) {
      if (leave.user?.employeeCode === "admin1234") continue;

      const id = leave.user._id.toString();
      if (!grouped[id]) {
        grouped[id] = {
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

      const leaveDays = calculateLeaveDays(leave);

      if (["casual", "sick", "earned", "leave"].includes(leave.leaveType))
        grouped[id].leavesTaken += leaveDays;

      if (leave.leaveType === "wfh") grouped[id].wfh += leaveDays;
      if (leave.leaveType === "on_duty") grouped[id].onDuty += leaveDays;

      grouped[id].comments.push(formatComment(leave));
    }

    // ✅ Add all users (even without leaves)
    for (const user of users) {
      const id = user._id.toString();
      const data = grouped[id] || {
        employee: user.name,
        employeeCode: user.employeeCode,
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
        comments: ["No leaves taken"],
      };

      const daysWorked = Math.max(data.workingDays - data.leavesTaken, 0);

      sheet.addRow({
        employee: data.employee,
        employeeCode: data.employeeCode,
        year: data.year,
        month: data.month,
        workingDays: data.workingDays,
        daysWorked,
        leavesTaken: data.leavesTaken,
        wfh: data.wfh,
        onDuty: data.onDuty,
        comments: data.comments[0],
      });

      // Additional comment lines
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

    // ✅ Style header row
    const header = sheet.getRow(1);
    header.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
    header.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true,
    };
    header.height = 36;

    header.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "4472C4" },
      };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    // ✅ Auto-fit columns
    sheet.columns.forEach((col) => {
      let maxLength = 0;
      col.eachCell({ includeEmpty: true }, (cell) => {
        const len = cell.value ? cell.value.toString().length : 0;
        if (len > maxLength) maxLength = len;
      });
      col.width = Math.max(maxLength + 5, col.width);
    });

    // ✅ Export file
    const fileName = `Leave_Report_${year}_${month || "All"}.xlsx`;
    const filePath = path.join(exportDir, fileName);

    await workbook.xlsx.writeFile(filePath);

    // ✅ Send file to client
    res.download(filePath, fileName);

    // ✅ Delete after sending is completed
    res.on("finish", () => {
      fs.unlink(filePath, (err) => {
        if (err) console.error("Error deleting exported file:", err);
      });
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { exportLeaveReport };
