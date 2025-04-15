import { configureStore } from '@reduxjs/toolkit';
import userReducer from './userSlice';
import surveyReducer from './surveySlice';
import answerReducer from './answerSlice';
import surveyLogicReducer from './surveyLogicSlice';

export const store = configureStore({
  reducer: {
    user: userReducer,
    survey: surveyReducer,
    answer: answerReducer,
    surveyLogic: surveyLogicReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 