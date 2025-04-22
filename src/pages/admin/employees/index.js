"use client";

import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import axiosInstance, { formatDate } from "@/utils/helpers";
import { useEffect, useState } from "react";

import AdminLayout from "..";
import withAdminAuth from "@/pages/auth/Authentication";

const EmployeeList = () => {
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

  const getEmployees = async () => {
    try {
      const response = await axiosInstance.get("/admin/employees", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      console.log(response?.data?.data, "response");
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
                <TableCell>Leave Taken</TableCell>
                <TableCell>Leave Balance</TableCell>
                <TableCell>Total Leave Quota</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {employees.map((emp) => (
                <TableRow key={emp._id}>
                  <TableCell>{emp.name}</TableCell>
                  <TableCell>{emp.employeeCode}</TableCell>
                  <TableCell>
                    {Number(emp.totalLeaveQuota) - Number(emp.leaveBalance) || 0}
                  </TableCell>
                  <TableCell>{emp.leaveBalance || '--'}</TableCell>
                  <TableCell>{emp.totalLeaveQuota}</TableCell>
                  <TableCell>
                    <Button variant="outlined" onClick={() => handleOpen(emp)}>
                      View Details
                    </Button>
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

export default withAdminAuth(EmployeeList, ["admin"]);
