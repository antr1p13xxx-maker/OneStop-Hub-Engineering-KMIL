import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  LayoutGrid,
  List,
  FolderKanban,
  HardDrive,
  Globe,
  Cpu,
  Plus,
  Command,
  Filter,
  CheckCircle2,
  X,
  Info,
  ExternalLink,
  Copy,
  Shield,
  ShieldCheck,
  Eye,
  Lock,
  Sliders,
  Grid3X3,
  Orbit,
  CloudAlert,
} from 'lucide-react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { ShortcutItem, ShortcutGroup, ViewMode, FilterType, ShortcutType, UserRole, CardDensity, CustomLogoConfig } from './types';
import {
  DEFAULT_GROUPS,
  DEFAULT_SHORTCUTS,
  getStoredShortcuts,
  saveStoredShortcuts,
  getStoredGroups,
  saveStoredGroups,
  getStoredTheme,
  saveStoredTheme,
  applyThemeWithTransition,
  hasUserSavedTheme,
  getSystemTheme,
  getStoredViewMode,
  saveStoredViewMode,
  getStoredCardDensity,
  saveStoredCardDensity,
  isJarvisIntroEnabled,
  setJarvisIntroEnabled,
  isJarvisAudioEnabled,
  setJarvisAudioEnabled,
  hasSeenJarvisIntroSession,
  markJarvisIntroSeenSession,
  getStoredCustomLogo,
  saveStoredCustomLogo,
  resetAllData,
} from './services/storage';
import {
  getStoredRole,
  saveStoredRole,
  ROLE_CONFIGS,
  ROLE_PERMISSIONS,
} from './services/auth';
import {
  auth,
  signInWithGoogle,
  signOutFirebase,
  FIREBASE_UPGRADE_URL,
} from './firebase';
import {
  syncUserProfileAndWorkspace,
  bootstrapInitialWorkspaceData,
  subscribeToGroups,
  subscribeToShortcuts,
  subscribeToSettings,
  createShortcutInFirestore,
  updateShortcutInFirestore,
  recordShortcutLaunchInFirestore,
  toggleShortcutPinInFirestore,
  deleteShortcutFromFirestore,
  syncGroupsToFirestore,
  reassignShortcutsGroupInFirestore,
  savePreferencesToFirestore,
  saveCustomLogoToFirestore,
  replaceWorkspaceDataInFirestore,
  isQuotaExceededError,
  WorkspacePreferencesPayload,
} from './services/firestoreSync';
import { launchShortcut, copyToClipboard } from './utils/pathHelper';
import { Header } from './components/Header';
import { DirectoryInfoBanner } from './components/DirectoryInfoBanner';
import { QuickDock } from './components/QuickDock';
import { ShortcutCard } from './components/ShortcutCard';
import { ShortcutListItem } from './components/ShortcutListItem';
import { AddEditShortcutModal } from './components/AddEditShortcutModal';
import { ManageGroupsModal } from './components/ManageGroupsModal';
import { LocalDirectoryHelpModal } from './components/LocalDirectoryHelpModal';
import { BackupRestoreModal } from './components/BackupRestoreModal';
import { CommandPalette } from './components/CommandPalette';
import { RoleSwitchModal } from './components/RoleSwitchModal';
import { SettingsModal } from './components/SettingsModal';
import { JarvisIntro } from './components/JarvisIntro';
import { OrbitHubView } from './components/OrbitHubView';
import { DynamicIcon, isImageIcon } from './components/DynamicIcon';

