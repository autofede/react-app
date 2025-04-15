import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { Provider } from 'react-redux';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';
import Login from './components/Login';
import Layout from './components/Layout';
import SurveyDashboard from './components/SurveyDashboard';
import Statistics from './components/Statistics';
import Responses from './components/Responses';
import { useState } from 'react';
import { store } from './store';

interface UserInfo {
  id: string;
  type: 'existing' | 'new' | 'admin';
  isAuthenticated: boolean;
}

function App() {
  const [userInfo, setUserInfo] = useState<UserInfo>({
    id: '',
    type: 'existing',
    isAuthenticated: false
  });
  const [hasAnswers, setHasAnswers] = useState(false);

  const getDefaultRoute = (userType: string) => {
    switch (userType) {
      case 'admin':
        return '/statistics';
      case 'existing':
        return '/responses';
      case 'new':
        return '/dashboard';
      default:
        return '/login';
    }
  };

  const canAccessRoute = (route: string) => {
    if (!userInfo.isAuthenticated) return false;
    
    switch (userInfo.type) {
      case 'existing':
        if (route === 'responses') return true;
        if (route === 'dashboard') return !hasAnswers;
        return false;
      case 'new':
        return route === 'dashboard';
      case 'admin':
        return route === 'statistics';
      default:
        return false;
    }
  };

  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Routes>
            <Route path="/login" element={
              userInfo.isAuthenticated ? 
                <Navigate to={getDefaultRoute(userInfo.type)} replace /> : 
                <Login setUserInfo={setUserInfo} />
            } />
            <Route path="/" element={<Layout userInfo={userInfo} setUserInfo={setUserInfo} hasAnswers={hasAnswers} />}>
              <Route index element={
                userInfo.isAuthenticated ? 
                  <Navigate to={getDefaultRoute(userInfo.type)} replace /> : 
                  <Navigate to="/login" replace />
              } />
              <Route path="dashboard" element={
                canAccessRoute('dashboard') ? 
                  <SurveyDashboard /> : 
                  <Navigate to="/login" replace />
              } />
              <Route path="statistics" element={
                canAccessRoute('statistics') ? 
                  <Statistics /> : 
                  <Navigate to="/login" replace />
              } />
              <Route path="responses" element={
                canAccessRoute('responses') ? 
                  <Responses userInfo={userInfo} setHasAnswers={setHasAnswers} /> : 
                  <Navigate to="/login" replace />
              } />
            </Route>
          </Routes>
        </Router>
      </ThemeProvider>
    </Provider>
  );
}

export default App;
