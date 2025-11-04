// ./server/controllers/travelExpense.js
const { Expense } = require("../models/travelExpense");
const User = require("../models/user");

// Submit a new expense
const createExpense = async (req, res) => {
  try {
    const { expenses } = req.body;

    if (!Array.isArray(expenses) || expenses.length === 0) {
      return res.status(400).json({ error: "At least one expense is required" });
    }

    const totalAmount = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);

    const newExpense = new Expense({
      employeeId: req.user.userId,
      totalAmount,
      expenses,
    });

    await newExpense.save();

    res.status(201).json({
      message: "Expense submitted successfully",
      data: newExpense,
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get all expenses for the logged-in employee
const getEmployeeExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find({ employeeId: req.user.userId })
      .populate("expenses.approvedBy", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "Expenses fetched successfully",
      data: expenses,
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
        department: user.department 
      }).select("_id");
      
      query.employeeId = { $in: departmentEmployees.map(emp => emp._id.toString()) };
    }

    const expenses = await Expense.find(query)
      .populate("expenses.approvedBy", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "Expenses fetched successfully",
      data: expenses,
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get expense by ID
const getExpenseById = async (req, res) => {
  try {
    const { id } = req.params;

    const expense = await Expense.findById(id)
      .populate("expenses.approvedBy", "name");

    if (!expense) {
      return res.status(404).json({ error: "Expense not found" });
    }

    res.status(200).json({
      message: "Expense fetched successfully",
      data: expense,
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

// Update expense
const updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { expenses } = req.body;

    let expense = await Expense.findById(id);

    if (!expense) {
      return res.status(404).json({ error: "Expense not found" });
    }

    if (expense.employeeId !== req.user.userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    if (expense.status !== "pending") {
      return res.status(400).json({ error: "Cannot update non-pending expense" });
    }

    const totalAmount = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
    
    expense.expenses = expenses.map(exp => ({
      ...exp,
      isResubmitted: true,
      reSubmittedDate: new Date(),
    }));
    expense.totalAmount = totalAmount;

    await expense.save();

    res.status(200).json({
      message: "Expense updated successfully",
      data: expense,
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

// Manager approve/reject expense
const managerReviewExpense = async (req, res) => {
  try {
    const { id } = req.params;
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

    expense.expenses.forEach(exp => {
      exp.status = action;
      exp.approvedBy = req.user.userId;
      exp.approvedAt = new Date();
      exp.adminComments = adminComments;
    });

    expense.isManagerApproved = action === "approved";
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
    const { id } = req.params;
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

    expense.expenses.forEach(exp => {
      exp.status = action;
      exp.approvedBy = req.user.userId;
      exp.approvedAt = new Date();
      exp.adminComments = adminComments;
    });

    expense.isFinanceApproved = action === "approved";
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
      return res.status(400).json({ error: "Cannot delete non-pending expense" });
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
    if (user.role !== "admin" && user.role !== "finance" && user.role !== "manager") {
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