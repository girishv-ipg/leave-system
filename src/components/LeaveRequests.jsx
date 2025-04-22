'use client';

import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';

import { useState } from 'react';

const dummyLeaveRequests = [
  {
    id: 1,
    employeeName: 'David Miller',
    from: '2025-04-10',
    to: '2025-04-12',
    reason: 'Medical',
    status: 'Pending',
  },
  {
    id: 2,
    employeeName: 'Sophie Lee',
    from: '2025-04-15',
    to: '2025-04-16',
    reason: 'Family Function',
    status: 'Pending',
  },
];

export default function LeaveRequests() {
  const [leaveRequests, setLeaveRequests] = useState(dummyLeaveRequests);

  const updateStatus = (id, newStatus) => {
    setLeaveRequests((prev) =>
      prev.map((req) =>
        req.id === id ? { ...req, status: newStatus } : req
      )
    );
  };

  return (
    <>
      <Typography variant="h5" sx={{ mt: 5, mb: 2 }}>
        Pending Leave Requests
      </Typography>
      {leaveRequests.length === 0 ? (
        <Typography>No pending requests.</Typography>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Employee Name</TableCell>
              <TableCell>From</TableCell>
              <TableCell>To</TableCell>
              <TableCell>Reason</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {leaveRequests.map((req) => (
              <TableRow key={req.id}>
                <TableCell>{req.employeeName}</TableCell>
                <TableCell>{req.from}</TableCell>
                <TableCell>{req.to}</TableCell>
                <TableCell>{req.reason}</TableCell>
                <TableCell>{req.status}</TableCell>
                <TableCell>
                  <Button
                    size="small"
                    color="success"
                    onClick={() => updateStatus(req.id, 'Approved')}
                    disabled={req.status !== 'Pending'}
                  >
                    Approve
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    onClick={() => updateStatus(req.id, 'Denied')}
                    disabled={req.status !== 'Pending'}
                    sx={{ ml: 1 }}
                  >
                    Deny
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </>
  );
}
