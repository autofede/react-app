import { Box, Typography, Paper } from '@mui/material';

interface WelcomeUserProps {
  userId: string;
  userType: 'existing' | 'new' | 'admin';
}

function WelcomeUser({ userId, userType }: WelcomeUserProps) {
  const getWelcomeMessage = () => {
    switch (userType) {
      case 'existing':
        return `Hi, user ${userId}. Welcome back!`;
      case 'new':
        return `Hi, your ${userId} is added. Welcome to answer our surveys!`;
      case 'admin':
        return 'Hi, administrator. Welcome to review the questionnaire results!';
      default:
        return 'Welcome!';
    }
  };

  return (
    <Box p={3}>
      <Paper elevation={3} sx={{ p: 4, maxWidth: 600, mx: 'auto', textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom>
          {getWelcomeMessage()}
        </Typography>
      </Paper>
    </Box>
  );
}

export default WelcomeUser; 