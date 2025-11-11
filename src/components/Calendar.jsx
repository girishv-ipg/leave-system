import { Box, IconButton, Typography } from "@mui/material";
import React, { useMemo } from "react";

import ChevronLeft from "@mui/icons-material/ChevronLeft";
import ChevronRight from "@mui/icons-material/ChevronRight";
import { holidays } from "@/utils/helpers";

export default function LeaveCalendar({
  year,
  month,
  leaves = [],
  onNavigate,
  onDateClick,
}) {
  const { days, leadingBlanks, label, isLeave } = useCalendarData({
    year,
    month,
    leaves,
  });

  const go = (delta) => {
    if (!onNavigate) return;
    const d = new Date(year, month - 1 + delta, 1);
    onNavigate({ year: d.getFullYear(), month: d.getMonth() + 1 });
  };

  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: 520,
        p: 2,
        borderRadius: 3,
        boxShadow: 2,
        bgcolor: "background.paper",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 2,
        }}
      >
        <IconButton onClick={() => go(-1)} size="small" disabled={!onNavigate}>
          <ChevronLeft />
        </IconButton>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {label}
        </Typography>
        <IconButton onClick={() => go(1)} size="small" disabled={!onNavigate}>
          <ChevronRight />
        </IconButton>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 1,
          mb: 1,
        }}
      >
        {weekdays.map((w) => (
          <Typography
            key={w}
            variant="caption"
            sx={{
              textAlign: "center",
              color: "text.secondary",
              fontWeight: 700,
            }}
          >
            {w}
          </Typography>
        ))}
      </Box>

      <Box
        sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 1 }}
      >
        {Array.from({ length: leadingBlanks }).map((_, i) => (
          <Box key={`b-${i}`} sx={{ aspectRatio: "1 / 1" }} />
        ))}

        {days.map((d) => {
          const dateObj = new Date(year, month - 1, d);
          const leave = isLeave(dateObj);
          const isToday = isSameDay(dateObj, new Date());
          return (
            <Box
              key={d}
              onClick={() => onDateClick?.(dateObj)}
              sx={{
                aspectRatio: "1 / 1",
                borderRadius: 2,
                p: 0.5,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: onDateClick ? "pointer" : "default",
                outline: isToday
                  ? (theme) => `2px solid ${theme.palette.primary.main}`
                  : "none",
                bgcolor: leave ? "error.light" : "background.default",
                color: leave ? "common.white" : "text.primary",
              }}
            >
              <Typography component="span" sx={{ fontWeight: 600 }}>
                {d}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

function useCalendarData({ year, month, leaves }) {
  return useMemo(() => {
    const first = new Date(year, month - 1, 1);
    const firstDow = first.getDay();
    const daysInMonth = new Date(year, month, 0).getDate();
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const leaveSet = buildLeaveSet(leaves);
    const label = first.toLocaleDateString(undefined, {
      month: "long",
      year: "numeric",
    });
    const isLeave = (d) => leaveSet.has(toKey(d));
    return { days, leadingBlanks: firstDow, isLeave, label };
  }, [year, month, leaves]);
}

function toKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(d.getDate()).padStart(2, "0")}`;
}

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isWeekend(date) {
  const day = date.getDay(); // 0=Sun, 6=Sat
  return day === 0 || day === 6;
}

function isHoliday(date) {
  return holidaySet.has(toKey(date));
}

// Build a Set using the same YYYY-MM-DD key format as `toKey`
const holidaySet = new Set(holidays.map((h) => toKey(new Date(h))));

function buildLeaveSet(leaves) {
  const set = new Set();

  for (const item of leaves) {
    if (typeof item === "string" || item instanceof Date) {
      const d = new Date(item);
      if (!isWeekend(d) && !isHoliday(d)) set.add(toKey(d));
    } else if (item && item.startDate && item.endDate) {
      const start = new Date(item.startDate);
      const end = new Date(item.endDate);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        if (!isWeekend(d) && !isHoliday(d)) set.add(toKey(d));
      }
    }
  }

  return set;
}
