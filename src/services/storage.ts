import { ShortcutGroup, ShortcutItem } from '../types';

const STORAGE_SHORTCUTS_KEY = 'onestop_hub_shortcuts_v1';
const STORAGE_GROUPS_KEY = 'onestop_hub_groups_v1';
const STORAGE_THEME_KEY = 'onestop_hub_theme_v1';
const STORAGE_VIEW_KEY = 'onestop_hub_view_v1';

export const DEFAULT_GROUPS: ShortcutGroup[] = [
  {
    id: 'group-work',
    name: 'Pekerjaan & Kantor',
    description: 'Aplikasi kolaborasi, email kerja, dan manajemen tugas tim',
    color: 'blue',
    icon: 'Briefcase',
    order: 1,
  },
  {
    id: 'group-drive',
    name: 'Direktori & Drive Lokal (D:, C:)',
    description: 'Pintasan cepat folder di Drive D:, C:, proyek lokal, dan berkas arsip',
    color: 'emerald',
    icon: 'HardDrive',
    order: 2,
  },
  {
    id: 'group-personal',
    name: 'Pribadi & Finansial',
    description: 'Layanan hiburan, e-banking, dan catatan harian pribadi',
    color: 'rose',
    icon: 'User',
    order: 3,
  },
  {
    id: 'group-dev',
    name: 'Utilitas & Alat Pengembang',
    description: 'Aplikasi konsol, localhost server, desain, dan repositori kode',
    color: 'purple',
    icon: 'Terminal',
    order: 4,
  },
];

