'use client';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  isVisible: boolean;
}

export function Toast({ message, type, isVisible }: ToastProps) {
  const bgColor = type === 'success' ? 'bg-success/15 text-success border-success/40' : 'bg-danger/15 text-danger border-danger/40';

  return (
    <div
      className={`fixed bottom-6 right-6 z-9999 transition-all duration-300 transform ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'
      }`}
    >
      <div className={`${bgColor} border px-4 py-3 rounded-md text-sm font-semibold shadow-[0_16px_40px_rgba(0,0,0,0.35)]`}>
        {message}
      </div>
    </div>
  );
}
