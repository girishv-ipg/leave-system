// components/admin/assets/catalogUtils.js

import {
  Android,
  Apple,
  BuildCircle,
  CameraAlt,
  DesktopWindows,
  Headphones,
  Keyboard as KeyboardIcon,
  LaptopMac,
  Memory,
  Mouse,
  PhoneIphone,
  Print,
  Router as RouterIcon,
  Speaker as SpeakerIcon,
  Storage as StorageIcon,
  TabletMac,
  Tv,
  Usb as UsbIcon,
  Videocam,
  Watch as WatchIcon,
} from "@mui/icons-material";
import { Avatar, Box } from "@mui/material";

import React from "react";
import { LaptopWindows as Windows } from "@mui/icons-material";

export const isUrl = (s) =>
  typeof s === "string" && /^(https?:|data:image)/i.test(s);
export const looksEmoji = (s) =>
  typeof s === "string" &&
  s.length <= 4 &&
  /\p{Extended_Pictographic}/u.test(s);

export const Dot = ({ color = "#94a3b8" }) => (
  <Box
    component="span"
    sx={{
      display: "inline-block",
      width: 6,
      height: 6,
      borderRadius: "50%",
      bgcolor: color,
    }}
  />
);

export function CatalogIcon({ item, fallbackColor = "#2563eb", size = 22 }) {
  const icon = item?.icon;
  if (isUrl(icon)) {
    return (
      <Avatar
        src={icon}
        alt={item?.name || ""}
        sx={{ width: size, height: size }}
      />
    );
  }
  if (looksEmoji(icon)) {
    return (
      <Avatar
        sx={{
          width: size,
          height: size,
          fontSize: Math.max(14, Math.floor(size * 0.7)),
          bgcolor: "#f1f5f9",
        }}
      >
        {icon}
      </Avatar>
    );
  }
  return <Dot color={item?.color || fallbackColor} />;
}

export const deviceIconEl = (name) => {
  const n = String(name || "").toLowerCase();
  if (/(laptop|notebook|thinkpad|macbook)/.test(n))
    return <LaptopMac fontSize="small" />;
  if (/(desktop|workstation|pc)/.test(n))
    return <DesktopWindows fontSize="small" />;
  if (/(tablet|ipad)/.test(n)) return <TabletMac fontSize="small" />;
  if (/(phone|iphone|mobile)/.test(n)) return <PhoneIphone fontSize="small" />;
  if (/(ram|memory)/.test(n)) return <Memory fontSize="small" />;
  if (/(keyboard)/.test(n)) return <KeyboardIcon fontSize="small" />;
  if (/(mouse)/.test(n)) return <Mouse fontSize="small" />;
  if (/(headphone|headset|ear)/.test(n)) return <Headphones fontSize="small" />;
  if (/(printer|print)/.test(n)) return <Print fontSize="small" />;
  if (/(hdd|ssd|storage|drive)/.test(n))
    return <StorageIcon fontSize="small" />;
  if (/(router|wifi|ap|switch)/.test(n)) return <RouterIcon fontSize="small" />;
  if (/(tv|display|screen|monitor)/.test(n)) return <Tv fontSize="small" />;
  if (/(watch|wear)/.test(n)) return <WatchIcon fontSize="small" />;
  if (/(camera)/.test(n)) return <CameraAlt fontSize="small" />;
  if (/(video|webcam)/.test(n)) return <Videocam fontSize="small" />;
  if (/(speaker)/.test(n)) return <SpeakerIcon fontSize="small" />;
  if (/(usb|dongle)/.test(n)) return <UsbIcon fontSize="small" />;
  return <BuildCircle fontSize="small" />;
};

export const brandAvatarEl = (name) => {
  const letter = (String(name || "?").trim()[0] || "?").toUpperCase();
  const lower = String(name || "").toLowerCase();

  if (/apple|mac|iphone|ipad|macbook/.test(lower)) {
    return (
      <Avatar sx={{ width: 24, height: 24, bgcolor: "#111", color: "#fff" }}>
        <Apple fontSize="inherit" />
      </Avatar>
    );
  }
  if (/android/.test(lower)) {
    return (
      <Avatar sx={{ width: 24, height: 24, bgcolor: "#3ddc84", color: "#0b3" }}>
        <Android fontSize="inherit" />
      </Avatar>
    );
  }
  if (/windows|microsoft/.test(lower)) {
    return (
      <Avatar sx={{ width: 24, height: 24, bgcolor: "#0078d4", color: "#fff" }}>
        <Windows fontSize="inherit" />
      </Avatar>
    );
  }
  if (
    /(lenovo|dell|hp|acer|asus|samsung|sony|msi|xiaomi|oneplus)/.test(lower)
  ) {
    return (
      <Avatar
        sx={{
          width: 24,
          height: 24,
          bgcolor: "primary.main",
          color: "primary.contrastText",
        }}
      >
        {letter}
      </Avatar>
    );
  }
  return (
    <Avatar
      sx={{
        width: 24,
        height: 24,
        fontSize: "0.75rem",
        background:
          "linear-gradient(135deg, rgba(51,103,224,0.12), rgba(94,143,245,0.18))",
        color: "#254",
        border: "1px solid rgba(51,103,224,0.20)",
      }}
    >
      {letter}
    </Avatar>
  );
};

export const findById = (arr, id) => (arr || []).find((x) => x._id === id);

export const normalizeCatalog = (items = []) =>
  (Array.isArray(items) ? items : []).map((it) => {
    const _id =
      it?._id ??
      it?.id ??
      it?.deviceId ??
      it?.brandId ??
      String(it?.name || it?.deviceName || it?.brandName || Math.random());
    const name = it?.name ?? it?.deviceName ?? it?.brandName ?? "Unnamed";
    const icon = it?.icon ?? it?.emoji ?? it?.logo ?? null;
    const isActive = it?.isActive ?? true;
    const color = it?.color ?? it?.accent ?? null;
    return { _id, name, icon, isActive, color, raw: it };
  });

/** Resolve device type -> {_id, name, icon} */
export const getDeviceTypeItem = (s, deviceTypesArr = []) => {
  if (s?.deviceType && typeof s.deviceType === "object") {
    return {
      _id: s.deviceType._id,
      name: s.deviceType.name || "Unknown",
      icon:
        s.deviceType.icon || s.deviceType.logo || s.deviceType.emoji || null,
    };
  }
  if (s?.deviceType) {
    const byId = (deviceTypesArr || []).find((d) => d._id === s.deviceType);
    if (byId) return byId;
  }
  return { name: s?.deviceTypeName || "Unknown", icon: null };
};

/** Resolve brand -> {_id, name, icon} */
export const getBrandItem = (s, brandsArr = []) => {
  if (s?.brand && typeof s.brand === "object") {
    return {
      _id: s.brand._id,
      name: s.brand.name || "Generic",
      icon: s.brand.icon || s.brand.logo || s.brand.emoji || null,
    };
  }
  if (s?.brand) {
    const byId = (brandsArr || []).find((b) => b._id === s.brand);
    if (byId) return byId;
  }
  return { name: s?.brandName || "Generic", icon: null };
};