export const DEFAULT_SHORTCUTS: ShortcutItem[] = [
  // 1. Direktori & Drive Lokal
  {
    id: 'sc-drive-d-projects',
    title: 'Drive D: Proyek Aktif 2026',
    url: 'D:\\Proyek_Utama\\2026',
    type: 'directory',
    groupId: 'group-drive',
    description: 'Folder utama tempat menyimpan source code dan laporan klien',
    iconType: 'drive',
    iconValue: 'HardDrive',
    color: 'emerald',
    isPinned: true,
    clickCount: 14,
    lastOpened: Date.now() - 1000 * 60 * 45,
    tags: ['Local', 'Drive D', 'Work'],
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 7,
  },
  {
    id: 'sc-drive-d-assets',
    title: 'Drive D: Aset Desain & Media',
    url: 'D:\\Aset_Desain_dan_Video',
    type: 'directory',
    groupId: 'group-drive',
    description: 'Koleksi file gambar, video render mentah, dan font grafis',
    iconType: 'drive',
    iconValue: 'FolderArchive',
    color: 'emerald',
    isPinned: true,
    clickCount: 9,
    lastOpened: Date.now() - 1000 * 60 * 120,
    tags: ['Media', 'Drive D'],
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 5,
  },
  {
    id: 'sc-drive-d-backup',
    title: 'Drive D: Cadangan Database',
    url: 'D:\\Database_Backup\\SQL',
    type: 'directory',
    groupId: 'group-drive',
    description: 'Penyimpanan arsip dump database mingguan dan snapshot',
    iconType: 'drive',
    iconValue: 'Database',
    color: 'emerald',
    isPinned: false,
    clickCount: 4,
    lastOpened: Date.now() - 1000 * 60 * 60 * 24,
    tags: ['Backup', 'SQL'],
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
  },
  {
    id: 'sc-drive-c-downloads',
    title: 'Drive C: Folder Unduhan',
    url: 'C:\\Users\\User\\Downloads',
    type: 'directory',
    groupId: 'group-drive',
    description: 'Direktori berkas unduhan browser lokal dan installer aplikasi',
    iconType: 'drive',
    iconValue: 'Download',
    color: 'emerald',
    isPinned: false,
    clickCount: 7,
    lastOpened: Date.now() - 1000 * 60 * 300,
    tags: ['Downloads', 'Drive C'],
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 10,
  },

  // 2. Pekerjaan & Kantor
  {
    id: 'sc-work-gmail',
    title: 'Gmail Perusahaan',
    url: 'https://mail.google.com',
    type: 'web',
    groupId: 'group-work',
    description: 'Akses inbox surat masuk, komunikasi klien, dan jadwal rapat',
    iconType: 'favicon',
    iconValue: 'https://mail.google.com',
    color: 'blue',
    isPinned: true,
    clickCount: 28,
    lastOpened: Date.now() - 1000 * 60 * 15,
    tags: ['Email', 'Komunikasi'],
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 14,
  },
  {
    id: 'sc-work-gdrive',
    title: 'Google Drive Dokumen',
    url: 'https://drive.google.com',
    type: 'web',
    groupId: 'group-work',
    description: 'Penyimpanan cloud bersama tim, spreadsheet, dan presentasi',
    iconType: 'favicon',
    iconValue: 'https://drive.google.com',
    color: 'blue',
    isPinned: true,
    clickCount: 22,
    lastOpened: Date.now() - 1000 * 60 * 60,
    tags: ['Docs', 'Cloud'],
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 14,
  },
  {
    id: 'sc-work-trello',
    title: 'Trello Board Kanban',
    url: 'https://trello.com',
    type: 'web',
    groupId: 'group-work',
    description: 'Pelacakan sprint pekerjaan, backlog, dan progres tiket tugas',
    iconType: 'favicon',
    iconValue: 'https://trello.com',
    color: 'blue',
    isPinned: false,
    clickCount: 11,
    lastOpened: Date.now() - 1000 * 60 * 180,
    tags: ['Task', 'Agile'],
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 12,
  },
  {
    id: 'sc-work-notion',
    title: 'Notion Workspace',
    url: 'https://notion.so',
    type: 'web',
    groupId: 'group-work',
    description: 'Knowledge base perusahaan, SOP, dan catatan meeting internal',
    iconType: 'favicon',
    iconValue: 'https://notion.so',
    color: 'blue',
    isPinned: false,
    clickCount: 16,
    lastOpened: Date.now() - 1000 * 60 * 240,
    tags: ['Notes', 'Wiki'],
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 9,
  },

  // 3. Pribadi & Finansial
  {
    id: 'sc-personal-bca',
    title: 'Internet Banking',
    url: 'https://klikbca.com',
    type: 'web',
    groupId: 'group-personal',
    description: 'Cek mutasi rekening pribadi, pembayaran tagihan, dan transfer',
    iconType: 'preset',
    iconValue: 'CreditCard',
    color: 'rose',
    isPinned: false,
    clickCount: 8,
    lastOpened: Date.now() - 1000 * 60 * 60 * 12,
    tags: ['Bank', 'Finance'],
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 15,
  },
  {
    id: 'sc-personal-youtube',
    title: 'YouTube Hiburan',
    url: 'https://youtube.com',
    type: 'web',
    groupId: 'group-personal',
    description: 'Tontonan video teknologi, musik produktivitas, dan podcast',
    iconType: 'favicon',
    iconValue: 'https://youtube.com',
    color: 'rose',
    isPinned: true,
    clickCount: 31,
    lastOpened: Date.now() - 1000 * 60 * 30,
    tags: ['Media', 'Hiburan'],
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 15,
  },

  // 4. Utilitas & Alat Pengembang
  {
    id: 'sc-dev-vscode-local',
    title: 'VS Code Direktori D:',
    url: 'vscode://file/D:/Proyek_Utama',
    type: 'protocol',
    groupId: 'group-dev',
    description: 'Buka langsung editor VS Code ke folder proyek Drive D:',
    iconType: 'preset',
    iconValue: 'Code',
    color: 'purple',
    isPinned: true,
    clickCount: 19,
    lastOpened: Date.now() - 1000 * 60 * 50,
    tags: ['IDE', 'Desktop App'],
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 6,
  },
  {
    id: 'sc-dev-github',
    title: 'GitHub Repositori',
    url: 'https://github.com',
    type: 'web',
    groupId: 'group-dev',
    description: 'Repositori source code, pull request review, dan issue tracker',
    iconType: 'favicon',
    iconValue: 'https://github.com',
    color: 'purple',
    isPinned: false,
    clickCount: 13,
    lastOpened: Date.now() - 1000 * 60 * 90,
    tags: ['Git', 'Repo'],
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 11,
  },
  {
    id: 'sc-dev-localhost',
    title: 'Localhost Web Dev (Port 3000)',
    url: 'http://localhost:3000',
    type: 'web',
    groupId: 'group-dev',
    description: 'Server pengembangan aplikasi web yang sedang aktif',
    iconType: 'preset',
    iconValue: 'Globe',
    color: 'purple',
    isPinned: false,
    clickCount: 6,
    lastOpened: Date.now() - 1000 * 60 * 180,
    tags: ['Server', 'Dev'],
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 4,
  },
];

