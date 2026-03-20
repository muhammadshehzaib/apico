import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Workspace, Collection } from '@/types';

interface WorkspaceState {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  collections: Collection[];
  isLoading: boolean;
  error: string | null;
  activeWorkspaceId: string | null;
  activeEnvironmentId: string | null;
}

const initialState: WorkspaceState = {
  workspaces: [],
  currentWorkspace: null,
  collections: [],
  isLoading: false,
  error: null,
  activeWorkspaceId: null,
  activeEnvironmentId: null,
};

export const workspaceSlice = createSlice({
  name: 'workspace',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setWorkspaces: (state, action: PayloadAction<Workspace[]>) => {
      state.workspaces = action.payload;
    },
    setCurrentWorkspace: (state, action: PayloadAction<Workspace | null>) => {
      state.currentWorkspace = action.payload;
    },
    setCollections: (state, action: PayloadAction<Collection[]>) => {
      state.collections = action.payload;
    },
    addWorkspace: (state, action: PayloadAction<Workspace>) => {
      state.workspaces.push(action.payload);
    },
    addCollection: (state, action: PayloadAction<Collection>) => {
      state.collections.push(action.payload);
    },
    removeCollection: (state, action: PayloadAction<string>) => {
      state.collections = state.collections.filter((c) => c.id !== action.payload);
    },
    setActiveWorkspace: (state, action: PayloadAction<string | null>) => {
      state.activeWorkspaceId = action.payload;
    },
    setActiveEnvironment: (state, action: PayloadAction<string | null>) => {
      state.activeEnvironmentId = action.payload;
    },
  },
});

export const {
  setLoading,
  setError,
  setWorkspaces,
  setCurrentWorkspace,
  setCollections,
  addWorkspace,
  addCollection,
  removeCollection,
  setActiveWorkspace,
  setActiveEnvironment,
} = workspaceSlice.actions;
export default workspaceSlice.reducer;
