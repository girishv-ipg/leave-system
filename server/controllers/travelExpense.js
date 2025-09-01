const { ObjectId } = require("mongodb");
const { getDb } = require("../lib/mongo"); // Use your existing DB connection


// Get single expense with file data (for viewing documents)
const getExpenseById = async (req, res) => {
  try {
    const db = await getDb();
    const user = req.user;
    const expenseId = req.params.id;

    let query = {};

    // Employees can only access their own expenses
    if (user.role !== "admin") {
      query.employeeId = user.userId;
    }

    // Find the bulk submission containing the expense
    const bulkSubmission = await db.collection("expense-tracker").findOne({
      ...query,
      "expenses._id": expenseId,
    });

    if (!bulkSubmission) {
      return res.status(404).json({ error: "Expense not found" });
    }

    // Find the specific expense within the bulk submission
    const expense = bulkSubmission.expenses.find(
      (exp) => exp._id === expenseId
    );

    if (!expense) {
      return res.status(404).json({ error: "Expense not found" });
    }

    res.json({
      success: true,
      data: expense,
    });
  } catch (error) {
    console.error("Get expense by ID error:", error);
    res.status(500).json({ error: error.message });
  }
};


/**
 * Get expense file/document
 * GET /expenses/:id/file
 */
const getExpenseFile  = async (req, res) => {
  try {
    const db = await getDb();
    const user = req.user;
    const expenseId = req.params.id;

    let query = { "expenses._id": expenseId };

    // Only allow access to their own documents unless admin
    if (user.role !== "admin") {
      query.employeeId = user.userId;
    }

    const bulkSubmission = await db
      .collection("expense-tracker")
      .findOne(query);

    if (!bulkSubmission) {
      return res.status(404).json({ error: "Document not found" });
    }

    const expense = bulkSubmission.expenses.find(
      (exp) => exp._id === expenseId
    );

    if (!expense || !expense.fileData || !expense.fileType) {
      return res.status(404).json({ error: "File not available for this expense" });
    }

    res.json(expense);
  } catch (error) {
    console.error("View document error:", error);
    res.status(500).json({ error: error.message });
  }
};


//=====================================================================================================



// Submit bulk expenses (handles FormData with expenses array)
const submitBulkExpenses = async (req, res) => {
  try {
    const db = await getDb();
    const user = req.user;

    console.log("Request body:", req.body);
    console.log("Request files:", req.files);

    // Parse expenses from FormData
    let expensesData;
    try {
      expensesData = JSON.parse(req.body.expenses);
      console.log("Parsed expenses data:", expensesData);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      return res.status(400).json({ error: "Invalid expenses data format" });
    }

    if (!Array.isArray(expensesData) || expensesData.length === 0) {
      return res
        .status(400)
        .json({ error: "At least one expense is required" });
    }

    // Validate each expense
    for (let i = 0; i < expensesData.length; i++) {
      const expense = expensesData[i];
      if (
        !expense.amount ||
        !expense.description ||
        !expense.travelStartDate ||
        !expense.travelEndDate
      ) {
        return res.status(400).json({
          error: `Missing required fields for expense ${i + 1}`,
        });
      }

      if (new Date(expense.travelStartDate) > new Date(expense.travelEndDate)) {
        return res.status(400).json({
          error: `Travel start date cannot be after end date for expense ${
            i + 1
          }`,
        });
      }
    }

    // Process files if any
    const files = req.files || [];
    console.log("Files array length:", files.length);

    // Create expense objects
    const expenses = expensesData.map((expenseData, index) => {
      const expense = {
        _id: new ObjectId().toString(),
        expenseType: expenseData.expenseType || "travel",
        amount: parseFloat(expenseData.amount),
        description: expenseData.description,
        travelStartDate: expenseData.travelStartDate,
        travelEndDate: expenseData.travelEndDate,
        status: "pending",
        fileName: null,
        fileType: null,
        fileSize: null,
        fileData: null,
        isEdited: false,
        editedAt: null,
        editHistory: [], // Track edit history
        reviewedAt: null,
        comments: null,
      };

      // Attach file if expense has a file
      if (
        expenseData.hasFile &&
        expenseData.fileIndex !== null &&
        expenseData.fileIndex !== undefined
      ) {
        const fileIndex = parseInt(expenseData.fileIndex);
        console.log(
          `Processing file for expense ${index}, fileIndex: ${fileIndex}`
        );

        if (fileIndex >= 0 && fileIndex < files.length) {
          const file = files[fileIndex];
          if (file && file.buffer) {
            try {
              expense.fileName = file.originalname;
              expense.fileType = file.mimetype;
              expense.fileSize = file.size;
              expense.fileData = file.buffer.toString("base64");
              console.log(`File attached successfully for expense ${index}`);
            } catch (fileError) {
              console.error(
                `Error processing file for expense ${index}:`,
                fileError
              );
            }
          }
        } else {
          console.warn(`Invalid file index ${fileIndex} for expense ${index}`);
        }
      }

      return expense;
    });

    // Calculate total amount
    const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    const currentDate = new Date().toISOString();

    // Create bulk submission structure with resubmission tracking
    const bulkSubmission = {
      _id: new ObjectId().toString(),
      employeeId: user.userId,
      employeeName: user.name,
      employeeCode: user.employeeCode,
      submittedAt: currentDate,
      originalSubmittedAt: currentDate, // Track original submission date
      isResubmitted: false,
      resubmittedAt: null,
      resubmissionCount: 0,
      totalAmount,
      expenses,
      submissionHistory: [
        {
          submittedAt: currentDate,
          action: "initial_submission",
          totalAmount: totalAmount,
          expenseCount: expenses.length
        }
      ]
    };

    console.log(
      "About to insert bulk submission with",
      expenses.length,
      "expenses"
    );

    const result = await db
      .collection("expense-tracker")
      .insertOne(bulkSubmission);

    res.json({
      success: true,
      id: result.insertedId,
      message: `${expenses.length} expenses submitted successfully!`,
      totalAmount,
    });
  } catch (error) {
    console.error("Submit bulk expenses error:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      error: "Failed to submit expenses. Please try again.",
      details: error.message,
    });
  }
};

