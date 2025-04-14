import { Outlet, Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  Link,
} from '@mui/material';

interface UserInfo {
  id: string;
  type: 'existing' | 'new' | 'admin';
  isAuthenticated: boolean;
}

interface LayoutProps {
  userInfo: UserInfo;
  setUserInfo: (userInfo: UserInfo) => void;
  hasAnswers: boolean;
}

function Layout({ userInfo, setUserInfo, hasAnswers }: LayoutProps) {
  const navigate = useNavigate();

  const handleLogout = () => {
    setUserInfo({
      id: '',
      type: 'existing',
      isAuthenticated: false
    });
    navigate('/login');
  };

  const getNavLinks = () => {
    if (!userInfo.isAuthenticated) return [];

    let roleSpecificLinks = [];
    switch (userInfo.type) {
      case 'existing':
        roleSpecificLinks = [
          { text: 'Respondent Answers', path: '/responses' }
        ];
        if (!hasAnswers) {
          roleSpecificLinks.push({ text: 'Survey Dashboard', path: '/dashboard' });
        }
        break;
      case 'new':
        roleSpecificLinks = [
          { text: 'Survey Dashboard', path: '/dashboard' }
        ];
        break;
      case 'admin':
        roleSpecificLinks = [
          { text: 'Statistics', path: '/statistics' }
        ];
        break;
    }

    return roleSpecificLinks;
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {userInfo.isAuthenticated && (
              <Box display="flex" alignItems="center">
                <Link 
                  component={RouterLink} 
                  to={
                    userInfo.type === 'admin' 
                      ? '/statistics' 
                      : userInfo.type === 'existing'
                        ? '/responses'
                        : '/dashboard'
                  } 
                  color="inherit" 
                  underline="none"
                >
                  {userInfo.type === 'admin' ? 'Admin Dashboard' : 'Survey System'}
                </Link>
                <Typography variant="subtitle1" sx={{ ml: 2 }}>
                  {userInfo.type === 'admin' 
                    ? 'Administrator'
                    : `User ID: ${userInfo.id}`
                  }
                </Typography>
              </Box>
            )}
          </Typography>
          
          {userInfo.isAuthenticated && (
            <>
              {getNavLinks().map((link) => (
                <Button
                  key={link.path}
                  color="inherit"
                  component={RouterLink}
                  to={link.path}
                  sx={{ mx: 1 }}
                >
                  {link.text}
                </Button>
              ))}
              <Button 
                color="inherit" 
                onClick={handleLogout}
                sx={{ ml: 2 }}
              >
                Logout
              </Button>
            </>
          )}
        </Toolbar>
      </AppBar>
      <Container component="main" sx={{ flexGrow: 1, py: 3 }}>
        <Outlet />
      </Container>
    </Box>
  );
}

export default Layout; 