import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Search,
  LayoutGrid,
  List,
  FolderKanban,
  HardDrive,
  Plus,
  Command,
  CheckCircle2,
  X,
  ExternalLink,
  Shield,
  ShieldCheck,
  Eye,
  Sliders,
  Orbit,
  CloudAlert,
  Trash2,
  Settings2,
  Layers,
} from 'lucide-react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { ShortcutItem, ShortcutGroup, ViewMode, FilterType, ShortcutType, UserRole, CardDensity, CustomLogoConfig, UiStyle, SortOption } from './types';
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
  getStoredUiStyle,
  saveStoredUiStyle,
  applyUiStyleWithTransition,
  getStoredSortBy,
  saveStoredSortBy,
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
  resolveRedirectAuth,
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
  deleteGroupInFirestore,
  reassignShortcutsGroupInFirestore,
  savePreferencesToFirestore,
  saveCustomLogoToFirestore,
  replaceWorkspaceDataInFirestore,
  formatFirestoreErrorForUser,
  WorkspacePreferencesPayload,
} from './services/firestoreSync';
import { launchShortcut } from './utils/pathHelper';
import { getGroupColorTheme } from './utils/colorTheme';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { Header, CloudSyncStatus } from './components/Header';
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
import { OfflineIndicator } from './components/OfflineIndicator';

