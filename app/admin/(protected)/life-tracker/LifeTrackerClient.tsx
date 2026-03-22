// ✅ Путь: app/admin/(protected)/life-tracker/LifeTrackerClient.tsx
'use client';

import React, { useEffect, useMemo, useState, useTransition } from 'react';
import { format, parseISO, startOfWeek, endOfWeek, subWeeks, eachDayOfInterval, isWithinInterval } from 'date-fns';
import { ru } from 'date-fns/locale/ru';
import { motion } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
} from 'recharts';
import { saveLifeTrackerEntry, saveLifeTrackerSettings, deleteLifeTrackerEntry } from './actions';
import type { LifeTrackerEntry, LifeTrackerSettings, TrainingType } from './types';

type EntryDraft = {
  entry_date: string;

  weight_kg: string;
  waist_cm: string;
  sleep_hours: string;

  breakfast_done: boolean;
  steps: string;
  walk_km: string;
  water_l: string;
  protein_g: string;
  calories_kcal: string;

  resting_pulse: string;
  systolic: string;
  diastolic: string;

  mood_score: string;
  energy_score: string;
  stress_score: string;
  lower_back_pain_score: string;

  focus_blocks: string;
  deep_work_minutes: string;

  planned_training_type: TrainingType;

  gym_done: boolean;
  bjj_done: boolean;
  walk_done: boolean;
  mobility_done: boolean;
  stretching_done: boolean;
  creatine_done: boolean;

  protein_shakes: string;
  hookah_sessions: string;
  notes: string;
};

type SettingsDraft = {
  sleep_goal_hours: string;
  protein_goal_g: string;
  steps_goal: string;
  walk_goal_km: string;
  water_goal_l: string;
  focus_blocks_goal: string;
  deep_work_goal_minutes: string;
  hookah_limit_per_day: string;
  breakfast_required: boolean;
  weekly_gym_goal: string;
  weekly_bjj_goal: string;
  weekly_walk_goal: string;
  weekly_mobility_goal: string;
  weight_goal_kg: string;
  waist_goal_cm: string;
  gym_days: number[];
  bjj_days: number[];
  walk_days: number[];
  mobility_days: number[];
};

type ChecklistResult = {
  fails: string[];
  wins: string[];
  possibleChecks: number;
};

type Props = {
  initialEntries: LifeTrackerEntry[];
  initialSettings: LifeTrackerSettings;
};

const glass =
  'rounded-3xl border border-white/20 bg-white/60 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.06)]';
const glassSoft =
  'rounded-[28px] border border-white/20 bg-white/55 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.05)]';
const inputBase =
  'w-full rounded-2xl border border-black/10 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-black/30 focus:ring-2 focus:ring-black/10';
const textareaBase =
  'w-full rounded-2xl border border-black/10 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-black/30 focus:ring-2 focus:ring-black/10 min-h-[120px]';
const chipBase =
  'inline-flex items-center rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-medium text-gray-700';
const cardTitle = 'text-sm font-semibold text-gray-900';
const cardHint = 'text-xs text-gray-500';
const weekdayOptions = [
  { value: 1, label: 'Пн' },
  { value: 2, label: 'Вт' },
  { value: 3, label: 'Ср' },
  { value: 4, label: 'Чт' },
  { value: 5, label: 'Пт' },
  { value: 6, label: 'Сб' },
  { value: 7, label: 'Вс' },
] as const;

const trainingOptions: { value: TrainingType; label: string }[] = [
  { value: 'none', label: 'Без плана' },
  { value: 'gym', label: 'Силовая' },
  { value: 'bjj', label: 'BJJ' },
  { value: 'walk', label: 'Ходьба' },
  { value: 'mobility', label: 'Мобилити / растяжка' },
  { value: 'recovery', label: 'Восстановление' },
];

const trainingLabels: Record<TrainingType, string> = {
  none: 'Без плана',
  gym: 'Силовая',
  bjj: 'BJJ',
  walk: 'Ходьба',
  mobility: 'Мобилити',
  recovery: 'Восстановление',
};

function formatShortDate(value: string) {
  if (!value) return '-';
  return format(parseISO(value), 'dd.MM', { locale: ru });
}

function formatLongDate(value: string) {
  if (!value) return '-';
  return format(parseISO(value), 'EEEE, d MMMM', { locale: ru });
}

function getTodayString() {
  return format(new Date(), 'yyyy-MM-dd');
}

function numberToString(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return '';
  return String(value);
}

function ensureSorted(entries: LifeTrackerEntry[]) {
  return [...entries].sort((a, b) => a.entry_date.localeCompare(b.entry_date));
}

function upsertEntry(entries: LifeTrackerEntry[], next: LifeTrackerEntry) {
  const map = new Map(entries.map((item) => [item.entry_date, item]));
  map.set(next.entry_date, next);
  return ensureSorted(Array.from(map.values()));
}

function settingsToDraft(settings: LifeTrackerSettings): SettingsDraft {
  return {
    sleep_goal_hours: numberToString(settings.sleep_goal_hours),
    protein_goal_g: numberToString(settings.protein_goal_g),
    steps_goal: numberToString(settings.steps_goal),
    walk_goal_km: numberToString(settings.walk_goal_km),
    water_goal_l: numberToString(settings.water_goal_l),
    focus_blocks_goal: numberToString(settings.focus_blocks_goal),
    deep_work_goal_minutes: numberToString(settings.deep_work_goal_minutes),
    hookah_limit_per_day: numberToString(settings.hookah_limit_per_day),
    breakfast_required: settings.breakfast_required,
    weekly_gym_goal: numberToString(settings.weekly_gym_goal),
    weekly_bjj_goal: numberToString(settings.weekly_bjj_goal),
    weekly_walk_goal: numberToString(settings.weekly_walk_goal),
    weekly_mobility_goal: numberToString(settings.weekly_mobility_goal),
    weight_goal_kg: numberToString(settings.weight_goal_kg),
    waist_goal_cm: numberToString(settings.waist_goal_cm),
    gym_days: [...settings.gym_days],
    bjj_days: [...settings.bjj_days],
    walk_days: [...settings.walk_days],
    mobility_days: [...settings.mobility_days],
  };
}

