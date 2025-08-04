import { configureStore } from '@reduxjs/toolkit';
import loginReducer, { themeReducer, uiReducer } from './features/Login';

const store = configureStore({
  reducer: {
    login: loginReducer,
    theme: themeReducer,
    ui: uiReducer,
  }
});
 
export default store;
