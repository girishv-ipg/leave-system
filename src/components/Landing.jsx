'use client';

import { Box, Button, Container, TextField, Typography } from '@mui/material';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LandingPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignIn = () => {
    if (email && password) {
      // Basic mock auth
      localStorage.setItem('user', JSON.stringify({ email }));
      router.push('/home');
    } else {
      alert('Please enter email and password.');
    }
  };

  return (
    <Container maxWidth="xs" sx={{ mt: 10 }}>
      <Typography variant="h4" align="center" gutterBottom>
        Sign In
      </Typography>
      <Box display="flex" flexDirection="column" gap={2}>
        <TextField
          label="Email"
          type="email"
          variant="outlined"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          fullWidth
        />
        <TextField
          label="Password"
          type="password"
          variant="outlined"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          fullWidth
        />
        <Button variant="contained" color="primary" onClick={handleSignIn}>
          Sign In
        </Button>
      </Box>
    </Container>
  );
}
