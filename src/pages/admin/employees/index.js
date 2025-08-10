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
import LeaveCalendar from "@/components/Calendar";
import { useRouter } from "next/router";
import withAdminAuth from "@/pages/auth/Authentication";

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

      console.log(response.data.data);

      setEmployees(response.data.data);
    } catch (error) {
      console.error("Error fetching leave requests:", error);
    }
  };

  useEffect(() => {
    // Fetch leave requests when the component mounts
    getEmployees();
  }, []);

  const countWorkingDays = (start, end, halfDayType = "") => {
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
