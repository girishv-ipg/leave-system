// ./server/controllers/travelExpense.js
const { Expense } = require("../models/travelExpense");
const User = require("../models/user");

// Submit a new expense
const createExpense = async (req, res) => {
  try {
    // Parse expenses if it's a string (from multipart/form-data)
    let expenses = req.body.expenses;
    if (typeof expenses === "string") {
      try {
        expenses = JSON.parse(expenses);
      } catch (parseError) {
        return res.status(400).json({ error: "Invalid expenses format" });
      }
    }

    if (!Array.isArray(expenses) || expenses.length === 0) {
      return res
        .status(400)
        .json({ error: "At least one expense is required" });
    }

    // Process uploaded files from multer
    if (req.files && req.files.length > 0) {
      req.files.forEach((file, index) => {
        const fileIndex = expenses[index]?.fileIndex ?? index;
        if (expenses[fileIndex]) {
          if (!expenses[fileIndex].files) {
            expenses[fileIndex].files = [];
          }

          // Convert buffer to base64
          const base64Data = file.buffer.toString("base64");

          // Create clean file object
          const fileObj = {
            name: String(file.originalname),
            type: String(file.mimetype),
            data: String(base64Data),
          };

          expenses[fileIndex].files.push(fileObj);
        }
      });
    }

    // Validate file sizes
    for (let i = 0; i < expenses.length; i++) {
      const expense = expenses[i];
      if (expense.files && Array.isArray(expense.files)) {
        for (let file of expense.files) {
          if (file.data) {
            // Check base64 size (rough estimate: 1.33x original size)
            const sizeInBytes = (file.data.length * 3) / 4;
            const sizeInMB = sizeInBytes / (1024 * 1024);

            if (sizeInMB > 5) {
              // Limit to 5MB per file
              return res.status(400).json({
                error: `File ${file.name} is too large (${sizeInMB.toFixed(
                  2
                )}MB). Maximum size is 5MB.`,
              });
            }
          }
        }
      }
    }

    const totalAmount = expenses.reduce(
      (sum, exp) => sum + Number(exp.amount),
      0
    );
    const newExpense = new Expense({
      employeeId: req.user.userId,
      createdAt: new Date(),
      totalAmount,
      expenses,
    });

    await newExpense.save();

    res.status(201).json({
      message: "Expense submitted successfully",
      data: newExpense,
    });
  } catch (error) {
    // Handle specific MongoDB errors
    if (
      error.name === "DocumentTooLargeError" ||
      error.message.includes("16793600")
    ) {
      return res.status(400).json({
        error:
          "Files are too large. Please reduce file sizes or number of files. Maximum total size is 10MB.",
      });
    }

    if (error.name === "ValidationError") {
      console.error("Validation errors:", error.errors);
      return res.status(400).json({
        error: "Validation failed",
        details: Object.keys(error.errors).map(
          (key) => error.errors[key].message
        ),
      });
    }

    res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
};

// Get all expenses for the logged-in employee
const getEmployeeExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find({ employeeId: req.user.userId })
      .populate("expenses.approvedBy", "name")
      .sort({ createdAt: -1 });

    // Get employee data
    const employee = await User.findById(req.user.userId).select(
      "name employeeCode"
    );

    // Transform to include calculated fields and employee data
    const transformedExpenses = expenses.map((expense) => {
      const expenseObj = expense.toObject();
      return {
        ...expenseObj,
        employeeName: employee?.name || "",
        employeeCode: employee?.employeeCode || "",
        isResubmitted:
          expenseObj.expenses?.some((exp) => exp.isResubmitted) || false,
        resubmissionCount:
          expenseObj.expenses?.filter((exp) => exp.isResubmitted).length || 0,
      };
    });

    res.status(200).json({
      message: "Expenses fetched successfully",
      data: transformedExpenses,
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get all expenses (for admin/manager/finance)
const getAllExpenses = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    let query = {};

    if (user.role === "manager") {
      const departmentEmployees = await User.find({
        department: user.department,
      }).select("_id");

      query.employeeId = {
        $in: departmentEmployees.map((emp) => emp._id.toString()),
      };
    }

    const expenses = await Expense.find(query)
      .populate("expenses.approvedBy", "name")
      .sort({ createdAt: -1 });

    // Get all unique employee IDs
    const employeeIds = [...new Set(expenses.map((exp) => exp.employeeId))];

    // Fetch all users in one query
    const users = await User.find({ _id: { $in: employeeIds } }).select(
      "_id name employeeCode"
    );

    // Create a map for quick lookup
    const userMap = {};
    users.forEach((u) => {
      userMap[u._id.toString()] = {
        name: u.name,
        employeeCode: u.employeeCode,
      };
    });

    // Transform to include calculated fields and employee data
    const transformedExpenses = expenses.map((expense) => {
      const expenseObj = expense.toObject();
      const employee = userMap[expenseObj.employeeId] || {};

      return {
        ...expenseObj,
        employeeName: employee.name || "",
        employeeCode: employee.employeeCode || "",
        isResubmitted:
          expenseObj.expenses?.some((exp) => exp.isResubmitted) || false,
        resubmissionCount:
          expenseObj.expenses?.filter((exp) => exp.isResubmitted).length || 0,
      };
    });

    res.status(200).json({
      message: "Expenses fetched successfully",
      data: transformedExpenses,
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get expense by ID
const getExpenseById = async (req, res) => {
  try {
    const { id } = req.params;

    const expense = await Expense.findById(id).populate(
      "expenses.approvedBy",
      "name"
    );

    if (!expense) {
      return res.status(404).json({ error: "Expense not found" });
    }

    // Get employee data
    const employee = await User.findById(expense.employeeId).select(
      "name employeeCode"
    );

    // Transform to include employee data
    const expenseObj = expense.toObject();
    const transformedExpense = {
      ...expenseObj,
      employeeName: employee?.name || "",
      employeeCode: employee?.employeeCode || "",
      isResubmitted:
        expenseObj.expenses?.some((exp) => exp.isResubmitted) || false,
      resubmissionCount:
        expenseObj.expenses?.filter((exp) => exp.isResubmitted).length || 0,
    };

    res.status(200).json({
      message: "Expense fetched successfully",
      data: transformedExpense,
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

// Update expense
const updateExpense = async (req, res) => {
  try {
    const { id, expenseId } = req.params;
    const { expenseType, amount, description, startDate, endDate } = req.body;

    let submission = await Expense.findById(id);

    if (!submission) {
      return res.status(404).json({ error: "Submission not found" });
    }

    if (submission.employeeId !== req.user.userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Find the specific expense
    const expenseIndex = submission.expenses.findIndex(
      (exp) => exp._id.toString() === expenseId
    );

    if (expenseIndex === -1) {
      return res.status(404).json({ error: "Expense not found in submission" });
    }

    const currentExpense = submission.expenses[expenseIndex];

    // Check if expense can be updated
    if (
      currentExpense.status !== "pending" &&
      currentExpense.status !== "rejected"
    ) {
      return res.status(400).json({ error: "Cannot update approved expense" });
    }

    // Update fields
    if (expenseType) currentExpense.expenseType = expenseType;
    if (amount) currentExpense.amount = Number(amount);
    if (description) currentExpense.description = description;
    if (startDate) currentExpense.startDate = new Date(startDate);
    if (endDate) currentExpense.endDate = new Date(endDate);

    // Handle file update
    if (req.files && req.files.length > 0) {
      const file = req.files[0];
      const base64Data = file.buffer.toString("base64");

      currentExpense.files = [
        {
          name: String(file.originalname),
          type: String(file.mimetype),
          data: String(base64Data),
        },
      ];
    }

    // Mark as resubmitted
    currentExpense.isResubmitted = true;
    currentExpense.reSubmittedDate = new Date();
    currentExpense.status = "pending"; // Reset to pending after edit

    // Recalculate total amount
    submission.totalAmount = submission.expenses.reduce(
      (sum, exp) => sum + Number(exp.amount),
      0
    );

    await submission.save();

    res.status(200).json({
      message: "Expense updated successfully",
      data: submission,
    });
  } catch (error) {
    console.error("Update single expense error:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
};

// Manager approve/reject expense
const managerReviewExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, adminComments } = req.body;

    if (!["approved", "managerApproved", "rejected"].includes(action)) {
      return res.status(400).json({ error: "Invalid action" });
    }

    if (action === "rejected" && !adminComments) {
      return res.status(400).json({ error: "Comments required for rejection" });
    }

    let expense = await Expense.findById(id);

    if (!expense) {
      return res.status(404).json({ error: "Expense not found" });
    }
    expense.expenses.forEach((exp) => {
      exp.status = action;
      exp.approvedBy = req.user.userId;
      exp.approvedAt = new Date();
      exp.adminComments = adminComments;
    });

    expense.isManagerApproved = action === "managerApproved";
    expense.status = action;

    await expense.save();
    res.status(200).json({
      message: `Expense ${action} successfully`,
      data: expense,
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

// Finance approve/reject expense

const financeReviewExpense = async (req, res) => {
  try {
    const { id, expenseId } = req.params;
    const { action, adminComments } = req.body;

    if (!["approved", "rejected"].includes(action)) {
      return res.status(400).json({ error: "Invalid action" });
    }

    if (action === "rejected" && !adminComments) {
      return res.status(400).json({ error: "Comments required for rejection" });
    }

    let expense = await Expense.findById(id);

    if (!expense) {
      return res.status(404).json({ error: "Expense not found" });
    }

    if (!expense.isManagerApproved) {
      return res.status(400).json({ error: "Manager approval required first" });
    }

    // Find the specific expense
    const expenseIndex = expense.expenses.findIndex(
      (exp) => exp._id.toString() === expenseId
    );

    if (expenseIndex === -1) {
      return res.status(404).json({ error: "Expense not found in submission" });
    }

    const currentExpense = expense.expenses[expenseIndex];

    currentExpense.status = action;

    // Check if all expenses are reviewed (either approved or rejected)
    const allReviewed = expense.expenses.every(
      (exp) => exp.status === "approved" || exp.status === "rejected"
    );

    // Check if all expenses are approved
    const allApproved = expense.expenses.every(
      (exp) => exp.status === "approved"
    );

    // Update submission-level status
    if (allReviewed) {
      if (allApproved) {
        expense.isFinanceApproved = true;
        expense.status = "approved";
      } else {
        // If any expense is rejected, mark the whole submission as rejected
        expense.isFinanceApproved = false;
        expense.status = "rejected";
      }
    } else {
      // Still pending review for some expenses
      expense.status = "managerApproved"; // Keep it at manager approved until all reviewed
    }

    await expense.save();

    res.status(200).json({
      message: `Expense ${action} successfully`,
      data: expense,
    });
  } catch (error) {
    console.error("Finance review error:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
};

// Delete expense
const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;

    const expense = await Expense.findById(id);

    if (!expense) {
      return res.status(404).json({ error: "Expense not found" });
    }

    if (expense.employeeId !== req.user.userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    if (expense.status !== "pending") {
      return res
        .status(400)
        .json({ error: "Cannot delete non-pending expense" });
    }

    await expense.deleteOne();

    res.status(200).json({
      message: "Expense deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get expense file for viewing/downloading
const getExpenseFile = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(req.user.userId);

    const expense = await Expense.findById(id);

    if (!expense) {
      return res.status(404).json({ error: "Expense not found" });
    }

    // Check access permissions
    if (
      user.role !== "admin" &&
      user.role !== "finance" &&
      user.role !== "manager"
    ) {
      if (expense.employeeId !== req.user.userId) {
        return res.status(403).json({ error: "Access denied" });
      }
    }

    // Find expense item with file
    let fileData = null;
    for (const expenseItem of expense.expenses) {
      if (expenseItem.files && expenseItem.files.length > 0) {
        fileData = expenseItem.files[0];
        break;
      }
    }

    if (!fileData) {
      return res.status(404).json({ error: "File not found" });
    }

    res.status(200).json({
      fileData: fileData.data,
      fileType: fileData.type,
      fileName: fileData.name,
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  createExpense,
  getEmployeeExpenses,
  getAllExpenses,
  getExpenseById,
  updateExpense,
  managerReviewExpense,
  financeReviewExpense,
  deleteExpense,
  getExpenseFile,
};
