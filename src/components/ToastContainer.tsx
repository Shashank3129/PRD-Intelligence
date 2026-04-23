import { useAppStore } from '@/hooks/useAppStore';
import { X } from 'lucide-react';

export function ToastContainer() {
  const { toasts, removeToast } = useAppStore();
  
  if (toasts.length === 0) return null;
  
  return (
    <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast toast-${toast.type} flex items-start gap-3`}
        >
          <span className="flex-1 text-sm">{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-current opacity-60 hover:opacity-100 transition-opacity"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
