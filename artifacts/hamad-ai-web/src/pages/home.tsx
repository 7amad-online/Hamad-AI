import { useEffect, useRef, useState } from 'react';
import {
  ArrowUp,
  Check,
  ChevronRight,
  CircleHelp,
  Compass,
  Feather,
  Menu,
  PanelLeftClose,
  Plus,
  RotateCcw,
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
};

const suggestions = [
  {
    label: 'Help me think',
    prompt: 'I have a decision I am circling around. Help me think it through clearly.',
    icon: Compass,
  },
  {
    label: 'Make a plan',
    prompt: 'Help me turn this vague idea into a simple, realistic plan.',
    icon: Feather,
  },
  {
    label: 'Untangle something',
    prompt: 'I feel a little stuck. Ask me the right questions to untangle what is on my mind.',
    icon: CircleHelp,
  },
];

function StatusIndicator() {
  const { data, isLoading, isError } = useHealthCheck();
  const isConnected = Boolean(data) && !isError;
  const label = isLoading ? 'Checking connection' : isConnected ? 'Ready when you are' : 'Connection paused';

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground" data-testid="status-connection">
      <span
        className={`h-2 w-2 rounded-full ${isLoading ? 'status-breathe bg-primary' : isConnected ? 'bg-accent' : 'bg-destructive'}`}
        aria-hidden="true"
      />
      <span>{label}</span>
      {isConnected && <Check className="h-3.5 w-3.5 text-accent" aria-hidden="true" />}
    </div>
  );
}

function BrandMark() {
  return (
    <div className="flex items-center gap-3" data-testid="brand-hamad-ai">
      <div className="relative flex h-10 w-10 items-center justify-center rounded-[14px] bg-primary text-primary-foreground shadow-sm">
        <Sparkles className="h-[18px] w-[18px]" strokeWidth={2.2} aria-hidden="true" />
        <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-accent ring-4 ring-sidebar" />
      </div>
      <div>
        <p className="font-sans text-[15px] font-bold tracking-[-0.03em] text-sidebar-foreground">Hamad AI</p>
        <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">A quieter mind</p>
      </div>
    </div>
  );
}

function Sidebar({ onNewChat, onClose }: { onNewChat: () => void; onClose?: () => void }) {
  return (
    <aside className="flex h-full w-full flex-col bg-sidebar px-5 pb-5 pt-6 text-sidebar-foreground md:w-[274px] md:shrink-0 md:border-r md:border-sidebar-border" data-testid="sidebar">
      <div className="flex items-start justify-between">
        <BrandMark />
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
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
        className="group mt-9 flex min-h-12 items-center justify-between rounded-xl border border-sidebar-border bg-sidebar-accent px-4 text-left transition-all hover:border-primary/50 hover:bg-[hsl(226_28%_19%)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
        data-testid="button-new-chat"
      >
        <span className="flex items-center gap-3 text-sm font-semibold">
          <Plus className="h-4 w-4 text-primary transition-transform group-hover:rotate-90" aria-hidden="true" />
          New thought
        </span>
        <span className="font-mono text-[10px] text-muted-foreground">⌘ K</span>
      </button>

      <div className="mt-auto border-t border-sidebar-border pt-5">
        <div className="mb-4 rounded-xl bg-[hsl(226_28%_12%)] p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-mono text-[10px] uppercase tracking-[0.13em] text-muted-foreground">Today</p>
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          </div>
          <p className="text-[13px] leading-5 text-sidebar-foreground/80">
            A small space for clear answers, honest questions, and the next right thing.
          </p>
        </div>
        <StatusIndicator />
        <p className="mt-3 text-[11px] leading-4 text-muted-foreground">
          Responses stay close to home. No account, no noise.
        </p>
      </div>
    </aside>
  );
}

