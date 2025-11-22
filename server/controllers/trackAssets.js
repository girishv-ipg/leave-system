// services/assets.service.js
const { ObjectId } = require("mongodb");
const Assets = require("../models/assets");
const User = require("../models/user");
const DeviceType = require("../models/deviceType");
const Brand = require("../models/brand");

// helpers: extract user either from req.user or from request body
const extractUserFromRequest = (req) => {
  // if you later add authenticate middleware, this will work automatically
  if (req.user) return req.user;

  // preferred: front-end sends { user: {...} } in body
  if (req.body && req.body.user) {
    return req.body.user;
  }

  // fallback: maybe user fields are at root of body
  const { userId, _id, id, role, name, email, employeeCode } = req.body || {};

  if (!userId && !_id && !id && !role && !name && !email && !employeeCode) {
    return null;
  }

  const uid = _id || userId || id;

  return {
    _id: uid,
    id: uid,
    role,
    name,
    email,
    employeeCode,
  };
};

/* -------------------- helpers -------------------- */
function roleOf(userOrString) {
  const r =
    typeof userOrString === "string" ? userOrString : userOrString?.role;
  return String(r || "")
    .trim()
    .toLowerCase();
}

/**
 * Check if user has privileged role (non-employee).
 * You can adjust the list as per your system.
 */
const isPrivilegedRole = (user) => {
  const role = String(user?.role || "")
    .trim()
    .toLowerCase();
  return ["admin", "manager", "hr", "finance"].includes(role);
};

function canEmployeeActOnAsset({ asset, user }) {
  if (!user) return false;
  const role = roleOf(user);
  if (role !== "employee") return true; // admins/managers/etc can act
  return (
    asset?.assignedTo &&
    String(asset.assignedTo).toLowerCase() ===
      String(user.employeeCode || "").toLowerCase()
  );
}
/**
 * Normalize any status to lower-case, with a safe fallback.
 * Used to handle null/undefined/empty/extra spaces gracefully.
 */
const normalizeStatus = (value, fallback = "Pending") =>
  String(value || fallback)
    .trim()
    .toLowerCase();

/**
 * Given an array of serials, recompute the assetStatus:
 * - If any device is Pending -> "Pending"
 * - Else if all Accepted      -> "Accepted"
 * - Else if all Rejected      -> "Rejected"
 * - Else (mix of A/R, no P)   -> "Rejected"
 */
const computeAssetStatusFromDevices = (serials) => {
  if (!Array.isArray(serials) || serials.length === 0) {
    // If no devices, we won't force any status here;
    // caller can decide what to do (often keep current).
    return null;
  }

  const normalizedStatuses = serials.map((s) =>
    normalizeStatus(s.deviceStatus, "Pending")
  );

  const anyPending = normalizedStatuses.includes("pending");
  const allAccepted =
    !anyPending && normalizedStatuses.every((st) => st === "accepted");
  const allRejected =
    !anyPending && normalizedStatuses.every((st) => st === "rejected");

  if (anyPending) return "Pending";
  if (allAccepted) return "Accepted";
  if (allRejected) return "Rejected";

  // Mixed Accepted + Rejected but no Pending -> treat asset as Rejected
  return "Rejected";
};

/**
 * Check if a string is a valid approval decision.
 */
const isApproval = (value) => {
  const v = String(value || "")
    .trim()
    .toLowerCase();
  return v === "accepted" || v === "rejected";
};

