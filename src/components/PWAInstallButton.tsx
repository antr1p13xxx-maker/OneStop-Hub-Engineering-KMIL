import React, { useState } from 'react';
import { Download, Smartphone, Monitor, CheckCircle2, Share2, PlusSquare, X, ExternalLink } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'header' | 'card';
  onInstalledToast?: () => void;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'header',
  onInstalledToast,
}) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);

  const handleInstallClick = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (accepted) {
        onInstalledToast?.();
      }
    } else {
      setShowGuideModal(true);
    }
  };

  // Header mode: hide automatically when already running as an installed standalone PWA
  if (variant === 'header') {
    if (isInstalled) {
      return null;
    }

    // Show direct install trigger when browser supports native prompt or iOS Safari
    if (!isInstallable && !isIOS) {
      return null;
    }

    return (
      <>
        <button
          type="button"
          onClick={handleInstallClick}
          title={
            isIOS
              ? 'Install OneStop Hub di iPhone / iPad'
              : 'Install OneStop Hub sebagai aplikasi di PC atau HP'
          }
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:via-teal-400 hover:to-cyan-400 shadow-xs transition-all whitespace-nowrap shrink-0 cursor-pointer clay-btn-emerald"
        >
          <Download className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden sm:inline">{isIOS ? 'Install iOS' : 'Install App'}</span>
        </button>

        {showGuideModal && (
          <InstallGuideModal
            isIOS={isIOS}
            isAndroid={isAndroid}
            onClose={() => setShowGuideModal(false)}
          />
        )}
      </>
    );
  }

  // Card mode (used in SettingsModal): always accessible unless already installed
  return (
    <>
      <div className="p-4 rounded-xl border border-cyan-200/80 dark:border-cyan-800/50 bg-gradient-to-br from-cyan-50/75 via-sky-50/55 to-indigo-50/65 dark:from-cyan-950/35 dark:via-sky-950/25 dark:to-indigo-950/30 space-y-3 clay-subcard">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 via-sky-500 to-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
              {isInstalled ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <Monitor className="w-5 h-5" />
              )}
            </div>
            <div>
              <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <span>
                  {isInstalled
                    ? 'Aplikasi Sudah Terpasang (Mode Standalone)'
                    : 'Install Aplikasi di PC & HP (PWA)'}
                </span>
              </h4>
              <p className="text-[11px] text-neutral-600 dark:text-neutral-300 mt-0.5 leading-relaxed">
                {isInstalled
                  ? 'OneStop Hub berjalan sebagai aplikasi mandiri tanpa address bar browser dan mendukung akses offline.'
                  : 'Pasang OneStop Hub ke Desktop Windows/Mac atau Layar Utama Android/iPhone agar terbuka cepat seperti aplikasi native.'}
              </p>
            </div>
          </div>

          {!isInstalled && (
            <div className="flex items-center gap-2 shrink-0">
              {isInstallable ? (
                <button
                  type="button"
                  onClick={handleInstallClick}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white shadow-xs transition-all cursor-pointer clay-btn-emerald"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Install Sekarang</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowGuideModal(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white shadow-xs transition-all cursor-pointer clay-btn-primary"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Panduan Install PC & HP</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Platform quick hints */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-cyan-200/50 dark:border-cyan-800/40 text-[11px] text-neutral-600 dark:text-neutral-300">
          <div className="px-2.5 py-2 rounded-lg bg-white/80 dark:bg-neutral-900/70 border border-neutral-200/70 dark:border-neutral-800">
            <span className="font-bold text-indigo-600 dark:text-indigo-400 block">PC (Windows / Mac)</span>
            <span>Klik ikon Install di kanan kolom URL Chrome/Edge.</span>
          </div>
          <div className="px-2.5 py-2 rounded-lg bg-white/80 dark:bg-neutral-900/70 border border-neutral-200/70 dark:border-neutral-800">
            <span className="font-bold text-emerald-600 dark:text-emerald-400 block">HP Android</span>
            <span>Buka menu ⋮ di Chrome &rarr; <strong>Install aplikasi</strong>.</span>
          </div>
          <div className="px-2.5 py-2 rounded-lg bg-white/80 dark:bg-neutral-900/70 border border-neutral-200/70 dark:border-neutral-800">
            <span className="font-bold text-sky-600 dark:text-sky-400 block">iPhone / iPad (iOS)</span>
            <span>Di Safari ketuk <strong>Bagikan</strong> &rarr; <strong>Tambah ke Layar Utama</strong>.</span>
          </div>
        </div>
      </div>

      {showGuideModal && (
        <InstallGuideModal
          isIOS={isIOS}
          isAndroid={isAndroid}
          onClose={() => setShowGuideModal(false)}
        />
      )}
    </>
  );
};

interface InstallGuideModalProps {
  isIOS: boolean;
  isAndroid: boolean;
  onClose: () => void;
}

const InstallGuideModal: React.FC<InstallGuideModalProps> = ({ isIOS, isAndroid, onClose }) => {
  const isInIframe = typeof window !== 'undefined' && window.self !== window.top;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 shadow-2xl clay-modal space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 text-white flex items-center justify-center shrink-0">
              {isIOS || isAndroid ? <Smartphone className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                {isIOS
                  ? 'Install di iPhone / iPad (Safari)'
                  : isAndroid
                  ? 'Install di HP Android'
                  : 'Install di Komputer (Windows / Mac)'}
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Pasang OneStop Hub sebagai aplikasi standalone
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isInIframe && (
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
            <ExternalLink className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <span>
              Browser memblokir dialog install otomatis di dalam pratinjau tersemat (iframe). Buka URL aplikasi di <strong>tab browser penuh</strong> agar tombol <strong>Install App</strong> muncul otomatis.
            </span>
          </div>
        )}

        {isIOS ? (
          <ol className="space-y-2.5 text-xs text-neutral-700 dark:text-neutral-300">
            <li className="flex items-start gap-2.5 p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/70">
              <Share2 className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
              <span>
                1. Ketuk tombol <strong>Bagikan (Share)</strong> di bilah bawah/atas browser <strong>Safari</strong>.
              </span>
            </li>
            <li className="flex items-start gap-2.5 p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/70">
              <PlusSquare className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
              <span>
                2. Gulir ke bawah lalu pilih <strong>Tambah ke Layar Utama (Add to Home Screen)</strong>.
              </span>
            </li>
            <li className="flex items-start gap-2.5 p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/70">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>
                3. Ketuk <strong>Tambah</strong>. Aplikasi akan muncul di layar utama iPhone/iPad Anda.
              </span>
            </li>
          </ol>
        ) : isAndroid ? (
          <ol className="space-y-2.5 text-xs text-neutral-700 dark:text-neutral-300">
            <li className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/70">
              1. Buka aplikasi ini di browser <strong>Google Chrome</strong> atau <strong>Edge</strong> (tab penuh).
            </li>
            <li className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/70">
              2. Ketuk menu titik tiga (<strong>⋮</strong>) di pojok kanan atas browser.
            </li>
            <li className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/70">
              3. Pilih <strong>Install aplikasi</strong> atau <strong>Tambahkan ke layar utama</strong>.
            </li>
          </ol>
        ) : (
          <ol className="space-y-2.5 text-xs text-neutral-700 dark:text-neutral-300">
            <li className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/70">
              1. Buka aplikasi di <strong>Google Chrome</strong> atau <strong>Microsoft Edge</strong> pada tab browser penuh.
            </li>
            <li className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/70">
              2. Klik ikon <strong>Install OneStop Hub</strong> (ikon monitor/tambah) di sisi kanan bilah alamat URL, atau buka menu browser &rarr; <strong>Simpan dan Bagikan &rarr; Install halaman sebagai aplikasi</strong>.
            </li>
            <li className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/70">
              3. Aplikasi akan terpasang ke Start Menu / Desktop PC dan dapat dijalankan terpisah dari browser.
            </li>
          </ol>
        )}

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2 text-xs font-semibold rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white transition-all cursor-pointer clay-btn-primary"
        >
          Mengerti
        </button>
      </div>
    </div>
  );
};
