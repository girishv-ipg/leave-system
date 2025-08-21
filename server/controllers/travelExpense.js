const { ObjectId } = require("mongodb");
const { getDb } = require("../lib/mongo"); // Use your existing DB connection

// Submit new expense
const submitExpense = async (req, res) => {
  try {
    const db = await getDb();
    const { amount, description, travelStartDate, travelEndDate } = req.body;

    if (new Date(travelStartDate) > new Date(travelEndDate)) {
      return res
        .status(400)
        .json({ error: "Travel start date cannot be after end date" });
    }
    // Get user info from JWT token
    const user = req.user;
    const expense = {
      employeeId: user.userId,
      employeeName: user.name,
      employeeCode: user.employeeCode,
      amount: parseFloat(amount),
      description,
      travelStartDate: new Date(travelStartDate),
      travelEndDate: new Date(travelEndDate),
      status: "pending",
      submittedAt: new Date(),
      approvedAt: null,
      approvedBy: null,
      comments: null,
    };

    // Add file data if uploaded (store as base64)
    if (req.file) {
      expense.fileName = req.file.originalname;
      expense.fileType = req.file.mimetype;
      expense.fileSize = req.file.size;
      expense.fileData = req.file.buffer.toString("base64");
    }

    const result = await db.collection("expense-tracker").insertOne(expense);

    res.json({
      success: true,
      id: result.insertedId,
      message: "Expense submitted successfully!",
    });
  } catch (error) {
    console.error("Submit expense error:", error);
    res.status(500).json({ error: error.message });
  }
};

// Get expenses list (filtered by user role)
const getExpenses = async (req, res) => {
  try {
    const db = await getDb();
    const { status = "all", page = 1, limit = 20 } = req.query;
    const user = req.user;

    let query = {};

    // Employees can only see their own expenses
    if (user.role !== "admin") {
      query.employeeId = user.userId;
    }

    // Filter by status if not 'all'
    if (status !== "all") {
      query.status = status;
    }

    // Get expenses without file data for list performance
    const expenses = await db
      .collection("expense-tracker")
      .find(query, {
        projection: { fileData: 0 }, // exclude large base64 data from list
      })
      .sort({ submittedAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .toArray();

    const total = await db.collection("expense-tracker").countDocuments(query);

    // Calculate summary stats for admin
    let stats = null;
    if (user.role === "admin") {
      const [totalCount, pendingCount, approvedCount, rejectedCount] =
        await Promise.all([
          db.collection("expense-tracker").countDocuments({}),
          db
            .collection("expense-tracker")
            .countDocuments({ status: "pending" }),
          db
            .collection("expense-tracker")
            .countDocuments({ status: "approved" }),
          db
            .collection("expense-tracker")
            .countDocuments({ status: "rejected" }),
        ]);

      stats = { totalCount, pendingCount, approvedCount, rejectedCount };
      console.log(
        "==========================================================="
      );
      console.log("Stats");
      console.log(totalCount, pendingCount, approvedCount, rejectedCount);
    }

    res.json({
      expenses,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      stats,
    });
  } catch (error) {
    console.error("Get expenses error:", error);
    res.status(500).json({ error: error.message });
  }
};

// Get single expense with file data (for viewing documents)
const getExpenseById = async (req, res) => {
  try {
    const db = await getDb();
    const user = req.user;

    let query = { _id: new ObjectId(req.params.id) };

    // Employees can only access their own expenses
    if (user.role !== "admin") {
      query.employeeId = user.userId;
    }

    const expense = await db.collection("expense-tracker").findOne(query);

    if (!expense) {
      return res.status(404).json({ error: "Expense not found" });
    }

    res.json(expense);
  } catch (error) {
    console.error("Get expense by ID error:", error);
    res.status(500).json({ error: error.message });
  }
};

// Update expense status (admin only)
const updateExpenseStatus = async (req, res) => {
  try {
    console.log("pooooooooooooooooooooooo => ", req.user);
    const user = req.user;
    if (user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const db = await getDb();
    const { status, comments = "" } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res
        .status(400)
        .json({ error: "Invalid status. Must be approved or rejected" });
    }

    const updateData = {
      status,
      comments,
      approvedBy: user.userId,
      approvedByName: user.name,
      approvedAt: new Date(),
    };

    const result = await db
      .collection("expense-tracker")
      .updateOne({ _id: new ObjectId(req.params.id) }, { $set: updateData });

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Expense not found" });
    }

    res.json({
      success: true,
      message: `Expense ${status} successfully!`,
    });
  } catch (error) {
    console.error("Update expense status error:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  submitExpense,
  getExpenses,
  getExpenseById,
  updateExpenseStatus,
};
