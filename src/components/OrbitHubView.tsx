import React, { useState } from 'react';
import {
  HardDrive,
  ExternalLink,
  FolderOpen,
  Copy,
  Check,
  Edit2,
  Trash2,
  Pin,
  Plus,
  ChevronLeft,
  ChevronRight,
  Layers,
} from 'lucide-react';
import { ShortcutItem, ShortcutGroup, CustomLogoConfig } from '../types';
import { DynamicIcon } from './DynamicIcon';
import { getFaviconUrl, copyToClipboard } from '../utils/pathHelper';

interface OrbitHubViewProps {
  shortcuts: ShortcutItem[];
  groups: ShortcutGroup[];
  selectedGroupFilter: string;
  onSelectGroupFilter: (groupId: string) => void;
  customLogo?: CustomLogoConfig | null;
  canAddShortcut: boolean;
  canEditShortcut: boolean;
  canDeleteShortcut: boolean;
  onLaunch: (shortcut: ShortcutItem) => void;
  onEdit: (shortcut: ShortcutItem) => void;
  onDelete: (id: string) => void;
  onTogglePin: (shortcut: ShortcutItem) => void;
  onAddInGroup: (groupId?: string) => void;
}

export const OrbitHubView: React.FC<OrbitHubViewProps> = ({
  shortcuts,
  groups,
  selectedGroupFilter,
  onSelectGroupFilter,
  customLogo,
  canAddShortcut,
  canEditShortcut,
  canDeleteShortcut,
  onLaunch,
  onEdit,
  onDelete,
  onTogglePin,
  onAddInGroup,
}) => {
  const [inspectedItem, setInspectedItem] = useState<ShortcutItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [failedFavicons, setFailedFavicons] = useState<Record<string, boolean>>({});
  const [logoError, setLogoError] = useState(false);

  const activeGroup =
    selectedGroupFilter !== 'all'
      ? groups.find((g) => g.id === selectedGroupFilter)
      : undefined;

  // Keep inspected item synced with latest shortcut state (e.g. clickCount / isPinned)
  const activeShortcut = inspectedItem
    ? shortcuts.find((s) => s.id === inspectedItem.id) || null
    : null;

  // Orbit displays up to 16 items around the circle cleanly; any extras render below
  const maxOrbitCount = 16;
  const orbitItems = shortcuts.slice(0, maxOrbitCount);
  const overflowItems = shortcuts.slice(maxOrbitCount);

  // Split display title into two-tone white + amber like reference ("Quick" + "seva")
  const rawTitle = activeGroup ? activeGroup.name : 'OneStop Hub';
  const titleParts = rawTitle.trim().split(/\s+/);
  const firstTitleWord = titleParts[0] || 'OneStop';
  const restTitleWords = titleParts.slice(1).join(' ');

  // Cycle between groups
  const handleCycleGroup = (direction: 'prev' | 'next') => {
    if (groups.length === 0) return;
    setInspectedItem(null);
    if (selectedGroupFilter === 'all') {
      onSelectGroupFilter(direction === 'next' ? groups[0].id : groups[groups.length - 1].id);
      return;
    }
    const idx = groups.findIndex((g) => g.id === selectedGroupFilter);
    if (idx === -1) {
      onSelectGroupFilter(groups[0].id);
      return;
    }
    const nextIdx =
      direction === 'next'
        ? (idx + 1) % groups.length
        : (idx - 1 + groups.length) % groups.length;
    onSelectGroupFilter(groups[nextIdx].id);
  };

  const handleCopy = async (e: React.MouseEvent, item: ShortcutItem) => {
    e.stopPropagation();
    const ok = await copyToClipboard(item.url);
    if (ok) {
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 1800);
    }
  };

  // Radius percentage inside the square orbital stage
  const radiusPct = orbitItems.length <= 6 ? 37 : orbitItems.length <= 12 ? 39 : 41;

  return (
    <div
      onMouseLeave={() => setInspectedItem(null)}
      className="relative overflow-hidden rounded-[28px] sm:rounded-[34px] bg-[#08080a] border border-amber-500/45 shadow-[0_0_55px_rgba(245,158,11,0.14)] px-4 py-5 sm:px-8 sm:py-7 text-neutral-100 select-none"
    >
      {/* Warm Corner Ambient Glow matching reference aesthetic */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 4% 6%, rgba(245, 158, 11, 0.25) 0%, transparent 42%), radial-gradient(circle at 96% 94%, rgba(245, 158, 11, 0.2) 0%, transparent 42%)',
        }}
      />

      {/* Corner Halftone Dot Matrices (Top-Right & Bottom-Left) */}
      <div
        aria-hidden="true"
        className="absolute top-6 right-6 w-20 h-20 opacity-30 pointer-events-none hidden sm:block"
        style={{
          backgroundImage: 'radial-gradient(rgba(245, 158, 11, 0.75) 1.5px, transparent 1.5px)',
          backgroundSize: '10px 10px',
        }}
      />
      <div
        aria-hidden="true"
        className="absolute bottom-6 left-6 w-20 h-20 opacity-30 pointer-events-none hidden sm:block"
        style={{
          backgroundImage: 'radial-gradient(rgba(245, 158, 11, 0.75) 1.5px, transparent 1.5px)',
          backgroundSize: '10px 10px',
        }}
      />

      {/* Stage Top Bar: Group Switcher & Quick Add */}
      <div className="relative z-20 flex flex-wrap items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleCycleGroup('prev')}
            title="Grup Sebelumnya"
            className="p-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 px-3 py-1 rounded-lg border border-amber-500/25 bg-neutral-900/80 text-xs">
            {activeGroup ? (
              <>
                <DynamicIcon name={activeGroup.icon} className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-semibold text-white">{activeGroup.name}</span>
              </>
            ) : (
              <>
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-semibold text-white">Semua Grup</span>
              </>
            )}
            <span className="text-amber-400/80 font-mono">· {shortcuts.length}</span>
          </div>

          <button
            type="button"
            onClick={() => handleCycleGroup('next')}
            title="Grup Berikutnya"
            className="p-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          {activeGroup && (
            <button
              type="button"
              onClick={() => {
                setInspectedItem(null);
                onSelectGroupFilter('all');
              }}
              className="px-2.5 py-1 text-xs rounded-lg border border-neutral-700 bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 transition-colors cursor-pointer"
            >
              Lihat Semua Grup
            </button>
          )}
          {canAddShortcut && (
            <button
              type="button"
              onClick={() => onAddInGroup(activeGroup?.id)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-[0_0_20px_rgba(245,158,11,0.35)] transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah ke Grup</span>
            </button>
          )}
        </div>
      </div>

      {/* Circular Orbital Hub Stage */}
      <div className="relative z-10 flex items-center justify-center py-4 sm:py-6">
        <div
          onClick={() => setInspectedItem(null)}
          className="relative w-[310px] h-[310px] sm:w-[500px] sm:h-[500px] md:w-[570px] md:h-[570px] flex items-center justify-center"
        >
          {/* Decorative Circular Orbit Rings */}
          <div
            aria-hidden="true"
            className="absolute inset-[11%] rounded-full border border-amber-500/15 pointer-events-none"
          />
          <div
            aria-hidden="true"
            className="absolute inset-[18%] rounded-full border border-dashed border-amber-500/10 pointer-events-none"
          />
          <div
            aria-hidden="true"
            className="absolute w-44 h-44 sm:w-64 sm:h-64 rounded-full bg-amber-500/5 blur-2xl pointer-events-none"
          />

          {/* Center Brand / Active Shortcut HUD */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative z-20 w-[150px] sm:w-[235px] md:w-[265px] text-center flex flex-col items-center justify-center px-2"
          >
            {activeShortcut ? (
              /* Inspected Shortcut Preview in Center */
              <div className="space-y-1.5 animate-in fade-in duration-150 w-full">
                <div className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-amber-400">
                  <span>
                    {activeShortcut.type === 'directory'
                      ? 'Direktori Drive'
                      : activeShortcut.type === 'protocol'
                      ? 'App Desktop'
                      : 'Layanan Web'}
                  </span>
                  <span>·</span>
                  <span>{activeShortcut.clickCount} klik</span>
                </div>

                <h3 className="text-sm sm:text-xl font-extrabold text-white leading-tight line-clamp-2">
                  {activeShortcut.title}
                </h3>

                <p className="text-[10px] sm:text-xs font-mono text-amber-300/90 truncate px-1">
                  {activeShortcut.url}
                </p>

                {activeShortcut.description && (
                  <p className="hidden sm:line-clamp-2 text-[11px] text-neutral-400 leading-snug">
                    {activeShortcut.description}
                  </p>
                )}

                {/* Quick Center Action Strip */}
                <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1.5">
                  <button
                    type="button"
                    onClick={() => onLaunch(activeShortcut)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 text-[11px] font-bold shadow-[0_0_15px_rgba(245,158,11,0.4)] transition-colors cursor-pointer"
                  >
                    {activeShortcut.type === 'directory' ? (
                      <FolderOpen className="w-3 h-3" />
                    ) : (
                      <ExternalLink className="w-3 h-3" />
                    )}
                    <span>Buka</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => handleCopy(e, activeShortcut)}
                    title="Salin Alamat / Path"
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-amber-500/35 bg-neutral-900/90 hover:bg-neutral-800 text-amber-300 text-[11px] font-medium transition-colors cursor-pointer"
                  >
                    {copiedId === activeShortcut.id ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span className="hidden sm:inline">
                      {copiedId === activeShortcut.id ? 'Disalin' : 'Salin'}
                    </span>
                  </button>

                  {canEditShortcut && (
                    <>
                      <button
                        type="button"
                        onClick={() => onTogglePin(activeShortcut)}
                        title={activeShortcut.isPinned ? 'Lepas Pin' : 'Sematkan'}
                        className={`p-1 rounded-lg border transition-colors cursor-pointer ${
                          activeShortcut.isPinned
                            ? 'border-amber-400 bg-amber-500/20 text-amber-300'
                            : 'border-neutral-700 bg-neutral-900/90 hover:bg-neutral-800 text-neutral-300'
                        }`}
                      >
                        <Pin className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onEdit(activeShortcut)}
                        title="Edit Pintasan"
                        className="p-1 rounded-lg border border-neutral-700 bg-neutral-900/90 hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </>
                  )}

                  {canDeleteShortcut && (
                    <button
                      type="button"
                      onClick={() => {
                        onDelete(activeShortcut.id);
                        setInspectedItem(null);
                      }}
                      title="Hapus Pintasan"
                      className="p-1 rounded-lg border border-rose-500/30 bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* Default Center Brand / Group Hub Display (matching Quickseva reference layout) */
              <div className="space-y-1">
                {customLogo?.src && !logoError ? (
                  <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl border border-amber-500/45 bg-neutral-900/90 overflow-hidden mx-auto mb-1.5 shadow-[0_0_20px_rgba(245,158,11,0.25)]">
                    <img
                      src={customLogo.src}
                      alt="OneStop Hub Engineering"
                      onError={() => setLogoError(true)}
                      className={`w-full h-full ${
                        customLogo.fit === 'contain' ? 'object-contain p-0.5' : 'object-cover'
                      }`}
                    />
                  </div>
                ) : activeGroup ? (
                  <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl border border-amber-500/40 bg-amber-500/10 flex items-center justify-center mx-auto mb-1.5 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                    <DynamicIcon name={activeGroup.icon} className="w-5 h-5" />
                  </div>
                ) : null}

                <h2 className="text-lg sm:text-3xl font-extrabold tracking-tight leading-tight">
                  <span className="text-white">{firstTitleWord}</span>
                  {restTitleWords && (
                    <span className="text-amber-400"> {restTitleWords}</span>
                  )}
                </h2>

                <p className="text-[11px] sm:text-sm font-medium text-neutral-300">
                  One-stop <span className="text-amber-400">service hub</span>
                </p>

                {activeGroup?.description && (
                  <p className="hidden sm:block text-[11px] text-neutral-400 leading-snug pt-0.5 line-clamp-2">
                    {activeGroup.description}
                  </p>
                )}

                <p className="text-[10px] font-mono text-neutral-500 pt-1">
                  {orbitItems.length === 0
                    ? 'Belum ada pintasan'
                    : 'Arahkan atau klik ikon di lingkaran'}
                </p>
              </div>
            )}
          </div>

          {/* Circular Positioned Shortcut Icons */}
          {orbitItems.map((item, index) => {
            const angle = (index / orbitItems.length) * 2 * Math.PI - Math.PI / 2;
            const leftPct = 50 + radiusPct * Math.cos(angle);
            const topPct = 50 + radiusPct * Math.sin(angle);
            const isSelected = activeShortcut?.id === item.id;
            const isDirectory = item.type === 'directory';
            const favicon =
              item.iconType === 'favicon' && !failedFavicons[item.id]
                ? getFaviconUrl(item.url)
                : null;

            return (
              <div
                key={item.id}
                style={{ left: `${leftPct}%`, top: `${topPct}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center group"
              >
                <button
                  type="button"
                  onMouseEnter={() => setInspectedItem(item)}
                  onFocus={() => setInspectedItem(item)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setInspectedItem(item);
                    onLaunch(item);
                  }}
                  title={`${item.title} — ${item.url}`}
                  className={`relative w-11 h-11 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500/20 border-2 border-amber-400 scale-110 shadow-[0_0_28px_rgba(245,158,11,0.55)]'
                      : 'bg-neutral-900/85 border border-amber-500/35 hover:border-amber-400 hover:bg-amber-500/15 hover:scale-110 hover:shadow-[0_0_24px_rgba(245,158,11,0.4)]'
                  }`}
                >
                  {isDirectory ? (
                    <HardDrive className="w-5 h-5 sm:w-7 sm:h-7 text-amber-400 stroke-[1.75]" />
                  ) : favicon ? (
                    <img
                      src={favicon}
                      alt={item.title}
                      referrerPolicy="no-referrer"
                      onError={() =>
                        setFailedFavicons((prev) => ({ ...prev, [item.id]: true }))
                      }
                      className="w-6 h-6 sm:w-7 sm:h-7 object-contain rounded"
                    />
                  ) : (
                    <DynamicIcon
                      name={item.iconValue || 'Globe'}
                      className="w-5 h-5 sm:w-7 sm:h-7 text-amber-400 stroke-[1.75] group-hover:text-amber-300"
                    />
                  )}

                  {item.isPinned && (
                    <span
                      title="Tersemat"
                      className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-500 text-neutral-950 flex items-center justify-center shadow"
                    >
                      <Pin className="w-2 h-2 fill-current" />
                    </span>
                  )}
                </button>

                <span
                  className={`mt-1 text-[10px] sm:text-[11px] font-medium max-w-[70px] sm:max-w-[96px] truncate text-center transition-colors ${
                    isSelected
                      ? 'text-amber-300 font-semibold'
                      : 'text-neutral-300 group-hover:text-white'
                  }`}
                >
                  {item.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Overflow Strip if group has more than 16 shortcuts */}
      {overflowItems.length > 0 && (
        <div className="relative z-20 mt-4 pt-4 border-t border-amber-500/20">
          <p className="text-[11px] font-mono text-amber-400/90 mb-2.5">
            Pintasan Lainnya ({overflowItems.length})
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {overflowItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onMouseEnter={() => setInspectedItem(item)}
                onClick={() => onLaunch(item)}
                className="flex items-center gap-2 p-2 rounded-xl border border-amber-500/25 bg-neutral-900/75 hover:bg-amber-500/15 hover:border-amber-400 text-left transition-colors cursor-pointer"
              >
                <DynamicIcon
                  name={item.iconValue || (item.type === 'directory' ? 'HardDrive' : 'Globe')}
                  className="w-4 h-4 text-amber-400 shrink-0"
                />
                <span className="text-xs text-neutral-200 truncate">{item.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