function inferPlannedTrainingType(date: string, settings: LifeTrackerSettings): TrainingType {
  const isoDay = getIsoDay(date);
  if (settings.gym_days.includes(isoDay)) return 'gym';
  if (settings.bjj_days.includes(isoDay)) return 'bjj';
  if (settings.walk_days.includes(isoDay)) return 'walk';
  if (settings.mobility_days.includes(isoDay)) return 'mobility';
  return 'none';
}

function entryToDraft(
  entry: LifeTrackerEntry | undefined,
  date: string,
  settings: LifeTrackerSettings,
): EntryDraft {
  return {
    entry_date: date,

    weight_kg: numberToString(entry?.weight_kg),
    waist_cm: numberToString(entry?.waist_cm),
    sleep_hours: numberToString(entry?.sleep_hours),

    breakfast_done: entry?.breakfast_done ?? false,
    steps: numberToString(entry?.steps ?? 0),
    walk_km: numberToString(entry?.walk_km),
    water_l: numberToString(entry?.water_l),
    protein_g: numberToString(entry?.protein_g ?? 0),
    calories_kcal: numberToString(entry?.calories_kcal),

    resting_pulse: numberToString(entry?.resting_pulse),
    systolic: numberToString(entry?.systolic),
    diastolic: numberToString(entry?.diastolic),

    mood_score: numberToString(entry?.mood_score),
    energy_score: numberToString(entry?.energy_score),
    stress_score: numberToString(entry?.stress_score),
    lower_back_pain_score: numberToString(entry?.lower_back_pain_score),

    focus_blocks: numberToString(entry?.focus_blocks ?? 0),
    deep_work_minutes: numberToString(entry?.deep_work_minutes ?? 0),

    planned_training_type: entry?.planned_training_type ?? inferPlannedTrainingType(date, settings),

    gym_done: entry?.gym_done ?? false,
    bjj_done: entry?.bjj_done ?? false,
    walk_done: entry?.walk_done ?? false,
    mobility_done: entry?.mobility_done ?? false,
    stretching_done: entry?.stretching_done ?? false,
    creatine_done: entry?.creatine_done ?? false,

    protein_shakes: numberToString(entry?.protein_shakes ?? 0),
    hookah_sessions: numberToString(entry?.hookah_sessions ?? 0),
    notes: entry?.notes ?? '',
  };
}

function getIsoDay(date: string) {
  const jsDay = parseISO(date).getDay();
  return jsDay === 0 ? 7 : jsDay;
}

