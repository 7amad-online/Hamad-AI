import { useEffect, useRef, useState } from 'react';
import {
  ArrowUp,
  BellRing,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  ListTodo,
  Menu,
  Plus,
  RotateCcw,
  Search,
  Settings2,
  Sparkles,
  X,
} from 'lucide-react';
import {
  useGetSettings,
  useHealthCheck,
  useListConversationMessages,
  useListConversations,
  useSendChatMessage,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import type { Message as ApiMessage, Settings } from '@workspace/api-client-react';
import { DayPanel, RemindersPanel, SettingsPanel, TasksPanel } from '@/components/assistant-panels';

type View = 'chat' | 'tasks' | 'day' | 'reminders' | 'settings';
type Language = 'en' | 'ar';

type Message = {
  id: number;
  role: 'user' | 'assistant';
  text: string;
  mode?: string;
};

const navItems: { id: View; label: string; icon: typeof ListTodo }[] = [
  { id: 'tasks', label: 'My Tasks', icon: ListTodo },
  { id: 'day', label: 'My Day', icon: CalendarDays },
  { id: 'reminders', label: 'Reminders', icon: BellRing },
  { id: 'settings', label: 'Settings', icon: Settings2 },
];

const quickActions = [
  { label: '📋 My Tasks', view: 'tasks' as const, prompt: '', icon: ListTodo, tone: 'coral' },
  { label: '📅 My Day', view: 'day' as const, prompt: '', icon: CalendarDays, tone: 'sage' },
  { label: '🔔 Reminders', view: 'reminders' as const, prompt: '', icon: BellRing, tone: 'gold' },
  { label: '🔎 Search', view: 'chat' as const, prompt: 'Help me search for an answer. I will tell you what I need to find.', icon: Search, tone: 'blue' },
] as const;

const labels = {
  en: {
    private: 'Your private space',
    newChat: 'New chat',
    conversations: 'Recent conversations',
    help: 'A little help',
    helpText: 'Quick answers, thoughtful plans, and a calmer next step.',
    ready: 'Hamad is ready',
    checking: 'Checking connection',
    paused: 'Connection paused',
    privateNote: 'Private by design. Ready whenever you are.',
    conversation: 'Private conversation',
    fresh: 'A fresh chat',
    start: 'Start with a shortcut',
    welcome: 'Hello Hamad',
    welcomeSub: 'How can I help you today?',
    placeholder: 'Ask Hamad AI anything...',
    enter: 'Enter to send · Shift + Enter for a new line',
    send: 'Send message',
    sending: 'Sending message',
    couldn: "Hamad AI couldn't reply.",
    dismiss: 'Dismiss',
    chat: 'Chat',
  },
  ar: {
    private: 'مساحتك الخاصة',
    newChat: 'محادثة جديدة',
    conversations: 'المحادثات الأخيرة',
    help: 'مساعدة صغيرة',
    helpText: 'إجابات سريعة، وخطط مدروسة، وخطوة تالية أكثر هدوءًا.',
    ready: 'حمد جاهز',
    checking: 'جارٍ التحقق من الاتصال',
    paused: 'الاتصال متوقف مؤقتًا',
    privateNote: 'خصوصيتك أولًا. جاهز عندما تحتاجني.',
    conversation: 'محادثة خاصة',
    fresh: 'محادثة جديدة',
    start: 'ابدأ باختصار',
    welcome: 'مرحبًا حمد',
    welcomeSub: 'كيف يمكنني مساعدتك اليوم؟',
    placeholder: 'اسأل حمد AI عن أي شيء…',
    enter: 'اضغط Enter للإرسال · Shift + Enter لسطر جديد',
    send: 'إرسال الرسالة',
    sending: 'جارٍ الإرسال',
    couldn: 'تعذّر على حمد AI الرد.',
    dismiss: 'إخفاء',
    chat: 'المحادثة',
  },
} as const;

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

function StatusIndicator({ language }: { language: Language }) {
  const { data, isLoading, isError } = useHealthCheck();
  const isConnected = Boolean(data) && !isError;
  const t = labels[language];
  return (
    <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground" data-testid="status-connection">
      <span className={`h-2 w-2 rounded-full ${isLoading ? 'status-breathe bg-primary' : isConnected ? 'bg-accent' : 'bg-destructive'}`} aria-hidden="true" />
      <span>{isLoading ? t.checking : isConnected ? t.ready : t.paused}</span>
      {isConnected && <Check className="h-3.5 w-3.5 text-accent" aria-hidden="true" />}
    </div>
  );
}

function BrandMark({ compact = false, assistantName = 'Hamad AI' }: { compact?: boolean; assistantName?: string }) {
  return (
    <div className="flex items-center gap-3" data-testid="brand-hamad-ai">
      <div className="brand-orb relative flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] text-primary-foreground">
        <Sparkles className="h-[18px] w-[18px]" strokeWidth={2.2} aria-hidden="true" />
        <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-[hsl(38_82%_54%)] ring-4 ring-[hsl(var(--background))]" aria-hidden="true" />
      </div>
      <div className={compact ? 'min-w-0' : ''}>
        <p className="font-sans text-[15px] font-extrabold tracking-[-0.04em] text-foreground">{assistantName}</p>
        <p className="mt-0.5 text-[10px] font-semibold tracking-[0.01em] text-muted-foreground">Personal AI Assistant</p>
      </div>
    </div>
  );
}

function Sidebar({
  language,
  assistantName,
  view,
  conversations,
  activeConversationId,
  onNewChat,
  onNavigate,
  onConversation,
  onClose,
}: {
  language: Language;
  assistantName: string;
  view: View;
  conversations: { id: number; title: string }[];
  activeConversationId: number | null;
  onNewChat: () => void;
  onNavigate: (view: View) => void;
  onConversation: (id: number) => void;
  onClose?: () => void;
}) {
  const t = labels[language];
  return (
    <aside className="flex h-full w-full flex-col bg-sidebar px-5 pb-5 pt-6 text-sidebar-foreground md:w-[270px] md:shrink-0" data-testid="sidebar">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="brand-orb flex h-9 w-9 items-center justify-center rounded-xl text-primary-foreground"><Sparkles className="h-4 w-4" aria-hidden="true" /></div>
          <div><p className="text-[14px] font-extrabold tracking-[-0.04em]">{assistantName}</p><p className="mt-0.5 text-[10px] text-sidebar-foreground/55">{t.private}</p></div>
        </div>
        {onClose && <button type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-xl text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-foreground" aria-label="Close menu"><X className="h-5 w-5" /></button>}
      </div>
      <button type="button" onClick={onNewChat} className="group mt-8 flex min-h-12 items-center justify-between rounded-2xl border border-sidebar-border bg-sidebar-accent px-4 text-left transition-all hover:border-sidebar-primary/65 hover:bg-[hsl(25_27%_27%)]" data-testid="button-new-chat">
        <span className="flex items-center gap-3 text-sm font-bold"><Plus className="h-4 w-4 text-sidebar-primary transition-transform group-hover:rotate-90" />{t.newChat}</span>
        <span className="rounded-md border border-sidebar-border px-1.5 py-0.5 font-mono text-[9px] text-sidebar-foreground/50">N</span>
      </button>
      <nav className="mt-5 space-y-1" aria-label="Assistant sections">
        <button type="button" onClick={() => onNavigate('chat')} className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-bold transition-colors ${view === 'chat' ? 'bg-sidebar-accent text-sidebar-foreground' : 'text-sidebar-foreground/65 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground'}`}><Sparkles className="h-4 w-4" />{t.chat}</button>
        {navItems.map(({ id, label, icon: Icon }) => (
          <button key={id} type="button" onClick={() => onNavigate(id)} className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-bold transition-colors ${view === id ? 'bg-sidebar-accent text-sidebar-foreground' : 'text-sidebar-foreground/65 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground'}`}><Icon className="h-4 w-4" />{language === 'ar' ? ({ chat: 'المحادثة', tasks: 'مهامي', day: 'يومي', reminders: 'التذكيرات', settings: 'الإعدادات' }[id]) : label}</button>
        ))}
      </nav>
      <div className="mt-5 min-h-0 flex-1 overflow-y-auto border-t border-sidebar-border pt-5">
        <p className="mb-3 px-2 text-[10px] font-bold uppercase tracking-[0.18em] text-sidebar-foreground/45">{t.conversations}</p>
        <div className="space-y-1">
          {conversations.length ? conversations.map((conversation) => (
            <button key={conversation.id} type="button" onClick={() => onConversation(conversation.id)} className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs transition-colors ${activeConversationId === conversation.id ? 'bg-sidebar-accent font-bold text-sidebar-foreground' : 'text-sidebar-foreground/62 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground'}`}>
              <Clock3 className="h-3.5 w-3.5 shrink-0 opacity-60" /><span className="truncate">{conversation.title}</span>
            </button>
          )) : <p className="px-2 text-xs leading-5 text-sidebar-foreground/45">{language === 'ar' ? 'ستظهر محادثاتك هنا.' : 'Your conversations will appear here.'}</p>}
        </div>
      </div>
      <div className="mt-5 border-t border-sidebar-border pt-5">
        <div className="mb-4 rounded-2xl bg-sidebar-accent p-4"><div className="mb-3 flex items-center justify-between"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-sidebar-foreground/50">{t.help}</p><span className="h-1.5 w-1.5 rounded-full bg-sidebar-primary" /></div><p className="text-[13px] leading-5 text-sidebar-foreground/78">{t.helpText}</p></div>
        <StatusIndicator language={language} />
        <p className="mt-3 text-[11px] leading-4 text-sidebar-foreground/45">{t.privateNote}</p>
      </div>
    </aside>
  );
}

function TypingIndicator() {
  return <div className="message-in flex items-start gap-3" data-testid="status-assistant-typing"><div className="brand-orb mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-[11px] text-primary-foreground"><Sparkles className="h-3.5 w-3.5" /></div><div className="rounded-2xl rounded-tl-sm border border-border bg-card px-4 py-3.5 shadow-sm"><div className="flex gap-1.5 py-1"><span className="typing-dot h-1.5 w-1.5 rounded-full bg-accent" /><span className="typing-dot h-1.5 w-1.5 rounded-full bg-accent" /><span className="typing-dot h-1.5 w-1.5 rounded-full bg-accent" /></div></div></div>;
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  return (
    <div className={`message-in flex items-start gap-3 ${isUser ? 'justify-end' : ''}`} data-testid={`message-${message.role}-${message.id}`}>
      {!isUser && <div className="brand-orb mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-[11px] text-primary-foreground"><Sparkles className="h-3.5 w-3.5" /></div>}
      <div dir="auto" className={isUser ? 'max-w-[84%] rounded-[20px] rounded-tr-sm bg-primary px-4 py-3 text-[14px] leading-6 text-primary-foreground shadow-sm sm:max-w-[69%]' : 'max-w-[89%] rounded-[20px] rounded-tl-sm border border-border bg-card px-4 py-3 text-[14px] leading-6 text-card-foreground shadow-sm sm:max-w-[76%]'}>
        {message.text.split('\n').map((line, index) => <span className="block" key={`${message.id}-${index}`}>{line || '\u00a0'}</span>)}
        {!isUser && message.mode && <span className="mt-2 block text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60">Private response</span>}
      </div>
    </div>
  );
}

function QuickActionGrid({ onAction }: { onAction: (action: (typeof quickActions)[number]) => void }) {
  return <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4" data-testid="quick-actions">{quickActions.map((action, index) => {
    const { label, icon: Icon, tone } = action;
    return <button key={label} type="button" onClick={() => onAction(action)} className={`message-in stagger-${Math.min(index + 1, 3)} group flex min-h-[58px] items-center justify-between gap-2 rounded-2xl border bg-card/80 px-3.5 text-left text-[12px] font-bold text-card-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${tone === 'coral' ? 'border-primary/20 hover:border-primary/55' : tone === 'sage' ? 'border-accent/20 hover:border-accent/55' : tone === 'gold' ? 'border-[hsl(38_82%_54%_/_0.25)] hover:border-[hsl(38_82%_54%_/_0.6)]' : 'border-[hsl(190_28%_38%_/_0.22)] hover:border-[hsl(190_28%_38%_/_0.55)]'}`} data-testid={`button-quick-action-${index}`}>
      <span className="flex min-w-0 items-center gap-2"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted"><Icon className="h-3.5 w-3.5 text-accent" /></span><span className="truncate">{label}</span></span><ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </button>;
  })}</div>;
}

function EmptyState({ language, onAction }: { language: Language; onAction: (action: (typeof quickActions)[number]) => void }) {
  const t = labels[language];
  return <div className="flex min-h-full flex-col justify-center py-9 sm:py-16" data-testid="empty-chat">
    <div className="mb-6 flex items-center gap-3"><div className="brand-orb flex h-12 w-12 items-center justify-center rounded-[17px] text-primary-foreground shadow-sm"><Sparkles className="h-5 w-5" /></div><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent">{t.private}</p><p className="mt-1 text-[11px] text-muted-foreground">{t.fresh}</p></div></div>
    <h1 className="font-serif text-[clamp(3rem,10vw,5.5rem)] leading-[0.9] tracking-[-0.055em] text-foreground" data-testid="text-welcome">{t.welcome} <span aria-hidden="true">👋</span></h1>
    <p className="mt-5 text-[16px] leading-7 text-muted-foreground" data-testid="text-welcome-subtitle">{t.welcomeSub}</p>
    <div className="mt-9"><p className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground/75">{t.start}</p><QuickActionGrid onAction={onAction} /></div>
  </div>;
}

function Composer({ value, onChange, onSend, isPending, language }: { value: string; onChange: (value: string) => void; onSend: () => void; isPending: boolean; language: Language }) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const t = labels[language];
  useEffect(() => { const textarea = textareaRef.current; if (!textarea) return; textarea.style.height = 'auto'; textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`; }, [value]);
  return <div className="border-t border-border/70 bg-[hsl(var(--background)/_0.86)] px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl sm:px-8 sm:pb-5"><div className="mx-auto max-w-[850px]"><div className={`composer-shadow relative flex items-end gap-2 rounded-[21px] border bg-card p-2 transition-colors ${isPending ? 'border-primary/55' : 'border-border focus-within:border-primary/70'}`}>
    <textarea ref={textareaRef} value={value} dir="auto" onChange={(event) => onChange(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); onSend(); } }} placeholder={t.placeholder} rows={1} maxLength={4000} disabled={isPending} className="max-h-[150px] min-h-11 flex-1 resize-none bg-transparent px-3 py-2.5 text-[14px] leading-6 text-foreground outline-none placeholder:text-muted-foreground/65 disabled:cursor-wait" aria-label={t.placeholder} data-testid="input-chat-message" />
    <button type="button" onClick={onSend} disabled={!value.trim() || isPending} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] bg-primary text-primary-foreground transition-all hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-35" aria-label={isPending ? t.sending : t.send} data-testid="button-send-message">{isPending ? <RotateCcw className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-5 w-5" />}</button>
  </div><div className="mt-2 flex items-center justify-between px-1"><p className="text-[10px] font-medium text-muted-foreground/70">{t.enter}</p><p className="font-mono text-[10px] text-muted-foreground/65">{value.length}/4000</p></div></div></div>;
}