// Update/Edit expense (for employees to edit their pending/rejected expenses)
const updateExpense = async (req, res) => {
  try {
    const db = await getDb();
    const user = req.user;
    const expenseId = req.params.id;
    const { amount, description, travelStartDate, travelEndDate, expenseType } =
      req.body;

    if (new Date(travelStartDate) > new Date(travelEndDate)) {
      return res
        .status(400)
        .json({ error: "Travel start date cannot be after end date" });
    }

    let query = { "expenses._id": expenseId };

    // Employees can only edit their own expenses
    if (user.role !== "admin") {
      query.employeeId = user.userId;
    }

    // Find the bulk submission containing the expense
    const bulkSubmission = await db
      .collection("expense-tracker")
      .findOne(query);

    if (!bulkSubmission) {
      return res.status(404).json({ error: "Expense not found" });
    }

    // Find the specific expense
    const expense = bulkSubmission.expenses.find(
      (exp) => exp._id === expenseId
    );

    if (!expense) {
      return res.status(404).json({ error: "Expense not found" });
    }

    // Check if expense can be edited (only pending or rejected)
    if (!["pending", "rejected"].includes(expense.status)) {
      return res.status(400).json({
        error: "Only pending or rejected expenses can be edited",
      });
    }

    const currentDate = new Date().toISOString();
    
    // Store previous values for edit history
    const previousValues = {
      expenseType: expense.expenseType,
      amount: expense.amount,
      description: expense.description,
      travelStartDate: expense.travelStartDate,
      travelEndDate: expense.travelEndDate,
      fileName: expense.fileName,
    };

    // Prepare update data
    const updateData = {
      "expenses.$.expenseType": expenseType || expense.expenseType,
      "expenses.$.amount": parseFloat(amount),
      "expenses.$.description": description,
      "expenses.$.travelStartDate": travelStartDate,
      "expenses.$.travelEndDate": travelEndDate,
      "expenses.$.isEdited": true,
      "expenses.$.editedAt": currentDate,
    };

    // Handle file update if new file uploaded
    if (req.file) {
      updateData["expenses.$.fileName"] = req.file.originalname;
      updateData["expenses.$.fileType"] = req.file.mimetype;
      updateData["expenses.$.fileSize"] = req.file.size;
      updateData["expenses.$.fileData"] = req.file.buffer.toString("base64");
    }

    // If expense was rejected, reset status to pending after edit
    const wasRejected = expense.status === "rejected";
    if (wasRejected) {
      updateData["expenses.$.status"] = "pending";
      updateData["expenses.$.comments"] = null;
      updateData["expenses.$.reviewedAt"] = null;
      updateData["expenses.$.reviewedBy"] = null;
      updateData["expenses.$.reviewedByName"] = null;
    }

    // Add to edit history
    const editHistoryEntry = {
      editDate: currentDate,
      editedBy: user.userId,
      editedByName: user.name,
      previousValues: previousValues,
      newValues: {
        expenseType: expenseType || expense.expenseType,
        amount: parseFloat(amount),
        description: description,
        travelStartDate: travelStartDate,
        travelEndDate: travelEndDate,
        fileName: req.file ? req.file.originalname : expense.fileName,
      },
      wasRejected: wasRejected,
      reason: wasRejected ? "Resubmitted after rejection" : "Modified expense"
    };

    // Update the expense
    const result = await db
      .collection("expense-tracker")
      .updateOne(query, { 
        $set: updateData,
        $push: { "expenses.$.editHistory": editHistoryEntry }
      });

    // Update bulk submission with resubmission tracking
    const bulkUpdateData = {
      isResubmitted: true,
      resubmittedAt: currentDate,
    };

    // Add to submission history
    const submissionHistoryEntry = {
      submittedAt: currentDate,
      action: wasRejected ? "resubmitted_after_rejection" : "expense_modified",
      modifiedExpenseId: expenseId,
      modifiedBy: user.userId,
      modifiedByName: user.name,
    };

    await db
      .collection("expense-tracker")
      .updateOne(
        { _id: bulkSubmission._id },
        { 
          $set: bulkUpdateData,
          $inc: { resubmissionCount: 1 },
          $push: { submissionHistory: submissionHistoryEntry }
        }
      );

    // Recalculate total amount of the bulk submission
    const updatedBulkSubmission = await db
      .collection("expense-tracker")
      .findOne({ _id: bulkSubmission._id });

    const newTotalAmount = updatedBulkSubmission.expenses.reduce(
      (sum, exp) => sum + parseFloat(exp.amount),
      0
    );

    await db
      .collection("expense-tracker")
      .updateOne(
        { _id: bulkSubmission._id },
        { $set: { totalAmount: newTotalAmount } }
      );

    res.json({
      success: true,
      message: "Expense updated successfully!",
    });
  } catch (error) {
    console.error("Update expense error:", error);
    res.status(500).json({ error: error.message });
  }
};

