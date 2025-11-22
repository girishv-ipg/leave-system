// pages/employee/track-assets/index.js

import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Collapse,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Build,
  CalendarMonth,
  Cancel,
  CheckCircle,
  ContentCopy,
  Home,
  HourglassEmpty,
  Info,
  Inventory2,
  KeyboardArrowDown,
  LocationOn,
  Logout,
  Numbers,
  ReceiptLong,
  Search,
} from "@mui/icons-material";
import {
  CatalogIcon,
  brandAvatarEl,
  deviceIconEl,
  getBrandItem,
  getDeviceTypeItem,
  isUrl,
  looksEmoji,
  normalizeCatalog,
} from "../../../utils/catalogUtils";
import React, { useEffect, useMemo, useState } from "react";

import AssetDetailsDrawer from "@/components/AssetDetailsDrawer";
import axiosInstance from "@/utils/helpers";
import { useRouter } from "next/navigation";

/* ======================= Layout knobs ======================= */
const ROW_HEIGHT = 10;
const HEADER_HEIGHT = 44;
const SUBTABLE_ROW_HEIGHT = 40;

/* ======================= Constants ======================= */
const STATUS_TABS = [
  { value: "all", label: "My Assets", icon: <Inventory2 /> },
  { value: "Active", label: "Active", icon: <CheckCircle /> },
  { value: "In Maintenance", label: "In Maintenance", icon: <Build /> },
  { value: "Retired", label: "Retired", icon: <ReceiptLong /> },
  { value: "Lost", label: "Lost", icon: <Cancel /> },
  { value: "Sold", label: "Sold", icon: <ReceiptLong /> },

  // employee approval state (derived from assetStatus/deviceStatus)
  { value: "Pending", label: "My Pending Approvals", icon: <HourglassEmpty /> },
  { value: "Rejected", label: "My Rejected", icon: <Cancel /> },
];

const STATUS_OPTIONS = ["Active", "In Maintenance", "Retired", "Lost", "Sold"];

/** % widths (sum to 100) */
const COLUMNS = [
  { id: "asset", label: "Asset", width: 22 },
  { id: "type", label: "Type", width: 10 },
  { id: "serials", label: "Device Serials", width: 14 },
  { id: "location", label: "Location", width: 12 },
  { id: "purchase", label: "Purchase", width: 12 },
  { id: "value", label: "Value", width: 10 },
  { id: "status", label: "Status", width: 10 },
  { id: "tags", label: "Tags", width: 10 },
  { id: "actions", label: "Actions", width: 10 },
];

/* ======================= Helpers ======================= */
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
      return { label: status || "-", sx: {} };
  }
};

const formatShortDate = (d) => {
  if (!d) return "-";
  try {
    const dt = new Date(d);
    if (isNaN(+dt)) return "-";
    return dt.toLocaleDateString();
  } catch {
    return "-";
  }
};

// normalize status string (e.g., "Pending" -> "pending")
const normalizeStatus = (s, fallback = "pending") =>
  String(s || fallback)
    .trim()
    .toLowerCase();

// Stable id for expand/collapse state (prevents desync)
const rowIdOf = (row, fallback) =>
  String(
    row?._id ??
      row?.id ??
      row?.assetId ??
      `${row?.name ?? "row"}-${row?.createdAt ?? fallback}`
  );

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text || "");
    return true;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text || "";
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
      document.body.removeChild(ta);
      return true;
    } catch {
      document.body.removeChild(ta);
      return false;
    }
  }
}

// approval status from asset
function getAssetApprovalStatus(asset) {
  return asset?.assetStatus || "Pending";
}

// approval status from device serial
function getDeviceApprovalStatus(serial) {
  return serial?.deviceStatus || "Pending";
}

/* ======================= Small UI bits ======================= */
function StatTile({ label, value }) {
  const palette = {
    "Total Assets": {
      color: "#0969da",
      bg: "linear-gradient(135deg,#dbeafe 0%,#f0f9ff 100%)",
    },
    "Total Value": {
      color: "#1a7f37",
      bg: "linear-gradient(135deg,#dcfce7 0%,#f0fdf4 100%)",
    },
    Active: {
      color: "#0ea5e9",
      bg: "linear-gradient(135deg,#e0f2fe 0%,#f0f9ff 100%)",
    },
    "In Maintenance": {
      color: "#bf8700",
      bg: "linear-gradient(135deg,#fef3c7 0%,#fffbeb 100%)",
    },
    "Retired/Lost/Sold": {
      color: "#64748b",
      bg: "linear-gradient(135deg,#f1f5f9 0%,#ffffff 100%)",
    },
  }[label] || {
    color: "#111827",
    bg: "linear-gradient(135deg,#f3f4f6 0%,#ffffff 100%)",
  };

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: "12px",
        background: palette.bg,
        border: `1px solid ${palette.color}20`,
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        transition: "all .25s ease",
        "&:hover": {
          boxShadow: `0 6px 12px ${palette.color}30`,
          borderColor: `${palette.color}50`,
        },
      }}
    >
      <CardContent sx={{ p: 2 }}>
        <Typography
          variant="caption"
          sx={{
            display: "block",
            fontWeight: 600,
            color: palette.color,
            mb: 0.25,
          }}
        >
          {label}
        </Typography>
        <Typography
          variant="h6"
          noWrap
          sx={{
            fontWeight: 800,
            color: palette.color,
            fontSize: "1.35rem",
            lineHeight: 1.2,
            fontFamily: '"SF Mono","Monaco", monospace',
          }}
          title={String(value)}
        >
          {value ?? "—"}
        </Typography>
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <Card
      elevation={1}
      sx={{
        borderRadius: "12px",
        border: "1px solid #e1e4e8",
        textAlign: "center",
        py: 8,
        backgroundColor: "white",
        mb: 3,
      }}
    >
      <CardContent>
        <Inventory2 sx={{ fontSize: 64, color: "text.secondary", mb: 3 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No assets found
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Try adjusting filters.
        </Typography>
      </CardContent>
    </Card>
  );
}

