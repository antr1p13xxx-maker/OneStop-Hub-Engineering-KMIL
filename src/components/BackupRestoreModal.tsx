import React, { useState, useRef } from 'react';
import { X, Download, Upload, RefreshCw, AlertTriangle, Check, FileJson } from 'lucide-react';
import { exportBackupData, importBackupData } from '../services/storage';

interface BackupRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  canImportBackup?: boolean;
  canResetData?: boolean;
  onDataChanged: () => void;
  onResetDefault: () => void;
}

export const BackupRestoreModal: React.FC<BackupRestoreModalProps> = ({
  isOpen,
  onClose,
  canImportBackup = true,
  canResetData = true,
  onDataChanged,
  onResetDefault,
}) => {
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDownload = () => {
    const jsonStr = exportBackupData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `onestop-hub-engineering-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setFeedback({ type: 'success', message: 'File backup JSON berhasil diunduh ke komputer Anda.' });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const result = importBackupData(content);
      if (result.success) {
        setFeedback({ type: 'success', message: result.message });
        onDataChanged();
      } else {
        setFeedback({ type: 'error', message: result.message });
      }
    };
    reader.onerror = () => {
      setFeedback({ type: 'error', message: 'Gagal membaca file.' });
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleReset = () => {
    const confirmed = window.confirm(
      'Apakah Anda yakin ingin mengatur ulang dasbor ke setelan data bawaan? Semua pintasan yang Anda tambahkan sendiri akan digantikan oleh preset bawaan.'
    );
    if (!confirmed) return;
    onResetDefault();
    setFeedback({ type: 'success', message: 'Dasbor berhasil dikembalikan ke data preset bawaan.' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl max-w-md w-full p-6 shadow-xl clay-modal relative my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <FileJson className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                Cadangkan & Pulihkan
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Simpan atau pulihkan konfigurasi pintasan Anda
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
        <div className="mt-5 space-y-4 text-xs">
          {feedback && (
            <div
              className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
              }`}
            >
              {feedback.type === 'success' ? (
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Backup Action */}
          <div className="p-3.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-850 flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                Unduh Cadangan JSON
              </p>
              <p className="text-neutral-500 dark:text-neutral-400 text-[11px] mt-0.5">
                Simpan semua link web, direktori Drive D:, dan grup ke file lokal
              </p>
            </div>
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-xs transition-colors shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor</span>
            </button>
          </div>

          {/* Restore Action */}
          <div className="p-3.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-850 flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                Pulihkan dari File JSON
              </p>
              <p className="text-neutral-500 dark:text-neutral-400 text-[11px] mt-0.5">
                {canImportBackup
                  ? 'Muat kembali data dasbor dari file backup sebelumnya'
                  : 'Mode Viewer tidak diizinkan menimpa/memulihkan data'}
              </p>
            </div>
            {canImportBackup ? (
              <>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".json"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 font-medium transition-colors shrink-0"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Impor</span>
                </button>
              </>
            ) : (
              <span className="text-[11px] px-2.5 py-1 rounded bg-neutral-200 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400">
                Terkunci
              </span>
            )}
          </div>

          {/* Reset Action */}
          <div className="p-3.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-850 flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                Reset ke Data Bawaan
              </p>
              <p className="text-neutral-500 dark:text-neutral-400 text-[11px] mt-0.5">
                {canResetData
                  ? 'Kembalikan contoh pintasan Drive D:, C:, kerja, dan pribadi'
                  : 'Hanya Manager Engineering yang dapat mereset data'}
              </p>
            </div>
            {canResetData ? (
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-medium transition-colors shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            ) : (
              <span className="text-[11px] px-2.5 py-1 rounded bg-neutral-200 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400">
                Hanya Manager
              </span>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-neutral-100 dark:border-neutral-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
