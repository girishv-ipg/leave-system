const mongoose = require("mongoose");
const { create } = require("./user");

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
  attendees: {
    type: String,
  },
  purpose: {
    type: String,
  },
  status: {
    type: String,
    enum: ["pending", "managerApproved", "approved", "rejected"],
    default: "pending",
  },
  files: [
    {
      name: { type: String },
      type: { type: String },
      data: { type: String },
    },
  ],
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  approvedAt: Date,
  adminComments: String,
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
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ["pending", "approved", "managerApproved", "rejected"],
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
