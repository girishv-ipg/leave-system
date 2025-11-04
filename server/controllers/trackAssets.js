const { ObjectId } = require("mongodb");
// const { getDb } = require("../lib/mongo");
const Assets = require("../models/assets");
const User = require("../models/user");

// submit new asset information
const submitAssetInformation = async (req, res) => {
  try {
    const user = req.user;
    const {
      name,
      type,
      description,
      serialNumber,
      purchaseDate,
      location,
      value,
      status,
      assignedTo, // employeeCode
      tags,
    } = req.body;

    if (!name || !type) {
      return res.status(400).json({ error: "Name and type are required." });
    }

    let assignedUser = null;
    if (assignedTo) {
      assignedUser = await User.findOne({ employeeCode: assignedTo }).select(
        "-password"
      );
      if (!assignedUser) {
        return res.status(404).json({ error: "Assigned user not found." });
      }
    }

    const newAsset = {
      name,
      type,
      description: description || "",
      serialNumber: serialNumber || null,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
      location: location || "",
      value: value ? Number(value) : 0,
      status: status || "Active",
      assignedTo: assignedUser ? assignedUser.employeeCode : null,
      tags: Array.isArray(tags) ? tags : [],
      createdBy: user?._id || null,
      createdAt: new Date(),
      updatedAt: new Date(),
      isDeleted: false,
    };

    const result = await Assets.create(newAsset);

    res.status(201).json({
      message: "Asset saved successfully",
      assetId: result,
    });
  } catch (error) {
    console.error("Asset submission failed:", error);
    res.status(500).json({ error: error.message });
  }
};

// Get All Assets
const getAllAssets = async (req, res) => {
  try {
    const assets = await Assets.find({ isDeleted: { $ne: true } }).exec();
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

// export services
module.exports = {
  submitAssetInformation,
  getAllAssets,
  getAssetById,
  updateAssetById,
  deleteAssetById,
};
