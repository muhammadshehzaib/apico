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

export enum WorkspaceInviteStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REVOKED = 'REVOKED',
  EXPIRED = 'EXPIRED',
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
  role?: WorkspaceRole;
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  createdAt: string;
}

export interface WorkspaceInvite {
  id: string;
  status: WorkspaceInviteStatus;
  role: WorkspaceRole;
  expiresAt?: string | null;
  workspace: { id: string; name: string } | null;
  invitedBy: { id: string; name: string; email: string } | null;
}

export interface Collection {
  id: string;
  name: string;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
}

export interface SharedCollection extends Collection {
  requests: SavedRequest[];
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

export interface WorkspaceMemberWithUser {
  id: string;
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  createdAt: string;
  user: { id: string; name: string; email: string };
}

export interface WorkspacePendingInvite {
  id: string;
  email: string;
  role: WorkspaceRole;
  status: string;
  createdAt: string;
  expiresAt: string | null;
  invitedBy: { id: string; name: string; email: string };
}

export interface PendingInviteForUser {
  id: string;
  role: WorkspaceRole;
  expiresAt: string | null;
  token: string;
  workspace: { id: string; name: string };
  invitedBy: { id: string; name: string; email: string };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  message: string;
}
