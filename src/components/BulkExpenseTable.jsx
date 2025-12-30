// components/BulkExpenseTable.jsx

import {
  AttachMoney,
  BusinessCenter,
  CalendarToday,
  Category,
  Delete,
  Description,
  PersonAdd,
  Receipt,
} from "@mui/icons-material";
import {
  Box,
  FormControl,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
} from "@mui/material";

import { EXPENSE_TYPES } from "@/constants/expenseConstants";
import FileUploadCell from "./FileUploadCell";

/**
 * Bulk Expense Table Component
 * Editable table for managing multiple expense entries
 */
export default function BulkExpenseTable({
  expenses,
  onUpdateExpense,
  onDeleteExpense,
  onFileChange,
  loading = false,
}) {

  return (
    <TableContainer
      sx={{
        minHeight: "400px",
        maxHeight: { xs: "55vh", sm: "65vh", md: "70vh", lg: "52vh" },
      }}
    >
      <Table stickyHeader>
        <TableHead>
          <TableRow>
            {/* Serial Number */}
            <TableCell
              sx={{
                fontWeight: 600,
                bgcolor: "primary.main",
                color: "white",
              }}
            >
              Sl No.
            </TableCell>

            {/* Expense Type */}
            <TableCell
              sx={{
                fontWeight: 600,
                bgcolor: "primary.main",
                color: "white",
                minWidth: 150,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Category sx={{ fontSize: 16 }} />
                Expense Type
              </Box>
            </TableCell>

            {/* Amount */}
            <TableCell
              sx={{
                fontWeight: 600,
                bgcolor: "primary.main",
                color: "white",
                minWidth: 120,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <AttachMoney sx={{ fontSize: 16 }} />
                Amount (₹)
              </Box>
            </TableCell>

            {/* Description */}
            <TableCell
              sx={{
                fontWeight: 600,
                bgcolor: "primary.main",
                color: "white",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Description sx={{ fontSize: 16 }} />
                Description
              </Box>
            </TableCell>

            {/* Start Date */}
            <TableCell
              sx={{
                fontWeight: 600,
                bgcolor: "primary.main",
                color: "white",
                minWidth: 150,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CalendarToday sx={{ fontSize: 16 }} />
                Start Date
              </Box>
            </TableCell>

            {/* End Date */}
            <TableCell
              sx={{
                fontWeight: 600,
                bgcolor: "primary.main",
                color: "white",
                minWidth: 150,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CalendarToday sx={{ fontSize: 16 }} />
                End Date
              </Box>
            </TableCell>

            {/* Purpose */}
            <TableCell
              sx={{
                fontWeight: 600,
                bgcolor: "primary.main",
                color: "white",
                minWidth: 150,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <BusinessCenter sx={{ fontSize: 16 }} />
                Purpose
              </Box>
            </TableCell>

            {/* Attendees */}
            <TableCell
              sx={{
                fontWeight: 600,
                bgcolor: "primary.main",
                color: "white",
                minWidth: 150,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <PersonAdd sx={{ fontSize: 16 }} />
                Attendees
              </Box>
            </TableCell>

            {/* Receipt */}
            <TableCell
              sx={{
                fontWeight: 600,
                bgcolor: "primary.main",
                color: "white",
                minWidth: 200,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Receipt sx={{ fontSize: 16 }} />
                Receipt
              </Box>
            </TableCell>
          </TableRow>
        </TableHead>

        <TableBody sx={{ minHeight: "400px", overflow: "auto" }}>
          {expenses.map((expense, index) => (
            <TableRow key={expense.id} hover>
              {/* Serial Number */}
              <TableCell
                sx={{
                  fontWeight: 600,
                  color: "primary.main",
                }}
              >
                {index + 1}
              </TableCell>

              {/* Expense Type Select */}
              <TableCell>
                <FormControl fullWidth size="small">
                  <Select
                    value={expense.expenseType}
                    onChange={(e) =>
                      onUpdateExpense(expense.id, "expenseType", e.target.value)
                    }
                    displayEmpty
                  >
                    {EXPENSE_TYPES.map((type) => (
                      <MenuItem key={type} value={type}>
                        {type
                          .replace("_", " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </TableCell>

              {/* Amount */}
              <TableCell>
                <TextField
                  type="number"
                  value={expense.amount}
                  onChange={(e) =>
                    onUpdateExpense(expense.id, "amount", e.target.value)
                  }
                  fullWidth
                  size="small"
                  placeholder="0.00"
                  inputProps={{ min: 0, step: 0.01 }}
                />
              </TableCell>

              {/* Description */}
              <TableCell>
                <TextField
                  value={expense.description}
                  onChange={(e) =>
                    onUpdateExpense(expense.id, "description", e.target.value)
                  }
                  fullWidth
                  sx={{ minWidth: 150 }}
                  size="small"
                  placeholder="Enter description"
                  multiline
                  maxRows={2}
                />
              </TableCell>

              {/* Start Date */}
              <TableCell>
                <TextField
                  type="date"
                  value={expense.travelStartDate}
                  onChange={(e) =>
                    onUpdateExpense(
                      expense.id,
                      "travelStartDate",
                      e.target.value
                    )
                  }
                  fullWidth
                  size="small"
                  InputLabelProps={{ shrink: true }}
                />
              </TableCell>

              {/* End Date */}
              <TableCell>
                <TextField
                  type="date"
                  value={expense.travelEndDate}
                  onChange={(e) =>
                    onUpdateExpense(expense.id, "travelEndDate", e.target.value)
                  }
                  fullWidth
                  size="small"
                  InputLabelProps={{ shrink: true }}
                />
              </TableCell>

              {/* Purpose */}
              <TableCell>
                <TextField
                  value={expense.purpose}
                  onChange={(e) =>
                    onUpdateExpense(expense.id, "purpose", e.target.value)
                  }
                  fullWidth
                  size="small"
                  placeholder="Enter purpose"
                  multiline
                  maxRows={2}
                />
              </TableCell>

              {/* Attendees */}
              <TableCell>
                <TextField
                  value={expense.attendees}
                  onChange={(e) =>
                    onUpdateExpense(expense.id, "attendees", e.target.value)
                  }
                  fullWidth
                  size="small"
                  placeholder="Enter attendees"
                  multiline
                  maxRows={2}
                />
              </TableCell>

              {/* File Upload */}
              <TableCell>
                <FileUploadCell expense={expense} onFileChange={onFileChange} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