/* ======================= Collapsible Serials Subtable ======================= */
function CollapsibleSerialsRow({
  row,
  serials,
  isOpen,
  COLUMNS,
  ROW_HEIGHT,
  SUBTABLE_ROW_HEIGHT,
  deviceTypes,
  brands,
  setSnack,
  onDeviceDecision,
  deviceDecisionLoadingKey,
}) {
  if (!isOpen) return null;

  const startIndex = Math.max(
    0,
    COLUMNS.findIndex((c) => c.id === "asset")
  );
  const spacerColspan = Math.max(0, startIndex);
  const contentColspan = Math.max(1, COLUMNS.length - spacerColspan);

  // use assetStatus as single source of truth
  const assetApprovalStatus = getAssetApprovalStatus(row);
  const assetApprovalStatusNorm = normalizeStatus(
    assetApprovalStatus,
    "pending"
  );

  return (
    <TableRow sx={{ height: ROW_HEIGHT }}>
      {spacerColspan > 0 && (
        <TableCell colSpan={spacerColspan} sx={{ p: 0, border: 0 }} />
      )}

      <TableCell colSpan={contentColspan} sx={{ p: 0, border: 0 }}>
        <Box
          sx={{
            my: 1,
            border: "1px solid #e5e7eb",
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <Box
            sx={{
              px: 2,
              py: 1,
              display: "flex",
              alignItems: "center",
              gap: 1,
              background:
                "linear-gradient(90deg, rgba(2,132,199,.08), rgba(2,132,199,.02))",
              borderBottom: "1px solid #e5e7eb",
            }}
          >
            <Info sx={{ fontSize: 18, color: "primary.main" }} />
            <Typography variant="subtitle2" fontWeight={800}>
              Device details ({serials.length})
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
              Device Type, Brand, Serial, Notes, Added On &amp; Your Decision
            </Typography>
          </Box>

          {serials.length === 0 ? (
            <Box sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary">
                No serials for this asset.
              </Typography>
            </Box>
          ) : (
            <Box sx={{ width: "100%", overflowX: "auto" }}>
              <Table
                size="small"
                sx={{
                  minWidth: 900,
                  borderCollapse: "separate",
                  borderSpacing: 0,
                  "& td, & th": {
                    py: "10px",
                    lineHeight: 1.35,
                    whiteSpace: "nowrap",
                  },
                  "& .MuiTableRow-root": { height: SUBTABLE_ROW_HEIGHT },
                  "& thead th": {
                    fontWeight: 700,
                    backgroundColor: "#f8fafc",
                    borderBottom: "1px solid #e5e7eb",
                    fontSize: ".86rem",
                  },
                  "& tbody tr:nth-of-type(odd)": {
                    backgroundColor: "#fbfdff",
                  },
                }}
              >
                <TableHead>
                  <TableRow>
                    <TableCell>Device Type</TableCell>
                    <TableCell>Brand</TableCell>
                    <TableCell>Serial</TableCell>
                    <TableCell>Notes</TableCell>
                    <TableCell>Added On</TableCell>
                    <TableCell align="right">Your Decision</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {serials.map((s, idx) => {
                    const dt = getDeviceTypeItem(s, deviceTypes);
                    const br = getBrandItem(s, brands);
                    const addedOn =
                      s.createdAt || row.createdAt || row.updatedAt;

                    const deviceStatus = getDeviceApprovalStatus(s);
                    const deviceStatusNorm = normalizeStatus(
                      deviceStatus,
                      "pending"
                    );

                    const canDecideDevice =
                      deviceStatusNorm === "pending" &&
                      assetApprovalStatusNorm === "pending";

                    const chipColor =
                      deviceStatusNorm === "accepted"
                        ? "success"
                        : deviceStatusNorm === "rejected"
                        ? "error"
                        : "default";

                    const keyAccepted = `${row._id}:${s.serial}:Accepted`;
                    const keyRejected = `${row._id}:${s.serial}:Rejected`;

                    const tooltipDisabled =
                      assetApprovalStatusNorm !== "pending"
                        ? `Asset already ${assetApprovalStatus}. Waiting for admin.`
                        : deviceStatusNorm !== "pending"
                        ? `You already marked this device as ${deviceStatus}.`
                        : "";

                    return (
                      <TableRow key={`${rowIdOf(row, idx)}-sn-${idx}`}>
                        {/* Device Type */}
                        <TableCell>
                          <Stack
                            direction="row"
                            spacing={0.6}
                            alignItems="center"
                          >
                            {isUrl(dt.icon) || looksEmoji(dt.icon) ? (
                              <CatalogIcon
                                item={dt}
                                fallbackColor="#2563eb"
                                size={18}
                              />
                            ) : (
                              <Box
                                sx={{ display: "flex", alignItems: "center" }}
                              >
                                {deviceIconEl(dt.name)}
                              </Box>
                            )}
                            <Typography variant="body2" noWrap title={dt.name}>
                              {dt.name || "-"}
                            </Typography>
                          </Stack>
                        </TableCell>

                        {/* Brand */}
                        <TableCell>
                          <Stack
                            direction="row"
                            spacing={0.6}
                            alignItems="center"
                          >
                            {isUrl(br.icon) || looksEmoji(br.icon) ? (
                              <CatalogIcon
                                item={br}
                                fallbackColor="#16a34a"
                                size={18}
                              />
                            ) : (
                              <Box
                                sx={{ display: "flex", alignItems: "center" }}
                              >
                                {brandAvatarEl(br.name)}
                              </Box>
                            )}
                            <Typography variant="body2" noWrap title={br.name}>
                              {br.name || "-"}
                            </Typography>
                          </Stack>
                        </TableCell>

                        {/* Serial */}
                        <TableCell>
                          <Chip
                            size="small"
                            variant="outlined"
                            icon={<Numbers sx={{ fontSize: 16 }} />}
                            label={
                              <Typography
                                variant="body2"
                                sx={{
                                  fontFamily: '"SF Mono","Monaco", monospace',
                                }}
                              >
                                {s.serial || "-"}
                              </Typography>
                            }
                            sx={{
                              borderStyle: "dashed",
                              borderColor: "#94a3b8",
                            }}
                          />
                        </TableCell>

                        {/* Notes */}
                        <TableCell>
                          <Typography
                            variant="body2"
                            color={s.notes ? "text.primary" : "text.secondary"}
                            noWrap
                            title={s.notes || "—"}
                          >
                            {s.notes || "—"}
                          </Typography>
                        </TableCell>

                        {/* Added On */}
                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            noWrap
                          >
                            {formatShortDate(addedOn)}
                          </Typography>
                        </TableCell>

                        {/* Your Decision + Actions */}
                        <TableCell align="right">
                          <Stack
                            direction="row"
                            spacing={0.5}
                            justifyContent="flex-end"
                            alignItems="center"
                          >
                            <Chip
                              size="small"
                              label={deviceStatus}
                              color={
                                chipColor === "default" ? "default" : chipColor
                              }
                              variant={
                                chipColor === "default" ? "outlined" : "filled"
                              }
                              sx={{ borderRadius: "20px", fontSize: 11 }}
                            />

                            <Tooltip title="Copy serial">
                              <IconButton
                                size="small"
                                onClick={async () => {
                                  if (await copyToClipboard(s.serial || "")) {
                                    setSnack({
                                      open: true,
                                      msg: "Serial copied",
                                    });
                                  }
                                }}
                              >
                                <ContentCopy fontSize="inherit" />
                              </IconButton>
                            </Tooltip>

                            {onDeviceDecision && (
                              <>
                                <Tooltip
                                  title={
                                    canDecideDevice
                                      ? "Accept this device"
                                      : tooltipDisabled || "Action disabled"
                                  }
                                >
                                  <span>
                                    <IconButton
                                      size="small"
                                      disabled={
                                        !canDecideDevice ||
                                        deviceDecisionLoadingKey === keyAccepted
                                      }
                                      onClick={() =>
                                        onDeviceDecision(
                                          row._id,
                                          s.serial,
                                          "Accepted",
                                          deviceStatus
                                        )
                                      }
                                      sx={{
                                        color: canDecideDevice
                                          ? "success.main"
                                          : "action.disabled",
                                        p: 0.5,
                                      }}
                                    >
                                      {deviceDecisionLoadingKey ===
                                      keyAccepted ? (
                                        <CircularProgress size={16} />
                                      ) : (
                                        <CheckCircle fontSize="inherit" />
                                      )}
                                    </IconButton>
                                  </span>
                                </Tooltip>

                                <Tooltip
                                  title={
                                    canDecideDevice
                                      ? "Reject this device"
                                      : tooltipDisabled || "Action disabled"
                                  }
                                >
                                  <span>
                                    <IconButton
                                      size="small"
                                      disabled={
                                        !canDecideDevice ||
                                        deviceDecisionLoadingKey === keyRejected
                                      }
                                      onClick={() =>
                                        onDeviceDecision(
                                          row._id,
                                          s.serial,
                                          "Rejected",
                                          deviceStatus
                                        )
                                      }
                                      sx={{
                                        color: canDecideDevice
                                          ? "error.main"
                                          : "action.disabled",
                                        p: 0.5,
                                      }}
                                    >
                                      {deviceDecisionLoadingKey ===
                                      keyRejected ? (
                                        <CircularProgress size={16} />
                                      ) : (
                                        <Cancel fontSize="inherit" />
                                      )}
                                    </IconButton>
                                  </span>
                                </Tooltip>
                              </>
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Box>
          )}
        </Box>
      </TableCell>
    </TableRow>
  );
}

/* ======================= PAGE ======================= */
export default function EmployeeTrackAssetsPage() {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState(null);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const [deviceTypes, setDeviceTypes] = useState([]);
  const [brands, setBrands] = useState([]);

  const [snack, setSnack] = useState({ open: false, msg: "" });

  const [activeTab, setActiveTab] = useState("all");
  const [q, setQ] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [filterYear, setFilterYear] = useState("");

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [expanded, setExpanded] = useState(() => new Set());

  const [assetDecisionLoadingId, setAssetDecisionLoadingId] = useState(null);
  const [deviceDecisionLoadingKey, setDeviceDecisionLoadingKey] =
    useState(null);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsAsset, setDetailsAsset] = useState(null);
  const openDetails = (row) => {
    setDetailsAsset(row);
    setDetailsOpen(true);
  };

  const fetchCatalog = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
      const [dtRes, brRes] = await Promise.allSettled([
        axiosInstance.get("/api/devices", headers ? { headers } : undefined),
        axiosInstance.get("/api/brands", headers ? { headers } : undefined),
      ]);
      if (dtRes.status === "fulfilled") {
        const rows = dtRes.value?.data?.data ?? dtRes.value?.data ?? [];
        setDeviceTypes(normalizeCatalog(rows));
      } else setDeviceTypes([]);
      if (brRes.status === "fulfilled") {
        const rows = brRes.value?.data?.data ?? brRes.value?.data ?? [];
        setBrands(normalizeCatalog(rows));
      } else setBrands([]);
    } catch (e) {
      setDeviceTypes([]);
      setBrands([]);
      console.error("Catalog fetch failed", e);
    }
  };

  // 🔄 Only show full-screen loader when explicitly requested
  const fetchAssets = async ({ showFullScreenLoader = false } = {}) => {
    try {
      if (showFullScreenLoader) {
        setLoading(true);
      }
      setErr(null);

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Please login first");
      }

      const user = JSON.parse(localStorage.getItem("user") || "{}");

      const res = await axiosInstance.get("/api/assets", {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          employeeCode: user.employeeCode,
          role: user.role,
        },
      });

      setAssets(res.data || []);
      setExpanded(new Set());
      setPage(0);
    } catch (e) {
      console.error(e);
      setErr(e.message || "Failed to load assets. Please try again.");
    } finally {
      if (showFullScreenLoader) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    setCurrentUser(user);
    fetchAssets({ showFullScreenLoader: true });
    fetchCatalog();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setPage(0);
  }, [activeTab, q, filterStatus, filterLocation, filterYear]);

  const toggleExpand = (row) => {
    const id = rowIdOf(row, 0);
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const buildUserPayload = () => {
    if (!currentUser) return null;
    return {
      _id: currentUser._id || currentUser.id || currentUser.userId,
      id: currentUser._id || currentUser.id || currentUser.userId,
      role: currentUser.role,
      name: currentUser.name,
      email: currentUser.email,
      employeeCode: currentUser.employeeCode,
    };
  };

  /* ---------- Employee asset-level Accept / Reject ---------- */
  const handleEmployeeAssetDecision = async (
    assetId,
    decision,
    currentAssetStatus
  ) => {
    const statusNorm = normalizeStatus(currentAssetStatus, "pending");
    if (statusNorm !== "pending") {
      setSnack({
        open: true,
        msg: `You have already marked this asset as ${currentAssetStatus}.`,
      });
      return;
    }

    try {
      const userPayload = buildUserPayload();
      if (!userPayload) {
        setSnack({
          open: true,
          msg: "User information missing. Please login again.",
        });
        return;
      }

      const token = localStorage.getItem("token");
      const key = `${assetId}:${decision}`;
      setAssetDecisionLoadingId(key);

      // Employee asset decision (backend will update deviceStatus for Pending devices and recompute assetStatus)
      const res = await axiosInstance.patch(
        `/api/assets/${assetId}/employee-status`,
        {
          decision,
          user: userPayload,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updatedAsset = res.data?.asset;

      if (updatedAsset) {
        setAssets((prev) =>
          prev.map((a) => (a._id === updatedAsset._id ? updatedAsset : a))
        );
      } else {
        // Fallback: update locally if backend didn't send asset
        setAssets((prev) =>
          prev.map((a) => {
            if (a._id !== assetId) return a;

            const serials = Array.isArray(a.serialNumbers)
              ? a.serialNumbers
              : [];

            const updatedSerials =
              decision === "Accepted"
                ? serials.map((sn) => {
                    const st = getDeviceApprovalStatus(sn);
                    if (normalizeStatus(st, "pending") !== "pending") {
                      return sn;
                    }
                    return {
                      ...sn,
                      deviceStatus: "Accepted",
                    };
                  })
                : serials;

            return {
              ...a,
              assetStatus: decision,
              serialNumbers: updatedSerials,
            };
          })
        );
      }

      setSnack({
        open: true,
        msg: `You have ${
          decision === "Accepted" ? "accepted" : "rejected"
        } this asset.`,
      });
    } catch (e) {
      console.error("handleEmployeeAssetDecision error", e);
      const serverMsg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        "";

      setSnack({
        open: true,
        msg:
          serverMsg && typeof serverMsg === "string"
            ? serverMsg
            : "Failed to submit your decision for this asset.",
      });
    } finally {
      setAssetDecisionLoadingId(null);
    }
  };

  /* ---------- Employee device-level Accept / Reject ---------- */
  const handleEmployeeDeviceDecision = async (
    assetId,
    serialId,
    decision,
    currentDeviceStatus
  ) => {
    const statusNorm = normalizeStatus(currentDeviceStatus, "pending");
    if (statusNorm !== "pending") {
      setSnack({
        open: true,
        msg: `You have already marked this device as ${currentDeviceStatus}.`,
      });
      return;
    }

    try {
      const userPayload = buildUserPayload();
      if (!userPayload) {
        setSnack({
          open: true,
          msg: "User information missing. Please login again.",
        });
        return;
      }

      const token = localStorage.getItem("token");
      const key = `${assetId}:${serialId}:${decision}`;
      setDeviceDecisionLoadingKey(key);

      // Employee decision on this device (backend recomputes assetStatus)
      const res = await axiosInstance.patch(
        `/api/assets/${assetId}/serials/${encodeURIComponent(
          serialId
        )}/employee-status`,
        {
          decision,
          user: userPayload,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updatedAssetFromApi = res.data?.asset;

      if (updatedAssetFromApi) {
        setAssets((prev) =>
          prev.map((a) =>
            a._id === updatedAssetFromApi._id ? updatedAssetFromApi : a
          )
        );
      } else {
        // Fallback: local update if backend didn't return asset
        setAssets((prev) =>
          prev.map((a) => {
            if (a._id !== assetId) return a;

            const serials = Array.isArray(a.serialNumbers)
              ? a.serialNumbers
              : [];

            const updatedSerials = serials.map((sn) => {
              if (sn.serial !== serialId) return sn;
              return {
                ...sn,
                deviceStatus: decision,
              };
            });

            return {
              ...a,
              serialNumbers: updatedSerials,
            };
          })
        );
      }

      setSnack({
        open: true,
        msg:
          decision === "Accepted"
            ? "You have accepted this device."
            : "You have rejected this device.",
      });
    } catch (e) {
      console.error("handleEmployeeDeviceDecision error", e);

      const serverMsg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        "";

      setSnack({
        open: true,
        msg:
          serverMsg && typeof serverMsg === "string"
            ? serverMsg
            : "Failed to submit your decision for this device.",
      });
    } finally {
      setDeviceDecisionLoadingKey(null);
    }
  };

  // filtering (including employee-level Pending / Rejected tabs)
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();

    return assets
      .filter((a) => {
        const serials = Array.isArray(a.serialNumbers) ? a.serialNumbers : [];

        const assetApprovalStatus = getAssetApprovalStatus(a);
        const assetApprovalStatusNorm = normalizeStatus(
          assetApprovalStatus,
          "pending"
        );

        const deviceStatuses = serials.map((s) => getDeviceApprovalStatus(s));
        const hasPendingDevice = deviceStatuses.some(
          (st) => normalizeStatus(st) === "pending"
        );
        const hasRejectedDevice = deviceStatuses.some(
          (st) => normalizeStatus(st) === "rejected"
        );

        if (activeTab === "Pending") {
          if (!(assetApprovalStatusNorm === "pending" || hasPendingDevice)) {
            return false;
          }
        } else if (activeTab === "Rejected") {
          if (!(assetApprovalStatusNorm === "rejected" || hasRejectedDevice)) {
            return false;
          }
        } else if (activeTab !== "all" && a.status !== activeTab) {
          // lifecycle tab
          return false;
        }

        if (filterStatus && a.status !== filterStatus) return false;

        if (
          filterLocation &&
          !String(a.location || "")
            .toLowerCase()
            .includes(filterLocation.toLowerCase())
        )
          return false;

        if (filterYear) {
          const d = a.purchaseDate ? new Date(a.purchaseDate) : null;
          if (!d || isNaN(d) || d.getFullYear() !== Number(filterYear))
            return false;
        }

        if (needle) {
          const inName = String(a.name || "")
            .toLowerCase()
            .includes(needle);
          const inSerial =
            Array.isArray(a.serialNumbers) &&
            a.serialNumbers.some((s) =>
              String(s.serial || "")
                .toLowerCase()
                .includes(needle)
            );
          const inTags = (a.tags || [])
            .join(",")
            .toLowerCase()
            .includes(needle);
          if (!inName && !inSerial && !inTags) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [assets, activeTab, q, filterStatus, filterLocation, filterYear]);

  const start = page * rowsPerPage;
  const end = start + rowsPerPage;
  const pageItems = filtered.slice(start, end);

  const totals = useMemo(() => {
    const totalValue = assets.reduce(
      (acc, a) => acc + (Number(a.value) || 0),
      0
    );
    const active = assets.filter((a) => a.status === "Active").length;
    const maintenance = assets.filter(
      (a) => a.status === "In Maintenance"
    ).length;
    const retiredLostSold = assets.filter((a) =>
      ["Retired", "Lost", "Sold"].includes(a.status)
    ).length;
    return {
      totalValue,
      count: assets.length,
      active,
      maintenance,
      retiredLostSold,
    };
  }, [assets]);

  const handleChangePage = (_e, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (e) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

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
        <Alert
          severity="error"
          sx={{ maxWidth: 600, mx: "auto", mt: 4 }}
          action={
            <Button
              onClick={() => fetchAssets({ showFullScreenLoader: true })}
              color="inherit"
              size="small"
            >
              Retry
            </Button>
          }
        >
          {err}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#fafbfc" }}>
      {/* Sticky header */}
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
        <Box sx={{ px: { xs: 2, md: 3, lg: 4 }, py: 2.5 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Avatar
                sx={{ width: 40, height: 40, mr: 3, bgcolor: "primary.main" }}
              >
                <Inventory2 />
              </Avatar>
              <Box>
                <Typography
                  variant="h5"
                  sx={{ fontWeight: 700, lineHeight: 1.2 }}
                >
                  My Assets
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: "text.secondary", mt: 0.5 }}
                >
                  View and acknowledge the assets assigned to you
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
              {currentUser && (
                <Avatar
                  sx={{
                    width: 36,
                    height: 36,
                    ml: 2,
                    fontSize: "0.875rem",
                    fontWeight: 600,
                  }}
                >
                  {currentUser.name
                    ? currentUser.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                    : "A"}
                </Avatar>
              )}
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Main content */}
      <Box sx={{ px: { xs: 2, md: 3, lg: 4 }, pb: 3 }}>
        {/* Summary tiles */}
        <Grid container spacing={2} sx={{ mt: 2, mb: 2 }}>
          {[
            { label: "Total Assets", value: totals.count },
            { label: "Total Value", value: money(totals.totalValue) },
            { label: "Active", value: totals.active },
            { label: "In Maintenance", value: totals.maintenance },
            { label: "Retired/Lost/Sold", value: totals.retiredLostSold },
          ].map((stat, i) => (
            <Grid item xs={6} sm={4} md={2.4} key={i}>
              <StatTile label={stat.label} value={stat.value} />
            </Grid>
          ))}
        </Grid>

        {/* Tabs + Filters */}
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
                  minHeight: 48,
                  fontWeight: 600,
                  textTransform: "none",
                  fontSize: "0.875rem",
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

            {/* Filters */}
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

              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filterStatus}
                  label="Status"
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <MenuItem value="">Any</MenuItem>
                  {STATUS_OPTIONS.map((s) => (
                    <MenuItem key={s} value={s}>
                      {s}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                size="small"
                label="Location"
                value={filterLocation}
                onChange={(e) => setFilterLocation(e.target.value)}
                sx={{ width: 150 }}
              />

              <TextField
                size="small"
                label="Year"
                type="number"
                inputProps={{ min: 1900, max: 3000, step: 1 }}
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                sx={{ width: 120 }}
              />
            </Box>
          </Box>
        </Card>

        {/* Assets Table */}
        <Card
          elevation={0}
          sx={{
            borderRadius: "12px",
            backgroundColor: "white",
            border: "1px solid #e1e4e8",
            mb: 3,
            display: "flex",
            flexDirection: "column",
            minHeight: 300,
          }}
        >
          <TableContainer
            component={Paper}
            elevation={0}
            sx={{ flex: 1, overflowX: "auto", pb: 0.5 }}
          >
            <Table
              size="small"
              sx={{
                tableLayout: "fixed",
                width: "100%",
                borderCollapse: "collapse",
                "& .MuiTableRow-root": { height: ROW_HEIGHT },
                "& .MuiChip-sizeSmall": {
                  height: 20,
                  "& .MuiChip-label": { px: 0.7, fontSize: 12 },
                },
                "& .MuiAvatar-root": { width: 24, height: 24, fontSize: 12 },
              }}
            >
              <colgroup>
                {COLUMNS.map((c) => (
                  <col key={c.id} style={{ width: `${c.width}%` }} />
                ))}
              </colgroup>

              <TableHead>
                <TableRow sx={{ bgcolor: "grey.50", height: HEADER_HEIGHT }}>
                  {COLUMNS.map((c) => (
                    <TableCell
                      key={c.id}
                      sx={{
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {c.label ? (
                        <Tooltip title={c.label}>
                          <span>{c.label}</span>
                        </Tooltip>
                      ) : null}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>

              <TableBody>
                {pageItems.length === 0 ? (
                  <TableRow sx={{ height: ROW_HEIGHT }}>
                    <TableCell
                      colSpan={COLUMNS.length}
                      sx={{ p: 0, border: 0 }}
                    >
                      <Box sx={{ py: 4 }}>
                        <EmptyState />
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {pageItems.map((row, idx) => {
                      const rowId = rowIdOf(row, idx);
                      const isOpen = expanded.has(rowId);
                      const serials = Array.isArray(row.serialNumbers)
                        ? row.serialNumbers
                        : [];
                      const st = chipForStatus(row.status);

                      const assetApprovalStatus = getAssetApprovalStatus(row);
                      const assetApprovalStatusNorm = normalizeStatus(
                        assetApprovalStatus,
                        "pending"
                      );
                      const canDecideAsset =
                        assetApprovalStatusNorm === "pending";

                      const assetKeyAccepted = `${row._id}:Accepted`;
                      const assetKeyRejected = `${row._id}:Rejected`;

                      return (
                        <React.Fragment key={rowId}>
                          <TableRow hover sx={{ height: ROW_HEIGHT }}>
                            {/* asset (click to open drawer) */}
                            <TableCell>
                              <Stack
                                direction="row"
                                alignItems="center"
                                spacing={0.5}
                              >
                                <Tooltip title="View details">
                                  <Avatar
                                    onClick={() => openDetails(row)}
                                    sx={{
                                      width: 24,
                                      height: 24,
                                      bgcolor: "primary.main",
                                      fontSize: 12,
                                      fontWeight: 600,
                                      cursor: "pointer",
                                    }}
                                  >
                                    {String(row.name || "?")
                                      .slice(0, 1)
                                      .toUpperCase()}
                                  </Avatar>
                                </Tooltip>

                                <Box sx={{ minWidth: 0 }}>
                                  <Tooltip title="View details" arrow>
                                    <Typography
                                      variant="body2"
                                      fontWeight={600}
                                      sx={{
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                        display: "block",
                                        cursor: "pointer",
                                        "&:hover": {
                                          textDecoration: "underline",
                                          color: "primary.main",
                                        },
                                      }}
                                      onClick={() => openDetails(row)}
                                      title={row.name || "-"}
                                    >
                                      {row.name || "-"}
                                    </Typography>
                                  </Tooltip>

                                  <Tooltip title={String(row._id || "")} arrow>
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                      sx={{ display: "block" }}
                                    >
                                      #{(row._id || "").toString().slice(-6)}
                                    </Typography>
                                  </Tooltip>
                                </Box>
                              </Stack>
                            </TableCell>

                            {/* type */}
                            <TableCell>{row.type || "-"}</TableCell>

                            {/* serials */}
                            <TableCell>
                              <Stack
                                direction="row"
                                alignItems="center"
                                spacing={0.5}
                              >
                                <IconButton
                                  size="small"
                                  onClick={() => toggleExpand(row)}
                                  sx={{
                                    border: "1px solid #e5e7eb",
                                    p: 0.5,
                                    transition: "transform .18s ease",
                                    transform: isOpen
                                      ? "rotate(180deg)"
                                      : "none",
                                  }}
                                  aria-expanded={isOpen}
                                  aria-controls={`serials-${rowId}`}
                                >
                                  <KeyboardArrowDown fontSize="small" />
                                </IconButton>
                                <Chip
                                  size="small"
                                  label={`${serials.length} Device${
                                    serials.length === 1 ? "" : "s"
                                  }`}
                                />
                              </Stack>
                            </TableCell>

                            {/* location */}
                            <TableCell>
                              <Stack
                                direction="row"
                                spacing={0.4}
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

                            {/* purchase */}
                            <TableCell>
                              <Stack
                                direction="row"
                                spacing={0.4}
                                alignItems="center"
                              >
                                <CalendarMonth
                                  fontSize="small"
                                  sx={{ opacity: 0.7 }}
                                />
                                <Typography variant="body2">
                                  {formatShortDate(row.purchaseDate)}
                                </Typography>
                              </Stack>
                            </TableCell>

                            {/* value */}
                            <TableCell>
                              <Typography
                                variant="body2"
                                fontWeight={600}
                                sx={{
                                  fontFamily: '"SF Mono","Monaco", monospace',
                                }}
                              >
                                {money(row.value)}
                              </Typography>
                            </TableCell>

                            {/* lifecycle status */}
                            <TableCell>
                              <Chip
                                size="small"
                                label={st.label}
                                sx={{ borderRadius: "20px", ...st.sx }}
                              />
                            </TableCell>

                            {/* tags */}
                            <TableCell
                              sx={{
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              <Tooltip
                                title={(row.tags || []).join(", ")}
                                placement="top"
                              >
                                <Typography variant="body2" noWrap>
                                  {Array.isArray(row.tags) && row.tags.length
                                    ? row.tags.join(", ")
                                    : "-"}
                                </Typography>
                              </Tooltip>
                            </TableCell>

                            {/* actions: your asset decision */}
                            <TableCell align="right">
                              <Stack
                                direction="row"
                                spacing={0.5}
                                justifyContent="flex-end"
                                alignItems="center"
                              >
                                <Chip
                                  size="small"
                                  label={`Status: ${assetApprovalStatus}`}
                                  color={
                                    assetApprovalStatusNorm === "accepted"
                                      ? "success"
                                      : assetApprovalStatusNorm === "rejected"
                                      ? "error"
                                      : "default"
                                  }
                                  variant={
                                    assetApprovalStatusNorm === "pending"
                                      ? "outlined"
                                      : "filled"
                                  }
                                  sx={{ borderRadius: "20px", fontSize: 11 }}
                                />

                                <Tooltip
                                  title={
                                    canDecideAsset
                                      ? "Accept this asset"
                                      : "You already responded. Admin must request again if changes are needed."
                                  }
                                >
                                  <span>
                                    <IconButton
                                      size="small"
                                      disabled={
                                        !canDecideAsset ||
                                        assetDecisionLoadingId ===
                                          assetKeyAccepted
                                      }
                                      onClick={() =>
                                        handleEmployeeAssetDecision(
                                          row._id,
                                          "Accepted",
                                          assetApprovalStatus
                                        )
                                      }
                                      sx={{
                                        color: canDecideAsset
                                          ? "success.main"
                                          : "action.disabled",
                                        p: 0.5,
                                      }}
                                    >
                                      {assetDecisionLoadingId ===
                                      assetKeyAccepted ? (
                                        <CircularProgress size={16} />
                                      ) : (
                                        <CheckCircle fontSize="inherit" />
                                      )}
                                    </IconButton>
                                  </span>
                                </Tooltip>

                                <Tooltip
                                  title={
                                    canDecideAsset
                                      ? "Reject this asset"
                                      : "You already responded. Admin must request again if changes are needed."
                                  }
                                >
                                  <span>
                                    <IconButton
                                      size="small"
                                      disabled={
                                        !canDecideAsset ||
                                        assetDecisionLoadingId ===
                                          assetKeyRejected
                                      }
                                      onClick={() =>
                                        handleEmployeeAssetDecision(
                                          row._id,
                                          "Rejected",
                                          assetApprovalStatus
                                        )
                                      }
                                      sx={{
                                        color: canDecideAsset
                                          ? "error.main"
                                          : "action.disabled",
                                        p: 0.5,
                                      }}
                                    >
                                      {assetDecisionLoadingId ===
                                      assetKeyRejected ? (
                                        <CircularProgress size={16} />
                                      ) : (
                                        <Cancel fontSize="inherit" />
                                      )}
                                    </IconButton>
                                  </span>
                                </Tooltip>
                              </Stack>
                            </TableCell>
                          </TableRow>

                          <CollapsibleSerialsRow
                            row={row}
                            serials={serials}
                            isOpen={isOpen}
                            COLUMNS={COLUMNS}
                            ROW_HEIGHT={ROW_HEIGHT}
                            SUBTABLE_ROW_HEIGHT={SUBTABLE_ROW_HEIGHT}
                            deviceTypes={deviceTypes}
                            brands={brands}
                            setSnack={setSnack}
                            onDeviceDecision={handleEmployeeDeviceDecision}
                            deviceDecisionLoadingKey={deviceDecisionLoadingKey}
                          />
                        </React.Fragment>
                      );
                    })}
                  </>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={filtered.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[10, 25, 50, 100]}
            sx={{ borderTop: "1px solid #e5e7eb", mt: "auto" }}
          />
        </Card>
      </Box>

      {/* 🔎 Details Drawer (read-only for employee) */}
      <AssetDetailsDrawer
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        baseAsset={detailsAsset}
        deviceTypes={deviceTypes}
        brands={brands}
      />

      <Snackbar
        open={snack.open}
        autoHideDuration={2200}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        message={snack.msg}
      />
    </Box>
  );
}