function parseNumber(raw: string) {
  if (!raw.trim()) return null;
  const n = Number(raw.replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

function parseIntOrZero(raw: string) {
  if (!raw.trim()) return 0;
  const n = Number(raw);
  return Number.isFinite(n) ? Math.trunc(n) : 0;
}

function buildChecklist(
  date: string,
  entry: LifeTrackerEntry | undefined,
  settings: LifeTrackerSettings,
): ChecklistResult {
  const fails: string[] = [];
  const wins: string[] = [];
  let possibleChecks = 0;

  const scheduledItems = getScheduleLabelsForDay(getIsoDay(date), settings);
  if (!entry) {
    return {
      possibleChecks: 1,
      fails: [
        `Нет записи за ${formatLongDate(date)}.`,
        ...(scheduledItems.length
          ? [`По шаблону на этот день запланировано: ${scheduledItems.join(', ')}.`]
          : []),
      ],
      wins,
    };
  }

  possibleChecks++;
  if ((entry.sleep_hours ?? 0) < settings.sleep_goal_hours) {
    fails.push(`Сон ниже цели (${settings.sleep_goal_hours} ч).`);
  } else {
    wins.push('Сон в норме.');
  }

  possibleChecks++;
  if (settings.breakfast_required && !entry.breakfast_done) {
    fails.push('Не отмечен завтрак / первый прием пищи.');
  } else {
    wins.push('Питание стартовало нормально.');
  }

  possibleChecks++;
  if (entry.protein_g < settings.protein_goal_g) {
    fails.push(`Белок ниже цели (${settings.protein_goal_g} г).`);
  } else {
    wins.push('Белок добран.');
  }

  possibleChecks++;
  if ((entry.water_l ?? 0) < settings.water_goal_l) {
    fails.push(`Вода ниже цели (${settings.water_goal_l} л).`);
  } else {
    wins.push('Вода добрана.');
  }

  possibleChecks++;
  if (entry.steps < settings.steps_goal) {
    fails.push(`Шаги ниже цели (${settings.steps_goal}).`);
  } else {
    wins.push('Шаги выполнены.');
  }

  possibleChecks++;
  if (entry.focus_blocks < settings.focus_blocks_goal) {
    fails.push(`Фокус-блоков меньше цели (${settings.focus_blocks_goal}).`);
  } else {
    wins.push('Фокус-блоки выполнены.');
  }

  possibleChecks++;
  if (entry.deep_work_minutes < settings.deep_work_goal_minutes) {
    fails.push(`Глубокой работы меньше цели (${settings.deep_work_goal_minutes} мин).`);
  } else {
    wins.push('Глубокая работа набрана.');
  }

  possibleChecks++;
  if (entry.hookah_sessions > settings.hookah_limit_per_day) {
    fails.push(`Кальян выше лимита (${settings.hookah_limit_per_day}).`);
  } else {
    wins.push('Контроль никотина выдержан.');
  }

  if (entry.planned_training_type !== 'none') {
    possibleChecks++;
    const trainingFailMap: Record<Exclude<TrainingType, 'none'>, boolean> = {
      gym: !entry.gym_done,
      bjj: !entry.bjj_done,
      walk: !entry.walk_done,
      mobility: !entry.mobility_done,
      recovery: false,
    };

    if (trainingFailMap[entry.planned_training_type as Exclude<TrainingType, 'none'>]) {
      fails.push(`План дня не закрыт: ${trainingLabels[entry.planned_training_type]}.`);
    } else {
      wins.push(`План дня закрыт: ${trainingLabels[entry.planned_training_type]}.`);
    }
  }

  return { fails, wins, possibleChecks };
}

function getScheduleLabelsForDay(isoDay: number, settings: LifeTrackerSettings) {
  const labels: string[] = [];
  if (settings.gym_days.includes(isoDay)) labels.push('силовая');
  if (settings.bjj_days.includes(isoDay)) labels.push('BJJ');
  if (settings.walk_days.includes(isoDay)) labels.push('ходьба');
  if (settings.mobility_days.includes(isoDay)) labels.push('мобилити');
  return labels;
}

function getWeekRange(baseDate = new Date()) {
  const start = startOfWeek(baseDate, { weekStartsOn: 1 });
  const end = endOfWeek(baseDate, { weekStartsOn: 1 });
  return { start, end };
}

function buildCsv(entries: LifeTrackerEntry[]) {
  const header = [
    'date',
    'weight_kg',
    'waist_cm',
    'sleep_hours',
    'breakfast_done',
    'steps',
    'walk_km',
    'water_l',
    'protein_g',
    'calories_kcal',
    'resting_pulse',
    'systolic',
    'diastolic',
    'mood_score',
    'energy_score',
    'stress_score',
    'lower_back_pain_score',
    'focus_blocks',
    'deep_work_minutes',
    'planned_training_type',
    'gym_done',
    'bjj_done',
    'walk_done',
    'mobility_done',
    'stretching_done',
    'creatine_done',
    'protein_shakes',
    'hookah_sessions',
    'notes',
  ];

  const escape = (value: unknown) =>
    `"${String(value ?? '').replaceAll('"', '""').replace(/\n/g, ' ')}"`;

  const rows = entries.map((entry) => [
    entry.entry_date,
    entry.weight_kg ?? '',
    entry.waist_cm ?? '',
    entry.sleep_hours ?? '',
    entry.breakfast_done ? '1' : '0',
    entry.steps,
    entry.walk_km ?? '',
    entry.water_l ?? '',
    entry.protein_g,
    entry.calories_kcal ?? '',
    entry.resting_pulse ?? '',
    entry.systolic ?? '',
    entry.diastolic ?? '',
    entry.mood_score ?? '',
    entry.energy_score ?? '',
    entry.stress_score ?? '',
    entry.lower_back_pain_score ?? '',
    entry.focus_blocks,
    entry.deep_work_minutes,
    entry.planned_training_type,
    entry.gym_done ? '1' : '0',
    entry.bjj_done ? '1' : '0',
    entry.walk_done ? '1' : '0',
    entry.mobility_done ? '1' : '0',
    entry.stretching_done ? '1' : '0',
    entry.creatine_done ? '1' : '0',
    entry.protein_shakes,
    entry.hookah_sessions,
    entry.notes ?? '',
  ]);

  return [header, ...rows].map((row) => row.map(escape).join(';')).join('\n');
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className={`${glassSoft} p-4`}>
      <div className="text-xs uppercase tracking-[0.18em] text-gray-500">{label}</div>
      <div className="mt-2 text-2xl font-bold text-gray-900">{value}</div>
      <div className="mt-1 text-xs text-gray-500">{hint}</div>
    </div>
  );
}

function SectionTitle({
  title,
  hint,
}: {
  title: string;
  hint?: string;
}) {
  return (
    <div className="mb-4">
      <h2 className="text-lg font-bold text-gray-900">{title}</h2>
      {hint ? <p className="mt-1 text-sm text-gray-500">{hint}</p> : null}
    </div>
  );
}

function CheckboxField({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-center gap-3 rounded-2xl border border-black/10 bg-white px-3 py-2.5 text-sm text-gray-800">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-black/20"
      />
      <span>{label}</span>
    </label>
  );
}

function WeekdaySelector({
  title,
  value,
  onChange,
}: {
  title: string;
  value: number[];
  onChange: (next: number[]) => void;
}) {
  const toggle = (day: number) => {
    onChange(
      value.includes(day)
        ? value.filter((item) => item !== day)
        : [...value, day].sort((a, b) => a - b),
    );
  };

  return (
    <div className="space-y-2">
      <div className="text-sm font-semibold text-gray-900">{title}</div>
      <div className="flex flex-wrap gap-2">
        {weekdayOptions.map((day) => {
          const active = value.includes(day.value);
          return (
            <button
              key={day.value}
              type="button"
              onClick={() => toggle(day.value)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                active
                  ? 'bg-black text-white'
                  : 'border border-black/10 bg-white text-gray-700 hover:border-black/20'
              }`}
            >
              {day.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function LifeTrackerClient({ initialEntries, initialSettings }: Props) {
  const [entries, setEntries] = useState<LifeTrackerEntry[]>(ensureSorted(initialEntries));
  const [settings, setSettings] = useState<LifeTrackerSettings>(initialSettings);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());
  const [entryDraft, setEntryDraft] = useState<EntryDraft>(() =>
    entryToDraft(
      initialEntries.find((item) => item.entry_date === getTodayString()),
      getTodayString(),
      initialSettings,
    ),
  );
  const [settingsDraft, setSettingsDraft] = useState<SettingsDraft>(() => settingsToDraft(initialSettings));
  const [isSavingEntry, startSavingEntry] = useTransition();
  const [isSavingSettings, startSavingSettings] = useTransition();
  const [isDeleting, startDeleting] = useTransition();

  const entriesByDate = useMemo(() => new Map(entries.map((item) => [item.entry_date, item])), [entries]);

  useEffect(() => {
    setEntryDraft(entryToDraft(entriesByDate.get(selectedDate), selectedDate, settings));
  }, [selectedDate, entriesByDate, settings]);

  useEffect(() => {
    setSettingsDraft(settingsToDraft(settings));
  }, [settings]);

  const selectedEntry = entriesByDate.get(selectedDate);
  const latestEntry = entries.length ? entries[entries.length - 1] : undefined;
  const firstEntry = entries.length ? entries[0] : undefined;
  const checklist = useMemo(
    () => buildChecklist(selectedDate, selectedEntry, settings),
    [selectedDate, selectedEntry, settings],
  );

  const currentWeek = useMemo(() => getWeekRange(new Date()), []);
  const currentWeekEntries = useMemo(() => {
    return entries.filter((entry) =>
      isWithinInterval(parseISO(entry.entry_date), { start: currentWeek.start, end: currentWeek.end }),
    );
  }, [entries, currentWeek]);

  const currentWeekDays = useMemo(() => eachDayOfInterval(currentWeek), [currentWeek]);

  const weeklyCompletion = useMemo(() => {
    const summary = {
      gym: 0,
      bjj: 0,
      walk: 0,
      mobility: 0,
      loggedDays: currentWeekEntries.length,
      missingLogs: 0,
      avgSleep: 0,
      avgProtein: 0,
      avgSteps: 0,
      avgCompliance: 0,
    };

    let totalSleep = 0;
    let totalProtein = 0;
    let totalSteps = 0;
    let complianceTotal = 0;
    let complianceCount = 0;

    currentWeekEntries.forEach((entry) => {
      if (entry.gym_done) summary.gym += 1;
      if (entry.bjj_done) summary.bjj += 1;
      if (entry.walk_done) summary.walk += 1;
      if (entry.mobility_done || entry.stretching_done) summary.mobility += 1;

      totalSleep += entry.sleep_hours ?? 0;
      totalProtein += entry.protein_g ?? 0;
      totalSteps += entry.steps ?? 0;

      const dayChecklist = buildChecklist(entry.entry_date, entry, settings);
      if (dayChecklist.possibleChecks > 0) {
        const compliance =
          ((dayChecklist.possibleChecks - dayChecklist.fails.length) / dayChecklist.possibleChecks) * 100;
        complianceTotal += compliance;
        complianceCount += 1;
      }
    });

    currentWeekDays.forEach((day) => {
      const key = format(day, 'yyyy-MM-dd');
      if (day <= new Date() && !entriesByDate.has(key)) summary.missingLogs += 1;
    });

    const divisor = currentWeekEntries.length || 1;
    summary.avgSleep = totalSleep / divisor;
    summary.avgProtein = totalProtein / divisor;
    summary.avgSteps = totalSteps / divisor;
    summary.avgCompliance = complianceCount ? complianceTotal / complianceCount : 0;

    return summary;
  }, [currentWeekEntries, currentWeekDays, entriesByDate, settings]);

  const weekPlanCards = useMemo(() => {
    return currentWeekDays.map((day) => {
      const dateKey = format(day, 'yyyy-MM-dd');
      const isoDay = getIsoDay(dateKey);
      const entry = entriesByDate.get(dateKey);
      const labels = getScheduleLabelsForDay(isoDay, settings);

      return {
        dateKey,
        title: format(day, 'EEE d', { locale: ru }),
        labels,
        entry,
      };
    });
  }, [currentWeekDays, entriesByDate, settings]);

  const chartData = useMemo(() => {
    return entries
      .filter((entry) => entry.weight_kg !== null || entry.waist_cm !== null)
      .slice(-24)
      .map((entry) => ({
        date: formatShortDate(entry.entry_date),
        weight: entry.weight_kg,
        waist: entry.waist_cm,
      }));
  }, [entries]);

  const weeklyChartData = useMemo(() => {
    return Array.from({ length: 8 }).map((_, index) => {
      const weekOffset = 7 - index;
      const { start, end } = getWeekRange(subWeeks(new Date(), weekOffset));
      const weekEntries = entries.filter((entry) =>
        isWithinInterval(parseISO(entry.entry_date), { start, end }),
      );

      let complianceTotal = 0;
      let count = 0;

      weekEntries.forEach((entry) => {
        const result = buildChecklist(entry.entry_date, entry, settings);
        if (result.possibleChecks > 0) {
          complianceTotal += ((result.possibleChecks - result.fails.length) / result.possibleChecks) * 100;
          count += 1;
        }
      });

      return {
        week: format(start, 'dd.MM', { locale: ru }),
        compliance: count ? Math.round(complianceTotal / count) : 0,
        logs: weekEntries.length,
      };
    });
  }, [entries, settings]);

  const currentWeightDelta = useMemo(() => {
    if (!latestEntry?.weight_kg || !firstEntry?.weight_kg) return null;
    return latestEntry.weight_kg - firstEntry.weight_kg;
  }, [latestEntry, firstEntry]);

  const currentWaistDelta = useMemo(() => {
    if (!latestEntry?.waist_cm || !firstEntry?.waist_cm) return null;
    return latestEntry.waist_cm - firstEntry.waist_cm;
  }, [latestEntry, firstEntry]);

  const plannedWeekTargets = useMemo(() => {
    return {
      gym: settings.weekly_gym_goal,
      bjj: settings.weekly_bjj_goal,
      walk: settings.weekly_walk_goal,
      mobility: settings.weekly_mobility_goal,
    };
  }, [settings]);

  const handleEntryField = (field: keyof EntryDraft, value: string | boolean) => {
    setEntryDraft((prev) => ({ ...prev, [field]: value }));
  };

  const handleSettingsField = (field: keyof SettingsDraft, value: string | boolean | number[]) => {
    setSettingsDraft((prev) => ({ ...prev, [field]: value as never }));
  };

  const handleSelectDate = (date: string) => {
    setSelectedDate(date);
  };

  const saveEntry = () => {
    startSavingEntry(async () => {
      const fd = new FormData();

      Object.entries(entryDraft).forEach(([key, value]) => {
        if (typeof value === 'boolean') {
          fd.append(key, value ? 'true' : 'false');
        } else {
          fd.append(key, value);
        }
      });

      const result = await saveLifeTrackerEntry(fd);

      if (!result.ok || !result.entry) {
        toast.error(result.message || 'Не удалось сохранить запись.');
        return;
      }

      setEntries((prev) => upsertEntry(prev, result.entry));
      toast.success(result.message);
    });
  };

  const removeEntry = () => {
    if (!selectedEntry) {
      toast.error('За выбранную дату записи нет.');
      return;
    }

    const confirmed = window.confirm(`Удалить запись за ${formatLongDate(selectedDate)}?`);
    if (!confirmed) return;

    startDeleting(async () => {
      const fd = new FormData();
      fd.append('entry_date', selectedDate);

      const result = await deleteLifeTrackerEntry(fd);

      if (!result.ok) {
        toast.error(result.message || 'Не удалось удалить запись.');
        return;
      }

      setEntries((prev) => prev.filter((item) => item.entry_date !== selectedDate));
      toast.success(result.message);
    });
  };

  const saveSettings = () => {
    startSavingSettings(async () => {
      const fd = new FormData();

      fd.append('sleep_goal_hours', settingsDraft.sleep_goal_hours);
      fd.append('protein_goal_g', settingsDraft.protein_goal_g);
      fd.append('steps_goal', settingsDraft.steps_goal);
      fd.append('walk_goal_km', settingsDraft.walk_goal_km);
      fd.append('water_goal_l', settingsDraft.water_goal_l);
      fd.append('focus_blocks_goal', settingsDraft.focus_blocks_goal);
      fd.append('deep_work_goal_minutes', settingsDraft.deep_work_goal_minutes);
      fd.append('hookah_limit_per_day', settingsDraft.hookah_limit_per_day);
      fd.append('breakfast_required', settingsDraft.breakfast_required ? 'true' : 'false');
      fd.append('weekly_gym_goal', settingsDraft.weekly_gym_goal);
      fd.append('weekly_bjj_goal', settingsDraft.weekly_bjj_goal);
      fd.append('weekly_walk_goal', settingsDraft.weekly_walk_goal);
      fd.append('weekly_mobility_goal', settingsDraft.weekly_mobility_goal);
      fd.append('weight_goal_kg', settingsDraft.weight_goal_kg);
      fd.append('waist_goal_cm', settingsDraft.waist_goal_cm);

      settingsDraft.gym_days.forEach((day) => fd.append('gym_days', String(day)));
      settingsDraft.bjj_days.forEach((day) => fd.append('bjj_days', String(day)));
      settingsDraft.walk_days.forEach((day) => fd.append('walk_days', String(day)));
      settingsDraft.mobility_days.forEach((day) => fd.append('mobility_days', String(day)));

      const result = await saveLifeTrackerSettings(fd);

      if (!result.ok || !result.settings) {
        toast.error(result.message || 'Не удалось сохранить цели.');
        return;
      }

      setSettings(result.settings);
      toast.success(result.message);
    });
  };

  const exportCsv = () => {
    const csv = buildCsv(entries);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `life-tracker-${getTodayString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const summaryChips = [
    selectedEntry?.creatine_done ? 'Креатин отмечен' : null,
    selectedEntry?.stretching_done ? 'Растяжка отмечена' : null,
    selectedEntry?.walk_done ? 'Ходьба закрыта' : null,
    selectedEntry?.gym_done ? 'Силовая закрыта' : null,
    selectedEntry?.bjj_done ? 'BJJ закрыт' : null,
  ].filter(Boolean) as string[];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:px-6">
      <Toaster position="top-right" />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${glass} p-6`}
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.26em] text-gray-500">private admin space</div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
              🧠 Life Tracker - система восстановления и дисциплины
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-gray-600">
              Один закрытый экран, где ты ведешь тело, сон, работу, тренировки, никотин и
              восстановление. Смысл страницы - не “идеально заполнять форму”, а видеть, где система
              реально держится, а где начинает сыпаться.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => handleSelectDate(getTodayString())}
              className="rounded-full bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-black/90"
            >
              Сегодня
            </button>
            <button
              type="button"
              onClick={exportCsv}
              className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-gray-800 transition hover:border-black/20"
            >
              Скачать CSV
            </button>
          </div>
        </div>
      </motion.div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Последний вес"
          value={latestEntry?.weight_kg ? `${latestEntry.weight_kg} кг` : 'нет данных'}
          hint={
            currentWeightDelta === null
              ? 'появится после второй записи'
              : `изменение от старта: ${currentWeightDelta > 0 ? '+' : ''}${currentWeightDelta.toFixed(1)} кг`
          }
        />
        <StatCard
          label="Последняя талия"
          value={latestEntry?.waist_cm ? `${latestEntry.waist_cm} см` : 'нет данных'}
          hint={
            currentWaistDelta === null
              ? 'появится после второй записи'
              : `изменение от старта: ${currentWaistDelta > 0 ? '+' : ''}${currentWaistDelta.toFixed(1)} см`
          }
        />
        <StatCard
          label="Дисциплина недели"
          value={`${Math.round(weeklyCompletion.avgCompliance)}%`}
          hint={`пропущенных логов на неделе: ${weeklyCompletion.missingLogs}`}
        />
        <StatCard
          label="Логов за неделю"
          value={String(weeklyCompletion.loggedDays)}
          hint="цель - лог каждый день, даже если день был слабый"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <section className={`${glass} p-5`}>
          <SectionTitle
            title="Запись за день"
            hint="Выбирай дату, фиксируй цифры, а ниже сразу смотри, что провалено."
          />

          <div className="mb-5 flex flex-col gap-3 rounded-3xl border border-black/5 bg-black/[0.02] p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-sm text-gray-500">Текущая дата записи</div>
              <div className="mt-1 text-lg font-semibold text-gray-900">{formatLongDate(selectedDate)}</div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => handleSelectDate(e.target.value)}
                className={inputBase}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={saveEntry}
                  disabled={isSavingEntry}
                  className="rounded-full bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-black/90 disabled:opacity-60"
                >
                  {isSavingEntry ? 'Сохраняю...' : 'Сохранить день'}
                </button>
                <button
                  type="button"
                  onClick={removeEntry}
                  disabled={isDeleting}
                  className="rounded-full border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
                >
                  {isDeleting ? 'Удаляю...' : 'Удалить'}
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div className="space-y-4">
              <div className={glassSoft + ' p-4'}>
                <div className={cardTitle}>Тело и восстановление</div>
                <div className={cardHint}>Вес, талия, сон, вода, давление, пульс.</div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <label className="space-y-1 text-sm">
                    <span className="text-gray-600">Вес, кг</span>
                    <input
                      className={inputBase}
                      value={entryDraft.weight_kg}
                      onChange={(e) => handleEntryField('weight_kg', e.target.value)}
                    />
                  </label>
                  <label className="space-y-1 text-sm">
                    <span className="text-gray-600">Талия, см</span>
                    <input
                      className={inputBase}
                      value={entryDraft.waist_cm}
                      onChange={(e) => handleEntryField('waist_cm', e.target.value)}
                    />
                  </label>
                  <label className="space-y-1 text-sm">
                    <span className="text-gray-600">Сон, часы</span>
                    <input
                      className={inputBase}
                      value={entryDraft.sleep_hours}
                      onChange={(e) => handleEntryField('sleep_hours', e.target.value)}
                    />
                  </label>
                  <label className="space-y-1 text-sm">
                    <span className="text-gray-600">Вода, л</span>
                    <input
                      className={inputBase}
                      value={entryDraft.water_l}
                      onChange={(e) => handleEntryField('water_l', e.target.value)}
                    />
                  </label>
                  <label className="space-y-1 text-sm">
                    <span className="text-gray-600">Пульс в покое</span>
                    <input
                      className={inputBase}
                      value={entryDraft.resting_pulse}
                      onChange={(e) => handleEntryField('resting_pulse', e.target.value)}
                    />
                  </label>
                  <label className="space-y-1 text-sm">
                    <span className="text-gray-600">Шаги</span>
                    <input
                      className={inputBase}
                      value={entryDraft.steps}
                      onChange={(e) => handleEntryField('steps', e.target.value)}
                    />
                  </label>
                  <label className="space-y-1 text-sm">
                    <span className="text-gray-600">Давление верхнее</span>
                    <input
                      className={inputBase}
                      value={entryDraft.systolic}
                      onChange={(e) => handleEntryField('systolic', e.target.value)}
                    />
                  </label>
                  <label className="space-y-1 text-sm">
                    <span className="text-gray-600">Давление нижнее</span>
                    <input
                      className={inputBase}
                      value={entryDraft.diastolic}
                      onChange={(e) => handleEntryField('diastolic', e.target.value)}
                    />
                  </label>
                </div>

                <div className="mt-4">
                  <CheckboxField
                    checked={entryDraft.breakfast_done}
                    onChange={(next) => handleEntryField('breakfast_done', next)}
                    label="Первый нормальный прием пищи был"
                  />
                </div>
              </div>

              <div className={glassSoft + ' p-4'}>
                <div className={cardTitle}>Питание и привычки</div>
                <div className={cardHint}>Белок, калории, шейки, кальян.</div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <label className="space-y-1 text-sm">
                    <span className="text-gray-600">Белок, г</span>
                    <input
                      className={inputBase}
                      value={entryDraft.protein_g}
                      onChange={(e) => handleEntryField('protein_g', e.target.value)}
                    />
                  </label>
                  <label className="space-y-1 text-sm">
                    <span className="text-gray-600">Калории, ккал</span>
                    <input
                      className={inputBase}
                      value={entryDraft.calories_kcal}
                      onChange={(e) => handleEntryField('calories_kcal', e.target.value)}
                    />
                  </label>
                  <label className="space-y-1 text-sm">
                    <span className="text-gray-600">Ходьба, км</span>
                    <input
                      className={inputBase}
                      value={entryDraft.walk_km}
                      onChange={(e) => handleEntryField('walk_km', e.target.value)}
                    />
                  </label>
                  <label className="space-y-1 text-sm">
                    <span className="text-gray-600">Протеиновых порций</span>
                    <input
                      className={inputBase}
                      value={entryDraft.protein_shakes}
                      onChange={(e) => handleEntryField('protein_shakes', e.target.value)}
                    />
                  </label>
                  <label className="space-y-1 text-sm col-span-2">
                    <span className="text-gray-600">Сессий кальяна</span>
                    <input
                      className={inputBase}
                      value={entryDraft.hookah_sessions}
                      onChange={(e) => handleEntryField('hookah_sessions', e.target.value)}
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className={glassSoft + ' p-4'}>
                <div className={cardTitle}>Работа, нервная система, самочувствие</div>
                <div className={cardHint}>Фокус, глубокая работа, энергия, стресс, поясница.</div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <label className="space-y-1 text-sm">
                    <span className="text-gray-600">Фокус-блоки</span>
                    <input
                      className={inputBase}
                      value={entryDraft.focus_blocks}
                      onChange={(e) => handleEntryField('focus_blocks', e.target.value)}
                    />
                  </label>
                  <label className="space-y-1 text-sm">
                    <span className="text-gray-600">Глубокая работа, мин</span>
                    <input
                      className={inputBase}
                      value={entryDraft.deep_work_minutes}
                      onChange={(e) => handleEntryField('deep_work_minutes', e.target.value)}
                    />
                  </label>
                  <label className="space-y-1 text-sm">
                    <span className="text-gray-600">Настроение 1-10</span>
                    <input
                      className={inputBase}
                      value={entryDraft.mood_score}
                      onChange={(e) => handleEntryField('mood_score', e.target.value)}
                    />
                  </label>
                  <label className="space-y-1 text-sm">
                    <span className="text-gray-600">Энергия 1-10</span>
                    <input
                      className={inputBase}
                      value={entryDraft.energy_score}
                      onChange={(e) => handleEntryField('energy_score', e.target.value)}
                    />
                  </label>
                  <label className="space-y-1 text-sm">
                    <span className="text-gray-600">Стресс 1-10</span>
                    <input
                      className={inputBase}
                      value={entryDraft.stress_score}
                      onChange={(e) => handleEntryField('stress_score', e.target.value)}
                    />
                  </label>
                  <label className="space-y-1 text-sm">
                    <span className="text-gray-600">Поясница 0-10</span>
                    <input
                      className={inputBase}
                      value={entryDraft.lower_back_pain_score}
                      onChange={(e) => handleEntryField('lower_back_pain_score', e.target.value)}
                    />
                  </label>
                </div>
              </div>

              <div className={glassSoft + ' p-4'}>
                <div className={cardTitle}>Тренировка и выполнение плана</div>
                <div className={cardHint}>На каждый день есть основной фокус, но ты можешь его менять вручную.</div>

                <div className="mt-4 grid grid-cols-1 gap-3">
                  <label className="space-y-1 text-sm">
                    <span className="text-gray-600">План дня</span>
                    <select
                      className={inputBase}
                      value={entryDraft.planned_training_type}
                      onChange={(e) =>
                        handleEntryField('planned_training_type', e.target.value as TrainingType)
                      }
                    >
                      {trainingOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <CheckboxField
                      checked={entryDraft.gym_done}
                      onChange={(next) => handleEntryField('gym_done', next)}
                      label="Силовая сделана"
                    />
                    <CheckboxField
                      checked={entryDraft.bjj_done}
                      onChange={(next) => handleEntryField('bjj_done', next)}
                      label="BJJ сделан"
                    />
                    <CheckboxField
                      checked={entryDraft.walk_done}
                      onChange={(next) => handleEntryField('walk_done', next)}
                      label="Ходьба сделана"
                    />
                    <CheckboxField
                      checked={entryDraft.mobility_done}
                      onChange={(next) => handleEntryField('mobility_done', next)}
                      label="Мобилити сделана"
                    />
                    <CheckboxField
                      checked={entryDraft.stretching_done}
                      onChange={(next) => handleEntryField('stretching_done', next)}
                      label="Растяжка сделана"
                    />
                    <CheckboxField
                      checked={entryDraft.creatine_done}
                      onChange={(next) => handleEntryField('creatine_done', next)}
                      label="Креатин принят"
                    />
                  </div>
                </div>
              </div>

              <div className={glassSoft + ' p-4'}>
                <div className={cardTitle}>Комментарий дня</div>
                <div className={cardHint}>
                  Коротко пиши, что сработало, где сломался, что помешало, что повторить завтра.
                </div>
                <div className="mt-4">
                  <textarea
                    className={textareaBase}
                    value={entryDraft.notes}
                    onChange={(e) => handleEntryField('notes', e.target.value)}
                    placeholder="Например: днем потренировался нормально, вечером просел по работе и кальяну..."
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <section className={`${glass} p-5`}>
            <SectionTitle
              title="Что не выполнено"
              hint="Это главный блок. Пустой список здесь важнее любой красивой статистики."
            />

            {checklist.fails.length ? (
              <div className="space-y-3">
                {checklist.fails.map((item) => (
                  <div key={item} className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {item}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                На текущую дату явных провалов не найдено. Система держится.
              </div>
            )}

            {checklist.wins.length ? (
              <div className="mt-4">
                <div className="mb-2 text-xs uppercase tracking-[0.18em] text-gray-500">что закрыто</div>
                <div className="flex flex-wrap gap-2">
                  {checklist.wins.map((item) => (
                    <span key={item} className={chipBase}>
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {summaryChips.length ? (
              <div className="mt-4">
                <div className="mb-2 text-xs uppercase tracking-[0.18em] text-gray-500">быстрые маркеры</div>
                <div className="flex flex-wrap gap-2">
                  {summaryChips.map((item) => (
                    <span key={item} className={chipBase}>
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </section>

          <section className={`${glass} p-5`}>
            <SectionTitle
              title="Квоты недели"
              hint="Сравнение плана и факта без самообмана."
            />

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between rounded-2xl border border-black/10 bg-white px-4 py-3">
                <span>Силовые</span>
                <span className="font-semibold">
                  {weeklyCompletion.gym} / {plannedWeekTargets.gym}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-black/10 bg-white px-4 py-3">
                <span>BJJ</span>
                <span className="font-semibold">
                  {weeklyCompletion.bjj} / {plannedWeekTargets.bjj}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-black/10 bg-white px-4 py-3">
                <span>Ходьба</span>
                <span className="font-semibold">
                  {weeklyCompletion.walk} / {plannedWeekTargets.walk}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-black/10 bg-white px-4 py-3">
                <span>Мобилити / растяжка</span>
                <span className="font-semibold">
                  {weeklyCompletion.mobility} / {plannedWeekTargets.mobility}
                </span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl border border-black/10 bg-white p-3">
                <div className="text-gray-500">Средний сон</div>
                <div className="mt-1 font-semibold">{weeklyCompletion.avgSleep.toFixed(1)} ч</div>
              </div>
              <div className="rounded-2xl border border-black/10 bg-white p-3">
                <div className="text-gray-500">Средний белок</div>
                <div className="mt-1 font-semibold">{Math.round(weeklyCompletion.avgProtein)} г</div>
              </div>
              <div className="rounded-2xl border border-black/10 bg-white p-3">
                <div className="text-gray-500">Средние шаги</div>
                <div className="mt-1 font-semibold">{Math.round(weeklyCompletion.avgSteps)}</div>
              </div>
              <div className="rounded-2xl border border-black/10 bg-white p-3">
                <div className="text-gray-500">Пустых логов</div>
                <div className="mt-1 font-semibold">{weeklyCompletion.missingLogs}</div>
              </div>
            </div>
          </section>
        </aside>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className={`${glass} p-5`}>
          <SectionTitle
            title="Недельный шаблон"
            hint="Это каркас недели. По нему видно, когда ты должен идти в зал, на BJJ, на прогулку и мобилити."
          />

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-1">
            {weekPlanCards.map((day) => (
              <div
                key={day.dateKey}
                className={`rounded-2xl border px-4 py-3 ${
                  day.dateKey === selectedDate
                    ? 'border-black bg-black/[0.04]'
                    : 'border-black/10 bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{day.title}</div>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {day.labels.length ? (
                        day.labels.map((label) => (
                          <span key={label} className={chipBase}>
                            {label}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-400">без обязательного шаблона</span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSelectDate(day.dateKey)}
                    className="rounded-full border border-black/10 px-3 py-1 text-xs font-semibold text-gray-700 transition hover:border-black/20"
                  >
                    Открыть
                  </button>
                </div>

                {day.entry ? (
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    {day.entry.gym_done ? <span className={chipBase}>силовая ✓</span> : null}
                    {day.entry.bjj_done ? <span className={chipBase}>BJJ ✓</span> : null}
                    {day.entry.walk_done ? <span className={chipBase}>ходьба ✓</span> : null}
                    {day.entry.mobility_done ? <span className={chipBase}>мобилити ✓</span> : null}
                    {!day.entry.gym_done &&
                    !day.entry.bjj_done &&
                    !day.entry.walk_done &&
                    !day.entry.mobility_done ? (
                      <span className="text-xs text-gray-400">лог есть, но тренировка не закрыта</span>
                    ) : null}
                  </div>
                ) : (
                  <div className="mt-3 text-xs text-gray-400">Лога за день пока нет</div>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className={`${glass} p-5`}>
          <SectionTitle
            title="Графики"
            hint="Смотри не только вес, а связку вес + талия + дисциплина по неделям."
          />

          <div className="grid grid-cols-1 gap-6">
            <div className="rounded-3xl border border-black/10 bg-white p-4">
              <div className="mb-3 text-sm font-semibold text-gray-900">Вес и талия</div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line yAxisId="left" type="monotone" dataKey="weight" strokeWidth={2} dot />
                    <Line yAxisId="right" type="monotone" dataKey="waist" strokeWidth={2} dot />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-3xl border border-black/10 bg-white p-4">
              <div className="mb-3 text-sm font-semibold text-gray-900">Средняя дисциплина по неделям</div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="compliance" radius={[10, 10, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <section className={`${glass} p-5`}>
          <SectionTitle
            title="Цели и шаблон системы"
            hint="Это настройки, по которым считается твой чек-лист провалов и недельный план."
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span className="text-gray-600">Сон, цель</span>
              <input
                className={inputBase}
                value={settingsDraft.sleep_goal_hours}
                onChange={(e) => handleSettingsField('sleep_goal_hours', e.target.value)}
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-gray-600">Белок, цель</span>
              <input
                className={inputBase}
                value={settingsDraft.protein_goal_g}
                onChange={(e) => handleSettingsField('protein_goal_g', e.target.value)}
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-gray-600">Шаги, цель</span>
              <input
                className={inputBase}
                value={settingsDraft.steps_goal}
                onChange={(e) => handleSettingsField('steps_goal', e.target.value)}
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-gray-600">Ходьба, км</span>
              <input
                className={inputBase}
                value={settingsDraft.walk_goal_km}
                onChange={(e) => handleSettingsField('walk_goal_km', e.target.value)}
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-gray-600">Вода, л</span>
              <input
                className={inputBase}
                value={settingsDraft.water_goal_l}
                onChange={(e) => handleSettingsField('water_goal_l', e.target.value)}
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-gray-600">Фокус-блоки, цель</span>
              <input
                className={inputBase}
                value={settingsDraft.focus_blocks_goal}
                onChange={(e) => handleSettingsField('focus_blocks_goal', e.target.value)}
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-gray-600">Глубокая работа, мин</span>
              <input
                className={inputBase}
                value={settingsDraft.deep_work_goal_minutes}
                onChange={(e) => handleSettingsField('deep_work_goal_minutes', e.target.value)}
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-gray-600">Лимит кальяна в день</span>
              <input
                className={inputBase}
                value={settingsDraft.hookah_limit_per_day}
                onChange={(e) => handleSettingsField('hookah_limit_per_day', e.target.value)}
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-gray-600">Цель веса, кг</span>
              <input
                className={inputBase}
                value={settingsDraft.weight_goal_kg}
                onChange={(e) => handleSettingsField('weight_goal_kg', e.target.value)}
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-gray-600">Цель талии, см</span>
              <input
                className={inputBase}
                value={settingsDraft.waist_goal_cm}
                onChange={(e) => handleSettingsField('waist_goal_cm', e.target.value)}
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-gray-600">Силовых в неделю</span>
              <input
                className={inputBase}
                value={settingsDraft.weekly_gym_goal}
                onChange={(e) => handleSettingsField('weekly_gym_goal', e.target.value)}
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-gray-600">BJJ в неделю</span>
              <input
                className={inputBase}
                value={settingsDraft.weekly_bjj_goal}
                onChange={(e) => handleSettingsField('weekly_bjj_goal', e.target.value)}
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-gray-600">Прогулок в неделю</span>
              <input
                className={inputBase}
                value={settingsDraft.weekly_walk_goal}
                onChange={(e) => handleSettingsField('weekly_walk_goal', e.target.value)}
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-gray-600">Мобилити в неделю</span>
              <input
                className={inputBase}
                value={settingsDraft.weekly_mobility_goal}
                onChange={(e) => handleSettingsField('weekly_mobility_goal', e.target.value)}
              />
            </label>
          </div>

          <div className="mt-4">
            <CheckboxField
              checked={settingsDraft.breakfast_required}
              onChange={(next) => handleSettingsField('breakfast_required', next)}
              label="Считать завтрак обязательным пунктом дисциплины"
            />
          </div>

          <div className="mt-5 grid grid-cols-1 gap-5">
            <WeekdaySelector
              title="Дни силовых"
              value={settingsDraft.gym_days}
              onChange={(next) => handleSettingsField('gym_days', next)}
            />
            <WeekdaySelector
              title="Дни BJJ"
              value={settingsDraft.bjj_days}
              onChange={(next) => handleSettingsField('bjj_days', next)}
            />
            <WeekdaySelector
              title="Дни ходьбы"
              value={settingsDraft.walk_days}
              onChange={(next) => handleSettingsField('walk_days', next)}
            />
            <WeekdaySelector
              title="Дни мобилити / растяжки"
              value={settingsDraft.mobility_days}
              onChange={(next) => handleSettingsField('mobility_days', next)}
            />
          </div>

          <div className="mt-5">
            <button
              type="button"
              onClick={saveSettings}
              disabled={isSavingSettings}
              className="rounded-full bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-black/90 disabled:opacity-60"
            >
              {isSavingSettings ? 'Сохраняю...' : 'Сохранить цели и шаблон'}
            </button>
          </div>
        </section>

        <section className={`${glass} p-5`}>
          <SectionTitle
            title="Таблица всех дней"
            hint="Отсюда удобно прыгать в любой день, смотреть провалы, заметки и динамику."
          />

          <div className="overflow-x-auto rounded-3xl border border-black/10 bg-white">
            <table className="min-w-full text-sm">
              <thead className="border-b border-black/10 bg-black/[0.03] text-left text-gray-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Дата</th>
                  <th className="px-4 py-3 font-medium">Вес</th>
                  <th className="px-4 py-3 font-medium">Талия</th>
                  <th className="px-4 py-3 font-medium">Сон</th>
                  <th className="px-4 py-3 font-medium">Шаги</th>
                  <th className="px-4 py-3 font-medium">Белок</th>
                  <th className="px-4 py-3 font-medium">План</th>
                  <th className="px-4 py-3 font-medium">Провалы</th>
                  <th className="px-4 py-3 font-medium">Заметка</th>
                </tr>
              </thead>
              <tbody>
                {entries
                  .slice()
                  .reverse()
                  .map((entry) => {
                    const rowChecklist = buildChecklist(entry.entry_date, entry, settings);
                    return (
                      <tr
                        key={entry.id}
                        className={`border-b border-black/5 text-gray-800 transition hover:bg-black/[0.02] ${
                          selectedDate === entry.entry_date ? 'bg-black/[0.03]' : ''
                        }`}
                      >
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => handleSelectDate(entry.entry_date)}
                            className="font-semibold text-left hover:underline"
                          >
                            {format(parseISO(entry.entry_date), 'dd.MM.yyyy', { locale: ru })}
                          </button>
                        </td>
                        <td className="px-4 py-3">{entry.weight_kg ?? '-'}</td>
                        <td className="px-4 py-3">{entry.waist_cm ?? '-'}</td>
                        <td className="px-4 py-3">{entry.sleep_hours ?? '-'}</td>
                        <td className="px-4 py-3">{entry.steps}</td>
                        <td className="px-4 py-3">{entry.protein_g}</td>
                        <td className="px-4 py-3">{trainingLabels[entry.planned_training_type]}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                              rowChecklist.fails.length
                                ? 'bg-red-50 text-red-700'
                                : 'bg-emerald-50 text-emerald-700'
                            }`}
                          >
                            {rowChecklist.fails.length ? rowChecklist.fails.length : '0'}
                          </span>
                        </td>
                        <td className="max-w-[280px] truncate px-4 py-3 text-gray-500">
                          {entry.notes || '-'}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}