function apiToMessage(message: ApiMessage): Message {
  return { id: message.id, role: message.role, text: message.content };
}

export default function Home() {
  const queryClient = useQueryClient();
  const settingsQuery = useGetSettings();
  const conversationsQuery = useListConversations();
  const [settings, setSettings] = useState<Settings | undefined>();
  const [view, setView] = useState<View>('chat');
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [newChatMode, setNewChatMode] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sendLock, setSendLock] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageIdRef = useRef(-1);
  const sendLockRef = useRef(false);
  const sendChat = useSendChatMessage();
  const language: Language = settings?.language ?? settingsQuery.data?.language ?? 'en';
  const assistantName = settings?.assistant_name ?? settingsQuery.data?.assistant_name ?? 'Hamad AI';
  const conversationMessages = useListConversationMessages(activeConversationId ?? 0, { query: { queryKey: ['conversation-messages', activeConversationId], enabled: activeConversationId !== null } });
  const t = labels[language];
  const activeConversation = conversationsQuery.data?.find((conversation) => conversation.id === activeConversationId);

  useEffect(() => { if (settingsQuery.data) setSettings(settingsQuery.data); }, [settingsQuery.data]);
  useEffect(() => { document.documentElement.classList.toggle('dark', (settings?.theme ?? settingsQuery.data?.theme) === 'dark'); document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr'; return () => { document.documentElement.dir = 'ltr'; }; }, [language, settings?.theme, settingsQuery.data?.theme]);
  useEffect(() => { if (!newChatMode && activeConversationId === null && conversationsQuery.data?.[0]) setActiveConversationId(conversationsQuery.data[0].id); }, [activeConversationId, conversationsQuery.data, newChatMode]);
  useEffect(() => { if (conversationMessages.data && activeConversationId !== null) setMessages(conversationMessages.data.map(apiToMessage)); }, [activeConversationId, conversationMessages.data]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [messages, sendChat.isPending]);

  const navigate = (nextView: View) => { setView(nextView); setMobileMenuOpen(false); };
  const newChat = () => { setActiveConversationId(null); setNewChatMode(true); setMessages([]); setInput(''); sendChat.reset(); setView('chat'); setMobileMenuOpen(false); };
  const selectConversation = (id: number) => { setActiveConversationId(id); setNewChatMode(false); setMessages([]); setView('chat'); setMobileMenuOpen(false); };
  const sendMessage = (messageOverride?: string) => {
    const message = (messageOverride ?? input).trim();
    if (!message || sendChat.isPending || sendLockRef.current) return;
    sendLockRef.current = true;
    setSendLock(true);
    setInput('');
    setMessages((current) => [...current, { id: messageIdRef.current--, role: 'user', text: message }]);
    sendChat.mutate({ data: { message, conversation_id: activeConversationId } }, {
      onSuccess: (response) => {
        setActiveConversationId(response.conversation_id);
        setNewChatMode(false);
        setMessages((current) => [...current, { id: messageIdRef.current--, role: 'assistant', text: response.reply, mode: response.mode }]);
        void queryClient.invalidateQueries({ queryKey: conversationsQuery.queryKey });
        sendLockRef.current = false;
        setSendLock(false);
      },
      onError: () => { sendLockRef.current = false; setSendLock(false); },
    });
  };
  const handleQuickAction = (action: (typeof quickActions)[number]) => { if (action.view !== 'chat') navigate(action.view); else sendMessage(action.prompt); };

  const renderView = () => {
    if (view === 'tasks') return <TasksPanel language={language} />;
    if (view === 'day') return <DayPanel language={language} />;
    if (view === 'reminders') return <RemindersPanel language={language} />;
    if (view === 'settings') return <SettingsPanel language={language} onSaved={(saved) => setSettings(saved)} />;
    return (
      <div className="mx-auto min-h-full max-w-[850px]">
        {messages.length === 0 ? <EmptyState language={language} onAction={handleQuickAction} /> : <div className="flex flex-col gap-6 py-8 sm:py-12" data-testid="message-list">
          {messages.map((message) => <MessageBubble key={message.id} message={message} />)}
          {sendChat.isPending && <TypingIndicator />}
          {sendChat.isError && <div className="message-in ml-11 max-w-[510px] rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-[13px] leading-5 text-foreground" data-testid="status-chat-error"><p className="font-bold text-destructive">{t.couldn}</p><p className="mt-1 text-muted-foreground">{getChatErrorMessage(sendChat.error)}</p><button type="button" onClick={() => sendChat.reset()} className="mt-2 inline-flex min-h-9 rounded-lg px-2 text-xs font-bold text-foreground underline decoration-destructive/60 underline-offset-4">{t.dismiss}</button></div>}
          <div ref={messagesEndRef} />
        </div>}
      </div>
    );
  };

  return (
    <main className="app-shell min-h-[100dvh] overflow-hidden text-foreground" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="grain" aria-hidden="true" />
      <div className="relative flex min-h-[100dvh]">
        <div className="hidden md:block"><Sidebar language={language} assistantName={assistantName} view={view} conversations={conversationsQuery.data ?? []} activeConversationId={activeConversationId} onNewChat={newChat} onNavigate={navigate} onConversation={selectConversation} /></div>
        {mobileMenuOpen && <div className="fixed inset-0 z-30 md:hidden"><button type="button" className="absolute inset-0 bg-[hsl(25_34%_17%_/_0.62)]" onClick={() => setMobileMenuOpen(false)} aria-label="Close navigation" /><div className="relative h-full w-[min(86vw,320px)]"><Sidebar language={language} assistantName={assistantName} view={view} conversations={conversationsQuery.data ?? []} activeConversationId={activeConversationId} onNewChat={newChat} onNavigate={navigate} onConversation={selectConversation} onClose={() => setMobileMenuOpen(false)} /></div></div>}
        <section className="flex min-w-0 flex-1 flex-col">
          <header className="flex min-h-[76px] shrink-0 items-center justify-between border-b border-border/70 px-4 sm:px-8">
            <div className="flex items-center gap-3"><button type="button" onClick={() => setMobileMenuOpen(true)} className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted md:hidden" aria-label="Open menu"><Menu className="h-5 w-5" /></button><div className="md:hidden"><BrandMark compact assistantName={assistantName} /></div><div className="hidden md:block"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{view === 'chat' ? t.conversation : t.private}</p><p className="mt-1 text-[13px] font-bold text-foreground" data-testid="text-conversation-title">{view === 'chat' ? activeConversation?.title ?? t.fresh : view === 'tasks' ? (language === 'ar' ? 'مهامي' : 'My Tasks') : view === 'day' ? (language === 'ar' ? 'يومي' : 'My Day') : view === 'reminders' ? (language === 'ar' ? 'التذكيرات' : 'Reminders') : (language === 'ar' ? 'الإعدادات' : 'Settings')}</p></div></div>
            <div className="flex items-center gap-3"><div className="hidden sm:block"><StatusIndicator language={language} /></div><button type="button" onClick={newChat} className="flex h-10 items-center gap-2 rounded-xl px-3 text-[12px] font-bold text-muted-foreground hover:bg-muted hover:text-foreground"><Plus className="h-4 w-4" /><span className="hidden sm:inline">{t.newChat}</span></button></div>
          </header>
          <div className={`chat-scroll min-h-0 flex-1 overflow-y-auto px-4 sm:px-8 ${view === 'chat' ? '' : 'bg-background/45'}`} data-testid="chat-area">{renderView()}</div>
          {view === 'chat' && <Composer value={input} onChange={setInput} onSend={() => sendMessage()} isPending={sendChat.isPending || sendLock} language={language} />}
        </section>
      </div>
    </main>
  );
}