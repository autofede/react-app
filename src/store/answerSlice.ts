import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Answer {
  response_id: string;
  question_id: number;
  option_id: number[];
  text_answer: string;
  numerical_answer: number;
}

interface AnswerState {
  answers: Answer[];
}

const initialState: AnswerState = {
  answers: [],
};

const answerSlice = createSlice({
  name: 'answer',
  initialState,
  reducers: {
    setAddQuestions: (state, action: PayloadAction<Answer[]>) => {
      state.answers = action.payload;
    },
    clearAnswers: (state) => {
      state.answers = [];
    },
  },
});

export const { setAddQuestions, clearAnswers } = answerSlice.actions;
export default answerSlice.reducer; 