import React, { useState, useEffect } from 'react';
import {
  X,
  Shield,
  ShieldCheck,
  Eye,
  Lock,
  Check,
  AlertCircle,
  KeyRound,
} from 'lucide-react';
import { UserRole } from '../types';
import { ROLE_CONFIGS, verifyRolePassword } from '../services/auth';

interface RoleSwitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole: UserRole;
  onRoleChanged: (role: UserRole) => void;
}

export const RoleSwitchModal: React.FC<RoleSwitchModalProps> = ({
  isOpen,
  onClose,
  currentRole,
  onRoleChanged,
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>(currentRole);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSelectedRole(currentRole);
      setPassword('');
      setShowPassword(false);
      setError('');
      setSuccessMsg('');
    }
  }, [isOpen, currentRole]);

  if (!isOpen) return null;

  const handleSelectRole = (role: UserRole) => {
    setSelectedRole(role);
    setPassword('');
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (selectedRole === 'viewer') {
      onRoleChanged('viewer');
      setSuccessMsg('Berhasil beralih ke peran Viewer (Hanya Lihat).');
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 700);
      return;
    }

    if (selectedRole === 'lead' || selectedRole === 'manager') {
      if (!password.trim()) {
        setError(`Harap masukkan kata sandi untuk peran ${ROLE_CONFIGS[selectedRole].name}.`);
        return;
      }

      const isValid = verifyRolePassword(selectedRole, password.trim());
      if (!isValid) {
        setError(`Kata sandi salah. Silakan coba lagi.`);
        return;
      }

      onRoleChanged(selectedRole);
      setSuccessMsg(`Berhasil login sebagai ${ROLE_CONFIGS[selectedRole].name}!`);
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 700);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl max-w-lg w-full p-6 shadow-xl relative my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                Hak Akses & Peran Pengguna
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Pilih peran untuk mengaktifkan izin modifikasi atau proteksi data
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Role selection radio cards */}
          <div className="space-y-2.5">
            {/* 1. Viewer */}
            <div
              onClick={() => handleSelectRole('viewer')}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                selectedRole === 'viewer'
                  ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/30 ring-1 ring-indigo-500'
                  : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-850'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-neutral-500" />
                  <span className="font-bold text-neutral-900 dark:text-neutral-100">
                    Viewer (Hanya Lihat)
                  </span>
                  {currentRole === 'viewer' && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-medium">
                      Aktif
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-neutral-400">Tanpa Password</span>
              </div>
              <p className="text-neutral-600 dark:text-neutral-400 pl-6 leading-relaxed">
                Hanya dapat melihat, mencari, dan membuka pintasan web serta direktori drive lokal. Tidak dapat menambah, mengubah, atau menghapus data.
              </p>
            </div>

            {/* 2. Lead Engineering */}
            <div
              onClick={() => handleSelectRole('lead')}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                selectedRole === 'lead'
                  ? 'border-amber-500 dark:border-amber-500 bg-amber-50/40 dark:bg-amber-950/30 ring-1 ring-amber-500'
                  : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-850'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-amber-500" />
                  <span className="font-bold text-neutral-900 dark:text-neutral-100">
                    Lead Engineering
                  </span>
                  {currentRole === 'lead' && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-200 dark:bg-amber-800/60 text-amber-900 dark:text-amber-200 font-medium">
                      Aktif
                    </span>
                  )}
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                  <Lock className="w-3 h-3" />
                  <span>Perlu Sandi</span>
                </span>
              </div>
              <p className="text-neutral-600 dark:text-neutral-400 pl-6 leading-relaxed">
                Dapat menambah dan mengedit pintasan serta kategori grup, <strong className="text-amber-700 dark:text-amber-300">tetapi tidak diizinkan menghapus</strong> pintasan maupun kategori.
              </p>
            </div>

            {/* 3. Manager Engineering */}
            <div
              onClick={() => handleSelectRole('manager')}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                selectedRole === 'manager'
                  ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/30 ring-1 ring-indigo-500'
                  : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-850'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="font-bold text-neutral-900 dark:text-neutral-100">
                    Manager Engineering (Full Akses)
                  </span>
                  {currentRole === 'manager' && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-200 dark:bg-indigo-800/60 text-indigo-900 dark:text-indigo-200 font-medium">
                      Aktif
                    </span>
                  )}
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
                  <Lock className="w-3 h-3" />
                  <span>Perlu Sandi</span>
                </span>
              </div>
              <p className="text-neutral-600 dark:text-neutral-400 pl-6 leading-relaxed">
                Memiliki hak penuh: menambah, mengedit, menghapus pintasan, mengelola/menghapus grup, dan memulihkan cadangan data.
              </p>
            </div>
          </div>

          {/* Password Input (shown when switching to lead or manager) */}
          {(selectedRole === 'lead' || selectedRole === 'manager') && (
            <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/70 dark:bg-neutral-800/50 space-y-2">
              <label className="block font-semibold text-neutral-800 dark:text-neutral-200">
                Masukkan Kata Sandi untuk {ROLE_CONFIGS[selectedRole].name}
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi..."
                  className="w-full pl-9 pr-16 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 px-1"
                >
                  {showPassword ? 'Sembunyi' : 'Lihat'}
                </button>
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Kata sandi bersifat rahasia. Masukkan sandi yang diberikan oleh administrator tim.
              </p>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100 dark:border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
            >
              {selectedRole === 'viewer' ? 'Aktifkan Viewer' : 'Verifikasi & Masuk'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
