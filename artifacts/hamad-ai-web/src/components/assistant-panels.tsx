import { FormEvent, useEffect, useState, type ComponentType } from 'react';
import {
  BellRing,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  ListTodo,
  Loader2,
  Moon,
  Plus,
  Settings2,
  Sparkles,
  Sun,
  Trash2,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useCreateDailyPlan,
  useCreateReminder,
  useCreateTask,
  useDeleteReminder,
  useDeleteTask,
  useGetDay,
  useGetSettings,
  useListReminders,
  useListTasks,
  useUpdateReminder,
  useUpdateSettings,
  useUpdateTask,
} from '@workspace/api-client-react';
import type { Settings, Task } from '@workspace/api-client-react';

type Language = 'en' | 'ar';

const todayValue = () => new Date().toISOString().slice(0, 10);

const copy = {
  en: {
    tasks: 'My Tasks',
    tasksHint: 'Keep the important work visible and moving.',
    addTask: 'Add a task',
    taskTitle: 'Task title',
    dueDate: 'Due date',
    priority: 'Priority',
    status: 'Status',
    saveTask: 'Save task',
    noTasks: 'No tasks yet. Add one to make your next step concrete.',
    reminders: 'Reminders',
    remindersHint: 'Keep small promises to your future self.',
    addReminder: 'Add a reminder',
    reminderTitle: 'Reminder title',
    remindAt: 'Date and time',
    saveReminder: 'Save reminder',
    noReminders: 'No upcoming reminders.',
    day: 'My Day',
    dayHint: 'A calm view of what deserves your attention today.',
    today: "Today's focus",
    createPlan: 'Create daily plan',
    planning: 'Planning…',
    noToday: 'Nothing is due today yet.',
    settings: 'Settings',
    settingsHint: 'Shape Hamad AI around the way you work.',
    language: 'Language',
    theme: 'Theme',
    assistantName: 'Personal assistant name',
    saveSettings: 'Save settings',
    saved: 'Saved',
    light: 'Light',
    dark: 'Dark',
    english: 'English',
    arabic: 'العربية',
    todo: 'To Do',
    inProgress: 'In Progress',
    completed: 'Completed',
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    delete: 'Delete',
  },
  ar: {
    tasks: 'مهامي',
    tasksHint: 'اجعل الأعمال المهمة واضحة وسهلة المتابعة.',
    addTask: 'إضافة مهمة',
    taskTitle: 'عنوان المهمة',
    dueDate: 'تاريخ الاستحقاق',
    priority: 'الأولوية',
    status: 'الحالة',
    saveTask: 'حفظ المهمة',
    noTasks: 'لا توجد مهام بعد. أضف مهمة لتحديد خطوتك التالية.',
    reminders: 'التذكيرات',
    remindersHint: 'تذكّر الوعود الصغيرة التي قطعتها لنفسك.',
    addReminder: 'إضافة تذكير',
    reminderTitle: 'عنوان التذكير',
    remindAt: 'التاريخ والوقت',
    saveReminder: 'حفظ التذكير',
    noReminders: 'لا توجد تذكيرات قادمة.',
    day: 'يومي',
    dayHint: 'نظرة هادئة على ما يستحق انتباهك اليوم.',
    today: 'تركيز اليوم',
    createPlan: 'إنشاء خطة اليوم',
    planning: 'جارٍ التخطيط…',
    noToday: 'لا توجد مهام مستحقة اليوم.',
    settings: 'الإعدادات',
    settingsHint: 'خصص حمد AI بالطريقة التي تناسب عملك.',
    language: 'اللغة',
    theme: 'المظهر',
    assistantName: 'اسم المساعد الشخصي',
    saveSettings: 'حفظ الإعدادات',
    saved: 'تم الحفظ',
    light: 'فاتح',
    dark: 'داكن',
    english: 'English',
    arabic: 'العربية',
    todo: 'للإنجاز',
    inProgress: 'قيد التنفيذ',
    completed: 'مكتملة',
    low: 'منخفضة',
    medium: 'متوسطة',
    high: 'عالية',
    delete: 'حذف',
  },
} as const;

function PanelHeader({
  icon: Icon,
  title,
  hint,
  language,
}: {
  icon: ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
  title: string;
  hint: string;
  language: Language;
}) {
  return (
    <div className="mb-8 flex items-start gap-4">
      <div className="brand-orb flex h-12 w-12 shrink-0 items-center justify-center rounded-[17px] text-primary-foreground shadow-sm">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent">
          {language === 'ar' ? 'مساحتك الخاصة' : 'Your private space'}
        </p>
        <h1 className="mt-1 font-serif text-4xl tracking-[-0.04em] text-foreground sm:text-5xl">{title}</h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{hint}</p>
      </div>
    </div>
  );
}

function PanelCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-[22px] border border-border bg-card p-4 shadow-sm sm:p-5 ${className}`}>{children}</div>;
}

function ErrorNote() {
  return <p className="mt-3 text-xs text-destructive">Something went wrong. Please try again.</p>;
}

function TaskRow({
  task,
  language,
  onStatus,
  onDelete,
}: {
  task: Task;
  language: Language;
  onStatus: (status: 'todo' | 'in_progress' | 'completed') => void;
  onDelete: () => void;
}) {
  const t = copy[language];
  const priorityClass =
    task.priority === 'high'
      ? 'bg-primary/12 text-primary'
      : task.priority === 'medium'
        ? 'bg-[hsl(38_82%_54%_/_0.14)] text-[hsl(32_75%_38%)]'
        : 'bg-accent/12 text-accent';

  return (
    <div className="flex flex-col gap-3 border-t border-border/70 py-4 first:border-t-0 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className={`truncate text-sm font-bold ${task.status === 'completed' ? 'text-muted-foreground line-through' : 'text-card-foreground'}`}>
          {task.title}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
          <span className={`rounded-full px-2 py-1 ${priorityClass}`}>{t[task.priority]}</span>
          <span className="flex items-center gap-1">
            <CalendarDays className="h-3 w-3" aria-hidden="true" />
            {task.due_date}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <select
          value={task.status}
          onChange={(event) => onStatus(event.target.value as 'todo' | 'in_progress' | 'completed')}
          className="h-9 rounded-xl border border-border bg-background px-2 text-xs font-semibold text-foreground outline-none focus:border-primary"
          aria-label={`${t.status}: ${task.title}`}
        >
          <option value="todo">{t.todo}</option>
          <option value="in_progress">{t.inProgress}</option>
          <option value="completed">{t.completed}</option>
        </select>
        <button
          type="button"
          onClick={onDelete}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          aria-label={`${t.delete}: ${task.title}`}
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

export function TasksPanel({ language }: { language: Language }) {
  const t = copy[language];
  const queryClient = useQueryClient();
  const tasks = useListTasks();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState(todayValue);
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [status, setStatus] = useState<'todo' | 'in_progress' | 'completed'>('todo');

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: tasks.queryKey });
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim() || createTask.isPending) return;
    createTask.mutate(
      { data: { title: title.trim(), due_date: dueDate, priority, status } },
      { onSuccess: () => { setTitle(''); setPriority('medium'); setStatus('todo'); refresh(); } },
    );
  };

  return (
    <div className="mx-auto w-full max-w-[850px] py-8 sm:py-12">
      <PanelHeader icon={ListTodo} title={t.tasks} hint={t.tasksHint} language={language} />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
        <PanelCard>
          <h2 className="mb-4 flex items-center gap-2 text-sm font-extrabold text-card-foreground">
            <Plus className="h-4 w-4 text-primary" aria-hidden="true" /> {t.addTask}
          </h2>
          <form className="space-y-3" onSubmit={submit}>
            <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder={t.taskTitle} maxLength={200} className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary" />
            <div className="grid grid-cols-2 gap-2">
              <label className="space-y-1 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                <span>{t.dueDate}</span>
                <input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} className="h-10 w-full rounded-xl border border-border bg-background px-2 text-xs font-semibold text-foreground outline-none focus:border-primary" />
              </label>
              <label className="space-y-1 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                <span>{t.priority}</span>
                <select value={priority} onChange={(event) => setPriority(event.target.value as typeof priority)} className="h-10 w-full rounded-xl border border-border bg-background px-2 text-xs font-semibold text-foreground outline-none focus:border-primary">
                  <option value="low">{t.low}</option><option value="medium">{t.medium}</option><option value="high">{t.high}</option>
                </select>
              </label>
            </div>
            <label className="block space-y-1 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
              <span>{t.status}</span>
              <select value={status} onChange={(event) => setStatus(event.target.value as typeof status)} className="h-10 w-full rounded-xl border border-border bg-background px-2 text-xs font-semibold text-foreground outline-none focus:border-primary">
                <option value="todo">{t.todo}</option><option value="in_progress">{t.inProgress}</option><option value="completed">{t.completed}</option>
              </select>
            </label>
            <button type="submit" disabled={!title.trim() || createTask.isPending} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45">
              {createTask.isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Check className="h-4 w-4" aria-hidden="true" />} {t.saveTask}
            </button>
          </form>
          {createTask.isError && <ErrorNote />}
        </PanelCard>
        <PanelCard>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-card-foreground">{t.tasks}</h2>
            <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-bold text-muted-foreground">{tasks.data?.length ?? 0}</span>
          </div>
          {tasks.isLoading ? <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div> : tasks.data?.length ? tasks.data.map((task) => (
            <TaskRow key={task.id} task={task} language={language} onStatus={(nextStatus) => updateTask.mutate({ taskId: task.id, data: { status: nextStatus } }, { onSuccess: refresh })} onDelete={() => deleteTask.mutate({ taskId: task.id }, { onSuccess: refresh })} />
          )) : <p className="py-8 text-sm leading-6 text-muted-foreground">{t.noTasks}</p>}
          {(tasks.isError || updateTask.isError || deleteTask.isError) && <ErrorNote />}
        </PanelCard>
      </div>
    </div>
  );
}

function DayTask({ task, language }: { task: Task; language: Language }) {
  const t = copy[language];
  return (
    <div className="flex items-center gap-3 border-t border-border/70 py-3 first:border-t-0">
      <span className={`h-2.5 w-2.5 rounded-full ${task.priority === 'high' ? 'bg-primary' : task.priority === 'medium' ? 'bg-[hsl(38_82%_54%)]' : 'bg-accent'}`} />
      <span className={`min-w-0 flex-1 text-sm font-semibold ${task.status === 'completed' ? 'text-muted-foreground line-through' : 'text-card-foreground'}`}>{task.title}</span>
      <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">{t[task.priority]}</span>
    </div>
  );
}

export function DayPanel({ language }: { language: Language }) {
  const t = copy[language];
  const day = useGetDay();
  const plan = useCreateDailyPlan();
  const tasks = day.data?.tasks ?? [];
  return (
    <div className="mx-auto w-full max-w-[850px] py-8 sm:py-12">
      <PanelHeader icon={CalendarDays} title={t.day} hint={t.dayHint} language={language} />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <PanelCard>
          <div className="mb-4 flex items-center justify-between">
            <div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-accent">{t.today}</p><p className="mt-1 text-lg font-extrabold text-card-foreground">{day.data?.date ?? todayValue()}</p></div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted"><Clock3 className="h-4 w-4 text-accent" /></div>
          </div>
          {day.isLoading ? <Loader2 className="my-8 h-5 w-5 animate-spin text-primary" /> : tasks.length ? tasks.map((task) => <DayTask key={task.id} task={task} language={language} />) : <p className="py-8 text-sm leading-6 text-muted-foreground">{t.noToday}</p>}
        </PanelCard>
        <PanelCard className="bg-[linear-gradient(145deg,hsl(var(--card)),hsl(var(--muted)/_0.58))]">
          <div className="flex items-start justify-between gap-4">
            <div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-accent">{language === 'ar' ? 'مساعدة حمد' : 'Hamad helps'}</p><h2 className="mt-1 text-xl font-extrabold text-card-foreground">{language === 'ar' ? 'خطة واقعية ليومك' : 'A realistic plan for your day'}</h2></div>
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{plan.data?.plan ?? (language === 'ar' ? 'أنشئ خطة مرتبة حسب الأولوية لمهام اليوم.' : 'Create a focused plan ordered by priority for today’s tasks.')}</p>
          <button type="button" disabled={plan.isPending} onClick={() => plan.mutate()} className="mt-6 flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground transition-all hover:brightness-110 disabled:opacity-50">
            {plan.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} {plan.isPending ? t.planning : t.createPlan}
          </button>
          {plan.isError && <ErrorNote />}
        </PanelCard>
      </div>
    </div>
  );
}

export function RemindersPanel({ language }: { language: Language }) {
  const t = copy[language];
  const queryClient = useQueryClient();
  const reminders = useListReminders();
  const createReminder = useCreateReminder();
  const updateReminder = useUpdateReminder();
  const deleteReminder = useDeleteReminder();
  const [title, setTitle] = useState('');
  const [remindAt, setRemindAt] = useState('');
  const refresh = () => void queryClient.invalidateQueries({ queryKey: reminders.queryKey });
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !remindAt || createReminder.isPending) return;
    createReminder.mutate({ data: { title: title.trim(), remind_at: new Date(remindAt).toISOString() } }, { onSuccess: () => { setTitle(''); setRemindAt(''); refresh(); } });
  };
  return (
    <div className="mx-auto w-full max-w-[850px] py-8 sm:py-12">
      <PanelHeader icon={BellRing} title={t.reminders} hint={t.remindersHint} language={language} />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
        <PanelCard>
          <h2 className="mb-4 flex items-center gap-2 text-sm font-extrabold text-card-foreground"><Plus className="h-4 w-4 text-primary" /> {t.addReminder}</h2>
          <form className="space-y-3" onSubmit={submit}>
            <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder={t.reminderTitle} maxLength={200} className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary" />
            <label className="block space-y-1 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground"><span>{t.remindAt}</span><input type="datetime-local" value={remindAt} onChange={(event) => setRemindAt(event.target.value)} className="h-11 w-full rounded-xl border border-border bg-background px-3 text-xs font-semibold text-foreground outline-none focus:border-primary" /></label>
            <button type="submit" disabled={!title.trim() || !remindAt || createReminder.isPending} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground transition-all hover:brightness-110 disabled:opacity-45">{createReminder.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} {t.saveReminder}</button>
          </form>
          {createReminder.isError && <ErrorNote />}
        </PanelCard>
        <PanelCard>
          {reminders.isLoading ? <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div> : reminders.data?.length ? reminders.data.map((reminder) => (
            <div key={reminder.id} className="flex items-center gap-3 border-t border-border/70 py-4 first:border-t-0 first:pt-0 last:pb-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted"><BellRing className="h-4 w-4 text-accent" /></div>
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-card-foreground">{reminder.title}</p><p className="mt-1 text-xs text-muted-foreground">{new Date(reminder.remind_at).toLocaleString(language === 'ar' ? 'ar' : 'en')}</p></div>
              <button type="button" onClick={() => updateReminder.mutate({ reminderId: reminder.id, data: { completed: true } }, { onSuccess: refresh })} className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-accent/10 hover:text-accent" aria-label={`${t.completed}: ${reminder.title}`}><CheckCircle2 className="h-4 w-4" /></button>
              <button type="button" onClick={() => deleteReminder.mutate({ reminderId: reminder.id }, { onSuccess: refresh })} className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label={`${t.delete}: ${reminder.title}`}><Trash2 className="h-4 w-4" /></button>
            </div>
          )) : <p className="py-8 text-sm leading-6 text-muted-foreground">{t.noReminders}</p>}
          {(reminders.isError || updateReminder.isError || deleteReminder.isError) && <ErrorNote />}
        </PanelCard>
      </div>
    </div>
  );
}

export function SettingsPanel({ language, onSaved }: { language: Language; onSaved: (settings: Settings) => void }) {
  const t = copy[language];
  const settingsQuery = useGetSettings();
  const updateSettings = useUpdateSettings();
  const [form, setForm] = useState({ language, theme: 'light' as 'light' | 'dark', assistant_name: 'Hamad AI' });
  useEffect(() => {
    if (settingsQuery.data) setForm({ language: settingsQuery.data.language, theme: settingsQuery.data.theme, assistant_name: settingsQuery.data.assistant_name });
  }, [settingsQuery.data]);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    updateSettings.mutate({ data: form }, { onSuccess: onSaved });
  };
  return (
    <div className="mx-auto w-full max-w-[700px] py-8 sm:py-12">
      <PanelHeader icon={Settings2} title={t.settings} hint={t.settingsHint} language={language} />
      <PanelCard>
        <form className="space-y-5" onSubmit={submit}>
          <label className="block space-y-2"><span className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">{t.assistantName}</span><input value={form.assistant_name} onChange={(event) => setForm((current) => ({ ...current, assistant_name: event.target.value }))} maxLength={80} className="h-12 w-full rounded-xl border border-border bg-background px-3 text-sm font-semibold outline-none focus:border-primary" /></label>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">{t.language}</p><div className="grid grid-cols-2 gap-2">{(['en', 'ar'] as const).map((value) => <button key={value} type="button" onClick={() => setForm((current) => ({ ...current, language: value }))} className={`h-11 rounded-xl border text-sm font-bold transition-colors ${form.language === value ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/50'}`}>{value === 'en' ? t.english : t.arabic}</button>)}</div></div>
            <div><p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">{t.theme}</p><div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => setForm((current) => ({ ...current, theme: 'light' }))} className={`flex h-11 items-center justify-center gap-2 rounded-xl border text-sm font-bold ${form.theme === 'light' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'}`}><Sun className="h-4 w-4" />{t.light}</button><button type="button" onClick={() => setForm((current) => ({ ...current, theme: 'dark' }))} className={`flex h-11 items-center justify-center gap-2 rounded-xl border text-sm font-bold ${form.theme === 'dark' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'}`}><Moon className="h-4 w-4" />{t.dark}</button></div></div>
          </div>
          <button type="submit" disabled={updateSettings.isPending || !form.assistant_name.trim()} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground hover:brightness-110 disabled:opacity-45">{updateSettings.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}{updateSettings.isSuccess ? t.saved : t.saveSettings}</button>
          {updateSettings.isError && <ErrorNote />}
        </form>
      </PanelCard>
    </div>
  );
}