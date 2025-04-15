import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UserState {
  userId: string;
  username: string;
  type: string;
  isAuthenticated: boolean;
}

const initialState: UserState = {
  userId: '',
  username: '',
  type: '',
  isAuthenticated: false,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<Omit<UserState, 'isAuthenticated'>>) => {
      state.userId = action.payload.userId;
      state.username = action.payload.username;
      state.type = action.payload.type;
      state.isAuthenticated = true;
    },
    clearUser: (state) => {
      state.userId = '';
      state.username = '';
      state.type = '';
      state.isAuthenticated = false;
    },
  },
});

export const { setUser, clearUser } = userSlice.actions;
export default userSlice.reducer; 