export default function App() {
  // State
  const [shortcuts, setShortcuts] = useState<ShortcutItem[]>([]);
  const [groups, setGroups] = useState<ShortcutGroup[]>([]);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [previousViewMode, setPreviousViewMode] = useState<ViewMode>('grid');
  const [cardDensity, setCardDensity] = useState<CardDensity>('medium');
  const [currentRole, setCurrentRole] = useState<UserRole>('viewer');
  const [isRoleSwitchOpen, setIsRoleSwitchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsFocusSection, setSettingsFocusSection] = useState<'logo' | 'firebase' | null>(null);
  const [customLogo, setCustomLogo] = useState<CustomLogoConfig | null>(null);
  const [showJarvisIntro, setShowJarvisIntro] = useState<boolean>(false);
  const [isJarvisEnabled, setIsJarvisEnabled] = useState<boolean>(true);
  const [isJarvisAudio, setIsJarvisAudio] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<'clicks' | 'recent' | 'name'>('clicks');

  // Firebase Auth & Cloud Sync State
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState<boolean>(false);
  const [isSigningInGoogle, setIsSigningInGoogle] = useState<boolean>(false);
  const [cloudError, setCloudError] = useState<{ message: string; isQuota?: boolean } | null>(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingShortcut, setEditingShortcut] = useState<ShortcutItem | null>(null);
  const [addModalDefaultGroupId, setAddModalDefaultGroupId] = useState<string | undefined>();
  const [addModalDefaultType, setAddModalDefaultType] = useState<ShortcutType>('web');
  const [isManageGroupsOpen, setIsManageGroupsOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Toast notification
  const [toast, setToast] = useState<{ message: string; details?: string; isDirectory?: boolean } | null>(null);

  // Permissions based on current role
  const permissions = useMemo(() => ROLE_PERMISSIONS[currentRole], [currentRole]);

  // Initialize
  useEffect(() => {
    // Detect system theme or load saved user preference
    const initialTheme = getStoredTheme();
    setTheme(initialTheme);
    document.documentElement.classList.toggle('dark', initialTheme === 'dark');

    setShortcuts(getStoredShortcuts());
    setGroups(getStoredGroups());
    const storedView = getStoredViewMode();
    setViewMode(storedView);
    setPreviousViewMode(storedView);
    setCardDensity(getStoredCardDensity());
    setCurrentRole(getStoredRole());
    setCustomLogo(getStoredCustomLogo());

    // J.A.R.V.I.S. intro on first launch
    const introEnabled = isJarvisIntroEnabled();
    const audioEnabled = isJarvisAudioEnabled();
    setIsJarvisEnabled(introEnabled);
    setIsJarvisAudio(audioEnabled);

    if (introEnabled && !hasSeenJarvisIntroSession()) {
      setShowJarvisIntro(true);
      markJarvisIntroSeenSession();
    }

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setIsAuthReady(true);
      if (!user) {
        setCloudError(null);
      }
    });

    return () => unsubAuth();
  }, []);

  // Attach real-time Firestore listeners once Firebase Auth is ready & signed in
  useEffect(() => {
    if (!isAuthReady || !firebaseUser) return;

    let cancelled = false;
    let unsubGroups: (() => void) | undefined;
    let unsubShortcuts: (() => void) | undefined;
    let unsubSettings: (() => void) | undefined;

    const handleSyncErr = (err: unknown) => {
      if (cancelled) return;
      if (isQuotaExceededError(err)) {
        setCloudError({
          message:
            'Kuota harian gratis Firestore telah terlampaui (Quota exceeded). Kuota akan direset keesokan harinya.',
          isQuota: true,
        });
      } else {
        setCloudError({
          message: err instanceof Error ? err.message : 'Gagal menyinkronkan data dengan Firebase Firestore.',
        });
      }
    };

    const startSync = async () => {
      try {
        setCloudError(null);
        await syncUserProfileAndWorkspace(firebaseUser);
        const migrated = await bootstrapInitialWorkspaceData(
          firebaseUser.uid,
          getStoredGroups(),
          getStoredShortcuts(),
          {
            cardDensity: getStoredCardDensity(),
            viewMode: getStoredViewMode(),
            theme: getStoredTheme(),
            jarvisIntroEnabled: isJarvisIntroEnabled(),
            jarvisAudioEnabled: isJarvisAudioEnabled(),
            customLogo: getStoredCustomLogo(),
          }
        );

        if (cancelled) return;

        unsubGroups = subscribeToGroups(
          firebaseUser.uid,
          (cloudGroups) => {
            if (cancelled) return;
            setGroups(cloudGroups);
            saveStoredGroups(cloudGroups);
          },
          handleSyncErr
        );

        unsubShortcuts = subscribeToShortcuts(
          firebaseUser.uid,
          (cloudShortcuts) => {
            if (cancelled) return;
            setShortcuts(cloudShortcuts);
            saveStoredShortcuts(cloudShortcuts);
          },
          handleSyncErr
        );

        unsubSettings = subscribeToSettings(
          firebaseUser.uid,
          (cloudSettings) => {
            if (cancelled) return;
            setCardDensity(cloudSettings.cardDensity);
            saveStoredCardDensity(cloudSettings.cardDensity);

            setTheme(cloudSettings.theme);
            saveStoredTheme(cloudSettings.theme);
            applyThemeWithTransition(cloudSettings.theme);

            setIsJarvisEnabled(cloudSettings.jarvisIntroEnabled);
            setJarvisIntroEnabled(cloudSettings.jarvisIntroEnabled);

            setIsJarvisAudio(cloudSettings.jarvisAudioEnabled);
            setJarvisAudioEnabled(cloudSettings.jarvisAudioEnabled);

            setCustomLogo(cloudSettings.customLogo);
            saveStoredCustomLogo(cloudSettings.customLogo);

            setPreviousViewMode(cloudSettings.viewMode);
            saveStoredViewMode(cloudSettings.viewMode);
            setSelectedGroupFilter((currentFilter) => {
              if (currentFilter === 'all') {
                setViewMode(cloudSettings.viewMode);
              }
              return currentFilter;
            });
          },
          handleSyncErr
        );

        if (migrated) {
          setToast({
            message: 'Data Lokal Berhasil Diunggah ke Firebase Cloud ☁️',
            details: `Workspace Anda kini tersimpan aman di Firestore (${firebaseUser.email}).`,
          });
        }
      } catch (err) {
        handleSyncErr(err);
      }
    };

    void startSync();

    return () => {
      cancelled = true;
      unsubGroups?.();
      unsubShortcuts?.();
      unsubSettings?.();
    };
  }, [isAuthReady, firebaseUser]);

  // Sync dynamic favicon with custom logo photo
  useEffect(() => {
    if (typeof document === 'undefined') return;
    let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null;
    if (customLogo?.src) {
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = customLogo.src;
    } else if (link) {
      link.remove();
    }
  }, [customLogo?.src]);

  // Listen to OS system theme changes (prefers-color-scheme)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      // If user hasn't explicitly set a custom theme in localStorage, adapt dynamically!
      if (!hasUserSavedTheme()) {
        const newDetectedTheme = e.matches ? 'dark' : 'light';
        setTheme(newDetectedTheme);
        applyThemeWithTransition(newDetectedTheme);
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleSystemThemeChange);
      return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
    }
  }, []);

  // Helper to get current preferences snapshot and persist to Firestore
  const getCurrentPreferences = (
    overrides: Partial<WorkspacePreferencesPayload> = {}
  ): WorkspacePreferencesPayload => ({
    cardDensity: overrides.cardDensity ?? cardDensity,
    viewMode: overrides.viewMode ?? (selectedGroupFilter !== 'all' ? previousViewMode : viewMode),
    theme: overrides.theme ?? theme,
    jarvisIntroEnabled: overrides.jarvisIntroEnabled ?? isJarvisEnabled,
    jarvisAudioEnabled: overrides.jarvisAudioEnabled ?? isJarvisAudio,
    customLogo: overrides.customLogo !== undefined ? overrides.customLogo : customLogo,
  });

  const persistCloudPreferences = (overrides: Partial<WorkspacePreferencesPayload> = {}) => {
    if (!firebaseUser) return;
    void savePreferencesToFirestore(firebaseUser.uid, getCurrentPreferences(overrides)).catch((err) => {
      if (isQuotaExceededError(err)) {
        setCloudError({
          message: 'Kuota harian gratis Firestore terlampaui. Preferensi tetap tersimpan secara lokal.',
          isQuota: true,
        });
      }
    });
  };

  // Google Sign-In / Sign-Out & Manual Cloud Sync
  const handleSignInGoogle = async () => {
    setIsSigningInGoogle(true);
    setCloudError(null);
    try {
      const user = await signInWithGoogle();
      setToast({
        message: `Terhubung ke Google Firebase (${user.email})`,
        details: 'Sinkronisasi real-time Firestore kini aktif untuk seluruh pintasan dan pengaturan.',
      });
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code !== 'auth/popup-closed-by-user' && code !== 'auth/cancelled-popup-request') {
        setCloudError({
          message:
            err instanceof Error
              ? `Gagal masuk dengan Google: ${err.message}`
              : 'Gagal masuk dengan Google.',
        });
      }
    } finally {
      setIsSigningInGoogle(false);
    }
  };

  const handleSignOutGoogle = async () => {
    try {
      await signOutFirebase();
      setToast({
        message: 'Keluar dari Akun Google Firebase',
        details: 'Aplikasi beralih ke penyimpanan lokal browser.',
      });
    } catch (err) {
      setCloudError({
        message: err instanceof Error ? err.message : 'Gagal keluar dari akun Google.',
      });
    }
  };

  const handleSyncLocalToCloud = async () => {
    if (!firebaseUser) return;
    try {
      setCloudError(null);
      await replaceWorkspaceDataInFirestore(firebaseUser.uid, groups, shortcuts);
      await savePreferencesToFirestore(firebaseUser.uid, getCurrentPreferences());
      await saveCustomLogoToFirestore(firebaseUser.uid, customLogo, getCurrentPreferences());
      setToast({
        message: 'Sinkronisasi Paksa ke Firebase Berhasil ☁️',
        details: `${shortcuts.length} pintasan dan ${groups.length} grup telah diperbarui di Firestore.`,
      });
    } catch (err) {
      setCloudError({
        message: err instanceof Error ? err.message : 'Gagal mengunggah data lokal ke Firestore.',
        isQuota: isQuotaExceededError(err),
      });
    }
  };

  // Toggle theme with smooth visual transition
  const handleToggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    saveStoredTheme(nextTheme);
    applyThemeWithTransition(nextTheme);
    persistCloudPreferences({ theme: nextTheme });
    setToast({
      message: `Beralih ke ${nextTheme === 'dark' ? 'Mode Gelap 🌙' : 'Mode Terang ☀️'}`,
      details: 'Preferensi tema disimpan dengan transisi visual halus.',
    });
  };

  // Change user role
  const handleRoleChanged = (newRole: UserRole) => {
    setCurrentRole(newRole);
    saveStoredRole(newRole);
    setToast({
      message: `Peran berhasil diubah: ${ROLE_CONFIGS[newRole].name}`,
      details: ROLE_CONFIGS[newRole].description,
    });
  };

  // Change card density (small / medium / large)
  const handleDensityChange = (newDensity: CardDensity) => {
    setCardDensity(newDensity);
    saveStoredCardDensity(newDensity);
    persistCloudPreferences({ cardDensity: newDensity });
    setToast({
      message: `Densitas kartu: ${
        newDensity === 'small' ? 'Kompak (Small)' : newDensity === 'large' ? 'Leluasa (Large)' : 'Standar (Medium)'
      }`,
      details:
        newDensity === 'small'
          ? 'Tampilan kompak 5-6 kolom di layar lebar untuk menampung lebih banyak pintasan.'
          : newDensity === 'large'
          ? 'Tampilan leluasa 2-3 kolom dengan cuplikan deskripsi luas.'
          : 'Tampilan proporsional standar 3-4 kolom.',
    });
  };

  // J.A.R.V.I.S. Handlers
  const handleCompleteJarvisIntro = () => {
    setShowJarvisIntro(false);
  };

  const handleToggleJarvisEnabled = (enabled: boolean) => {
    setIsJarvisEnabled(enabled);
    setJarvisIntroEnabled(enabled);
    persistCloudPreferences({ jarvisIntroEnabled: enabled });
    setToast({
      message: enabled ? 'Animasi Pembuka J.A.R.V.I.S. Diaktifkan ⚡' : 'Animasi J.A.R.V.I.S. Dinonaktifkan',
      details: enabled ? 'Intro akan diputar saat membuka aplikasi.' : 'Aplikasi akan langsung membuka dasbor.',
    });
  };

  const handleToggleJarvisAudio = (enabled: boolean) => {
    setIsJarvisAudio(enabled);
    setJarvisAudioEnabled(enabled);
    persistCloudPreferences({ jarvisAudioEnabled: enabled });
    setToast({
      message: enabled ? 'Audio J.A.R.V.I.S. Diaktifkan 🔊' : 'Audio J.A.R.V.I.S. Dihilangkan 🔇',
    });
  };

  const handlePlayJarvisIntro = () => {
    setShowJarvisIntro(true);
  };

  // Custom Logo Handler
  const handleSaveCustomLogo = (logo: CustomLogoConfig | null) => {
    try {
      saveStoredCustomLogo(logo);
      setCustomLogo(logo);
      if (firebaseUser) {
        void saveCustomLogoToFirestore(firebaseUser.uid, logo, getCurrentPreferences({ customLogo: logo })).catch(
          (err) => {
            setCloudError({
              message: err instanceof Error ? err.message : 'Gagal menyimpan foto logo ke Firebase Firestore.',
              isQuota: isQuotaExceededError(err),
            });
          }
        );
      }
      setToast({
        message: logo ? 'Foto Logo OneStop Hub Engineering Diperbarui' : 'Logo Dikembalikan ke Ikon Bawaan',
        details: logo
          ? 'Logo baru kini tampil pada Header, tab browser, dan J.A.R.V.I.S. HUD.'
          : 'Ikon standar aplikasi telah dipulihkan.',
      });
    } catch (err) {
      setToast({
        message: 'Gagal Menyimpan Foto Logo',
        details: err instanceof Error ? err.message : 'Terjadi kesalahan saat menyimpan ke penyimpanan lokal.',
      });
    }
  };

  // Selecting a specific group automatically activates the circular Orbit Hub display
  const handleSelectGroupFilter = (groupId: string) => {
    setSelectedGroupFilter(groupId);
    if (groupId !== 'all') {
      if (viewMode !== 'orbit') {
        setPreviousViewMode(viewMode);
        setViewMode('orbit');
      }
    } else {
      // Returning to "Semua Grup" restores previous view unless user explicitly saved orbit
      const savedMode = getStoredViewMode();
      setViewMode(savedMode === 'orbit' ? 'orbit' : previousViewMode === 'orbit' ? 'grid' : previousViewMode);
    }
  };

  // Keyboard shortcut listener for Command Palette (Ctrl+K or /)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      } else if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Save shortcuts
  const updateShortcuts = (newShortcuts: ShortcutItem[]) => {
    setShortcuts(newShortcuts);
    saveStoredShortcuts(newShortcuts);
  };

  // Save groups
  const updateGroups = (newGroups: ShortcutGroup[]) => {
    const prevGroups = groups;
    setGroups(newGroups);
    saveStoredGroups(newGroups);
    if (firebaseUser) {
      void syncGroupsToFirestore(firebaseUser.uid, prevGroups, newGroups).catch((err) => {
        setCloudError({
          message: err instanceof Error ? err.message : 'Gagal menyinkronkan grup ke Firebase.',
          isQuota: isQuotaExceededError(err),
        });
      });
    }
  };

  // Launch shortcut
  const handleLaunch = async (shortcut: ShortcutItem) => {
    const nextClicks = shortcut.clickCount + 1;
    const openedAt = Date.now();
    // Increment click count & update lastOpened
    const updated = shortcuts.map((s) =>
      s.id === shortcut.id
        ? { ...s, clickCount: nextClicks, lastOpened: openedAt }
        : s
    );
    updateShortcuts(updated);

    if (firebaseUser) {
      void recordShortcutLaunchInFirestore(firebaseUser.uid, shortcut.id, nextClicks, openedAt).catch((err) => {
        if (isQuotaExceededError(err)) {
          setCloudError({
            message: 'Kuota harian gratis Firestore telah terlampaui.',
            isQuota: true,
          });
        }
      });
    }

    const result = await launchShortcut(shortcut.url, shortcut.type);

    if (result.actionTaken === 'copied_directory') {
      setToast({
        message: 'Path Direktori Disalin ke Clipboard!',
        details: `${shortcut.url} — Tekan Win + R lalu tempel untuk langsung membuka folder di Windows Explorer.`,
        isDirectory: true,
      });
    } else {
      setToast({
        message: `Membuka "${shortcut.title}"...`,
        details: shortcut.url,
        isDirectory: false,
      });
    }

    setTimeout(() => {
      setToast(null);
    }, 5000);
  };

  // Save shortcut (Add / Edit)
  const handleSaveShortcut = (
    data: Partial<ShortcutItem> & { title: string; url: string; groupId: string }
  ) => {
    if (data.id) {
      // Edit
      let editedItem: ShortcutItem | null = null;
      const updated = shortcuts.map((s) => {
        if (s.id !== data.id) return s;
        editedItem = {
          ...s,
          title: data.title,
          url: data.url,
          type: data.type || s.type,
          groupId: data.groupId,
          description: data.description,
          iconType: data.iconType || s.iconType,
          iconValue: data.iconValue || s.iconValue,
          isPinned: data.isPinned !== undefined ? data.isPinned : s.isPinned,
        };
        return editedItem;
      });
      updateShortcuts(updated);
      if (firebaseUser && editedItem) {
        void updateShortcutInFirestore(firebaseUser.uid, editedItem).catch((err) => {
          setCloudError({
            message: err instanceof Error ? err.message : 'Gagal memperbarui pintasan di Firebase.',
            isQuota: isQuotaExceededError(err),
          });
        });
      }
    } else {
      // Add
      const newShortcut: ShortcutItem = {
        id: `sc-${Date.now()}`,
        title: data.title,
        url: data.url,
        type: data.type || 'web',
        groupId: data.groupId,
        description: data.description,
        iconType: data.iconType || 'preset',
        iconValue: data.iconValue || 'Globe',
        isPinned: !!data.isPinned,
        clickCount: 0,
        createdAt: Date.now(),
      };
      updateShortcuts([newShortcut, ...shortcuts]);
      if (firebaseUser) {
        void createShortcutInFirestore(firebaseUser.uid, newShortcut).catch((err) => {
          setCloudError({
            message: err instanceof Error ? err.message : 'Gagal menambah pintasan ke Firebase.',
            isQuota: isQuotaExceededError(err),
          });
        });
      }
    }
  };

  // Delete shortcut
  const handleDeleteShortcut = (id: string) => {
    const updated = shortcuts.filter((s) => s.id !== id);
    updateShortcuts(updated);
    if (firebaseUser) {
      void deleteShortcutFromFirestore(firebaseUser.uid, id).catch((err) => {
        setCloudError({
          message: err instanceof Error ? err.message : 'Gagal menghapus pintasan di Firebase.',
          isQuota: isQuotaExceededError(err),
        });
      });
    }
  };

  // Toggle Pin
  const handleTogglePin = (shortcut: ShortcutItem) => {
    const nextPinned = !shortcut.isPinned;
    const updated = shortcuts.map((s) =>
      s.id === shortcut.id ? { ...s, isPinned: nextPinned } : s
    );
    updateShortcuts(updated);
    if (firebaseUser) {
      void toggleShortcutPinInFirestore(firebaseUser.uid, shortcut.id, nextPinned).catch((err) => {
        setCloudError({
          message: err instanceof Error ? err.message : 'Gagal mengubah status pin di Firebase.',
          isQuota: isQuotaExceededError(err),
        });
      });
    }
  };

  // Duplicate shortcut
  const handleDuplicate = (shortcut: ShortcutItem) => {
    const duplicated: ShortcutItem = {
      ...shortcut,
      id: `sc-${Date.now()}`,
      title: `${shortcut.title} (Salinan)`,
      clickCount: 0,
      createdAt: Date.now(),
    };
    updateShortcuts([duplicated, ...shortcuts]);
    if (firebaseUser) {
      void createShortcutInFirestore(firebaseUser.uid, duplicated).catch((err) => {
        setCloudError({
          message: err instanceof Error ? err.message : 'Gagal menduplikasi pintasan di Firebase.',
          isQuota: isQuotaExceededError(err),
        });
      });
    }
  };

  // Reassign shortcuts when group is deleted
  const handleReassignShortcuts = (fromGroupId: string, toGroupId: string) => {
    const affectedIds = shortcuts.filter((s) => s.groupId === fromGroupId).map((s) => s.id);
    const updated = shortcuts.map((s) =>
      s.groupId === fromGroupId ? { ...s, groupId: toGroupId } : s
    );
    updateShortcuts(updated);
    if (firebaseUser && affectedIds.length > 0) {
      void reassignShortcutsGroupInFirestore(firebaseUser.uid, affectedIds, toGroupId).catch((err) => {
        setCloudError({
          message: err instanceof Error ? err.message : 'Gagal memindahkan pintasan di Firebase.',
          isQuota: isQuotaExceededError(err),
        });
      });
    }
  };

  // Reset to default
  const handleResetDefault = () => {
    resetAllData();
    const freshShortcuts = getStoredShortcuts();
    const freshGroups = getStoredGroups();
    setShortcuts(freshShortcuts);
    setGroups(freshGroups);
    if (firebaseUser) {
      void replaceWorkspaceDataInFirestore(firebaseUser.uid, DEFAULT_GROUPS, DEFAULT_SHORTCUTS).catch((err) => {
        setCloudError({
          message: err instanceof Error ? err.message : 'Gagal mereset database Firebase ke default.',
          isQuota: isQuotaExceededError(err),
        });
      });
    }
  };

  // Open modal with presets
  const handleOpenAddWithGroup = (groupId?: string, type: ShortcutType = 'web') => {
    setEditingShortcut(null);
    setAddModalDefaultGroupId(groupId);
    setAddModalDefaultType(type);
    setIsAddModalOpen(true);
  };

  // Filtered and Sorted shortcuts
  const filteredShortcuts = useMemo(() => {
    return shortcuts.filter((item) => {
      // Group filter
      if (selectedGroupFilter !== 'all' && item.groupId !== selectedGroupFilter) {
        return false;
      }

      // Type filter
      if (selectedTypeFilter !== 'all' && item.type !== selectedTypeFilter) {
        return false;
      }

      // Query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchUrl = item.url.toLowerCase().includes(q);
        const matchDesc = item.description?.toLowerCase().includes(q);
        const groupName = groups.find((g) => g.id === item.groupId)?.name.toLowerCase() || '';
        const matchGroup = groupName.includes(q);
        const matchTag = item.tags?.some((t) => t.toLowerCase().includes(q));

        if (!matchTitle && !matchUrl && !matchDesc && !matchGroup && !matchTag) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      // Prioritize pinned
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;

      if (sortBy === 'clicks') {
        return b.clickCount - a.clickCount;
      } else if (sortBy === 'recent') {
        return (b.lastOpened || 0) - (a.lastOpened || 0);
      } else {
        return a.title.localeCompare(b.title);
      }
    });
  }, [shortcuts, groups, selectedGroupFilter, selectedTypeFilter, searchQuery, sortBy]);

  // Pinned items for Quick Dock
  const pinnedItems = useMemo(() => {
    return shortcuts.filter((s) => s.isPinned);
  }, [shortcuts]);

  // Statistics
  const stats = useMemo(() => {
    const total = shortcuts.length;
    const directoryCount = shortcuts.filter((s) => s.type === 'directory').length;
    const webCount = shortcuts.filter((s) => s.type === 'web').length;
    const totalClicks = shortcuts.reduce((acc, curr) => acc + curr.clickCount, 0);
    return { total, directoryCount, webCount, totalClicks };
  }, [shortcuts]);

  // Responsive Grid column classes based on cardDensity
  const gridLayoutClass = useMemo(() => {
    switch (cardDensity) {
      case 'small':
        return 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3';
      case 'large':
        return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5';
      case 'medium':
      default:
        return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4';
    }
  }, [cardDensity]);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 flex flex-col font-sans transition-colors">
      {/* 1. Header (3-Zone Top Bar Contract) */}
      <Header
        theme={theme}
        currentRole={currentRole}
        onOpenRoleSwitch={() => setIsRoleSwitchOpen(true)}
        canAddShortcut={permissions.canAddShortcut}
        canEditLogo={permissions.canEditShortcut}
        customLogo={customLogo}
        onOpenLogoSettings={() => {
          setSettingsFocusSection('logo');
          setIsSettingsOpen(true);
        }}
        onToggleTheme={handleToggleTheme}
        onOpenAddModal={() => handleOpenAddWithGroup(undefined, 'web')}
        onOpenManageGroups={() => setIsManageGroupsOpen(true)}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
        onOpenHelpModal={() => setIsHelpModalOpen(true)}
        onOpenSettings={() => {
          setSettingsFocusSection(null);
          setIsSettingsOpen(true);
        }}
        onPlayJarvisIntro={handlePlayJarvisIntro}
        onSelectGroupFilter={handleSelectGroupFilter}
        activeFilterGroup={selectedGroupFilter}
        firebaseUser={firebaseUser}
        isSigningInGoogle={isSigningInGoogle}
        onSignInGoogle={handleSignInGoogle}
        onOpenCloudSettings={() => {
          setSettingsFocusSection('firebase');
          setIsSettingsOpen(true);
        }}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Firebase Cloud / Quota Error Banner */}
        {cloudError && (
          <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/70 rounded-xl p-3 sm:p-3.5 flex items-start justify-between gap-3 text-xs">
            <div className="flex items-start gap-2.5 text-rose-800 dark:text-rose-200">
              <CloudAlert className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{cloudError.message}</p>
                {cloudError.isQuota && (
                  <a
                    href={FIREBASE_UPGRADE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 underline font-medium mt-1 text-rose-700 dark:text-rose-300"
                  >
                    <span>Lihat detail kuota & upgrade di Firebase Console</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setCloudError(null)}
              className="p-1 text-rose-500 hover:text-rose-700 dark:hover:text-rose-300 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        {/* Role Notification Banner for Viewer or Lead */}
        {currentRole === 'viewer' && (
          <div className="bg-neutral-100 dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-700/80 rounded-xl p-3 sm:p-3.5 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
              <Eye className="w-4 h-4 text-neutral-500 shrink-0" />
              <span>
                <strong>Akses Viewer (Hanya Lihat):</strong> Anda dapat mencari, membuka pintasan, dan menyalin path folder. Tidak dapat menambah atau menghapus data.
              </span>
            </div>
            <button
              onClick={() => setIsRoleSwitchOpen(true)}
              className="px-2.5 py-1 text-xs font-semibold bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-lg shrink-0 hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
            >
              Masuk (Lead/Manager)
            </button>
          </div>
        )}

        {currentRole === 'lead' && (
          <div className="bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl p-3 sm:p-3.5 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200">
              <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>
                <strong>Akses Lead Engineering:</strong> Diizinkan menambah dan mengedit pintasan/grup, <em>tetapi fitur hapus dinonaktifkan</em>.
              </span>
            </div>
            <button
              onClick={() => setIsRoleSwitchOpen(true)}
              className="px-2.5 py-1 text-xs font-medium text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/50 hover:bg-amber-200 dark:hover:bg-amber-800/60 rounded-lg shrink-0 transition-colors"
            >
              Ganti Peran
            </button>
          </div>
        )}

        {/* Toast Notification Bar */}
        {toast && (
          <div className="bg-indigo-600 text-white p-3 sm:p-4 rounded-xl shadow-lg flex items-start justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold">{toast.message}</p>
                {toast.details && (
                  <p className="text-xs text-indigo-100 mt-0.5 font-mono">{toast.details}</p>
                )}
              </div>
            </div>
            <button
              onClick={() => setToast(null)}
              className="p-1 text-indigo-200 hover:text-white rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 2. Directory / Drive D: Assistant Banner */}
        <DirectoryInfoBanner
          onAddDriveShortcut={() => handleOpenAddWithGroup('group-drive', 'directory')}
          onOpenHelpModal={() => setIsHelpModalOpen(true)}
          canAddShortcut={permissions.canAddShortcut}
        />

        {/* 3. Quick Dock (Pinned Favorites) */}
        {pinnedItems.length > 0 && selectedGroupFilter === 'all' && !searchQuery && (
          <QuickDock
            pinnedItems={pinnedItems}
            groups={groups}
            onLaunch={handleLaunch}
            onUnpin={handleTogglePin}
          />
        )}

        {/* 4. Controls Strip & Search Bar */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 shadow-xs transition-colors space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input with Ctrl+K trigger */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari pintasan web, alamat Drive D:, atau catatan..."
                className="w-full pl-9 pr-24 py-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setIsCommandPaletteOpen(true)}
                className="absolute right-2 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-700 text-[10px] font-mono text-neutral-600 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors"
                title="Buka Command Palette"
              >
                <Command className="w-3 h-3" />
                <span>K</span>
              </button>
            </div>

            {/* View Mode & Sort Switches */}
            <div className="flex flex-wrap items-center gap-2 justify-between sm:justify-end">
              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'clicks' | 'recent' | 'name')}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="clicks">Paling Sering Digunakan</option>
                <option value="recent">Baru Saja Dibuka</option>
                <option value="name">Urutkan Abjad (A-Z)</option>
              </select>

              {/* Card Density Switcher (Visible in grid and sections mode) */}
              {(viewMode === 'grid' || viewMode === 'sections') && (
                <div
                  className="flex items-center gap-0.5 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-xs"
                  title="Sesuaikan densitas kartu (S: Kompak, M: Standar, L: Leluasa)"
                >
                  <button
                    type="button"
                    onClick={() => handleDensityChange('small')}
                    title="Densitas Kompak (Small) - Muat hingga 6 kolom kartu di layar"
                    className={`px-2 py-1 font-mono text-[11px] font-semibold rounded-md transition-colors ${
                      cardDensity === 'small'
                        ? 'bg-white dark:bg-neutral-900 text-indigo-600 dark:text-indigo-400 shadow-2xs font-bold'
                        : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
                    }`}
                  >
                    S
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDensityChange('medium')}
                    title="Densitas Standar (Medium) - 3-4 kolom proporsional"
                    className={`px-2 py-1 font-mono text-[11px] font-semibold rounded-md transition-colors ${
                      cardDensity === 'medium'
                        ? 'bg-white dark:bg-neutral-900 text-indigo-600 dark:text-indigo-400 shadow-2xs font-bold'
                        : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
                    }`}
                  >
                    M
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDensityChange('large')}
                    title="Densitas Leluasa (Large) - 2-3 kolom lega dengan deskripsi maksimal"
                    className={`px-2 py-1 font-mono text-[11px] font-semibold rounded-md transition-colors ${
                      cardDensity === 'large'
                        ? 'bg-white dark:bg-neutral-900 text-indigo-600 dark:text-indigo-400 shadow-2xs font-bold'
                        : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
                    }`}
                  >
                    L
                  </button>
                </div>
              )}

              {/* View Mode Segmented Controls */}
              <div className="flex items-center gap-1 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('grid');
                    setPreviousViewMode('grid');
                    saveStoredViewMode('grid');
                    persistCloudPreferences({ viewMode: 'grid' });
                  }}
                  title="Tampilan Grid Kartu"
                  className={`p-1.5 rounded-md transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-2xs'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('orbit');
                    saveStoredViewMode('orbit');
                    persistCloudPreferences({ viewMode: 'orbit' });
                  }}
                  title="Tampilan Melingkar (Orbit Hub)"
                  className={`p-1.5 rounded-md transition-colors ${
                    viewMode === 'orbit'
                      ? 'bg-white dark:bg-neutral-900 text-amber-500 shadow-2xs'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
                  }`}
                >
                  <Orbit className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('sections');
                    setPreviousViewMode('sections');
                    saveStoredViewMode('sections');
                    persistCloudPreferences({ viewMode: 'sections' });
                  }}
                  title="Tampilan Berdasarkan Kategori Grup"
                  className={`p-1.5 rounded-md transition-colors ${
                    viewMode === 'sections'
                      ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-2xs'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
                  }`}
                >
                  <FolderKanban className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('list');
                    setPreviousViewMode('list');
                    saveStoredViewMode('list');
                    persistCloudPreferences({ viewMode: 'list' });
                  }}
                  title="Tampilan Daftar Tabel Rapat"
                  className={`p-1.5 rounded-md transition-colors ${
                    viewMode === 'list'
                      ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-2xs'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              {/* Settings Modal Button in Toolbar */}
              <button
                type="button"
                onClick={() => setIsSettingsOpen(true)}
                title="Buka Pengaturan Tampilan & Densitas"
                className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
              >
                <Sliders className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Group Category Filter Tabs (Zero-pill button styling) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              type="button"
              onClick={() => handleSelectGroupFilter('all')}
              className={`px-3 py-1.5 font-medium rounded-lg whitespace-nowrap transition-colors ${
                selectedGroupFilter === 'all'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              Semua Grup ({shortcuts.length})
            </button>

            {groups.map((group) => {
              const count = shortcuts.filter((s) => s.groupId === group.id).length;
              return (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => handleSelectGroupFilter(group.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 font-medium rounded-lg whitespace-nowrap transition-colors ${
                    selectedGroupFilter === group.id
                      ? 'bg-amber-500 text-neutral-950 font-semibold shadow-xs'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                  }`}
                >
                  <DynamicIcon name={group.icon} className="w-3.5 h-3.5" />
                  <span>{group.name}</span>
                  <span className="tabular-nums font-mono opacity-80">({count})</span>
                </button>
              );
            })}

            {/* Quick Type filter separator */}
            <div className="h-4 w-px bg-neutral-300 dark:bg-neutral-700 mx-1 shrink-0" />

            <button
              type="button"
              onClick={() => setSelectedTypeFilter(selectedTypeFilter === 'directory' ? 'all' : 'directory')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 font-medium rounded-lg whitespace-nowrap transition-colors ${
                selectedTypeFilter === 'directory'
                  ? 'bg-emerald-600 text-white'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              <HardDrive className="w-3.5 h-3.5" />
              <span>Hanya Drive Lokal ({stats.directoryCount})</span>
            </button>
          </div>
        </div>

        {/* 5. Shortcuts Display Views */}

        {/* Empty state */}
        {filteredShortcuts.length === 0 && (viewMode !== 'orbit' || searchQuery.trim().length > 0) ? (
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-12 text-center shadow-xs">
            <div className="w-12 h-12 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-400 flex items-center justify-center mx-auto mb-3">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              Tidak Ada Pintasan Ditemukan
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto mt-1 mb-5">
              {searchQuery
                ? `Tidak ada hasil yang sesuai dengan kata kunci "${searchQuery}". Coba bersihkan filter pencarian.`
                : 'Belum ada pintasan dalam grup kategori ini. Tambahkan layanan atau direktori folder pertama Anda!'}
            </p>
            <div className="flex items-center justify-center gap-3">
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    handleSelectGroupFilter('all');
                    setSelectedTypeFilter('all');
                  }}
                  className="px-3 py-1.5 text-xs rounded-lg border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                >
                  Bersihkan Pencarian
                </button>
              )}
              {permissions.canAddShortcut ? (
                <button
                  type="button"
                  onClick={() => handleOpenAddWithGroup(selectedGroupFilter !== 'all' ? selectedGroupFilter : undefined)}
                  className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
                >
                  + Tambah Pintasan Baru
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsRoleSwitchOpen(true)}
                  className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 shadow-xs"
                >
                  Masuk untuk Menambah Pintasan
                </button>
              )}
            </div>
          </div>
        ) : viewMode === 'orbit' ? (
          /* View Mode: Circular Radial Hub (Orbit View) */
          <OrbitHubView
            shortcuts={filteredShortcuts}
            groups={groups}
            selectedGroupFilter={selectedGroupFilter}
            onSelectGroupFilter={handleSelectGroupFilter}
            customLogo={customLogo}
            canEditLogo={permissions.canEditShortcut}
            onOpenLogoSettings={() => {
              setSettingsFocusSection('logo');
              setIsSettingsOpen(true);
            }}
            canAddShortcut={permissions.canAddShortcut}
            canEditShortcut={permissions.canEditShortcut}
            canDeleteShortcut={permissions.canDeleteShortcut}
            onLaunch={handleLaunch}
            onEdit={(s) => {
              setEditingShortcut(s);
              setIsAddModalOpen(true);
            }}
            onDelete={handleDeleteShortcut}
            onTogglePin={handleTogglePin}
            onAddInGroup={(gId) =>
              handleOpenAddWithGroup(
                gId,
                gId?.includes('drive') ? 'directory' : 'web'
              )
            }
          />
        ) : viewMode === 'sections' ? (
          /* View Mode: Grouped Sections */
          <div className="space-y-6">
            {groups
              .filter(
                (group) =>
                  selectedGroupFilter === 'all' || selectedGroupFilter === group.id
              )
              .map((group) => {
                const groupItems = filteredShortcuts.filter((s) => s.groupId === group.id);
                if (groupItems.length === 0 && selectedGroupFilter === 'all' && searchQuery) {
                  return null;
                }

                return (
                  <section
                    key={group.id}
                    className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 sm:p-5 shadow-xs transition-colors"
                  >
                    {/* Group Header */}
                    <div className="flex items-center justify-between pb-3 mb-4 border-b border-neutral-100 dark:border-neutral-800">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center overflow-hidden shrink-0">
                          {isImageIcon(group.icon) ? (
                            <img src={group.icon} alt={group.name} className="w-full h-full object-cover" />
                          ) : (
                            <DynamicIcon name={group.icon} className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                              {group.name}
                            </h2>
                            <span className="text-xs text-neutral-400 tabular-nums font-mono">
                              · {groupItems.length} pintasan
                            </span>
                          </div>
                          {group.description && (
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                              {group.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {permissions.canAddShortcut && (
                        <button
                          type="button"
                          onClick={() => handleOpenAddWithGroup(group.id, group.id.includes('drive') ? 'directory' : 'web')}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Tambah ke Grup Ini</span>
                        </button>
                      )}
                    </div>

                    {/* Cards within this group */}
                    {groupItems.length === 0 ? (
                      <div className="py-6 text-center text-xs text-neutral-400">
                        Belum ada pintasan di grup ini.
                      </div>
                    ) : (
                      <div className={gridLayoutClass}>
                        {groupItems.map((item) => (
                          <ShortcutCard
                            key={item.id}
                            shortcut={item}
                            group={group}
                            density={cardDensity}
                            canEditShortcut={permissions.canEditShortcut}
                            canDeleteShortcut={permissions.canDeleteShortcut}
                            onLaunch={handleLaunch}
                            onEdit={(s) => {
                              setEditingShortcut(s);
                              setIsAddModalOpen(true);
                            }}
                            onDelete={handleDeleteShortcut}
                            onTogglePin={handleTogglePin}
                            onDuplicate={handleDuplicate}
                          />
                        ))}
                      </div>
                    )}
                  </section>
                );
              })}
          </div>
        ) : viewMode === 'list' ? (
          /* View Mode: High-density List Table */
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden shadow-xs">
            <div className="px-4 py-3 bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs font-semibold text-neutral-600 dark:text-neutral-400">
              <div className="flex-1 min-w-[240px]">Nama Layanan & Kategori</div>
              <div className="hidden md:block flex-1 min-w-[200px]">URL / Alamat Direktori</div>
              <div className="hidden lg:block flex-1 min-w-[180px]">Deskripsi</div>
              <div className="w-16 text-right">Penggunaan</div>
              <div className="w-24 text-right">Aksi</div>
            </div>
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {filteredShortcuts.map((item) => {
                const group = groups.find((g) => g.id === item.groupId);
                return (
                  <ShortcutListItem
                    key={item.id}
                    shortcut={item}
                    group={group}
                    canEditShortcut={permissions.canEditShortcut}
                    canDeleteShortcut={permissions.canDeleteShortcut}
                    onLaunch={handleLaunch}
                    onEdit={(s) => {
                      setEditingShortcut(s);
                      setIsAddModalOpen(true);
                    }}
                    onDelete={handleDeleteShortcut}
                    onTogglePin={handleTogglePin}
                  />
                );
              })}
            </div>
          </div>
        ) : (
          /* View Mode: Modern Responsive Grid with dynamic density */
          <div className={gridLayoutClass}>
            {filteredShortcuts.map((item) => {
              const group = groups.find((g) => g.id === item.groupId);
              return (
                <ShortcutCard
                  key={item.id}
                  shortcut={item}
                  group={group}
                  density={cardDensity}
                  canEditShortcut={permissions.canEditShortcut}
                  canDeleteShortcut={permissions.canDeleteShortcut}
                  onLaunch={handleLaunch}
                  onEdit={(s) => {
                    setEditingShortcut(s);
                    setIsAddModalOpen(true);
                  }}
                  onDelete={handleDeleteShortcut}
                  onTogglePin={handleTogglePin}
                  onDuplicate={handleDuplicate}
                />
              );
            })}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 py-4 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-500 dark:text-neutral-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-neutral-700 dark:text-neutral-300">OneStop Hub Engineering</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums font-mono">{stats.total} Total Pintasan</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums font-mono">{stats.directoryCount} Direktori Drive</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums font-mono">{stats.totalClicks} Total Akses</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsRoleSwitchOpen(true)}
              className="flex items-center gap-1.5 hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors font-medium text-neutral-600 dark:text-neutral-300"
            >
              {currentRole === 'viewer' ? (
                <Eye className="w-3.5 h-3.5 text-neutral-500" />
              ) : currentRole === 'lead' ? (
                <Shield className="w-3.5 h-3.5 text-amber-500" />
              ) : (
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              )}
              <span>Akses: {ROLE_CONFIGS[currentRole].name}</span>
            </button>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors"
            >
              Pengaturan Tampilan
            </button>
            <button
              onClick={() => setIsHelpModalOpen(true)}
              className="hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors"
            >
              Panduan Direktori Drive D:
            </button>
            <button
              onClick={() => setIsBackupModalOpen(true)}
              className="hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors"
            >
              Ekspor / Impor JSON
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AddEditShortcutModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingShortcut(null);
        }}
        onSave={handleSaveShortcut}
        groups={groups}
        editingShortcut={editingShortcut}
        defaultGroupId={addModalDefaultGroupId}
        defaultType={addModalDefaultType}
      />

      <ManageGroupsModal
        isOpen={isManageGroupsOpen}
        onClose={() => setIsManageGroupsOpen(false)}
        groups={groups}
        shortcuts={shortcuts}
        canManageGroups={permissions.canManageGroups}
        canDeleteGroup={permissions.canDeleteGroup}
        onSaveGroups={updateGroups}
        onReassignShortcuts={handleReassignShortcuts}
      />

      <LocalDirectoryHelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />

      <BackupRestoreModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        canImportBackup={permissions.canImportBackup}
        canResetData={permissions.canResetData}
        onDataChanged={() => {
          const restoredShortcuts = getStoredShortcuts();
          const restoredGroups = getStoredGroups();
          setShortcuts(restoredShortcuts);
          setGroups(restoredGroups);
          if (firebaseUser) {
            void replaceWorkspaceDataInFirestore(firebaseUser.uid, restoredGroups, restoredShortcuts).catch((err) => {
              setCloudError({
                message: err instanceof Error ? err.message : 'Gagal menyinkronkan data impor ke Firebase.',
                isQuota: isQuotaExceededError(err),
              });
            });
          }
        }}
        onResetDefault={handleResetDefault}
      />

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        shortcuts={shortcuts}
        groups={groups}
        onLaunch={handleLaunch}
      />

      <RoleSwitchModal
        isOpen={isRoleSwitchOpen}
        onClose={() => setIsRoleSwitchOpen(false)}
        currentRole={currentRole}
        onRoleChanged={handleRoleChanged}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => {
          setIsSettingsOpen(false);
          setSettingsFocusSection(null);
        }}
        density={cardDensity}
        onDensityChange={handleDensityChange}
        viewMode={viewMode}
        onViewModeChange={(mode) => {
          setViewMode(mode);
          if (mode !== 'orbit') {
            setPreviousViewMode(mode);
          }
          saveStoredViewMode(mode);
          persistCloudPreferences({ viewMode: mode });
        }}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        currentRole={currentRole}
        onOpenRoleSwitch={() => setIsRoleSwitchOpen(true)}
        totalShortcutsCount={shortcuts.length}
        isJarvisEnabled={isJarvisEnabled}
        onToggleJarvisEnabled={handleToggleJarvisEnabled}
        isJarvisAudioEnabled={isJarvisAudio}
        onToggleJarvisAudio={handleToggleJarvisAudio}
        onPlayJarvisIntro={handlePlayJarvisIntro}
        customLogo={customLogo}
        onSaveCustomLogo={handleSaveCustomLogo}
        canEditLogo={permissions.canEditShortcut}
        initialFocusSection={settingsFocusSection}
        firebaseUser={firebaseUser}
        isSigningInGoogle={isSigningInGoogle}
        onSignInGoogle={handleSignInGoogle}
        onSignOutGoogle={handleSignOutGoogle}
        onSyncLocalToCloud={handleSyncLocalToCloud}
      />

      {/* Cinematic J.A.R.V.I.S. Startup HUD */}
      {showJarvisIntro && (
        <JarvisIntro
          onComplete={handleCompleteJarvisIntro}
          currentRole={currentRole}
          audioEnabled={isJarvisAudio}
          onToggleAudio={() => handleToggleJarvisAudio(!isJarvisAudio)}
          customLogo={customLogo}
        />
      )}
    </div>
  );
}
