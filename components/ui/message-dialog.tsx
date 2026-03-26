'use client';

import { ReactNode } from 'react';
import { CheckCircle2, AlertTriangle, Info, XCircle } from 'lucide-react';
import { Modal } from './modal';
import { Button } from './button';

type MessageTone = 'info' | 'success' | 'warning' | 'error';

interface MessageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: ReactNode;
  tone?: MessageTone;
  actionLabel?: string;
}

const toneConfig: Record<MessageTone, { icon: ReactNode; accent: string }> = {
  info: {
    icon: <Info className="h-10 w-10 text-blue-600" />,
    accent: 'border-blue-100 bg-blue-50',
  },
  success: {
    icon: <CheckCircle2 className="h-10 w-10 text-emerald-600" />,
    accent: 'border-emerald-100 bg-emerald-50',
  },
  warning: {
    icon: <AlertTriangle className="h-10 w-10 text-amber-600" />,
    accent: 'border-amber-100 bg-amber-50',
  },
  error: {
    icon: <XCircle className="h-10 w-10 text-rose-600" />,
    accent: 'border-rose-100 bg-rose-50',
  },
};

export function MessageDialog({
  isOpen,
  onClose,
  title,
  message,
  tone = 'info',
  actionLabel = 'Close',
}: MessageDialogProps) {
  const config = toneConfig[tone];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={<Button onClick={onClose}>{actionLabel}</Button>}
    >
      <div className={`rounded-2xl border p-4 ${config.accent}`}>
        <div className="flex items-start gap-4">
          <div className="shrink-0">{config.icon}</div>
          <div className="text-sm leading-6 text-gray-700">{message}</div>
        </div>
      </div>
    </Modal>
  );
}
