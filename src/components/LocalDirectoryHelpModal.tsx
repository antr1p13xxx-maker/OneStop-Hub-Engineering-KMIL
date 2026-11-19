import React, { useState } from 'react';
import { X, HardDrive, Terminal, ExternalLink, Copy, Check, Info, Command } from 'lucide-react';
import { copyToClipboard } from '../utils/pathHelper';

interface LocalDirectoryHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LocalDirectoryHelpModal: React.FC<LocalDirectoryHelpModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = async (text: string, id: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl max-w-2xl w-full p-6 shadow-xl clay-modal relative my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                Panduan Pintasan Direktori Lokal (Drive D:, C:, dll.)
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Cara praktis mengintegrasikan dan membuka folder komputer Anda dari browser
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

        {/* Content */}
        <div className="mt-5 space-y-4 text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
          {/* Note Box */}
          <div className="p-3.5 rounded-lg bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900 text-indigo-950 dark:text-indigo-200 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block mb-0.5">Catatan Keamanan Browser (Sandboxing):</span>
              Browser modern membatasi situs web untuk langsung mengeksekusi program atau membuka folder lokal tanpa izin pengguna demi keamanan. Oleh karena itu, OneStop Hub menyediakan metode tercepat yang nyaman:
            </div>
          </div>

          {/* Methods */}
          <div className="space-y-3">
            {/* Method 1 */}
            <div className="p-3.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-850">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-neutral-900 dark:text-neutral-100">
                  Metode 1: Fitur 1-Klik Salin & Win + R (Paling Cepat di Windows)
                </span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                  Rekomendasi ⭐
                </span>
              </div>
              <p className="mb-2">
                Saat Anda mengklik tombol pintasan folder drive (misal <code className="font-mono text-neutral-800 dark:text-neutral-200">D:\Proyek</code>), sistem secara otomatis menyalin alamat path ke clipboard Anda.
              </p>
              <ol className="list-decimal list-inside space-y-1 text-neutral-700 dark:text-neutral-300 ml-1">
                <li>Klik tombol kartu folder di dasbor.</li>
                <li>Tekan tombol keyboard <kbd className="px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-700 font-mono">Win + R</kbd> di laptop/PC Anda.</li>
                <li>Tekan <kbd className="px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-700 font-mono">Ctrl + V</kbd> lalu tekan <kbd className="px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-700 font-mono">Enter</kbd>.</li>
              </ol>
            </div>

            {/* Method 2 */}
            <div className="p-3.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-850">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-neutral-900 dark:text-neutral-100">
                  Metode 2: Protokol Aplikasi Desktop (misal VS Code)
                </span>
                <span className="text-[11px] text-purple-600 dark:text-purple-400 font-medium">
                  Untuk Developer
                </span>
              </div>
              <p className="mb-2">
                Jika folder tersebut adalah proyek koding atau workspace VS Code, gunakan format protokol:
              </p>
              <div className="flex items-center justify-between p-2 rounded bg-neutral-100 dark:bg-neutral-800 font-mono text-[11px]">
                <span>vscode://file/D:/Proyek_Utama</span>
                <button
                  type="button"
                  onClick={() => handleCopy('vscode://file/D:/Proyek_Utama', 'vscode')}
                  className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  {copiedId === 'vscode' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedId === 'vscode' ? 'Tersalin' : 'Salin'}</span>
                </button>
              </div>
              <p className="mt-1.5 text-neutral-500">
                Format ini akan langsung membuka aplikasi VS Code ke folder Drive D: Anda tanpa perlu menekan Win+R.
              </p>
            </div>

            {/* Method 3 */}
            <div className="p-3.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-850">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-neutral-900 dark:text-neutral-100">
                  Metode 3: Format file:/// URL
                </span>
                <span className="text-[11px] text-neutral-500 font-medium">
                  Browser Built-in
                </span>
              </div>
              <p className="mb-2">
                Anda juga dapat memasukkan alamat dengan format URL berkas seperti:
              </p>
              <div className="flex items-center justify-between p-2 rounded bg-neutral-100 dark:bg-neutral-800 font-mono text-[11px]">
                <span>file:///D:/Proyek_Utama/2026/</span>
                <button
                  type="button"
                  onClick={() => handleCopy('file:///D:/Proyek_Utama/2026/', 'fileurl')}
                  className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  {copiedId === 'fileurl' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedId === 'fileurl' ? 'Tersalin' : 'Salin'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-neutral-100 dark:border-neutral-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-xs transition-colors"
          >
            Mengerti & Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