/* -------------------- create -------------------- */
const submitAssetInformation = async (req, res) => {
  try {
    const user = req.user || null;
    const {
      name,
      type,
      description,
      serialNumbers,
      purchaseDate,
      location,
      value,
      status, // lifecycle (optional) -> default "Active"
      assetStatus, // approval (optional) -> default "Pending"
      assignedTo, // employeeCode string
      tags,
    } = req.body;

    if (!name || !type) {
      return res.status(400).json({ error: "Name and type are required." });
    }
    if (serialNumbers && !Array.isArray(serialNumbers)) {
      return res.status(400).json({ error: "serialNumbers must be an array." });
    }

    // Optional: verify assigned user exists
    let assignedUser = null;
    if (assignedTo) {
      assignedUser = await User.findOne({ employeeCode: assignedTo }).select(
        "name employeeCode"
      );
      if (!assignedUser)
        return res.status(404).json({ error: "Assigned user not found." });
    }

    const doc = new Assets({
      name: String(name).trim(),
      type,
      description: description?.trim() || "",
      serialNumbers: Array.isArray(serialNumbers)
        ? serialNumbers.map((s) => ({
            deviceType: s.deviceType,
            brand: s.brand,
            serial: s.serial?.trim(),
            notes: s.notes?.trim() || "",
            deviceStatus: s.deviceStatus || "Pending",
          }))
        : [],
      purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
      location: location?.trim() || "",
      value: value ? Number(value) : 0,
      status: status || "Active", // lifecycle default
      assetStatus: assetStatus || "Pending", // approval default
      assignedTo: assignedUser ? assignedUser.employeeCode : null,
      tags: Array.isArray(tags) ? tags : [],
      isDeleted: false,
      createdBy: user?._id || null,
    });

    const saved = await doc.save();
    return res
      .status(201)
      .json({ message: "✅ Asset saved", assetId: saved._id, asset: saved });
  } catch (error) {
    console.error("submitAssetInformation failed:", error);
    if (error?.code === 11000) {
      return res.status(409).json({
        error:
          "Duplicate deviceType-brand-serial combination detected. Each serial must be unique across all assets.",
      });
    }
    return res.status(500).json({ error: error.message });
  }
};

/* -------------------- read -------------------- */
const getAllAssets = async (req, res) => {
  try {
    const { employeeCode, role } = req.query;
    let assets = [];

    if (["admin", "manager", "hr", "finance"].includes(String(role))) {
      assets = await Assets.find({ isDeleted: { $ne: true } })
        .sort({ createdAt: -1 })
        .exec();
    } else {
      assets = await Assets.find({
        $and: [
          { isDeleted: { $ne: true } },
          { assignedTo: employeeCode },
          { assignedTo: { $ne: null } },
        ],
      })
        .sort({ createdAt: -1 })
        .exec();
    }

    return res.status(200).json(assets);
  } catch (error) {
    console.error("getAllAssets failed:", error);
    return res
      .status(500)
      .json({ error: "Failed to fetch assets", details: error.message });
  }
};

const getAssetById = async (req, res) => {
  try {
    const assetId = req.params.id;
    if (!ObjectId.isValid(assetId))
      return res.status(400).json({ error: "Invalid asset ID" });

    const asset = await Assets.findOne({
      _id: assetId,
      isDeleted: { $ne: true },
    });
    if (!asset) return res.status(404).json({ error: "Asset not found" });

    return res.status(200).json(asset);
  } catch (error) {
    console.error("getAssetById failed:", error);
    return res
      .status(500)
      .json({ error: "Failed to fetch asset", details: error.message });
  }
};

/* -------------------- update (general) -------------------- */
const updateAssetById = async (req, res) => {
  try {
    const assetId = req.params.id;
    if (!ObjectId.isValid(assetId))
      return res.status(400).json({ error: "Invalid asset ID" });

    const updateFields = { ...req.body, updatedAt: new Date() };
    if (updateFields.purchaseDate)
      updateFields.purchaseDate = new Date(updateFields.purchaseDate);
    if (
      updateFields.serialNumbers &&
      !Array.isArray(updateFields.serialNumbers)
    ) {
      return res.status(400).json({ error: "serialNumbers must be an array." });
    }

    const result = await Assets.findOneAndUpdate(
      { _id: assetId, isDeleted: { $ne: true } },
      { $set: updateFields },
      { new: true, runValidators: true }
    );
    if (!result) return res.status(404).json({ error: "Asset not found" });

    return res.status(200).json({ message: "Asset updated", asset: result });
  } catch (error) {
    console.error("updateAssetById failed:", error);
    if (error?.code === 11000) {
      return res.status(409).json({
        error:
          "Duplicate deviceType-brand-serial combination detected. Each serial must be unique across all assets.",
      });
    }
    return res
      .status(500)
      .json({ error: "Failed to update asset", details: error.message });
  }
};

