import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  TextField,
  Rating,
  Select,
  MenuItem,
  Button,
} from '@mui/material';
import axios from 'axios';

interface Answer {
  answer_id: number;
  numerical_answer: string | null;
  option_id: number | null;
  question_id: number;
  question_text: string;
  response_id: number;
  selected_option: string | null;
  text_answer: string | null;
  type_id: number;
  options?: Array<{
    option_id: number;
    option_text: string;
    sequence_number: number;
  }>;
}

interface ResponsesProps {
  userInfo: {
    id: string;
    type: 'existing' | 'new' | 'admin';
    isAuthenticated: boolean;
  };
  setHasAnswers: (hasAnswers: boolean) => void;
}

function Responses({ userInfo, setHasAnswers }: ResponsesProps) {
  const navigate = useNavigate();
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!userInfo.id) {
          setError('User ID not found');
          setLoading(false);
          setHasAnswers(false);
          return;
        }

        const response = await axios.get(`http://127.0.0.1:5000/api/respondents/${userInfo.id}/answers`);
        if (response.data.success) {
          if (response.data.data && response.data.data.length > 0) {
            setAnswers(response.data.data);
            setHasAnswers(true);
          } else {
            setError('No answers found for this user');
            setHasAnswers(false);
          }
        } else {
          setError('Failed to fetch answers');
          setHasAnswers(false);
        }
      } catch (err) {
        setError('Error fetching data');
        console.error('Error:', err);
        setHasAnswers(false);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userInfo.id, setHasAnswers]);

  const handleAnswerChange = (answer: Answer, value: string | number | null) => {
    const updatedAnswers = answers.map(a => {
      if (a.answer_id === answer.answer_id) {
        if (answer.type_id === 5) {
          return { ...a, numerical_answer: value?.toString() || null };
        } else if (answer.type_id === 1 || answer.type_id === 2) {
          return { ...a, selected_option: value as string };
        } else {
          return { ...a, text_answer: value as string };
        }
      }
      return a;
    });
    setAnswers(updatedAnswers);
  };

  const handleSave = async () => {
    try {
      if (!userInfo.id) {
        setError('User ID not found');
        return;
      }

      const formattedAnswers = answers.map(answer => ({
        answer_id: answer.answer_id,
        question_id: answer.question_id,
        response_id: answer.response_id,
        numerical_answer: answer.type_id === 5 ? answer.numerical_answer : null,
        text_answer: (answer.type_id === 3 || answer.type_id === 4) ? answer.text_answer : null,
        selected_option: (answer.type_id === 1 || answer.type_id === 2) ? answer.selected_option : null,
        type_id: answer.type_id
      }));

      const response = await axios.put(`http://127.0.0.1:5000/api/respondents/${userInfo.id}/answers`, {
        answers: formattedAnswers
      });

      if (response.data.success) {
        setIsEditing(false);
      } else {
        setError('Failed to save answers');
      }
    } catch (err) {
      setError('Error saving answers');
      console.error('Error:', err);
    }
  };

  const handleGoToSurvey = () => {
    navigate('/dashboard');
  };

  const renderAnswer = (answer: Answer) => {
    const sortedOptions = answer.options?.sort((a, b) => a.sequence_number - b.sequence_number) || [];

    switch (answer.type_id) {
      case 1: // 单选框
        return (
          <FormControl fullWidth disabled={!isEditing}>
            <RadioGroup
              value={answer.selected_option || ''}
              onChange={(e) => handleAnswerChange(answer, e.target.value)}
            >
              {sortedOptions.map((option) => (
                <FormControlLabel
                  key={option.option_id}
                  value={option.option_text}
                  control={<Radio />}
                  label={option.option_text}
                />
              ))}
            </RadioGroup>
          </FormControl>
        );

      case 2: // 下拉列表
        return (
          <FormControl fullWidth>
            <Select
              value={answer.selected_option || ''}
              onChange={(e) => handleAnswerChange(answer, e.target.value)}
              disabled={!isEditing}
            >
              {sortedOptions.map((option) => (
                <MenuItem key={option.option_id} value={option.option_text}>
                  {option.option_text}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );

      case 3: // 文本框
        return (
          <TextField
            fullWidth
            value={answer.text_answer || ''}
            onChange={(e) => handleAnswerChange(answer, e.target.value)}
            disabled={!isEditing}
          />
        );

      case 4: // 文本区域
        return (
          <TextField
            fullWidth
            multiline
            rows={4}
            value={answer.text_answer || ''}
            onChange={(e) => handleAnswerChange(answer, e.target.value)}
            disabled={!isEditing}
          />
        );

      case 5: // 评分
        return (
          <Rating
            value={parseFloat(answer.numerical_answer || '0')}
            onChange={(_, value) => handleAnswerChange(answer, value)}
            precision={0.5}
            readOnly={!isEditing}
          />
        );

      default:
        return answer.text_answer || answer.selected_option || answer.numerical_answer;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error === 'No answers found for this user') {
    return (
      <Box p={3}>
        <Alert 
          severity="info"
          action={
            <Button
              color="primary"
              variant="contained"
              size="small"
              onClick={handleGoToSurvey}
            >
              Go to Survey
            </Button>
          }
        >
          No answers found. Would you like to complete the survey now?
        </Alert>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (answers.length === 0) {
    return (
      <Box p={3}>
        <Alert 
          severity="info"
          action={
            <Button
              color="primary"
              variant="contained"
              size="small"
              onClick={handleGoToSurvey}
            >
              Go to Survey
            </Button>
          }
        >
          No answers found. Would you like to complete the survey now?
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          Respondent Answers
        </Typography>
        <Box>
          {isEditing ? (
            <>
              <Button variant="contained" color="primary" onClick={handleSave} sx={{ mr: 1 }}>
                Save
              </Button>
              <Button variant="outlined" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            </>
          ) : (
            <Button variant="contained" onClick={() => setIsEditing(true)}>
              Edit
            </Button>
          )}
        </Box>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Question</TableCell>
              <TableCell>Answer</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {answers.map((answer) => (
              <TableRow key={answer.answer_id}>
                <TableCell>{answer.question_text}</TableCell>
                <TableCell>{renderAnswer(answer)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default Responses; 