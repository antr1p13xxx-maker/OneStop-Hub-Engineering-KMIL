import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Edit2,
  FolderKanban,
  ArrowUp,
  ArrowDown,
  Upload,
  Link2,
  Image as ImageIcon,
  RotateCcw,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react';
import { ShortcutGroup, ShortcutItem } from '../types';
import { DynamicIcon, AVAILABLE_GROUP_ICONS, isImageIcon } from './DynamicIcon';
import { processLogoImageFile } from '../utils/imageHelper';

export interface DeleteGroupOptions {
  mode: 'reassign' | 'purge';
  targetGroupId?: string;
}

interface ManageGroupsModalProps {
  isOpen: boolean;
  onClose: () => void;
  groups: ShortcutGroup[];
  shortcuts: ShortcutItem[];
  canManageGroups?: boolean;
  canDeleteGroup?: boolean;
  initialDeleteGroupId?: string | null;
  onSaveGroups: (groups: ShortcutGroup[]) => void;
  onReassignShortcuts: (fromGroupId: string, toGroupId: string) => void;
  onDeleteGroup?: (groupId: string, options: DeleteGroupOptions) => void;
  onOpenRoleSwitch?: () => void;
}

const COLOR_OPTIONS: Array<{ value: ShortcutGroup['color']; label: string; bg: string }> = [
  { value: 'blue', label: 'Biru (Kerja)', bg: 'bg-blue-500' },
  { value: 'emerald', label: 'Hijau (Drive & Lokal)', bg: 'bg-emerald-500' },
  { value: 'rose', label: 'Merah Muda (Pribadi)', bg: 'bg-rose-500' },
  { value: 'purple', label: 'Ungu (Dev & Alat)', bg: 'bg-purple-500' },
  { value: 'amber', label: 'Kuning / Emas (Keuangan)', bg: 'bg-amber-500' },
  { value: 'indigo', label: 'Indigo (Proyek)', bg: 'bg-indigo-500' },
  { value: 'cyan', label: 'Cyan (Media)', bg: 'bg-cyan-500' },
  { value: 'slate', label: 'Abu Netral (Umum)', bg: 'bg-neutral-500' },
];

