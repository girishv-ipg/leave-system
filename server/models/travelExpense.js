// ============================================================================
// DATABASE SCHEMA MODELS
// ============================================================================

// models/BulkSubmission.js
const mongoose = require('mongoose');

const bulkSubmissionSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  totalAmount: {
    type: Number,
    required: true
  },
  overallStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'mixed'],
    default: 'pending'
  },
  expenseCount: {
    type: Number,
    required: true
  },
  statusCounts: {
    approved: { type: Number, default: 0 },
    pending: { type: Number, default: 0 },
    rejected: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// models/Expense.js - Enhanced schema
const expenseSchema = new mongoose.Schema({
  bulkSubmissionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BulkSubmission',
    required: true
  },
  bulkSubmissionIndex: {
    type: Number,
    required: true
  },
  employeeId: {
    type: String,
    ref: 'User',
    required: true
  },
  expenseType: {
    type: String,
    required: true,
    enum: ['travel', 'Breakfast', 'Lunch', 'Dinner', 'accommodation', 'transportation', 'fuel', 'office_supplies', 'training', 'other']
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    required: true
  },
  travelStartDate: {
    type: Date,
    required: true
  },
  travelEndDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  fileName: String,
  fileType: String,
  fileSize: Number,
  fileData: String, // Base64 encoded
  
  // Review fields
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: Date,
  comments: String,
  
  // Edit tracking
  isEdited: {
    type: Boolean,
    default: false
  },
  isResubmitted: {
    type: Boolean,
    default: false
  },
  lastEditDate: Date,
  resubmissionDate: Date,
  editHistory: [{
    editDate: { type: Date, default: Date.now },
    previousStatus: String,
    editedFields: {
      amount: { old: Number, new: Number },
      description: { old: String, new: String },
      expenseType: { old: String, new: String },
      travelStartDate: { old: Date, new: Date },
      travelEndDate: { old: Date, new: Date }
    },
    fileUpdated: { type: Boolean, default: false }
  }]
}, {
  timestamps: true
});

module.exports = {
  BulkSubmission: mongoose.model('BulkSubmission', bulkSubmissionSchema),
  Expense: mongoose.model('Expense', expenseSchema)
};