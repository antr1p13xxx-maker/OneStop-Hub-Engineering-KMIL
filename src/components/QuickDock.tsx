import React, { useState } from 'react';
import { Pin, HardDrive } from 'lucide-react';
import { ShortcutItem, ShortcutGroup } from '../types';
import { DynamicIcon, isImageIcon } from './DynamicIcon';
import { getFaviconUrl } from '../utils/pathHelper';

interface QuickDockProps {
  pinnedItems: ShortcutItem[];
  groups: ShortcutGroup[];
  onLaunch: (item: ShortcutItem) => void;
  onUnpin: (item: ShortcutItem) => void;
}

export const QuickDock: React.FC<QuickDockProps> = ({
  pinnedItems,
  groups,
  onLaunch,
  onUnpin,
}) => {
  const [failedCustomPhotos, setFailedCustomPhotos] = useState<Record<string, boolean>>({});
  const [failedFavicons, setFailedFavicons] = useState<Record<string, boolean>>({});

  if (pinnedItems.length === 0) return null;

  const getGroupName = (groupId: string) => {
    return groups.find((g) => g.id === groupId)?.name || '';
  };

  return (
    <section className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 sm:p-5 shadow-xs clay-surface transition-colors">
      <div className="flex items-center justify-between mb-3 text-xs text-neutral-500 dark:text-neutral-400">
        <div className="flex items-center gap-2 font-medium text-neutral-800 dark:text-neutral-200">
          <Pin className="w-3.5 h-3.5 text-indigo-500" />
          <span>Akses Cepat Tersemat</span>
          <span aria-hidden="true">·</span>
          <span className="tabular-nums font-mono">{pinnedItems.length} Layanan</span>
        </div>
        <span className="text-neutral-400 hidden sm:inline">Pintasan favorit selalu tampil di atas</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {pinnedItems.map((item) => {
          const isLocal = item.type === 'directory';
          const hasCustomPhoto =
            item.iconType === 'custom' &&
            isImageIcon(item.iconValue) &&
            !failedCustomPhotos[`${item.id}:${item.iconValue}`];
          const favicon =
            item.iconType === 'favicon' && !failedFavicons[item.id]
              ? getFaviconUrl(item.url)
              : null;

          return (
            <div
              key={item.id}
              className="group relative flex items-center gap-2.5 p-2.5 rounded-lg border border-neutral-200/70 dark:border-neutral-800/80 hover:border-neutral-300 dark:hover:border-neutral-700 bg-neutral-50/60 dark:bg-neutral-800/40 hover:bg-neutral-100/60 dark:hover:bg-neutral-800/80 transition-all text-left clay-subcard clay-subcard-hover"
            >
              <button
                type="button"
                onClick={() => onLaunch(item)}
                className="flex items-center gap-2.5 min-w-0 flex-1 focus:outline-none"
              >
                <div className="w-8 h-8 rounded-md bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs clay-icon-well">
                  {hasCustomPhoto ? (
                    <img
                      src={item.iconValue}
                      alt={item.title}
                      onError={() =>
                        setFailedCustomPhotos((prev) => ({
                          ...prev,
                          [`${item.id}:${item.iconValue}`]: true,
                        }))
                      }
                      className="w-full h-full object-cover"
                    />
                  ) : isLocal ? (
                    <HardDrive className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  ) : favicon ? (
                    <img
                      src={favicon}
                      alt={item.title}
                      className="w-4 h-4 object-contain"
                      referrerPolicy="no-referrer"
                      onError={() =>
                        setFailedFavicons((prev) => ({ ...prev, [item.id]: true }))
                      }
                    />
                  ) : (
                    <DynamicIcon
                      name={isImageIcon(item.iconValue) ? 'Globe' : item.iconValue || 'Globe'}
                      className="w-4 h-4 text-indigo-600 dark:text-indigo-400"
                    />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {item.title}
                  </p>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                    {getGroupName(item.groupId)}
                  </p>
                </div>
              </button>

              <div className="shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => onUnpin(item)}
                  title="Lepas pin"
                  aria-label="Lepas pin"
                  className="p-1 text-neutral-400 hover:text-amber-500 rounded transition-colors"
                >
                  <Pin className="w-3 h-3 fill-current" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
