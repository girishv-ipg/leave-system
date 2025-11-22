// pages/admin/track-assets/AssetDetailsDrawer.jsx

import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Drawer,
  Grid,
  IconButton,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  CalendarMonth,
  Cancel,
  CheckCircle,
  ContentCopy,
  CurrencyRupee,
  Delete,
  DoNotDisturb,
  Edit,
  Info,
  Inventory2,
  LocationOn,
  Numbers,
  Person,
  Tag,
} from "@mui/icons-material";
import {
  CatalogIcon,
  brandAvatarEl,
  deviceIconEl,
  getBrandItem,
  getDeviceTypeItem,
  isUrl,
  looksEmoji,
} from "../utils/catalogUtils";
import { chipForStatus, money } from "./commonAssets.js";

import React from "react";
import axiosInstance from "@/utils/helpers";

/** ----------------------------------------------------------------
 * Small UI helper
 * ---------------------------------------------------------------- */
function RowLine({ icon, label, value, mono }) {
  return (
    <Stack direction="row" spacing={1.25} alignItems="center">
      <Avatar
        sx={{
          width: 28,
          height: 28,
          bgcolor: "grey.100",
          color: "grey.700",
          border: "1px solid #e6e8eb",
        }}
        variant="rounded"
      >
        {icon}
      </Avatar>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 600,
            ...(mono ? { fontFamily: '"SF Mono","Monaco", monospace' } : null),
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={String(value || "-")}
        >
          {value || "-"}
        </Typography>
      </Box>
    </Stack>
  );
}

/** Resolve a deviceType row into a uniform { _id?, name, icon } object */
function resolveDeviceType(s, deviceTypes = []) {
  const viaUtil = getDeviceTypeItem(s, deviceTypes);
  if (viaUtil?.name)
    return { name: viaUtil.name, icon: viaUtil.icon, _id: viaUtil._id };

  const raw = s?.deviceType;
  if (!raw) return { name: "Unknown", icon: "" };

  if (typeof raw === "object") {
    return {
      _id: raw._id,
      name: raw.name || "Unknown",
      icon: raw.icon || "",
    };
  }

  const idMatch = deviceTypes.find((d) => String(d._id) === String(raw));
  if (idMatch)
    return { _id: idMatch._id, name: idMatch.name, icon: idMatch.icon || "" };

  const nameMatch = deviceTypes.find(
    (d) => String(d.name || "").toLowerCase() === String(raw).toLowerCase()
  );
  if (nameMatch)
    return {
      _id: nameMatch._id,
      name: nameMatch.name,
      icon: nameMatch.icon || "",
    };

  return { name: String(raw) || "Unknown", icon: "" };
}

/** Resolve a brand row into a uniform { _id?, name, icon } object */
function resolveBrand(s, brands = []) {
  const viaUtil = getBrandItem(s, brands);
  if (viaUtil?.name)
    return { name: viaUtil.name, icon: viaUtil.icon, _id: viaUtil._id };

  const raw = s?.brand;
  if (!raw) return { name: "Generic", icon: "" };

  if (typeof raw === "object") {
    return {
      _id: raw._id,
      name: raw.name || "Generic",
      icon: raw.icon || "",
    };
  }

  const idMatch = brands.find((b) => String(b._id) === String(raw));
  if (idMatch)
    return { _id: idMatch._id, name: idMatch.name, icon: idMatch.icon || "" };

  const nameMatch = brands.find(
    (b) => String(b.name || "").toLowerCase() === String(raw).toLowerCase()
  );
  if (nameMatch)
    return {
      _id: nameMatch._id,
      name: nameMatch.name,
      icon: nameMatch.icon || "",
    };

  return { name: String(raw) || "Generic", icon: "" };
}

function formatShortDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** ----------------------------------------------------------------
 * Component
 * ---------------------------------------------------------------- */
