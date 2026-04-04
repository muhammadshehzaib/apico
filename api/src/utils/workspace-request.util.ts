import { Request } from 'express';

export const getWorkspaceIdFromRequest = (req: Request) => {
  const paramId =
    typeof req.params?.workspaceId === 'string' && req.params.workspaceId.trim()
      ? req.params.workspaceId
      : undefined;
  const bodyId =
    typeof (req.body as any)?.workspaceId === 'string' && (req.body as any).workspaceId.trim()
      ? (req.body as any).workspaceId
      : undefined;
  const queryId =
    typeof req.query?.workspaceId === 'string' && req.query.workspaceId.trim()
      ? (req.query.workspaceId as string)
      : undefined;

  return paramId || bodyId || queryId;
};
