import { ShortcutGroup } from '../types';

export type GroupColor = ShortcutGroup['color'];

export interface GroupColorTheme {
  text: string;
  iconBg: string;
  iconText: string;
  activeTab: string;
  inactiveTabIcon: string;
  openBtn: string;
  cardHoverBorder: string;
  sectionGlow: string;
  solidGradient: string;
}

const GROUP_COLOR_THEMES: Record<GroupColor, GroupColorTheme> = {
  indigo: {
    text: 'text-indigo-600 dark:text-indigo-300',
    iconBg:
      'bg-gradient-to-br from-indigo-100 via-violet-50 to-purple-100 dark:from-indigo-900/65 dark:via-violet-900/45 dark:to-purple-900/55 border-indigo-200/80 dark:border-indigo-700/60',
    iconText: 'text-indigo-600 dark:text-indigo-300',
    activeTab:
      'bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 text-white shadow-[0_6px_16px_rgba(99,102,241,0.34)]',
    inactiveTabIcon: 'text-indigo-500 dark:text-indigo-400',
    openBtn:
      'bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-950/60 dark:to-violet-950/50 hover:from-indigo-100 hover:to-violet-100 dark:hover:from-indigo-900/70 dark:hover:to-violet-900/60 text-indigo-700 dark:text-indigo-300',
    cardHoverBorder: 'hover:border-indigo-300/90 dark:hover:border-indigo-600/70',
    sectionGlow:
      'bg-gradient-to-r from-indigo-50/70 via-violet-50/30 to-transparent dark:from-indigo-950/30 dark:via-violet-950/15 dark:to-transparent',
    solidGradient: 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white',
  },
  blue: {
    text: 'text-blue-600 dark:text-sky-300',
    iconBg:
      'bg-gradient-to-br from-blue-100 via-sky-50 to-cyan-100 dark:from-blue-900/65 dark:via-sky-900/45 dark:to-cyan-900/50 border-blue-200/80 dark:border-blue-700/60',
    iconText: 'text-blue-600 dark:text-sky-300',
    activeTab:
      'bg-gradient-to-r from-blue-500 via-sky-500 to-cyan-500 text-white shadow-[0_6px_16px_rgba(59,130,246,0.34)]',
    inactiveTabIcon: 'text-blue-500 dark:text-sky-400',
    openBtn:
      'bg-gradient-to-r from-blue-50 to-sky-50 dark:from-blue-950/60 dark:to-sky-950/50 hover:from-blue-100 hover:to-sky-100 dark:hover:from-blue-900/70 dark:hover:to-sky-900/60 text-blue-700 dark:text-sky-300',
    cardHoverBorder: 'hover:border-blue-300/90 dark:hover:border-sky-600/70',
    sectionGlow:
      'bg-gradient-to-r from-blue-50/75 via-sky-50/35 to-transparent dark:from-blue-950/30 dark:via-sky-950/15 dark:to-transparent',
    solidGradient: 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white',
  },
  emerald: {
    text: 'text-emerald-600 dark:text-emerald-300',
    iconBg:
      'bg-gradient-to-br from-emerald-100 via-teal-50 to-cyan-100 dark:from-emerald-900/65 dark:via-teal-900/45 dark:to-cyan-900/50 border-emerald-200/80 dark:border-emerald-700/60',
    iconText: 'text-emerald-600 dark:text-emerald-300',
    activeTab:
      'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white shadow-[0_6px_16px_rgba(16,185,129,0.34)]',
    inactiveTabIcon: 'text-emerald-500 dark:text-emerald-400',
    openBtn:
      'bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/60 dark:to-teal-950/50 hover:from-emerald-100 hover:to-teal-100 dark:hover:from-emerald-900/70 dark:hover:to-teal-900/60 text-emerald-700 dark:text-emerald-300',
    cardHoverBorder: 'hover:border-emerald-300/90 dark:hover:border-emerald-600/70',
    sectionGlow:
      'bg-gradient-to-r from-emerald-50/75 via-teal-50/35 to-transparent dark:from-emerald-950/30 dark:via-teal-950/15 dark:to-transparent',
    solidGradient: 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white',
  },
  amber: {
    text: 'text-amber-600 dark:text-amber-300',
    iconBg:
      'bg-gradient-to-br from-amber-100 via-orange-50 to-yellow-100 dark:from-amber-900/65 dark:via-orange-900/45 dark:to-yellow-900/50 border-amber-200/80 dark:border-amber-700/60',
    iconText: 'text-amber-600 dark:text-amber-300',
    activeTab:
      'bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white shadow-[0_6px_16px_rgba(245,158,11,0.34)]',
    inactiveTabIcon: 'text-amber-500 dark:text-amber-400',
    openBtn:
      'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/60 dark:to-orange-950/50 hover:from-amber-100 hover:to-orange-100 dark:hover:from-amber-900/70 dark:hover:to-orange-900/60 text-amber-700 dark:text-amber-300',
    cardHoverBorder: 'hover:border-amber-300/90 dark:hover:border-amber-600/70',
    sectionGlow:
      'bg-gradient-to-r from-amber-50/75 via-orange-50/35 to-transparent dark:from-amber-950/30 dark:via-orange-950/15 dark:to-transparent',
    solidGradient: 'bg-gradient-to-br from-amber-500 to-orange-500 text-white',
  },
  rose: {
    text: 'text-rose-600 dark:text-rose-300',
    iconBg:
      'bg-gradient-to-br from-rose-100 via-pink-50 to-fuchsia-100 dark:from-rose-900/65 dark:via-pink-900/45 dark:to-fuchsia-900/50 border-rose-200/80 dark:border-rose-700/60',
    iconText: 'text-rose-600 dark:text-rose-300',
    activeTab:
      'bg-gradient-to-r from-rose-500 via-pink-500 to-fuchsia-500 text-white shadow-[0_6px_16px_rgba(244,63,94,0.34)]',
    inactiveTabIcon: 'text-rose-500 dark:text-rose-400',
    openBtn:
      'bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-950/60 dark:to-pink-950/50 hover:from-rose-100 hover:to-pink-100 dark:hover:from-rose-900/70 dark:hover:to-pink-900/60 text-rose-700 dark:text-rose-300',
    cardHoverBorder: 'hover:border-rose-300/90 dark:hover:border-rose-600/70',
    sectionGlow:
      'bg-gradient-to-r from-rose-50/75 via-pink-50/35 to-transparent dark:from-rose-950/30 dark:via-pink-950/15 dark:to-transparent',
    solidGradient: 'bg-gradient-to-br from-rose-500 to-pink-600 text-white',
  },
  purple: {
    text: 'text-purple-600 dark:text-purple-300',
    iconBg:
      'bg-gradient-to-br from-purple-100 via-fuchsia-50 to-violet-100 dark:from-purple-900/65 dark:via-fuchsia-900/45 dark:to-violet-900/55 border-purple-200/80 dark:border-purple-700/60',
    iconText: 'text-purple-600 dark:text-purple-300',
    activeTab:
      'bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 text-white shadow-[0_6px_16px_rgba(168,85,247,0.34)]',
    inactiveTabIcon: 'text-purple-500 dark:text-purple-400',
    openBtn:
      'bg-gradient-to-r from-purple-50 to-fuchsia-50 dark:from-purple-950/60 dark:to-fuchsia-950/50 hover:from-purple-100 hover:to-fuchsia-100 dark:hover:from-purple-900/70 dark:hover:to-fuchsia-900/60 text-purple-700 dark:text-purple-300',
    cardHoverBorder: 'hover:border-purple-300/90 dark:hover:border-purple-600/70',
    sectionGlow:
      'bg-gradient-to-r from-purple-50/75 via-fuchsia-50/35 to-transparent dark:from-purple-950/30 dark:via-fuchsia-950/15 dark:to-transparent',
    solidGradient: 'bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white',
  },
  cyan: {
    text: 'text-cyan-600 dark:text-cyan-300',
    iconBg:
      'bg-gradient-to-br from-cyan-100 via-sky-50 to-teal-100 dark:from-cyan-900/65 dark:via-sky-900/45 dark:to-teal-900/50 border-cyan-200/80 dark:border-cyan-700/60',
    iconText: 'text-cyan-600 dark:text-cyan-300',
    activeTab:
      'bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-500 text-white shadow-[0_6px_16px_rgba(6,182,212,0.34)]',
    inactiveTabIcon: 'text-cyan-500 dark:text-cyan-400',
    openBtn:
      'bg-gradient-to-r from-cyan-50 to-sky-50 dark:from-cyan-950/60 dark:to-sky-950/50 hover:from-cyan-100 hover:to-sky-100 dark:hover:from-cyan-900/70 dark:hover:to-sky-900/60 text-cyan-700 dark:text-cyan-300',
    cardHoverBorder: 'hover:border-cyan-300/90 dark:hover:border-cyan-600/70',
    sectionGlow:
      'bg-gradient-to-r from-cyan-50/75 via-sky-50/35 to-transparent dark:from-cyan-950/30 dark:via-sky-950/15 dark:to-transparent',
    solidGradient: 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white',
  },
  slate: {
    text: 'text-slate-600 dark:text-slate-300',
    iconBg:
      'bg-gradient-to-br from-slate-100 via-indigo-50/70 to-sky-100/70 dark:from-slate-800/80 dark:via-indigo-950/50 dark:to-slate-900 border-slate-200/80 dark:border-slate-700/70',
    iconText: 'text-indigo-600 dark:text-indigo-300',
    activeTab:
      'bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500 text-white shadow-[0_6px_16px_rgba(99,102,241,0.3)]',
    inactiveTabIcon: 'text-slate-500 dark:text-slate-400',
    openBtn:
      'bg-gradient-to-r from-slate-100 to-indigo-50 dark:from-slate-800/80 dark:to-indigo-950/50 hover:from-indigo-50 hover:to-sky-50 dark:hover:from-indigo-900/60 dark:hover:to-sky-900/50 text-indigo-700 dark:text-indigo-300',
    cardHoverBorder: 'hover:border-indigo-300/80 dark:hover:border-indigo-600/60',
    sectionGlow:
      'bg-gradient-to-r from-slate-100/60 via-indigo-50/30 to-transparent dark:from-slate-800/30 dark:via-indigo-950/15 dark:to-transparent',
    solidGradient: 'bg-gradient-to-br from-slate-600 to-indigo-600 text-white',
  },
};

export function getGroupColorTheme(color?: GroupColor): GroupColorTheme {
  return GROUP_COLOR_THEMES[color || 'indigo'] || GROUP_COLOR_THEMES.indigo;
}
