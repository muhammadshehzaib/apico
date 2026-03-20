import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/auth.slice';
import workspaceReducer from './slices/workspace.slice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    workspace: workspaceReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
