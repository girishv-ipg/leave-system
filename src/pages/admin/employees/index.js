"use client";

import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import { Delete, Edit, Visibility } from "@mui/icons-material";
import axiosInstance, { formatDate } from "@/utils/helpers";
import { useEffect, useState } from "react";

import AdminLayout from "..";
import CalendarModal from "./CalendarModal";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import ExcelJS from "exceljs";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import LeaveCalendar from "@/components/Calendar";
import { saveAs } from "file-saver";
import { useRouter } from "next/router";
import withAdminAuth from "@/pages/auth/Authentication";

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

const EmployeeList = () => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const handleOpen = (emp) => {
    setSelectedEmployee(emp);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedEmployee(null);
  };

  const handleEdit = (employee) => {
    // Navigate to register page with employee data
    router.push({
      pathname: "/admin/register",
      query: { edit: true, id: employee._id },
    });
    // We'll store the employee data in localStorage to access it in the register page
    localStorage.setItem("editEmployee", JSON.stringify(employee));
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this employee?")) {
      try {
        await axiosInstance.delete(`/admin/user/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        // Refresh employee list after deletion
        getEmployees();
      } catch (error) {
        console.error("Error deleting employee:", error);
      }
    }
  };

  const getEmployees = async () => {
    try {
      const response = await axiosInstance.get("/admin/employees", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      setEmployees(response.data.data);
    } catch (error) {}
  };

  useEffect(() => {
    // Fetch leave requests when the component mounts
    getEmployees();
  }, []);

  const countWorkingDays = (start, end, halfDayType = "") => {
    // Normalize holiday strings for quick lookup
    const holidaySet = new Set(holidays.map((h) => new Date(h).toDateString()));

    // Ensure start <= end
    const s = new Date(start);
    const e = new Date(end);
    if (s > e) [start, end] = [end, start];

    const isWorkingDay = (d) => {
      const day = d.getDay(); // 0 Sun, 6 Sat
      return day !== 0 && day !== 6 && !holidaySet.has(d.toDateString());
    };

    // If half day, return 0.5 only if there’s at least one working day in the range
    if (halfDayType) {
      const d = new Date(start);
      const last = new Date(end);
      while (d <= last) {
        if (isWorkingDay(d)) return 0.5;
        d.setDate(d.getDate() + 1);
      }
      return 0; // range had no working days
    }

    // Full-day counting
    const current = new Date(start);
    const lastDay = new Date(end);
    let count = 0;

    while (current <= lastDay) {
      if (isWorkingDay(current)) count++;
      current.setDate(current.getDate() + 1);
    }

    return count;
  };

  let isHr = () => {
    const user = JSON.parse(localStorage.getItem("user"));

    if (user && user.role === "hr") {
      return true;
    }
    return false;
  };

  const handleCalendarView = (employee) => {
    setSelectedEmployee(employee);
    setCalendarOpen(true);
  };

  const handleExportToExcel = async (employee) => {
    // --- Parse month and year dynamically ---
    // Utility: Count weekdays (Mon–Fri) in a given month
    function getWorkingDaysInMonth(year, month) {
      let workingDays = 0;
      const date = new Date(year, month, 1);

      while (date.getMonth() === month) {
        const day = date.getDay();
        const dateStr = date.toISOString().slice(0, 10);

        // Skip Saturday, Sunday, and holidays
        if (day !== 0 && day !== 6 && !holidays.includes(dateStr)) {
          workingDays++;
        }

        date.setDate(date.getDate() + 1);
      }

      return workingDays;
    }

    // --- Auto-detect latest month from leaveHistory ---
    const latestLeave = employee.leaveHistory
      .map((l) => new Date(l.createdAt))
      .sort((a, b) => b - a)[0];

    const selectedMonth = latestLeave.getMonth();
    const selectedYear = latestLeave.getFullYear();

    // --- Filter leaves of that month ---
    const monthlyLeaves = employee.leaveHistory.filter((leave) => {
      const leaveDate = new Date(leave.createdAt);
      return (
        leaveDate.getMonth() === selectedMonth &&
        leaveDate.getFullYear() === selectedYear
      );
    });

    // --- Compute totals ---
    const totalWorkingDays = getWorkingDaysInMonth(
      selectedYear,
      selectedMonth,
      holidays
    );
    const leaveDays = monthlyLeaves.reduce(
      (sum, leave) => sum + (leave.numberOfDays || 0),
      0
    );
    const workedDays = Math.max(totalWorkingDays - leaveDays, 0);

    // --- Prepare final export data ---

    // Create workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Attendance");

    // Define your data rows based on employee object
    // --- Prepare final data for export ---
    const data = [
      ["Field", "Value"],
      ["Employee Name", employee.name || "N/A"],
      [
        "Month",
        `${new Date(selectedYear, selectedMonth).toLocaleString("default", {
          month: "long",
        })} ${selectedYear}`,
      ],
      ["Total Working Days", totalWorkingDays],
      [
        "Leave Details",
        monthlyLeaves.length
          ? monthlyLeaves
              .map(
                (leave) =>
                  `${leave.startDate?.slice(0, 10)} to ${leave.endDate?.slice(
                    0,
                    10
                  )} (${leave.reason || "N/A"})`
              )
              .join("; ")
          : "None",
      ],
      ["Leave Days", leaveDays],
      ["Worked Days", workedDays],
      ["WFH", 0],
      ["On Duty", 0],
    ];

    // Add each row to worksheet
    data.forEach((row) => worksheet.addRow(row));

    // Header styling
    worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF007ACC" },
    };

    // Auto column width
    worksheet.columns.forEach((column) => {
      column.width = 25;
    });

    // Generate file buffer and trigger download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(blob, `${employee.name || "Employee"}_Attendance.xlsx`);
  };

  // Utility: Determine quarter from month index (0–11)
  function getQuarter(month) {
    if (month < 3) return 1;
    if (month < 6) return 2;
    if (month < 9) return 3;
    return 4;
  }

  // Utility: Count working days (Mon–Fri) in a given month, excluding holidays
  function getWorkingDaysInMonth(year, month, holidays = []) {
    let workingDays = 0;
    const date = new Date(year, month, 1);

    while (date.getMonth() === month) {
      const day = date.getDay();
      const dateStr = date.toISOString().slice(0, 10);

      if (day !== 0 && day !== 6 && !holidays.includes(dateStr)) {
        workingDays++;
      }

      date.setDate(date.getDate() + 1);
    }

    return workingDays;
  }

  function getWorkingDaysInMonth(year, month, holidays = []) {
    let workingDays = 0;
    const date = new Date(year, month, 1);

    while (date.getMonth() === month) {
      const day = date.getDay();
      const dateStr = date.toISOString().slice(0, 10);
      if (day !== 0 && day !== 6 && !holidays.includes(dateStr)) {
        workingDays++;
      }
      date.setDate(date.getDate() + 1);
    }

    return workingDays;
  }
  const handleExportQuarterly = async (employee) => {
    if (!employee?.leaveHistory?.length) return;

    // --- Find latest leave date ---
    const latestLeave = employee.leaveHistory
      .map((l) => new Date(l.createdAt))
      .sort((a, b) => b - a)[0];

    const latestMonth = latestLeave.getMonth();
    const latestYear = latestLeave.getFullYear();

    // --- Build last 4 months (rolling) ---
    const monthsToInclude = [];
    for (let i = 0; i < 4; i++) {
      const d = new Date(latestYear, latestMonth - i, 1);
      monthsToInclude.push({ year: d.getFullYear(), month: d.getMonth() });
    }

    // --- Prepare grouped data with total working days ---
    const grouped = {};
    monthsToInclude.forEach(({ year, month }) => {
      const label = `${new Date(year, month).toLocaleString("default", {
        month: "long",
      })} ${year}`;

      grouped[label] = {
        year,
        month,
        totalWorkingDays: getWorkingDaysInMonth(year, month, holidays),
        leaveDays: 0,
        leaveDetails: [],
      };
    });

    // --- Accumulate leaveDays and leaveDetails per month ---
    employee.leaveHistory.forEach((leave) => {
      const createdAt = new Date(leave.createdAt);
      const year = createdAt.getFullYear();
      const month = createdAt.getMonth();

      const label = `${new Date(year, month).toLocaleString("default", {
        month: "long",
      })} ${year}`;

      if (grouped[label]) {
        grouped[label].leaveDays += leave.numberOfDays || 0;
        grouped[label].leaveDetails.push(
          `${leave.startDate?.slice(0, 10)} to ${leave.endDate?.slice(
            0,
            10
          )} (${leave.reason || "N/A"})`
        );
      }
    });

    // --- Prepare Excel workbook ---
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Last 4 Months Summary");

    // Add header
    worksheet.addRow(["Field", "Value"]);
    worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF007ACC" },
    };

    // Add employee info
    worksheet.addRow([]);
    worksheet.addRow(["Employee Name", employee.name || "N/A"]);
    worksheet.addRow([
      "Report Period",
      `${monthsToInclude[monthsToInclude.length - 1].month + 1}/${
        monthsToInclude[monthsToInclude.length - 1].year
      } - ${latestMonth + 1}/${latestYear}`,
    ]);

    // --- Add monthly breakdown for last 4 months ---
    monthsToInclude
      .map(({ year, month }) => {
        return `${new Date(year, month).toLocaleString("default", {
          month: "long",
        })} ${year}`;
      })
      .forEach((monthLabel) => {
        const info = grouped[monthLabel];
        if (!info) return;

        const workedDays = Math.max(info.totalWorkingDays - info.leaveDays, 0);

        worksheet.addRow([]);
        worksheet.addRow(["Month", monthLabel]);
        worksheet.addRow(["Total Working Days", info.totalWorkingDays]);
        worksheet.addRow([
          "Leave Details",
          info.leaveDetails.length ? info.leaveDetails.join("; ") : "None",
        ]);
        worksheet.addRow(["Leave Days", info.leaveDays]);
        worksheet.addRow(["Worked Days", workedDays]);
        worksheet.addRow(["WFH", 0]);
        worksheet.addRow(["On Duty", 0]);
      });

    // Auto column width
    worksheet.columns.forEach((col) => (col.width = 25));

    // Export file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(blob, `${employee.name || "Employee"}_Last4Months_Report.xlsx`);
  };

  // years

  // Utility: Count working days (Mon–Fri) in a month excluding holidays
  function getWorkingDaysInMonth(year, month, holidays = []) {
    let workingDays = 0;
    const date = new Date(year, month, 1);

    while (date.getMonth() === month) {
      const day = date.getDay();
      const dateStr = date.toISOString().slice(0, 10);
      if (day !== 0 && day !== 6 && !holidays.includes(dateStr)) {
        workingDays++;
      }
      date.setDate(date.getDate() + 1);
    }

    return workingDays;
  }

  const handleExportYearly = async (
    employee,
    selectedYear = new Date().getFullYear()
  ) => {
    if (!employee?.leaveHistory?.length) return;

    // --- Group leaves by month (Jan–Dec) ---
    const grouped = {};

    employee.leaveHistory.forEach((leave) => {
      const createdAt = new Date(leave.createdAt);
      const year = createdAt.getFullYear();
      const month = createdAt.getMonth();

      // Only include leaves for the selected year
      if (year === selectedYear) {
        const label = `${new Date(year, month).toLocaleString("default", {
          month: "long",
        })} ${year}`;

        if (!grouped[label]) {
          grouped[label] = {
            year,
            month,
            totalWorkingDays: getWorkingDaysInMonth(year, month, holidays),
            leaveDays: 0,
            leaveDetails: [],
          };
        }

        grouped[label].leaveDays += leave.numberOfDays || 0;
        grouped[label].leaveDetails.push(
          `${leave.startDate?.slice(0, 10)} to ${leave.endDate?.slice(
            0,
            10
          )} (${leave.reason || "N/A"})`
        );
      }
    });

    // --- Prepare Excel workbook ---
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`${selectedYear} Leave Report`);

    // Add header
    worksheet.addRow(["Field", "Value"]);
    worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF007ACC" },
    };

    // --- Add employee info ---
    worksheet.addRow([]);
    worksheet.addRow(["Employee Name", employee.name || "N/A"]);
    worksheet.addRow(["Year", selectedYear]);

    // --- Add monthly breakdown (Jan–Dec) ---
    for (let month = 0; month < 12; month++) {
      const label = `${new Date(selectedYear, month).toLocaleString("default", {
        month: "long",
      })} ${selectedYear}`;

      const info = grouped[label] || {
        totalWorkingDays: getWorkingDaysInMonth(selectedYear, month, holidays),
        leaveDays: 0,
        leaveDetails: [],
      };

      const workedDays = Math.max(info.totalWorkingDays - info.leaveDays, 0);

      worksheet.addRow([]);
      worksheet.addRow(["Month", label]);
      worksheet.addRow(["Total Working Days", info.totalWorkingDays]);
      worksheet.addRow([
        "Leave Details",
        info.leaveDetails.length ? info.leaveDetails.join("; ") : "None",
      ]);
      worksheet.addRow(["Leave Days", info.leaveDays]);
      worksheet.addRow(["Worked Days", workedDays]);
      worksheet.addRow(["WFH", 0]);
      worksheet.addRow(["On Duty", 0]);
    }

    // Auto column width
    worksheet.columns.forEach((col) => (col.width = 25));

    // --- Generate and download file ---
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(
      blob,
      `${employee.name || "Employee"}_${selectedYear}_Leave_Report.xlsx`
    );
  };

  return (
    <AdminLayout>
      {" "}
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Employee Leave Overview
        </Typography>

        <TableContainer component={Paper}>
          <Table>
            <TableHead sx={{ backgroundColor: "#d6d6d6" }}>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Employee ID</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>DOJ</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Carry Over Leaves</TableCell>
                <TableCell>Current Year Leaves</TableCell>
                <TableCell>Total Leave Quota</TableCell>
                <TableCell>Leave Taken</TableCell>
                <TableCell>Leave Balance</TableCell>

                {isHr() ? null : <TableCell>Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {employees.map((emp) => (
                <TableRow key={emp._id}>
                  <TableCell sx={{ textTransform: "capitalize" }}>
                    {emp.name}
                  </TableCell>
                  <TableCell>{emp.employeeCode}</TableCell>
                  <TableCell sx={{ textTransform: "capitalize" }}>
                    {emp.department}
                  </TableCell>
                  <TableCell sx={{ textTransform: "capitalize" }}>
                    {emp.joiningDate
                      ? new Date(emp.joiningDate).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })
                      : "NA"}
                  </TableCell>

                  <TableCell sx={{ textTransform: "capitalize" }}>
                    {emp.role}
                  </TableCell>
                  <TableCell sx={{ textTransform: "capitalize" }}>
                    {emp.carryOverLeaves}
                  </TableCell>
                  <TableCell sx={{ textTransform: "capitalize" }}>
                    {emp.currentYearLeaves}
                  </TableCell>
                  <TableCell>{emp.totalLeaveQuota || "--"}</TableCell>
                  <TableCell>
                    {Number(emp.totalLeaveQuota) - Number(emp.leaveBalance) ||
                      0}
                  </TableCell>
                  <TableCell>{emp.leaveBalance || "--"}</TableCell>

                  {isHr() ? null : (
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Tooltip title="View Details">
                          <IconButton
                            color="primary"
                            onClick={() => handleOpen(emp)}
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton
                            color="info"
                            onClick={() => handleEdit(emp)}
                          >
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            color="error"
                            onClick={() => handleDelete(emp._id)}
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Calendar">
                          <IconButton
                            color="primary"
                            onClick={() => handleCalendarView(emp)}
                          >
                            <CalendarTodayIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Export Monthly">
                          <IconButton
                            color="primary"
                            onClick={() => handleExportToExcel(emp)}
                          >
                            <FileDownloadIcon />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Export Quarterly">
                          <IconButton
                            color="primary"
                            onClick={() => handleExportQuarterly(emp)}
                          >
                            <FileDownloadIcon />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Export Yearly">
                          <IconButton
                            color="primary"
                            onClick={() => handleExportYearly(emp)}
                          >
                            <FileDownloadIcon />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Dialog Popup */}
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
          <DialogTitle>Employee Details - {selectedEmployee?.name}</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mb: 2 }}>
              <Typography>
                <b>ID:</b> {selectedEmployee?.employeeCode}
              </Typography>
              <Typography>
                <b>Designation:</b> {selectedEmployee?.designation}
              </Typography>

              <Typography>
                <b>Leave Taken:</b>{" "}
                {Number(selectedEmployee?.totalLeaveQuota) -
                  Number(selectedEmployee?.leaveBalance)}
              </Typography>
              <Typography>
                <b>Leave Balance:</b> {selectedEmployee?.leaveBalance}
              </Typography>
            </Stack>

            <Typography variant="h6" gutterBottom>
              Leave History
            </Typography>

            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: "#d6d6d6" }}>
                  <TableCell>From</TableCell>
                  <TableCell>To</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Business Days</TableCell>
                  <TableCell>Reason</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Comment</TableCell>
                  <TableCell>Approved/RejectedBy</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {selectedEmployee?.leaveHistory.map((entry, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{formatDate(entry.startDate)}</TableCell>
                    <TableCell>{formatDate(entry.endDate)}</TableCell>
                    <TableCell sx={{ textTransform: "capitalize" }}>
                      {entry?.leaveType}
                    </TableCell>
                    <TableCell>
                      {countWorkingDays(
                        entry.startDate,
                        entry.endDate,
                        entry.halfDayType
                      )}
                    </TableCell>
                    <TableCell sx={{ textTransform: "capitalize" }}>
                      {entry?.reason}
                    </TableCell>
                    <TableCell sx={{ textTransform: "capitalize" }}>
                      {entry?.status}
                    </TableCell>
                    <TableCell sx={{ textTransform: "capitalize" }}>
                      {entry?.adminNote || "--"}
                    </TableCell>
                    <TableCell sx={{ textTransform: "capitalize" }}>
                      {entry?.reviewedBy?.name || "--"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose} variant="outlined">
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
      {/* Calendar Modal */}
      <CalendarModal
        open={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        title="Leaves"
        employee={selectedEmployee}
      />
    </AdminLayout>
  );
};

export default withAdminAuth(EmployeeList, ["admin", "manager", "hr"]);