/* -------------------- delete (soft) -------------------- */
const deleteAssetById = async (req, res) => {
  try {
    const assetId = req.params.id;
    if (!ObjectId.isValid(assetId))
      return res.status(400).json({ error: "Invalid asset ID" });

    const result = await Assets.findOneAndUpdate(
      { _id: assetId, isDeleted: { $ne: true } },
      { $set: { isDeleted: true, updatedAt: new Date() } },
      { new: true }
    );
    if (!result)
      return res
        .status(404)
        .json({ error: "Asset not found or already deleted" });

    return res
      .status(200)
      .json({ message: "Asset soft-deleted", asset: result });
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Failed to soft-delete asset", details: error.message });
  }
};

/* -------------------- catalog -------------------- */
const getAllDeviceName = async (_req, res) => {
  try {
    const defaultDevices = [
      "Laptop",
      "Desktop",
      "Monitor",
      "Docking Station",
      "Keyboard",
      "Mouse",
      "Headset",
      "Server",
    ];
    const existing = await DeviceType.find().exec();
    const existingNames = new Set(
      existing.map((d) => d.name.trim().toLowerCase())
    );
    const missing = defaultDevices.filter(
      (d) => !existingNames.has(d.toLowerCase())
    );
    if (missing.length > 0) {
      await DeviceType.insertMany(
        missing.map((name) => ({
          name,
          isActive: true,
          icon: "",
          assetCategory: "Hardware",
        }))
      );
    }
    const all = await DeviceType.find().sort({ name: 1 }).exec();
    return res.status(200).json(all);
  } catch (error) {
    console.error("getAllDeviceName failed:", error);
    return res
      .status(500)
      .json({ message: "Error fetching device names", error: error.message });
  }
};

const getAllBrandName = async (_req, res) => {
  try {
    const defaultBrands = [
      "Dell",
      "HP",
      "Lenovo",
      "Logitech",
      "MSI",
      "Asus",
      "Acer",
      "Fortinet",
    ];
    const existing = await Brand.find().exec();
    const existingNames = new Set(
      existing.map((b) => b.name.trim().toLowerCase())
    );
    const missing = defaultBrands.filter(
      (b) => !existingNames.has(b.toLowerCase())
    );
    if (missing.length > 0) {
      await Brand.insertMany(missing.map((name) => ({ name, isActive: true })));
    }
    const all = await Brand.find().sort({ name: 1 }).exec();
    return res.status(200).json(all);
  } catch (error) {
    console.error("getAllBrandName failed:", error);
    return res
      .status(500)
      .json({ message: "Error fetching brand names", error: error.message });
  }
};

const createBrand = async (req, res) => {
  try {
    const { name, isActive } = req.body;
    if (!name || typeof name !== "string") {
      return res
        .status(400)
        .json({ message: "Brand name is required and must be a string" });
    }
    const existing = await Brand.findOne({ name: name.trim() });
    if (existing)
      return res.status(409).json({ message: "Brand already exists" });

    const saved = await new Brand({
      name: name.trim(),
      isActive: isActive ?? true,
    }).save();
    return res.status(201).json(saved);
  } catch (error) {
    console.error("createBrand failed:", error);
    return res
      .status(500)
      .json({ message: "Failed to create brand", error: error.message });
  }
};

const createDeviceType = async (req, res) => {
  try {
    const { name, icon, isActive } = req.body;
    if (!name || typeof name !== "string") {
      return res.status(400).json({
        message: "Device type name is required and must be a string",
      });
    }
    const existing = await DeviceType.findOne({ name: name.trim() });
    if (existing)
      return res.status(409).json({ message: "Device type already exists" });

    const saved = await new DeviceType({
      name: name.trim(),
      icon: icon?.trim() || "",
      isActive: isActive ?? true,
    }).save();
    return res.status(201).json(saved);
  } catch (error) {
    console.error("createDeviceType failed:", error);
    return res.status(500).json({
      message: "Failed to create device type",
      error: error.message,
    });
  }
};
/* -----------------------------------------------------
 * PATCH /api/assets/:id/status
 * Body: { decision: "Accepted" | "Rejected" }
 *
 * Rules:
 *  - Only privileged roles.
 *  - Always set asset.assetStatus to decision (no "already decided" 409).
 *  - For each device whose deviceStatus is Pending (or empty) -> set to decision.
 *  - Rejected assets can move back to Pending/Accepted later via other flows.
 * --------------------------------------------------- */
