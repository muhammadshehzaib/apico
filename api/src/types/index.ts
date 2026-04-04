import { HttpMethod } from '@prisma/client';

export {
  HttpMethod,
  WorkspaceRole,
  WorkspaceInviteStatus,
} from '@prisma/client';

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

export interface FormDataField {
  key: string;
  type: 'text' | 'file';
  value: string;
  fileName?: string;
  enabled: boolean;
}

export type BodyType = 'json' | 'raw' | 'form-data';

export interface ExecuteRequestPayload {
  method: HttpMethod;
  url: string;
  headers: KeyValuePair[];
  params: KeyValuePair[];
  body?: string;
  bodyType?: BodyType;
  formDataFields?: FormDataField[];
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
