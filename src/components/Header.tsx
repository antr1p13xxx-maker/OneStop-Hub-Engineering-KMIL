import React, { useState, useEffect } from 'react';
import { UserRole, CustomLogoConfig } from '../types';
import { ROLE_CONFIGS } from '../services/auth';
import {
  Layers,
  Plus,
  Moon,
  Sun,
  FolderSearch,
  Settings2,
  Download,
  HelpCircle,
  Shield,
  ShieldCheck,
  Eye,
  Lock,
  Sliders,
  Zap,
  Camera,
  Cloud,
  CloudOff,
} from 'lucide-react';
import { User } from 'firebase/auth';

interface HeaderProps {
  theme: 'light' | 'dark';
  currentRole: UserRole;
  onOpenRoleSwitch: () => void;
  canAddShortcut: boolean;
  canEditLogo?: boolean;
  customLogo?: CustomLogoConfig | null;
  onOpenLogoSettings?: () => void;
  onToggleTheme: () => void;
  onOpenAddModal: () => void;
  onOpenManageGroups: () => void;
  onOpenBackupModal: () => void;
  onOpenHelpModal: () => void;
  onOpenSettings: () => void;
  onPlayJarvisIntro: () => void;
  onSelectGroupFilter: (groupId: string) => void;
  activeFilterGroup: string;
  firebaseUser?: User | null;
  isSigningInGoogle?: boolean;
  onSignInGoogle?: () => void;
  onOpenCloudSettings?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  currentRole,
  onOpenRoleSwitch,
  canAddShortcut,
  canEditLogo = true,
  customLogo,
  onOpenLogoSettings,
  onToggleTheme,
  onOpenAddModal,
  onOpenManageGroups,
  onOpenBackupModal,
  onOpenHelpModal,
  onOpenSettings,
  onPlayJarvisIntro,
  onSelectGroupFilter,
  activeFilterGroup,
  firebaseUser,
  isSigningInGoogle = false,
  onSignInGoogle,
  onOpenCloudSettings,
}) => {
  const roleConfig = ROLE_CONFIGS[currentRole];
  const [logoImgError, setLogoImgError] = useState(false);

  useEffect(() => {
    setLogoImgError(false);
  }, [customLogo?.src]);

  const hasValidLogo = Boolean(customLogo?.src && !logoImgError);

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800 clay-header transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single text wordmark + customizable logo photo */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="flex items-center gap-2.5 group/logo">
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => onSelectGroupFilter('all')}
                  className="flex items-center justify-center rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  title="OneStop Hub Engineering"
                >
                  {hasValidLogo ? (
                    <div className="w-9 h-9 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 overflow-hidden flex items-center justify-center shadow-xs clay-icon-well">
                      <img
                        src={customLogo!.src}
                        alt="OneStop Hub Engineering"
                        onError={() => setLogoImgError(true)}
                        className={`w-full h-full ${
                          customLogo!.fit === 'contain' ? 'object-contain p-0.5' : 'object-cover'
                        }`}
                      />
                    </div>
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs clay-btn-primary">
                      <Layers className="w-5 h-5" />
                    </div>
                  )}
                </button>

                {onOpenLogoSettings && (
                  <button
                    type="button"
                    onClick={onOpenLogoSettings}
                    title={
                      canEditLogo
                        ? 'Ganti Foto Logo OneStop Hub'
                        : 'Ganti Foto Logo OneStop Hub (Beralih ke Lead/Manager)'
                    }
                    aria-label="Ganti Foto Logo OneStop Hub"
                    className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 text-neutral-600 dark:text-neutral-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-500 flex items-center justify-center shadow-xs opacity-90 group-hover/logo:opacity-100 hover:scale-110 transition-all cursor-pointer"
                  >
                    <Camera className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => onSelectGroupFilter('all')}
                className="text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-md"
              >
                <span className="text-lg font-bold tracking-tight text-neutral-900 dark:text-neutral-100 whitespace-nowrap">
                  OneStop Hub Engineering
                </span>
              </button>
            </div>
          </div>

          {/* Zone 2: 4–5 clean single-line text navigation links */}
          <nav className="hidden md:flex items-center gap-5 text-sm font-medium text-neutral-600 dark:text-neutral-400">
            <button
              onClick={() => onSelectGroupFilter('all')}
              className={`hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors whitespace-nowrap shrink-0 ${
                activeFilterGroup === 'all'
                  ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                  : ''
              }`}
            >
              Semua Pintasan
            </button>
            <button
              onClick={() => onSelectGroupFilter('group-drive')}
              className={`flex items-center gap-1.5 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors whitespace-nowrap shrink-0 ${
                activeFilterGroup === 'group-drive'
                  ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                  : ''
              }`}
            >
              <FolderSearch className="w-4 h-4" />
              Drive & Folder Lokal (D:)
            </button>
            <button
              onClick={onOpenManageGroups}
              className="flex items-center gap-1.5 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors whitespace-nowrap shrink-0"
            >
              <Settings2 className="w-4 h-4" />
              Kelola Grup
            </button>
            <button
              onClick={onOpenHelpModal}
              className="flex items-center gap-1.5 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors whitespace-nowrap shrink-0"
            >
              <HelpCircle className="w-4 h-4" />
              Panduan Direktori
            </button>
            <button
              onClick={onOpenSettings}
              className="flex items-center gap-1.5 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors whitespace-nowrap shrink-0"
            >
              <Sliders className="w-4 h-4" />
              Pengaturan
            </button>
            <button
              onClick={onOpenBackupModal}
              className="flex items-center gap-1.5 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors whitespace-nowrap shrink-0"
            >
              <Download className="w-4 h-4" />
              Cadangan
            </button>
          </nav>

          {/* Zone 3: Role Switcher + Settings + Theme Toggle + Primary Action */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Role Switcher Pill Button */}
            <button
              type="button"
              onClick={onOpenRoleSwitch}
              title={`Peran saat ini: ${roleConfig.name}. Klik untuk beralih peran.`}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all hover:shadow-2xs clay-btn-soft ${roleConfig.badgeColor}`}
            >
              {currentRole === 'viewer' ? (
                <Eye className="w-3.5 h-3.5 text-neutral-500" />
              ) : currentRole === 'lead' ? (
                <Shield className="w-3.5 h-3.5 text-amber-500" />
              ) : (
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              )}
              <span className="hidden sm:inline">{roleConfig.name}</span>
              <span className="sm:hidden">{currentRole === 'viewer' ? 'Viewer' : currentRole === 'lead' ? 'Lead' : 'Manager'}</span>
            </button>

            {/* Firebase Cloud / Google Account Button */}
            {firebaseUser ? (
              <button
                type="button"
                onClick={onOpenCloudSettings || onOpenSettings}
                title={`Tersinkron ke Firebase Cloud (${firebaseUser.email || 'Google'})`}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800/70 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors clay-btn-soft"
              >
                <Cloud className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="hidden lg:inline max-w-[110px] truncate">
                  {firebaseUser.displayName?.split(' ')[0] || 'Cloud Aktif'}
                </span>
              </button>
            ) : onSignInGoogle ? (
              <button
                type="button"
                onClick={onSignInGoogle}
                disabled={isSigningInGoogle}
                title="Masuk dengan Google untuk menyimpan database di Google Firebase Firestore"
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 text-xs font-medium hover:bg-neutral-100 dark:hover:bg-neutral-700 disabled:opacity-60 transition-colors clay-btn-soft"
              >
                <CloudOff className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                <span className="hidden lg:inline">
                  {isSigningInGoogle ? 'Menghubungkan...' : 'Cloud Sync'}
                </span>
              </button>
            ) : null}

            {/* J.A.R.V.I.S. HUD Opening Trigger */}
            <button
              type="button"
              onClick={onPlayJarvisIntro}
              aria-label="Buka Animasi J.A.R.V.I.S. HUD"
              title="Putar Animasi J.A.R.V.I.S. Startup HUD"
              className="p-2 text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 hover:bg-cyan-50 dark:hover:bg-cyan-950/50 rounded-lg transition-colors border border-transparent hover:border-cyan-200 dark:hover:border-cyan-800/60"
            >
              <Zap className="w-4 h-4" />
            </button>

            {/* Settings Button (Mobile & quick access) */}
            <button
              type="button"
              onClick={onOpenSettings}
              aria-label="Buka Pengaturan Tampilan & Densitas"
              title="Pengaturan Tampilan & Densitas Kartu (Small/Medium/Large)"
              className="p-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors clay-btn-soft"
            >
              <Sliders className="w-4 h-4" />
            </button>

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label="Ganti mode tampilan"
              title={
                theme === 'dark'
                  ? 'Mode Gelap aktif (Transisi halus). Klik untuk beralih ke Mode Terang.'
                  : 'Mode Terang aktif (Transisi halus). Klik untuk beralih ke Mode Gelap.'
              }
              className="p-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors clay-btn-soft"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
            </button>

            {/* Add Shortcut button with permission handling */}
            {canAddShortcut ? (
              <button
                type="button"
                onClick={onOpenAddModal}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg shadow-xs transition-colors whitespace-nowrap shrink-0 clay-btn-primary"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tambah Pintasan</span>
                <span className="sm:hidden">Tambah</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenRoleSwitch}
                title="Viewer hanya bisa melihat. Klik untuk beralih ke Lead/Manager."
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800/80 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg border border-neutral-200 dark:border-neutral-700 transition-colors whitespace-nowrap shrink-0 clay-btn-soft"
              >
                <Lock className="w-3.5 h-3.5 text-neutral-400" />
                <span>Mode Lihat</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
