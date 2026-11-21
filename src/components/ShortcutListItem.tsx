import React, { useState, useRef, useEffect } from 'react';
import {
  ExternalLink,
  Copy,
  Check,
  MoreVertical,
  Pin,
  Trash2,
  Edit2,
  HardDrive,
  FolderOpen,
} from 'lucide-react';
import { ShortcutItem, ShortcutGroup } from '../types';
import { DynamicIcon, isImageIcon } from './DynamicIcon';
import { getFaviconUrl, copyToClipboard } from '../utils/pathHelper';
import { getGroupColorTheme } from '../utils/colorTheme';

interface ShortcutListItemProps {
  shortcut: ShortcutItem;
  group?: ShortcutGroup;
  canEditShortcut?: boolean;
  canDeleteShortcut?: boolean;
  onLaunch: (shortcut: ShortcutItem) => void;
  onEdit: (shortcut: ShortcutItem) => void;
  onDelete: (id: string) => void;
  onTogglePin: (shortcut: ShortcutItem) => void;
}

export const ShortcutListItem: React.FC<ShortcutListItemProps> = ({
  shortcut,
  group,
  canEditShortcut = true,
  canDeleteShortcut = true,
  onLaunch,
  onEdit,
  onDelete,
  onTogglePin,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCopyPath = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const success = await copyToClipboard(shortcut.url);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const [customPhotoError, setCustomPhotoError] = useState(false);
  const [faviconError, setFaviconError] = useState(false);

  useEffect(() => {
    setCustomPhotoError(false);
    setFaviconError(false);
  }, [shortcut.iconValue, shortcut.iconType, shortcut.url]);

  const isDirectory = shortcut.type === 'directory';
  const colorTheme = getGroupColorTheme(group?.color);
  const hasCustomPhoto = shortcut.iconType === 'custom' && isImageIcon(shortcut.iconValue) && !customPhotoError;
  const favicon = shortcut.iconType === 'favicon' && !faviconError ? getFaviconUrl(shortcut.url) : null;

  return (
    <div
      onClick={() => onLaunch(shortcut)}
      className="group flex items-center justify-between gap-4 p-3 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/25 border-b border-neutral-100 dark:border-neutral-800/80 transition-colors cursor-pointer text-xs"
    >
      {/* Icon + Title + Group */}
      <div className="flex items-center gap-3 min-w-[240px] flex-1">
        <div className={`w-8 h-8 rounded-md border flex items-center justify-center shrink-0 overflow-hidden shadow-2xs clay-icon-well ${colorTheme.iconBg}`}>
          {hasCustomPhoto ? (
            <img
              src={shortcut.iconValue}
              alt={shortcut.title}
              onError={() => setCustomPhotoError(true)}
              className="w-full h-full object-cover"
            />
          ) : isDirectory ? (
            <HardDrive className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          ) : favicon ? (
            <img
              src={favicon}
              alt={shortcut.title}
              className="w-4 h-4 object-contain"
              referrerPolicy="no-referrer"
              onError={() => setFaviconError(true)}
            />
          ) : (
            <DynamicIcon
              name={isImageIcon(shortcut.iconValue) ? 'Globe' : shortcut.iconValue || 'Globe'}
              className={`w-4 h-4 ${colorTheme.iconText}`}
            />
          )}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-neutral-900 dark:text-neutral-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
              {shortcut.title}
            </span>
            {shortcut.isPinned && (
              <Pin className="w-3 h-3 text-amber-500 fill-current shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400 mt-0.5">
            <span className={`truncate font-medium ${colorTheme.text}`}>{group?.name || 'Umum'}</span>
            <span aria-hidden="true">·</span>
            <span className="capitalize">{isDirectory ? 'Drive Lokal' : 'Web Link'}</span>
          </div>
        </div>
      </div>

      {/* Path preview */}
      <div className="hidden md:block flex-1 min-w-[200px] text-neutral-500 dark:text-neutral-400 font-mono truncate">
        {shortcut.url}
      </div>

      {/* Notes / Description */}
      <div className="hidden lg:block flex-1 min-w-[180px] text-neutral-600 dark:text-neutral-400 truncate">
        {shortcut.description || '-'}
      </div>

      {/* Click counter */}
      <div className="w-16 text-right font-mono tabular-nums text-neutral-400 dark:text-neutral-500 shrink-0">
        {shortcut.clickCount} klik
      </div>

      {/* Quick Action buttons */}
      <div
        className="flex items-center gap-1.5 shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={handleCopyPath}
          title="Salin path alamat"
          className="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-400 transition-colors"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
        </button>

        <button
          type="button"
          onClick={() => onLaunch(shortcut)}
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded font-semibold transition-colors clay-btn-soft ${colorTheme.openBtn}`}
        >
          {isDirectory ? <FolderOpen className="w-3.5 h-3.5" /> : <ExternalLink className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">Buka</span>
        </button>

        {(canEditShortcut || canDeleteShortcut) && (
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setShowMenu(!showMenu)}
              aria-label="Opsi lainnya"
              className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-lg py-1 z-20 text-xs text-neutral-700 dark:text-neutral-200 clay-modal">
                {canEditShortcut && (
                  <>
                    <button
                      onClick={() => {
                        onEdit(shortcut);
                        setShowMenu(false);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-neutral-500" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => {
                        onTogglePin(shortcut);
                        setShowMenu(false);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2"
                    >
                      <Pin className="w-3.5 h-3.5 text-neutral-500" />
                      <span>{shortcut.isPinned ? 'Lepas Pin' : 'Sematkan'}</span>
                    </button>
                  </>
                )}
                {canDeleteShortcut && (
                  <button
                    onClick={() => {
                      onDelete(shortcut.id);
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center gap-2 border-t border-neutral-100 dark:border-neutral-800"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
