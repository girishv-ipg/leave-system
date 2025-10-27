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
import { useMemo, useState } from "react";

import EmployeeLayout from "..";
import axiosInstance from "@/utils/helpers";
import { useRouter } from "next/navigation";

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

  // 1️⃣ detect multi-day
  const isMultiDay = useMemo(() => {
    if (!form.startDate || !form.endDate) return false;
    const start = new Date(form.startDate);
    const end = new Date(form.endDate);
    // compare only calendar days
    return end.getTime() - start.getTime() >= 24 * 60 * 60 * 1000;
  }, [form.startDate, form.endDate]);

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
    <EmployeeLayout>
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
              />
              <TextField
                label="End Date"
                type="date"
                name="endDate"
                value={form.endDate}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                required
                disabled={!form.startDate}
                inputProps={{
                  min: form.startDate, // Set today's date as minimum
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
                <MenuItem value="wfh">WFH</MenuItem>
                <MenuItem value="on_duty">On Duty</MenuItem>
              </TextField>
              <TextField
                label="Leave Duration"
                name="leaveDuration"
                value={form.leaveDuration}
                onChange={handleChange}
                select
                required
                disabled={isMultiDay}
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
    </EmployeeLayout>
  );
};

export default LeaveRequestForm;
