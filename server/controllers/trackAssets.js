const { ObjectId } = require("mongodb");
const { getDb } = require("../lib/mongo");

// submit new asset information
const submitAssetInformation = async (req, res) => {
  try {
    const db = await getDb(); // Get MongoDB connection
    const user = req.user; // Assume middleware has added authenticated user
    const assetsCollection = db.collection("assets");

    // Parse asset info from request body
    const {
      name,
      type,
      description,
      serialNumber,
      purchaseDate,
      location,
      value,
      status,
      assignedTo,
      tags,
    } = req.body;

    // Validate required fields
    if (!name || !type) {
      return res.status(400).json({ error: "Name and type are required." });
    }

    // Build asset document
    const newAsset = {
      name,
      type,
      description: description || "",
      serialNumber: serialNumber || null,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
      location: location || "",
      value: value ? Number(value) : 0,
      status: status || "Active",
      assignedTo: assignedTo ? new ObjectId(assignedTo) : null,
      tags: Array.isArray(tags) ? tags : [],
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: user?._id ? new ObjectId(user._id) : null, // Optional: track who submitted it
    };

    // Insert into MongoDB
    const result = await assetsCollection.insertOne(newAsset);

    res.status(201).json({
      message: "Asset information submitted successfully",
      assetId: result.insertedId,
    });
  } catch (error) {
    console.error("Asset submission failed:", error);
    res.status(500).json({
      error: "Failed to submit asset information",
      details: error.message,
    });
  }
};

// Get All Assets
const getAllAssets = async (req, res) => {
  try {
    const db = await getDb();
    const assets = await db
      .collection("assets")
      .find({ isDeleted: { $ne: true } }) // filter out soft-deleted
      .toArray();
    res.status(200).json(assets);
  } catch (error) {
    console.error("Failed to fetch assets:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch assets", details: error.message });
  }
};

// READ ONE: Get Asset by ID
const getAssetById = async (req, res) => {
  try {
    const db = await getDb();
    const assetId = req.params.id;

    if (!ObjectId.isValid(assetId)) {
      return res.status(400).json({ error: "Invalid asset ID" });
    }

    const asset = await db
      .collection("assets")
      .findOne({ _id: new ObjectId(assetId), isDeleted: { $ne: true } });

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
    const db = await getDb();
    const assetId = req.params.id;

    if (!ObjectId.isValid(assetId)) {
      return res.status(400).json({ error: "Invalid asset ID" });
    }

    const updateFields = { ...req.body, updatedAt: new Date() };

    if (updateFields.assignedTo) {
      updateFields.assignedTo = new ObjectId(updateFields.assignedTo);
    }

    if (updateFields.purchaseDate) {
      updateFields.purchaseDate = new Date(updateFields.purchaseDate);
    }

    const result = await db
      .collection("assets")
      .findOneAndUpdate(
        { _id: new ObjectId(assetId) },
        { $set: updateFields },
        { returnDocument: "after" }
      );

    if (!result.value) {
      return res.status(404).json({ error: "Asset not found" });
    }

    res.status(200).json({
      message: "Asset updated successfully",
      asset: result.value,
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
    const db = await getDb();
    const assetId = req.params.id;

    if (!ObjectId.isValid(assetId)) {
      return res.status(400).json({ error: "Invalid asset ID" });
    }

    const result = await db.collection("assets").findOneAndUpdate(
      { _id: new ObjectId(assetId), isDeleted: { $ne: true } },
      {
        $set: {
          isDeleted: true,
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" }
    );

    if (!result.value) {
      return res
        .status(404)
        .json({ error: "Asset not found or already deleted" });
    }

    res.status(200).json({
      message: "Asset soft-deleted successfully",
      asset: result.value,
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