export default function App() {
  // State
  const [shortcuts, setShortcuts] = useState<ShortcutItem[]>([]);
  const [groups, setGroups] = useState<ShortcutGroup[]>([]);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [uiStyle, setUiStyle] = useState<UiStyle>('claymorphism');
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
  const [sortBy, setSortBy] = useState<SortOption>('clicks');
  const selectedGroupFilterRef = React.useRef(selectedGroupFilter);

  useEffect(() => {
    selectedGroupFilterRef.current = selectedGroupFilter;
  }, [selectedGroupFilter]);

  // Firebase Auth & Cloud Sync State
  const isOnline = useOnlineStatus();
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState<boolean>(false);
  const [isSigningInGoogle, setIsSigningInGoogle] = useState<boolean>(false);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<CloudSyncStatus>('local');
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [cloudError, setCloudError] = useState<{ message: string; isQuota?: boolean } | null>(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingShortcut, setEditingShortcut] = useState<ShortcutItem | null>(null);
  const [addModalDefaultGroupId, setAddModalDefaultGroupId] = useState<string | undefined>();
  const [addModalDefaultType, setAddModalDefaultType] = useState<ShortcutType>('web');
  const [isManageGroupsOpen, setIsManageGroupsOpen] = useState(false);
  const [deleteTargetGroupId, setDeleteTargetGroupId] = useState<string | null>(null);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Toast notification with unified timer cleanup
  const [toast, setToast] = useState<{ message: string; details?: string; isDirectory?: boolean } | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const dismissToast = useCallback(() => {
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    setToast(null);
  }, []);

  const showToast = useCallback(
    (nextToast: { message: string; details?: string; isDirectory?: boolean }, durationMs = 4500) => {
      if (toastTimerRef.current !== null) {
        window.clearTimeout(toastTimerRef.current);
      }
      setToast(nextToast);
      toastTimerRef.current = window.setTimeout(() => {
        setToast(null);
        toastTimerRef.current = null;
      }, durationMs);
    },
    []
  );

  useEffect(() => {
    return () => {
      if (toastTimerRef.current !== null) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  // Permissions based on current role
  const permissions = useMemo(() => ROLE_PERMISSIONS[currentRole], [currentRole]);

  // Precomputed lookup maps for O(1) card & filter rendering
  const groupById = useMemo(() => new Map(groups.map((g) => [g.id, g])), [groups]);
  const groupShortcutCounts = useMemo(() => {
    const counts = new Map<string, number>();
    shortcuts.forEach((s) => {
      counts.set(s.groupId, (counts.get(s.groupId) || 0) + 1);
    });
    return counts;
  }, [shortcuts]);

  // Initialize
  useEffect(() => {
    const initialTheme = getStoredTheme();
    setTheme(initialTheme);
    document.documentElement.classList.toggle('dark', initialTheme === 'dark');

    const initialUiStyle = getStoredUiStyle();
    setUiStyle(initialUiStyle);
    document.documentElement.dataset.uiStyle = initialUiStyle === 'claymorphism' ? 'clay' : 'classic';

    setShortcuts(getStoredShortcuts());
    setGroups(getStoredGroups());
    const storedView = getStoredViewMode();
    setViewMode(storedView);
    setPreviousViewMode(storedView);
    setCardDensity(getStoredCardDensity());
    setSortBy(getStoredSortBy());
    setCurrentRole(getStoredRole());
    setCustomLogo(getStoredCustomLogo());

    const introEnabled = isJarvisIntroEnabled();
    const audioEnabled = isJarvisAudioEnabled();
    setIsJarvisEnabled(introEnabled);
    setIsJarvisAudio(audioEnabled);

    if (introEnabled && !hasSeenJarvisIntroSession()) {
      setShowJarvisIntro(true);
      markJarvisIntroSeenSession();
    }

    void resolveRedirectAuth().then((redirectUser) => {
      if (redirectUser) {
        showToast({
          message: `Terhubung ke Google Firebase (${redirectUser.email})`,
          details: 'Sinkronisasi real-time Firestore kini aktif untuk seluruh pintasan & pengaturan.',
        });
      }
    });

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setIsAuthReady(true);
      if (!user) {
        setCloudError(null);
        setCloudSyncStatus('local');
      }
    });

    return () => unsubAuth();
  }, [showToast]);

  // Update sync indicator automatically on connectivity change
  useEffect(() => {
    if (!firebaseUser) {
      setCloudSyncStatus('local');
      return;
    }
    if (!isOnline) {
      setCloudSyncStatus('offline');
    } else if (!cloudError) {
      setCloudSyncStatus((prev) => (prev === 'offline' ? 'synced' : prev));
    }
  }, [isOnline, firebaseUser, cloudError]);

  // Attach real-time Firestore listeners once Firebase Auth is ready & signed in
  useEffect(() => {
    if (!isAuthReady || !firebaseUser) return;

    let cancelled = false;
    let unsubGroups: (() => void) | undefined;
    let unsubShortcuts: (() => void) | undefined;
    let unsubSettings: (() => void) | undefined;

    const handleSyncErr = (err: unknown) => {
      if (cancelled) return;
      const formatted = formatFirestoreErrorForUser(err);
      setCloudError(formatted);
      setCloudSyncStatus('error');
    };

    const startSync = async () => {
      try {
        setCloudError(null);
        setCloudSyncStatus(navigator.onLine ? 'connecting' : 'offline');
        await syncUserProfileAndWorkspace(firebaseUser);
        const migrated = await bootstrapInitialWorkspaceData(
          firebaseUser.uid,
          getStoredGroups(),
          getStoredShortcuts(),
          {
            cardDensity: getStoredCardDensity(),
            viewMode: getStoredViewMode(),
            theme: getStoredTheme(),
            uiStyle: getStoredUiStyle(),
            sortBy: getStoredSortBy(),
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
            if (
              selectedGroupFilterRef.current !== 'all' &&
              !cloudGroups.some((g) => g.id === selectedGroupFilterRef.current)
            ) {
              setSelectedGroupFilter('all');
            }
            setCloudSyncStatus(navigator.onLine ? 'synced' : 'offline');
            setLastSyncedAt(Date.now());
          },
          handleSyncErr
        );

        unsubShortcuts = subscribeToShortcuts(
          firebaseUser.uid,
          (cloudShortcuts) => {
            if (cancelled) return;
            setShortcuts(cloudShortcuts);
            saveStoredShortcuts(cloudShortcuts);
            setCloudSyncStatus(navigator.onLine ? 'synced' : 'offline');
            setLastSyncedAt(Date.now());
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

            setUiStyle(cloudSettings.uiStyle);
            saveStoredUiStyle(cloudSettings.uiStyle);
            applyUiStyleWithTransition(cloudSettings.uiStyle);

            setSortBy(cloudSettings.sortBy);
            saveStoredSortBy(cloudSettings.sortBy);

            setIsJarvisEnabled(cloudSettings.jarvisIntroEnabled);
            setJarvisIntroEnabled(cloudSettings.jarvisIntroEnabled);

            setIsJarvisAudio(cloudSettings.jarvisAudioEnabled);
            setJarvisAudioEnabled(cloudSettings.jarvisAudioEnabled);

            setCustomLogo(cloudSettings.customLogo);
            saveStoredCustomLogo(cloudSettings.customLogo);

            setPreviousViewMode(cloudSettings.viewMode);
            saveStoredViewMode(cloudSettings.viewMode);
            if (selectedGroupFilterRef.current === 'all') {
              setViewMode(cloudSettings.viewMode);
            }
            setCloudSyncStatus(navigator.onLine ? 'synced' : 'offline');
            setLastSyncedAt(Date.now());
          },
          handleSyncErr
        );

        if (migrated) {
          showToast({
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
  }, [isAuthReady, firebaseUser, showToast]);

  // Sync dynamic favicon with custom logo photo (restores default /icon.svg when cleared)
  useEffect(() => {
    if (typeof document === 'undefined') return;
    let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    if (customLogo?.src) {
      link.removeAttribute('type');
      link.href = customLogo.src;
    } else {
      link.type = 'image/svg+xml';
      link.href = '/icon.svg';
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
    uiStyle: overrides.uiStyle ?? uiStyle,
    sortBy: overrides.sortBy ?? sortBy,
    jarvisIntroEnabled: overrides.jarvisIntroEnabled ?? isJarvisEnabled,
    jarvisAudioEnabled: overrides.jarvisAudioEnabled ?? isJarvisAudio,
    customLogo: overrides.customLogo !== undefined ? overrides.customLogo : customLogo,
  });

  const persistCloudPreferences = (overrides: Partial<WorkspacePreferencesPayload> = {}) => {
    if (!firebaseUser) return;
    setCloudSyncStatus(isOnline ? 'syncing' : 'offline');
    void savePreferencesToFirestore(firebaseUser.uid, getCurrentPreferences(overrides))
      .then(() => {
        setCloudSyncStatus(navigator.onLine ? 'synced' : 'offline');
        setLastSyncedAt(Date.now());
      })
      .catch((err) => {
        const formatted = formatFirestoreErrorForUser(err);
        setCloudError(formatted);
        setCloudSyncStatus('error');
      });
  };

  // Google Sign-In / Sign-Out & Manual Cloud Sync
  const handleSignInGoogle = async () => {
    setIsSigningInGoogle(true);
    setCloudError(null);
    try {
      const user = await signInWithGoogle();
      if (user) {
        showToast({
          message: `Terhubung ke Google Firebase (${user.email})`,
          details: 'Sinkronisasi real-time Firestore kini aktif untuk seluruh pintasan & pengaturan di PC dan HP.',
        });
      }
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code === 'auth/popup-blocked') {
        setCloudError({
          message: 'Jendela login Google diblokir browser. Izinkan pop-up untuk situs ini atau buka di tab penuh lalu coba lagi.',
        });
      } else if (code === 'auth/unauthorized-domain') {
        setCloudError({
          message: 'Domain ini belum diotorisasi di Firebase Authentication. Tambahkan domain di Firebase Console → Authentication → Settings → Authorized domains.',
        });
      } else if (code === 'auth/operation-not-supported-in-this-environment') {
        setCloudError({
          message: 'Login Google di lingkungan pratinjau tersemat membutuhkan tab browser penuh. Buka aplikasi di tab baru lalu coba lagi.',
        });
      } else if (code !== 'auth/popup-closed-by-user' && code !== 'auth/cancelled-popup-request') {
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
      setCloudSyncStatus('local');
      setLastSyncedAt(null);
      showToast({
        message: 'Keluar dari Akun Google Firebase',
        details: 'Aplikasi beralih ke penyimpanan lokal browser.',
      });
    } catch (err) {
      setCloudError(formatFirestoreErrorForUser(err));
    }
  };

  const handleSyncLocalToCloud = async () => {
    if (!firebaseUser) return;
    try {
      setCloudError(null);
      setCloudSyncStatus(isOnline ? 'syncing' : 'offline');
      await replaceWorkspaceDataInFirestore(firebaseUser.uid, groups, shortcuts);
      await savePreferencesToFirestore(firebaseUser.uid, getCurrentPreferences());
      await saveCustomLogoToFirestore(firebaseUser.uid, customLogo, getCurrentPreferences());
      setCloudSyncStatus(navigator.onLine ? 'synced' : 'offline');
      setLastSyncedAt(Date.now());
      showToast({
        message: 'Sinkronisasi Paksa ke Firebase Berhasil ☁️',
        details: `${shortcuts.length} pintasan dan ${groups.length} grup telah diperbarui di Firestore.`,
      });
    } catch (err) {
      setCloudError(formatFirestoreErrorForUser(err));
      setCloudSyncStatus('error');
    }
  };

  // Toggle theme with smooth visual transition
  const handleToggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    saveStoredTheme(nextTheme);
    applyThemeWithTransition(nextTheme);
    persistCloudPreferences({ theme: nextTheme });
    showToast({
      message: `Beralih ke ${nextTheme === 'dark' ? 'Mode Gelap 🌙' : 'Mode Terang ☀️'}`,
      details: 'Preferensi tema disimpan dengan transisi visual halus.',
    });
  };

  // Change UI design style (Claymorphism 3D vs Classic Minimalist)
  const handleUiStyleChange = (nextStyle: UiStyle) => {
    setUiStyle(nextStyle);
    saveStoredUiStyle(nextStyle);
    applyUiStyleWithTransition(nextStyle);
    persistCloudPreferences({ uiStyle: nextStyle });
    showToast({
      message:
        nextStyle === 'claymorphism'
          ? 'Gaya UI Claymorphism 3D Diaktifkan'
          : 'Gaya UI Klasik Minimalis Diaktifkan',
      details:
        nextStyle === 'claymorphism'
          ? 'Permukaan lembut membulat dengan kedalaman 3D taktil kini aktif.'
          : 'Tampilan datar ringkas dengan garis tepi tajam kini aktif.',
    });
  };

  const handleSortByChange = (nextSort: SortOption) => {
    setSortBy(nextSort);
    saveStoredSortBy(nextSort);
    persistCloudPreferences({ sortBy: nextSort });
  };

  const handleAppInstalled = useCallback(() => {
    showToast({
      message: 'OneStop Hub Berhasil Diinstall!',
      details: 'Aplikasi kini tersedia di desktop PC atau layar utama HP Anda.',
    });
  }, [showToast]);

  // Change user role
  const handleRoleChanged = (newRole: UserRole) => {
    setCurrentRole(newRole);
    saveStoredRole(newRole);
    showToast({
      message: `Peran berhasil diubah: ${ROLE_CONFIGS[newRole].name}`,
      details: ROLE_CONFIGS[newRole].description,
    });
  };

  // Change card density (small / medium / large)
  const handleDensityChange = (newDensity: CardDensity) => {
    setCardDensity(newDensity);
    saveStoredCardDensity(newDensity);
    persistCloudPreferences({ cardDensity: newDensity });
    showToast({
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
  const handleCompleteJarvisIntro = useCallback(() => {
    setShowJarvisIntro(false);
  }, []);

  const handleToggleJarvisEnabled = (enabled: boolean) => {
    setIsJarvisEnabled(enabled);
    setJarvisIntroEnabled(enabled);
    persistCloudPreferences({ jarvisIntroEnabled: enabled });
    showToast({
      message: enabled ? 'Animasi Pembuka J.A.R.V.I.S. Diaktifkan ⚡' : 'Animasi J.A.R.V.I.S. Dinonaktifkan',
      details: enabled ? 'Intro akan diputar saat membuka aplikasi.' : 'Aplikasi akan langsung membuka dasbor.',
    });
  };

  const handleToggleJarvisAudio = (enabled: boolean) => {
    setIsJarvisAudio(enabled);
    setJarvisAudioEnabled(enabled);
    persistCloudPreferences({ jarvisAudioEnabled: enabled });
    showToast({
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
        setCloudSyncStatus(isOnline ? 'syncing' : 'offline');
        void saveCustomLogoToFirestore(firebaseUser.uid, logo, getCurrentPreferences({ customLogo: logo }))
          .then(() => {
            setCloudSyncStatus(navigator.onLine ? 'synced' : 'offline');
            setLastSyncedAt(Date.now());
          })
          .catch((err) => {
            setCloudError(formatFirestoreErrorForUser(err));
            setCloudSyncStatus('error');
          });
      }
      showToast({
        message: logo ? 'Foto Logo OneStop Hub Engineering Diperbarui' : 'Logo Dikembalikan ke Ikon Bawaan',
        details: logo
          ? 'Logo baru kini tampil pada Header, tab browser, dan J.A.R.V.I.S. HUD.'
          : 'Ikon standar aplikasi telah dipulihkan.',
      });
    } catch (err) {
      showToast({
        message: 'Gagal Menyimpan Foto Logo',
        details: err instanceof Error ? err.message : 'Terjadi kesalahan saat menyimpan ke penyimpanan lokal.',
      });
    }
  };

  // Selecting a specific group automatically activates the circular Orbit Hub display
  const handleSelectGroupFilter = useCallback(
    (groupId: string) => {
      setSelectedGroupFilter(groupId);
      if (groupId !== 'all') {
        setViewMode((prev) => {
          if (prev !== 'orbit') {
            setPreviousViewMode(prev);
          }
          return 'orbit';
        });
      } else {
        const savedMode = getStoredViewMode();
        setViewMode(savedMode === 'orbit' ? 'orbit' : previousViewMode === 'orbit' ? 'grid' : previousViewMode);
      }
    },
    [previousViewMode]
  );

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

  // Save groups
  const updateGroups = (newGroups: ShortcutGroup[]) => {
    const prevGroups = groups;
    setGroups(newGroups);
    saveStoredGroups(newGroups);
    if (firebaseUser) {
      setCloudSyncStatus(isOnline ? 'syncing' : 'offline');
      void syncGroupsToFirestore(firebaseUser.uid, prevGroups, newGroups)
        .then(() => {
          setCloudSyncStatus(navigator.onLine ? 'synced' : 'offline');
          setLastSyncedAt(Date.now());
        })
        .catch((err) => {
          setCloudError(formatFirestoreErrorForUser(err));
          setCloudSyncStatus('error');
        });
    }
  };

  // Launch shortcut
  const handleLaunch = useCallback(
    async (shortcut: ShortcutItem) => {
      const nextClicks = shortcut.clickCount + 1;
      const openedAt = Date.now();
      setShortcuts((prev) => {
        const updated = prev.map((s) =>
          s.id === shortcut.id ? { ...s, clickCount: nextClicks, lastOpened: openedAt } : s
        );
        saveStoredShortcuts(updated);
        return updated;
      });

      if (firebaseUser) {
        void recordShortcutLaunchInFirestore(firebaseUser.uid, shortcut.id, nextClicks, openedAt)
          .then(() => {
            setLastSyncedAt(Date.now());
          })
          .catch((err) => {
            const formatted = formatFirestoreErrorForUser(err);
            if (formatted.isQuota) {
              setCloudError(formatted);
              setCloudSyncStatus('error');
            }
          });
      }

      const result = await launchShortcut(shortcut.url, shortcut.type);

      if (result.actionTaken === 'copied_directory') {
        showToast(
          {
            message: 'Path Direktori Disalin ke Clipboard!',
            details: `${shortcut.url} — Tekan Win + R lalu tempel untuk langsung membuka folder di Windows Explorer.`,
            isDirectory: true,
          },
          5000
        );
      } else {
        showToast(
          {
            message: `Membuka "${shortcut.title}"...`,
            details: shortcut.url,
            isDirectory: false,
          },
          4000
        );
      }
    },
    [firebaseUser, showToast]
  );

  // Open edit shortcut modal
  const handleEditShortcut = useCallback((s: ShortcutItem) => {
    setEditingShortcut(s);
    setIsAddModalOpen(true);
  }, []);

  // Save shortcut (Add / Edit)
  const handleSaveShortcut = (
    data: Partial<ShortcutItem> & { title: string; url: string; groupId: string }
  ) => {
    if (data.id) {
      const target = shortcuts.find((s) => s.id === data.id);
      if (!target) return;
      const editedItem: ShortcutItem = {
        ...target,
        title: data.title,
        url: data.url,
        type: data.type || target.type,
        groupId: data.groupId,
        description: data.description,
        iconType: data.iconType || target.iconType,
        iconValue: data.iconValue || target.iconValue,
        isPinned: data.isPinned !== undefined ? data.isPinned : target.isPinned,
      };
      const updated = shortcuts.map((s) => (s.id === data.id ? editedItem : s));
      setShortcuts(updated);
      saveStoredShortcuts(updated);
      if (firebaseUser) {
        setCloudSyncStatus(isOnline ? 'syncing' : 'offline');
        void updateShortcutInFirestore(firebaseUser.uid, editedItem)
          .then(() => {
            setCloudSyncStatus(navigator.onLine ? 'synced' : 'offline');
            setLastSyncedAt(Date.now());
          })
          .catch((err) => {
            setCloudError(formatFirestoreErrorForUser(err));
            setCloudSyncStatus('error');
          });
      }
    } else {
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
      const updated = [newShortcut, ...shortcuts];
      setShortcuts(updated);
      saveStoredShortcuts(updated);
      if (firebaseUser) {
        setCloudSyncStatus(isOnline ? 'syncing' : 'offline');
        void createShortcutInFirestore(firebaseUser.uid, newShortcut)
          .then(() => {
            setCloudSyncStatus(navigator.onLine ? 'synced' : 'offline');
            setLastSyncedAt(Date.now());
          })
          .catch((err) => {
            setCloudError(formatFirestoreErrorForUser(err));
            setCloudSyncStatus('error');
          });
      }
    }
  };

  // Delete shortcut
  const handleDeleteShortcut = useCallback(
    (id: string) => {
      setShortcuts((prev) => {
        const updated = prev.filter((s) => s.id !== id);
        saveStoredShortcuts(updated);
        return updated;
      });
      if (firebaseUser) {
        setCloudSyncStatus(isOnline ? 'syncing' : 'offline');
        void deleteShortcutFromFirestore(firebaseUser.uid, id)
          .then(() => {
            setCloudSyncStatus(navigator.onLine ? 'synced' : 'offline');
            setLastSyncedAt(Date.now());
          })
          .catch((err) => {
            setCloudError(formatFirestoreErrorForUser(err));
            setCloudSyncStatus('error');
          });
      }
    },
    [firebaseUser, isOnline]
  );

  // Toggle Pin
  const handleTogglePin = useCallback(
    (shortcut: ShortcutItem) => {
      const nextPinned = !shortcut.isPinned;
      setShortcuts((prev) => {
        const updated = prev.map((s) =>
          s.id === shortcut.id ? { ...s, isPinned: nextPinned } : s
        );
        saveStoredShortcuts(updated);
        return updated;
      });
      if (firebaseUser) {
        setCloudSyncStatus(isOnline ? 'syncing' : 'offline');
        void toggleShortcutPinInFirestore(firebaseUser.uid, shortcut.id, nextPinned)
          .then(() => {
            setCloudSyncStatus(navigator.onLine ? 'synced' : 'offline');
            setLastSyncedAt(Date.now());
          })
          .catch((err) => {
            setCloudError(formatFirestoreErrorForUser(err));
            setCloudSyncStatus('error');
          });
      }
    },
    [firebaseUser, isOnline]
  );

  // Duplicate shortcut
  const handleDuplicate = useCallback(
    (shortcut: ShortcutItem) => {
      const duplicated: ShortcutItem = {
        ...shortcut,
        id: `sc-${Date.now()}`,
        title: `${shortcut.title} (Salinan)`,
        clickCount: 0,
        createdAt: Date.now(),
      };
      setShortcuts((prev) => {
        const updated = [duplicated, ...prev];
        saveStoredShortcuts(updated);
        return updated;
      });
      if (firebaseUser) {
        setCloudSyncStatus(isOnline ? 'syncing' : 'offline');
        void createShortcutInFirestore(firebaseUser.uid, duplicated)
          .then(() => {
            setCloudSyncStatus(navigator.onLine ? 'synced' : 'offline');
            setLastSyncedAt(Date.now());
          })
          .catch((err) => {
            setCloudError(formatFirestoreErrorForUser(err));
            setCloudSyncStatus('error');
          });
      }
    },
    [firebaseUser, isOnline]
  );

  // Reassign shortcuts when group is deleted
  const handleReassignShortcuts = (fromGroupId: string, toGroupId: string) => {
    const affectedIds = shortcuts.filter((s) => s.groupId === fromGroupId).map((s) => s.id);
    const updated = shortcuts.map((s) =>
      s.groupId === fromGroupId ? { ...s, groupId: toGroupId } : s
    );
    setShortcuts(updated);
    saveStoredShortcuts(updated);
    if (firebaseUser && affectedIds.length > 0) {
      setCloudSyncStatus(isOnline ? 'syncing' : 'offline');
      void reassignShortcutsGroupInFirestore(firebaseUser.uid, affectedIds, toGroupId)
        .then(() => {
          setCloudSyncStatus(navigator.onLine ? 'synced' : 'offline');
          setLastSyncedAt(Date.now());
        })
        .catch((err) => {
          setCloudError(formatFirestoreErrorForUser(err));
          setCloudSyncStatus('error');
        });
    }
  };

  // Delete group cleanly (reassign or purge shortcuts + reset active filter + sync Firestore)
  const handleDeleteGroup = (
    groupId: string,
    options: { mode: 'reassign' | 'purge'; targetGroupId?: string }
  ) => {
    if (groups.length <= 1) {
      showToast({
        message: 'Tidak Dapat Menghapus Grup Terakhir',
        details: 'Minimal harus ada satu grup kategori di dalam dasbor.',
      });
      return;
    }

    const deletedGroup = groups.find((g) => g.id === groupId);
    const affectedShortcuts = shortcuts.filter((s) => s.groupId === groupId);
    const affectedIds = affectedShortcuts.map((s) => s.id);
    const fallbackGroup = groups.find((g) => g.id !== groupId);
    const targetGroupId =
      options.mode === 'reassign'
        ? options.targetGroupId || fallbackGroup?.id
        : undefined;

    if (options.mode === 'reassign' && targetGroupId) {
      const nextShortcuts = shortcuts.map((s) =>
        s.groupId === groupId ? { ...s, groupId: targetGroupId } : s
      );
      setShortcuts(nextShortcuts);
      saveStoredShortcuts(nextShortcuts);
    } else if (options.mode === 'purge') {
      const nextShortcuts = shortcuts.filter((s) => s.groupId !== groupId);
      setShortcuts(nextShortcuts);
      saveStoredShortcuts(nextShortcuts);
    }

    const nextGroups = groups
      .filter((g) => g.id !== groupId)
      .map((g, idx) => ({ ...g, order: idx + 1 }));
    setGroups(nextGroups);
    saveStoredGroups(nextGroups);

    if (selectedGroupFilter === groupId) {
      handleSelectGroupFilter('all');
    }

    if (firebaseUser) {
      setCloudSyncStatus(isOnline ? 'syncing' : 'offline');
      void deleteGroupInFirestore(
        firebaseUser.uid,
        groupId,
        options.mode,
        affectedIds,
        targetGroupId
      )
        .then(() => {
          setCloudSyncStatus(navigator.onLine ? 'synced' : 'offline');
          setLastSyncedAt(Date.now());
        })
        .catch((err) => {
          setCloudError(formatFirestoreErrorForUser(err));
          setCloudSyncStatus('error');
        });
    }

    const targetGroupName = groups.find((g) => g.id === targetGroupId)?.name;
    showToast({
      message: `Grup "${deletedGroup?.name || 'Kategori'}" Dihapus`,
      details:
        affectedIds.length === 0
          ? 'Kategori grup berhasil dihapus.'
          : options.mode === 'purge'
          ? `${affectedIds.length} pintasan di dalamnya turut dihapus.`
          : `${affectedIds.length} pintasan dipindahkan ke grup "${targetGroupName || 'lainnya'}".`,
    });
  };

  const handleOpenDeleteGroupModal = useCallback((groupId: string) => {
    setDeleteTargetGroupId(groupId);
    setIsManageGroupsOpen(true);
  }, []);

  // Reset to default
  const handleResetDefault = () => {
    resetAllData();
    const freshShortcuts = getStoredShortcuts();
    const freshGroups = getStoredGroups();
    setShortcuts(freshShortcuts);
    setGroups(freshGroups);
    if (firebaseUser) {
      setCloudSyncStatus(isOnline ? 'syncing' : 'offline');
      void replaceWorkspaceDataInFirestore(firebaseUser.uid, DEFAULT_GROUPS, DEFAULT_SHORTCUTS)
        .then(() => {
          setCloudSyncStatus(navigator.onLine ? 'synced' : 'offline');
          setLastSyncedAt(Date.now());
        })
        .catch((err) => {
          setCloudError(formatFirestoreErrorForUser(err));
          setCloudSyncStatus('error');
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
        const groupName = groupById.get(item.groupId)?.name.toLowerCase() || '';
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
  }, [shortcuts, groupById, selectedGroupFilter, selectedTypeFilter, searchQuery, sortBy]);

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
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 flex flex-col font-sans clay-canvas transition-colors">
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
        onOpenManageGroups={() => {
          setDeleteTargetGroupId(null);
          setIsManageGroupsOpen(true);
        }}
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
        cloudSyncStatus={cloudSyncStatus}
        isSigningInGoogle={isSigningInGoogle}
        onSignInGoogle={handleSignInGoogle}
        onOpenCloudSettings={() => {
          setSettingsFocusSection('firebase');
          setIsSettingsOpen(true);
        }}
        onAppInstalled={handleAppInstalled}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Offline PWA Connectivity Banner (inline so it never overlaps cards or footer) */}
        <OfflineIndicator />

        {/* Firebase Cloud / Quota Error Banner */}
        {cloudError && (
          <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/70 rounded-xl p-3 sm:p-3.5 flex items-start justify-between gap-3 text-xs">
            <div className="flex items-start gap-2.5 text-rose-800 dark:text-rose-200 min-w-0">
              <CloudAlert className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="font-semibold break-words">{cloudError.message}</p>
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
              className="p-1 text-rose-500 hover:text-rose-700 dark:hover:text-rose-300 rounded shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        {/* Role Notification Banner for Viewer or Lead */}
        {currentRole === 'viewer' && (
          <div className="bg-gradient-to-r from-sky-50/90 via-indigo-50/75 to-violet-50/85 dark:from-sky-950/35 dark:via-indigo-950/30 dark:to-violet-950/30 border border-indigo-200/80 dark:border-indigo-800/50 rounded-xl p-3 sm:p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 sm:gap-3 text-xs clay-surface">
            <div className="flex items-start sm:items-center gap-2 text-slate-700 dark:text-slate-200 min-w-0">
              <Eye className="w-4 h-4 text-indigo-500 dark:text-indigo-400 shrink-0 mt-0.5 sm:mt-0" />
              <span>
                <strong>Akses Viewer (Hanya Lihat):</strong> Anda dapat mencari, membuka pintasan, dan menyalin path folder. Tidak dapat menambah atau menghapus data.
              </span>
            </div>
            <button
              onClick={() => setIsRoleSwitchOpen(true)}
              className="px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-lg shrink-0 transition-all shadow-xs whitespace-nowrap clay-btn-primary"
            >
              Masuk (Lead/Manager)
            </button>
          </div>
        )}

        {currentRole === 'lead' && (
          <div className="bg-gradient-to-r from-amber-50/90 via-orange-50/70 to-rose-50/60 dark:from-amber-950/35 dark:via-orange-950/25 dark:to-rose-950/20 border border-amber-200/90 dark:border-amber-800/60 rounded-xl p-3 sm:p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 sm:gap-3 text-xs clay-surface">
            <div className="flex items-start sm:items-center gap-2 text-amber-900 dark:text-amber-200 min-w-0">
              <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
              <span>
                <strong>Akses Lead Engineering:</strong> Diizinkan menambah dan mengedit pintasan/grup, <em>tetapi fitur hapus dinonaktifkan</em>.
              </span>
            </div>
            <button
              onClick={() => setIsRoleSwitchOpen(true)}
              className="px-2.5 py-1.5 text-xs font-medium text-amber-800 dark:text-amber-200 bg-amber-100/90 dark:bg-amber-900/50 hover:bg-amber-200 dark:hover:bg-amber-800/60 rounded-lg shrink-0 transition-colors whitespace-nowrap clay-btn-soft"
            >
              Ganti Peran
            </button>
          </div>
        )}

        {/* Toast Notification Bar */}
        {toast && (
          <div className="bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 text-white p-3 sm:p-4 rounded-xl shadow-[0_10px_28px_rgba(99,102,241,0.3)] flex items-start justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-200" />
              <div>
                <p className="text-sm font-semibold">{toast.message}</p>
                {toast.details && (
                  <p className="text-xs text-indigo-100 mt-0.5 font-mono">{toast.details}</p>
                )}
              </div>
            </div>
            <button
              onClick={dismissToast}
              className="p-1 text-white/80 hover:text-white rounded"
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
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 shadow-xs clay-surface transition-colors space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input with Ctrl+K trigger */}
            <div className="relative flex-1 min-w-0">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari pintasan web, alamat Drive D:, atau catatan..."
                className={`w-full pl-9 ${searchQuery ? 'pr-16 sm:pr-24' : 'pr-4 sm:pr-16'} py-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 clay-inset transition-all`}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label="Bersihkan pencarian"
                    className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsCommandPaletteOpen(true)}
                  className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-700 text-[10px] font-mono text-neutral-600 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors"
                  title="Buka Command Palette"
                >
                  <Command className="w-3 h-3" />
                  <span>K</span>
                </button>
              </div>
            </div>

            {/* View Mode & Sort Switches */}
            <div className="flex flex-wrap items-center gap-2 justify-between sm:justify-end">
              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => handleSortByChange(e.target.value as SortOption)}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 clay-inset"
              >
                <option value="clicks">Paling Sering Digunakan</option>
                <option value="recent">Baru Saja Dibuka</option>
                <option value="name">Urutkan Abjad (A-Z)</option>
              </select>

              {/* Card Density Switcher (Visible in grid and sections mode) */}
              {(viewMode === 'grid' || viewMode === 'sections') && (
                <div
                  className="flex items-center gap-0.5 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-xs clay-inset"
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
              <div className="flex items-center gap-1 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg clay-inset">
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
                      ? 'bg-white dark:bg-neutral-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
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
                      ? 'bg-white dark:bg-neutral-900 text-violet-600 dark:text-violet-400 shadow-2xs'
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
                      ? 'bg-white dark:bg-neutral-900 text-cyan-600 dark:text-cyan-400 shadow-2xs'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              {/* UI Style Quick Toggle Button (Claymorphism / Klasik) */}
              <button
                type="button"
                onClick={() => handleUiStyleChange(uiStyle === 'claymorphism' ? 'classic' : 'claymorphism')}
                title={
                  uiStyle === 'claymorphism'
                    ? 'Gaya Claymorphism 3D aktif. Klik untuk beralih ke Klasik Minimalis.'
                    : 'Gaya Klasik Minimalis aktif. Klik untuk mengaktifkan Claymorphism 3D.'
                }
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  uiStyle === 'claymorphism'
                    ? 'border-fuchsia-300/80 dark:border-fuchsia-700/70 bg-gradient-to-r from-indigo-50 via-violet-50 to-fuchsia-50 dark:from-indigo-950/60 dark:via-violet-950/50 dark:to-fuchsia-950/50 text-violet-700 dark:text-fuchsia-300 clay-btn-soft'
                    : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                <Layers className={`w-3.5 h-3.5 ${uiStyle === 'claymorphism' ? 'text-fuchsia-500 dark:text-fuchsia-400' : 'text-indigo-500 dark:text-indigo-400'}`} />
                <span className="hidden sm:inline">{uiStyle === 'claymorphism' ? 'Clay 3D' : 'Klasik'}</span>
              </button>

              {/* Settings Modal Button in Toolbar */}
              <button
                type="button"
                onClick={() => setIsSettingsOpen(true)}
                title="Buka Pengaturan Tampilan & Densitas"
                className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors clay-btn-soft"
              >
                <Sliders className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Group Category Filter Tabs (Zero-pill button styling) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 pt-0.5 text-xs">
            <button
              type="button"
              onClick={() => handleSelectGroupFilter('all')}
              className={`px-3 py-1.5 font-medium rounded-lg whitespace-nowrap transition-all ${
                selectedGroupFilter === 'all'
                  ? 'bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 text-white shadow-[0_6px_16px_rgba(99,102,241,0.34)] clay-btn-primary'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 clay-btn-soft'
              }`}
            >
              Semua Grup ({shortcuts.length})
            </button>

            {groups.map((group) => {
              const count = groupShortcutCounts.get(group.id) || 0;
              const isSelected = selectedGroupFilter === group.id;
              const colorTheme = getGroupColorTheme(group.color);
              return (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => handleSelectGroupFilter(group.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 font-medium rounded-lg whitespace-nowrap transition-all ${
                    isSelected
                      ? `${colorTheme.activeTab} font-semibold`
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 clay-btn-soft'
                  }`}
                >
                  <DynamicIcon
                    name={group.icon}
                    className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : colorTheme.inactiveTabIcon}`}
                  />
                  <span>{group.name}</span>
                  <span className="tabular-nums font-mono opacity-85">({count})</span>
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => {
                setDeleteTargetGroupId(null);
                setIsManageGroupsOpen(true);
              }}
              title="Tambah, Edit, atau Hapus Grup"
              className="flex items-center gap-1 px-2.5 py-1.5 font-medium rounded-lg whitespace-nowrap bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-violet-50 dark:hover:bg-violet-950/50 hover:text-violet-700 dark:hover:text-violet-300 border border-dashed border-violet-300/80 dark:border-violet-700/60 transition-colors shrink-0 clay-btn-soft"
            >
              <Settings2 className="w-3.5 h-3.5 text-violet-500 dark:text-violet-400" />
              <span>Kelola Grup</span>
            </button>

            {/* Quick Type filter separator */}
            <div className="h-4 w-px bg-neutral-300 dark:bg-neutral-700 mx-1 shrink-0" />

            <button
              type="button"
              onClick={() => setSelectedTypeFilter(selectedTypeFilter === 'directory' ? 'all' : 'directory')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 font-medium rounded-lg whitespace-nowrap transition-colors ${
                selectedTypeFilter === 'directory'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white clay-btn-emerald'
                  : 'text-neutral-700 dark:text-neutral-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 clay-btn-soft'
              }`}
            >
              <HardDrive className={`w-3.5 h-3.5 ${selectedTypeFilter === 'directory' ? 'text-white' : 'text-emerald-500 dark:text-emerald-400'}`} />
              <span>Hanya Drive Lokal ({stats.directoryCount})</span>
            </button>
          </div>
        </div>

        {/* 5. Shortcuts Display Views */}

        {/* Empty state */}
        {filteredShortcuts.length === 0 && (viewMode !== 'orbit' || searchQuery.trim().length > 0) ? (
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-12 text-center shadow-xs clay-surface">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-100 via-violet-100 to-fuchsia-100 dark:from-indigo-900/50 dark:via-violet-900/50 dark:to-fuchsia-900/40 text-indigo-600 dark:text-indigo-300 flex items-center justify-center mx-auto mb-3 clay-icon-well">
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
                  className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 hover:from-indigo-500 hover:via-violet-500 hover:to-fuchsia-500 text-white shadow-xs clay-btn-primary"
                >
                  + Tambah Pintasan Baru
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsRoleSwitchOpen(true)}
                  className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-xs clay-btn-primary"
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
            canDeleteGroup={permissions.canDeleteGroup}
            onRequestDeleteGroup={handleOpenDeleteGroupModal}
            onLaunch={handleLaunch}
            onEdit={handleEditShortcut}
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
                const colorTheme = getGroupColorTheme(group.color);

                return (
                  <section
                    key={group.id}
                    className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 sm:p-5 shadow-xs clay-surface transition-colors"
                  >
                    {/* Group Header */}
                    <div className={`flex items-start sm:items-center justify-between gap-3 px-3 py-2.5 -mx-1 mb-4 rounded-xl border-b border-neutral-100 dark:border-neutral-800 ${colorTheme.sectionGlow}`}>
                      <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                        <div className={`w-9 h-9 rounded-xl border flex items-center justify-center overflow-hidden shrink-0 clay-icon-well ${isImageIcon(group.icon) ? 'bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700' : colorTheme.iconBg}`}>
                          {isImageIcon(group.icon) ? (
                            <img src={group.icon} alt={group.name} className="w-full h-full object-cover" />
                          ) : (
                            <DynamicIcon name={group.icon} className={`w-4 h-4 ${colorTheme.iconText}`} />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                            <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 break-words">
                              {group.name}
                            </h2>
                            <span className={`text-xs tabular-nums font-mono font-medium whitespace-nowrap ${colorTheme.text}`}>
                              · {groupItems.length} pintasan
                            </span>
                          </div>
                          {group.description && (
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-2">
                              {group.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {permissions.canAddShortcut && (
                          <button
                            type="button"
                            onClick={() => handleOpenAddWithGroup(group.id, group.id.includes('drive') ? 'directory' : 'web')}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors whitespace-nowrap"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Tambah ke Grup Ini</span>
                          </button>
                        )}
                        {permissions.canDeleteGroup && groups.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleOpenDeleteGroupModal(group.id)}
                            title={`Hapus grup ${group.name}`}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors whitespace-nowrap"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Hapus Grup</span>
                          </button>
                        )}
                      </div>
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
                            onEdit={handleEditShortcut}
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
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xs clay-surface">
            <div className="px-4 py-3 rounded-t-xl bg-gradient-to-r from-indigo-50/75 via-sky-50/45 to-fuchsia-50/40 dark:from-indigo-950/35 dark:via-neutral-800/60 dark:to-fuchsia-950/25 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-3 sm:gap-4 text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              <div className="flex-1 min-w-0">Nama Layanan & Kategori</div>
              <div className="hidden md:block flex-1 min-w-[200px]">URL / Alamat Direktori</div>
              <div className="hidden lg:block flex-1 min-w-[180px]">Deskripsi</div>
              <div className="hidden sm:block w-16 text-right shrink-0">Penggunaan</div>
              <div className="w-24 text-right shrink-0">Aksi</div>
            </div>
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {filteredShortcuts.map((item) => {
                const group = groupById.get(item.groupId);
                return (
                  <ShortcutListItem
                    key={item.id}
                    shortcut={item}
                    group={group}
                    canEditShortcut={permissions.canEditShortcut}
                    canDeleteShortcut={permissions.canDeleteShortcut}
                    onLaunch={handleLaunch}
                    onEdit={handleEditShortcut}
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
              const group = groupById.get(item.groupId);
              return (
                <ShortcutCard
                  key={item.id}
                  shortcut={item}
                  group={group}
                  density={cardDensity}
                  canEditShortcut={permissions.canEditShortcut}
                  canDeleteShortcut={permissions.canDeleteShortcut}
                  onLaunch={handleLaunch}
                  onEdit={handleEditShortcut}
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
      <footer className="mt-auto border-t border-neutral-200 dark:border-neutral-800 bg-white/60 dark:bg-neutral-900/60 py-4 clay-footer transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-neutral-500 dark:text-neutral-400">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-2 gap-y-1">
            <span className="font-bold bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 dark:from-indigo-400 dark:via-violet-400 dark:to-pink-400 bg-clip-text text-transparent">
              OneStop Hub Engineering
            </span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums font-mono whitespace-nowrap">{stats.total} Total Pintasan</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums font-mono whitespace-nowrap">{stats.directoryCount} Direktori Drive</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums font-mono whitespace-nowrap">{stats.totalClicks} Total Akses</span>
          </div>

          <div className="flex flex-wrap items-center justify-center md:justify-end gap-x-4 gap-y-1.5">
            <button
              onClick={() => setIsRoleSwitchOpen(true)}
              className="flex items-center gap-1.5 hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors font-medium text-neutral-600 dark:text-neutral-300 whitespace-nowrap"
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
              className="hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors whitespace-nowrap"
            >
              Pengaturan Tampilan
            </button>
            <button
              onClick={() => setIsHelpModalOpen(true)}
              className="hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors whitespace-nowrap"
            >
              Panduan Direktori Drive D:
            </button>
            <button
              onClick={() => setIsBackupModalOpen(true)}
              className="hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors whitespace-nowrap"
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
        onClose={() => {
          setIsManageGroupsOpen(false);
          setDeleteTargetGroupId(null);
        }}
        groups={groups}
        shortcuts={shortcuts}
        canManageGroups={permissions.canManageGroups}
        canDeleteGroup={permissions.canDeleteGroup}
        initialDeleteGroupId={deleteTargetGroupId}
        onSaveGroups={updateGroups}
        onReassignShortcuts={handleReassignShortcuts}
        onDeleteGroup={handleDeleteGroup}
        onOpenRoleSwitch={() => setIsRoleSwitchOpen(true)}
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
            setCloudSyncStatus(isOnline ? 'syncing' : 'offline');
            void replaceWorkspaceDataInFirestore(firebaseUser.uid, restoredGroups, restoredShortcuts)
              .then(() => {
                setCloudSyncStatus(navigator.onLine ? 'synced' : 'offline');
                setLastSyncedAt(Date.now());
              })
              .catch((err) => {
                setCloudError(formatFirestoreErrorForUser(err));
                setCloudSyncStatus('error');
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
        uiStyle={uiStyle}
        onUiStyleChange={handleUiStyleChange}
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
        cloudSyncStatus={cloudSyncStatus}
        lastSyncedAt={lastSyncedAt}
        isSigningInGoogle={isSigningInGoogle}
        onSignInGoogle={handleSignInGoogle}
        onSignOutGoogle={handleSignOutGoogle}
        onSyncLocalToCloud={handleSyncLocalToCloud}
        onAppInstalled={handleAppInstalled}
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
