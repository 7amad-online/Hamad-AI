import { useEffect, useRef, useState } from 'react';
import {
  ArrowUp,
  BellRing,
  CalendarDays,
  Check,
  ChevronRight,
  ListTodo,
  Menu,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import {
  useHealthCheck,
  useSendChatMessage,
} from '@workspace/api-client-react';

type Message = {
  id: number;
  role: 'user' | 'assistant';
  text: string;
  mode?: string;
};

function getChatErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'data' in error) {
    const data = (error as { data?: unknown }).data;
    if (data && typeof data === 'object' && 'detail' in data) {
      const detail = (data as { detail?: unknown }).detail;
      if (typeof detail === 'string' && detail.trim()) return detail;
    }
  }

  return 'Hamad AI could not complete that request. Please try again shortly.';
}

const quickActions = [
  {
    label: '📋 My Tasks',
    prompt: 'Show me a helpful way to organize my tasks for today.',
    icon: ListTodo,
    tone: 'coral',
  },
  {
    label: '📅 My Day',
    prompt: 'Help me make a simple, realistic plan for my day.',
    icon: CalendarDays,
    tone: 'sage',
  },
  {
    label: '🔔 Reminders',
    prompt: 'Help me think through what I should remember today.',
    icon: BellRing,
    tone: 'gold',
  },
  {
    label: '🔎 Search',
    prompt: 'Help me search for an answer. I will tell you what I need to find.',
    icon: Search,
    tone: 'blue',
  },
] as const;

function StatusIndicator() {
  const { data, isLoading, isError } = useHealthCheck();
  const isConnected = Boolean(data) && !isError;
  const label = isLoading
    ? 'Checking connection'
    : isConnected
      ? 'Hamad is ready'
      : 'Connection paused';

  return (
    <div
      className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground"
      data-testid="status-connection"
    >
      <span
        className={`h-2 w-2 rounded-full ${
          isLoading
            ? 'status-breathe bg-primary'
            : isConnected
              ? 'bg-accent'
              : 'bg-destructive'
        }`}
        aria-hidden="true"
      />
      <span>{label}</span>
      {isConnected && (
        <Check className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
      )}
    </div>
  );
}

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3" data-testid="brand-hamad-ai">
      <div className="brand-orb relative flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] text-primary-foreground">
        <Sparkles className="h-[18px] w-[18px]" strokeWidth={2.2} aria-hidden="true" />
        <span
          className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-[hsl(38_82%_54%)] ring-4 ring-[hsl(var(--background))]"
          aria-hidden="true"
        />
      </div>
      <div className={compact ? 'min-w-0' : ''}>
        <p
          className="font-sans text-[15px] font-extrabold tracking-[-0.04em] text-foreground"
          data-testid="text-brand-name"
        >
          🤖 Hamad AI
        </p>
        <p
          className="mt-0.5 text-[10px] font-semibold tracking-[0.01em] text-muted-foreground"
          data-testid="text-brand-subtitle"
        >
          Personal AI Assistant
        </p>
      </div>
    </div>
  );
}

function Sidebar({
  onNewChat,
  onClose,
}: {
  onNewChat: () => void;
  onClose?: () => void;
}) {
  return (
    <aside
      className="flex h-full w-full flex-col bg-sidebar px-5 pb-5 pt-6 text-sidebar-foreground md:w-[258px] md:shrink-0"
      data-testid="sidebar"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="brand-orb flex h-9 w-9 items-center justify-center rounded-xl text-primary-foreground">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
          </div>
          <div>
            <p className="text-[14px] font-extrabold tracking-[-0.04em]">Hamad AI</p>
            <p className="mt-0.5 text-[10px] text-sidebar-foreground/55">Your private space</p>
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-sidebar-foreground/65 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
            aria-label="Close menu"
            data-testid="button-close-menu"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={onNewChat}
        className="group mt-10 flex min-h-12 items-center justify-between rounded-2xl border border-sidebar-border bg-sidebar-accent px-4 text-left transition-all hover:border-sidebar-primary/65 hover:bg-[hsl(25_27%_27%)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
        data-testid="button-new-chat"
      >
        <span className="flex items-center gap-3 text-sm font-bold">
          <Plus className="h-4 w-4 text-sidebar-primary transition-transform group-hover:rotate-90" aria-hidden="true" />
          New chat
        </span>
        <span className="rounded-md border border-sidebar-border px-1.5 py-0.5 font-mono text-[9px] text-sidebar-foreground/50">
          N
        </span>
      </button>

      <div className="mt-auto border-t border-sidebar-border pt-5">
        <div className="mb-5 rounded-2xl bg-sidebar-accent p-4">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-sidebar-foreground/50">
              A little help
            </p>
            <span className="h-1.5 w-1.5 rounded-full bg-sidebar-primary" aria-hidden="true" />
          </div>
          <p className="text-[13px] leading-5 text-sidebar-foreground/78">
            Quick answers, thoughtful plans, and a calmer next step.
          </p>
        </div>
        <StatusIndicator />
        <p className="mt-3 text-[11px] leading-4 text-sidebar-foreground/45">
          Private by design. Ready whenever you are.
        </p>
      </div>
    </aside>
  );
}

