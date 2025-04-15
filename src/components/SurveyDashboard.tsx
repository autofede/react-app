import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box,
  Typography,
  Paper,
  FormControl,
  Select,
  MenuItem,
  TextField,
  Rating,
  SelectChangeEvent,
  Divider,
  InputLabel,
  Checkbox,
  FormGroup,
  FormControlLabel,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
} from '@mui/material';
import Star from '@mui/icons-material/Star';
import StarBorder from '@mui/icons-material/StarBorder';
import axios from 'axios';
import { RootState } from '../store';
import { setQuestions } from '../store/surveySlice';
import { setAddQuestions, clearAnswers } from '../store/answerSlice';
import { useNavigate } from 'react-router-dom';
import { clearUser } from '../store/userSlice';

interface Option {
  option_id: number;
  option_text: string;
  sequence_number: number;
}

interface Question {
  question_id: number;
  question_text: string;
  description: string | null;
  type_id: number;
  type_name: string;
  sequence_number: number;
  is_required: number;
  options: Option[];
}

interface Survey {
  survey_id: number;
  title: string;
  description: string;
  questions: Question[];
}

interface SurveyResponse {
  survey: {
    survey_id: number;
    title: string;
    description: string;
  };
  questions: Question[];
}

interface SurveyListItem {
  survey_id: number;
  title: string;
  description: string;
}

interface Answer {
  response_id: string;
  question_id: number;
  option_id: number[];
  text_answer: string;
  numerical_answer: number;
}

const API_BASE_URL = 'http://127.0.0.1:5000';

