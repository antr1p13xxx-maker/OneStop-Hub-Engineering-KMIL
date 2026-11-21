import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import {
  ExternalLink,
  Copy,
  Check,
  MoreVertical,
  Pin,
  Trash2,
  Edit2,
  HardDrive,
  Terminal,
  FolderOpen,
  Sparkles,
} from 'lucide-react';
import { ShortcutItem, ShortcutGroup, CardDensity } from '../types';
import { DynamicIcon, isImageIcon } from './DynamicIcon';
import { getFaviconUrl, copyToClipboard, getWindowsExplorerCommand } from '../utils/pathHelper';
import { getGroupColorTheme } from '../utils/colorTheme';

interface ShortcutCardProps {
  shortcut: ShortcutItem;
  group?: ShortcutGroup;
  density?: CardDensity;
  canEditShortcut?: boolean;
  canDeleteShortcut?: boolean;
  onLaunch: (shortcut: ShortcutItem) => void;
  onEdit: (shortcut: ShortcutItem) => void;
  onDelete: (id: string) => void;
  onTogglePin: (shortcut: ShortcutItem) => void;
  onDuplicate: (shortcut: ShortcutItem) => void;
}

export const ShortcutCard: React.FC<ShortcutCardProps> = ({
  shortcut,
  group,
  density = 'medium',
  canEditShortcut = true,
  canDeleteShortcut = true,
  onLaunch,
  onEdit,
  onDelete,
  onTogglePin,
  onDuplicate,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

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
      setCopiedType('path');
      setTimeout(() => setCopiedType(null), 2000);
    }
  };

  const handleCopyExplorerCommand = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const cmd = getWindowsExplorerCommand(shortcut.url);
    const success = await copyToClipboard(cmd);
    if (success) {
      setCopiedType('explorer');
      setTimeout(() => setCopiedType(null), 2000);
    }
    setShowMenu(false);
  };

  const [customPhotoError, setCustomPhotoError] = useState(false);
  const [faviconError, setFaviconError] = useState(false);

  useEffect(() => {
    setCustomPhotoError(false);
    setFaviconError(false);
  }, [shortcut.iconValue, shortcut.iconType, shortcut.url]);

  const isDirectory = shortcut.type === 'directory';
  const isProtocol = shortcut.type === 'protocol';
  const hasCustomPhoto = shortcut.iconType === 'custom' && isImageIcon(shortcut.iconValue) && !customPhotoError;
  const favicon = shortcut.iconType === 'favicon' && !faviconError ? getFaviconUrl(shortcut.url) : null;

  // Group color theme
  const colorTheme = getGroupColorTheme(group?.color);
  const groupBadgeClass = colorTheme.text;

  // Density classes
  const containerPadding = {
    small: 'p-2.5 sm:p-3 rounded-lg',
    medium: 'p-4 sm:p-5 rounded-xl',
    large: 'p-5 sm:p-6 rounded-xl',
  }[density];

  const topMargin = {
    small: 'mb-1.5 text-[11px]',
    medium: 'mb-3 text-xs',
    large: 'mb-3.5 text-xs',
  }[density];

  return (
    <motion.div
      onClick={() => onLaunch(shortcut)}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={shouldReduceMotion ? undefined : { y: -4, scale: 1.012 }}
      whileTap={shouldReduceMotion ? undefined : { y: -1, scale: 0.985 }}
      transition={{ type: 'spring', stiffness: 420, damping: 28, mass: 0.7 }}
      className={`group relative bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 ${colorTheme.cardHoverBorder} ${containerPadding} transition-[box-shadow,border-color,background-color] duration-200 cursor-pointer shadow-xs hover:shadow-md clay-card flex flex-col justify-between`}
    >
      <div>
        {/* Top unboxed metadata line */}
        <div className={`flex items-center justify-between text-neutral-500 dark:text-neutral-400 ${topMargin}`}>
          <div className="flex items-center gap-1.5 truncate pr-2">
            <span className={`font-medium ${groupBadgeClass}`}>
              {group?.name || 'Umum'}
            </span>
            <span aria-hidden="true">·</span>
            <span className="capitalize">
              {isDirectory ? 'Direktori Drive' : isProtocol ? 'App Desktop' : 'Layanan Web'}
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
            {shortcut.isPinned && (
              <span title="Tersemat di atas" className="text-amber-500 dark:text-amber-400 p-0.5">
                <Pin className="w-3.5 h-3.5 fill-current" />
              </span>
            )}

            {/* 3 dots action menu */}
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setShowMenu(!showMenu)}
                aria-label="Opsi pintasan"
                className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              <AnimatePresence>
                {showMenu && (
                  <motion.div
                    initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: -4 }}
                    transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-lg py-1 z-20 text-xs text-neutral-700 dark:text-neutral-200 clay-modal origin-top-right"
                  >
                  {canEditShortcut && (
                    <button
                      onClick={() => {
                        onEdit(shortcut);
                        setShowMenu(false);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-neutral-500" />
                      <span>Edit Pintasan</span>
                    </button>
                  )}
                  {canEditShortcut && (
                    <button
                      onClick={() => {
                        onTogglePin(shortcut);
                        setShowMenu(false);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2"
                    >
                      <Pin className="w-3.5 h-3.5 text-neutral-500" />
                      <span>{shortcut.isPinned ? 'Lepas Pin' : 'Sematkan ke Atas'}</span>
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      handleCopyPath(e);
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2"
                  >
                    <Copy className="w-3.5 h-3.5 text-neutral-500" />
                    <span>Salin Alamat Path</span>
                  </button>
                  {isDirectory && (
                    <button
                      onClick={handleCopyExplorerCommand}
                      className="w-full text-left px-3 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2"
                    >
                      <Terminal className="w-3.5 h-3.5 text-neutral-500" />
                      <span>Salin CMD Explorer</span>
                    </button>
                  )}
                  {canEditShortcut && (
                    <button
                      onClick={() => {
                        onDuplicate(shortcut);
                        setShowMenu(false);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-neutral-500" />
                      <span>Duplikat Pintasan</span>
                    </button>
                  )}
                  {canDeleteShortcut && (
                    <>
                      <div className="border-t border-neutral-100 dark:border-neutral-800 my-1" />
                      <button
                        onClick={() => {
                          onDelete(shortcut.id);
                          setShowMenu(false);
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center gap-2"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus Pintasan</span>
                      </button>
                    </>
                  )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Card Header: Icon + Title */}
        <div className={`flex items-start ${density === 'small' ? 'gap-2' : density === 'large' ? 'gap-3.5' : 'gap-3'}`}>
          <motion.div
            animate={
              shouldReduceMotion
                ? undefined
                : { scale: isHovered ? 1.07 : 1, rotate: isHovered ? -2 : 0 }
            }
            transition={{ type: 'spring', stiffness: 460, damping: 24 }}
            className={`${
              density === 'small'
                ? 'w-7 h-7 rounded-md'
                : density === 'large'
                ? 'w-12 h-12 rounded-xl'
                : 'w-10 h-10 rounded-lg'
            } border flex items-center justify-center shrink-0 overflow-hidden shadow-2xs transition-colors clay-icon-well ${colorTheme.iconBg}`}
          >
            {hasCustomPhoto ? (
              <img
                src={shortcut.iconValue}
                alt={shortcut.title}
                onError={() => setCustomPhotoError(true)}
                className="w-full h-full object-cover"
              />
            ) : isDirectory ? (
              <HardDrive className={`${density === 'small' ? 'w-3.5 h-3.5' : density === 'large' ? 'w-6 h-6' : 'w-5 h-5'} text-emerald-600 dark:text-emerald-400`} />
            ) : favicon ? (
              <img
                src={favicon}
                alt={shortcut.title}
                className={`${density === 'small' ? 'w-3.5 h-3.5' : density === 'large' ? 'w-6 h-6' : 'w-5 h-5'} object-contain`}
                referrerPolicy="no-referrer"
                onError={() => setFaviconError(true)}
              />
            ) : (
              <DynamicIcon
                name={isImageIcon(shortcut.iconValue) ? 'Globe' : shortcut.iconValue || 'Globe'}
                className={`${density === 'small' ? 'w-3.5 h-3.5' : density === 'large' ? 'w-6 h-6' : 'w-5 h-5'} ${colorTheme.iconText}`}
              />
            )}
          </motion.div>

          <div className="min-w-0 flex-1">
            <h3 className={`${
              density === 'small'
                ? 'text-xs font-semibold leading-tight'
                : density === 'large'
                ? 'text-base font-bold'
                : 'text-sm font-semibold'
            } text-neutral-900 dark:text-neutral-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors`}>
              {shortcut.title}
            </h3>
            <p className={`${density === 'small' ? 'text-[10px]' : 'text-xs'} text-neutral-500 dark:text-neutral-400 truncate mt-0.5 font-mono`}>
              {shortcut.url}
            </p>
          </div>
        </div>

        {/* Description */}
        {shortcut.description && (
          <p className={`${
            density === 'small'
              ? 'text-[11px] mt-1.5 line-clamp-1'
              : density === 'large'
              ? 'text-xs mt-3 line-clamp-3 leading-relaxed'
              : 'text-xs mt-2.5 line-clamp-2 leading-relaxed'
          } text-neutral-600 dark:text-neutral-400`}>
            {shortcut.description}
          </p>
        )}
      </div>

      {/* Bottom Action Strip */}
      <div className={`${
        density === 'small'
          ? 'mt-2.5 pt-2 text-[10px]'
          : density === 'large'
          ? 'mt-5 pt-3.5 text-xs'
          : 'mt-4 pt-3 text-xs'
      } border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-2`}>
        <div className="text-neutral-400 dark:text-neutral-500 tabular-nums">
          <span>{shortcut.clickCount} klik</span>
        </div>

        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <motion.button
            type="button"
            onClick={handleCopyPath}
            whileHover={shouldReduceMotion ? undefined : { scale: 1.04, y: -1 }}
            whileTap={shouldReduceMotion ? undefined : { scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 500, damping: 26 }}
            title="Salin alamat"
            className={`inline-flex items-center gap-1 rounded bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-medium transition-colors clay-btn-soft clay-motion-btn ${
              density === 'small' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-xs'
            }`}
          >
            {copiedType === 'path' ? (
              <>
                <Check className={`${density === 'small' ? 'w-2.5 h-2.5' : 'w-3 h-3'} text-emerald-600`} />
                <span>Disalin</span>
              </>
            ) : (
              <>
                <Copy className={`${density === 'small' ? 'w-2.5 h-2.5' : 'w-3 h-3'}`} />
                <span>{density === 'small' ? 'Salin' : 'Salin Path'}</span>
              </>
            )}
          </motion.button>

          <motion.button
            type="button"
            onClick={() => onLaunch(shortcut)}
            whileHover={shouldReduceMotion ? undefined : { scale: 1.04, y: -1 }}
            whileTap={shouldReduceMotion ? undefined : { scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 500, damping: 26 }}
            className={`inline-flex items-center gap-1 rounded font-semibold transition-colors clay-btn-soft clay-motion-btn ${colorTheme.openBtn} ${
              density === 'small' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
            }`}
          >
            {isDirectory ? (
              <>
                <FolderOpen className={`${density === 'small' ? 'w-2.5 h-2.5' : 'w-3 h-3'}`} />
                <span>Buka</span>
              </>
            ) : (
              <>
                <motion.span
                  animate={shouldReduceMotion ? undefined : { x: isHovered ? 1.5 : 0 }}
                  transition={{ type: 'spring', stiffness: 450, damping: 25 }}
                  className="inline-flex"
                >
                  <ExternalLink className={`${density === 'small' ? 'w-2.5 h-2.5' : 'w-3 h-3'}`} />
                </motion.span>
                <span>Buka</span>
              </>
            )}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};
