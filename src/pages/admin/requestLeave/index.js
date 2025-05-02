import {
  Box,
  Button,
  Container,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import AdminLayout from "..";
import axiosInstance from "@/utils/helpers";
import { useRouter } from "next/navigation";
import { useState } from "react";
import withAdminAuth from "@/pages/auth/Authentication";

const initialForm = {
  startDate: "",
  endDate: "",
  reason: "",
  leaveType: "casual", // default leave type
  leaveDuration: "full-day", // default leave duration
  halfDayType: "", // optional, only for half-day leave
};

const LeaveRequestForm = () => {
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);
  const router = useRouter();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const token = localStorage.getItem("token");

      const res = await axiosInstance.post(
        "/request-leave",
        {
          ...form,
          employeeCode: user?.employeeCode,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSuccess("Leave request submitted successfully.");
      setForm(initialForm);
      // ✅ Delay navigation by 1 seconds
      setTimeout(() => {
        router.push("/employee/employeeDetail");
      }, 1000);
    } catch (err) {
      setSuccess("Error submitting leave. Try again.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h5" gutterBottom>
            Request Leave
          </Typography>
          <form onSubmit={handleSubmit}>
            <Stack sx={{ pt: 2 }} spacing={2}>
              <TextField
                label="Start Date"
                type="date"
                name="startDate"
                value={form.startDate}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                required
                inputProps={{
                  min: new Date().toISOString().split("T")[0], // Set today's date as minimum
                }}
              />
              <TextField
                label="End Date"
                type="date"
                name="endDate"
                value={form.endDate}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                required
                inputProps={{
                  min: new Date().toISOString().split("T")[0], // Set today's date as minimum
                }}
              />
              <TextField
                label="Leave Type"
                name="leaveType"
                value={form.leaveType}
                onChange={handleChange}
                select
                required
              >
                <MenuItem value="casual">Casual</MenuItem>
                <MenuItem value="sick">Sick</MenuItem>
              </TextField>
              <TextField
                label="Leave Duration"
                name="leaveDuration"
                value={form.leaveDuration}
                onChange={handleChange}
                select
                required
              >
                <MenuItem value="full-day">Full Day</MenuItem>
                <MenuItem value="half-day">Half Day</MenuItem>
              </TextField>

              {/* Show the Half Day Type field only if 'half-day' is selected */}
              {form.leaveDuration === "half-day" && (
                <TextField
                  label="Half Day Type"
                  name="halfDayType"
                  value={form.halfDayType}
                  onChange={handleChange}
                  select
                  required
                >
                  <MenuItem value="morning">Morning</MenuItem>
                  <MenuItem value="afternoon">Afternoon</MenuItem>
                </TextField>
              )}

              <TextField
                label="Reason"
                name="reason"
                value={form.reason}
                onChange={handleChange}
                multiline
                rows={3}
                required
              />

              <Button
                type="submit"
                variant="contained"
                disabled={submitting}
                color="primary"
              >
                {submitting ? "Submitting..." : "Submit"}
              </Button>
              {success && (
                <Typography variant="body2" color="text.secondary">
                  {success}
                </Typography>
              )}
            </Stack>
          </form>
        </Paper>
      </Container>
    </AdminLayout>
  );
};

export default withAdminAuth(LeaveRequestForm, ["admin", "manager"]);