const updateAssetStatus = async (req, res) => {
  try {
    const assetId = req.params.id;
    const { decision } = req.body;

    // 🔑 READ USER FROM REQUEST (body or req.user)
    const user = extractUserFromRequest(req);
    // console.log("updateAssetStatus -> user:", user, "body:", req.body);

    if (!ObjectId.isValid(assetId)) {
      return res.status(400).json({ error: "Invalid asset ID" });
    }

    if (!isApproval(decision)) {
      return res
        .status(400)
        .json({ error: 'decision must be "Accepted" or "Rejected"' });
    }

    // 🔐 Only non-employee roles can update approval status
    if (!isPrivilegedRole(user)) {
      return res.status(403).json({
        error: "Not allowed to update this asset (insufficient role)",
      });
    }

    const asset = await Assets.findOne({
      _id: assetId,
      isDeleted: { $ne: true },
    });

    if (!asset) {
      return res.status(404).json({ error: "Asset not found" });
    }

    const now = new Date();
    const normalizedDecision =
      normalizeStatus(decision) === "accepted" ? "Accepted" : "Rejected";

    // Set asset status directly
    asset.assetStatus = normalizedDecision;

    // Cascade to PENDING devices only
    (asset.serialNumbers || []).forEach((s) => {
      const devStatus = normalizeStatus(s.deviceStatus, "Pending");
      if (devStatus === "pending") {
        s.deviceStatus = normalizedDecision; // Accepted/Rejected
        s.decidedAt = now;
        if (user?._id) s.decidedBy = user._id;
      }
    });

    asset.updatedBy = user?._id || asset.updatedBy;
    asset.updatedAt = now;

    await asset.save();
    return res
      .status(200)
      .json({ message: `Asset ${normalizedDecision}`, asset });
  } catch (error) {
    console.error("updateAssetStatus failed:", error);
    return res.status(500).json({
      error: "Failed to update asset approval",
      details: error.message,
    });
  }
};

/* -----------------------------------------------------
 * PATCH /api/assets/:id/serials/:serialId/status
 * Body: { decision: "Accepted" | "Rejected" }
 *
 * Rules:
 *  - Only privileged roles.
 *  - Only devices currently Pending (or empty) can be updated.
 *  - After updating one device:
 *      * If ANY device is Pending -> asset.assetStatus = "Pending"
 *      * Else if ALL devices are Accepted -> asset.assetStatus = "Accepted"
 *      * Else if ALL devices are Rejected -> asset.assetStatus = "Rejected"
 *      * Else (mix of Accepted & Rejected, no Pending) -> asset.assetStatus = "Rejected"
 *
 * Examples:
 *  - 5 devices, approve 1, others still Pending -> assetStatus = "Pending"
 *  - All 5 Rejected -> assetStatus = "Rejected"
 *  - All 5 Accepted -> assetStatus = "Accepted"
 * --------------------------------------------------- */
