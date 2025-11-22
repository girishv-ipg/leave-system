"use client";

import {
  Box,
  Button,
  Container,
  Divider,
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
import axiosInstance, { formatDate, holidays } from "@/utils/helpers";
import { useEffect, useState } from "react";

import Loader from "@/components/Loader";
import NoDataFound from "./NoDataFound";
import moment from "moment";

const LeaveOverView = () => {
  const [loading, setLoading] = useState(false);

  const [employee, setEmployee] = useState([]);

  const getEmployees = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/employee-details", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setEmployee(response.data.data);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch leave requests when the component mounts
    getEmployees();
  }, []);

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
    } catch (err) {}
  };

  const isFutureLeave = (startDate) => {
    return new Date(startDate) >= new Date();
  }; // today or future

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
    <Container maxWidth={false} sx={{ mt: 0, width: "100%" }}>
      {" "}
      {loading ? (
        <Loader />
      ) : employee.length === 0 ? (
        <NoDataFound message="No employee data found." />
      ) : (
        <Box sx={{ p: 3 }}>
          <Stack spacing={2} sx={{ mb: 2 }}>
            <Typography>
              <b>ID:</b> {employee?.employeeCode}
            </Typography>
            <Typography>
              <b>Designation:</b> {employee?.designation}
            </Typography>
            <Typography>
              <b>Date of Joining:</b>{" "}
              {employee?.joiningDate
                ? moment(employee?.joiningDate).format("DD-MM-YYYY")
                : "N/A"}{" "}
            </Typography>
            <Typography>
              <b>Leave Taken:</b>{" "}
              {Number(employee?.totalLeaveQuota) -
                Number(employee?.leaveBalance)}
            </Typography>
            <Typography>
              <b>Leave Balance:</b> {employee?.leaveBalance}
            </Typography>
            <Typography>
              <b>Carry Over Leaves:</b> {employee?.carryOverLeaves}
            </Typography>
            <Typography>
              <b>Current Year Leaves:</b> {employee?.currentYearLeaves}
            </Typography>
          </Stack>

          <Typography variant="h5" gutterBottom>
            Employee Leave Overview
          </Typography>
          <Divider sx={{ mb: 2 }} />

          {employee?.leaveHistory?.length === 0 ? (
            <NoDataFound message="No leave history found." />
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead sx={{ backgroundColor: "#d6d6d6" }}>
                  <TableRow>
                    <TableCell>From</TableCell>
                    <TableCell>To</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Business Days</TableCell>
                    <TableCell>Reason</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Comment</TableCell>
                    <TableCell>ApprovedBy</TableCell>{" "}
                    <TableCell>Approved Date</TableCell>{" "}
                    <TableCell>Action</TableCell>{" "}
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
                        {leave.numberOfDays ||
                          calculateLeaveDays(
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
                        {leave?.updatedAt ? formatDate(leave.updatedAt) : "--"}
                      </TableCell>

                      <TableCell sx={{ textTransform: "capitalize" }}>
                        {leave.status === "pending" && (
                          <Button
                            onClick={() =>
                              handleUpdateStatus(leave._id, "cancelled")
                            }
                          >
                            Cancel Request
                          </Button>
                        )}

                        {leave.status === "approved" && (
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

                        {leave.status === "cancelled" && "--"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}
    </Container>
  );
};

export default LeaveOverView;
