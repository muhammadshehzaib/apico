'use client';

import { useContext } from 'react';
import { useAuthContext } from '@/contexts/auth.context';

export function useAuth() {
  return useAuthContext();
}
