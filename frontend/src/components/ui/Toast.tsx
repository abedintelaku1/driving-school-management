import React from 'react';
import { CheckCircleIcon, XCircleIcon, AlertTriangleIcon, InfoIcon, XIcon } from 'lucide-react';
import type { Toast as ToastType, ToastType as ToastVariant } from '../../hooks/useToast';
type ToastProps = {
  toast: ToastType;
  onDismiss: (id: string) => void;
};
const iconMap: Record<ToastVariant, React.ReactNode> = {
  success: <CheckCircleIcon className="w-5 h-5 text-green-500" />,
  error: <XCircleIcon className="w-5 h-5 text-red-500" />,
  warning: <AlertTriangleIcon className="w-5 h-5 text-amber-500" />,
  info: <InfoIcon className="w-5 h-5 text-blue-500" />
};
const bgStyles: Record<ToastVariant, string> = {
  success: 'bg-green-50 border-green-200',
  error: 'bg-red-50 border-red-200',
  warning: 'bg-amber-50 border-amber-200',
  info: 'bg-blue-50 border-blue-200'
};
export function Toast({
  toast,
  onDismiss
}: ToastProps) {
  return <div className={`
        flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg
        animate-in slide-in-from-right-full duration-300
        ${bgStyles[toast.type]}
      `} role="alert">
      {iconMap[toast.type]}
      <p className="flex-1 text-sm text-gray-700">{toast.message}</p>
      <button onClick={() => onDismiss(toast.id)} className="p-1 rounded hover:bg-black/5 transition-colors" aria-label="Dismiss">
        <XIcon className="w-4 h-4 text-gray-400" />
      </button>
    </div>;
}
type ToastContainerProps = {
  toasts: ToastType[];
  onDismiss: (id: string) => void;
};
export function ToastContainer({
  toasts,
  onDismiss
}: ToastContainerProps) {
  if (toasts.length === 0) return null;
  return <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full px-4 sm:px-0" aria-live="polite" aria-label="Notifications">
      {toasts.map(toast => <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />)}
    </div>;
}