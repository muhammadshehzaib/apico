'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

interface UpgradePromptProps {
  feature: string;
  isOpen: boolean;
  onClose: () => void;
}

export function UpgradePrompt({
  feature,
  isOpen,
  onClose,
}: UpgradePromptProps) {
  const promptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        promptRef.current &&
        !promptRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-30" onClick={onClose} />

      <div
        ref={promptRef}
        className="fixed z-40 bg-bg-secondary border-2 border-accent rounded-lg p-4 w-72 shadow-lg animate-in fade-in slide-in-from-bottom-2"
        style={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      >
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-sm font-semibold text-text-primary">
            🔒 Sign up to {feature}
          </h3>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary text-lg font-bold transition-colors"
          >
            ✕
          </button>
        </div>

        <p className="text-xs text-text-muted mb-4">
          Create a free account to unlock this feature.
        </p>

        <Link href="/register" className="block mb-2">
          <Button variant="primary" size="md" className="w-full text-sm">
            Create free account →
          </Button>
        </Link>

        <Link href="/login" className="block">
          <Button variant="secondary" size="md" className="w-full text-sm">
            Already have an account? Login
          </Button>
        </Link>
      </div>
    </>
  );
}