export function getStoredShortcuts(): ShortcutItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_SHORTCUTS_KEY);
    if (!raw) {
      saveStoredShortcuts(DEFAULT_SHORTCUTS);
      return DEFAULT_SHORTCUTS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_SHORTCUTS;
  } catch {
    return DEFAULT_SHORTCUTS;
  }
}

export function saveStoredShortcuts(shortcuts: ShortcutItem[]): void {
  try {
    localStorage.setItem(STORAGE_SHORTCUTS_KEY, JSON.stringify(shortcuts));
  } catch (err) {
    console.error('Failed to save shortcuts to localStorage', err);
  }
}

export function getStoredGroups(): ShortcutGroup[] {
  try {
    const raw = localStorage.getItem(STORAGE_GROUPS_KEY);
    if (!raw) {
      saveStoredGroups(DEFAULT_GROUPS);
      return DEFAULT_GROUPS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_GROUPS;
  } catch {
    return DEFAULT_GROUPS;
  }
}

export function saveStoredGroups(groups: ShortcutGroup[]): void {
  try {
    localStorage.setItem(STORAGE_GROUPS_KEY, JSON.stringify(groups));
  } catch (err) {
    console.error('Failed to save groups to localStorage', err);
  }
}

export function exportBackupData(): string {
  const data = {
    app: 'OneStop Hub Engineering',
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    groups: getStoredGroups(),
    shortcuts: getStoredShortcuts(),
  };
  return JSON.stringify(data, null, 2);
}

export function importBackupData(jsonString: string): { success: boolean; message: string; count?: number } {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed || !Array.isArray(parsed.shortcuts) || !Array.isArray(parsed.groups)) {
      return { success: false, message: 'Format file JSON tidak valid. Pastikan file backup berisi data pintasan dan grup.' };
    }
    saveStoredGroups(parsed.groups);
    saveStoredShortcuts(parsed.shortcuts);
    return {
      success: true,
      message: `Berhasil memulihkan ${parsed.shortcuts.length} pintasan dalam ${parsed.groups.length} kategori grup.`,
      count: parsed.shortcuts.length,
    };
  } catch {
    return { success: false, message: 'Gagal mengurai file JSON. Pastikan format teks tidak rusak.' };
  }
}

export function resetAllData(): void {
  localStorage.removeItem(STORAGE_SHORTCUTS_KEY);
  localStorage.removeItem(STORAGE_GROUPS_KEY);
  saveStoredGroups(DEFAULT_GROUPS);
  saveStoredShortcuts(DEFAULT_SHORTCUTS);
}

export function getSystemTheme(): 'light' | 'dark' {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
}

export function hasUserSavedTheme(): boolean {
  try {
    const saved = localStorage.getItem(STORAGE_THEME_KEY);
    return saved === 'dark' || saved === 'light';
  } catch {
    return false;
  }
}

export function getStoredTheme(): 'light' | 'dark' {
  try {
    const saved = localStorage.getItem(STORAGE_THEME_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
    return getSystemTheme();
  } catch {
    return 'light';
  }
}

export function saveStoredTheme(theme: 'light' | 'dark'): void {
  try {
    localStorage.setItem(STORAGE_THEME_KEY, theme);
  } catch {
    // Ignore
  }
}

export function applyThemeWithTransition(theme: 'light' | 'dark'): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.add('theme-transitioning');
  root.classList.toggle('dark', theme === 'dark');
  setTimeout(() => {
    root.classList.remove('theme-transitioning');
  }, 400);
}

