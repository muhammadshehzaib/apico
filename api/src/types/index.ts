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

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  message: string;
}

export interface JwtPayload {
  id: string;
  email: string;
  name: string;
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

export interface ExecuteRequestPayload {
  method: HttpMethod;
  url: string;
  headers: KeyValuePair[];
  params: KeyValuePair[];
  body?: string;
  auth?: RequestAuth;
}

export interface ExecuteRequestResult {
  statusCode: number;
  statusText: string;
  headers: Record<string, string | string[]>;
  body: string;
  duration: number;
  size: number;
}
