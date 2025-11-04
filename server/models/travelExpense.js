const mongoose = require("mongoose");

const expensesSchema = new mongoose.Schema({
  expenseType: {
    type: String,
    required: true,
    enum: [
      "travel",
      "breakfast",
      "lunch",
      "dinner",
      "accommodation",
      "transportation",
      "fuel",
      "office_supplies",
      "training",
      "other",
    ],
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  description: {
    type: String,
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  files: [{ name: String, type: String, data: String }],
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  approvedAt: Date,
  adminComments: String,
  reSubmittedDate: Date,
  isResubmitted: {
    type: Boolean,
    default: false,
  },
});
 
const expense = new mongoose.Schema({
  employeeId: {
    type: String,
    required: true,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  expenses: [expensesSchema],
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  isManagerApproved: {
    type: Boolean,
    default: false,
  },
  isFinanceApproved: {
    type: Boolean,
    default: false,
  },
});
 
module.exports = {
  Expense: mongoose.model("Expense", expense),
};