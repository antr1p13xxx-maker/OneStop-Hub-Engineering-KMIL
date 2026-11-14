import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Edit2,
  Check,
  FolderKanban,
  ArrowUp,
  ArrowDown,
  Layers,
} from 'lucide-react';
import { ShortcutGroup, ShortcutItem } from '../types';
import { DynamicIcon, AVAILABLE_GROUP_ICONS } from './DynamicIcon';

interface ManageGroupsModalProps {
  isOpen: boolean;
  onClose: () => void;
  groups: ShortcutGroup[];
  shortcuts: ShortcutItem[];
  canManageGroups?: boolean;
  canDeleteGroup?: boolean;
  onSaveGroups: (groups: ShortcutGroup[]) => void;
  onReassignShortcuts: (fromGroupId: string, toGroupId: string) => void;
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
  onSaveGroups,
  onReassignShortcuts,
}) => {
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState<ShortcutGroup['color']>('blue');
  const [icon, setIcon] = useState('FolderKanban');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleStartCreate = () => {
    setIsCreatingNew(true);
    setEditingGroupId(null);
    setName('');
    setDescription('');
    setColor('indigo');
    setIcon('FolderKanban');
    setError('');
  };

  const handleStartEdit = (group: ShortcutGroup) => {
    setEditingGroupId(group.id);
    setIsCreatingNew(false);
    setName(group.name);
    setDescription(group.description || '');
    setColor(group.color);
    setIcon(group.icon);
    setError('');
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

  const handleDeleteGroup = (groupId: string) => {
    if (groups.length <= 1) {
      alert('Minimal harus ada satu grup kategori dalam dasbor.');
      return;
    }

    const linkedShortcuts = shortcuts.filter((s) => s.groupId === groupId);
    const targetFallbackGroup = groups.find((g) => g.id !== groupId);

    if (linkedShortcuts.length > 0 && targetFallbackGroup) {
      const confirmed = window.confirm(
        `Grup ini berisi ${linkedShortcuts.length} pintasan. Pintasan tersebut akan dipindahkan otomatis ke grup "${targetFallbackGroup.name}". Lanjutkan hapus grup?`
      );
      if (!confirmed) return;
      onReassignShortcuts(groupId, targetFallbackGroup.id);
    }

    const updated = groups.filter((g) => g.id !== groupId);
    onSaveGroups(updated);
    if (editingGroupId === groupId) setEditingGroupId(null);
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
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl max-w-xl w-full p-6 shadow-xl relative my-8">
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
            <div className="p-3 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-xs border border-neutral-200 dark:border-neutral-700">
              Mode <strong>Viewer</strong>: Anda hanya dapat melihat daftar grup. Beralih ke Lead Engineering atau Manager untuk mengedit.
            </div>
          )}

          {!canDeleteGroup && canManageGroups && (
            <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 text-xs border border-amber-200 dark:border-amber-800">
              Peran <strong>Lead Engineering</strong>: Diizinkan menambah dan mengedit grup, tetapi tidak dapat menghapus kategori grup.
            </div>
          )}

          {/* Action to create new group */}
          {canManageGroups && !isCreatingNew && !editingGroupId && (
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Warna Aksen
                  </label>
                  <select
                    value={color}
                    onChange={(e) => setColor(e.target.value as ShortcutGroup['color'])}
                    className="w-full px-2 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                  >
                    {COLOR_OPTIONS.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Ikon Kategori
                  </label>
                  <select
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                  >
                    {AVAILABLE_GROUP_ICONS.map((i) => (
                      <option key={i.name} value={i.name}>
                        {i.label}
                      </option>
                    ))}
                  </select>
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
                    <div className="w-8 h-8 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center shrink-0">
                      <DynamicIcon name={group.icon} className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
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
                          onClick={() => handleDeleteGroup(group.id)}
                          title="Hapus grup"
                          className="p-1 text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40"
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
