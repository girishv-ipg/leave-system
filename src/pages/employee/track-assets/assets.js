// pages/employee/track-assets/index.js

import {
  Add,
  Build,
  CalendarMonth,
  Cancel,
  CheckCircle,
  CurrencyRupee,
  Delete,
  Edit,
  Home,
  Inventory2,
  LocationOn,
  Logout,
  Person,
  ReceiptLong,
  Search,
  Settings,
  Tag,
} from "@mui/icons-material";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Fade,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import React, { useEffect, useMemo, useState } from "react";

import axiosInstance from "@/utils/helpers";
import { useRouter } from "next/navigation";

// ----- Constants -------------------------------------------------------------
const ASSET_TYPES = [
  "Hardware",
  "Software",
  "Furniture",
  "Vehicle",
  "Real Estate",
  "Other",
];

const STATUS_TABS = [
  { value: "all", label: "All Assets", icon: <Inventory2 />, color: "primary" },
  { value: "Active", label: "Active", icon: <CheckCircle />, color: "success" },
  {
    value: "In Maintenance",
    label: "In Maintenance",
    icon: <Build />,
    color: "info",
  },
  { value: "Retired", label: "Retired", icon: <Settings />, color: "default" },
  { value: "Lost", label: "Lost", icon: <Cancel />, color: "warning" },
  { value: "Sold", label: "Sold", icon: <ReceiptLong />, color: "secondary" },
];

