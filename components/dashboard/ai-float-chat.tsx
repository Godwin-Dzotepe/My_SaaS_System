'use client';

import * as React from 'react';
import { Bot, Loader2, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
};

export function AiFloatChat(props: {
  title: string;
  askEndpoint: string;
  placeholder?: string;
  allowTelegram?: boolean;
  disabled?: boolean;
  disabledMessage?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [question, setQuestion] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const [sendToTelegram, setSendToTelegram] = React.useState(false);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [error, setError] = React.useState('');

  const messagesContainerRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!open) return;
    const container = messagesContainerRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [messages, open]);

  const askAi = async () => {
    const trimmed = question.trim();
    if (!trimmed || props.disabled || sending) return;

    const userMessage: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: trimmed,
    };

    setMessages((current) => [...current, userMessage]);
    setQuestion('');
    setError('');
    setSending(true);

    try {
      const response = await fetch(props.askEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: trimmed,
          sendToTelegram: props.allowTelegram ? sendToTelegram : false,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        const message = data?.error || 'Unable to get AI response.';
        setError(message);
        setMessages((current) => [
          ...current,
          {
            id: `a-${Date.now()}`,
            role: 'assistant',
            text: message,
          },
        ]);
        return;
      }

      setMessages((current) => [
        ...current,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          text: data?.answer || 'No answer returned.',
        },
      ]);
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Unable to get AI response.';
      setError(message);
      setMessages((current) => [
        ...current,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          text: message,
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-[75]">
      {open ? (
        <div className="w-[min(92vw,360px)] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_16px_50px_rgba(15,23,42,0.22)]">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                <Bot className="h-4 w-4" />
              </div>
              <p className="text-sm font-semibold text-gray-900">{props.title}</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              aria-label="Close AI assistant"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div ref={messagesContainerRef} className="max-h-[320px] space-y-3 overflow-y-auto bg-gray-50 px-3 py-3">
            {messages.length === 0 ? (
              <p className="rounded-lg border border-gray-200 bg-white p-3 text-xs text-gray-600">
                Ask a question and the assistant will answer based on your dashboard context.
              </p>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`rounded-lg p-3 text-xs whitespace-pre-wrap ${
                    message.role === 'user'
                      ? 'ml-8 bg-blue-600 text-white'
                      : 'mr-8 border border-gray-200 bg-white text-gray-700'
                  }`}
                >
                  {message.text}
                </div>
              ))
            )}
          </div>

          <div className="space-y-2 border-t border-gray-100 p-3">
            {props.disabled ? (
              <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                {props.disabledMessage || 'AI is disabled for this account.'}
              </p>
            ) : null}

            {props.allowTelegram ? (
              <label className="flex items-center gap-2 text-xs text-gray-600">
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5"
                  checked={sendToTelegram}
                  onChange={(event) => setSendToTelegram(event.target.checked)}
                />
                Also send answer to Telegram
              </label>
            ) : null}

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={question}
                disabled={sending || props.disabled}
                onChange={(event) => setQuestion(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    void askAi();
                  }
                }}
                placeholder={props.placeholder || 'Ask AI a question'}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
              <Button
                type="button"
                size="sm"
                disabled={sending || props.disabled || !question.trim()}
                onClick={() => void askAi()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>

            {error ? <p className="text-xs text-red-600">{error}</p> : null}
          </div>
        </div>
      ) : null}

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-[0_14px_30px_rgba(37,99,235,0.45)] transition hover:bg-blue-700"
          aria-label="Open AI assistant"
        >
          <Bot className="h-7 w-7" />
        </button>
      ) : null}
    </div>
  );
}
