// src/pages/admin/track-assets/SerialNumbersEditor.jsx

const { default: AddCatalogItemDialog } = require("./AddCatalogItemDialog");

import { Add, Delete, Tag } from "@mui/icons-material";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  ListItemText,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  CatalogIcon,
  brandAvatarEl,
  deviceIconEl,
  findById,
  findById as findByIdImported,
  isUrl,
  looksEmoji,
} from "../utils/catalogUtils";
import React, { useEffect, useMemo, useState } from "react";

export default function SerialNumbersEditor({
  value,
  onChange,
  deviceTypes,
  brands,
  onCreateDeviceType,
  onCreateBrand,
}) {
  const [openAddDeviceType, setOpenAddDeviceType] = React.useState(false);
  const [openAddBrand, setOpenAddBrand] = React.useState(false);
  const [deviceTypeRowIdx, setDeviceTypeRowIdx] = React.useState(null);
  const [brandRowIdx, setBrandRowIdx] = React.useState(null);

  const [deviceSearch, setDeviceSearch] = React.useState("");
  const [brandSearch, setBrandSearch] = React.useState("");

  const addRow = () =>
    onChange([...(value || []), { deviceType: "", serial: "", brand: "" }]);

  const removeRow = (i) =>
    onChange((value || []).filter((_, idx) => idx !== i));

  const setField = (i, patch) => {
    const next = [...(value || [])];
    next[i] = { ...next[i], ...patch };
    onChange(next);
  };

  const serialErrors = (value || []).map((r) => !String(r.serial || "").trim());

  const filterBy = (items = [], q) => {
    const needle = String(q || "")
      .trim()
      .toLowerCase();
    if (!needle) return items;
    return items.filter((it) =>
      String(it?.name || "")
        .toLowerCase()
        .includes(needle)
    );
  };

  const renderDeviceBadge = (item) => {
    if (isUrl(item?.icon) || looksEmoji(item?.icon)) {
      return <CatalogIcon item={item} fallbackColor="#2563eb" />;
    }
    return deviceIconEl(item?.name);
  };

  const renderBrandBadge = (item) => {
    if (isUrl(item?.icon) || looksEmoji(item?.icon)) {
      return <CatalogIcon item={item} fallbackColor="#16a34a" />;
    }
    return brandAvatarEl(item?.name);
  };

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: "14px",
        background: "white",
        border: "1px solid #e6e8eb",
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 1.5 }}
        >
          <Stack direction="row" spacing={1.25} alignItems="center">
            <Avatar sx={{ width: 28, height: 28, bgcolor: "primary.main" }}>
              <Tag fontSize="small" />
            </Avatar>
            <Box>
              <Typography variant="subtitle1" fontWeight={800} lineHeight={1.1}>
                Device Serials
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Link each serial to a device type and brand
              </Typography>
            </Box>
            <Chip
              size="small"
              label={`${(value || []).length} item${
                (value || []).length === 1 ? "" : "s"
              }`}
              sx={{ ml: 1, fontWeight: 600 }}
            />
          </Stack>
          <Button
            size="small"
            startIcon={<Add />}
            onClick={addRow}
            variant="contained"
            sx={{ borderRadius: "10px", fontWeight: 700 }}
          >
            Add Device Info
          </Button>
        </Stack>

        {(!value || value.length === 0) && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            No device information yet. Click “Add Device Info” to start.
          </Typography>
        )}

        <Stack spacing={1.25}>
          {(value || []).map((row, i) => {
            const showError = serialErrors[i];
            const filteredDeviceTypes = filterBy(deviceTypes, deviceSearch);
            const filteredBrands = filterBy(brands, brandSearch);

            return (
              <Box
                key={i}
                sx={{
                  p: 1.5,
                  borderRadius: "12px",
                  border: "1px solid #e6e8eb",
                  background:
                    "linear-gradient(135deg, #fafafa 0%, #ffffff 100%)",
                }}
              >
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{ mb: 1 }}
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip
                      size="small"
                      label={`#${i + 1}`}
                      sx={{ fontWeight: 700 }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      Device entry
                    </Typography>
                  </Stack>
                  <Tooltip title="Remove this device">
                    <IconButton
                      color="error"
                      onClick={() => removeRow(i)}
                      size="small"
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>

                <Grid container spacing={1.25} alignItems="center">
                  {/* Device Name */}
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Device Name</InputLabel>
                      <Select
                        label="Device Name"
                        value={row.deviceType || ""}
                        onChange={(e) =>
                          setField(i, { deviceType: String(e.target.value) })
                        }
                        MenuProps={{
                          PaperProps: { style: { maxHeight: 340 } },
                        }}
                        renderValue={(selected) => {
                          const item = findById(deviceTypes, selected) || {
                            name: "Unknown",
                          };
                          return (
                            <Stack
                              direction="row"
                              alignItems="center"
                              spacing={1}
                            >
                              {renderDeviceBadge(item)}
                              <span>{item.name}</span>
                            </Stack>
                          );
                        }}
                      >
                        {/* Search box inside the menu */}
                        <MenuItem
                          disableGutters
                          disableRipple
                          sx={{ px: 1.5, py: 1, pointerEvents: "auto" }}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                        >
                          <TextField
                            autoFocus
                            size="small"
                            placeholder="Search device types…"
                            fullWidth
                            value={deviceSearch}
                            onChange={(e) => setDeviceSearch(e.target.value)}
                            onKeyDown={(e) => e.stopPropagation()}
                          />
                        </MenuItem>
                        <Divider sx={{ my: 0.5 }} />

                        <MenuItem value="">
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                          >
                            {renderDeviceBadge({ name: "unknown", icon: null })}
                            <ListItemText
                              primary={<em>Default (Unknown Device)</em>}
                            />
                          </Stack>
                        </MenuItem>

                        {filteredDeviceTypes.length === 0 ? (
                          <MenuItem disabled>No matches</MenuItem>
                        ) : (
                          filteredDeviceTypes.map((dt) => (
                            <MenuItem key={dt._id} value={dt._id}>
                              <Stack
                                direction="row"
                                spacing={1}
                                alignItems="center"
                              >
                                {renderDeviceBadge(dt)}
                                <ListItemText primary={dt.name} />
                              </Stack>
                            </MenuItem>
                          ))
                        )}

                        <Divider sx={{ my: 0.5 }} />
                        <MenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeviceTypeRowIdx(i);
                            setOpenAddDeviceType(true);
                          }}
                          sx={{ fontWeight: 600 }}
                        >
                          <Add fontSize="small" style={{ marginRight: 8 }} />
                          Add new device type…
                        </MenuItem>
                      </Select>
                      <Typography
                        variant="caption"
                        sx={{ color: "text.secondary", mt: 0.5 }}
                      >
                        e.g., Laptop, Monitor, Keyboard
                      </Typography>
                    </FormControl>
                  </Grid>

                  {/* Serial */}
                  <Grid item xs={12} md={4}>
                    <TextField
                      size="small"
                      label="Serial Number"
                      fullWidth
                      value={row.serial || ""}
                      onChange={(e) => setField(i, { serial: e.target.value })}
                      required
                      error={showError}
                      helperText={showError ? "Serial number is required" : " "}
                    />
                  </Grid>

                  {/* Brand */}
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Brand Name</InputLabel>
                      <Select
                        label="Brand Name"
                        value={row.brand || ""}
                        onChange={(e) =>
                          setField(i, { brand: String(e.target.value) })
                        }
                        MenuProps={{
                          PaperProps: { style: { maxHeight: 340 } },
                        }}
                        renderValue={(selected) => {
                          const item = findById(brands, selected) || {
                            name: "Generic",
                          };
                          return (
                            <Stack
                              direction="row"
                              alignItems="center"
                              spacing={1}
                            >
                              {renderBrandBadge(item)}
                              <span>{item.name}</span>
                            </Stack>
                          );
                        }}
                      >
                        {/* Search box inside the menu */}
                        <MenuItem
                          disableGutters
                          disableRipple
                          sx={{ px: 1.5, py: 1, pointerEvents: "auto" }}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                        >
                          <TextField
                            autoFocus
                            size="small"
                            placeholder="Search brands…"
                            fullWidth
                            value={brandSearch}
                            onChange={(e) => setBrandSearch(e.target.value)}
                            onKeyDown={(e) => e.stopPropagation()}
                          />
                        </MenuItem>
                        <Divider sx={{ my: 0.5 }} />

                        <MenuItem value="">
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                          >
                            {renderBrandBadge({ name: "Generic", icon: null })}
                            <ListItemText
                              primary={<em>Default (Generic)</em>}
                            />
                          </Stack>
                        </MenuItem>

                        {filteredBrands.length === 0 ? (
                          <MenuItem disabled>No matches</MenuItem>
                        ) : (
                          filteredBrands.map((b) => (
                            <MenuItem key={b._id} value={b._id}>
                              <Stack
                                direction="row"
                                spacing={1}
                                alignItems="center"
                              >
                                {renderBrandBadge(b)}
                                <ListItemText primary={b.name} />
                              </Stack>
                            </MenuItem>
                          ))
                        )}

                        <Divider sx={{ my: 0.5 }} />
                        <MenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            setBrandRowIdx(i);
                            setOpenAddBrand(true);
                          }}
                          sx={{ fontWeight: 600 }}
                        >
                          <Add fontSize="small" style={{ marginRight: 8 }} />
                          Add new brand…
                        </MenuItem>
                      </Select>
                      <Typography
                        variant="caption"
                        sx={{ color: "text.secondary", mt: 0.5 }}
                      >
                        e.g., Lenovo, HP, Dell
                      </Typography>
                    </FormControl>
                  </Grid>
                </Grid>
              </Box>
            );
          })}
        </Stack>
      </CardContent>

      {/* (+) dialogs wired to your backend POST routes */}
      <AddCatalogItemDialog
        open={openAddDeviceType}
        onClose={() => setOpenAddDeviceType(false)}
        label="Device Type"
        postUrl="/api/add-device"
        token={
          typeof window !== "undefined" ? localStorage.getItem("token") : null
        }
        onCreated={(created) => onCreateDeviceType?.(created, deviceTypeRowIdx)}
      />
      <AddCatalogItemDialog
        open={openAddBrand}
        onClose={() => setOpenAddBrand(false)}
        label="Brand"
        postUrl="/api/add-brand"
        token={
          typeof window !== "undefined" ? localStorage.getItem("token") : null
        }
        onCreated={(created) => onCreateBrand?.(created, brandRowIdx)}
      />
    </Card>
  );
}
