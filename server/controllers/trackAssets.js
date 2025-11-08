const { ObjectId } = require("mongodb");
// const { getDb } = require("../lib/mongo");
const Assets = require("../models/assets");
const User = require("../models/user");
const DeviceType = require("../models/deviceType");
const Brand = require("../models/brand");

// submit new asset information
const submitAssetInformation = async (req, res) => {
  try {
    const user = req.user;
    console.log("Incoming Asset Data:", req.body);

    const {
      name,
      type,
      description,
      serialNumbers, // updated field
      purchaseDate,
      location,
      value,
      status,
      assignedTo,
      tags,
    } = req.body;

    // Basic validation
    if (!name || !type) {
      return res.status(400).json({ error: "Name and type are required." });
    }

    // Validate serialNumbers array if provided
    if (serialNumbers && !Array.isArray(serialNumbers)) {
      return res.status(400).json({ error: "serialNumbers must be an array." });
    }

    // Check assigned user (optional)
    let assignedUser = null;
    if (assignedTo) {
      assignedUser = await User.findOne({ employeeCode: assignedTo }).select(
        "-password"
      );
      if (!assignedUser) {
        return res.status(404).json({ error: "Assigned user not found." });
      }
    }

    // Construct the new asset document
    const newAsset = new Assets({
      name: name.trim(),
      type,
      description: description?.trim() || "",
      serialNumbers: Array.isArray(serialNumbers)
        ? serialNumbers.map((s) => ({
            deviceType: s.deviceType,
            brand: s.brand,
            serial: s.serial?.trim(),
            notes: s.notes?.trim() || "",
          }))
        : [],
      purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
      location: location?.trim() || "",
      value: value ? Number(value) : 0,
      status: status || "Active",
      assignedTo: assignedUser ? assignedUser.employeeCode : null,
      tags: Array.isArray(tags) ? tags : [],
      isDeleted: false,
      createdBy: user?._id || null, // optional if you track who added it
    });

    // Save the new asset
    const result = await newAsset.save();

    res.status(201).json({
      message: "✅ Asset saved successfully",
      assetId: result._id,
      asset: result,
    });
  } catch (error) {
    console.error("❌ Asset submission failed:", error);

    // Handle duplicate key errors (unique compound index violation)
    if (error.code === 11000) {
      return res.status(409).json({
        error:
          "Duplicate deviceType-brand-serial combination detected. Each serial must be unique across all assets.",
      });
    }

    res.status(500).json({ error: error.message });
  }
};

// Get All Assets
const getAllAssets = async (req, res) => {
  try {
    const { employeeCode, role } = req.query;
    let assets = [];

    if (
      role === "admin" ||
      role === "manager" ||
      role === "hr" ||
      role === "finance"
    ) {
      // Admins/managers can see all assets
      assets = await Assets.find({ isDeleted: { $ne: true } }).exec();
    } else {
      // Employees see only their own asset
      assets = await Assets.find({
        $and: [
          { isDeleted: { $ne: true } },
          {
            $or: [{ assignedTo: employeeCode }],
          },
          { assignedTo: { $ne: null } }, // exclude null or unassigned
        ],
      }).exec();
    }

    res.status(200).json(assets);
  } catch (error) {
    console.error("Failed to fetch assets:", error);
    res.status(500).json({
      error: "Failed to fetch assets",
      details: error.message,
    });
  }
};

// READ ONE: Get Asset by ID
const getAssetById = async (req, res) => {
  try {
    //   const db = await getDb();
    const assetId = req.params.id;

    if (!ObjectId.isValid(assetId)) {
      return res.status(400).json({ error: "Invalid asset ID" });
    }

    // Find the asset by ID and check if it's not deleted
    const asset = await Assets.findOne({
      _id: assetId, // Mongoose will automatically handle ObjectId conversion
      isDeleted: { $ne: true },
    });

    if (!asset) {
      return res.status(404).json({ error: "Asset not found" });
    }

    res.status(200).json(asset);
  } catch (error) {
    console.error("Failed to fetch asset:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch asset", details: error.message });
  }
};

// UPDATE: Update Asset by ID
const updateAssetById = async (req, res) => {
  try {
    // const db = await getDb();
    const assetId = req.params.id;

    if (!ObjectId.isValid(assetId)) {
      return res.status(400).json({ error: "Invalid asset ID" });
    }

    const updateFields = { ...req.body, updatedAt: new Date() };

    if (updateFields.assignedTo) {
      updateFields.assignedTo = updateFields.assignedTo;
    }

    if (updateFields.purchaseDate) {
      updateFields.purchaseDate = new Date(updateFields.purchaseDate);
    }

    // Use Mongoose's findOneAndUpdate with the { new: true } option to return the updated document
    const result = await Assets.findOneAndUpdate(
      { _id: assetId, isDeleted: { $ne: true } }, // Ensure asset is not deleted
      { $set: updateFields },
      { new: true } // This returns the updated asset
    );

    if (!result) {
      return res.status(404).json({ error: "Asset not found" });
    }

    res.status(200).json({
      message: "Asset updated successfully",
      asset: result,
    });
  } catch (error) {
    console.error("Failed to update asset:", error);
    res
      .status(500)
      .json({ error: "Failed to update asset", details: error.message });
  }
};

