import { HttpMethod, KeyValuePair, EnvironmentVariable } from '@/types';

export interface GuestHistoryEntry {
  id: string;
  method: HttpMethod;
  url: string;
  headers: KeyValuePair[];
  params: KeyValuePair[];
  body?: string;
  statusCode?: number;
  duration?: number;
  size?: number;
  createdAt: string;
}

export interface GuestEnvironment {
  id: string;
  name: string;
  variables: EnvironmentVariable[];
  createdAt: string;
}

const KEYS = {
  HISTORY: 'apico_guest_history',
  ENVIRONMENTS: 'apico_guest_environments',
  LAST_REQUEST: 'apico_guest_last_request',
  ACTIVE_ENV: 'apico_guest_active_env',
};

export function saveGuestHistory(entry: Omit<GuestHistoryEntry, 'id' | 'createdAt'>): GuestHistoryEntry {
  const fullEntry: GuestHistoryEntry = {
    ...entry,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };

  try {
    const existing = getGuestHistory();
    const updated = [fullEntry, ...existing].slice(0, 20);
    localStorage.setItem(KEYS.HISTORY, JSON.stringify(updated));
    return fullEntry;
  } catch {
    return fullEntry;
  }
}

export function getGuestHistory(): GuestHistoryEntry[] {
  try {
    const data = localStorage.getItem(KEYS.HISTORY);
    if (!data) return [];
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function clearGuestHistory(): void {
  try {
    localStorage.removeItem(KEYS.HISTORY);
  } catch {
    // Ignore
  }
}

export function deleteGuestHistoryEntry(id: string): void {
  try {
    const history = getGuestHistory();
    const updated = history.filter((entry) => entry.id !== id);
    localStorage.setItem(KEYS.HISTORY, JSON.stringify(updated));
  } catch {
    // Ignore
  }
}

export function saveGuestLastRequest(request: any): void {
  try {
    localStorage.setItem(KEYS.LAST_REQUEST, JSON.stringify(request));
  } catch {
    // Ignore
  }
}

export function getGuestLastRequest(): any {
  try {
    const data = localStorage.getItem(KEYS.LAST_REQUEST);
    if (!data) return null;
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function saveGuestEnvironments(envs: GuestEnvironment[]): void {
  try {
    localStorage.setItem(KEYS.ENVIRONMENTS, JSON.stringify(envs));
  } catch {
    // Ignore
  }
}

export function getGuestEnvironments(): GuestEnvironment[] {
  try {
    const data = localStorage.getItem(KEYS.ENVIRONMENTS);
    if (!data) return [];
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function saveGuestActiveEnv(envId: string | null): void {
  try {
    if (envId === null) {
      localStorage.removeItem(KEYS.ACTIVE_ENV);
    } else {
      localStorage.setItem(KEYS.ACTIVE_ENV, envId);
    }
  } catch {
    // Ignore
  }
}

export function getGuestActiveEnv(): string | null {
  try {
    return localStorage.getItem(KEYS.ACTIVE_ENV);
  } catch {
    return null;
  }
}
