import { Dialog, DialogContent, DialogTitle, IconButton } from "@mui/material";
import React, { useEffect, useState } from "react"; // <-- remove `use`

import CloseIcon from "@mui/icons-material/Close";
import LeaveCalendar from "@/components/Calendar";

export default function CalendarModal({
  title = "Modal Title",
  open = false,
  onClose,
  employee = {},
}) {
  const [ym, setYm] = useState({ year: 2025, month: 8 });
  const [leaves, setLeaves] = useState([]);

  // Reset month to "now" each time the dialog opens
  useEffect(() => {
    if (open) {
      const now = new Date();
      setYm({ year: now.getFullYear(), month: now.getMonth() + 1 });
    }
  }, [open]);

  useEffect(() => {
    if (employee?.leaveHistory) {
      setLeaves(employee.leaveHistory);
    }
  }, [employee]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {employee?.name}
        {"'s"} {title}
        <IconButton
          aria-label="close"
          onClick={onClose}
          edge="end"
          size="small"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 200,
        }}
      >
        <LeaveCalendar
          year={ym.year}
          month={ym.month}
          leaves={leaves}
          onNavigate={setYm}
        />
      </DialogContent>
    </Dialog>
  );
}
