export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export const API_ENDPOINTS = {
  // Auth
  REGISTER: '/auth/register',
  LOGIN: '/auth/login',
  REFRESH: '/auth/refresh',
  LOGOUT: '/auth/logout',

  // Workspaces
  WORKSPACES: '/workspaces',
  WORKSPACE_BY_ID: (id: string) => `/workspaces/${id}`,
  INVITE_TO_WORKSPACE: (id: string) => `/workspaces/${id}/invite`,
  WORKSPACE_INVITE_BY_TOKEN: (token: string) => `/workspace-invites/${token}`,
  ACCEPT_WORKSPACE_INVITE: (token: string) => `/workspace-invites/${token}/accept`,
  DECLINE_WORKSPACE_INVITE: (token: string) => `/workspace-invites/${token}/decline`,
  USER_PENDING_INVITES: '/workspace-invites/pending',
  WORKSPACE_MEMBERS: (id: string) => `/workspaces/${id}/members`,
  WORKSPACE_MEMBER: (id: string, userId: string) => `/workspaces/${id}/members/${userId}`,
  WORKSPACE_INVITES: (id: string) => `/workspaces/${id}/invites`,
  REVOKE_WORKSPACE_INVITE: (id: string, inviteId: string) => `/workspaces/${id}/invites/${inviteId}/revoke`,
  LEAVE_WORKSPACE: (id: string) => `/workspaces/${id}/leave`,

  // Collections
  COLLECTIONS_BY_WORKSPACE: (workspaceId: string) => `/workspaces/${workspaceId}/collections`,
  COLLECTION_BY_ID: (id: string) => `/collections/${id}`,
  SHARE_COLLECTION: (id: string) => `/collections/${id}/share`,
  GET_SHARED_COLLECTION: (token: string) => `/collections/share/${token}`,

  // Requests
  EXECUTE_REQUEST: '/requests/execute',
  SAVE_REQUEST: (collectionId: string) => `/requests/${collectionId}/requests`,
  SAVED_REQUESTS: (collectionId: string) => `/requests/${collectionId}/requests`,
  SAVED_REQUEST_BY_ID: (id: string) => `/requests/${id}`,
  SHARE_REQUEST: (id: string) => `/requests/${id}/share`,
  GET_SHARED_REQUEST: (token: string) => `/requests/share/${token}`,

  // History
  HISTORY: '/history',
  HISTORY_ENTRY: (id: string) => `/history/${id}`,
};

export const TOKEN_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
};
