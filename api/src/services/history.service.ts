import {
  findHistoryByUserId,
  deleteHistoryEntry,
  deleteAllHistoryByUserId,
} from '../queries/history.queries';

export const getHistory = async (userId: string, page: number = 1, limit: number = 50) => {
  const offset = (page - 1) * limit;

  return findHistoryByUserId(userId, limit, offset);
};

export const deleteHistoryEntryService = async (id: string, userId: string) => {
  const entry = await findHistoryByUserId(userId, 1000, 0);
  const found = entry.find((e) => e.id === id);

  if (!found) {
    const error = new Error('History entry not found');
    (error as any).statusCode = 404;
    throw error;
  }

  return deleteHistoryEntry(id);
};

export const clearHistory = async (userId: string) => {
  return deleteAllHistoryByUserId(userId);
};
