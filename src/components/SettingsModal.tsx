import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Sliders,
  Grid3X3,
  LayoutGrid,
  Maximize2,
  Minimize2,
  Columns,
  Monitor,
  Moon,
  Sun,
  ShieldCheck,
  HardDrive,
  Check,
  Zap,
  Play,
  Volume2,
  VolumeX,
  Image as ImageIcon,
  Upload,
  RotateCcw,
  Layers,
  Link2,
  Lock,
  Orbit,
  Cloud,
  CloudAlert,
  Copy,
  LogIn,
  LogOut,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { CardDensity, ViewMode, UserRole, CustomLogoConfig, LogoFitMode, UiStyle } from '../types';
import { ROLE_CONFIGS } from '../services/auth';
import { processLogoImageFile } from '../utils/imageHelper';
import {
  FIREBASE_PROJECT_ID,
  FIREBASE_APP_ID,
  FIREBASE_DATABASE_ID,
  FIREBASE_DATABASE_URL,
  FIREBASE_CONSOLE_URL,
  FIREBASE_UPGRADE_URL,
} from '../firebase';
import { PWAInstallButton } from './PWAInstallButton';
import type { CloudSyncStatus } from './Header';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  density: CardDensity;
  onDensityChange: (density: CardDensity) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  uiStyle?: UiStyle;
  onUiStyleChange?: (style: UiStyle) => void;
  currentRole: UserRole;
  onOpenRoleSwitch: () => void;
  totalShortcutsCount: number;
  isJarvisEnabled: boolean;
  onToggleJarvisEnabled: (enabled: boolean) => void;
  isJarvisAudioEnabled: boolean;
  onToggleJarvisAudio: (enabled: boolean) => void;
  onPlayJarvisIntro: () => void;
  customLogo: CustomLogoConfig | null;
  onSaveCustomLogo: (logo: CustomLogoConfig | null) => void;
  canEditLogo?: boolean;
  initialFocusSection?: 'logo' | 'firebase' | null;
  firebaseUser?: User | null;
  cloudSyncStatus?: CloudSyncStatus;
  lastSyncedAt?: number | null;
  cloudError?: { message: string; isQuota?: boolean; code?: string } | null;
  onClearCloudError?: () => void;
  isSigningInGoogle?: boolean;
  isRefreshingCloud?: boolean;
  onSignInGoogle?: () => void;
  onSignOutGoogle?: () => void;
  onSyncLocalToCloud?: () => void;
  onRefreshFromCloud?: () => void;
  onAppInstalled?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  density,
  onDensityChange,
  viewMode,
  onViewModeChange,
  theme,
  onToggleTheme,
  uiStyle = 'claymorphism',
  onUiStyleChange,
  currentRole,
  onOpenRoleSwitch,
  totalShortcutsCount,
  isJarvisEnabled,
  onToggleJarvisEnabled,
  isJarvisAudioEnabled,
  onToggleJarvisAudio,
  onPlayJarvisIntro,
  customLogo,
  onSaveCustomLogo,
  canEditLogo = true,
  initialFocusSection = null,
  firebaseUser = null,
  cloudSyncStatus = 'local',
  lastSyncedAt = null,
  cloudError = null,
  onClearCloudError,
  isSigningInGoogle = false,
  isRefreshingCloud = false,
  onSignInGoogle,
  onSignOutGoogle,
  onSyncLocalToCloud,
  onRefreshFromCloud,
  onAppInstalled,
}) => {
  const [logoUrlInput, setLogoUrlInput] = useState('');
  const [logoError, setLogoError] = useState<string | null>(null);
  const [isProcessingLogo, setIsProcessingLogo] = useState(false);
  const [previewImgError, setPreviewImgError] = useState(false);
  const [copiedHost, setCopiedHost] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoSectionRef = useRef<HTMLDivElement>(null);
  const firebaseSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setLogoError(null);
      setPreviewImgError(false);
      if (customLogo?.src && !customLogo.src.startsWith('data:')) {
        setLogoUrlInput(customLogo.src);
      } else {
        setLogoUrlInput('');
      }
      if (initialFocusSection === 'logo') {
        setTimeout(() => {
          logoSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 60);
      } else if (initialFocusSection === 'firebase') {
        setTimeout(() => {
          firebaseSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 60);
      }
    }
  }, [isOpen, customLogo, initialFocusSection]);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoError(null);
    setIsProcessingLogo(true);
    try {
      let dataUrl = await processLogoImageFile(file, 256);
      if (dataUrl.length > 250000) {
        dataUrl = await processLogoImageFile(file, 160);
      }
      if (dataUrl.length > 250000) {
        setLogoError('Ukuran foto logo terlalu besar untuk Firestore (maksimal 250KB). Pilih gambar yang lebih kecil.');
        return;
      }
      setPreviewImgError(false);
      setLogoUrlInput('');
      onSaveCustomLogo({
        src: dataUrl,
        fit: customLogo?.fit || 'cover',
      });
    } catch (err) {
      setLogoError(err instanceof Error ? err.message : 'Gagal memproses foto logo.');
    } finally {
      setIsProcessingLogo(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleApplyLogoUrl = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = logoUrlInput.trim();
    if (!trimmed) {
      setLogoError('Masukkan URL gambar yang valid.');
      return;
    }
    if (!/^https?:\/\//i.test(trimmed) && !trimmed.startsWith('data:image/')) {
      setLogoError('URL harus diawali http:// atau https://');
      return;
    }
    if (trimmed.length > 250000) {
      setLogoError('URL foto terlalu panjang (maksimal 250KB).');
      return;
    }
    setLogoError(null);
    setPreviewImgError(false);
    onSaveCustomLogo({
      src: trimmed,
      fit: customLogo?.fit || 'cover',
    });
  };

  const handleChangeFitMode = (fit: LogoFitMode) => {
    if (!customLogo?.src) return;
    onSaveCustomLogo({
      src: customLogo.src,
      fit,
    });
  };

  const densityOptions: {
    id: CardDensity;
    title: string;
    subtitle: string;
    columnsDesc: string;
    icon: React.ReactNode;
    features: string[];
  }[] = [
    {
      id: 'small',
      title: 'Kompak (Small)',
      subtitle: 'Maksimum kapasitas layar',
      columnsDesc: 'Hingga 6 kolom kartu',
      icon: <Minimize2 className="w-5 h-5 text-indigo-500" />,
      features: [
        'Grid 5-6 kolom pada layar lebar',
        'Ukuran ikon dan padding diperkecil',
        'Cocok untuk melihat 30-50+ pintasan sekaligus',
      ],
    },
    {
      id: 'medium',
      title: 'Standar (Medium)',
      subtitle: 'Keseimbangan kenyamanan visual',
      columnsDesc: '3-4 kolom kartu',
      icon: <LayoutGrid className="w-5 h-5 text-indigo-500" />,
      features: [
        'Grid 3-4 kolom responsif',
        'Padding seimbang dengan deskripsi 2 baris',
        'Format default yang nyaman untuk sehari-hari',
      ],
    },
    {
      id: 'large',
      title: 'Leluasa (Large)',
      subtitle: 'Ruang baca lega & deskripsi penuh',
      columnsDesc: '2-3 kolom kartu',
      icon: <Maximize2 className="w-5 h-5 text-indigo-500" />,
      features: [
        'Grid 2-3 kolom lega',
        'Ikon besar dengan preview deskripsi 3 baris',
        'Mudah diklik dan dibaca dari jarak jauh',
      ],
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl clay-modal transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                Pengaturan Tampilan & Dasbor
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Sesuaikan densitas kartu, mode tata letak, dan preferensi aplikasi
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-6">
          {/* SECTION 0: Logo Aplikasi (Foto Kustom) */}
          <div ref={logoSectionRef}>
            <div className="flex flex-wrap items-start sm:items-center justify-between gap-2.5 mb-3">
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Logo OneStop Hub (Foto Kustom)</span>
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Ganti logo bawaan dengan foto atau gambar pilihan Anda. Tampil di Header, Orbit Hub, tab browser, dan J.A.R.V.I.S. HUD.
                </p>
              </div>
              {customLogo?.src && canEditLogo && (
                <button
                  type="button"
                  onClick={() => {
                    setLogoUrlInput('');
                    setLogoError(null);
                    onSaveCustomLogo(null);
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:text-rose-600 dark:hover:text-rose-400 bg-neutral-100 dark:bg-neutral-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg border border-neutral-200 dark:border-neutral-700 transition-colors shrink-0"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Default</span>
                </button>
              )}
            </div>

            <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-850/60 space-y-4 clay-subcard">
              {/* Live Header Preview & Upload Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Preview Badge */}
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xs">
                  {customLogo?.src && !previewImgError ? (
                    <div className="w-11 h-11 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 overflow-hidden flex items-center justify-center shrink-0">
                      <img
                        src={customLogo.src}
                        alt="Pratinjau Logo"
                        onError={() => setPreviewImgError(true)}
                        className={`w-full h-full ${
                          customLogo.fit === 'contain' ? 'object-contain p-0.5' : 'object-cover'
                        }`}
                      />
                    </div>
                  ) : (
                    <div className="w-11 h-11 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
                      <Layers className="w-6 h-6" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-neutral-900 dark:text-neutral-100 truncate">
                      OneStop Hub Engineering
                    </div>
                    <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      {customLogo?.src && !previewImgError
                        ? 'Foto logo kustom aktif'
                        : 'Menggunakan ikon bawaan'}
                    </div>
                  </div>
                </div>

                {/* Upload Photo Action */}
                {canEditLogo ? (
                  <div className="flex items-center gap-2 shrink-0">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      disabled={isProcessingLogo}
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 rounded-lg shadow-xs transition-colors cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isProcessingLogo ? 'Memproses Foto...' : 'Pilih Foto dari Perangkat'}</span>
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenRoleSwitch();
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-xs font-semibold text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition-colors cursor-pointer shrink-0"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Beralih ke Lead/Manager untuk Ganti Foto</span>
                  </button>
                )}
              </div>

              {/* URL Input & Fit Mode Controls */}
              {canEditLogo && (
                <div className="space-y-3 pt-2 border-t border-neutral-200/70 dark:border-neutral-800">
                  <form onSubmit={handleApplyLogoUrl} className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <Link2 className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                      <input
                        type="url"
                        value={logoUrlInput}
                        onChange={(e) => setLogoUrlInput(e.target.value)}
                        placeholder="Atau tempel URL foto/gambar (https://...)"
                        className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 transition-colors shrink-0"
                    >
                      Pakai URL
                    </button>
                  </form>

                  {/* Fit mode selector when custom logo exists */}
                  {customLogo?.src && (
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="text-neutral-600 dark:text-neutral-400">
                        Proporsi Bingkai Foto:
                      </span>
                      <div className="inline-flex p-0.5 rounded-lg bg-neutral-200/70 dark:bg-neutral-800">
                        <button
                          type="button"
                          onClick={() => handleChangeFitMode('cover')}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                            customLogo.fit === 'cover'
                              ? 'bg-white dark:bg-neutral-900 text-indigo-600 dark:text-indigo-400 shadow-2xs font-semibold'
                              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                          }`}
                        >
                          Penuh / Crop (Foto)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleChangeFitMode('contain')}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                            customLogo.fit === 'contain'
                              ? 'bg-white dark:bg-neutral-900 text-indigo-600 dark:text-indigo-400 shadow-2xs font-semibold'
                              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                          }`}
                        >
                          Pas Utuh (Logo PNG)
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {logoError && (
                <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                  {logoError}
                </p>
              )}

              {previewImgError && customLogo?.src && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Gambar dari URL tersebut tidak dapat dimuat. Pastikan tautan mengarah langsung ke file gambar publik.
                </p>
              )}
            </div>
          </div>

          <div className="border-t border-neutral-100 dark:border-neutral-800" />

          {/* SECTION 1: Densitas Kartu Grid */}
          <div>
            <div className="flex flex-wrap items-start sm:items-center justify-between gap-2.5 mb-3">
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                  <Grid3X3 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span>Densitas Kartu Pintasan (Grid Mode)</span>
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Pilih ukuran tampilan kartu untuk mengatur berapa banyak pintasan yang tampak di layar.
                </p>
              </div>
              <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 whitespace-nowrap shrink-0">
                Aktif: {density === 'small' ? 'Kompak (S)' : density === 'medium' ? 'Standar (M)' : 'Leluasa (L)'}
              </span>
            </div>

            {/* 3 Density Selection Tiles */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {densityOptions.map((opt) => {
                const isSelected = density === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onDensityChange(opt.id)}
                    className={`text-left p-3.5 rounded-xl border transition-all duration-150 flex flex-col justify-between relative group ${
                      isSelected
                        ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 ring-1 ring-indigo-600 dark:ring-indigo-500'
                        : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-850/50 hover:bg-neutral-100/70 dark:hover:bg-neutral-800/70'
                    }`}
                  >
                    {/* Top Row: Icon + Checkmark */}
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="p-2 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80 shadow-2xs">
                        {opt.icon}
                      </div>
                      {isSelected ? (
                        <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-neutral-300 dark:border-neutral-600 group-hover:border-indigo-400" />
                      )}
                    </div>

                    {/* Titles */}
                    <div>
                      <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                        {opt.title}
                      </h4>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono mt-0.5">
                        {opt.columnsDesc}
                      </p>
                      <p className="text-[11px] text-neutral-600 dark:text-neutral-300 mt-1.5 leading-snug">
                        {opt.subtitle}
                      </p>
                    </div>

                    {/* Visual Card Representation Wireframe */}
                    <div className="mt-3 pt-2.5 border-t border-neutral-200/60 dark:border-neutral-750/60 w-full">
                      <div
                        className={`bg-white dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700 flex flex-col justify-between ${
                          opt.id === 'small'
                            ? 'p-1.5 h-12'
                            : opt.id === 'medium'
                            ? 'p-2 h-16'
                            : 'p-2.5 h-20'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <div
                            className={`rounded bg-indigo-500/20 shrink-0 ${
                              opt.id === 'small' ? 'w-3.5 h-3.5' : opt.id === 'medium' ? 'w-5 h-5' : 'w-6 h-6'
                            }`}
                          />
                          <div className="space-y-1 flex-1 min-w-0">
                            <div className="h-1.5 bg-neutral-300 dark:bg-neutral-600 rounded w-3/4" />
                            <div className="h-1 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2" />
                          </div>
                        </div>
                        {opt.id !== 'small' && (
                          <div className="h-1 bg-neutral-200 dark:bg-neutral-700 rounded w-full mt-1" />
                        )}
                        <div className="flex items-center justify-between pt-1">
                          <div className="h-1 bg-neutral-200 dark:bg-neutral-700 rounded w-1/4" />
                          <div className="h-2 bg-indigo-500/30 rounded w-2/5" />
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-t border-neutral-100 dark:border-neutral-800" />

          {/* SECTION 2: Mode Tampilan Utama */}
          <div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2 mb-1">
              <Columns className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Tata Letak Halaman (View Mode)</span>
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3">
              Format tampilan default saat menjelajahi daftar layanan dan direktori.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => onViewModeChange('grid')}
                className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-colors ${
                  viewMode === 'grid'
                    ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/30 ring-1 ring-indigo-600 dark:ring-indigo-500'
                    : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
                }`}
              >
                <LayoutGrid className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                    Grid Fleksibel
                  </h4>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Kartu interaktif dengan densitas yang dapat disesuaikan.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => onViewModeChange('orbit')}
                className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-colors ${
                  viewMode === 'orbit'
                    ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 ring-1 ring-amber-500'
                    : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
                }`}
              >
                <Orbit className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                    Melingkar (Orbit Hub)
                  </h4>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Ikon pintasan melingkar mengelilingi pusat grup (aktif otomatis saat pilih grup).
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => onViewModeChange('sections')}
                className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-colors ${
                  viewMode === 'sections'
                    ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/30 ring-1 ring-indigo-600 dark:ring-indigo-500'
                    : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
                }`}
              >
                <Grid3X3 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                    Berdasarkan Grup
                  </h4>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Dikelompokkan rapi per kategori folder & kerja.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => onViewModeChange('list')}
                className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-colors ${
                  viewMode === 'list'
                    ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/30 ring-1 ring-indigo-600 dark:ring-indigo-500'
                    : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
                }`}
              >
                <Columns className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                    Tabel Rapat (List)
                  </h4>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Baris tabular untuk penelusuran cepat teks & URL.
                  </p>
                </div>
              </button>
            </div>
          </div>

          <div className="border-t border-neutral-100 dark:border-neutral-800" />

          {/* SECTION: Animasi Pembuka J.A.R.V.I.S. (Startup HUD) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-cyan-500" />
                  <span>Animasi Pembuka J.A.R.V.I.S. (Startup HUD)</span>
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Pengalaman pembuka sinematik holografik dengan rotasi arc reactor dan diagnostik real-time saat aplikasi dimuat.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-cyan-500/30 dark:border-cyan-500/20 bg-gradient-to-r from-cyan-950/20 via-neutral-900/40 to-indigo-950/20 dark:from-cyan-950/40 dark:via-neutral-900/60 dark:to-indigo-950/40 space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-400/50 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.35)] shrink-0">
                    <Zap className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                      J.A.R.V.I.S. Engineering HUD
                    </h4>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                      {isJarvisEnabled
                        ? 'Aktif — Animasi diputar saat membuka aplikasi atau me-refresh'
                        : 'Nonaktif — Langsung menuju dasbor utama'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onPlayJarvisIntro();
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Putar Ulang Sekarang</span>
                  </button>
                </div>
              </div>

              {/* Toggles Strip */}
              <div className="pt-2 border-t border-neutral-200/50 dark:border-neutral-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                {/* Enable / Disable Intro */}
                <label className="flex items-center gap-2 cursor-pointer select-none text-neutral-700 dark:text-neutral-300">
                  <input
                    type="checkbox"
                    checked={isJarvisEnabled}
                    onChange={(e) => onToggleJarvisEnabled(e.target.checked)}
                    className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 border-neutral-300 dark:border-neutral-700"
                  />
                  <span>Tampilkan Intro saat Buka Aplikasi</span>
                </label>

                {/* Audio Effects Toggle */}
                <button
                  type="button"
                  onClick={() => onToggleJarvisAudio(!isJarvisAudioEnabled)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                    isJarvisAudioEnabled
                      ? 'border-cyan-500/40 bg-cyan-950/30 text-cyan-600 dark:text-cyan-300'
                      : 'border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 text-neutral-500'
                  }`}
                >
                  {isJarvisAudioEnabled ? (
                    <>
                      <Volume2 className="w-3.5 h-3.5 text-cyan-500" />
                      <span>Efek Suara: Aktif</span>
                    </>
                  ) : (
                    <>
                      <VolumeX className="w-3.5 h-3.5" />
                      <span>Efek Suara: Hening</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="border-t border-neutral-100 dark:border-neutral-800" />

          {/* SECTION 3: Tema & Akses Keamanan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Theme Info Tile */}
            <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-850/50 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center text-neutral-700 dark:text-neutral-200 shrink-0">
                  {theme === 'dark' ? <Moon className="w-4 h-4 text-amber-400" /> : <Sun className="w-4 h-4 text-indigo-500" />}
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                    Mode Tema
                  </h4>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    {theme === 'dark' ? 'Mode Gelap aktif' : 'Mode Terang aktif'} (Transisi halus)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onToggleTheme}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 transition-colors shadow-2xs whitespace-nowrap shrink-0"
              >
                Ganti Tema
              </button>
            </div>

            {/* Role Info Tile */}
            <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-850/50 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate">
                    Peran: {ROLE_CONFIGS[currentRole].name}
                  </h4>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    {currentRole === 'viewer'
                      ? 'Hanya Lihat'
                      : currentRole === 'lead'
                      ? 'Edit & Tambah (Tanpa Hapus)'
                      : 'Akses Penuh'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenRoleSwitch();
                }}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-2xs whitespace-nowrap shrink-0"
              >
                Ubah Peran
              </button>
            </div>
          </div>

          <div className="border-t border-neutral-100 dark:border-neutral-800" />

          {/* SECTION 3.5: Gaya Desain Antarmuka (Claymorphism vs Klasik) */}
          {onUiStyleChange && (
            <>
              <div>
                <div className="flex flex-wrap items-start sm:items-center justify-between gap-2.5 mb-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      <span>Gaya Desain Antarmuka (UI Style)</span>
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                      Pilih tampilan Claymorphism 3D lembut yang taktil atau Klasik Minimalis yang ringkas.
                    </p>
                  </div>
                  <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 whitespace-nowrap shrink-0">
                    {uiStyle === 'claymorphism' ? 'Claymorphism 3D' : 'Klasik Minimalis'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => onUiStyleChange('claymorphism')}
                    className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between gap-3 cursor-pointer ${
                      uiStyle === 'claymorphism'
                        ? 'border-indigo-600 dark:border-indigo-400 bg-indigo-50/60 dark:bg-indigo-950/35 ring-1 ring-indigo-600 dark:ring-indigo-400 clay-subcard'
                        : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-850/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                        Claymorphism 3D
                      </span>
                      {uiStyle === 'claymorphism' && (
                        <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                          <Check className="w-3 h-3 stroke-[2.5]" />
                        </span>
                      )}
                    </div>
                    <div className="p-2.5 rounded-2xl bg-[#eef3fc] dark:bg-[#141928] flex items-center gap-2.5 shadow-[inset_3px_3px_6px_rgba(163,177,198,0.35),inset_-2px_-2px_5px_rgba(255,255,255,0.8)] dark:shadow-[inset_3px_3px_7px_rgba(4,7,15,0.7)]">
                      <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-indigo-400 to-indigo-600 shadow-[4px_5px_10px_rgba(79,70,229,0.35),inset_2px_2px_4px_rgba(255,255,255,0.45)] shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-2 rounded-full bg-white dark:bg-[#1e253b] shadow-[3px_3px_6px_rgba(163,177,198,0.35)] w-3/4" />
                        <div className="h-1.5 rounded-full bg-indigo-200/80 dark:bg-indigo-900/60 w-1/2" />
                      </div>
                    </div>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-snug">
                      Sudut membulat empuk, kedalaman 3D lembut, dan sorotan cahaya di setiap kartu & tombol.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => onUiStyleChange('classic')}
                    className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-3 cursor-pointer ${
                      uiStyle === 'classic'
                        ? 'border-indigo-600 dark:border-indigo-400 bg-indigo-50/60 dark:bg-indigo-950/35 ring-1 ring-indigo-600 dark:ring-indigo-400'
                        : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-850/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                        Klasik Minimalis
                      </span>
                      {uiStyle === 'classic' && (
                        <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                          <Check className="w-3 h-3 stroke-[2.5]" />
                        </span>
                      )}
                    </div>
                    <div className="p-2.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-md bg-indigo-600 shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-2 rounded bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 w-3/4" />
                        <div className="h-1.5 rounded bg-neutral-300 dark:bg-neutral-600 w-1/2" />
                      </div>
                    </div>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-snug">
                      Permukaan datar bersih dengan garis tepi 1px tajam untuk kepadatan informasi maksimal.
                    </p>
                  </button>
                </div>
              </div>

              <div className="border-t border-neutral-100 dark:border-neutral-800" />
            </>
          )}

          {/* SECTION 4: Database Google Firebase Console */}
          <div ref={firebaseSectionRef}>
            <div className="flex flex-wrap items-start sm:items-center justify-between gap-2.5 mb-3">
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                  <Cloud className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Database Cloud (Google Firebase Firestore)</span>
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Simpan & sinkronkan pintasan, grup, logo, serta preferensi secara real-time di Google Firebase Console.
                </p>
              </div>
              <a
                href={FIREBASE_CONSOLE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline whitespace-nowrap shrink-0"
              >
                <span>Buka Console</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-850/60 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
                <div className="px-3 py-2 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                  <span className="text-neutral-400 block">Project ID</span>
                  <span className="text-neutral-800 dark:text-neutral-200 font-semibold">{FIREBASE_PROJECT_ID}</span>
                </div>
                <div className="px-3 py-2 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 truncate">
                  <span className="text-neutral-400 block">Firestore Database ID</span>
                  <span className="text-neutral-800 dark:text-neutral-200 font-semibold truncate block" title={FIREBASE_DATABASE_ID}>
                    {FIREBASE_DATABASE_ID}
                  </span>
                </div>
                <div className="px-3 py-2 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 truncate">
                  <span className="text-neutral-400 block">App ID</span>
                  <span className="text-neutral-800 dark:text-neutral-200 font-semibold truncate block" title={FIREBASE_APP_ID}>
                    {FIREBASE_APP_ID}
                  </span>
                </div>
                <div className="px-3 py-2 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 truncate">
                  <span className="text-neutral-400 block">Database URL</span>
                  <span className="text-neutral-800 dark:text-neutral-200 font-semibold truncate block" title={FIREBASE_DATABASE_URL}>
                    {FIREBASE_DATABASE_URL}
                  </span>
                </div>
              </div>

              {cloudError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/45 border border-rose-200 dark:border-rose-800/70 text-xs text-rose-800 dark:text-rose-200 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 min-w-0">
                      <CloudAlert className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                      <p className="font-semibold break-words leading-relaxed">{cloudError.message}</p>
                    </div>
                    {onClearCloudError && (
                      <button
                        type="button"
                        onClick={onClearCloudError}
                        className="p-0.5 text-rose-500 hover:text-rose-700 dark:hover:text-rose-300 rounded shrink-0"
                        aria-label="Tutup pesan error cloud"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  {cloudError.code === 'auth/unauthorized-domain' && typeof window !== 'undefined' && (
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <code className="px-2 py-1 rounded bg-white dark:bg-neutral-900 border border-rose-200 dark:border-rose-800 font-mono text-[11px] break-all">
                        {window.location.hostname}
                      </code>
                      <button
                        type="button"
                        onClick={() => {
                          void navigator.clipboard?.writeText(window.location.hostname).then(() => {
                            setCopiedHost(true);
                            setTimeout(() => setCopiedHost(false), 2000);
                          });
                        }}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-semibold transition-colors"
                      >
                        <Copy className="w-3 h-3" />
                        <span>{copiedHost ? 'Disalin!' : 'Salin Domain'}</span>
                      </button>
                    </div>
                  )}
                  {cloudError.isQuota && (
                    <a
                      href={FIREBASE_UPGRADE_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 underline font-medium text-rose-700 dark:text-rose-300"
                    >
                      <span>Lihat detail kuota &amp; upgrade di Firebase Console</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}

              {firebaseUser ? (
                <div className="space-y-3 pt-2 border-t border-neutral-200/70 dark:border-neutral-800">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {firebaseUser.photoURL ? (
                        <img
                          src={firebaseUser.photoURL}
                          alt={firebaseUser.displayName || 'Google User'}
                          className="w-9 h-9 rounded-full border border-emerald-400/50 shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                          {(firebaseUser.displayName || firebaseUser.email || 'U')[0].toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate">
                            {firebaseUser.displayName || 'Pengguna Google'}
                          </p>
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                              cloudSyncStatus === 'error'
                                ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                                : cloudSyncStatus === 'offline'
                                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                                : cloudSyncStatus === 'connecting' || cloudSyncStatus === 'syncing'
                                ? 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                                : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                            }`}
                          >
                            {cloudSyncStatus === 'synced' && (
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            )}
                            <span>
                              {cloudSyncStatus === 'error'
                                ? 'Gangguan Sync'
                                : cloudSyncStatus === 'offline'
                                ? 'Cache Offline'
                                : cloudSyncStatus === 'connecting'
                                ? 'Menghubungkan Server...'
                                : cloudSyncStatus === 'syncing'
                                ? 'Menyinkronkan...'
                                : 'Live Cloud Aktif'}
                            </span>
                          </span>
                        </div>
                        <p className="text-[11px] text-emerald-700 dark:text-emerald-400 truncate">
                          {firebaseUser.email}
                          {lastSyncedAt
                            ? ` · Pembaruan terakhir ${new Date(lastSyncedAt).toLocaleTimeString('id-ID', {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                              })}`
                            : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {onRefreshFromCloud && (
                        <button
                          type="button"
                          disabled={isRefreshingCloud || cloudSyncStatus === 'syncing'}
                          onClick={onRefreshFromCloud}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white shadow-xs transition-colors cursor-pointer"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingCloud ? 'animate-spin' : ''}`} />
                          <span>{isRefreshingCloud ? 'Mengambil Server...' : 'Segarkan dari Cloud'}</span>
                        </button>
                      )}
                      {onSyncLocalToCloud && (
                        <button
                          type="button"
                          disabled={cloudSyncStatus === 'syncing' || isRefreshingCloud}
                          onClick={onSyncLocalToCloud}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 disabled:opacity-60 text-neutral-700 dark:text-neutral-200 transition-colors cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>{cloudSyncStatus === 'syncing' ? 'Mengunggah...' : 'Unggah Data Lokal'}</span>
                        </button>
                      )}
                      {onSignOutGoogle && (
                        <button
                          type="button"
                          onClick={onSignOutGoogle}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Keluar</span>
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-[11px] text-emerald-800 dark:text-emerald-300 bg-emerald-50/80 dark:bg-emerald-950/35 border border-emerald-200/70 dark:border-emerald-800/40 rounded-lg px-3 py-2">
                    Masuk dengan akun Google yang sama di komputer lain atau HP Anda untuk langsung menyinkronkan pintasan, grup, logo kustom, tema, gaya Clay 3D/Klasik, tata letak, dan densitas secara real-time.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-neutral-200/70 dark:border-neutral-800">
                  <p className="text-xs text-neutral-600 dark:text-neutral-300">
                    Saat ini memakai penyimpanan lokal browser. Masuk dengan Google agar seluruh pintasan &amp; pengaturan tampilan tersinkron otomatis di berbagai PC dan HP.
                  </p>
                  {onSignInGoogle && (
                    <button
                      type="button"
                      disabled={isSigningInGoogle}
                      onClick={onSignInGoogle}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white shadow-xs transition-colors shrink-0 cursor-pointer"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>{isSigningInGoogle ? 'Menghubungkan...' : 'Masuk dengan Google'}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-neutral-100 dark:border-neutral-800" />

          {/* SECTION 5: Install Aplikasi di Komputer & HP (PWA) */}
          <div>
            <PWAInstallButton variant="card" onInstalledToast={onAppInstalled} />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-neutral-50 dark:bg-neutral-800/40 border-t border-neutral-100 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-neutral-500 dark:text-neutral-400">
            Total {totalShortcutsCount} pintasan aktif ({firebaseUser ? 'Firebase Firestore Cloud' : 'Penyimpanan Lokal Browser'}).
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors whitespace-nowrap clay-btn-primary"
          >
            Selesai & Simpan
          </button>
        </div>
      </div>
    </div>
  );
};