export const ManageGroupsModal: React.FC<ManageGroupsModalProps> = ({
  isOpen,
  onClose,
  groups,
  shortcuts,
  canManageGroups = true,
  canDeleteGroup = true,
  initialDeleteGroupId = null,
  onSaveGroups,
  onReassignShortcuts,
  onDeleteGroup,
  onOpenRoleSwitch,
}) => {
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState<ShortcutGroup['color']>('blue');
  const [icon, setIcon] = useState('FolderKanban');
  const [iconTab, setIconTab] = useState<'preset' | 'photo'>('preset');
  const [photoUrlInput, setPhotoUrlInput] = useState('');
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [error, setError] = useState('');
  const [confirmDeleteGroupId, setConfirmDeleteGroupId] = useState<string | null>(null);
  const [deleteMode, setDeleteMode] = useState<'reassign' | 'purge'>('reassign');
  const [reassignTargetGroupId, setReassignTargetGroupId] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setConfirmDeleteGroupId(null);
      return;
    }
    setError('');
    if (initialDeleteGroupId && groups.some((g) => g.id === initialDeleteGroupId)) {
      const fallback = groups.find((g) => g.id !== initialDeleteGroupId);
      setConfirmDeleteGroupId(initialDeleteGroupId);
      setDeleteMode('reassign');
      setReassignTargetGroupId(fallback?.id || '');
      setIsCreatingNew(false);
      setEditingGroupId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialDeleteGroupId]);

  if (!isOpen) return null;

  const handleStartCreate = () => {
    setIsCreatingNew(true);
    setEditingGroupId(null);
    setName('');
    setDescription('');
    setColor('indigo');
    setIcon('FolderKanban');
    setIconTab('preset');
    setPhotoUrlInput('');
    setError('');
  };

  const handleStartEdit = (group: ShortcutGroup) => {
    setEditingGroupId(group.id);
    setIsCreatingNew(false);
    setName(group.name);
    setDescription(group.description || '');
    setColor(group.color);
    setIcon(group.icon);
    const usesPhoto = isImageIcon(group.icon);
    setIconTab(usesPhoto ? 'photo' : 'preset');
    setPhotoUrlInput(usesPhoto && !group.icon.startsWith('data:') ? group.icon : '');
    setError('');
  };

  const handlePhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setIsProcessingPhoto(true);
    try {
      const dataUrl = await processLogoImageFile(file, 160);
      if (dataUrl.length > 250000) {
        setError('Ukuran foto terlalu besar. Pilih gambar yang lebih kecil.');
        return;
      }
      setIcon(dataUrl);
      setPhotoUrlInput('');
      setIconTab('photo');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memproses foto ikon grup.');
    } finally {
      setIsProcessingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleApplyPhotoUrl = () => {
    const trimmed = photoUrlInput.trim();
    if (!trimmed) {
      setError('Masukkan URL gambar yang valid.');
      return;
    }
    if (!/^https?:\/\//i.test(trimmed) && !trimmed.startsWith('data:image/')) {
      setError('URL foto harus diawali http:// atau https://');
      return;
    }
    if (trimmed.length > 250000) {
      setError('URL foto terlalu panjang.');
      return;
    }
    setError('');
    setIcon(trimmed);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Harap masukkan nama grup kategori.');
      return;
    }

    if (isCreatingNew) {
      const newGroup: ShortcutGroup = {
        id: `group-${Date.now()}`,
        name: name.trim(),
        description: description.trim(),
        color,
        icon,
        order: groups.length + 1,
      };
      onSaveGroups([...groups, newGroup]);
      setIsCreatingNew(false);
    } else if (editingGroupId) {
      const updated = groups.map((g) =>
        g.id === editingGroupId
          ? {
              ...g,
              name: name.trim(),
              description: description.trim(),
              color,
              icon,
            }
          : g
      );
      onSaveGroups(updated);
      setEditingGroupId(null);
    }
  };

  const handleRequestDeleteGroup = (groupId: string) => {
    if (groups.length <= 1) {
      setError('Minimal harus ada satu grup kategori dalam dasbor.');
      return;
    }
    const targetFallbackGroup = groups.find((g) => g.id !== groupId);
    setError('');
    setIsCreatingNew(false);
    setEditingGroupId(null);
    setConfirmDeleteGroupId(groupId);
    setDeleteMode('reassign');
    setReassignTargetGroupId(targetFallbackGroup?.id || '');
  };

  const handleConfirmDeleteGroup = () => {
    if (!confirmDeleteGroupId) return;
    if (groups.length <= 1) {
      setError('Minimal harus ada satu grup kategori dalam dasbor.');
      setConfirmDeleteGroupId(null);
      return;
    }

    const fallbackGroup = groups.find((g) => g.id !== confirmDeleteGroupId);
    const chosenTargetId =
      deleteMode === 'reassign'
        ? reassignTargetGroupId || fallbackGroup?.id
        : undefined;

    if (onDeleteGroup) {
      onDeleteGroup(confirmDeleteGroupId, {
        mode: deleteMode,
        targetGroupId: chosenTargetId,
      });
    } else {
      const linkedShortcuts = shortcuts.filter((s) => s.groupId === confirmDeleteGroupId);
      if (linkedShortcuts.length > 0 && chosenTargetId) {
        onReassignShortcuts(confirmDeleteGroupId, chosenTargetId);
      }
      const updated = groups
        .filter((g) => g.id !== confirmDeleteGroupId)
        .map((g, idx) => ({ ...g, order: idx + 1 }));
      onSaveGroups(updated);
    }

    if (editingGroupId === confirmDeleteGroupId) setEditingGroupId(null);
    setConfirmDeleteGroupId(null);
  };

  const handleMoveOrder = (index: number, direction: 'up' | 'down') => {
    const newGroups = [...groups];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newGroups.length) return;

    const temp = newGroups[index];
    newGroups[index] = newGroups[targetIndex];
    newGroups[targetIndex] = temp;

    // Reassign order sequence
    const reordered = newGroups.map((g, i) => ({ ...g, order: i + 1 }));
    onSaveGroups(reordered);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl max-w-xl w-full p-6 shadow-xl clay-modal relative my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100 dark:border-neutral-800">
          <div>
            <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <FolderKanban className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>Kelola Grup & Kategori Pintasan</span>
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Kelompokkan pintasan berdasarkan pekerjaan, drive lokal (D:), pribadi, dll.
            </p>
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
        <div className="mt-5 space-y-4">
          {!canManageGroups && (
            <div className="p-3 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs border border-neutral-200 dark:border-neutral-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span>
                Mode <strong>Viewer</strong>: Anda hanya dapat melihat daftar grup. Beralih ke Lead atau Manager untuk mengedit/menghapus.
              </span>
              {onOpenRoleSwitch && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenRoleSwitch();
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shrink-0 transition-colors cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Ubah Peran</span>
                </button>
              )}
            </div>
          )}

          {!canDeleteGroup && canManageGroups && (
            <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 text-xs border border-amber-200 dark:border-amber-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span>
                Peran <strong>Lead Engineering</strong>: Bisa tambah & edit grup. Untuk <strong>hapus grup</strong>, gunakan peran Manager.
              </span>
              {onOpenRoleSwitch && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenRoleSwitch();
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-600 hover:bg-amber-700 text-white font-semibold shrink-0 transition-colors cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Aktifkan Manager</span>
                </button>
              )}
            </div>
          )}

          {error && !isCreatingNew && !editingGroupId && (
            <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs border border-rose-200 dark:border-rose-900">
              {error}
            </div>
          )}

          {/* In-Modal Delete Group Confirmation */}
          {confirmDeleteGroupId && canDeleteGroup && (() => {
            const targetGroup = groups.find((g) => g.id === confirmDeleteGroupId);
            if (!targetGroup) return null;
            const linkedCount = shortcuts.filter((s) => s.groupId === targetGroup.id).length;
            const otherGroups = groups.filter((g) => g.id !== targetGroup.id);

            return (
              <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/70 bg-rose-50/70 dark:bg-rose-950/30 space-y-3 text-xs animate-in fade-in duration-150">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-rose-900 dark:text-rose-200">
                      Hapus Grup &ldquo;{targetGroup.name}&rdquo;?
                    </h3>
                    <p className="text-rose-800/90 dark:text-rose-300/90 mt-0.5">
                      {linkedCount === 0
                        ? 'Grup ini tidak memiliki pintasan dan akan dihapus permanen.'
                        : `Grup ini berisi ${linkedCount} pintasan. Pilih perlakuan untuk pintasan di dalamnya:`}
                    </p>
                  </div>
                </div>

                {linkedCount > 0 && (
                  <div className="space-y-2 pl-6">
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="deleteGroupMode"
                        checked={deleteMode === 'reassign'}
                        onChange={() => setDeleteMode('reassign')}
                        className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div className="flex-1 space-y-1.5">
                        <span className="font-semibold text-neutral-900 dark:text-neutral-100 block">
                          Pindahkan {linkedCount} pintasan ke grup lain (Direkomendasikan)
                        </span>
                        {deleteMode === 'reassign' && (
                          <select
                            value={reassignTargetGroupId}
                            onChange={(e) => setReassignTargetGroupId(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
                          >
                            {otherGroups.map((og) => (
                              <option key={og.id} value={og.id}>
                                {og.name}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    </label>

                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="deleteGroupMode"
                        checked={deleteMode === 'purge'}
                        onChange={() => setDeleteMode('purge')}
                        className="mt-0.5 text-rose-600 focus:ring-rose-500"
                      />
                      <span className="font-semibold text-rose-700 dark:text-rose-300">
                        Hapus grup beserta {linkedCount} pintasannya secara permanen
                      </span>
                    </label>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteGroupId(null)}
                    className="px-3 py-1.5 rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200/70 dark:hover:bg-neutral-800 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDeleteGroup}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-xs transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Ya, Hapus Grup</span>
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Action to create new group */}
          {canManageGroups && !isCreatingNew && !editingGroupId && !confirmDeleteGroupId && (
            <button
              type="button"
              onClick={handleStartCreate}
              className="w-full py-2.5 px-3 border border-dashed border-neutral-300 dark:border-neutral-700 hover:border-indigo-500 dark:hover:border-indigo-400 rounded-lg text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center justify-center gap-2 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Kategori Grup Baru</span>
            </button>
          )}

          {/* Form Create / Edit */}
          {(isCreatingNew || editingGroupId) && (
            <form
              onSubmit={handleSaveForm}
              className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/30 dark:bg-indigo-950/20 space-y-3 text-xs"
            >
              <h3 className="font-bold text-neutral-900 dark:text-neutral-100">
                {isCreatingNew ? 'Tambah Grup Baru' : 'Edit Kategori Grup'}
              </h3>

              {error && (
                <div className="p-2 rounded bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 text-xs">
                  {error}
                </div>
              )}

              <div>
                <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Nama Kategori
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="misal: Proyek Klien A, Keuangan, Hiburan..."
                  className="w-full px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Deskripsi Singkat
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="misal: Berisi semua link dan folder terkait proyek"
                  className="w-full px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Warna Aksen
                </label>
                <select
                  value={color}
                  onChange={(e) => setColor(e.target.value as ShortcutGroup['color'])}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                >
                  {COLOR_OPTIONS.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Group Icon / Custom Photo Picker */}
              <div className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-700/80 bg-white/70 dark:bg-neutral-900/60 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="font-medium text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Ikon atau Foto Grup</span>
                  </label>
                  <div className="inline-flex p-0.5 rounded-lg bg-neutral-100 dark:bg-neutral-800">
                    <button
                      type="button"
                      onClick={() => {
                        setIconTab('preset');
                        if (isImageIcon(icon)) {
                          setIcon('FolderKanban');
                        }
                      }}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                        iconTab === 'preset'
                          ? 'bg-white dark:bg-neutral-900 text-indigo-600 dark:text-indigo-400 shadow-2xs font-semibold'
                          : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                      }`}
                    >
                      Ikon Bawaan
                    </button>
                    <button
                      type="button"
                      onClick={() => setIconTab('photo')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                        iconTab === 'photo'
                          ? 'bg-white dark:bg-neutral-900 text-indigo-600 dark:text-indigo-400 shadow-2xs font-semibold'
                          : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                      }`}
                    >
                      Foto Kustom
                    </button>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  {/* Live Icon/Photo Preview */}
                  <div className="w-11 h-11 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 overflow-hidden flex items-center justify-center shrink-0 shadow-2xs">
                    {isImageIcon(icon) ? (
                      <img src={icon} alt="Pratinjau grup" className="w-full h-full object-cover" />
                    ) : (
                      <DynamicIcon name={icon} className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    )}
                  </div>

                  {iconTab === 'preset' ? (
                    <div className="flex-1 min-w-0">
                      <select
                        value={isImageIcon(icon) ? 'FolderKanban' : icon}
                        onChange={(e) => setIcon(e.target.value)}
                        className="w-full px-2.5 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                      >
                        {AVAILABLE_GROUP_ICONS.map((i) => (
                          <option key={i.name} value={i.name}>
                            {i.label}
                          </option>
                        ))}
                      </select>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
                        Atau pilih tab &ldquo;Foto Kustom&rdquo; untuk mengganti ikon dengan foto.
                      </p>
                    </div>
                  ) : (
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                          onChange={handlePhotoFileChange}
                          className="hidden"
                        />
                        <button
                          type="button"
                          disabled={isProcessingPhoto}
                          onClick={() => fileInputRef.current?.click()}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 rounded-lg transition-colors cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>{isProcessingPhoto ? 'Memproses...' : 'Pilih Foto'}</span>
                        </button>

                        {isImageIcon(icon) && (
                          <button
                            type="button"
                            onClick={() => {
                              setIcon('FolderKanban');
                              setPhotoUrlInput('');
                              setIconTab('preset');
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium text-neutral-600 dark:text-neutral-300 hover:text-rose-600 dark:hover:text-rose-400 bg-neutral-100 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 transition-colors"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Reset Ikon</span>
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <div className="relative flex-1">
                          <Link2 className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                          <input
                            type="url"
                            value={photoUrlInput}
                            onChange={(e) => setPhotoUrlInput(e.target.value)}
                            placeholder="Atau tempel URL foto (https://...)"
                            className="w-full pl-7 pr-2.5 py-1 text-[11px] rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleApplyPhotoUrl}
                          className="px-2.5 py-1 text-[11px] font-semibold rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 shrink-0"
                        >
                          Pakai URL
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingNew(false);
                    setEditingGroupId(null);
                  }}
                  className="px-3 py-1.5 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-xs transition-colors"
                >
                  Simpan Grup
                </button>
              </div>
            </form>
          )}

          {/* Group List */}
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {groups.map((group, index) => {
              const count = shortcuts.filter((s) => s.groupId === group.id).length;
              return (
                <div
                  key={group.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/40 text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center overflow-hidden shrink-0">
                      {isImageIcon(group.icon) ? (
                        <img src={group.icon} alt={group.name} className="w-full h-full object-cover" />
                      ) : (
                        <DynamicIcon name={group.icon} className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                          {group.name}
                        </span>
                        <span className="text-neutral-400 tabular-nums">· {count} pintasan</span>
                      </div>
                      {group.description && (
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                          {group.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  {canManageGroups && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleMoveOrder(index, 'up')}
                        disabled={index === 0}
                        title="Geser ke atas"
                        className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 disabled:opacity-30 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveOrder(index, 'down')}
                        disabled={index === groups.length - 1}
                        title="Geser ke bawah"
                        className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 disabled:opacity-30 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStartEdit(group)}
                        title="Edit grup"
                        className="p-1 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {canDeleteGroup && (
                        <button
                          type="button"
                          onClick={() => handleRequestDeleteGroup(group.id)}
                          disabled={groups.length <= 1}
                          title={
                            groups.length <= 1
                              ? 'Minimal 1 grup harus tersisa'
                              : `Hapus grup ${group.name}`
                          }
                          className="p-1 text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 disabled:opacity-30 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-neutral-100 dark:border-neutral-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
