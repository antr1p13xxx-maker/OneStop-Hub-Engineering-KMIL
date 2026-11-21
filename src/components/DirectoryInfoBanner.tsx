import React, { useState } from 'react';
import { HardDrive, HelpCircle, Copy, Check, ChevronDown, ChevronUp, Plus, Terminal } from 'lucide-react';
import { copyToClipboard } from '../utils/pathHelper';

interface DirectoryInfoBannerProps {
  onAddDriveShortcut: () => void;
  onOpenHelpModal: () => void;
  canAddShortcut?: boolean;
}

export const DirectoryInfoBanner: React.FC<DirectoryInfoBannerProps> = ({
  onAddDriveShortcut,
  onOpenHelpModal,
  canAddShortcut = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedExample, setCopiedExample] = useState<string | null>(null);

  const handleCopy = async (text: string, label: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedExample(label);
      setTimeout(() => setCopiedExample(null), 2000);
    }
  };

  return (
    <div className="bg-gradient-to-r from-emerald-50/90 via-teal-50/75 to-cyan-50/85 dark:from-emerald-950/45 dark:via-teal-950/30 dark:to-cyan-950/35 border border-emerald-200/80 dark:border-emerald-800/50 rounded-xl p-4 sm:p-5 shadow-xs clay-surface transition-colors">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 text-white flex items-center justify-center shrink-0 mt-0.5 clay-icon-well shadow-xs">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                Fitur Direktori Drive Lokal (Drive D:, C:, dll.)
              </h2>
            </div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-0.5">
              Kelola dan luncurkan folder lokal Anda langsung dari dasbor ini. Klik sekali untuk menyalin path atau membuka via Explorer.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
          {canAddShortcut && (
            <button
              type="button"
              onClick={onAddDriveShortcut}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800 rounded-lg transition-colors whitespace-nowrap clay-btn-emerald"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Folder Drive D:</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors whitespace-nowrap clay-btn-soft"
          >
            <span>{isExpanded ? 'Tutup Tips' : 'Cara Kerja'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-emerald-200/60 dark:border-emerald-800/40 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-neutral-600 dark:text-neutral-300">
          <div className="p-3 rounded-lg bg-gradient-to-br from-sky-50/90 to-indigo-50/70 dark:from-sky-950/40 dark:to-indigo-950/30 border border-sky-200/70 dark:border-sky-800/40 clay-subcard">
            <p className="font-semibold text-sky-900 dark:text-sky-200 mb-1 flex items-center gap-1.5">
              <span>1. Format Alamat Drive</span>
            </p>
            <p className="mb-2">
              Anda bisa memasukkan alamat seperti <code className="text-neutral-800 dark:text-neutral-200 font-mono">D:\Proyek</code> atau <code className="text-neutral-800 dark:text-neutral-200 font-mono">file:///D:/Folder</code>.
            </p>
            <button
              onClick={() => handleCopy('D:\\Proyek_Utama\\2026', 'd-path')}
              className="inline-flex items-center gap-1 text-sky-600 dark:text-sky-400 hover:underline font-medium"
            >
              {copiedExample === 'd-path' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
              <span>{copiedExample === 'd-path' ? 'Tersalin!' : 'Salin Contoh Alamat D:'}</span>
            </button>
          </div>

          <div className="p-3 rounded-lg bg-gradient-to-br from-emerald-50/90 to-teal-50/70 dark:from-emerald-950/40 dark:to-teal-950/30 border border-emerald-200/70 dark:border-emerald-800/40 clay-subcard">
            <p className="font-semibold text-emerald-900 dark:text-emerald-200 mb-1 flex items-center gap-1.5">
              <span>2. Cara Buka 1 Detik di Windows</span>
            </p>
            <p className="mb-2">
              Klik tombol pintasan untuk otomatis menyalin path, lalu tekan <kbd className="px-1 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 font-mono">Win + R</kbd> lalu paste & Enter.
            </p>
            <button
              onClick={() => handleCopy('explorer "D:\\Proyek_Utama\\2026"', 'cmd')}
              className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
            >
              <Terminal className="w-3 h-3" />
              <span>{copiedExample === 'cmd' ? 'Tersalin!' : 'Salin Sintaks Explorer'}</span>
            </button>
          </div>

          <div className="p-3 rounded-lg bg-gradient-to-br from-violet-50/90 to-fuchsia-50/70 dark:from-violet-950/40 dark:to-fuchsia-950/30 border border-violet-200/70 dark:border-violet-800/40 clay-subcard">
            <p className="font-semibold text-violet-900 dark:text-violet-200 mb-1 flex items-center gap-1.5">
              <span>3. Integrasi Editor & App</span>
            </p>
            <p className="mb-2">
              Dapat juga diarahkan ke VS Code via <code className="text-neutral-800 dark:text-neutral-200 font-mono">vscode://file/D:/Folder</code> untuk buka langsung di editor.
            </p>
            <button
              onClick={onOpenHelpModal}
              className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
            >
              <HelpCircle className="w-3 h-3" />
              <span>Baca Panduan Lengkap</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
