// pages/admin/track-assets/assets.js

import {
  Add,
  Build,
  CalendarMonth,
  Cancel,
  CheckCircle,
  CloudDownload,
  ContentCopy,
  CurrencyRupee,
  Delete,
  Edit,
  Home,
  Info,
  Inventory2,
  KeyboardArrowDown,
  KeyboardArrowUp,
  LocationOn,
  Logout,
  Numbers,
  Person,
  ReceiptLong,
  Search,
  Tag,
} from "@mui/icons-material";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Collapse,
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
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  CatalogIcon,
  brandAvatarEl,
  deviceIconEl,
  getBrandItem,
  getDeviceTypeItem,
  normalizeCatalog,
} from "../../../utils/catalogUtils";
import React, { useEffect, useMemo, useState } from "react";
import {
  chipForStatus,
  money,
  tileTheme,
  yyyyMmDd,
} from "../../../components/commonAssets.js";

import AssetDetailsDrawer from "@/components/AssetDetailsDrawer";
import SerialNumbersEditor from "@/components/SerialNumbersEditor";
import axiosInstance from "@/utils/helpers";
import { useRouter } from "next/navigation";

/* ======================= Layout tuning knobs ======================= */
const row_gap_px = 0;
const ROW_HEIGHT = 20;
const HEADER_HEIGHT = 44;
const SUBTABLE_ROW_HEIGHT = 30;

/* ======================= Constants ======================= */
const ASSET_TYPES = ["Hardware", "Software", "Other"];

const STATUS_TABS = [
  { value: "all", label: "All Assets", icon: <Inventory2 /> },
  { value: "me", label: "My Assets", icon: <Person /> },
  { value: "Active", label: "Active", icon: <CheckCircle /> },
  { value: "In Maintenance", label: "In Maintenance", icon: <Build /> },
  { value: "Retired", label: "Retired", icon: <ReceiptLong /> },
  { value: "Lost", label: "Lost", icon: <Cancel /> },
  { value: "Sold", label: "Sold", icon: <ReceiptLong /> },
];

const STATUS_OPTIONS = ["Active", "In Maintenance", "Retired", "Lost", "Sold"];

/** % widths (sum to 100) so table fills the entire row */
const COLUMNS = [
  { id: "select", label: "", width: 3 },
  { id: "asset", label: "Asset", width: 18 },
  { id: "type", label: "Type", width: 8 },
  { id: "serials", label: "Device Serials", width: 11 },
  { id: "location", label: "Location", width: 10 },
  { id: "purchase", label: "Purchase", width: 9 },
  { id: "value", label: "Value", width: 7 },
  { id: "status", label: "Status", width: 8 },
  { id: "assigned", label: "Assigned To", width: 8 },
  { id: "tags", label: "Tags", width: 9 }, // adjusted
  { id: "actions", label: "Actions", width: 9 }, // wider so buttons fit
];

/* ======================= Small helpers ======================= */
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
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

function IconBadge({
  children,
  borderColor = "#e5e7eb",
  bg = "#fff",
  size = 22,
}) {
  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: 0.75,
        bgcolor: bg,
        border: `1px solid ${borderColor}`,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {children}
    </Box>
  );
}

function DeviceChip({ item }) {
  const name = item?.name || "-";
  return (
    <Stack
      direction="row"
      spacing={0.6}
      alignItems="center"
      sx={{ minWidth: 0 }}
    >
      <IconBadge bg="#fbfdff" size={22}>
        {item?.icon ? (
          <CatalogIcon item={item} size={16} />
        ) : (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              "& svg": { fontSize: 16 },
            }}
          >
            {deviceIconEl(name)}
          </Box>
        )}
      </IconBadge>
      <Typography variant="body2" noWrap title={name}>
        {name}
      </Typography>
    </Stack>
  );
}

function BrandChip({ item }) {
  const name = item?.name || "-";
  return (
    <Stack
      direction="row"
      spacing={0.6}
      alignItems="center"
      sx={{ minWidth: 0 }}
    >
      <IconBadge bg="#fff" borderColor="#e6e8eb" size={22}>
        {item?.icon ? (
          <CatalogIcon item={item} size={16} />
        ) : (
          <Box
            sx={{
              width: 16,
              height: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              "& .MuiAvatar-root": {
                width: 16,
                height: 16,
                fontSize: "0.65rem",
              },
            }}
          >
            {brandAvatarEl(name)}
          </Box>
        )}
      </IconBadge>
      <Typography variant="body2" noWrap title={name}>
        {name}
      </Typography>
    </Stack>
  );
}