const updateDeviceStatus = async (req, res) => {
  try {
    const { id: assetId, serialId } = req.params;
    const { decision } = req.body;

    // 🔑 READ USER FROM REQUEST (body or req.user)
    const user = extractUserFromRequest(req);
    // console.log("updateDeviceStatus -> user:", user);
    // console.log("updateDeviceStatus -> params:", req.params);

    if (!ObjectId.isValid(assetId)) {
      return res.status(400).json({ error: "Invalid asset ID" });
    }

    // serialId may be either a subdoc _id or a serial string
    if (!serialId) {
      return res.status(400).json({ error: "serialId is required" });
    }

    if (!isApproval(decision)) {
      return res
        .status(400)
        .json({ error: 'decision must be "Accepted" or "Rejected"' });
    }

    // 🔐 Only non-employee roles can update device approval
    if (!isPrivilegedRole(user)) {
      return res.status(403).json({
        error: "Not allowed to update this device (insufficient role)",
      });
    }

    const asset = await Assets.findOne({
      _id: assetId,
      isDeleted: { $ne: true },
    });

    if (!asset) {
      return res.status(404).json({ error: "Asset not found" });
    }

    const serials = asset.serialNumbers || [];

    // 🔍 DEBUG: log what serials we actually have
    // console.log(
    //   "updateDeviceStatus -> available serials:",
    //   serials.map((s) => ({
    //     _id: s._id,
    //     serial: s.serial,
    //     deviceStatus: s.deviceStatus,
    //   }))
    // );

    // 1) Try match by subdocument _id
    let entry = serials.find((s) => String(s._id) === String(serialId));

    // 2) Fallback: try match by serial string itself
    if (!entry) {
      entry = serials.find((s) => String(s.serial) === String(serialId));
    }

    if (!entry) {
      return res.status(404).json({
        error: "Device (serial) not found",
        details: {
          assetId,
          serialId,
        },
      });
    }

    // Only update if device is currently Pending (or empty)
    const currentDevStatus = normalizeStatus(entry.deviceStatus, "Pending");
    if (currentDevStatus !== "pending") {
      return res.status(409).json({
        error: `Device already ${entry.deviceStatus || "decided"}`,
      });
    }

    const now = new Date();
    const normalizedDecision =
      normalizeStatus(decision) === "accepted" ? "Accepted" : "Rejected";

    // ✅ Update this device
    entry.deviceStatus = normalizedDecision;
    entry.decidedAt = now;
    if (user?._id) entry.decidedBy = user._id;

    // ✅ Recompute asset.assetStatus from all serials
    const newAssetStatus = computeAssetStatusFromDevices(serials);
    if (newAssetStatus) {
      asset.assetStatus = newAssetStatus;
    }

    asset.updatedBy = user?._id || asset.updatedBy;
    asset.updatedAt = now;

    await asset.save();
    return res
      .status(200)
      .json({ message: `Device ${normalizedDecision}`, asset });
  } catch (error) {
    console.error("updateDeviceStatus failed:", error);
    return res.status(500).json({
      error: "Failed to update device approval",
      details: error.message,
    });
  }
};

/**
 * EMPLOYEE ENDPOINT
 * PATCH /api/assets/:id/employee-status
 * Body: { decision: "Accepted" | "Rejected", user: { _id, employeeCode, ... } }
 *
 * Semantics:
 * - Only the assigned employee (asset.assignedTo === user.employeeCode) can use this.
 * - Works on the SAME fields as admin:
 *      assetStatus (asset) + deviceStatus (each serial)
 * - Action:
 *      - For each device whose deviceStatus is Pending -> set to decision
 *      - Recompute assetStatus from deviceStatus of all serials
 */
const updateEmployeeAssetStatus = async (req, res) => {
  try {
    const assetId = req.params.id;
    const { decision, user } = req.body;

    if (!ObjectId.isValid(assetId)) {
      return res.status(400).json({ error: "Invalid asset ID" });
    }

    if (!isApproval(decision)) {
      return res
        .status(400)
        .json({ error: 'decision must be "Accepted" or "Rejected"' });
    }

    if (!user || !user.employeeCode) {
      return res.status(400).json({
        error: "user with employeeCode is required in body",
      });
    }

    const asset = await Assets.findOne({
      _id: assetId,
      isDeleted: { $ne: true },
    });

    if (!asset) {
      return res.status(404).json({ error: "Asset not found" });
    }

    // ✅ Only assigned employee can act here
    const isAssignedToThisEmployee =
      String(asset.assignedTo || "").toLowerCase() ===
      String(user.employeeCode || "").toLowerCase();

    if (!isAssignedToThisEmployee) {
      return res.status(403).json({
        error:
          "You are not the assigned employee for this asset, so you cannot change its status.",
      });
    }

    const now = new Date();
    const normalizedDecision =
      normalizeStatus(decision) === "accepted" ? "Accepted" : "Rejected";

    // 🔹 Update PENDING devices to the employee's decision
    const serials = asset.serialNumbers || [];
    serials.forEach((s) => {
      const current = normalizeStatus(s.deviceStatus, "Pending");
      if (current === "pending") {
        s.deviceStatus = normalizedDecision;
        s.decidedAt = now;
        s.decidedBy = user._id || user.id || null;
      }
    });

    // 🔹 Recompute assetStatus from deviceStatus
    const newAssetStatus = computeAssetStatusFromDevices(serials);
    if (newAssetStatus) {
      asset.assetStatus = newAssetStatus;
    }

    asset.updatedAt = now;
    asset.updatedBy = user._id || user.id || null;

    await asset.save();
    return res.status(200).json({
      message: `Employee set asset to ${asset.assetStatus}`,
      asset,
    });
  } catch (error) {
    console.error("updateEmployeeAssetStatus failed:", error);
    return res.status(500).json({
      error: "Failed to update employee asset status",
      details: error.message,
    });
  }
};