export function getStoredViewMode(): 'grid' | 'list' | 'sections' | 'orbit' {
  try {
    const saved = localStorage.getItem(STORAGE_VIEW_KEY) as 'grid' | 'list' | 'sections' | 'orbit';
    if (['grid', 'list', 'sections', 'orbit'].includes(saved)) return saved;
    return 'grid';
  } catch {
    return 'grid';
  }
}

export function saveStoredViewMode(view: 'grid' | 'list' | 'sections' | 'orbit'): void {
  try {
    localStorage.setItem(STORAGE_VIEW_KEY, view);
  } catch {
    // Ignore
  }
}

const STORAGE_CARD_DENSITY_KEY = 'onestop_hub_card_density_v1';

export function getStoredCardDensity(): 'small' | 'medium' | 'large' {
  try {
    const saved = localStorage.getItem(STORAGE_CARD_DENSITY_KEY) as 'small' | 'medium' | 'large';
    if (saved === 'small' || saved === 'medium' || saved === 'large') return saved;
    return 'medium';
  } catch {
    return 'medium';
  }
}

export function saveStoredCardDensity(density: 'small' | 'medium' | 'large'): void {
  try {
    localStorage.setItem(STORAGE_CARD_DENSITY_KEY, density);
  } catch {
    // Ignore
  }
}

// J.A.R.V.I.S. Startup Intro Storage
const STORAGE_JARVIS_INTRO_KEY = 'onestop_hub_jarvis_intro_v1';
const STORAGE_JARVIS_AUDIO_KEY = 'onestop_hub_jarvis_audio_v1';
const SESSION_JARVIS_PLAYED_KEY = 'onestop_hub_jarvis_session_played';

export function isJarvisIntroEnabled(): boolean {
  try {
    const saved = localStorage.getItem(STORAGE_JARVIS_INTRO_KEY);
    if (saved === null) return true; // Enabled by default!
    return saved === 'true';
  } catch {
    return true;
  }
}

export function setJarvisIntroEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_JARVIS_INTRO_KEY, String(enabled));
  } catch {
    // Ignore
  }
}

export function isJarvisAudioEnabled(): boolean {
  try {
    const saved = localStorage.getItem(STORAGE_JARVIS_AUDIO_KEY);
    if (saved === null) return true; // Sound on by default!
    return saved === 'true';
  } catch {
    return true;
  }
}

export function setJarvisAudioEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_JARVIS_AUDIO_KEY, String(enabled));
  } catch {
    // Ignore
  }
}

export function hasSeenJarvisIntroSession(): boolean {
  try {
    return sessionStorage.getItem(SESSION_JARVIS_PLAYED_KEY) === 'true';
  } catch {
    return false;
  }
}

export function markJarvisIntroSeenSession(): void {
  try {
    sessionStorage.setItem(SESSION_JARVIS_PLAYED_KEY, 'true');
  } catch {
    // Ignore
  }
}

// Custom Brand Logo Storage
const STORAGE_CUSTOM_LOGO_KEY = 'onestop_hub_custom_logo_v1';

export function getStoredCustomLogo(): import('../types').CustomLogoConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_CUSTOM_LOGO_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.src === 'string' && parsed.src.trim().length > 0) {
      return {
        src: parsed.src,
        fit: parsed.fit === 'contain' ? 'contain' : 'cover',
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function saveStoredCustomLogo(logo: import('../types').CustomLogoConfig | null): void {
  try {
    if (!logo || !logo.src.trim()) {
      localStorage.removeItem(STORAGE_CUSTOM_LOGO_KEY);
    } else {
      localStorage.setItem(STORAGE_CUSTOM_LOGO_KEY, JSON.stringify(logo));
    }
  } catch (err) {
    console.error('Failed to save custom logo to localStorage', err);
    throw new Error('Penyimpanan lokal penuh. Coba gunakan foto dengan ukuran lebih kecil.');
  }
}
