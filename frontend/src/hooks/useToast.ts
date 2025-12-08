import { useState, useCallback } from 'react';
export type ToastType = 'success' | 'error' | 'warning' | 'info';
export type Toast = {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
};
export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const addToast = useCallback((type: ToastType, message: string, duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    const toast: Toast = {
      id,
      type,
      message,
      duration
    };
    setToasts(prev => [...prev, toast]);
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
    return id;
  }, []);
  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);
  const success = useCallback((message: string) => addToast('success', message), [addToast]);
  const error = useCallback((message: string) => addToast('error', message), [addToast]);
  const warning = useCallback((message: string) => addToast('warning', message), [addToast]);
  const info = useCallback((message: string) => addToast('info', message), [addToast]);
  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info
  };
}

// Create a singleton for global toast access
let globalToastHandler: ReturnType<typeof useToast> | null = null;
export function setGlobalToastHandler(handler: ReturnType<typeof useToast>) {
  globalToastHandler = handler;
}
export function toast(type: ToastType, message: string) {
  if (globalToastHandler) {
    globalToastHandler.addToast(type, message);
  }
}