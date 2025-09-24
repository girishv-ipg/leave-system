// src/components/ExpenseFiltersMenu.jsx

import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from "@mui/material";

import React from "react";

const MONTHS = [
  { label: "January", value: 1 },
  { label: "February", value: 2 },
  { label: "March", value: 3 },
  { label: "April", value: 4 },
  { label: "May", value: 5 },
  { label: "June", value: 6 },
  { label: "July", value: 7 },
  { label: "August", value: 8 },
  { label: "September", value: 9 },
  { label: "October", value: 10 },
  { label: "November", value: 11 },
  { label: "December", value: 12 },
];

export default function ExpenseFiltersMenu({
  filterType,
  setFilterType,
  filters,
  setFilters,
  compact = false,
}) {
  const selectWidth = compact ? 160 : 200;
  const inputWidth = compact ? 220 : 260;

  const set = (k, v) => setFilters((f) => ({ ...f, [k]: v }));

  const clearAll = () => {
    setFilters({ name: "", year: "", month: "", date: "" });
    setFilterType("name");
  };

  return (
    <Box sx={{ px: compact ? 1 : 2, py: compact ? 0.5 : 1.25 }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        gap={1.25}
        alignItems={{ xs: "stretch", sm: "center" }}
        justifyContent="space-between"
        flexWrap="wrap"
      >
        <Stack direction="row" gap={1.25} flexWrap="wrap" alignItems="center">
          {/* Filter by (dropdown) */}
          <FormControl size="small" sx={{ width: selectWidth }}>
            <InputLabel id="filter-type-label">Filter by</InputLabel>
            <Select
              labelId="filter-type-label"
              label="Filter by"
              value={filterType}
              onChange={(e) => {
                const next = e.target.value;
                setFilterType(next);
                // clear unused fields so only the chosen one is active
                setFilters((f) => ({
                  name: next === "name" ? f.name : "",
                  year: next === "year" ? f.year : "",
                  month: next === "month" ? f.month : "",
                  date: next === "date" ? f.date : "",
                }));
              }}
            >
              <MenuItem value="name">Employee Name</MenuItem>
              <MenuItem value="year">Year</MenuItem>
              <MenuItem value="month">Month</MenuItem>
              <MenuItem value="date">Date</MenuItem>
            </Select>
          </FormControl>

          {/* Fixed-width container for the matching input */}
          <Box sx={{ width: inputWidth }}>
            {filterType === "name" && (
              <TextField
                fullWidth
                label="Employee Name"
                placeholder="Search by name"
                value={filters.name}
                onChange={(e) => set("name", e.target.value)}
                size="small"
              />
            )}

            {filterType === "year" && (
              <TextField
                fullWidth
                label="Year"
                type="number"
                inputProps={{ min: 1900, max: 3000, step: 1 }}
                value={filters.year}
                onChange={(e) => set("year", e.target.value)}
                size="small"
              />
            )}

            {filterType === "month" && (
              <FormControl size="small" sx={{ width: "100%" }}>
                <InputLabel id="month-label">Month</InputLabel>
                <Select
                  labelId="month-label"
                  label="Month"
                  value={filters.month}
                  onChange={(e) => set("month", e.target.value)}
                >
                  <MenuItem value="">Any</MenuItem>
                  {MONTHS.map((m) => (
                    <MenuItem key={m.value} value={m.value}>
                      {m.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {filterType === "date" && (
              <TextField
                fullWidth
                label="Date"
                type="date"
                value={filters.date}
                onChange={(e) => set("date", e.target.value)}
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            )}
          </Box>
        </Stack>

        <Stack direction="row" gap={1} justifyContent="flex-end">
          <Button
            variant="outlined"
            onClick={clearAll}
            sx={{ borderRadius: "8px", textTransform: "none" }}
          >
            Clear
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
