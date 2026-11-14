import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ExternalLink, HardDrive, Globe, Pin, CornerDownLeft } from 'lucide-react';
import { ShortcutItem, ShortcutGroup } from '../types';
import { DynamicIcon } from './DynamicIcon';
import { getFaviconUrl } from '../utils/pathHelper';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  shortcuts: ShortcutItem[];
  groups: ShortcutGroup[];
  onLaunch: (shortcut: ShortcutItem) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  shortcuts,
  groups,
  onLaunch,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const filteredShortcuts = shortcuts.filter((item) => {
    const q = query.toLowerCase();
    const groupName = groups.find((g) => g.id === item.groupId)?.name.toLowerCase() || '';
    return (
      item.title.toLowerCase().includes(q) ||
      item.url.toLowerCase().includes(q) ||
      (item.description && item.description.toLowerCase().includes(q)) ||
      groupName.includes(q) ||
      (item.tags && item.tags.some((t) => t.toLowerCase().includes(q)))
    );
  });

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredShortcuts.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredShortcuts.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = filteredShortcuts[selectedIndex];
      if (target) {
        onLaunch(target);
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl max-w-xl w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 border-b border-neutral-200 dark:border-neutral-800">
          <Search className="w-5 h-5 text-neutral-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Cari pintasan, drive lokal (D:), atau grup... (↑↓ navigasi, Enter luncurkan)"
            className="w-full py-3.5 px-3 bg-transparent text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 text-sm focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2">
          {filteredShortcuts.length === 0 ? (
            <div className="py-8 text-center text-xs text-neutral-500 dark:text-neutral-400">
              Tidak ada pintasan yang cocok dengan pencarian "{query}".
            </div>
          ) : (
            <div className="space-y-1">
              {filteredShortcuts.map((item, index) => {
                const isSelected = index === selectedIndex;
                const isDirectory = item.type === 'directory';
                const favicon = item.iconType === 'favicon' ? getFaviconUrl(item.url) : null;
                const groupName = groups.find((g) => g.id === item.groupId)?.name;

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      onLaunch(item);
                      onClose();
                    }}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`flex items-center justify-between p-2.5 rounded-lg text-xs cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200'
                        : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-7 h-7 rounded-md bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center shrink-0">
                        {isDirectory ? (
                          <HardDrive className="w-3.5 h-3.5 text-emerald-600" />
                        ) : favicon ? (
                          <img
                            src={favicon}
                            alt=""
                            className="w-3.5 h-3.5 object-contain"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <DynamicIcon name={item.iconValue || 'Globe'} className="w-3.5 h-3.5 text-indigo-600" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                            {item.title}
                          </span>
                          <span className="text-[11px] text-neutral-400">· {groupName}</span>
                        </div>
                        <p className="text-[11px] text-neutral-400 font-mono truncate">{item.url}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isSelected && (
                        <span className="flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
                          <span>Buka</span>
                          <CornerDownLeft className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-850 flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400">
          <div className="flex items-center gap-3">
            <span><kbd className="px-1 py-0.5 rounded bg-neutral-200 dark:bg-neutral-700 font-mono">↑↓</kbd> Navigasi</span>
            <span><kbd className="px-1 py-0.5 rounded bg-neutral-200 dark:bg-neutral-700 font-mono">↵</kbd> Luncurkan</span>
            <span><kbd className="px-1 py-0.5 rounded bg-neutral-200 dark:bg-neutral-700 font-mono">Esc</kbd> Tutup</span>
          </div>
          <span className="tabular-nums font-mono">{filteredShortcuts.length} hasil</span>
        </div>
      </div>
    </div>
  );
};
