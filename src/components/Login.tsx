import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Paper,
  Alert,
  Tabs,
  Tab,
  CircularProgress,
} from '@mui/material';
import axios from 'axios';
import { setUser } from '../store/userSlice';

interface UserInfo {
  id: string;
  type: 'existing' | 'new' | 'admin';
  isAuthenticated: boolean;
}

interface LoginProps {
  setUserInfo: (userInfo: UserInfo) => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function Login({ setUserInfo }: LoginProps) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [tabValue, setTabValue] = useState(0);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setError('');
    setFormData({ username: '', password: '' });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateUsername = (username: string) => {
    if (username === 'admin') return true;
    return /^\d+$/.test(username);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateUsername(formData.username)) {
      setError('Username must be a number or "admin"');
      return;
    }

    if (formData.username === 'admin') {
      setUserInfo({
        id: 'admin',
        type: 'admin',
        isAuthenticated: true
      });
      navigate('/statistics');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post('http://127.0.0.1:5000/api/login', formData);
      
      if (response.data.success) {
        dispatch(setUser({
          userId: response.data.user_id,
          username: formData.username,
          type: 'existing',
        }));
        setUserInfo({
          id: formData.username,
          type: 'existing',
          isAuthenticated: true
        });
        navigate('/responses');
      } else {
        setError('Invalid username or password');
      }
    } catch (err) {
      setError('Error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateUsername(formData.username)) {
      setError('Username must be a number');
      return;
    }

    if (formData.username === 'admin') {
      setError('Username cannot be "admin"');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post('http://127.0.0.1:5000/api/register', formData);
      
      if (response.data.success) {
        setUserInfo({
          id: formData.username,
          type: 'new',
          isAuthenticated: true
        });
        navigate('/dashboard');
      } else {
        if (response.data.error === 'Username already exists') {
          setError('This username is already registered. Please try another one or login.');
        } else {
          setError(response.data.message || 'Registration failed');
        }
      }
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.error === 'Username already exists') {
        setError('This username is already registered. Please try another one or login.');
      } else {
        setError('Error occurred during registration');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography component="h1" variant="h5" align="center" gutterBottom>
            Survey System
          </Typography>
          
          <Tabs value={tabValue} onChange={handleTabChange} centered sx={{ mb: 2 }}>
            <Tab label="Login" />
            <Tab label="Register" />
          </Tabs>

          {error && (
            <Alert 
              severity={error.includes('already registered') ? 'warning' : 'error'} 
              sx={{ mb: 2 }}
              action={
                error.includes('already registered') && (
                  <Button 
                    color="inherit" 
                    size="small" 
                    onClick={() => setTabValue(0)}
                  >
                    Go to Login
                  </Button>
                )
              }
            >
              {error}
            </Alert>
          )}

          <TabPanel value={tabValue} index={0}>
            <Box component="form" onSubmit={handleLogin}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="username"
                label="Username"
                name="username"
                autoComplete="username"
                autoFocus
                value={formData.username}
                onChange={handleChange}
                helperText="Enter a number or 'admin'"
                disabled={loading}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                autoComplete="current-password"
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3 }}
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Box component="form" onSubmit={handleRegister}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="username"
                label="Username"
                name="username"
                autoComplete="username"
                autoFocus
                value={formData.username}
                onChange={handleChange}
                helperText="Enter a number"
                disabled={loading}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                autoComplete="new-password"
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3 }}
                disabled={loading}
              >
                {loading ? 'Registering...' : 'Register'}
              </Button>
            </Box>
          </TabPanel>
        </Paper>
      </Box>
    </Container>
  );
}

export default Login; 