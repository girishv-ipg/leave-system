// utils/exportUtils.js

import * as XLSX from "xlsx";

import { getExtension, safeFilename } from "./expenseHelpers";

import JSZip from "jszip";
import { saveAs } from "file-saver";

/**
 * Export submission to Excel file
 * @param {Object} submission - Expense submission data
 * @returns {Promise<void>}
 */
export const exportToExcel = (submission) => {
  const workbook = XLSX.utils.book_new();

  // Prepare data for Excel
  const excelData = submission.expenses.map((expense, index) => ({
    "S.No": index + 1,
    "Employee Name": submission.employeeName,
    "Employee Code": submission.employeeCode,
    "Expense Type": expense.expenseType,
    "Amount (₹)": parseFloat(expense.amount).toLocaleString(),
    Description: expense.description,
    "Travel Start Date": expense.startDate
      ? new Date(expense.startDate).toLocaleDateString()
      : "",
    "Travel End Date": expense.endDate
      ? new Date(expense.endDate).toLocaleDateString()
      : "",
    Purpose: expense.purpose || "-",
    Attendees: expense.attendees || "-",
    Status: expense.status.charAt(0).toUpperCase() + expense.status.slice(1),
    "Approved At": submission.approvedAt
      ? new Date(submission.approvedAt).toLocaleDateString()
      : "-",
    "Admin Comments": expense.adminComments || "-",
    "Submitted Date": new Date(submission.createdAt).toLocaleDateString(),
    "Is Resubmitted": expense.isResubmitted ? "Yes" : "No",
  }));

  // Add blank rows for spacing
  excelData.push({});
  excelData.push({});

  // Add total amount
  excelData.push({
    "Expense Type": "TOTAL",
    "Amount (₹)": parseFloat(submission.totalAmount).toLocaleString(),
  });

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(excelData);

  // Set column widths
  const columnWidths = [
    { wch: 8 },  // S.No
    { wch: 20 }, // Employee Name
    { wch: 15 }, // Employee Code
    { wch: 15 }, // Expense Type
    { wch: 12 }, // Amount
    { wch: 30 }, // Description
    { wch: 15 }, // Travel Start Date
    { wch: 15 }, // Travel End Date
    { wch: 20 }, // Purpose
    { wch: 20 }, // Attendees
    { wch: 12 }, // Status
    { wch: 15 }, // Approved At
    { wch: 25 }, // Admin Comments
    { wch: 15 }, // Submitted Date
    { wch: 15 }, // Is Resubmitted
  ];
  worksheet["!cols"] = columnWidths;

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, "Expenses");

  // Generate filename
  const fileName = `${submission.employeeName}_${
    submission.employeeCode
  }_Expenses_${new Date().toLocaleDateString().replace(/\//g, "-")}.xlsx`;

  // Save file
  XLSX.writeFile(workbook, fileName);

  return fileName;
};

/**
 * Download all receipts in a submission as ZIP
 * @param {Object} submission - Expense submission data
 * @returns {Promise<void>}
 */
export const downloadAllReceipts = async (submission) => {
  try {
    if (!submission || !Array.isArray(submission.expenses)) {
      throw new Error("No expenses found in this submission");
    }

    // Collect all files
    const files = [];
    submission.expenses.forEach((exp, expIdx) => {
      (exp.files || []).forEach((f, fileIdx) => {
        files.push({
          expense: exp,
          file: f,
          expIdx,
          fileIdx,
        });
      });
    });

    if (files.length === 0) {
      throw new Error("No receipts found in this submission");
    }

    const zip = new JSZip();

    // Create folder name
    const baseFolderName = safeFilename(
      `${submission.employeeName || "Employee"}_${
        submission.employeeCode || "Code"
      }_${new Date(
        submission.createdAt || submission.updatedAt
      ).toLocaleDateString()}`
    );

    const root = zip.folder(baseFolderName) || zip;

    // Add files to ZIP
    for (const { expense, file, expIdx, fileIdx } of files) {
      const ext = getExtension(file.name, file.type);
      const prettyName = safeFilename(
        `${String(expIdx + 1).padStart(2, "0")}_${
          expense.expenseType || "expense"
        }_${expense.amount || 0}_${String(fileIdx + 1).padStart(
          2,
          "0"
        )}.${ext}`
      );

      // Add file to ZIP (base64 decode handled by JSZip)
      root.file(prettyName, file.data, { base64: true });
    }

    // Generate ZIP blob
    const zipBlob = await zip.generateAsync({ type: "blob" });

    // Create filename
    const zipName = `${safeFilename(
      submission.employeeName || "Employee"
    )}_${safeFilename(submission.employeeCode || "Code")}_receipts.zip`;

    // Download ZIP
    saveAs(zipBlob, zipName);

    return zipName;
  } catch (error) {
    throw new Error(`Failed to create ZIP: ${error.message}`);
  }
};

/**
 * Download a single receipt
 * @param {Object} expense - Expense object with files
 * @returns {Promise<void>}
 */
export const downloadSingleReceipt = async (expense) => {
  try {
    if (!expense.files || expense.files.length === 0) {
      throw new Error("No receipt found for this expense");
    }

    const file = expense.files[0];

    if (!file.data) {
      throw new Error("File data is missing");
    }

    // Decode base64
    let cleanData = file.data.trim().replace(/\s+/g, "");
    if (cleanData.includes(",")) {
      cleanData = cleanData.split(",")[1];
    }

    const binaryString = atob(cleanData);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const normalizedMimeType = file.type === "image/jpg" ? "image/jpeg" : file.type;
    const blob = new Blob([bytes], { type: normalizedMimeType });

    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;

    // Get file extension
    const extension =
      file.name?.split(".").pop() ||
      (file.type?.includes("pdf")
        ? "pdf"
        : file.type?.includes("image")
        ? file.type.split("/")[1] || "jpg"
        : "file");

    link.download = `${expense.expenseType}_${expense.amount}_receipt.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => URL.revokeObjectURL(url), 1000);

    return link.download;
  } catch (error) {
    throw new Error(`Error downloading receipt: ${error.message}`);
  }
};