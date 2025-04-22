import {
  Box,
  Button,
  Container,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";

import AdminLayout from "..";
import axiosInstance from "@/utils/helpers";
import withAdminAuth from "@/pages/auth/Authentication";

const Requests = () => {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [adminNote, setAdminNote] = useState("");

  const handleDecision = async (id, decision) => {
    try {
      const res = await axiosInstance.put(
        `/admin/leave-requests/${id}`,
        { status: decision, adminNote: adminNote },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      getLeaveRequests();
      console.log(res.data, "response");
    } catch (error) {
      console.error("Error updating comment:", error);
    }
  };

  const getLeaveRequests = async () => {
    try {
      const response = await axiosInstance.get(
        "/admin/leave-requests/pending",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setLeaveRequests(response.data.data);
    } catch (error) {
      console.error("Error fetching leave requests:", error);
    }
  };

  useEffect(() => {
    // Fetch leave requests when the component mounts
    getLeaveRequests();
  }, []);

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0"); // months are 0-indexed
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  return (
    <AdminLayout>
      <Box>
        <Container sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            Leave Requests
          </Typography>

          <Stack>
            {leaveRequests.map((req) => (
              <Paper key={req.id} sx={{ p: 2, mb: 2 }}>
                <Stack spacing={1}>
                  <Typography>
                    <b>{req?.user?.name}</b> ({req.user?.employeeCode}){" "}
                    {req.halfDayType ? (
                      <>Half Day : ({req.halfDayType}) </>
                    ) : (
                      ""
                    )}
                    requested leave from <b>{formatDate(req.startDate)}</b> to{" "}
                    <b>{formatDate(req.endDate)}</b>
                    {req.status === "withdrawal-requested" ? (
                      <Typography sx={{ fontWeight: 800 }}>
                        Leave Withdrawal Request
                      </Typography>
                    ) : (
                      ""
                    )}
                  </Typography>
                  <Typography>Reason: {req.reason}</Typography>
                  <TextField
                    label="Comment"
                    size="small"
                    value={req.adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                  />
                  <Stack direction="row" sx={{ pt: 2 }} spacing={2}>
                    <Button
                      variant="contained"
                      color="success"
                      onClick={() => handleDecision(req._id, "approved")}
                      disabled={req.status !== "pending"}
                      sx={{
                        backgroundColor: "green !important",
                        color: "white",
                        "&:hover": {
                          backgroundColor: "#1b5e20",
                        },
                      }}
                    >
                      Approve
                    </Button>

                    <Button
                      sx={{
                        backgroundColor: "red !important",
                        color: "white",
                        "&:hover": {
                          backgroundColor: "#1b5e20",
                        },
                      }}
                      variant="contained"
                      color="error"
                      onClick={() => handleDecision(req._id, "rejected")}
                      disabled={req.status !== "pending"}
                    >
                      Deny
                    </Button>

                    <Button
                      variant="contained"
                      color="success"
                      onClick={() => handleDecision(req._id, "cancelled")}
                      disabled={req.status !== "withdrawal-requested"}
                      sx={{
                        backgroundColor: "green !important",
                        color: "white",
                        "&:hover": {
                          backgroundColor: "#1b5e20",
                        },
                      }}
                    >
                      Cancel Leave on Request
                    </Button>
                    <Typography>Status: {req.status}</Typography>
                  </Stack>
                </Stack>
              </Paper>
            ))}
            <Divider sx={{ my: 4 }} />
          </Stack>
        </Container>
      </Box>
    </AdminLayout>
  );
};

export default withAdminAuth(Requests, ["admin", "manager"]);