// Get expenses list for employees (returns bulk submissions with nested expenses)
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

    // Get bulk submissions without file data for list performance
    let bulkSubmissions = await db
      .collection("expense-tracker")
      .find(query, {
        projection: { "expenses.fileData": 0 }, // exclude large base64 data from list
      })
      .sort({ submittedAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .toArray();

    // Filter expenses within each submission by status
    if (status !== "all") {
      bulkSubmissions = bulkSubmissions
        .map(submission => ({
          ...submission,
          expenses: submission.expenses.filter(expense => expense.status === status)
        }))
        .filter(submission => submission.expenses.length > 0);
    }

    const total = await db.collection("expense-tracker").countDocuments(query);

    res.json({
      success: true,
      data: bulkSubmissions, // This matches index.js expectation
      total,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error("Get expenses error:", error);
    res.status(500).json({ error: error.message });
  }
};

// Get expenses list for admin (returns bulk submissions with nested expenses)
const getExpensesForAdmin = async (req, res) => {
  try {
    const db = await getDb();
    const { status = "all", page = 1, limit = 50 } = req.query;

    let query = {};

    // Get all bulk submissions for admin
    let bulkSubmissions = await db
      .collection("expense-tracker")
      .find(query, {
        projection: { "expenses.fileData": 0 },
      })
      .sort({ submittedAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .toArray();

    // Filter expenses within each submission by status
    if (status !== "all") {
      bulkSubmissions = bulkSubmissions
        .map(submission => ({
          ...submission,
          expenses: submission.expenses.filter(expense => expense.status === status)
        }))
        .filter(submission => submission.expenses.length > 0);
    }

    // Calculate stats for admin
    const allBulkSubmissions = await db
      .collection("expense-tracker")
      .find({}, { projection: { "expenses.fileData": 0 } })
      .toArray();

    const allExpenses = allBulkSubmissions.flatMap(
      (submission) => submission.expenses
    );

    const stats = {
      totalCount: allExpenses.length,
      pendingCount: allExpenses.filter((exp) => exp.status === "pending").length,
      approvedCount: allExpenses.filter((exp) => exp.status === "approved").length,
      rejectedCount: allExpenses.filter((exp) => exp.status === "rejected").length,
      totalSubmissions: allBulkSubmissions.length,
      resubmittedSubmissions: allBulkSubmissions.filter(sub => sub.isResubmitted).length,
    };

    const total = await db.collection("expense-tracker").countDocuments(query);

    res.json({
      success: true,
      bulkSubmissions, // This matches admin.js expectation
      stats,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error("Get admin expenses error:", error);
    res.status(500).json({ error: error.message });
  }
};

// Update expense status (for admin approval/rejection)
const updateExpenseStatus = async (req, res) => {
  try {
    const db = await getDb();
    const user = req.user;
    const expenseId = req.params.id;
    const { status, comments } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    if (status === "rejected" && !comments) {
      return res.status(400).json({ error: "Comments required for rejection" });
    }

    const query = { "expenses._id": expenseId };

    // Find the bulk submission containing the expense
    const bulkSubmission = await db
      .collection("expense-tracker")
      .findOne(query);

    if (!bulkSubmission) {
      return res.status(404).json({ error: "Expense not found" });
    }

    const currentDate = new Date().toISOString();

    // Update expense status
    const updateData = {
      "expenses.$.status": status,
      "expenses.$.reviewedAt": currentDate,
      "expenses.$.reviewedBy": user.userId,
      "expenses.$.reviewedByName": user.name,
      "expenses.$.comments": comments || null,
    };

    const result = await db
      .collection("expense-tracker")
      .updateOne(query, { $set: updateData });

    // Add to submission history
    const submissionHistoryEntry = {
      submittedAt: currentDate,
      action: `expense_${status}`,
      expenseId: expenseId,
      reviewedBy: user.userId,
      reviewedByName: user.name,
      comments: comments || null,
    };

    await db
      .collection("expense-tracker")
      .updateOne(
        { _id: bulkSubmission._id },
        { 
          $push: { submissionHistory: submissionHistoryEntry }
        }
      );

    res.json({
      success: true,
      message: `Expense ${status} successfully!`,
    });
  } catch (error) {
    console.error("Update expense status error:", error);
    res.status(500).json({ error: error.message });
  }
};

// Migration script to add resubmission fields to existing documents
const migrateExistingSubmissions = async () => {
  try {
    const db = await getDb();
    
    // Update all existing bulk submissions to include resubmission tracking fields
    const result = await db.collection("expense-tracker").updateMany(
      { 
        $or: [
          { isResubmitted: { $exists: false } },
          { originalSubmittedAt: { $exists: false } },
          { resubmissionCount: { $exists: false } },
          { submissionHistory: { $exists: false } }
        ]
      },
      {
        $set: {
          isResubmitted: false,
          resubmittedAt: null,
          resubmissionCount: 0,
          submissionHistory: []
        },
        $setOnInsert: {
          originalSubmittedAt: "$submittedAt" // Use existing submittedAt as original
        }
      }
    );

    // Update originalSubmittedAt for existing documents
    const submissions = await db.collection("expense-tracker").find({
      originalSubmittedAt: { $exists: false }
    }).toArray();

    for (const submission of submissions) {
      await db.collection("expense-tracker").updateOne(
        { _id: submission._id },
        {
          $set: {
            originalSubmittedAt: submission.submittedAt,
            submissionHistory: [
              {
                submittedAt: submission.submittedAt,
                action: "initial_submission",
                totalAmount: submission.totalAmount,
                expenseCount: submission.expenses.length
              }
            ]
          }
        }
      );
    }

    // Add edit history array to expenses that don't have it
    await db.collection("expense-tracker").updateMany(
      { "expenses.editHistory": { $exists: false } },
      { 
        $set: { 
          "expenses.$[].editHistory": []
        }
      }
    );

    console.log(`Migration completed. Updated ${result.modifiedCount} submissions.`);
    return result;
  } catch (error) {
    console.error("Migration error:", error);
    throw error;
  }
};


//======================================

module.exports = {
  submitBulkExpenses,
  getExpenses,
  getExpensesForAdmin,
  getExpenseById,
  getExpenseFile,
  updateExpenseStatus,
  updateExpense
};