import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Globe,
  HardDrive,
  Cpu,
  Pin,
  Search,
  Upload,
  Link2,
  Image as ImageIcon,
  RotateCcw,
} from 'lucide-react';
import { ShortcutItem, ShortcutGroup, ShortcutType } from '../types';
import { detectShortcutType, normalizePath } from '../utils/pathHelper';
import { DynamicIcon, AVAILABLE_SHORTCUT_ICONS, ICON_CATEGORIES, isImageIcon } from './DynamicIcon';
import { processLogoImageFile } from '../utils/imageHelper';

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
  const [iconType, setIconType] = useState<'preset' | 'favicon' | 'custom' | 'drive'>('preset');
  const [iconTab, setIconTab] = useState<'favicon' | 'preset' | 'photo'>('favicon');
  const [photoUrlInput, setPhotoUrlInput] = useState('');
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [error, setError] = useState('');
  const [iconSearch, setIconSearch] = useState('');
  const [iconCategory, setIconCategory] = useState<string>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingShortcut) {
      setTitle(editingShortcut.title);
      setUrl(editingShortcut.url);
      setType(editingShortcut.type);
      setGroupId(editingShortcut.groupId);
      setDescription(editingShortcut.description || '');
      const existingIconVal = editingShortcut.iconValue || (editingShortcut.type === 'directory' ? 'HardDrive' : 'Globe');
      const hasCustomPhoto = editingShortcut.iconType === 'custom' && isImageIcon(existingIconVal);
      setIconValue(existingIconVal);
      setIconType(editingShortcut.iconType);
      setIconTab(
        hasCustomPhoto
          ? 'photo'
          : editingShortcut.iconType === 'favicon' && editingShortcut.type === 'web'
          ? 'favicon'
          : 'preset'
      );
      setPhotoUrlInput(hasCustomPhoto && !existingIconVal.startsWith('data:') ? existingIconVal : '');
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
        setIconTab('preset');
      } else {
        setIconValue('Globe');
        setIconType('favicon');
        setIconTab('favicon');
      }
      setPhotoUrlInput('');
      setIsPinned(false);
    }
    setError('');
  }, [editingShortcut, isOpen, defaultGroupId, defaultType, groups]);

  if (!isOpen) return null;

  const hasCustomPhoto = iconType === 'custom' && isImageIcon(iconValue);

  // Auto detect type when user enters url
  const handleUrlChange = (value: string) => {
    setUrl(value);
    if (!editingShortcut) {
      const detected = detectShortcutType(value);
      setType(detected);
      if (!hasCustomPhoto) {
        if (detected === 'directory') {
          setIconValue('HardDrive');
          setIconType('drive');
          setIconTab('preset');
          // Auto assign to drive group if available
          const driveGroup = groups.find((g) => g.id.includes('drive') || g.name.toLowerCase().includes('drive'));
          if (driveGroup && !groupId) {
            setGroupId(driveGroup.id);
          }
        } else if (detected === 'web') {
          setIconType('favicon');
          setIconTab('favicon');
        }
      }
    }
  };

  const handleApplyPresetDirectory = (presetPath: string, presetTitle: string) => {
    setUrl(presetPath);
    setTitle(presetTitle);
    setType('directory');
    if (!hasCustomPhoto) {
      setIconValue('HardDrive');
      setIconType('drive');
      setIconTab('preset');
    }
    const driveGroup = groups.find((g) => g.id.includes('drive') || g.name.toLowerCase().includes('drive'));
    if (driveGroup) {
      setGroupId(driveGroup.id);
    }
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
      setIconValue(dataUrl);
      setIconType('custom');
      setIconTab('photo');
      setPhotoUrlInput('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memproses foto ikon pintasan.');
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
      setError('URL foto terlalu panjang (maksimal 250KB).');
      return;
    }
    setError('');
    setIconValue(trimmed);
    setIconType('custom');
    setIconTab('photo');
  };

  const handleResetToDefaultIcon = () => {
    setPhotoUrlInput('');
    if (type === 'directory') {
      setIconValue('HardDrive');
      setIconType('drive');
      setIconTab('preset');
    } else if (type === 'web') {
      setIconValue('Globe');
      setIconType('favicon');
      setIconTab('favicon');
    } else {
      setIconValue('Globe');
      setIconType('preset');
      setIconTab('preset');
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
    const resolvedIconType: ShortcutItem['iconType'] =
      iconType === 'custom' && isImageIcon(iconValue)
        ? 'custom'
        : type === 'directory'
        ? 'drive'
        : iconType === 'favicon' && type !== 'web'
        ? 'preset'
        : iconType;
    const resolvedIconValue =
      resolvedIconType === 'custom'
        ? iconValue
        : isImageIcon(iconValue)
        ? type === 'directory'
          ? 'HardDrive'
          : 'Globe'
        : iconValue;

    onSave({
      id: editingShortcut?.id,
      title: title.trim(),
      url: cleanedUrl,
      type,
      groupId,
      description: description.trim(),
      iconType: resolvedIconType,
      iconValue: resolvedIconValue,
      isPinned,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl max-w-lg w-full p-6 shadow-xl clay-modal relative my-8">
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
                  if (!hasCustomPhoto) {
                    setIconType('favicon');
                    setIconTab('favicon');
                  }
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
                  if (!hasCustomPhoto) {
                    setIconType('drive');
                    setIconValue('HardDrive');
                    setIconTab('preset');
                  }
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
                  if (!hasCustomPhoto) {
                    setIconType('preset');
                    setIconTab('preset');
                  }
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
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Pilihan Ikon Pintasan
              </label>
              <div className="inline-flex items-center gap-1 p-0.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-[11px]">
                {type === 'web' && (
                  <button
                    type="button"
                    onClick={() => {
                      setIconTab('favicon');
                      setIconType('favicon');
                      if (isImageIcon(iconValue)) {
                        setIconValue('Globe');
                      }
                    }}
                    className={`px-2 py-0.5 rounded-md transition-colors ${
                      iconTab === 'favicon'
                        ? 'bg-indigo-600 text-white font-medium shadow-2xs'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                    }`}
                  >
                    Favicon Otomatis
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setIconTab('preset');
                    setIconType(type === 'directory' ? 'drive' : 'preset');
                    if (isImageIcon(iconValue)) {
                      setIconValue(type === 'directory' ? 'HardDrive' : 'Globe');
                    }
                  }}
                  className={`px-2 py-0.5 rounded-md transition-colors ${
                    iconTab === 'preset'
                      ? 'bg-indigo-600 text-white font-medium shadow-2xs'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                  }`}
                >
                  Ikon Kustom
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIconTab('photo');
                    if (isImageIcon(iconValue)) {
                      setIconType('custom');
                    }
                  }}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md transition-colors ${
                    iconTab === 'photo'
                      ? 'bg-indigo-600 text-white font-medium shadow-2xs'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                  }`}
                >
                  <ImageIcon className="w-3 h-3" />
                  <span>Foto Kustom</span>
                </button>
              </div>
            </div>

            {/* Selected icon summary */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center overflow-hidden text-indigo-600 dark:text-indigo-400 shrink-0">
                  {hasCustomPhoto ? (
                    <img src={iconValue} alt="Ikon foto kustom" className="w-full h-full object-cover" />
                  ) : (
                    <DynamicIcon
                      name={isImageIcon(iconValue) ? 'Globe' : iconValue}
                      className="w-4 h-4"
                    />
                  )}
                </div>
                <div className="text-[11px]">
                  <span className="text-neutral-500 dark:text-neutral-400">Ikon Terpilih: </span>
                  <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                    {hasCustomPhoto
                      ? 'Foto Kustom'
                      : AVAILABLE_SHORTCUT_ICONS.find((i) => i.name === iconValue)?.label || iconValue}
                  </span>
                </div>
              </div>

              {hasCustomPhoto ? (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-medium">
                  Foto Kustom Aktif
                </span>
              ) : (
                iconType === 'favicon' &&
                type === 'web' && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                    Favicon Domain Aktif
                  </span>
                )
              )}
            </div>

            {iconTab === 'photo' ? (
              <div className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-850 space-y-2.5 text-xs">
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
                    <span>{isProcessingPhoto ? 'Memproses...' : 'Pilih Foto dari Perangkat'}</span>
                  </button>

                  {hasCustomPhoto && (
                    <button
                      type="button"
                      onClick={handleResetToDefaultIcon}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium text-neutral-600 dark:text-neutral-300 hover:text-rose-600 dark:hover:text-rose-400 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset ke Ikon Bawaan</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <div className="relative flex-1">
                    <Link2 className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                      type="url"
                      value={photoUrlInput}
                      onChange={(e) => setPhotoUrlInput(e.target.value)}
                      placeholder="Atau tempel URL foto (https://...)"
                      className="w-full pl-8 pr-2.5 py-1.5 text-[11px] rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyPhotoUrl}
                    className="px-2.5 py-1.5 text-[11px] font-semibold rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 shrink-0"
                  >
                    Pakai URL
                  </button>
                </div>

                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  Foto akan dikompres otomatis (maks 250KB) dan tampil pada semua tampilan dasbor termasuk Orbit.
                </p>
              </div>
            ) : (
              <>
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
                    const isSelected = !hasCustomPhoto && iconValue === item.name;
                    return (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => {
                          setIconValue(item.name);
                          setIconType(type === 'directory' ? 'drive' : 'preset');
                          setIconTab('preset');
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
              </>
            )}
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
