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
    if (user.role !== "admin" && user.role !== "manager" && user.role !== "finance") {
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

// Get expense file/document
const getExpenseFile = async (req, res) => {
  try {
    const db = await getDb();
    const user = req.user;
    const expenseId = req.params.id;

    let query = { "expenses._id": expenseId };

    // Only allow access to their own documents unless admin/manager/finance
    if (user.role !== "admin" && user.role !== "manager" && user.role !== "finance") {
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

    // Create expense objects with enhanced approval tracking
    const expenses = expensesData.map((expenseData, index) => {
      const expense = {
        _id: new ObjectId().toString(),
        expenseType: expenseData.expenseType || "travel",
        amount: parseFloat(expenseData.amount),
        description: expenseData.description,
        travelStartDate: expenseData.travelStartDate,
        travelEndDate: expenseData.travelEndDate,
        status: "pending", // Overall status
        fileName: null,
        fileType: null,
        fileSize: null,
        fileData: null,
        isEdited: false,
        editedAt: null,
        editHistory: [],
        
        // Enhanced approval tracking
        managerApproval: {
          status: null, // null, "approved", "rejected"
          reviewedBy: null,
          reviewedByName: null,
          reviewedAt: null,
          comments: null,
        },
        financeApproval: {
          status: null, // null, "approved", "rejected"
          reviewedBy: null,
          reviewedByName: null,
          reviewedAt: null,
          comments: null,
        },
        
        // Legacy fields for backward compatibility
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

    // Create bulk submission structure with enhanced tracking
    const bulkSubmission = {
      _id: new ObjectId().toString(),
      employeeId: user.userId,
      employeeName: user.name,
      employeeCode: user.employeeCode,
      submittedAt: currentDate,
      originalSubmittedAt: currentDate,
      isResubmitted: false,
      resubmittedAt: null,
      resubmissionCount: 0,
      totalAmount,
      expenses,
      
      // Enhanced approval tracking at submission level
      overallStatus: "pending", // pending, manager_approved, approved, rejected
      managerApprovalStatus: null,
      financeApprovalStatus: null,
      
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

    // If expense was rejected, reset all approvals and status to pending
    const wasRejected = expense.status === "rejected";
    if (wasRejected) {
      updateData["expenses.$.status"] = "pending";
      updateData["expenses.$.comments"] = null;
      updateData["expenses.$.reviewedAt"] = null;
      updateData["expenses.$.reviewedBy"] = null;
      updateData["expenses.$.reviewedByName"] = null;
      
      // Reset approval tracking
      updateData["expenses.$.managerApproval.status"] = null;
      updateData["expenses.$.managerApproval.reviewedBy"] = null;
      updateData["expenses.$.managerApproval.reviewedByName"] = null;
      updateData["expenses.$.managerApproval.reviewedAt"] = null;
      updateData["expenses.$.managerApproval.comments"] = null;
      
      updateData["expenses.$.financeApproval.status"] = null;
      updateData["expenses.$.financeApproval.reviewedBy"] = null;
      updateData["expenses.$.financeApproval.reviewedByName"] = null;
      updateData["expenses.$.financeApproval.reviewedAt"] = null;
      updateData["expenses.$.financeApproval.comments"] = null;
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

    // Reset submission-level approval status if any expense was edited
    if (wasRejected) {
      bulkUpdateData.overallStatus = "pending";
      bulkUpdateData.managerApprovalStatus = null;
      bulkUpdateData.financeApprovalStatus = null;
    }

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
    if (user.role !== "admin" && user.role !== "manager" && user.role !== "finance") {
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

// Get expenses list for admin/manager/finance (returns bulk submissions with nested expenses)
const getExpensesForAdmin = async (req, res) => {
  try {
    const db = await getDb();
    const { status = "all", page = 1, limit = 50 } = req.query;
    const user = req.user;

    let query = {};
    let expenseStatusFilter = {};

    // Filter based on status and user role
    if (status !== "all") {
      if (status === "manager_approved") {
        expenseStatusFilter = { status: "manager_approved" };
      } else {
        expenseStatusFilter = { status: status };
      }
    }

    // Get all bulk submissions for admin/manager/finance
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
          expenses: submission.expenses.filter(expense => {
            if (status === "manager_approved") {
              return expense.status === "manager_approved";
            }
            return expense.status === status;
          })
        }))
        .filter(submission => submission.expenses.length > 0);
    }

    // Calculate enhanced stats for admin/manager/finance
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
      managerApprovedCount: allExpenses.filter((exp) => exp.status === "manager_approved").length,
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

// Manager review individual expense
const managerReviewExpense = async (req, res) => {
  try {
    const db = await getDb();
    const user = req.user;
    const expenseId = req.params.id;
    const { action, comments } = req.body; // action: "approved" or "rejected"

    // Ensure user is manager
    if (user.role !== "manager") {
      return res.status(403).json({ error: "Only managers can perform this action" });
    }

    if (!["approved", "rejected"].includes(action)) {
      return res.status(400).json({ error: "Invalid action" });
    }

    if (action === "rejected" && !comments) {
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

    // Find the specific expense
    const expense = bulkSubmission.expenses.find(exp => exp._id === expenseId);
    
    if (!expense) {
      return res.status(404).json({ error: "Expense not found" });
    }

    // Check if expense is in pending status
    if (expense.status !== "pending") {
      return res.status(400).json({ error: "Can only review pending expenses" });
    }

    const currentDate = new Date().toISOString();

    // Determine new status based on manager action
    let newStatus;
    if (action === "approved") {
      newStatus = "manager_approved"; // Goes to finance for final approval
    } else {
      newStatus = "rejected"; // Rejected by manager
    }

    // Update expense with manager approval
    const updateData = {
      "expenses.$.status": newStatus,
      "expenses.$.managerApproval.status": action,
      "expenses.$.managerApproval.reviewedBy": user.userId,
      "expenses.$.managerApproval.reviewedByName": user.name,
      "expenses.$.managerApproval.reviewedAt": currentDate,
      "expenses.$.managerApproval.comments": comments || null,
      
      // Update legacy fields for backward compatibility
      "expenses.$.reviewedAt": currentDate,
      "expenses.$.reviewedBy": user.userId,
      "expenses.$.reviewedByName": user.name,
      "expenses.$.comments": comments || null,
    };

    await db
      .collection("expense-tracker")
      .updateOne(query, { $set: updateData });

    // Update submission history
    const submissionHistoryEntry = {
      submittedAt: currentDate,
      action: `manager_${action}`,
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
      message: `Expense ${action} by manager successfully!`,
    });
  } catch (error) {
    console.error("Manager review expense error:", error);
    res.status(500).json({ error: error.message });
  }
};

// Finance review individual expense
const financeReviewExpense = async (req, res) => {
  try {
    const db = await getDb();
    const user = req.user;
    const expenseId = req.params.id;
    const { action, comments } = req.body; // action: "approved" or "rejected"

    // Ensure user is finance
    if (user.role !== "finance") {
      return res.status(403).json({ error: "Only finance team can perform this action" });
    }

    if (!["approved", "rejected"].includes(action)) {
      return res.status(400).json({ error: "Invalid action" });
    }

    if (action === "rejected" && !comments) {
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

    // Find the specific expense
    const expense = bulkSubmission.expenses.find(exp => exp._id === expenseId);
    
    if (!expense) {
      return res.status(404).json({ error: "Expense not found" });
    }

    // Check if expense is manager approved
    if (expense.status !== "manager_approved") {
      return res.status(400).json({ error: "Can only review manager-approved expenses" });
    }

    const currentDate = new Date().toISOString();

    // Determine new status based on finance action
    let newStatus;
    if (action === "approved") {
      newStatus = "approved"; // Fully approved
    } else {
      newStatus = "rejected"; // Rejected by finance
    }

    // Update expense with finance approval
    const updateData = {
      "expenses.$.status": newStatus,
      "expenses.$.financeApproval.status": action,
      "expenses.$.financeApproval.reviewedBy": user.userId,
      "expenses.$.financeApproval.reviewedByName": user.name,
      "expenses.$.financeApproval.reviewedAt": currentDate,
      "expenses.$.financeApproval.comments": comments || null,
      
      // Update legacy fields
      "expenses.$.reviewedAt": currentDate,
      "expenses.$.reviewedBy": user.userId,
      "expenses.$.reviewedByName": user.name,
      "expenses.$.comments": comments || null,
    };

    await db
      .collection("expense-tracker")
      .updateOne(query, { $set: updateData });

    // Update submission history
    const submissionHistoryEntry = {
      submittedAt: currentDate,
      action: `finance_${action}`,
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
      message: `Expense ${action} by finance successfully!`,
    });
  } catch (error) {
    console.error("Finance review expense error:", error);
    res.status(500).json({ error: error.message });
  }
};

// Manager bulk review (approve/reject all expenses in a submission)
const managerBulkReview = async (req, res) => {
  try {
    const db = await getDb();
    const user = req.user;
    const submissionId = req.params.id;
    const { action, comments } = req.body; // action: "approved" or "rejected"

    // Ensure user is manager
    if (user.role !== "manager") {
      return res.status(403).json({ error: "Only managers can perform this action" });
    }

    if (!["approved", "rejected"].includes(action)) {
      return res.status(400).json({ error: "Invalid action" });
    }

    if (action === "rejected" && !comments) {
      return res.status(400).json({ error: "Comments required for rejection" });
    }

    // Find the bulk submission
    const bulkSubmission = await db
      .collection("expense-tracker")
      .findOne({ _id: submissionId });

    if (!bulkSubmission) {
      return res.status(404).json({ error: "Submission not found" });
    }

    // Check if all expenses are pending
    const allPending = bulkSubmission.expenses.every(exp => exp.status === "pending");
    if (!allPending) {
      return res.status(400).json({ error: "Can only bulk review submissions where all expenses are pending" });
    }

    const currentDate = new Date().toISOString();
    
    // Determine new status based on manager action
    let newStatus;
    if (action === "approved") {
      newStatus = "manager_approved"; // Goes to finance for final approval
    } else {
      newStatus = "rejected"; // Rejected by manager
    }

    // Update all expenses in the submission
    const bulkUpdatePromises = bulkSubmission.expenses.map(expense => {
      return db.collection("expense-tracker").updateOne(
        { 
          _id: submissionId,
          "expenses._id": expense._id 
        },
        {
          $set: {
            "expenses.$.status": newStatus,
            "expenses.$.managerApproval.status": action,
            "expenses.$.managerApproval.reviewedBy": user.userId,
            "expenses.$.managerApproval.reviewedByName": user.name,
            "expenses.$.managerApproval.reviewedAt": currentDate,
            "expenses.$.managerApproval.comments": comments || null,
            
            // Update legacy fields
            "expenses.$.reviewedAt": currentDate,
            "expenses.$.reviewedBy": user.userId,
            "expenses.$.reviewedByName": user.name,
            "expenses.$.comments": comments || null,
          }
        }
      );
    });

    await Promise.all(bulkUpdatePromises);

    // Update submission history
    const submissionHistoryEntry = {
      submittedAt: currentDate,
      action: `manager_bulk_${action}`,
      reviewedBy: user.userId,
      reviewedByName: user.name,
      comments: comments || null,
      expenseCount: bulkSubmission.expenses.length,
    };

    await db
      .collection("expense-tracker")
      .updateOne(
        { _id: submissionId },
        { 
          $set: {
            managerApprovalStatus: action,
            overallStatus: newStatus === "manager_approved" ? "manager_approved" : "rejected"
          },
          $push: { submissionHistory: submissionHistoryEntry }
        }
      );

    res.json({
      success: true,
      message: `All expenses ${action} by manager successfully!`,
    });
  } catch (error) {
    console.error("Manager bulk review error:", error);
    res.status(500).json({ error: error.message });
  }
};

// Finance bulk review (approve/reject all manager-approved expenses in a submission)
const financeBulkReview = async (req, res) => {
  try {
    const db = await getDb();
    const user = req.user;
    const submissionId = req.params.id;
    const { action, comments } = req.body; // action: "approved" or "rejected"

    // Ensure user is finance
    if (user.role !== "finance") {
      return res.status(403).json({ error: "Only finance team can perform this action" });
    }

    if (!["approved", "rejected"].includes(action)) {
      return res.status(400).json({ error: "Invalid action" });
    }

    if (action === "rejected" && !comments) {
      return res.status(400).json({ error: "Comments required for rejection" });
    }

    // Find the bulk submission
    const bulkSubmission = await db
      .collection("expense-tracker")
      .findOne({ _id: submissionId });

    if (!bulkSubmission) {
      return res.status(404).json({ error: "Submission not found" });
    }

    // Check if all expenses are manager approved
    const allManagerApproved = bulkSubmission.expenses.every(exp => exp.status === "manager_approved");
    if (!allManagerApproved) {
      return res.status(400).json({ error: "Can only bulk review submissions where all expenses are manager-approved" });
    }

    const currentDate = new Date().toISOString();
    
    // Determine new status based on finance action
    let newStatus;
    if (action === "approved") {
      newStatus = "approved"; // Fully approved
    } else {
      newStatus = "rejected"; // Rejected by finance
    }

    // Update all expenses in the submission
    const bulkUpdatePromises = bulkSubmission.expenses.map(expense => {
      return db.collection("expense-tracker").updateOne(
        { 
          _id: submissionId,
          "expenses._id": expense._id 
        },
        {
          $set: {
            "expenses.$.status": newStatus,
            "expenses.$.financeApproval.status": action,
            "expenses.$.financeApproval.reviewedBy": user.userId,
            "expenses.$.financeApproval.reviewedByName": user.name,
            "expenses.$.financeApproval.reviewedAt": currentDate,
            "expenses.$.financeApproval.comments": comments || null,
            
            // Update legacy fields
            "expenses.$.reviewedAt": currentDate,
            "expenses.$.reviewedBy": user.userId,
            "expenses.$.reviewedByName": user.name,
            "expenses.$.comments": comments || null,
          }
        }
      );
    });

    await Promise.all(bulkUpdatePromises);

    // Update submission history
    const submissionHistoryEntry = {
      submittedAt: currentDate,
      action: `finance_bulk_${action}`,
      reviewedBy: user.userId,
      reviewedByName: user.name,
      comments: comments || null,
      expenseCount: bulkSubmission.expenses.length,
    };

    await db
      .collection("expense-tracker")
      .updateOne(
        { _id: submissionId },
        { 
          $set: {
            financeApprovalStatus: action,
            overallStatus: newStatus
          },
          $push: { submissionHistory: submissionHistoryEntry }
        }
      );

    res.json({
      success: true,
      message: `All expenses ${action} by finance successfully!`,
    });
  } catch (error) {
    console.error("Finance bulk review error:", error);
    res.status(500).json({ error: error.message });
  }
};

// Legacy function - kept for backward compatibility
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

    // Update expense status (legacy way)
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

module.exports = {
  submitBulkExpenses,
  getExpenses,
  getExpensesForAdmin,
  getExpenseById,
  getExpenseFile,
  updateExpenseStatus, // Legacy function
  updateExpense,
  
  // New multi-level approval functions
  managerReviewExpense,
  financeReviewExpense,
  managerBulkReview,
  financeBulkReview,
};