function TypingIndicator() {
  return (
    <div className="message-in flex items-start gap-3" data-testid="status-assistant-typing">
      <div className="brand-orb mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-[11px] text-primary-foreground">
        <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
      </div>
      <div className="rounded-2xl rounded-tl-sm border border-border bg-card px-4 py-3.5 shadow-sm">
        <div className="flex gap-1.5 py-1">
          <span className="typing-dot h-1.5 w-1.5 rounded-full bg-accent" />
          <span className="typing-dot h-1.5 w-1.5 rounded-full bg-accent" />
          <span className="typing-dot h-1.5 w-1.5 rounded-full bg-accent" />
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';

  return (
    <div
      className={`message-in flex items-start gap-3 ${isUser ? 'justify-end' : ''}`}
      data-testid={`message-${message.role}-${message.id}`}
    >
      {!isUser && (
        <div className="brand-orb mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-[11px] text-primary-foreground">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
        </div>
      )}
      <div dir="auto" className={isUser ? 'max-w-[84%] rounded-[20px] rounded-tr-sm bg-primary px-4 py-3 text-[14px] leading-6 text-primary-foreground shadow-sm sm:max-w-[69%]' : 'max-w-[89%] rounded-[20px] rounded-tl-sm border border-border bg-card px-4 py-3 text-[14px] leading-6 text-card-foreground shadow-sm sm:max-w-[76%]'}>
        {message.text.split('\n').map((line, index) => (
          <span className="block" key={`${message.id}-${index}`}>
            {line || '\u00a0'}
          </span>
        ))}
        {!isUser && message.mode && (
          <span className="mt-2 block text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60">
            Private response
          </span>
        )}
      </div>
    </div>
  );
}

function QuickActionGrid({
  onAction,
}: {
  onAction: (prompt: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4" data-testid="quick-actions">
      {quickActions.map(({ label, prompt, icon: Icon, tone }, index) => (
        <button
          key={label}
          type="button"
          onClick={() => onAction(prompt)}
          className={`message-in stagger-${Math.min(index + 1, 3)} group flex min-h-[58px] items-center justify-between gap-2 rounded-2xl border bg-card/80 px-3.5 text-left text-[12px] font-bold text-card-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
            tone === 'coral'
              ? 'border-primary/20 hover:border-primary/55'
              : tone === 'sage'
                ? 'border-accent/20 hover:border-accent/55'
                : tone === 'gold'
                  ? 'border-[hsl(38_82%_54%_/_0.25)] hover:border-[hsl(38_82%_54%_/_0.6)]'
                  : 'border-[hsl(190_28%_38%_/_0.22)] hover:border-[hsl(190_28%_38%_/_0.55)]'
          }`}
          data-testid={`button-quick-action-${index}`}
        >
          <span className="flex min-w-0 items-center gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted">
              <Icon className="h-3.5 w-3.5 text-accent" strokeWidth={2} aria-hidden="true" />
            </span>
            <span className="truncate">{label}</span>
          </span>
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}

function EmptyState({ onAction }: { onAction: (prompt: string) => void }) {
  return (
    <div className="flex min-h-full flex-col justify-center py-9 sm:py-16" data-testid="empty-chat">
      <div className="mb-6 flex items-center gap-3">
        <div className="brand-orb flex h-12 w-12 items-center justify-center rounded-[17px] text-primary-foreground shadow-sm">
          <Sparkles className="h-5 w-5" strokeWidth={1.9} aria-hidden="true" />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent">Your private space</p>
          <p className="mt-1 text-[11px] text-muted-foreground">A fresh conversation</p>
        </div>
      </div>
      <h1 className="font-serif text-[clamp(3rem,10vw,5.5rem)] leading-[0.9] tracking-[-0.055em] text-foreground" data-testid="text-welcome">
        Hello Hamad 👋
      </h1>
      <p className="mt-5 text-[16px] leading-7 text-muted-foreground" data-testid="text-welcome-subtitle">
        How can I help you today?
      </p>
      <div className="mt-9">
        <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground/75">
          Start with a shortcut
        </p>
        <QuickActionGrid onAction={onAction} />
      </div>
    </div>
  );
}

function Composer({
  value,
  onChange,
  onSend,
  isPending,
}: {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  isPending: boolean;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
  }, [value]);

  return (
    <div className="border-t border-border/70 bg-[hsl(var(--background)/_0.86)] px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl sm:px-8 sm:pb-5">
      <div className="mx-auto max-w-[850px]">
        <div className={`composer-shadow relative flex items-end gap-2 rounded-[21px] border bg-card p-2 transition-colors ${isPending ? 'border-primary/55' : 'border-border focus-within:border-primary/70'}`}>
          <textarea
            ref={textareaRef}
            value={value}
            dir="auto"
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                onSend();
              }
            }}
            placeholder="Ask Hamad AI anything..."
            rows={1}
            maxLength={4000}
            disabled={isPending}
            className="max-h-[150px] min-h-11 flex-1 resize-none bg-transparent px-3 py-2.5 text-[14px] leading-6 text-foreground outline-none placeholder:text-muted-foreground/65 disabled:cursor-wait"
            aria-label="Message Hamad AI"
            data-testid="input-chat-message"
          />
          <button
            type="button"
            onClick={onSend}
            disabled={!value.trim() || isPending}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] bg-primary text-primary-foreground transition-all hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card"
            aria-label={isPending ? 'Sending message' : 'Send message'}
            data-testid="button-send-message"
          >
            {isPending ? (
              <RotateCcw className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <ArrowUp className="h-5 w-5" strokeWidth={2.2} aria-hidden="true" />
            )}
          </button>
        </div>
        <div className="mt-2 flex items-center justify-between px-1">
          <p className="text-[10px] font-medium text-muted-foreground/70">Enter to send · Shift + Enter for a new line</p>
          <p className="font-mono text-[10px] text-muted-foreground/65">{value.length}/4000</p>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageIdRef = useRef(0);
  const sendChat = useSendChatMessage();
  const chatErrorMessage = getChatErrorMessage(sendChat.error);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, sendChat.isPending]);

  const sendMessage = (messageOverride?: string) => {
    const message = (messageOverride ?? input).trim();
    if (!message || sendChat.isPending) return;

    const userId = messageIdRef.current++;
    setInput('');
    setMessages((current) => [...current, { id: userId, role: 'user', text: message }]);
    sendChat.mutate(
      { data: { message } },
      {
        onSuccess: (response) => {
          setMessages((current) => [
            ...current,
            {
              id: messageIdRef.current++,
              role: 'assistant',
              text: response.reply,
              mode: response.mode,
            },
          ]);
        },
      },
    );
  };

  const newChat = () => {
    setMessages([]);
    setInput('');
    sendChat.reset();
    setMobileMenuOpen(false);
  };

  return (
    <main className="app-shell min-h-[100dvh] overflow-hidden text-foreground">
      <div className="grain" aria-hidden="true" />
      <div className="relative flex min-h-[100dvh]">
        <div className="hidden md:block">
          <Sidebar onNewChat={newChat} />
        </div>

        {mobileMenuOpen && (
          <div className="fixed inset-0 z-30 md:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-[hsl(25_34%_17%_/_0.62)]"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close navigation"
              data-testid="button-dismiss-menu"
            />
            <div className="relative h-full w-[min(86vw,320px)] shadow-2xl">
              <Sidebar onNewChat={newChat} onClose={() => setMobileMenuOpen(false)} />
            </div>
          </div>
        )}

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="flex min-h-[76px] shrink-0 items-center justify-between border-b border-border/70 px-4 sm:px-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary md:hidden"
                aria-label="Open menu"
                data-testid="button-open-menu"
              >
                <Menu className="h-5 w-5" aria-hidden="true" />
              </button>
              <div className="md:hidden">
                <BrandMark compact />
              </div>
              <div className="hidden md:block">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Private conversation</p>
                <p className="mt-1 text-[13px] font-bold text-foreground" data-testid="text-conversation-title">A fresh chat</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:block">
                <StatusIndicator />
              </div>
              <button
                type="button"
                onClick={newChat}
                className="flex h-10 items-center gap-2 rounded-xl px-3 text-[12px] font-bold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                data-testid="button-header-new-chat"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">New chat</span>
              </button>
            </div>
          </header>

          <div className="chat-scroll min-h-0 flex-1 overflow-y-auto px-4 sm:px-8" data-testid="chat-area">
            <div className="mx-auto min-h-full max-w-[850px]">
              {messages.length === 0 ? (
                <EmptyState onAction={(prompt) => sendMessage(prompt)} />
              ) : (
                <div className="flex flex-col gap-6 py-8 sm:py-12" data-testid="message-list">
                  {messages.map((message) => (
                    <MessageBubble key={message.id} message={message} />
                  ))}
                  {sendChat.isPending && <TypingIndicator />}
                  {sendChat.isError && (
                    <div
                      className="message-in ml-11 max-w-[510px] rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-[13px] leading-5 text-foreground"
                      data-testid="status-chat-error"
                    >
                      <p className="font-bold text-destructive">Hamad AI couldn&apos;t reply.</p>
                      <p className="mt-1 text-muted-foreground">{chatErrorMessage}</p>
                      <button
                        type="button"
                        onClick={() => sendChat.reset()}
                        className="mt-2 inline-flex min-h-9 items-center rounded-lg px-2 text-xs font-bold text-foreground underline decoration-destructive/60 underline-offset-4 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        data-testid="button-dismiss-error"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
          </div>

          <Composer
            value={input}
            onChange={setInput}
            onSend={() => sendMessage()}
            isPending={sendChat.isPending}
          />
        </section>
      </div>
    </main>
  );
}