import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Question {
  question_id: number;
  question_text: string;
  description: string | null;
  type_id: number;
  type_name: string;
  sequence_number: number;
  is_required: number;
  options: {
    option_id: number;
    option_text: string;
    sequence_number: number;
  }[];
}

interface SurveyState {
  questions: Question[];
}

const initialState: SurveyState = {
  questions: [],
};

const surveySlice = createSlice({
  name: 'survey',
  initialState,
  reducers: {
    setQuestions: (state, action: PayloadAction<Question[]>) => {
      state.questions = action.payload;
    },
  },
});

export const { setQuestions } = surveySlice.actions;
export default surveySlice.reducer; 