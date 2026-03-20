'use client';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  isVisible: boolean;
}

export function Toast({ message, type, isVisible }: ToastProps) {
  const bgColor = type === 'success' ? 'bg-success' : 'bg-danger';

  return (
    <div
      className={`fixed bottom-6 right-6 z-9999 transition-all duration-300 transform ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'
      }`}
    >
      <div className={`${bgColor} text-white px-4 py-3 rounded text-sm font-medium shadow-lg`}>
        {message}
      </div>
    </div>
  );
}
