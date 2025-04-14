import { useState, useEffect } from 'react';
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
} from '@mui/material';
import Star from '@mui/icons-material/Star';
import StarBorder from '@mui/icons-material/StarBorder';
import axios from 'axios';

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

const API_BASE_URL = 'http://127.0.0.1:5000';

export default function SurveyDashboard() {
  const [surveys, setSurveys] = useState<SurveyListItem[]>([]);
  const [selectedSurveyId, setSelectedSurveyId] = useState<string>('');
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [loading, setLoading] = useState(true);

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
        const response = await axios.get<{ success: boolean; data: SurveyResponse }>(`${API_BASE_URL}/api/surveys/${selectedSurveyId}`);
        if (response.data.success) {
          setSurvey({
            ...response.data.data.survey,
            questions: response.data.data.questions.sort((a, b) => a.sequence_number - b.sequence_number)
          });
        }
      } catch (error) {
        console.error('Error fetching survey details:', error);
        setSurvey(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSurveyDetails();
  }, [selectedSurveyId]);

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
            >
              {options
                .sort((a, b) => a.sequence_number - b.sequence_number)
                .map((option) => (
                  <MenuItem key={option.option_id} value={option.option_id}>
                    {option.option_text}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
        );

      case 2: // 多选下拉列表改为多选框
        return (
          <FormGroup>
            {options
              .sort((a, b) => a.sequence_number - b.sequence_number)
              .map((option) => (
                <FormControlLabel
                  key={option.option_id}
                  control={<Checkbox />}
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
          />
        );

      case 5: // 评分
        return (
          <Rating
            name={`question-${question.question_id}`}
            max={5}
            emptyIcon={<StarBorder fontSize="inherit" />}
            icon={<Star fontSize="inherit" />}
          />
        );

      default:
        return (
          <TextField
            fullWidth
            placeholder="Enter your answer here..."
            variant="outlined"
          />
        );
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
        </Paper>
      )}
    </Box>
  );
} 