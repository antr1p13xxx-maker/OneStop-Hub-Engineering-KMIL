import React, { useState, useEffect } from 'react';
import {
  X,
  Globe,
  HardDrive,
  Cpu,
  Folder,
  Check,
  Sparkles,
  Pin,
  HelpCircle,
  Layers,
  Search,
} from 'lucide-react';
import { ShortcutItem, ShortcutGroup, ShortcutType } from '../types';
import { detectShortcutType, normalizePath, getFaviconUrl } from '../utils/pathHelper';
import { DynamicIcon, AVAILABLE_SHORTCUT_ICONS, ICON_CATEGORIES } from './DynamicIcon';

interface AddEditShortcutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (shortcut: Partial<ShortcutItem> & { title: string; url: string; groupId: string }) => void;
  groups: ShortcutGroup[];
  editingShortcut?: ShortcutItem | null;
  defaultGroupId?: string;
  defaultType?: ShortcutType;
}

export const AddEditShortcutModal: React.FC<AddEditShortcutModalProps> = ({
  isOpen,
  onClose,
  onSave,
  groups,
  editingShortcut,
  defaultGroupId,
  defaultType = 'web',
}) => {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [type, setType] = useState<ShortcutType>(defaultType);
  const [groupId, setGroupId] = useState('');
  const [description, setDescription] = useState('');
  const [iconValue, setIconValue] = useState('Globe');
  const [iconType, setIconType] = useState<'preset' | 'favicon' | 'drive'>('preset');
  const [isPinned, setIsPinned] = useState(false);
  const [error, setError] = useState('');
  const [iconSearch, setIconSearch] = useState('');
  const [iconCategory, setIconCategory] = useState<string>('all');

  useEffect(() => {
    if (editingShortcut) {
      setTitle(editingShortcut.title);
      setUrl(editingShortcut.url);
      setType(editingShortcut.type);
      setGroupId(editingShortcut.groupId);
      setDescription(editingShortcut.description || '');
      setIconValue(editingShortcut.iconValue || 'Globe');
      setIconType(editingShortcut.iconType === 'custom' ? 'preset' : editingShortcut.iconType);
      setIsPinned(!!editingShortcut.isPinned);
    } else {
      setTitle('');
      setUrl('');
      setType(defaultType);
      setGroupId(defaultGroupId || groups[0]?.id || '');
      setDescription('');
      if (defaultType === 'directory') {
        setIconValue('HardDrive');
        setIconType('drive');
      } else {
        setIconValue('Globe');
        setIconType('favicon');
      }
      setIsPinned(false);
    }
    setError('');
  }, [editingShortcut, isOpen, defaultGroupId, defaultType, groups]);

  if (!isOpen) return null;

  // Auto detect type when user enters url
  const handleUrlChange = (value: string) => {
    setUrl(value);
    if (!editingShortcut) {
      const detected = detectShortcutType(value);
      setType(detected);
      if (detected === 'directory') {
        setIconValue('HardDrive');
        setIconType('drive');
        // Auto assign to drive group if available
        const driveGroup = groups.find((g) => g.id.includes('drive') || g.name.toLowerCase().includes('drive'));
        if (driveGroup && !groupId) {
          setGroupId(driveGroup.id);
        }
      } else if (detected === 'web') {
        setIconType('favicon');
      }
    }
  };

  const handleApplyPresetDirectory = (presetPath: string, presetTitle: string) => {
    setUrl(presetPath);
    setTitle(presetTitle);
    setType('directory');
    setIconValue('HardDrive');
    setIconType('drive');
    const driveGroup = groups.find((g) => g.id.includes('drive') || g.name.toLowerCase().includes('drive'));
    if (driveGroup) {
      setGroupId(driveGroup.id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Harap masukkan nama / judul pintasan.');
      return;
    }
    if (!url.trim()) {
      setError('Harap masukkan tautan URL atau alamat direktori folder.');
      return;
    }
    if (!groupId) {
      setError('Harap pilih kategori grup.');
      return;
    }

    const cleanedUrl = normalizePath(url, type);

    onSave({
      id: editingShortcut?.id,
      title: title.trim(),
      url: cleanedUrl,
      type,
      groupId,
      description: description.trim(),
      iconType: type === 'directory' ? 'drive' : iconType,
      iconValue,
      isPinned,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl max-w-lg w-full p-6 shadow-xl relative my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100 dark:border-neutral-800">
          <div>
            <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              {editingShortcut ? 'Edit Pintasan' : 'Tambah Pintasan Baru'}
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Masukkan link web, folder Drive D:, atau aplikasi untuk akses instan
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs border border-rose-200 dark:border-rose-900">
              {error}
            </div>
          )}

          {/* Type Selector Tabs */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
              Tipe Layanan
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-neutral-100 dark:bg-neutral-800/70 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => {
                  setType('web');
                  setIconType('favicon');
                }}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-md font-medium transition-all ${
                  type === 'web'
                    ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
              >
                <Globe className="w-3.5 h-3.5 text-blue-500" />
                <span>Web App</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setType('directory');
                  setIconType('drive');
                  setIconValue('HardDrive');
                }}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-md font-medium transition-all ${
                  type === 'directory'
                    ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
              >
                <HardDrive className="w-3.5 h-3.5 text-emerald-500" />
                <span>Drive Lokal (D:)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setType('protocol');
                  setIconType('preset');
                }}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-md font-medium transition-all ${
                  type === 'protocol'
                    ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
              >
                <Cpu className="w-3.5 h-3.5 text-purple-500" />
                <span>App Desktop</span>
              </button>
            </div>
          </div>

          {/* Quick presets for Drive directories */}
          {type === 'directory' && (
            <div className="p-3 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 text-xs">
              <span className="font-semibold text-emerald-900 dark:text-emerald-300 block mb-1.5">
                Template Cepat Folder Drive:
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => handleApplyPresetDirectory('D:\\Proyek_Utama', 'Drive D: Proyek')}
                  className="px-2 py-1 rounded bg-white dark:bg-neutral-800 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
                >
                  + D:\Proyek_Utama
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPresetDirectory('D:\\Aset_Desain', 'Drive D: Aset Desain')}
                  className="px-2 py-1 rounded bg-white dark:bg-neutral-800 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
                >
                  + D:\Aset_Desain
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPresetDirectory('C:\\Users\\User\\Downloads', 'Drive C: Unduhan')}
                  className="px-2 py-1 rounded bg-white dark:bg-neutral-800 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
                >
                  + C:\Downloads
                </button>
              </div>
            </div>
          )}

          {/* URL / Path Input */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              {type === 'directory'
                ? 'Alamat Direktori Folder (misal: D:\\Proyek)'
                : type === 'protocol'
                ? 'URI Protokol Aplikasi (misal: vscode://file/...)'
                : 'URL / Tautan Website'}
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder={
                type === 'directory'
                  ? 'D:\\Proyek\\Website atau file:///D:/Dokumen'
                  : type === 'protocol'
                  ? 'vscode://file/D:/Workspace'
                  : 'https://mail.google.com atau github.com'
              }
              className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
            />
          </div>

          {/* Title / Name */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Nama / Judul Pintasan
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="misal: Drive D: Dokumen Klien, Gmail, Figma..."
              className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Category Group Selector */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Kategori Grup
            </label>
            <select
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Deskripsi / Catatan Singkat (Opsional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="misal: Arsip file render dan rekaman video"
              className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Icon Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Pilihan Ikon Pintasan ({AVAILABLE_SHORTCUT_ICONS.length} Ikon Variatif)
              </label>
              {type === 'web' && (
                <div className="flex items-center gap-1.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setIconType('favicon')}
                    className={`px-2 py-0.5 rounded transition-colors ${
                      iconType === 'favicon'
                        ? 'bg-indigo-600 text-white font-medium'
                        : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                    }`}
                  >
                    Favicon Web Otomatis
                  </button>
                  <button
                    type="button"
                    onClick={() => setIconType('preset')}
                    className={`px-2 py-0.5 rounded transition-colors ${
                      iconType === 'preset'
                        ? 'bg-indigo-600 text-white font-medium'
                        : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                    }`}
                  >
                    Ikon Kustom
                  </button>
                </div>
              )}
            </div>

            {/* Selected icon summary */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <DynamicIcon name={iconValue} className="w-4 h-4" />
                </div>
                <div className="text-[11px]">
                  <span className="text-neutral-500 dark:text-neutral-400">Ikon Terpilih: </span>
                  <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                    {AVAILABLE_SHORTCUT_ICONS.find((i) => i.name === iconValue)?.label || iconValue}
                  </span>
                </div>
              </div>

              {iconType === 'favicon' && type === 'web' && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                  Favicon Domain Aktif
                </span>
              )}
            </div>

            {/* Icon Search & Category Filter */}
            <div className="space-y-1.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  value={iconSearch}
                  onChange={(e) => setIconSearch(e.target.value)}
                  placeholder="Cari ikon: folder, drive, code, database, mail, rapat, finance..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-850 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Category tabs */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px]">
                {ICON_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setIconCategory(cat.id)}
                    className={`px-2 py-0.5 rounded-md whitespace-nowrap transition-colors ${
                      iconCategory === cat.id
                        ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 font-medium'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Icon grid */}
            <div className="grid grid-cols-6 sm:grid-cols-8 gap-1.5 max-h-36 overflow-y-auto p-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-850">
              {AVAILABLE_SHORTCUT_ICONS.filter((item) => {
                const matchesCategory = iconCategory === 'all' || item.category === iconCategory;
                const matchesSearch =
                  !iconSearch.trim() ||
                  item.label.toLowerCase().includes(iconSearch.toLowerCase()) ||
                  item.name.toLowerCase().includes(iconSearch.toLowerCase());
                return matchesCategory && matchesSearch;
              }).map((item) => {
                const isSelected = iconValue === item.name;
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => {
                      setIconValue(item.name);
                      setIconType(type === 'directory' ? 'drive' : 'preset');
                    }}
                    className={`p-2 rounded-lg flex flex-col items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-400'
                        : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                    title={item.label}
                  >
                    <DynamicIcon name={item.name} className="w-4 h-4" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pin toggle */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="pin-shortcut"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-neutral-300 dark:border-neutral-700 focus:ring-indigo-500"
            />
            <label htmlFor="pin-shortcut" className="text-xs text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
              <Pin className="w-3.5 h-3.5 text-amber-500" />
              <span>Sematkan ke panel Akses Cepat Favorit di bagian atas</span>
            </label>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100 dark:border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg shadow-xs transition-colors"
            >
              {editingShortcut ? 'Simpan Perubahan' : 'Tambahkan ke Dasbor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