/* ======================= Dialog (Create/Edit Asset) ======================= */
function AssetDialog({
  open,
  isEdit,
  form,
  setForm,
  onClose,
  onSave,
  saving,
  deviceTypes,
  brands,
  onCreateDeviceType,
  onCreateBrand,
  hasSerialErrors,
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      TransitionComponent={Fade}
      PaperProps={{
        sx: {
          borderRadius: "14px",
          overflow: "hidden",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(250,251,252,0.98))",
        },
      }}
    >
      <DialogTitle
        sx={{
          borderBottom: "1px solid #e1e4e8",
          pb: 2,
          background:
            "linear-gradient(180deg, rgba(246,248,250,0.7), rgba(255,255,255,0.7))",
        }}
      >
        <Stack direction="row" spacing={1.25} alignItems="center">
          <Avatar sx={{ bgcolor: "primary.main" }}>
            {isEdit ? <Edit /> : <Add />}
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight={800}>
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

      <DialogContent sx={{ pt: "18px !important", pb: 2 }}>
        {/* Primary details */}
        <Card
          elevation={0}
          sx={{
            mb: 2,
            borderRadius: "14px",
            border: "1px solid #e6e8eb",
            background: "white",
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              px: 2,
              py: 1.25,
              display: "flex",
              alignItems: "center",
              gap: 1,
              borderBottom: "1px solid #edf0f3",
              background:
                "linear-gradient(90deg, rgba(13,110,253,0.06), rgba(13,110,253,0.02))",
            }}
          >
            <Avatar sx={{ width: 28, height: 28, bgcolor: "primary.main" }}>
              <Inventory2 fontSize="small" />
            </Avatar>
            <Box>
              <Typography variant="subtitle1" fontWeight={800} lineHeight={1.1}>
                Primary Details
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Name your asset and set its type & description
              </Typography>
            </Box>
            <Chip
              size="small"
              label="Required"
              sx={{ ml: "auto", fontWeight: 600 }}
              color="primary"
              variant="outlined"
            />
          </Box>

          <CardContent sx={{ p: 2.25 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  size="small"
                  label="Asset Name"
                  fullWidth
                  placeholder="e.g., Lenovo ThinkPad T14"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Inventory2 fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Asset Type</InputLabel>
                  <Select
                    label="Asset Type"
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
                  <Typography
                    variant="caption"
                    sx={{ color: "text.secondary", mt: 0.5 }}
                  >
                    Choose a category for better filtering & reporting
                  </Typography>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  size="small"
                  label="Description"
                  fullWidth
                  multiline
                  minRows={2}
                  placeholder="Short notes about this asset (specs, configs, etc.)"
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Serial subform */}
        <SerialNumbersEditor
          value={form.serialNumbers || []}
          onChange={(serialNumbers) =>
            setForm((f) => ({ ...f, serialNumbers }))
          }
          deviceTypes={deviceTypes}
          brands={brands}
          onCreateDeviceType={onCreateDeviceType}
          onCreateBrand={onCreateBrand}
        />

        {/* Purchase & Assignment */}
        <Card
          elevation={0}
          sx={{
            mt: 2,
            borderRadius: "14px",
            border: "1px solid #e6e8eb",
            background: "white",
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              px: 2,
              py: 1.25,
              display: "flex",
              alignItems: "center",
              gap: 1,
              borderBottom: "1px solid #edf0f3",
              background:
                "linear-gradient(90deg, rgba(2,122,72,0.06), rgba(2,122,72,0.02))",
            }}
          >
            <Avatar sx={{ width: 28, height: 28, bgcolor: "success.main" }}>
              <CheckCircle fontSize="small" />
            </Avatar>
            <Box>
              <Typography variant="subtitle1" fontWeight={800} lineHeight={1.1}>
                Purchase & Assignment
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Dates, value, status, owner and tags
              </Typography>
            </Box>
          </Box>

          <CardContent sx={{ p: 2.25 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  size="small"
                  label="Purchase Date"
                  type="date"
                  fullWidth
                  value={form.purchaseDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, purchaseDate: e.target.value }))
                  }
                  InputLabelProps={{ shrink: true }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <CalendarMonth fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  size="small"
                  label="Location"
                  placeholder="e.g., Bengaluru HQ · 3rd Floor"
                  fullWidth
                  value={form.location}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, location: e.target.value }))
                  }
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationOn fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  size="small"
                  label="Value (₹)"
                  type="number"
                  fullWidth
                  value={form.value}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, value: e.target.value }))
                  }
                  inputProps={{ min: 0, step: 0.01 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <CurrencyRupee fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    label="Status"
                    value={form.status}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, status: e.target.value }))
                    }
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <MenuItem key={s} value={s}>
                        {s}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  size="small"
                  label="Assigned To (User ID)"
                  fullWidth
                  value={form.assignedTo}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, assignedTo: e.target.value }))
                  }
                  helperText="Optional: user name"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Person fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  size="small"
                  label="Tags (comma separated)"
                  fullWidth
                  placeholder="e.g., finance, laptop, confidential"
                  value={form.tags}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, tags: e.target.value }))
                  }
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Tag fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                  helperText="Tip: separate multiple tags with commas"
                />
                <Stack direction="row" spacing={0.5} mt={1} flexWrap="wrap">
                  {(form.tags || "")
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean)
                    .slice(0, 12)
                    .map((t, i) => (
                      <Chip
                        key={`${t}-${i}`}
                        size="small"
                        label={t}
                        variant="outlined"
                        sx={{ mr: 0.5, mb: 0.5 }}
                      />
                    ))}
                </Stack>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </DialogContent>

      <DialogActions
        sx={{
          p: 3,
          pt: 1,
          borderTop: "1px solid #e1e4e8",
          background:
            "linear-gradient(0deg, rgba(246,248,250,0.7), rgba(255,255,255,0.7))",
        }}
      >
        <Button
          onClick={onClose}
          disabled={saving}
          sx={{ borderRadius: "10px" }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={onSave}
          disabled={saving || !form.name || !form.type || hasSerialErrors}
          startIcon={
            saving ? (
              <CircularProgress size={16} />
            ) : isEdit ? (
              <Edit />
            ) : (
              <Add />
            )
          }
          sx={{ borderRadius: "10px", fontWeight: 700 }}
        >
          {saving ? "Saving..." : isEdit ? "Save Changes" : "Create Asset"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/* ======================= Main Component ======================= */
export default function AdminTrackAssetsPage() {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState(null);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const [deviceTypes, setDeviceTypes] = useState([]);
  const [brands, setBrands] = useState([]);

  const [catalogBanner, setCatalogBanner] = useState("");
  const [snack, setSnack] = useState({ open: false, msg: "" });

  // Filters / tabs
  const [activeTab, setActiveTab] = useState("all");
  const [q, setQ] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [filterYear, setFilterYear] = useState("");

  // Row expand state (for inline serials subtable)
  const [expanded, setExpanded] = useState(() => new Set());

  // Selection + bulk actions
  const [selectedIds, setSelectedIds] = useState([]);

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Create/Edit dialog
  const freshForm = {
    _id: null,
    name: "",
    type: "",
    description: "",
    serialNumbers: [{ deviceType: "", serial: "", brand: "" }],
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

  // Details Drawer
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsAsset, setDetailsAsset] = useState(null);
  const openDetails = (row) => {
    setDetailsAsset(row);
    setDetailsOpen(true);
  };

  const hasSerialErrors = useMemo(() => {
    const list = form.serialNumbers || [];
    return list.some((r) => !String(r.serial || "").trim());
  }, [form.serialNumbers]);

  const isMine = (a) => {
    const assigned = String(a?.assignedTo ?? "").toLowerCase();
    if (!assigned) return false;
    const probes = [
      currentUser?._id,
      currentUser?.id,
      currentUser?.employeeCode,
      currentUser?.email,
      currentUser?.name,
    ]
      .filter(Boolean)
      .map((x) => String(x).toLowerCase());
    return probes.some((p) => p && assigned.includes(p));
  };

  // Effects
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    setCurrentUser(user);
    fetchAssets();
    fetchCatalog();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setPage(0);
  }, [activeTab, q, filterStatus, filterLocation, filterYear]);

  // --------- Catalog ----------
  const fetchCatalog = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

      const [dtRes, brRes] = await Promise.allSettled([
        axiosInstance.get("/api/devices", headers ? { headers } : undefined),
        axiosInstance.get("/api/brands", headers ? { headers } : undefined),
      ]);

      if (dtRes.status === "fulfilled") {
        const deviceRows = dtRes.value?.data?.data ?? dtRes.value?.data ?? [];
        setDeviceTypes(normalizeCatalog(deviceRows));
      } else {
        setDeviceTypes([]);
        const code = dtRes.reason?.response?.status;
        const msg =
          code === 404
            ? "Device types endpoint (/api/devices) not found."
            : "Failed to load device types.";
        setCatalogBanner((prev) => (prev ? prev + " " + msg : msg));
      }

      if (brRes.status === "fulfilled") {
        const brandRows = brRes.value?.data?.data ?? brRes.value?.data ?? [];
        setBrands(normalizeCatalog(brandRows));
      } else {
        setBrands([]);
        const code = brRes.reason?.response?.status;
        const msg =
          code === 404
            ? "Brands endpoint (/api/brands) not found."
            : "Failed to load brands.";
        setCatalogBanner((prev) => (prev ? prev + " " + msg : msg));
      }
    } catch (e) {
      setDeviceTypes([]);
      setBrands([]);
      setCatalogBanner("Failed to load catalog.");
      console.error("Catalog error:", e);
    }
  };

  // --------- Assets ----------
  const fetchAssets = async () => {
    try {
      setLoading(true);
      setErr(null);

      const token = localStorage.getItem("token");
      if (!token) {
        setErr("Please login first");
        return;
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
      setSelectedIds([]);
      setExpanded(new Set());
      setPage(0);
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
      serialNumbers: Array.isArray(row.serialNumbers)
        ? row.serialNumbers.map((s) => ({
            deviceType:
              (s.deviceType && s.deviceType._id) || s.deviceType || "",
            brand: (s.brand && s.brand._id) || s.brand || "",
            serial: s.serial || "",
            notes: s.notes || "",
          }))
        : [{ deviceType: "", serial: "", brand: "" }],
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
        serialNumbers: (form.serialNumbers || []).map((s) => ({
          deviceType: s.deviceType || undefined,
          brand: s.brand || undefined,
          serial: s.serial ? String(s.serial).trim() : "",
          notes: s.notes ? String(s.notes).trim() : undefined,
        })),
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
        setSnack({ open: true, msg: "Asset updated" });
      } else {
        await axiosInstance.post(`/api/assets`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSnack({ open: true, msg: "Asset created" });
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
      setSnack({ open: true, msg: "Asset deleted" });
      fetchAssets();
    } catch (e) {
      console.error(e);
      setErr("Failed to delete asset.");
    }
  };

  // --------- Filtering ----------
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return assets
      .filter((a) => {
        if (activeTab === "me") {
          if (!isMine(a)) return false;
        } else if (activeTab !== "all" && a.status !== activeTab) {
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
  }, [
    assets,
    activeTab,
    q,
    filterStatus,
    filterLocation,
    filterYear,
    currentUser,
  ]);

  // Pagination slice
  const start = page * rowsPerPage;
  const end = start + rowsPerPage;
  const pageItems = filtered.slice(start, end);

  // For stable table height: number of filler rows
  // const emptyRows = Math.max(0, rowsPerPage - pageItems.length);

  // Totals for cards
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

  // Bulk actions
  const currentPageIds = pageItems.map((a) => a._id);
  const allSelectedOnPage =
    currentPageIds.length > 0 &&
    currentPageIds.every((id) => selectedIds.includes(id));

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      const onPageSelected = currentPageIds.filter((id) => prev.includes(id));
      const selecting = onPageSelected.length !== currentPageIds.length;
      if (selecting) {
        const set = new Set(prev);
        currentPageIds.forEach((id) => set.add(id));
        return Array.from(set);
      } else {
        return prev.filter((id) => !currentPageIds.includes(id));
      }
    });
  };

  const toggleRow = (id) => {
    setSelectedIds((sel) =>
      sel.includes(id) ? sel.filter((x) => x !== id) : [...sel, id]
    );
  };

  const bulkDelete = async () => {
    if (!selectedIds.length) return;
    if (!confirm(`Soft delete ${selectedIds.length} asset(s)?`)) return;
    try {
      const token = localStorage.getItem("token");
      await Promise.all(
        selectedIds.map((id) =>
          axiosInstance.delete(`/api/assets/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
        )
      );
      setSelectedIds([]);
      setSnack({ open: true, msg: "Status deleted" });
      fetchAssets();
    } catch (e) {
      console.error(e);
      setErr("One or more deletes failed.");
    }
  };

  const [bulkStatus, setBulkStatus] = useState("");
  const bulkChangeStatus = async () => {
    if (!selectedIds.length || !bulkStatus) return;
    try {
      const token = localStorage.getItem("token");
      await Promise.all(
        selectedIds.map((id) =>
          axiosInstance.put(
            `/api/assets/${id}`,
            { status: bulkStatus },
            { headers: { Authorization: `Bearer ${token}` } }
          )
        )
      );
      setSelectedIds([]);
      setBulkStatus("");
      setSnack({ open: true, msg: "Status updated" });
      fetchAssets();
    } catch (e) {
      console.error(e);
      setErr("One or more updates failed.");
    }
  };

  const exportCSV = () => {
    const list = filtered || assets || [];
    if (!list.length) return;

    // --- helpers ----------------------------------------------------
    const sanitize = (v) => {
      // Excel-safe: no NBSP, no fancy dashes/quotes; default to empty string
      if (v === undefined || v === null) return "";
      let s = String(v);
      s = s
        .replace(/\u00A0/g, " ") // NBSP -> space
        .replace(/\u2013|\u2014/g, "-") // en/em dash -> ASCII hyphen
        .replace(/\u2018|\u2019/g, "'") // curly single quotes -> '
        .replace(/\u201C|\u201D/g, '"'); // curly double quotes -> "
      return s.trim();
    };

    const fmtIso = (d) => (d ? new Date(d).toISOString() : "");
    const fmtHumanDate = (d) => (d ? new Date(d).toLocaleDateString() : "");

    const headers = [
      "Id",
      "Name",
      "Type",
      "Description",
      "Location",
      "PurchaseDate",
      "Value",
      "Status",
      "AssignedTo",
      "Tags",
      "Device Serials", // JSON array of objects (ASCII-only content)
      "CreatedAt",
      "UpdatedAt",
    ];

    // Build rows
    const rows = list.map((a) => {
      const serials = Array.isArray(a.serialNumbers) ? a.serialNumbers : [];

      const deviceSerials = serials.map((s) => {
        const deviceTypeName =
          typeof s?.deviceType === "object"
            ? s.deviceType?.name || ""
            : s?.deviceTypeName || "";
        const brandName =
          typeof s?.brand === "object"
            ? s.brand?.name || ""
            : s?.brandName || "";

        const addedDate = s?.createdAt || s?.addedAt || a?.createdAt || "";
        return {
          "Device Type": sanitize(deviceTypeName),
          Brand: sanitize(brandName),
          Serial: sanitize(s?.serial || ""),
          Notes: sanitize(s?.notes || ""), // <-- no em-dash; empty string instead
          Added: sanitize(fmtHumanDate(addedDate)),
        };
      });

      return {
        Id: sanitize(a._id),
        Name: sanitize(a.name),
        Type: sanitize(a.type),
        Description: sanitize(a.description),
        Location: sanitize(a.location),
        PurchaseDate: sanitize(fmtIso(a.purchaseDate)),
        Value: a.value ?? "",
        Status: sanitize(a.status),
        AssignedTo: sanitize(a.assignedTo),
        Tags: sanitize(Array.isArray(a.tags) ? a.tags.join("|") : a.tags || ""),
        "Device Serials": sanitize(JSON.stringify(deviceSerials)), // JSON text sanitized to ASCII
        CreatedAt: sanitize(fmtIso(a.createdAt)),
        UpdatedAt: sanitize(fmtIso(a.updatedAt)),
      };
    });

    // CSV escaping
    const esc = (v) => {
      const s = String(v ?? "");
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
      // Excel will respect BOM + quotes
    };

    const csv = [
      headers.join(","),
      ...rows.map((r) => headers.map((h) => esc(r[h])).join(",")),
    ].join("\n");

    // --- IMPORTANT: add UTF-8 BOM so Excel parses correctly -----------
    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    a.href = url;
    a.download = `assets_export_with_device_serials_${ts}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleExpand = (id) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

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
        <Alert severity="error" sx={{ maxWidth: 600, mx: "auto", mt: 4 }}>
          {err}
          <Button onClick={fetchAssets} sx={{ ml: 2 }}>
            Retry
          </Button>
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
              <Avatar sx={{ width: 40, height: 40, mr: 3 }}>
                <Inventory2 />
              </Avatar>
              <Box>
                <Typography
                  variant="h5"
                  sx={{ fontWeight: 700, lineHeight: 1.2 }}
                >
                  Admin · Track Assets
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: "text.secondary", mt: 0.5 }}
                >
                  Overview · Card counts · Tables
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
              <Tooltip title="Export CSV" arrow>
                <IconButton
                  onClick={exportCSV}
                  sx={{
                    transition: "all 0.2s ease",
                    "&:hover": {
                      color: "primary.main",
                      transform: "translateY(-1px)",
                    },
                  }}
                >
                  <CloudDownload />
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
                startIcon={<Add />}
                onClick={openNew}
                sx={{ borderRadius: "10px", fontWeight: 700 }}
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

      {/* Non-blocking catalog banner */}
      {!!catalogBanner && (
        <Box sx={{ px: { xs: 2, md: 3, lg: 4 }, pt: 2 }}>
          <Alert
            severity="warning"
            variant="outlined"
            onClose={() => setCatalogBanner("")}
            sx={{ borderRadius: 2 }}
          >
            {catalogBanner}
          </Alert>
        </Box>
      )}

      {/* Main content */}
      <Box sx={{ px: { xs: 2, md: 3, lg: 4 }, pb: 3 }}>
        {/* ======= SUMMARY CARDS ======= */}
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

        {/* ======= TABS + FILTERS ======= */}
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
                placeholder="Search…"
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

          {/* Bulk toolbar */}
          <Toolbar
            variant="dense"
            sx={{
              px: 2,
              py: 0.75,
              display: "flex",
              alignItems: "center",
              gap: 1,
              bgcolor: selectedIds.length
                ? "rgba(13,110,253,0.06)"
                : "transparent",
              borderBottom: "1px solid #e1e4e8",
            }}
          >
            <Checkbox
              checked={Boolean(allSelectedOnPage)}
              indeterminate={
                currentPageIds.some((id) => selectedIds.includes(id)) &&
                !allSelectedOnPage
              }
              onChange={toggleSelectAll}
              inputProps={{ "aria-label": "Select all" }}
            />
            <Typography variant="body2" sx={{ flexGrow: 1 }}>
              {selectedIds.length
                ? `${selectedIds.length} selected`
                : "Select rows for bulk actions"}
            </Typography>

            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Set Status</InputLabel>
              <Select
                value={bulkStatus}
                label="Set Status"
                onChange={(e) => setBulkStatus(e.target.value)}
              >
                <MenuItem value="">—</MenuItem>
                {STATUS_OPTIONS.map((s) => (
                  <MenuItem key={s} value={s}>
                    {s}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              size="small"
              variant="outlined"
              startIcon={<CheckCircle />}
              onClick={bulkChangeStatus}
              disabled={!selectedIds.length || !bulkStatus}
              sx={{ borderRadius: "8px" }}
            >
              Apply
            </Button>

            <Button
              size="small"
              color="error"
              variant="outlined"
              startIcon={<Delete />}
              onClick={bulkDelete}
              disabled={!selectedIds.length}
              sx={{ borderRadius: "8px" }}
            >
              Delete
            </Button>
          </Toolbar>
        </Card>

        {/* ======= ASSETS TABLE ======= */}
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
            sx={{
              flex: 1,
              overflowX: "auto", // allow horizontal scroll if needed
              overflowY: "hidden",
              pb: 0.5,
            }}
          >
            <Table
              size="small"
              sx={{
                tableLayout: "fixed",
                width: "100%",
                borderCollapse: "collapse",
                "& td, & th": {
                  paddingTop: `${row_gap_px}px`,
                  paddingBottom: `${row_gap_px}px`,
                  lineHeight: 1.25,
                },
                "& .MuiTableRow-root": {
                  height: ROW_HEIGHT,
                },
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
                      padding={c.id === "select" ? "checkbox" : "normal"}
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
                        <EmptyState onNew={openNew} />
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {pageItems.map((row) => {
                      const st = chipForStatus(row.status);
                      const isChecked = selectedIds.includes(row._id);
                      const isOpen = expanded.has(row._id);
                      const serials = Array.isArray(row.serialNumbers)
                        ? row.serialNumbers
                        : [];

                      return (
                        <React.Fragment key={row._id}>
                          <TableRow hover sx={{ height: ROW_HEIGHT }}>
                            {/* select */}
                            <TableCell padding="checkbox">
                              <Checkbox
                                checked={isChecked}
                                onChange={() => toggleRow(row._id)}
                              />
                            </TableCell>

                            {/* asset */}
                            <TableCell>
                              <Stack
                                direction="row"
                                alignItems="center"
                                spacing={0.5}
                              >
                                <Avatar
                                  sx={{
                                    width: 24,
                                    height: 24,
                                    bgcolor: "primary.main",
                                    fontSize: 12,
                                    fontWeight: 600,
                                  }}
                                >
                                  {String(row.name || "?")
                                    .slice(0, 1)
                                    .toUpperCase()}
                                </Avatar>

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
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openDetails(row);
                                      }}
                                      title={row.name || "-"}
                                    >
                                      {row.name || "-"}
                                    </Typography>
                                  </Tooltip>

                                  <Tooltip title={String(row._id || "")} arrow>
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                      sx={{ display: "block", cursor: "help" }}
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
                                  onClick={() => toggleExpand(row._id)}
                                  sx={{
                                    border: "1px solid #e5e7eb",
                                    p: 0.5, // tight
                                  }}
                                >
                                  {isOpen ? (
                                    <KeyboardArrowUp fontSize="small" />
                                  ) : (
                                    <KeyboardArrowDown fontSize="small" />
                                  )}
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
                                  {row.purchaseDate
                                    ? new Date(
                                        row.purchaseDate
                                      ).toLocaleDateString()
                                    : "-"}
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

                            {/* status */}
                            <TableCell>
                              <Chip
                                size="small"
                                label={st.label}
                                sx={{ borderRadius: "20px", ...st.sx }}
                              />
                            </TableCell>

                            {/* assigned */}
                            <TableCell>
                              <Stack
                                direction="row"
                                spacing={0.4}
                                alignItems="center"
                              >
                                <Person
                                  fontSize="small"
                                  sx={{ opacity: 0.7 }}
                                />
                                <Typography variant="body2" noWrap>
                                  {row.assignedTo
                                    ? activeTab === "me"
                                      ? "You"
                                      : String(row.assignedTo).slice(0, 6) + "…"
                                    : "-"}
                                </Typography>
                              </Stack>
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

                            {/* actions — tightly packed, never overflow */}
                            <TableCell
                              sx={{
                                p: 0,
                                overflow: "hidden",
                              }}
                            >
                              <Box
                                sx={{
                                  display: "flex",
                                  justifyContent: "flex-end",
                                  alignItems: "center",
                                  gap: 0.5,
                                  px: 0.5,
                                  maxWidth: "100%",
                                  overflow: "hidden",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                <Tooltip title="View details">
                                  <IconButton
                                    size="small"
                                    onClick={() => openDetails(row)}
                                    sx={{ color: "primary.main", p: 0.5 }}
                                  >
                                    <Inventory2 fontSize="inherit" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Edit">
                                  <IconButton
                                    size="small"
                                    onClick={() => openEdit(row)}
                                    sx={{ color: "warning.main", p: 0.5 }}
                                  >
                                    <Edit fontSize="inherit" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Delete (soft)">
                                  <IconButton
                                    size="small"
                                    onClick={() => onDelete(row)}
                                    sx={{ color: "error.main", p: 0.5 }}
                                  >
                                    <Delete fontSize="inherit" />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </TableCell>
                          </TableRow>

                          {/* ===== Collapsible subtable row (redesigned) ===== */}
                          <TableRow sx={{ height: ROW_HEIGHT }}>
                            <TableCell />
                            <TableCell
                              colSpan={COLUMNS.length - 1}
                              sx={{ p: 0, border: 0 }}
                            >
                              <Collapse
                                in={isOpen}
                                timeout="auto"
                                unmountOnExit
                              >
                                <Box
                                  sx={{
                                    mx: 1,
                                    my: 1,
                                    border: "1px solid #e5e7eb",
                                    borderRadius: 2,
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
                                    <Info
                                      sx={{
                                        fontSize: 18,
                                        color: "primary.main",
                                      }}
                                    />
                                    <Typography
                                      variant="subtitle2"
                                      fontWeight={800}
                                    >
                                      Device details ({serials.length})
                                    </Typography>
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                      sx={{ ml: 1 }}
                                    >
                                      Device Type, Brand, Serial, Notes & Added
                                      On
                                    </Typography>
                                  </Box>

                                  {serials.length === 0 ? (
                                    <Box sx={{ p: 2 }}>
                                      <Typography
                                        variant="body2"
                                        color="text.secondary"
                                      >
                                        No serials for this asset.
                                      </Typography>
                                    </Box>
                                  ) : (
                                    <Table
                                      size="small"
                                      sx={{
                                        width: "100%",
                                        borderCollapse: "separate",
                                        borderSpacing: 0,
                                        "& td, & th": {
                                          paddingTop: "10px",
                                          paddingBottom: "10px",
                                          lineHeight: 1.35,
                                        },
                                        "& .MuiTableRow-root": {
                                          height: SUBTABLE_ROW_HEIGHT,
                                        },
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
                                          <TableCell>Added</TableCell>
                                          <TableCell align="right">
                                            Actions
                                          </TableCell>
                                        </TableRow>
                                      </TableHead>
                                      <TableBody>
                                        {serials.map((s, idx) => {
                                          const dtItem = getDeviceTypeItem(
                                            s,
                                            deviceTypes
                                          );
                                          const brItem = getBrandItem(
                                            s,
                                            brands
                                          );

                                          return (
                                            <TableRow
                                              key={`${row._id}-sn-${idx}`}
                                            >
                                              <TableCell>
                                                <DeviceChip item={dtItem} />
                                              </TableCell>
                                              <TableCell>
                                                <BrandChip item={brItem} />
                                              </TableCell>
                                              <TableCell>
                                                <Chip
                                                  size="small"
                                                  variant="outlined"
                                                  icon={
                                                    <Numbers
                                                      sx={{ fontSize: 16 }}
                                                    />
                                                  }
                                                  label={
                                                    <Typography
                                                      variant="body2"
                                                      sx={{
                                                        fontFamily:
                                                          '"SF Mono","Monaco", monospace',
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
                                              <TableCell>
                                                <Typography
                                                  variant="body2"
                                                  color={
                                                    s.notes
                                                      ? "text.primary"
                                                      : "text.secondary"
                                                  }
                                                  noWrap
                                                  title={s.notes || "—"}
                                                >
                                                  {s.notes || "—"}
                                                </Typography>
                                              </TableCell>
                                              <TableCell>
                                                <Typography
                                                  variant="body2"
                                                  color="text.secondary"
                                                >
                                                  {row.createdAt
                                                    ? new Date(
                                                        row.createdAt
                                                      ).toLocaleDateString()
                                                    : "-"}
                                                </Typography>
                                              </TableCell>
                                              <TableCell align="right">
                                                <Stack
                                                  direction="row"
                                                  spacing={0.5}
                                                  justifyContent="flex-end"
                                                >
                                                  <Tooltip title="Copy serial">
                                                    <IconButton
                                                      size="small"
                                                      onClick={async () => {
                                                        if (
                                                          await copyToClipboard(
                                                            s.serial || ""
                                                          )
                                                        ) {
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
                                                </Stack>
                                              </TableCell>
                                            </TableRow>
                                          );
                                        })}
                                      </TableBody>
                                    </Table>
                                  )}
                                </Box>
                              </Collapse>
                            </TableCell>
                          </TableRow>
                          {/* ===== End collapsible subtable row ===== */}
                        </React.Fragment>
                      );
                    })}

                    {/* Filler to maintain constant body height */}
                    {/* {emptyRows > 0 && (
                      <TableRow style={{ height: ROW_HEIGHT * emptyRows }}>
                        <TableCell colSpan={COLUMNS.length} />
                      </TableRow>
                    )} */}
                  </>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination control pinned to bottom */}
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

      {/* Create/Edit Dialog */}
      <AssetDialog
        open={formOpen}
        isEdit={isEdit}
        form={form}
        setForm={setForm}
        onClose={() => setFormOpen(false)}
        onSave={onSave}
        saving={saving}
        deviceTypes={deviceTypes}
        brands={brands}
        onCreateDeviceType={(created, rowIndex) => {
          setDeviceTypes((prev) =>
            prev.some((p) => p._id === created._id) ? prev : [...prev, created]
          );
          if (rowIndex != null) {
            setForm((f) => {
              const next = [...(f.serialNumbers || [])];
              if (next[rowIndex])
                next[rowIndex] = { ...next[rowIndex], deviceType: created._id };
              return { ...f, serialNumbers: next };
            });
          }
          setSnack({ open: true, msg: `Device type “${created.name}” added` });
        }}
        onCreateBrand={(created, rowIndex) => {
          setBrands((prev) =>
            prev.some((p) => p._id === created._id) ? prev : [...prev, created]
          );
          if (rowIndex != null) {
            setForm((f) => {
              const next = [...(f.serialNumbers || [])];
              if (next[rowIndex])
                next[rowIndex] = { ...next[rowIndex], brand: created._id };
              return { ...f, serialNumbers: next };
            });
          }
          setSnack({ open: true, msg: `Brand “${created.name}” added` });
        }}
        hasSerialErrors={hasSerialErrors}
      />

      {/* Details Drawer */}
      <AssetDetailsDrawer
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        baseAsset={detailsAsset}
        onEdit={(row) => {
          setDetailsOpen(false);
          openEdit(row);
        }}
        onDelete={(row) => {
          setDetailsOpen(false);
          onDelete(row);
        }}
        deviceTypes={deviceTypes} // <-- pass down
        brands={brands} // <-- pass down
      />

      <Snackbar
        open={snack.open}
        autoHideDuration={2500}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        message={snack.msg}
      />
    </Box>
  );
}

/* ======================= Small bits ======================= */
// function StatTile({ label, value }) {
//   const theme = tileTheme(label);
//   return (
//     <Card
//       elevation={0}
//       sx={{
//         borderRadius: "12px",
//         border: `1px solid ${theme.border}`,
//         background: theme.bg,
//       }}
//     >
//       <CardContent sx={{ p: 1.75 }}>
//         <Typography variant="caption" sx={{ color: theme.text }}>
//           {label}
//         </Typography>
//         <Typography
//           variant="h6"
//           fontWeight={800}
//           sx={{ mt: 0.5, color: theme.text }}
//           title={String(value)}
//         >
//           {value}
//         </Typography>
//       </CardContent>
//     </Card>
//   );
// }
export function StatTile({ label, value }) {
  const theme = tileTheme(label);

  return (
    <div
      whileHover={{ scale: 1.03, y: -2 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      <Card
        elevation={0}
        sx={{
          borderRadius: "12px",
          background: theme.bg,
          border: `1px solid ${theme.color}20`,
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)",
          "&:hover": {
            boxShadow: `0 6px 12px ${theme.color}30`,
            borderColor: `${theme.color}50`,
          },
        }}
      >
        <CardContent sx={{ p: 2 }}>
          <Box>
            <Typography
              variant="caption"
              sx={{
                display: "block",
                fontWeight: 600,
                color: theme.color,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
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
                color: theme.text,
                fontSize: "1.4rem",
                lineHeight: 1.2,
                fontFamily: '"SF Mono","Monaco", monospace',
              }}
              title={String(value)} // tooltip for full number
            >
              {value ?? "—"}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </div>
  );
}

function EmptyState({ onNew }) {
  return (
    <Fade in timeout={500}>
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
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            Try adjusting filters or create a new asset.
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={onNew}
            sx={{ borderRadius: "10px", fontWeight: 700 }}
          >
            Add Asset
          </Button>
        </CardContent>
      </Card>
    </Fade>
  );
}
