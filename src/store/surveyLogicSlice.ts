import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SurveyLogic {
  logic_id: number;
  survey_id: number;
  question_id: number;
  option_id: number;
  target_question_id: number;
}

interface SurveyLogicState {
  logics: SurveyLogic[];
}

const initialState: SurveyLogicState = {
  logics: []
};

const surveyLogicSlice = createSlice({
  name: 'surveyLogic',
  initialState,
  reducers: {
    setLogics: (state, action: PayloadAction<SurveyLogic[]>) => {
      state.logics = action.payload;
    },
    clearLogics: (state) => {
      state.logics = [];
    }
  }
});

export const { setLogics, clearLogics } = surveyLogicSlice.actions;
export default surveyLogicSlice.reducer; 