/**
 * EMPLOYEE ENDPOINT
 * PATCH /api/assets/:id/serials/:serialId/employee-status
 * Body: { decision: "Accepted" | "Rejected", user: { _id, employeeCode, ... } }
 *
 * Semantics:
 * - Only the assigned employee (asset.assignedTo === user.employeeCode).
 * - Works on the SAME fields:
 *      deviceStatus on that device + recompute assetStatus.
 */
const updateEmployeeDeviceStatus = async (req, res) => {
  try {
    const { id: assetId, serialId } = req.params;
    const { decision, user } = req.body;

    if (!ObjectId.isValid(assetId)) {
      return res.status(400).json({ error: "Invalid asset ID" });
    }
    if (!serialId) {
      return res.status(400).json({ error: "serialId is required" });
    }

    if (!isApproval(decision)) {
      return res
        .status(400)
        .json({ error: 'decision must be "Accepted" or "Rejected"' });
    }

    if (!user || !user.employeeCode) {
      return res.status(400).json({
        error: "user with employeeCode is required in body",
      });
    }

    const asset = await Assets.findOne({
      _id: assetId,
      isDeleted: { $ne: true },
    });

    if (!asset) {
      return res.status(404).json({ error: "Asset not found" });
    }

    // ✅ Only assigned employee can act
    const isAssignedToThisEmployee =
      String(asset.assignedTo || "").toLowerCase() ===
      String(user.employeeCode || "").toLowerCase();

    if (!isAssignedToThisEmployee) {
      return res.status(403).json({
        error:
          "You are not the assigned employee for this asset, so you cannot change device status.",
      });
    }

    const serials = asset.serialNumbers || [];

    // console.log(
    //   "updateEmployeeDeviceStatus -> serials:",
    //   serials.map((s) => ({
    //     _id: s._id,
    //     serial: s.serial,
    //     deviceStatus: s.deviceStatus,
    //   }))
    // );

    // find serial by _id or serial string
    let entry = serials.find((s) => String(s._id) === String(serialId));
    if (!entry) {
      entry = serials.find((s) => String(s.serial) === String(serialId));
    }

    if (!entry) {
      return res.status(404).json({
        error: "Device (serial) not found",
        details: { assetId, serialId },
      });
    }

    const currentStatus = normalizeStatus(entry.deviceStatus, "Pending");
    if (currentStatus !== "pending") {
      return res.status(409).json({
        error: `Device already ${entry.deviceStatus || "decided"}`,
      });
    }

    const now = new Date();
    const normalizedDecision =
      normalizeStatus(decision) === "accepted" ? "Accepted" : "Rejected";

    // 🔹 Update this device only
    entry.deviceStatus = normalizedDecision;
    entry.decidedAt = now;
    entry.decidedBy = user._id || user.id || null;

    // 🔹 Recompute assetStatus from all deviceStatus
    const newAssetStatus = computeAssetStatusFromDevices(serials);
    if (newAssetStatus) {
      asset.assetStatus = newAssetStatus;
    }

    asset.updatedAt = now;
    asset.updatedBy = user._id || user.id || null;

    await asset.save();
    return res.status(200).json({
      message: `Employee set device to ${normalizedDecision}`,
      asset,
    });
  } catch (error) {
    console.error("updateEmployeeDeviceStatus failed:", error);
    return res.status(500).json({
      error: "Failed to update employee device status",
      details: error.message,
    });
  }
};

module.exports = {
  submitAssetInformation,
  getAllAssets,
  getAssetById,
  updateAssetById,
  deleteAssetById,
  getAllDeviceName,
  getAllBrandName,
  createBrand,
  createDeviceType,
  updateAssetStatus, // approval endpoint
  updateDeviceStatus, // approval endpoint
  updateEmployeeAssetStatus,
  updateEmployeeDeviceStatus,
};
