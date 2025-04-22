'use client';

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';

import { useState } from 'react';

const dummyEmployees = [
  {
    name: 'Alice Johnson',
    employeeCode: 'EMP001',
    email: 'alice@example.com',
    department: 'HR',
    leaveBalance: 12,
    leavesTaken: 8,
    status: 'Active',
    history: [
      { from: '2025-04-01', to: '2025-04-03', reason: 'Sick', status: 'Approved' },
      { from: '2025-03-10', to: '2025-03-11', reason: 'Personal', status: 'Denied' },
    ],
  },
  // more dummy employees...
];

export default function EmployeeTable() {
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [open, setOpen] = useState(false);

  const handleView = (employee) => {
    setSelectedEmployee(employee);
    setOpen(true);
  };

  const handleClose = () => {
    setSelectedEmployee(null);
    setOpen(false);
  };

  return (
    <>
      <Typography variant="h5" sx={{ mt: 3, mb: 2 }}>
        Employee Leave Overview
      </Typography>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Employee Code</TableCell>
            <TableCell>Department</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Leave Balance</TableCell>
            <TableCell>Leaves Taken</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Action</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {dummyEmployees.map((emp) => (
            <TableRow key={emp.employeeCode}>
              <TableCell>{emp.name}</TableCell>
              <TableCell>{emp.employeeCode}</TableCell>
              <TableCell>{emp.department}</TableCell>
              <TableCell>{emp.email}</TableCell>
              <TableCell>{emp.leaveBalance}</TableCell>
              <TableCell>{emp.leavesTaken}</TableCell>
              <TableCell>{emp.status}</TableCell>
              <TableCell>
                <Button size="small" onClick={() => handleView(emp)}>View</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle>Employee Leave History</DialogTitle>
        <DialogContent dividers>
          {selectedEmployee && (
            <>
              <Typography><strong>Name:</strong> {selectedEmployee.name}</Typography>
              <Typography><strong>Email:</strong> {selectedEmployee.email}</Typography>
              <Typography><strong>Department:</strong> {selectedEmployee.department}</Typography>
              <Typography><strong>Leave Balance:</strong> {selectedEmployee.leaveBalance}</Typography>
              <Typography><strong>Leaves Taken:</strong> {selectedEmployee.leavesTaken}</Typography>
              <Typography mt={2} mb={1}><strong>Leave Records:</strong></Typography>
              {selectedEmployee.history.length ? (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>From</TableCell>
                      <TableCell>To</TableCell>
                      <TableCell>Reason</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedEmployee.history.map((leave, i) => (
                      <TableRow key={i}>
                        <TableCell>{leave.from}</TableCell>
                        <TableCell>{leave.to}</TableCell>
                        <TableCell>{leave.reason}</TableCell>
                        <TableCell>{leave.status}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Typography>No leave records.</Typography>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
