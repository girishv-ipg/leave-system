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
import { useRouter } from "next/router";
import withAdminAuth from "@/pages/auth/Authentication";

const EmployeeList = () => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employees, setEmployees] = useState([]);

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
    } catch (error) {
      console.error("Error fetching leave requests:", error);
    }
  };

  useEffect(() => {
    // Fetch leave requests when the component mounts
    getEmployees();
  }, []);

  const calculateLeaveDays = (startDate, endDate, leaveDuration) => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Calculate the difference in milliseconds and convert to days
    const timeDiff = Math.abs(end - start);
    const diffDays = Math.floor(timeDiff / (1000 * 60 * 60 * 24)) + 1;

    if (leaveDuration === "half-day") {
      return 0.5;
    }

    return diffDays;
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
                <TableCell>Role</TableCell>
                <TableCell>Leave Taken</TableCell>
                <TableCell>Leave Balance</TableCell>
                <TableCell>Total Leave Quota</TableCell>
                <TableCell>Actions</TableCell>
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
                    {emp.role}
                  </TableCell>
                  <TableCell>
                    {Number(emp.totalLeaveQuota) - Number(emp.leaveBalance) ||
                      0}
                  </TableCell>
                  <TableCell>{emp.leaveBalance || "--"}</TableCell>
                  <TableCell>{emp.totalLeaveQuota}</TableCell>
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
                    </Stack>
                  </TableCell>
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
                  <TableCell>Days</TableCell>
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
                      {calculateLeaveDays(
                        entry.startDate,
                        entry.endDate,
                        entry.leaveDuration
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
    </AdminLayout>
  );
};

export default withAdminAuth(EmployeeList, ["admin", "manager"]);
