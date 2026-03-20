export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
}

export enum WorkspaceRole {
  OWNER = 'OWNER',
  EDITOR = 'EDITOR',
  VIEWER = 'VIEWER',
}

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  createdAt: string;
}

export interface Collection {
  id: string;
  name: string;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
}

export interface KeyValuePair {
  key: string;
  value: string;
  enabled: boolean;
}

export interface RequestAuth {
  type: 'none' | 'bearer' | 'basic' | 'apikey';
  token?: string;
  username?: string;
  password?: string;
  apiKey?: string;
  apiValue?: string;
  apiIn?: 'header' | 'query';
}

export interface SavedRequest {
  id: string;
  name: string;
  collectionId: string;
  method: HttpMethod;
  url: string;
  headers: KeyValuePair[];
  params: KeyValuePair[];
  body?: string;
  auth?: RequestAuth;
  createdAt: string;
  updatedAt: string;
}

export interface ExecuteRequestResult {
  statusCode: number;
  statusText: string;
  headers: Record<string, string | string[]>;
  body: string;
  duration: number;
  size: number;
}

export interface RequestHistory {
  id: string;
  userId: string;
  method: HttpMethod;
  url: string;
  headers: KeyValuePair[];
  body?: string;
  statusCode?: number;
  response?: string;
  duration?: number;
  size?: number;
  createdAt: string;
}

export interface SharedLink {
  id: string;
  savedRequestId: string;
  token: string;
  createdAt: string;
  expiresAt?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  message: string;
}
