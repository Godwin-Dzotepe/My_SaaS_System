'use client';

import { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { Modal } from './modal';
import { Button } from './button';
import { Input } from './input';

interface PromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (value: string) => void;
  title: string;
  description?: string;
  label?: string;
  placeholder?: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  type?: 'text' | 'password';
}

export function PromptModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  description,
  label = 'Value',
  placeholder = '',
  confirmText = 'Continue',
  cancelText = 'Cancel',
  isLoading = false,
  type = 'text',
}: PromptModalProps) {
  const [value, setValue] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setValue('');
    }
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button onClick={() => onSubmit(value)} disabled={isLoading || !value.trim()}>
            {isLoading ? 'Processing...' : confirmText}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="h-6 w-6 shrink-0 text-blue-600" />
            <div className="text-sm text-blue-900">
              Sensitive action verification is required before continuing.
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">{label}</label>
          <Input
            type={type}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            autoFocus
          />
        </div>
      </div>
    </Modal>
  );
}