const deleteAssetById = async (req, res) => {
  try {
    // const db = await getDb();
    const assetId = req.params.id;

    if (!ObjectId.isValid(assetId)) {
      return res.status(400).json({ error: "Invalid asset ID" });
    }

    // Soft delete the asset by marking it as isDeleted = true
    const result = await Assets.findOneAndUpdate(
      { _id: assetId, isDeleted: { $ne: true } }, // Only update if not already deleted
      {
        $set: {
          isDeleted: true,
          updatedAt: new Date(),
        },
      },
      { new: true } // Return the updated asset
    );

    if (!result) {
      return res
        .status(404)
        .json({ error: "Asset not found or already deleted" });
    }

    res.status(200).json({
      message: "Asset soft-deleted successfully",
      asset: result,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to soft-delete asset", details: error.message });
  }
};

/**
 * Get all device names — always includes defaults
 */
const getAllDeviceName = async (req, res) => {
  try {
    // Define your default device names
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

    // Fetch all existing devices from DB
    const existingDevices = await DeviceType.find().exec();
    const existingNames = existingDevices.map((d) =>
      d.name.trim().toLowerCase()
    );

    // Determine which default devices are missing
    const missingDevices = defaultDevices.filter(
      (d) => !existingNames.includes(d.toLowerCase())
    );

    // If some defaults are missing, insert them automatically
    if (missingDevices.length > 0) {
      const toInsert = missingDevices.map((name) => ({
        name,
        isActive: true,
        icon: "",
        assetCategory: "Hardware", // optional: default category
      }));
      await DeviceType.insertMany(toInsert);
    }

    // Re-fetch all devices (including newly added defaults)
    const allDevices = await DeviceType.find().sort({ name: 1 }).exec();

    return res.status(200).json(allDevices);
  } catch (error) {
    console.error("Error fetching device names:", error);
    return res.status(500).json({
      message: "Internal server error while fetching device names",
      error: error.message,
    });
  }
};

/**
 * Get all brand names — always includes defaults
 */
const getAllBrandName = async (req, res) => {
  try {
    // Define default brand list
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

    // Fetch existing brands
    const existingBrands = await Brand.find().exec();
    const existingNames = existingBrands.map((b) =>
      b.name.trim().toLowerCase()
    );

    // Identify missing defaults
    const missingBrands = defaultBrands.filter(
      (b) => !existingNames.includes(b.toLowerCase())
    );

    // Insert missing ones if any
    if (missingBrands.length > 0) {
      const toInsert = missingBrands.map((name) => ({
        name,
        isActive: true,
      }));
      await Brand.insertMany(toInsert);
    }

    // Fetch final sorted list
    const allBrands = await Brand.find().sort({ name: 1 }).exec();

    return res.status(200).json(allBrands);
  } catch (error) {
    console.error("Error fetching brand names:", error);
    return res.status(500).json({
      message: "Internal server error while fetching brand names",
      error: error.message,
    });
  }
};

/**
 * Create a new brand
 */
const createBrand = async (req, res) => {
  try {
    const { name, isActive } = req.body;

    if (!name || typeof name !== "string") {
      return res
        .status(400)
        .json({ message: "Brand name is required and must be a string" });
    }

    const existingBrand = await Brand.findOne({ name: name.trim() });
    if (existingBrand) {
      return res.status(409).json({ message: "Brand already exists" });
    }

    const brand = new Brand({
      name: name.trim(),
      isActive: isActive !== undefined ? isActive : true,
    });

    const savedBrand = await brand.save();
    return res.status(201).json(savedBrand);
  } catch (error) {
    console.error("Error creating brand:", error);
    return res
      .status(500)
      .json({ message: "Failed to create brand", error: error.message });
  }
};

/**
 * Create a new device type
 */
const createDeviceType = async (req, res) => {
  try {
    const { name, icon, isActive } = req.body;

    if (!name || typeof name !== "string") {
      return res
        .status(400)
        .json({ message: "Device type name is required and must be a string" });
    }

    const existingDevice = await DeviceType.findOne({ name: name.trim() });
    if (existingDevice) {
      return res.status(409).json({ message: "Device type already exists" });
    }

    const deviceType = new DeviceType({
      name: name.trim(),
      icon: icon?.trim(),
      isActive: isActive !== undefined ? isActive : true,
    });

    const savedDeviceType = await deviceType.save();
    return res.status(201).json(savedDeviceType);
  } catch (error) {
    console.error("Error creating device type:", error);
    return res
      .status(500)
      .json({ message: "Failed to create device type", error: error.message });
  }
};

// export services
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
};
