'use client';

import { useState, useCallback } from 'react';

interface ToastState {
  message: string;
  type: 'success' | 'error';
  isVisible: boolean;
}

const initialState: ToastState = {
  message: '',
  type: 'success',
  isVisible: false,
};

export function useToast() {
  const [toast, setToast] = useState<ToastState>(initialState);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type, isVisible: true });

    const timer = setTimeout(() => {
      setToast((prev) => ({ ...prev, isVisible: false }));
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, isVisible: false }));
  }, []);

  return { ...toast, showToast, hideToast };
}
