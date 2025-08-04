import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isLoggedIn: false,
  user: null,
};

const loginSlice = createSlice({
  name: 'login',
  initialState,
  reducers: {
    loginSuccess: (state, action) => {
      state.isLoggedIn = true;
      state.user = action.payload;
    },
    logout: (state) => {
      state.isLoggedIn = false;
      state.user = null;
      sessionStorage.removeItem('loggedInUser');
    },
  },
});

export const { loginSuccess, logout } = loginSlice.actions;
export default loginSlice.reducer;

// Theme slice
import { createSlice as createThemeSlice } from '@reduxjs/toolkit';

const themeInitialState = {
  mode: localStorage.getItem('theme') || 'light',
};

const themeSlice = createThemeSlice({
  name: 'theme',
  initialState: themeInitialState,
  reducers: {
    toggleTheme: (state) => {
      state.mode = state.mode === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', state.mode);
    },
    setTheme: (state, action) => {
      state.mode = action.payload;
      localStorage.setItem('theme', state.mode);
    },
  },
});

export const { toggleTheme, setTheme } = themeSlice.actions;
export const themeReducer = themeSlice.reducer;

// UI slice for settings box
const uiInitialState = {
  showSettings: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState: uiInitialState,
  reducers: {
    toggleSettings: (state) => {
      state.showSettings = !state.showSettings;
    },
    closeSettings: (state) => {
      state.showSettings = false;
    },
  },
});

export const { toggleSettings, closeSettings } = uiSlice.actions;
export const uiReducer = uiSlice.reducer;