export default function AssetDetailsDrawer({
  open,
  onClose,
  baseAsset,
  onEdit,
  onDelete,
  deviceTypes = [],
  brands = [],
  onStatusChange, // optional: notify parent when status changes
}) {
  const [loading, setLoading] = React.useState(false);
  const [asset, setAsset] = React.useState(baseAsset || null);
  const [error, setError] = React.useState("");
  const [isEmployee, setIsEmployee] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [submittingDeviceId, setSubmittingDeviceId] = React.useState(null);
  const [snack, setSnack] = React.useState({ open: false, msg: "" });

  React.useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const role = String(user?.role || "").toLowerCase();
      setIsEmployee(role === "employee");
    } catch {
      setIsEmployee(false);
    }
  }, []);

  React.useEffect(() => {
    let active = true;
    const fetchOne = async () => {
      if (!open || !baseAsset?._id) return;
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token");
        const res = await axiosInstance.get(`/api/assets/${baseAsset._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!active) return;
        setAsset(res.data || baseAsset);
      } catch (e) {
        if (!active) return;
        setAsset(baseAsset || null);
        setError("Failed to fetch the latest details.");
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchOne();
    return () => {
      active = false;
    };
  }, [open, baseAsset?._id]);

  const effective = asset || baseAsset || {};
  const headerChip = chipForStatus(effective?.status || "");
  const serials = Array.isArray(effective?.serialNumbers)
    ? effective.serialNumbers
    : [];

  // Non-employee admin-ish actions preserved
  const showEdit = !isEmployee && Boolean(onEdit);
  const showDelete = !isEmployee && Boolean(onDelete);
  const showAnyAdminActions = showEdit || showDelete;

  // Employee header actions are visible only when asset is Pending
  const canEmployeeActOnAsset =
    isEmployee && String(effective?.status || "").toLowerCase() === "pending";

  const updateStatus = async (nextStatus) => {
    if (!effective?._id) return;
    try {
      setSubmitting(true);
      const token = localStorage.getItem("token");
      const res = await axiosInstance.put(
        `/api/assets/${effective._id}`,
        { status: nextStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const updated = res?.data || { ...effective, status: nextStatus };
      setAsset(updated);
      onStatusChange?.(updated);
      setSnack({ open: true, msg: `Asset ${nextStatus.toLowerCase()}` });
    } catch (e) {
      setSnack({ open: true, msg: "Failed to update asset status" });
    } finally {
      setSubmitting(false);
    }
  };

  const updateDeviceStatus = async (serial, nextStatus) => {
    if (!effective?._id || !serial?._id) return;
    try {
      setSubmittingDeviceId(serial._id);
      const token = localStorage.getItem("token");
      const res = await axiosInstance.put(
        `/api/assets/${effective._id}/serials/${serial._id}`,
        { status: nextStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Update local state (avoid refetch)
      const payload = res?.data;
      let next = effective;
      if (payload?.serialNumbers) {
        next = payload;
      } else {
        next = {
          ...effective,
          serialNumbers: serials.map((s) =>
            String(s._id) === String(serial._id)
              ? { ...s, status: nextStatus }
              : s
          ),
        };
      }
      setAsset(next);
      onStatusChange?.(next);
      setSnack({ open: true, msg: `Device ${nextStatus.toLowerCase()}` });
    } catch (e) {
      setSnack({ open: true, msg: "Failed to update device" });
    } finally {
      setSubmittingDeviceId(null);
    }
  };

  const anyPendingDevice =
    isEmployee &&
    serials.some((s) => String(s?.status || "").toLowerCase() === "pending");

  // show device actions for employees if any device is pending (regardless of asset pending)
  const showDeviceActions = isEmployee && anyPendingDevice;

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text || "");
      setSnack({ open: true, msg: "Serial copied" });
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = text || "";
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        setSnack({ open: true, msg: "Serial copied" });
      } catch {
        setSnack({ open: true, msg: "Copy failed" });
      }
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: "100%", sm: 560, md: 680 },
          borderLeft: "1px solid #e6e8eb",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(250,251,252,0.98))",
        },
      }}
    >
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: "1px solid #e6e8eb" }}>
        <Stack direction="row" spacing={1.25} alignItems="center">
          <Avatar
            sx={{
              width: 40,
              height: 40,
              bgcolor: "primary.main",
              fontWeight: 700,
            }}
          >
            {String(effective?.name || "?")
              .slice(0, 1)
              .toUpperCase()}
          </Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              variant="h6"
              fontWeight={800}
              sx={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
              title={effective?.name}
            >
              {effective?.name || "-"}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="caption" color="text.secondary">
                #{String(effective?._id || "").slice(-6)}
              </Typography>
              <Chip
                size="small"
                label={headerChip.label}
                sx={{ borderRadius: "20px", ...headerChip.sx }}
              />
            </Stack>
          </Box>

          {/* Actions */}
          <Stack direction="row" spacing={1} alignItems="center">
            {/* Employee Accept/Reject (asset-level) when asset is Pending */}
            {canEmployeeActOnAsset && (
              <>
                <Tooltip title="Accept asset">
                  <span>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<CheckCircle />}
                      disabled={submitting}
                      onClick={() => updateStatus("Active")}
                      sx={{ borderRadius: "8px", minWidth: 0 }}
                    >
                      Accept
                    </Button>
                  </span>
                </Tooltip>
                <Tooltip title="Reject asset">
                  <span>
                    <Button
                      size="small"
                      color="error"
                      variant="outlined"
                      startIcon={<DoNotDisturb />}
                      disabled={submitting}
                      onClick={() => updateStatus("Rejected")}
                      sx={{ borderRadius: "8px", minWidth: 0 }}
                    >
                      Reject
                    </Button>
                  </span>
                </Tooltip>
              </>
            )}

            {/* Admin actions (unchanged) */}
            {showAnyAdminActions && (
              <>
                {showEdit && (
                  <IconButton
                    onClick={() => onEdit(effective)}
                    sx={{ color: "warning.main" }}
                  >
                    <Edit />
                  </IconButton>
                )}
                {showDelete && (
                  <IconButton
                    onClick={() => onDelete(effective)}
                    sx={{ color: "error.main" }}
                  >
                    <Delete />
                  </IconButton>
                )}
              </>
            )}

            <IconButton onClick={onClose}>
              <Cancel />
            </IconButton>
          </Stack>
        </Stack>
      </Box>

      {/* Body */}
      <Box sx={{ p: 2.25 }}>
        {loading ? (
          <Typography variant="body2" color="text.secondary">
            Loading…
          </Typography>
        ) : (
          <>
            {error && (
              <Alert severity="warning" sx={{ mb: 1.5 }}>
                {error}
              </Alert>
            )}

            {/* Overview */}
            <Card
              elevation={0}
              sx={{
                borderRadius: "12px",
                border: "1px solid #e6e8eb",
                mb: 2,
                background: "white",
              }}
            >
              <CardContent sx={{ p: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <RowLine
                      icon={<Inventory2 />}
                      label="Asset Name"
                      value={effective?.name}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <RowLine
                      icon={<Tag />}
                      label="Type"
                      value={effective?.type}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">
                      Description
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      {effective?.description || "—"}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Purchase & Assignment */}
            <Card
              elevation={0}
              sx={{
                borderRadius: "12px",
                border: "1px solid #e6e8eb",
                mb: 2,
                background: "white",
              }}
            >
              <Box
                sx={{
                  px: 2,
                  py: 1.25,
                  borderBottom: "1px solid #edf0f3",
                  background:
                    "linear-gradient(90deg, rgba(2,122,72,0.06), rgba(2,122,72,0.02))",
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <Avatar
                    sx={{ width: 24, height: 24, bgcolor: "success.main" }}
                  >
                    <CheckCircle fontSize="small" />
                  </Avatar>
                  <Typography variant="subtitle2" fontWeight={800}>
                    Purchase & Assignment
                  </Typography>
                </Stack>
              </Box>
              <CardContent sx={{ p: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <RowLine
                      icon={<CalendarMonth />}
                      label="Purchase Date"
                      value={formatShortDate(effective?.purchaseDate)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <RowLine
                      icon={<LocationOn />}
                      label="Location"
                      value={effective?.location}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <RowLine
                      icon={<CurrencyRupee />}
                      label="Value"
                      value={money(effective?.value)}
                      mono
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <RowLine
                      icon={<Person />}
                      label="Assigned To"
                      value={effective?.name}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Device Details */}
            <Card
              elevation={0}
              sx={{
                borderRadius: "12px",
                border: "1px solid #e6e8eb",
                mb: 2,
                background: "white",
                overflow: "hidden",
              }}
            >
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
              </Box>

              <Box sx={{ overflowX: "auto" }}>
                <Table
                  size="small"
                  sx={{
                    width: "100%",
                    minWidth: showDeviceActions ? 820 : 680,
                    borderCollapse: "separate",
                    borderSpacing: 0,
                    "& td, & th": { py: "10px", lineHeight: 1.35 },
                    "& thead th": {
                      fontWeight: 700,
                      backgroundColor: "#f8fafc",
                      borderBottom: "1px solid #e5e7eb",
                      fontSize: ".86rem",
                      whiteSpace: "nowrap",
                    },
                    "& tbody tr:nth-of-type(odd)": {
                      backgroundColor: "#fbfdff",
                    },
                  }}
                >
                  <colgroup>
                    <col style={{ width: "20%" }} />
                    <col style={{ width: "20%" }} />
                    <col style={{ width: "25%" }} />
                    <col style={{ width: "20%" }} />
                    <col style={{ width: showDeviceActions ? "10%" : "15%" }} />
                    {showDeviceActions && <col style={{ width: "15%" }} />}
                  </colgroup>

                  <TableHead>
                    <TableRow>
                      <TableCell>Device Type</TableCell>
                      <TableCell>Brand</TableCell>
                      <TableCell>Serial</TableCell>
                      <TableCell>Notes</TableCell>
                      <TableCell>Added On</TableCell>
                      {showDeviceActions && (
                        <TableCell align="right">Actions</TableCell>
                      )}
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {serials.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={showDeviceActions ? 6 : 5}>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ p: 2 }}
                          >
                            No device information linked.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      serials.map((s, idx) => {
                        const dt = resolveDeviceType(s, deviceTypes);
                        const br = resolveBrand(s, brands);
                        const addedRaw =
                          s.createdAt || effective?.createdAt || null;
                        const addedOn = formatShortDate(addedRaw);

                        const isPendingDevice =
                          isEmployee &&
                          String(s?.status || "").toLowerCase() === "pending";

                        return (
                          <TableRow key={`${effective?._id}-sn-${idx}`} hover>
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
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                    }}
                                  >
                                    {deviceIconEl(dt.name)}
                                  </Box>
                                )}
                                <Typography
                                  variant="body2"
                                  noWrap
                                  title={dt.name}
                                >
                                  {dt.name || "-"}
                                </Typography>
                              </Stack>
                            </TableCell>

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
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                    }}
                                  >
                                    {brandAvatarEl(br.name)}
                                  </Box>
                                )}
                                <Typography
                                  variant="body2"
                                  noWrap
                                  title={br.name}
                                >
                                  {br.name || "-"}
                                </Typography>
                              </Stack>
                            </TableCell>

                            <TableCell>
                              <Stack
                                direction="row"
                                spacing={0.75}
                                alignItems="center"
                              >
                                <Numbers
                                  fontSize="small"
                                  sx={{ opacity: 0.7 }}
                                />
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontFamily: '"SF Mono","Monaco", monospace',
                                    background: "#f8fafc",
                                    border: "1px dashed #e2e8f0",
                                    px: 1,
                                    py: 0.25,
                                    borderRadius: 1,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                    maxWidth: 160,
                                  }}
                                  title={s.serial || "-"}
                                >
                                  {s.serial || "-"}
                                </Typography>
                              </Stack>
                            </TableCell>

                            <TableCell
                              sx={{
                                maxWidth: 160,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              <Typography
                                variant="body2"
                                color={
                                  s.notes ? "text.primary" : "text.secondary"
                                }
                                title={s.notes || "—"}
                              >
                                {s.notes || "—"}
                              </Typography>
                            </TableCell>

                            <TableCell
                              sx={{ minWidth: 140, whiteSpace: "nowrap" }}
                            >
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                noWrap
                                title={addedOn}
                              >
                                {addedOn}
                              </Typography>
                            </TableCell>

                            {showDeviceActions && (
                              <TableCell align="right">
                                {isPendingDevice ? (
                                  <Stack
                                    direction="row"
                                    spacing={0.5}
                                    justifyContent="flex-end"
                                  >
                                    <Tooltip title="Accept device">
                                      <span>
                                        <Button
                                          size="small"
                                          variant="outlined"
                                          startIcon={<CheckCircle />}
                                          disabled={
                                            submittingDeviceId === s._id
                                          }
                                          onClick={() =>
                                            updateDeviceStatus(s, "Active")
                                          }
                                          sx={{
                                            borderRadius: "8px",
                                            minWidth: 0,
                                          }}
                                        >
                                          Accept
                                        </Button>
                                      </span>
                                    </Tooltip>
                                    <Tooltip title="Reject device">
                                      <span>
                                        <Button
                                          size="small"
                                          color="error"
                                          variant="outlined"
                                          startIcon={<DoNotDisturb />}
                                          disabled={
                                            submittingDeviceId === s._id
                                          }
                                          onClick={() =>
                                            updateDeviceStatus(s, "Rejected")
                                          }
                                          sx={{
                                            borderRadius: "8px",
                                            minWidth: 0,
                                          }}
                                        >
                                          Reject
                                        </Button>
                                      </span>
                                    </Tooltip>
                                  </Stack>
                                ) : (
                                  <Tooltip title="Copy serial">
                                    <IconButton
                                      size="small"
                                      onClick={() =>
                                        copyToClipboard(s.serial || "")
                                      }
                                    >
                                      <ContentCopy fontSize="inherit" />
                                    </IconButton>
                                  </Tooltip>
                                )}
                              </TableCell>
                            )}
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </Box>
            </Card>

            {/* Tags & Audit */}
            <Card
              elevation={0}
              sx={{
                borderRadius: "12px",
                border: "1px solid #e6e8eb",
                background: "white",
              }}
            >
              <CardContent sx={{ p: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">
                      Tags
                    </Typography>
                    <Stack
                      direction="row"
                      spacing={0.5}
                      mt={0.5}
                      flexWrap="wrap"
                    >
                      {(effective?.tags || []).length ? (
                        (effective?.tags || []).map((t, i) => (
                          <Chip
                            key={`${t}-${i}`}
                            size="small"
                            label={t}
                            variant="outlined"
                            sx={{ mr: 0.5, mb: 0.5 }}
                          />
                        ))
                      ) : (
                        <Typography variant="body2">—</Typography>
                      )}
                    </Stack>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <RowLine
                      icon={<CalendarMonth />}
                      label="Created"
                      value={formatShortDate(effective?.createdAt)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <RowLine
                      icon={<CalendarMonth />}
                      label="Updated"
                      value={formatShortDate(effective?.updatedAt)}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </>
        )}
      </Box>

      {/* Snackbar for quick feedback */}
      <Snackbar
        open={snack.open}
        autoHideDuration={2200}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        message={snack.msg}
      />
    </Drawer>
  );
}
