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

  const [employee, setEmployee] = useState([]);

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
      const response = await axiosInstance.get("/employee-details", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      setEmployee(response.data.data);
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

  const handleUpdateStatus = async (id, status) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axiosInstance.patch(
        `/admin/leave-status/${id}`,
        {
          status: status,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      getEmployees();
    } catch (err) {
      console.error(err);
    }
  };

  const isFutureLeave = (startDate) => {
    return new Date(startDate) >= new Date();
  }; // today or future

  return (
    <AdminLayout>
      {" "}
      <Box sx={{ p: 3 }}>
        <Stack spacing={2} sx={{ mb: 2 }}>
          <Typography>
            <b>ID:</b> {employee?.employeeCode}
          </Typography>
          <Typography>
            <b>Designation:</b> {employee?.designation}
          </Typography>
          <Typography>
            <b>Leave Taken:</b>{" "}
            {Number(employee?.totalLeaveQuota) - Number(employee?.leaveBalance)}
          </Typography>
          <Typography>
            <b>Leave Balance:</b> {employee?.leaveBalance}
          </Typography>
        </Stack>

        <Typography variant="h5" gutterBottom>
          Employee Leave Overview
        </Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead sx={{ backgroundColor: "#d6d6d6" }}>
              <TableRow>
                <TableCell>From</TableCell>
                <TableCell>To</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Days</TableCell>
                <TableCell>Reason</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Comment</TableCell>
                <TableCell>ApprovedBy</TableCell> <TableCell>Action</TableCell>{" "}
              </TableRow>
            </TableHead>
            <TableBody>
              {employee?.leaveHistory?.map((leave, idx) => (
                <TableRow key={idx}>
                  <TableCell>{formatDate(leave.startDate)}</TableCell>
                  <TableCell>{formatDate(leave.endDate)}</TableCell>
                  <TableCell sx={{ textTransform: "capitalize" }}>
                    {leave?.leaveType}
                  </TableCell>
                  <TableCell>
                    {calculateLeaveDays(
                      leave.startDate,
                      leave.endDate,
                      leave.leaveDuration
                    )}
                  </TableCell>
                  <TableCell sx={{ textTransform: "capitalize" }}>
                    {leave?.reason}
                  </TableCell>
                  <TableCell sx={{ textTransform: "capitalize" }}>
                    {leave?.status}
                  </TableCell>
                  <TableCell sx={{ textTransform: "capitalize" }}>
                    {leave?.adminNote || "--"}
                  </TableCell>
                  <TableCell sx={{ textTransform: "capitalize" }}>
                    {leave?.reviewedBy?.name || "--"}
                  </TableCell>

                  <TableCell sx={{ textTransform: "capitalize" }}>
                    {/* {leave?.status === "pending" ? (
                      <Button
                        onClick={() => {
                          handleUpdateStatus(leave?._id);
                        }}
                      >
                        Cancel Leave Request
                      </Button>
                    ) : (
                      "--"
                    )} */}

                    {leave.status === "pending" &&
                      isFutureLeave(leave.startDate) && (
                        <Button
                          onClick={() =>
                            handleUpdateStatus(leave._id, "cancelled")
                          }
                        >
                          Cancel Request
                        </Button>
                      )}

                    {leave.status === "approved" &&
                      isFutureLeave(leave.startDate) && (
                        <Button
                          onClick={() =>
                            handleUpdateStatus(
                              leave._id,
                              "withdrawal-requested"
                            )
                          }
                        >
                          Request Withdrawal
                        </Button>
                      )}

                    {!isFutureLeave(leave.startDate) && (
                      <Typography variant="caption" color="gray">
                        This leave has already started and cannot be modified.
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </AdminLayout>
  );
};

export default withAdminAuth(EmployeeList, ["manager", "admin"]);