const SurveyDashboard = () => {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.user);
  const reduxAnswers = useSelector((state: RootState) => state.answer.answers);
  const navigate = useNavigate();
  const [surveys, setSurveys] = useState<SurveyListItem[]>([]);
  const [selectedSurveyId, setSelectedSurveyId] = useState<string>('');
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string | string[]>>({});
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // 更新 Redux 中的答案
  const updateReduxAnswers = (newAnswers: Record<number, string | string[]>) => {
    if (!survey) return;
    
    const formattedAnswers = survey.questions.map(question => {
      const answer = newAnswers[question.question_id];
      const formattedAnswer = {
        response_id: user.username,
        question_id: question.question_id,
        option_id: [] as number[],
        text_answer: '',
        numerical_answer: 0
      };

      switch (question.type_id) {
        case 1: // 单选下拉框
          if (typeof answer === 'string') {
            const selectedOption = question.options.find(opt => opt.option_text === answer);
            if (selectedOption) {
              formattedAnswer.option_id = [selectedOption.option_id];
            }
          }
          break;
        case 2: // 多选下拉框
          if (Array.isArray(answer)) {
            formattedAnswer.option_id = question.options
              .filter(opt => answer.includes(opt.option_text))
              .map(opt => opt.option_id);
          }
          break;
        case 3: // 文本框
        case 4: // 文本域
          if (typeof answer === 'string') {
            formattedAnswer.text_answer = answer;
          }
          break;
        case 5: // 评分
          if (typeof answer === 'string') {
            formattedAnswer.numerical_answer = parseInt(answer, 10) || 0;
          }
          break;
      }
      
      return formattedAnswer;
    });
    
    dispatch(setAddQuestions(formattedAnswers));
  };

  // 当 answers 变化时更新 Redux
  useEffect(() => {
    updateReduxAnswers(answers);
  }, [answers]);

  // 获取所有问卷列表
  useEffect(() => {
    const fetchSurveys = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/surveys`);
        if (response.data.success) {
          setSurveys(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching surveys:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSurveys();
  }, []);

  // 获取选中问卷的详细信息
  useEffect(() => {
    const fetchSurveyDetails = async () => {
      if (!selectedSurveyId) {
        setSurvey(null);
        return;
      }

      setLoading(true);
      try {
        const response = await axios.get<{ success: boolean; data: SurveyResponse }>(`${API_BASE_URL}/api/surveys/${selectedSurveyId}/questions`);
        if (response.data.success) {
          const surveyData = {
            ...response.data.data.survey,
            questions: response.data.data.questions.sort((a, b) => a.sequence_number - b.sequence_number)
          };
          setSurvey(surveyData);
          dispatch(setQuestions(surveyData.questions));
        }
      } catch (error) {
        console.error('Error fetching survey details:', error);
        setSurvey(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSurveyDetails();
  }, [selectedSurveyId, dispatch]);

  const handleSurveyChange = (event: SelectChangeEvent) => {
    setSelectedSurveyId(event.target.value);
  };

  const renderQuestionInput = (question: Question) => {
    const { type_id, options = [] } = question;
    
    switch (type_id) {
      case 1: // 单选框改为下拉列表
        return (
          <FormControl fullWidth>
            <InputLabel>{question.description || "Select an option"}</InputLabel>
            <Select
              label={question.description || "Select an option"}
              displayEmpty
              value={answers[question.question_id] || ''}
              onChange={(e) => {
                const newAnswers = { ...answers, [question.question_id]: e.target.value };
                setAnswers(newAnswers);
              }}
            >
              {[...options]
                .sort((a, b) => a.sequence_number - b.sequence_number)
                .map((option) => (
                  <MenuItem key={option.option_id} value={option.option_text}>
                    {option.option_text}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
        );

      case 2: // 多选下拉列表改为多选框
        return (
          <FormGroup>
            {[...options]
              .sort((a, b) => a.sequence_number - b.sequence_number)
              .map((option) => (
                <FormControlLabel
                  key={option.option_id}
                  control={
                    <Checkbox
                      checked={(answers[question.question_id] as string[] || []).includes(option.option_text)}
                      onChange={(e) => {
                        const currentAnswers = (answers[question.question_id] as string[] || []);
                        const newAnswers = e.target.checked
                          ? [...currentAnswers, option.option_text]
                          : currentAnswers.filter((text: string) => text !== option.option_text);
                        setAnswers({ ...answers, [question.question_id]: newAnswers });
                      }}
                    />
                  }
                  label={option.option_text}
                />
              ))}
          </FormGroup>
        );

      case 3: // 文本框
        return (
          <TextField
            fullWidth
            placeholder="Enter your answer here..."
            variant="outlined"
            value={answers[question.question_id] || ''}
            onChange={(e) => {
              setAnswers({ ...answers, [question.question_id]: e.target.value });
            }}
          />
        );

      case 4: // 文本域
        return (
          <TextField
            fullWidth
            multiline
            rows={4}
            placeholder="Enter your answer here..."
            variant="outlined"
            value={answers[question.question_id] || ''}
            onChange={(e) => {
              setAnswers({ ...answers, [question.question_id]: e.target.value });
            }}
          />
        );

      case 5: // 评分
        return (
          <Rating
            name={`question-${question.question_id}`}
            max={5}
            emptyIcon={<StarBorder fontSize="inherit" />}
            icon={<Star fontSize="inherit" />}
            value={Number(answers[question.question_id]) || 0}
            onChange={(_, newValue) => {
              setAnswers({ ...answers, [question.question_id]: newValue?.toString() || '' });
            }}
          />
        );

      default:
        return (
          <TextField
            fullWidth
            placeholder="Enter your answer here..."
            variant="outlined"
            value={answers[question.question_id] || ''}
            onChange={(e) => {
              setAnswers({ ...answers, [question.question_id]: e.target.value });
            }}
          />
        );
    }
  };

  const handleSubmit = async () => {
    if (!survey) {
      return;
    }

    if (!user.username) {
      console.error('No username found');
      return;
    }

    try {
      setSubmitLoading(true);
      const response = await axios.post(`${API_BASE_URL}/api/answers`, {
        survey_id: survey.survey_id,
        username: user.username,
        answers: reduxAnswers
      });

      if (response.data.success) {
        // 清空答案
        setAnswers({});
        dispatch(clearAnswers());
        
        // 显示成功消息
        setShowSuccessMessage(true);
        
        // 3秒后自动退出
        setTimeout(() => {
          dispatch(clearUser());
          window.location.href = '/login';
        }, 3000);
      } else {
        console.error('Failed to submit answers:', response.data.message);
      }
    } catch (error) {
      console.error('Error submitting answers:', error);
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Survey Questions Dashboard
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <FormControl fullWidth>
          <InputLabel id="survey-select-label">Select Survey</InputLabel>
          <Select
            labelId="survey-select-label"
            id="survey-select"
            value={selectedSurveyId}
            label="Select Survey"
            onChange={handleSurveyChange}
          >
            {surveys.map((survey) => (
              <MenuItem key={survey.survey_id} value={survey.survey_id}>
                {survey.title} (ID: {survey.survey_id})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {selectedSurveyId && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            {surveys.find(s => s.survey_id.toString() === selectedSurveyId)?.description}
          </Typography>
        )}
      </Paper>

      {loading && (
        <Box sx={{ p: 3 }}>
          <Typography>Loading survey questions...</Typography>
        </Box>
      )}

      {!loading && !survey && selectedSurveyId && (
        <Box sx={{ p: 3 }}>
          <Typography>No survey found</Typography>
        </Box>
      )}

      {!loading && survey && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            {survey.title}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" paragraph>
            {survey.description}
          </Typography>
          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            Questions ({survey.questions.length})
          </Typography>
          <Divider sx={{ my: 2 }} />
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {survey.questions.map((question) => (
              <Box key={question.question_id}>
                <Typography variant="subtitle1" gutterBottom>
                  Q{question.sequence_number}: {question.question_text}
                  {question.is_required === 1 && (
                    <Typography component="span" color="error.main" sx={{ ml: 1 }}>*</Typography>
                  )}
                </Typography>
                {question.description && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {question.description}
                  </Typography>
                )}
                {renderQuestionInput(question)}
              </Box>
            ))}
          </Box>

          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmit}
              disabled={submitLoading}
            >
              {submitLoading ? 'Submitting...' : 'ADD'}
            </Button>
          </Box>
        </Paper>
      )}

      {/* Success Message Dialog */}
      <Dialog
        open={showSuccessMessage}
        aria-labelledby="success-dialog-title"
        aria-describedby="success-dialog-description"
        PaperProps={{
          sx: {
            minWidth: '300px',
            textAlign: 'center',
            p: 2
          }
        }}
      >
        <DialogTitle id="success-dialog-title">
          Success
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="success-dialog-description">
            Survey submitted successfully! You will be logged out in 3 seconds.
          </DialogContentText>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default SurveyDashboard; 