// ----- Helpers ---------------------------------------------------------------
const money = (n) =>
  `₹${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

const chipForStatus = (status) => {
  switch (status) {
    case "Active":
      return {
        label: "Active",
        sx: {
          background: "linear-gradient(135deg, #dcfce7 0%, #f0fdf4 100%)",
          color: "#1a7f37",
          border: "1px solid #1a7f3720",
          fontWeight: 600,
        },
      };
    case "In Maintenance":
      return {
        label: "In Maintenance",
        sx: {
          background: "linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%)",
          color: "#0ea5e9",
          border: "1px solid #0ea5e920",
          fontWeight: 600,
        },
      };
    case "Retired":
      return {
        label: "Retired",
        sx: {
          background: "linear-gradient(135deg, #f1f5f9 0%, #ffffff 100%)",
          color: "#64748b",
          border: "1px solid #cbd5e1",
          fontWeight: 600,
        },
      };
    case "Lost":
      return {
        label: "Lost",
        sx: {
          background: "linear-gradient(135deg, #fef3c7 0%, #fffbeb 100%)",
          color: "#bf8700",
          border: "1px solid #bf870020",
          fontWeight: 600,
        },
      };
    case "Sold":
      return {
        label: "Sold",
        sx: {
          background: "linear-gradient(135deg, #e9d5ff 0%, #faf5ff 100%)",
          color: "#7e22ce",
          border: "1px solid #7e22ce20",
          fontWeight: 600,
        },
      };
    default:
      return { label: status, sx: {} };
  }
};

const yyyyMmDd = (d) => (d ? new Date(d).toISOString().slice(0, 10) : "");

// ----- Component -------------------------------------------------------------
export default function TrackAssetsPage() {
  const router = useRouter();

  // session/user (optional header card like your expenses page)
  const [currentUser, setCurrentUser] = useState(null);

  // data
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  // UI state
  const [activeTab, setActiveTab] = useState("all");

  // filters
  const [q, setQ] = useState(""); // search (name / serial / tags)
  const [filterType, setFilterType] = useState(""); // asset type
  const [filterStatus, setFilterStatus] = useState(""); // status (optional alongside tabs)
  const [filterLocation, setFilterLocation] = useState("");
  const [filterYear, setFilterYear] = useState("");

  // dialog state (create/edit)
  const freshForm = {
    _id: null,
    name: "",
    type: "",
    description: "",
    serialNumber: "",
    purchaseDate: "",
    location: "",
    value: "",
    status: "Active",
    assignedTo: "",
    tags: "",
  };
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(freshForm);
  const [saving, setSaving] = useState(false);
  const isEdit = !!form._id;

  // effects
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    setCurrentUser(user);
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      setErr(null);
      const token = localStorage.getItem("token");
      if (!token) {
        setErr("Please login first");
        return;
      }
      const res = await axiosInstance.get("/api/assets", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAssets(res.data || []);
    } catch (e) {
      console.error(e);
      setErr("Failed to load assets. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const openNew = () => {
    setForm(freshForm);
    setFormOpen(true);
  };

  const openEdit = (row) => {
    setForm({
      _id: row._id,
      name: row.name || "",
      type: row.type || "",
      description: row.description || "",
      serialNumber: row.serialNumber || "",
      purchaseDate: yyyyMmDd(row.purchaseDate) || "",
      location: row.location || "",
      value: String(row.value ?? ""),
      status: row.status || "Active",
      assignedTo: row.assignedTo || "",
      tags: Array.isArray(row.tags) ? row.tags.join(", ") : row.tags || "",
    });
    setFormOpen(true);
  };

  const onSave = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem("token");
      const payload = {
        name: form.name,
        type: form.type,
        description: form.description,
        serialNumber: form.serialNumber || null,
        purchaseDate: form.purchaseDate || null,
        location: form.location,
        value: form.value ? Number(form.value) : 0,
        status: form.status,
        assignedTo: form.assignedTo || null,
        tags: form.tags
          ? form.tags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
          : [],
      };

      if (isEdit) {
        await axiosInstance.put(`/api/assets/${form._id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axiosInstance.post(`/api/assets`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      setFormOpen(false);
      setForm(freshForm);
      fetchAssets();
    } catch (e) {
      console.error(e);
      setErr("Failed to save asset. Please check details and retry.");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (row) => {
    if (!confirm(`Soft delete asset "${row.name}"?`)) return;
    try {
      const token = localStorage.getItem("token");
      await axiosInstance.delete(`/api/assets/${row._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchAssets();
    } catch (e) {
      console.error(e);
      setErr("Failed to delete asset.");
    }
  };

  // filter + tab logic
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return assets
      .filter((a) => {
        // tab filter
        if (activeTab !== "all" && a.status !== activeTab) return false;

        // status filter (optional alongside tabs)
        if (filterStatus && a.status !== filterStatus) return false;

        // type
        if (filterType && a.type !== filterType) return false;

        // location
        if (
          filterLocation &&
          !String(a.location || "")
            .toLowerCase()
            .includes(filterLocation.toLowerCase())
        )
          return false;

        // purchase year
        if (filterYear) {
          const d = a.purchaseDate ? new Date(a.purchaseDate) : null;
          if (!d || isNaN(d) || d.getFullYear() !== Number(filterYear))
            return false;
        }

        // search by name / serial / tags
        if (needle) {
          const inName = String(a.name || "")
            .toLowerCase()
            .includes(needle);
          const inSerial = String(a.serialNumber || "")
            .toLowerCase()
            .includes(needle);
          const inTags = (a.tags || [])
            .join(",")
            .toLowerCase()
            .includes(needle);
          if (!inName && !inSerial && !inTags) return false;
        }

        return true;
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [
    assets,
    activeTab,
    q,
    filterType,
    filterStatus,
    filterLocation,
    filterYear,
  ]);

  // quick stats
  const totals = useMemo(() => {
    const totalValue = assets.reduce(
      (acc, a) => acc + (Number(a.value) || 0),
      0
    );
    const byStatus = assets.reduce((acc, a) => {
      acc[a.status] = (acc[a.status] || 0) + 1;
      return acc;
    }, {});
    return { totalValue, count: assets.length, byStatus };
  }, [assets]);

  // UI guards
  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          backgroundColor: "#fafbfc",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <CircularProgress size={40} />
      </Box>
    );
  }

  if (err) {
    return (
      <Box sx={{ minHeight: "100vh", backgroundColor: "#fafbfc", p: 2 }}>
        <Alert severity="error" sx={{ maxWidth: 600, mx: "auto", mt: 4 }}>
          {err}
          <Button onClick={fetchAssets} sx={{ ml: 2 }}>
            Retry
          </Button>
        </Alert>
      </Box>
    );
  }

  // ----- RENDER --------------------------------------------------------------
  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#fafbfc" }}>
      {/* Sticky header (same vibe as expenses) */}
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 1000,
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.18)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
        }}
      >
        <Box sx={{ maxWidth: 1200, mx: "auto", px: 3, py: 2.5 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Avatar
                sx={{
                  width: 40,
                  height: 40,
                  mr: 3,
                  background: "linear-gradient(135deg, #3367e09c 0%)",
                }}
              >
                <Inventory2 />
              </Avatar>
              <Box>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    color: "text.primary",
                    lineHeight: 1.2,
                  }}
                >
                  Track Assets
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: "text.secondary", mt: 0.5 }}
                >
                  Manage company hardware, software, and more
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Tooltip title="Home" arrow>
                <IconButton
                  onClick={() => router.push("/main")}
                  sx={{
                    transition: "all 0.2s ease",
                    "&:hover": {
                      color: "primary.main",
                      transform: "translateY(-1px)",
                    },
                  }}
                >
                  <Home />
                </IconButton>
              </Tooltip>
              <Tooltip title="Logout" arrow>
                <IconButton
                  onClick={() => {
                    localStorage.removeItem("user");
                    localStorage.removeItem("token");
                    router.push("/login");
                  }}
                  sx={{
                    transition: "all 0.2s ease",
                    "&:hover": {
                      color: "error.main",
                      transform: "translateY(-1px)",
                    },
                  }}
                >
                  <Logout />
                </IconButton>
              </Tooltip>
              <Button
                variant="contained"
                startIcon={
                  <Add
                    sx={{
                      transition: "transform 0.3s ease",
                      ".MuiButton-root:hover &": {
                        transform: "rotate(180deg)",
                      },
                    }}
                  />
                }
                onClick={openNew}
                sx={{
                  borderRadius: "8px",
                  fontWeight: 600,
                  transition: "all 0.2s ease",
                  "&:hover": {
                    transform: "translateY(-1px)",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.16)",
                  },
                  background: "linear-gradient(135deg, #3367e09c 0%)",
                }}
              >
                New Asset
              </Button>

              {currentUser && (
                <Avatar
                  sx={{
                    width: 36,
                    height: 36,
                    ml: 2,
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    boxShadow: "rgba(0, 0, 0, 0.15) 0px 2px 4px 0px inset",
                  }}
                >
                  {currentUser.name
                    ? currentUser.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                    : "U"}
                </Avatar>
              )}
            </Box>
          </Box>
        </Box>
      </Box>

      <Box sx={{ maxWidth: 1200, mx: "auto", px: 2, pb: 3 }}>
        {/* Summary Cards */}
        <Grid container spacing={2} sx={{ mt: 2, mb: 3 }}>
          {[
            {
              label: "Total Assets",
              value: totals.count,
              icon: Inventory2,
              color: "#0969da",
              bg: "linear-gradient(135deg, #dbeafe 0%, #f0f9ff 100%)",
            },
            {
              label: "Total Value",
              value: money(totals.totalValue),
              icon: CurrencyRupee,
              color: "#1a7f37",
              bg: "linear-gradient(135deg, #dcfce7 0%, #f0fdf4 100%)",
            },
            {
              label: "Active",
              value: totals.byStatus["Active"] || 0,
              icon: CheckCircle,
              color: "#0ea5e9",
              bg: "linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%)",
            },
            {
              label: "In Maintenance",
              value: totals.byStatus["In Maintenance"] || 0,
              icon: Build,
              color: "#bf8700",
              bg: "linear-gradient(135deg, #fef3c7 0%, #fffbeb 100%)",
            },
            {
              label: "Retired/Lost/Sold",
              value:
                (totals.byStatus["Retired"] || 0) +
                (totals.byStatus["Lost"] || 0) +
                (totals.byStatus["Sold"] || 0),
              icon: Settings,
              color: "#64748b",
              bg: "linear-gradient(135deg, #f1f5f9 0%, #ffffff 100%)",
            },
          ].map((stat, i) => (
            <Grid item xs={6} sm={2.4} key={i}>
              <Fade in timeout={300 + i * 100}>
                <Card
                  elevation={1}
                  sx={{
                    borderRadius: "8px",
                    background: stat.bg,
                    border: `1px solid ${stat.color}20`,
                    transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
                    cursor: "pointer",
                    "&:hover": {
                      transform: "translateY(-4px) scale(1.02)",
                      boxShadow: `0 20px 40px ${stat.color}20`,
                      borderColor: `${stat.color}40`,
                    },
                  }}
                >
                  <CardContent sx={{ p: 2.5, textAlign: "center" }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        mb: 1.5,
                      }}
                    >
                      <stat.icon
                        sx={{
                          fontSize: 20,
                          color: stat.color,
                          mr: 1,
                          transition: "transform 0.2s ease",
                          ".MuiCard-root:hover &": { transform: "scale(1.1)" },
                        }}
                      />
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: stat.color,
                          fontSize: "0.75rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        {stat.label}
                      </Typography>
                    </Box>
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 700,
                        color: stat.color,
                        fontSize: "1.5rem",
                        lineHeight: 1,
                        fontFamily: '"SF Mono","Monaco", monospace',
                      }}
                    >
                      {typeof stat.value === "number" ? stat.value : stat.value}
                    </Typography>
                  </CardContent>
                </Card>
              </Fade>
            </Grid>
          ))}
        </Grid>

        {/* Tabs + Filters row */}
        <Card
          elevation={0}
          sx={{
            borderRadius: "12px",
            overflow: "hidden",
            backgroundColor: "white",
            border: "1px solid #e1e4e8",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            mb: 3,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "stretch",
              gap: 2,
              borderBottom: "1px solid #e1e4e8",
              px: 2,
              flexWrap: "nowrap",
            }}
          >
            <Tabs
              value={activeTab}
              onChange={(e, v) => setActiveTab(v)}
              sx={{
                flex: 1,
                minWidth: 0,
                "& .MuiTab-root": {
                  minHeight: 60,
                  fontWeight: 600,
                  textTransform: "none",
                  fontSize: "0.875rem",
                  transition: "all 0.2s ease",
                  "&:hover": { transform: "translateY(-1px)" },
                },
                "& .Mui-selected": { color: "#0969da" },
                "& .MuiTabs-indicator": {
                  backgroundColor: "#0969da",
                  height: 3,
                  borderRadius: "3px 3px 0 0",
                },
              }}
              variant="scrollable"
              scrollButtons="auto"
            >
              {STATUS_TABS.map((t) => (
                <Tab
                  key={t.value}
                  label={t.label}
                  value={t.value}
                  icon={t.icon}
                  iconPosition="start"
                />
              ))}
            </Tabs>

            {/* Right-aligned Filters */}
            <Box
              sx={{
                ml: "auto",
                display: "flex",
                alignItems: "center",
                borderLeft: "1px solid #e1e4e8",
                pl: 2,
                py: 1,
                gap: 1,
              }}
            >
              <TextField
                size="small"
                placeholder="Search name, serial, tags"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search fontSize="small" />
                    </InputAdornment>
                  ),
                }}
                sx={{ width: 240 }}
              />

              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel>Type</InputLabel>
                <Select
                  value={filterType}
                  label="Type"
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <MenuItem value="">Any</MenuItem>
                  {ASSET_TYPES.map((t) => (
                    <MenuItem key={t} value={t}>
                      {t}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filterStatus}
                  label="Status"
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <MenuItem value="">Any</MenuItem>
                  {["Active", "In Maintenance", "Retired", "Lost", "Sold"].map(
                    (s) => (
                      <MenuItem key={s} value={s}>
                        {s}
                      </MenuItem>
                    )
                  )}
                </Select>
              </FormControl>

              <TextField
                size="small"
                label="Location"
                value={filterLocation}
                onChange={(e) => setFilterLocation(e.target.value)}
                sx={{ width: 160 }}
              />

              <TextField
                size="small"
                label="Purchase Year"
                type="number"
                inputProps={{ min: 1900, max: 3000, step: 1 }}
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                sx={{ width: 150 }}
              />
            </Box>
          </Box>
        </Card>

        {/* Table */}
        {filtered.length === 0 ? (
          <Fade in timeout={500}>
            <Card
              elevation={1}
              sx={{
                borderRadius: "12px",
                border: "1px solid #e1e4e8",
                textAlign: "center",
                py: 8,
                backgroundColor: "white",
              }}
            >
              <CardContent>
                <Inventory2
                  sx={{ fontSize: 64, color: "text.secondary", mb: 3 }}
                />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No assets found
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 4 }}
                >
                  Try adjusting filters or create a new asset.
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={openNew}
                  sx={{
                    borderRadius: "8px",
                    fontWeight: 600,
                    transition: "all 0.2s ease",
                    background: "linear-gradient(135deg, #3367e09c 0%)",
                    "&:hover": { transform: "translateY(-1px)" },
                  }}
                >
                  Add Asset
                </Button>
              </CardContent>
            </Card>
          </Fade>
        ) : (
          <Card
            elevation={0}
            sx={{
              borderRadius: "12px",
              backgroundColor: "white",
              border: "1px solid #e1e4e8",
            }}
          >
            <TableContainer component={Paper} elevation={0}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "grey.50" }}>
                    {[
                      "Name",
                      "Type",
                      "Serial",
                      "Location",
                      "Purchase",
                      "Value",
                      "Status",
                      "Assigned To",
                      "Tags",
                      "Actions",
                    ].map((h) => (
                      <TableCell key={h} sx={{ fontWeight: 600 }}>
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.map((row) => {
                    const st = chipForStatus(row.status);
                    return (
                      <TableRow hover key={row._id}>
                        <TableCell>
                          <Stack
                            direction="row"
                            alignItems="center"
                            spacing={1}
                          >
                            <Avatar
                              sx={{
                                width: 28,
                                height: 28,
                                bgcolor: "primary.main",
                                fontSize: 14,
                                fontWeight: 600,
                              }}
                            >
                              {String(row.name || "?")
                                .slice(0, 1)
                                .toUpperCase()}
                            </Avatar>
                            <Typography variant="body2" fontWeight={600}>
                              {row.name}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>{row.type}</TableCell>
                        <TableCell>
                          <Stack
                            direction="row"
                            spacing={0.5}
                            alignItems="center"
                          >
                            <Tag fontSize="small" sx={{ opacity: 0.7 }} />
                            <Typography variant="body2">
                              {row.serialNumber || "-"}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Stack
                            direction="row"
                            spacing={0.5}
                            alignItems="center"
                          >
                            <LocationOn
                              fontSize="small"
                              sx={{ opacity: 0.7 }}
                            />
                            <Typography variant="body2">
                              {row.location || "-"}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Stack
                            direction="row"
                            spacing={0.5}
                            alignItems="center"
                          >
                            <CalendarMonth
                              fontSize="small"
                              sx={{ opacity: 0.7 }}
                            />
                            <Typography variant="body2">
                              {row.purchaseDate
                                ? new Date(
                                    row.purchaseDate
                                  ).toLocaleDateString()
                                : "-"}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            fontWeight={600}
                            sx={{ fontFamily: '"SF Mono","Monaco", monospace' }}
                          >
                            {money(row.value)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={st.label}
                            sx={{ borderRadius: "20px", ...st.sx }}
                          />
                        </TableCell>
                        <TableCell>
                          <Stack
                            direction="row"
                            spacing={0.5}
                            alignItems="center"
                          >
                            <Person fontSize="small" sx={{ opacity: 0.7 }} />
                            <Typography variant="body2">
                              {row.assignedTo
                                ? String(row.assignedTo).slice(0, 6) + "…"
                                : "-"}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell sx={{ maxWidth: 200 }}>
                          <Tooltip title={(row.tags || []).join(", ")}>
                            <Typography variant="body2" noWrap>
                              {Array.isArray(row.tags) && row.tags.length
                                ? row.tags.join(", ")
                                : "-"}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={0.5}>
                            <Tooltip title="Edit">
                              <IconButton
                                size="small"
                                onClick={() => openEdit(row)}
                                sx={{
                                  color: "warning.main",
                                  transition: "all 0.2s ease",
                                  "&:hover": {
                                    transform: "scale(1.1) rotate(15deg)",
                                    color: "warning.dark",
                                  },
                                }}
                              >
                                <Edit fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete (soft)">
                              <IconButton
                                size="small"
                                onClick={() => onDelete(row)}
                                sx={{
                                  color: "error.main",
                                  transition: "all 0.2s ease",
                                  "&:hover": {
                                    transform: "scale(1.1)",
                                    color: "error.dark",
                                  },
                                }}
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        )}
      </Box>

      {/* Create/Edit Dialog */}
      <Dialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        maxWidth="md"
        fullWidth
        TransitionComponent={Fade}
        PaperProps={{ sx: { borderRadius: "12px" } }}
      >
        <DialogTitle sx={{ borderBottom: "1px solid #e1e4e8", pb: 2 }}>
          <Stack direction="row" spacing={1.25} alignItems="center">
            <Avatar
              sx={{
                bgcolor: "primary.main",
                boxShadow: "0 4px 12px rgba(0,0,0,0.16)",
              }}
            >
              {isEdit ? <Edit /> : <Add />}
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={600}>
                {isEdit ? "Edit Asset" : "New Asset"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {isEdit
                  ? "Update asset details and save changes"
                  : "Fill in the details to create a new asset"}
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ pt: "20px !important" }}>
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Name"
                fullWidth
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  label="Type"
                  value={form.type}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, type: e.target.value }))
                  }
                >
                  {ASSET_TYPES.map((t) => (
                    <MenuItem key={t} value={t}>
                      {t}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Description"
                fullWidth
                multiline
                rows={3}
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Serial Number"
                fullWidth
                value={form.serialNumber}
                onChange={(e) =>
                  setForm((f) => ({ ...f, serialNumber: e.target.value }))
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Purchase Date"
                type="date"
                fullWidth
                value={form.purchaseDate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, purchaseDate: e.target.value }))
                }
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                label="Location"
                fullWidth
                value={form.location}
                onChange={(e) =>
                  setForm((f) => ({ ...f, location: e.target.value }))
                }
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Value (₹)"
                type="number"
                fullWidth
                value={form.value}
                onChange={(e) =>
                  setForm((f) => ({ ...f, value: e.target.value }))
                }
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  label="Status"
                  value={form.status}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, status: e.target.value }))
                  }
                >
                  {["Active", "In Maintenance", "Retired", "Lost", "Sold"].map(
                    (s) => (
                      <MenuItem key={s} value={s}>
                        {s}
                      </MenuItem>
                    )
                  )}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Assigned To (User ID)"
                fullWidth
                value={form.assignedTo}
                onChange={(e) =>
                  setForm((f) => ({ ...f, assignedTo: e.target.value }))
                }
                helperText="Optional: user name"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Tags (comma separated)"
                fullWidth
                value={form.tags}
                onChange={(e) =>
                  setForm((f) => ({ ...f, tags: e.target.value }))
                }
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button
            onClick={() => setFormOpen(false)}
            disabled={saving}
            sx={{
              borderRadius: "8px",
              "&:hover": { transform: "translateY(-1px)" },
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={onSave}
            disabled={saving || !form.name || !form.type}
            startIcon={
              saving ? (
                <CircularProgress size={16} />
              ) : isEdit ? (
                <Edit />
              ) : (
                <Add />
              )
            }
            sx={{
              borderRadius: "8px",
              transition: "all 0.2s ease",
              "&:hover": {
                transform: "translateY(-1px)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              },
              background: "linear-gradient(135deg, #3367e09c 0%)",
            }}
          >
            {saving ? "Saving..." : isEdit ? "Save Changes" : "Create Asset"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