function TypingIndicator() {
  return (
    <div className="message-in flex items-start gap-3" data-testid="status-assistant-typing">
      <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-[11px] bg-primary text-primary-foreground">
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
    <div className={`message-in flex items-start gap-3 ${isUser ? 'justify-end' : ''}`} data-testid={`message-${message.role}-${message.id}`}>
      {!isUser && (
        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-[11px] bg-primary text-primary-foreground">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
        </div>
      )}
      <div
        className={
          isUser
            ? 'max-w-[82%] rounded-2xl rounded-tr-sm bg-primary px-4 py-3 text-[14px] leading-6 text-primary-foreground shadow-sm sm:max-w-[70%]'
            : 'max-w-[88%] rounded-2xl rounded-tl-sm border border-border bg-card px-4 py-3 text-[14px] leading-6 text-card-foreground shadow-sm sm:max-w-[78%]'
        }
      >
        {message.text.split('\n').map((line, index) => (
          <span className="block" key={`${message.id}-${index}`}>
            {line || '\u00a0'}
          </span>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ onSuggestion }: { onSuggestion: (prompt: string) => void }) {
  return (
    <div className="flex min-h-full flex-col justify-center py-12 sm:py-20" data-testid="empty-chat">
      <div className="mb-7 flex h-14 w-14 items-center justify-center rounded-[18px] border border-primary/25 bg-primary/10 text-primary">
        <Sparkles className="h-6 w-6" strokeWidth={1.8} aria-hidden="true" />
      </div>
      <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-accent">A moment to think</p>
      <h1 className="max-w-xl font-serif text-[clamp(2.7rem,8vw,5.1rem)] leading-[0.92] tracking-[-0.045em] text-foreground">
        What&apos;s on your mind?
      </h1>
      <p className="mt-6 max-w-md text-[15px] leading-7 text-muted-foreground">
        Bring the half-formed thought, the tricky question, or the thing you keep putting off. We&apos;ll make it useful.
      </p>
      <div className="mt-10 grid gap-2.5 sm:max-w-[530px] sm:grid-cols-3">
        {suggestions.map(({ label, prompt, icon: Icon }, index) => (
          <button
            key={label}
            type="button"
            onClick={() => onSuggestion(prompt)}
            className={`message-in stagger-${index + 1} group flex min-h-12 items-center justify-between rounded-xl border border-border bg-card/70 px-3.5 text-left text-[12px] font-semibold text-card-foreground transition-all hover:-translate-y-0.5 hover:border-accent/60 hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary`}
            data-testid={`button-suggestion-${index}`}
          >
            <span className="flex items-center gap-2.5">
              <Icon className="h-4 w-4 text-accent" strokeWidth={1.8} aria-hidden="true" />
              {label}
            </span>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </button>
        ))}
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
    <div className="border-t border-border/70 bg-background/80 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 backdrop-blur-xl sm:px-8 sm:pb-6">
      <div className="mx-auto max-w-[820px]">
        <div className={`relative flex items-end gap-2 rounded-2xl border bg-card p-2 shadow-lg transition-colors ${isPending ? 'border-primary/50' : 'border-border focus-within:border-primary/70'}`}>
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                onSend();
              }
            }}
            placeholder="Write what you’re thinking..."
            rows={1}
            maxLength={4000}
            disabled={isPending}
            className="max-h-[150px] min-h-11 flex-1 resize-none bg-transparent px-3 py-2.5 text-[14px] leading-6 text-foreground outline-none placeholder:text-muted-foreground/70 disabled:cursor-wait"
            aria-label="Message Hamad AI"
            data-testid="input-chat-message"
          />
          <button
            type="button"
            onClick={onSend}
            disabled={!value.trim() || isPending}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-all hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card"
            aria-label={isPending ? 'Sending message' : 'Send message'}
            data-testid="button-send-message"
          >
            {isPending ? <RotateCcw className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ArrowUp className="h-5 w-5" strokeWidth={2.2} aria-hidden="true" />}
          </button>
        </div>
        <div className="mt-2 flex items-center justify-between px-1">
          <p className="font-mono text-[10px] text-muted-foreground/75">Shift + Enter for a new line</p>
          <p className="font-mono text-[10px] text-muted-foreground/75">{value.length}/4000</p>
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
  const sendChat = useSendChatMessage();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, sendChat.isPending]);

  const sendMessage = (messageOverride?: string) => {
    const message = (messageOverride ?? input).trim();
    if (!message || sendChat.isPending) return;
    setInput('');
    setMessages((current) => [...current, { id: Date.now(), role: 'user', text: message }]);
    sendChat.mutate(
      { data: { message } },
      {
        onSuccess: (response) => {
          setMessages((current) => [...current, { id: Date.now() + 1, role: 'assistant', text: response.reply }]);
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
    <main className="app-shell min-h-[100dvh] text-foreground">
      <div className="grain" aria-hidden="true" />
      <div className="relative flex min-h-[100dvh]">
        <div className="hidden md:block">
          <Sidebar onNewChat={newChat} />
        </div>

        {mobileMenuOpen && (
          <div className="fixed inset-0 z-30 md:hidden">
            <button type="button" className="absolute inset-0 bg-[hsl(228_36%_5%_/_0.7)]" onClick={() => setMobileMenuOpen(false)} aria-label="Close navigation" data-testid="button-dismiss-menu" />
            <div className="relative h-full w-[min(86vw,320px)] shadow-2xl">
              <Sidebar onNewChat={newChat} onClose={() => setMobileMenuOpen(false)} />
            </div>
          </div>
        )}

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-[76px] shrink-0 items-center justify-between border-b border-border/70 px-4 sm:px-8">
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
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Private conversation</p>
                <p className="mt-1 text-[13px] font-semibold text-foreground" data-testid="text-conversation-title">
                  A fresh page
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={newChat}
              className="flex h-10 items-center gap-2 rounded-xl px-3 text-[12px] font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              data-testid="button-header-new-chat"
            >
              <PanelLeftClose className="h-4 w-4 md:hidden" aria-hidden="true" />
              <Plus className="hidden h-4 w-4 md:block" aria-hidden="true" />
              <span className="hidden sm:inline">New thought</span>
            </button>
          </header>

          <div className="chat-scroll min-h-0 flex-1 overflow-y-auto px-4 sm:px-8">
            <div className="mx-auto min-h-full max-w-[820px]">
              {messages.length === 0 ? (
                <EmptyState onSuggestion={(prompt) => sendMessage(prompt)} />
              ) : (
                <div className="flex flex-col gap-6 py-8 sm:py-12" data-testid="message-list">
                  {messages.map((message) => <MessageBubble key={message.id} message={message} />)}
                  {sendChat.isPending && <TypingIndicator />}
                  {sendChat.isError && (
                    <div className="message-in ml-11 max-w-[500px] rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-[13px] leading-5 text-foreground" data-testid="status-chat-error">
                      <p className="font-semibold text-destructive">That didn&apos;t come through.</p>
                      <p className="mt-1 text-muted-foreground">Check your connection and try sending that thought again.</p>
                      <button
                        type="button"
                        onClick={() => sendChat.reset()}
                        className="mt-2 inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-foreground underline decoration-destructive/60 underline-offset-4 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
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

          <Composer value={input} onChange={setInput} onSend={() => sendMessage()} isPending={sendChat.isPending} />
        </section>
      </div>
    </main>
  );
}