import {
  Alert,
  Avatar,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";

import { Add } from "@mui/icons-material";
import React from "react";
import axiosInstance from "@/utils/helpers";

export default function AddCatalogItemDialog({
  open,
  onClose,
  label,
  postUrl,
  token,
  onCreated,
}) {
  const [name, setName] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState("");
  const [fieldError, setFieldError] = React.useState(false);

  const canSave = name.trim().length > 0 && !saving;

  React.useEffect(() => {
    if (!open) {
      setName("");
      setSaving(false);
      setErrorMsg("");
      setFieldError(false);
    }
  }, [open]);

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    setErrorMsg("");
    setFieldError(false);

    try {
      const res = await axiosInstance.post(
        postUrl,
        { name: name.trim() },
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
      );

      const raw = res.data;
      const created = {
        _id: raw?._id ?? raw?.id ?? name.trim(),
        name: raw?.name ?? name.trim(),
        icon: raw?.icon ?? raw?.emoji ?? raw?.logo ?? null,
        isActive: raw?.isActive,
        color: raw?.color ?? raw?.accent ?? null,
        raw,
      };

      onCreated?.(created);
      onClose();
    } catch (e) {
      const status = e?.response?.status;
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        `Failed to add ${label.toLowerCase()}`;
      if (status === 409) {
        setErrorMsg(`${label} already exists`);
        setFieldError(true);
      } else if (status === 400) {
        setErrorMsg(
          e?.response?.data?.message ||
            `${label} name is required and must be a string`
        );
        setFieldError(true);
      } else if (status === 401 || status === 403) {
        setErrorMsg("You’re not authorized. Please login again.");
      } else if (status === 500) {
        setErrorMsg(`Server error: ${msg}`);
      } else {
        setErrorMsg(msg);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Add {label}</DialogTitle>
      <DialogContent sx={{ pt: 1.5 }}>
        {errorMsg && (
          <Alert
            severity="error"
            variant="outlined"
            sx={{ mb: 1.5, borderRadius: 2 }}
          >
            {errorMsg}
          </Alert>
        )}
        <TextField
          autoFocus
          fullWidth
          label={`${label} name`}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (errorMsg) {
              setErrorMsg("");
              setFieldError(false);
            }
          }}
          error={fieldError}
          helperText={
            fieldError
              ? errorMsg || `Please enter a valid ${label.toLowerCase()} name`
              : `Create a new ${label.toLowerCase()} for quick reuse`
          }
          sx={{ mt: 0.5 }}
        />
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={save}
          disabled={!canSave}
          startIcon={saving ? <CircularProgress size={16} /> : <Add />}
          sx={{ borderRadius: "10px", fontWeight: 700 }}
        >
          {saving ? "Saving..." : "Add"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
