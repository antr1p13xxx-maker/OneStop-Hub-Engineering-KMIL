import React, { useState, useEffect, useRef } from 'react';
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  useMotionValue,
  useTransform,
  animate,
} from 'motion/react';
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
  Camera,
} from 'lucide-react';
import { ShortcutItem, ShortcutGroup, CustomLogoConfig } from '../types';
import { DynamicIcon, isImageIcon } from './DynamicIcon';
import { getFaviconUrl, copyToClipboard } from '../utils/pathHelper';
import { playJarvisOrbitHoverSound, playJarvisOrbitDeploySound } from '../utils/jarvisAudio';

interface OrbitHubViewProps {
  shortcuts: ShortcutItem[];
  groups: ShortcutGroup[];
  selectedGroupFilter: string;
  onSelectGroupFilter: (groupId: string) => void;
  customLogo?: CustomLogoConfig | null;
  canEditLogo?: boolean;
  onOpenLogoSettings?: () => void;
  canAddShortcut: boolean;
  canEditShortcut: boolean;
  canDeleteShortcut: boolean;
  canDeleteGroup?: boolean;
  audioEnabled?: boolean;
  onRequestDeleteGroup?: (groupId: string) => void;
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
  canEditLogo = false,
  onOpenLogoSettings,
  canAddShortcut,
  canEditShortcut,
  canDeleteShortcut,
  canDeleteGroup = false,
  audioEnabled = true,
  onRequestDeleteGroup,
  onLaunch,
  onEdit,
  onDelete,
  onTogglePin,
  onAddInGroup,
}) => {
  const [inspectedItem, setInspectedItem] = useState<ShortcutItem | null>(null);
  const [isOrbitExpanded, setIsOrbitExpanded] = useState(false);
  const [isOrbitLoaded, setIsOrbitLoaded] = useState(false);
  const [stageSize, setStageSize] = useState(660);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [failedFavicons, setFailedFavicons] = useState<Record<string, boolean>>({});
  const [failedCustomPhotos, setFailedCustomPhotos] = useState<Record<string, boolean>>({});
  const [logoError, setLogoError] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const orbitRotation = useMotionValue(0);
  const counterRotation = useTransform(orbitRotation, (deg) => -deg);

  const ringRadius = 30;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringDashOffset = useTransform(orbitRotation, [0, 720], [ringCircumference, 0]);

  useEffect(() => {
    setLogoError(false);
  }, [customLogo?.src]);

  // Reset to center-gathered state whenever the user opens a different group
  useEffect(() => {
    setIsOrbitExpanded(false);
    setIsOrbitLoaded(false);
    setInspectedItem(null);
  }, [selectedGroupFilter]);

  // After icons spread outward, rotate the orbit 2 full turns (720deg) and fill circular progress
  useEffect(() => {
    let delayTimer: number | undefined;
    let controls: { stop: () => void } | undefined;

    if (isOrbitExpanded) {
      orbitRotation.set(0);
      if (!shouldReduceMotion) {
        setIsOrbitLoaded(false);
        delayTimer = window.setTimeout(() => {
          controls = animate(orbitRotation, 720, {
            duration: 2.1,
            ease: [0.22, 1, 0.36, 1],
            onComplete: () => {
              setIsOrbitLoaded(true);
            },
          });
        }, 420);
      } else {
        setIsOrbitLoaded(true);
      }
    } else {
      orbitRotation.stop();
      setIsOrbitLoaded(false);
      if (!shouldReduceMotion) {
        delayTimer = window.setTimeout(() => {
          orbitRotation.set(0);
        }, 360);
      } else {
        orbitRotation.set(0);
      }
    }

    return () => {
      if (delayTimer !== undefined) {
        window.clearTimeout(delayTimer);
      }
      controls?.stop();
    };
  }, [isOrbitExpanded, shouldReduceMotion, orbitRotation]);

  // Measure orbital stage width for responsive GPU pixel transforms
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const updateSize = () => {
      if (el.clientWidth > 0) {
        setStageSize(el.clientWidth);
      }
    };
    updateSize();
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(updateSize);
      observer.observe(el);
      return () => observer.disconnect();
    }
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const activeGroup =
    selectedGroupFilter !== 'all'
      ? groups.find((g) => g.id === selectedGroupFilter)
      : undefined;

  // Keep inspected item synced with latest shortcut state (e.g. clickCount / isPinned)
  const activeShortcut = inspectedItem
    ? shortcuts.find((s) => s.id === inspectedItem.id) || null
    : null;

  // Orbit displays up to 12 items around the circle cleanly so labels never collide; extras render below
  const maxOrbitCount = 12;
  const orbitItems = shortcuts.slice(0, maxOrbitCount);
  const overflowItems = shortcuts.slice(maxOrbitCount);

  // Split display title into two-tone white + amber
  const rawTitle = activeGroup ? activeGroup.name : 'OneStop Hub';
  const titleParts = rawTitle.trim().split(/\s+/);
  const firstTitleWord = titleParts[0] || 'OneStop';
  const restTitleWords = titleParts.slice(1).join(' ');

  // Cycle between groups
  const handleCycleGroup = (direction: 'prev' | 'next') => {
    if (groups.length === 0) return;
    setInspectedItem(null);
    setIsOrbitExpanded(false);
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

  const handleExpandOrbit = () => {
    if (isOrbitExpanded) return;
    setIsOrbitExpanded(true);
    playJarvisOrbitDeploySound(audioEnabled);
  };

  const handleInspectShortcut = (item: ShortcutItem, slotIndex: number) => {
    if (activeShortcut?.id !== item.id) {
      playJarvisOrbitHoverSound(audioEnabled, slotIndex);
    }
    setInspectedItem(item);
  };

  // Radius percentage inside the square orbital stage (generous separation from center HUD)
  const radiusPct = orbitItems.length <= 4 ? 35 : orbitItems.length <= 8 ? 38.5 : 41;
  const expandedRadiusPx = stageSize * (radiusPct / 100);
  const gatheredRadiusPx = orbitItems.length <= 1 ? 0 : orbitItems.length <= 5 ? 30 : 38;

  const renderCenterHud = () =>
    activeShortcut ? (
      <div className="space-y-1.5 animate-in fade-in duration-150 w-full">
        <div className="inline-flex items-center justify-center gap-1 text-[10px] font-mono uppercase tracking-wider text-amber-400 flex-wrap">
          <span>
            {activeShortcut.type === 'directory'
              ? 'Direktori Drive'
              : activeShortcut.type === 'protocol'
              ? 'App Desktop'
              : 'Layanan Web'}
          </span>
          <span aria-hidden="true">·</span>
          <span className="tabular-nums">{activeShortcut.clickCount} klik</span>
        </div>

        <h3 className="text-sm sm:text-lg font-extrabold text-white leading-tight line-clamp-2 break-words">
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
      <div className="space-y-1 w-full">
        {activeGroup && isImageIcon(activeGroup.icon) ? (
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl border border-amber-500/50 bg-neutral-900/90 overflow-hidden mx-auto mb-1.5 shadow-[0_0_24px_rgba(245,158,11,0.3)]">
            <img
              src={activeGroup.icon}
              alt={activeGroup.name}
              className="w-full h-full object-cover"
            />
          </div>
        ) : customLogo?.src && !logoError ? (
          <div className="relative w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-1.5 group/orbitlogo">
            <div className="w-full h-full rounded-xl border border-amber-500/45 bg-neutral-900/90 overflow-hidden shadow-[0_0_20px_rgba(245,158,11,0.25)]">
              <img
                src={customLogo.src}
                alt="OneStop Hub Engineering"
                onError={() => setLogoError(true)}
                className={`w-full h-full ${
                  customLogo.fit === 'contain' ? 'object-contain p-0.5' : 'object-cover'
                }`}
              />
            </div>
            {!activeGroup && onOpenLogoSettings && (
              <button
                type="button"
                onClick={onOpenLogoSettings}
                title={
                  canEditLogo
                    ? 'Ganti Foto Logo OneStop Hub'
                    : 'Ganti Foto Logo OneStop Hub (Perlu Lead/Manager)'
                }
                aria-label="Ganti Foto Logo OneStop Hub"
                className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-neutral-900 border border-amber-400/70 text-amber-300 hover:bg-amber-500 hover:text-neutral-950 flex items-center justify-center shadow transition-colors cursor-pointer"
              >
                <Camera className="w-2.5 h-2.5" />
              </button>
            )}
          </div>
        ) : activeGroup ? (
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl border border-amber-500/40 bg-amber-500/10 flex items-center justify-center mx-auto mb-1.5 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
            <DynamicIcon name={activeGroup.icon} className="w-5 h-5" />
          </div>
        ) : (
          <div className="relative w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-1.5 group/orbitlogo">
            <div className="w-full h-full rounded-xl border border-amber-500/40 bg-amber-500/10 flex items-center justify-center text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
              <Layers className="w-5 h-5" />
            </div>
            {onOpenLogoSettings && (
              <button
                type="button"
                onClick={onOpenLogoSettings}
                title={
                  canEditLogo
                    ? 'Ganti Foto Logo OneStop Hub'
                    : 'Ganti Foto Logo OneStop Hub (Perlu Lead/Manager)'
                }
                aria-label="Ganti Foto Logo OneStop Hub"
                className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-neutral-900 border border-amber-400/70 text-amber-300 hover:bg-amber-500 hover:text-neutral-950 flex items-center justify-center shadow transition-colors cursor-pointer"
              >
                <Camera className="w-2.5 h-2.5" />
              </button>
            )}
          </div>
        )}

        <h2 className="text-lg sm:text-2xl md:text-3xl font-extrabold tracking-tight leading-tight line-clamp-2 break-words">
          <span className="text-white">{firstTitleWord}</span>
          {restTitleWords && (
            <span className="text-amber-400"> {restTitleWords}</span>
          )}
        </h2>

        <p className="text-[11px] sm:text-xs font-medium text-neutral-300">
          One-stop <span className="text-amber-400">service hub</span>
        </p>

        {activeGroup?.description && (
          <p className="hidden sm:line-clamp-2 text-[11px] text-neutral-400 leading-snug pt-0.5">
            {activeGroup.description}
          </p>
        )}

        <p className="text-[10px] font-mono text-neutral-500 pt-1">
          {orbitItems.length === 0
            ? 'Belum ada pintasan'
            : 'Arahkan atau klik ikon pintasan'}
        </p>
      </div>
    );

  const renderHubEmblem = () => {
    if (activeGroup && isImageIcon(activeGroup.icon)) {
      return (
        <div className="w-11 h-11 rounded-xl border border-amber-500/60 bg-neutral-900/95 overflow-hidden shadow-[0_0_24px_rgba(245,158,11,0.35)]">
          <img src={activeGroup.icon} alt={activeGroup.name} className="w-full h-full object-cover" />
        </div>
      );
    }
    if (customLogo?.src && !logoError) {
      return (
        <div className="w-11 h-11 rounded-xl border border-amber-500/55 bg-neutral-900/95 overflow-hidden shadow-[0_0_24px_rgba(245,158,11,0.3)]">
          <img
            src={customLogo.src}
            alt="OneStop Hub Engineering"
            onError={() => setLogoError(true)}
            className={`w-full h-full ${customLogo.fit === 'contain' ? 'object-contain p-0.5' : 'object-cover'}`}
          />
        </div>
      );
    }
    if (activeGroup) {
      return (
        <div className="w-11 h-11 rounded-xl border border-amber-500/50 bg-neutral-950/95 flex items-center justify-center text-amber-400 shadow-[0_0_24px_rgba(245,158,11,0.3)]">
          <DynamicIcon name={activeGroup.icon} className="w-5 h-5" />
        </div>
      );
    }
    return (
      <div className="w-11 h-11 rounded-xl border border-amber-500/50 bg-neutral-950/95 flex items-center justify-center text-amber-400 shadow-[0_0_24px_rgba(245,158,11,0.3)]">
        <Layers className="w-5 h-5" />
      </div>
    );
  };

  return (
    <div
      onMouseLeave={() => {
        setInspectedItem(null);
        setIsOrbitExpanded(false);
      }}
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
      <div className="relative z-20 flex flex-wrap items-center justify-between gap-3 mb-4 sm:mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={() => handleCycleGroup('prev')}
            title="Grup Sebelumnya"
            className="p-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 transition-colors cursor-pointer shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 px-3 py-1 rounded-lg border border-amber-500/25 bg-neutral-900/80 text-xs min-w-0">
            {activeGroup ? (
              <>
                <DynamicIcon name={activeGroup.icon} className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="font-semibold text-white truncate max-w-[140px] sm:max-w-[220px]">{activeGroup.name}</span>
              </>
            ) : (
              <>
                <Layers className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="font-semibold text-white whitespace-nowrap">Semua Grup</span>
              </>
            )}
            <span className="text-amber-400/80 font-mono tabular-nums shrink-0">· {shortcuts.length}</span>
          </div>

          <button
            type="button"
            onClick={() => handleCycleGroup('next')}
            title="Grup Berikutnya"
            className="p-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 transition-colors cursor-pointer shrink-0"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activeGroup && canDeleteGroup && groups.length > 1 && onRequestDeleteGroup && (
            <button
              type="button"
              onClick={() => onRequestDeleteGroup(activeGroup.id)}
              title={`Hapus grup ${activeGroup.name}`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-rose-500/40 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Hapus Grup</span>
            </button>
          )}
          {activeGroup && (
            <button
              type="button"
              onClick={() => {
                setInspectedItem(null);
                onSelectGroupFilter('all');
              }}
              className="px-2.5 py-1 text-xs rounded-lg border border-neutral-700 bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 transition-colors cursor-pointer whitespace-nowrap"
            >
              Lihat Semua Grup
            </button>
          )}
          {canAddShortcut && (
            <button
              type="button"
              onClick={() => onAddInGroup(activeGroup?.id)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-[0_0_20px_rgba(245,158,11,0.35)] transition-colors cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah ke Grup</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile (< sm): Tap center hub to spread gathered icons cleanly */}
      <div className="sm:hidden relative z-10 space-y-5 py-2">
        <div
          role="button"
          tabIndex={0}
          onClick={() => {
            if (!isOrbitExpanded) {
              handleExpandOrbit();
            } else {
              setIsOrbitExpanded(false);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              if (!isOrbitExpanded) {
                handleExpandOrbit();
              } else {
                setIsOrbitExpanded(false);
              }
            }
          }}
          className="mx-auto max-w-sm rounded-2xl border border-amber-500/30 bg-neutral-900/75 px-4 py-4 text-center flex flex-col items-center justify-center cursor-pointer"
        >
          {!isOrbitExpanded && orbitItems.length > 0 ? (
            <div className="space-y-3 py-2 w-full flex flex-col items-center">
              <div className="relative w-28 h-28 flex items-center justify-center">
                {orbitItems.slice(0, 8).map((item, idx, arr) => {
                  const angle = (idx / arr.length) * 2 * Math.PI - Math.PI / 2;
                  const cx = arr.length <= 1 ? 0 : Math.cos(angle) * 34;
                  const cy = arr.length <= 1 ? 0 : Math.sin(angle) * 34;
                  return (
                    <div
                      key={item.id}
                      style={{ transform: `translate(${cx}px, ${cy}px)` }}
                      className="absolute w-8 h-8 rounded-xl border border-amber-500/40 bg-neutral-900/95 flex items-center justify-center shadow-[0_0_12px_rgba(245,158,11,0.22)]"
                    >
                      <DynamicIcon
                        name={isImageIcon(item.iconValue) ? 'Globe' : item.iconValue || 'Globe'}
                        className="w-4 h-4 text-amber-400"
                      />
                    </div>
                  );
                })}
                <div className="relative z-10">{renderHubEmblem()}</div>
              </div>
              <div>
                <h2 className="text-lg font-extrabold tracking-tight">
                  <span className="text-white">{firstTitleWord}</span>
                  {restTitleWords && <span className="text-amber-400"> {restTitleWords}</span>}
                </h2>
                <p className="text-[11px] font-mono text-amber-400/90 mt-1">
                  Ketuk bagian tengah untuk menyebar {orbitItems.length} pintasan
                </p>
              </div>
            </div>
          ) : (
            renderCenterHud()
          )}
        </div>

        <AnimatePresence>
          {isOrbitExpanded && orbitItems.length > 0 && (
            <motion.div
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.78, y: -24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.8, y: -20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 24 }}
              className="grid grid-cols-3 gap-3"
            >
              {orbitItems.map((item, index) => {
                const isSelected = activeShortcut?.id === item.id;
                const isDirectory = item.type === 'directory';
                const customPhotoKey = `${item.id}:${item.iconValue || ''}`;
                const hasCustomPhoto =
                  item.iconType === 'custom' &&
                  isImageIcon(item.iconValue) &&
                  !failedCustomPhotos[customPhotoKey];
                const favicon =
                  item.iconType === 'favicon' && !failedFavicons[item.id]
                    ? getFaviconUrl(item.url)
                    : null;

                return (
                  <motion.button
                    key={item.id}
                    type="button"
                    initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      type: 'spring',
                      stiffness: 320,
                      damping: 22,
                      delay: shouldReduceMotion ? 0 : index * 0.025,
                    }}
                    onClick={() => {
                      setInspectedItem(item);
                      onLaunch(item);
                    }}
                    title={`${item.title} — ${item.url}`}
                    className={`relative flex flex-col items-center p-2.5 rounded-2xl border transition-all cursor-pointer min-w-0 ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.35)]'
                        : 'bg-neutral-900/80 border-amber-500/30 hover:border-amber-400'
                    }`}
                  >
                    <div className="relative w-11 h-11 flex items-center justify-center mb-1.5">
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 48 48"
                        className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none"
                      >
                        <circle
                          cx="24"
                          cy="24"
                          r="21"
                          fill="none"
                          stroke="rgba(245, 158, 11, 0.18)"
                          strokeWidth="1.5"
                          strokeDasharray="2 3"
                        />
                        <motion.circle
                          cx="24"
                          cy="24"
                          r="21"
                          fill="none"
                          stroke={isSelected ? '#fde68a' : '#f59e0b'}
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeDasharray={2 * Math.PI * 21}
                          initial={{
                            strokeDashoffset: shouldReduceMotion ? 0 : 2 * Math.PI * 21,
                          }}
                          animate={{ strokeDashoffset: 0 }}
                          transition={{
                            duration: shouldReduceMotion ? 0 : 1.6,
                            delay: shouldReduceMotion ? 0 : 0.12 + index * 0.03,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                        />
                      </svg>
                      <div className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center bg-neutral-950/75">
                        {hasCustomPhoto ? (
                          <img
                            src={item.iconValue}
                            alt={item.title}
                            onError={() =>
                              setFailedCustomPhotos((prev) => ({
                                ...prev,
                                [customPhotoKey]: true,
                              }))
                            }
                            className="w-full h-full object-cover"
                          />
                        ) : isDirectory ? (
                          <HardDrive className="w-4 h-4 text-amber-400 stroke-[1.75]" />
                        ) : favicon ? (
                          <img
                            src={favicon}
                            alt={item.title}
                            referrerPolicy="no-referrer"
                            onError={() =>
                              setFailedFavicons((prev) => ({ ...prev, [item.id]: true }))
                            }
                            className="w-5 h-5 object-contain rounded"
                          />
                        ) : (
                          <DynamicIcon
                            name={isImageIcon(item.iconValue) ? 'Globe' : item.iconValue || 'Globe'}
                            className="w-4 h-4 text-amber-400 stroke-[1.75]"
                          />
                        )}
                      </div>
                    </div>
                    <span className="w-full text-[11px] font-medium text-neutral-200 truncate text-center leading-tight">
                      {item.title}
                    </span>
                    {item.isPinned && (
                      <span
                        title="Tersemat"
                        className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-amber-500 text-neutral-950 flex items-center justify-center shadow"
                      >
                        <Pin className="w-2 h-2 fill-current" />
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Tablet & Desktop (sm+): Center-Gathered Orbital Stage that Spreads Outward when Cursor Enters Center */}
      <div className="hidden sm:flex relative z-10 items-center justify-center py-6">
        <div
          ref={stageRef}
          onClick={() => {
            if (activeShortcut) {
              setInspectedItem(null);
            } else if (isOrbitExpanded) {
              setIsOrbitExpanded(false);
            }
          }}
          className="relative w-[560px] h-[560px] md:w-[660px] md:h-[660px] lg:w-[720px] lg:h-[720px] flex items-center justify-center"
        >
          {/* Decorative Circular Orbit Rings (contracted while gathered, bloom outward when expanded) */}
          <motion.div
            aria-hidden="true"
            animate={
              shouldReduceMotion
                ? { opacity: isOrbitExpanded ? 1 : 0.45 }
                : {
                    scale: isOrbitExpanded ? 1 : 0.4,
                    opacity: isOrbitExpanded ? 1 : 0.45,
                  }
            }
            transition={{ type: 'spring', stiffness: 200, damping: 24 }}
            className="absolute inset-[10%] rounded-full border border-amber-500/20 pointer-events-none"
          />
          <motion.div
            aria-hidden="true"
            animate={
              shouldReduceMotion
                ? { opacity: isOrbitExpanded ? 1 : 0.3 }
                : {
                    scale: isOrbitExpanded ? 1 : 0.34,
                    opacity: isOrbitExpanded ? 1 : 0.3,
                  }
            }
            style={shouldReduceMotion ? undefined : { rotate: orbitRotation }}
            transition={{ type: 'spring', stiffness: 210, damping: 24, delay: 0.03 }}
            className="absolute inset-[19%] rounded-full border border-dashed border-amber-500/20 pointer-events-none"
          />
          <motion.div
            aria-hidden="true"
            animate={{
              scale: isOrbitExpanded ? 1.1 : 0.85,
              opacity: isOrbitExpanded ? 0.9 : 0.55,
            }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="absolute w-52 h-52 md:w-64 md:h-64 rounded-full bg-amber-500/10 blur-2xl pointer-events-none"
          />

          {/* Center Trigger Hitbox & HUD (hovering center spreads icons outward) */}
          <div
            onMouseEnter={handleExpandOrbit}
            onFocus={handleExpandOrbit}
            onClick={(e) => {
              e.stopPropagation();
              handleExpandOrbit();
            }}
            className={`relative z-30 flex flex-col items-center justify-center text-center transition-all duration-300 ${
              isOrbitExpanded
                ? 'w-[205px] md:w-[240px] max-h-[215px] px-3 py-2.5 rounded-2xl bg-[#08080a]/80 backdrop-blur-xs border border-amber-500/15'
                : 'w-[240px] h-[255px] md:w-[270px] md:h-[280px] rounded-full cursor-pointer'
            }`}
          >
            {isOrbitExpanded ? (
              <motion.div
                key="expanded-hud"
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="w-full"
              >
                {renderCenterHud()}
              </motion.div>
            ) : (
              <motion.div
                key="collapsed-core"
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative flex flex-col items-center justify-end h-full pb-1 pointer-events-none"
              >
                {/* Center Hub Emblem positioned cleanly in the core */}
                <div className="absolute top-[42%] left-1/2 -translate-x-1/2 -translate-y-1/2">
                  {renderHubEmblem()}
                </div>

                {/* Prompt cleanly positioned below the gathered icon cluster */}
                <div className="mt-auto px-3 py-1.5 rounded-xl bg-[#08080a]/90 border border-amber-500/30 backdrop-blur-xs shadow-[0_8px_20px_rgba(0,0,0,0.6)]">
                  <p className="text-xs font-extrabold tracking-tight text-white">
                    {firstTitleWord}{' '}
                    {restTitleWords && <span className="text-amber-400">{restTitleWords}</span>}
                  </p>
                  <p className="text-[10px] font-mono text-amber-400/90 mt-0.5 whitespace-nowrap">
                    {orbitItems.length === 0
                      ? 'Belum ada pintasan'
                      : 'Arahkan kursor ke tengah'}
                  </p>
                </div>
              </motion.div>
            )}
          </div>

          {/* Shortcut Icons: Gathered at Center -> Spread Outward -> Spin 2 Full Turns -> Stop */}
          <motion.div
            style={shouldReduceMotion ? undefined : { rotate: orbitRotation }}
            className="absolute inset-0 z-20 pointer-events-none"
          >
            {orbitItems.map((item, index) => {
              const angle = (index / orbitItems.length) * 2 * Math.PI - Math.PI / 2;
              const expandedX = Math.cos(angle) * expandedRadiusPx;
              const expandedY = Math.sin(angle) * expandedRadiusPx;
              const gatheredX = Math.cos(angle) * gatheredRadiusPx;
              const gatheredY = Math.sin(angle) * gatheredRadiusPx - 20;
              const gatheredRotate = ((index % 5) - 2) * 3.5;

              const isSelected = activeShortcut?.id === item.id;
              const isDirectory = item.type === 'directory';
              const customPhotoKey = `${item.id}:${item.iconValue || ''}`;
              const hasCustomPhoto =
                item.iconType === 'custom' &&
                isImageIcon(item.iconValue) &&
                !failedCustomPhotos[customPhotoKey];
              const favicon =
                item.iconType === 'favicon' && !failedFavicons[item.id]
                  ? getFaviconUrl(item.url)
                  : null;

              return (
                <motion.div
                  key={item.id}
                  initial={
                    shouldReduceMotion
                      ? false
                      : {
                          x: gatheredX,
                          y: gatheredY,
                          scale: 0.72,
                          opacity: 0.9,
                        }
                  }
                  animate={
                    shouldReduceMotion
                      ? {
                          x: isOrbitExpanded ? expandedX : gatheredX,
                          y: isOrbitExpanded ? expandedY : gatheredY,
                          opacity: 1,
                        }
                      : {
                          x: isOrbitExpanded ? expandedX : gatheredX,
                          y: isOrbitExpanded ? expandedY : gatheredY,
                          scale: isOrbitExpanded ? 1 : 0.74,
                          opacity: isOrbitExpanded ? 1 : 0.92,
                        }
                  }
                  transition={{
                    type: 'spring',
                    stiffness: isOrbitExpanded ? 260 : 300,
                    damping: isOrbitExpanded ? 22 : 26,
                    mass: 0.8,
                    delay: shouldReduceMotion
                      ? 0
                      : isOrbitExpanded
                      ? index * 0.022
                      : (orbitItems.length - 1 - index) * 0.012,
                  }}
                  style={{ left: '50%', top: '50%' }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 ${
                    isOrbitExpanded
                      ? `pointer-events-auto ${isSelected ? 'z-30' : 'z-20 hover:z-30'}`
                      : 'z-20 pointer-events-none'
                  }`}
                >
                  {/* Counter-rotation wrapper keeps icon & title upright throughout the 2-turn orbit */}
                  <motion.div
                    style={shouldReduceMotion ? undefined : { rotate: counterRotation }}
                    className="flex flex-col items-center group"
                  >
                    <div className="relative flex items-center justify-center">
                      {/* J.A.R.V.I.S. Circular Data-Loading Ring synchronized with the 2-turn spin */}
                      <motion.svg
                        aria-hidden="true"
                        viewBox="0 0 68 68"
                        animate={{
                          opacity: !isOrbitExpanded
                            ? 0
                            : isSelected
                            ? 1
                            : isOrbitLoaded
                            ? 0.55
                            : 0.95,
                          scale: !isOrbitExpanded ? 0.85 : isSelected ? 1.12 : 1,
                        }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        className="absolute -inset-2 w-[calc(100%+16px)] h-[calc(100%+16px)] -rotate-90 pointer-events-none"
                      >
                        {/* Segmented HUD calibration track */}
                        <circle
                          cx="34"
                          cy="34"
                          r={ringRadius}
                          fill="none"
                          stroke="rgba(245, 158, 11, 0.2)"
                          strokeWidth="1.25"
                          strokeDasharray="2.5 3.5"
                        />
                        {/* Cardinal HUD micro-ticks */}
                        <line x1="34" y1="1.5" x2="34" y2="3.5" stroke="rgba(251, 191, 36, 0.55)" strokeWidth="1.25" strokeLinecap="round" />
                        <line x1="34" y1="64.5" x2="34" y2="66.5" stroke="rgba(251, 191, 36, 0.55)" strokeWidth="1.25" strokeLinecap="round" />
                        <line x1="1.5" y1="34" x2="3.5" y2="34" stroke="rgba(251, 191, 36, 0.55)" strokeWidth="1.25" strokeLinecap="round" />
                        <line x1="64.5" y1="34" x2="66.5" y2="34" stroke="rgba(251, 191, 36, 0.55)" strokeWidth="1.25" strokeLinecap="round" />

                        {/* Soft ambient progress halo */}
                        <motion.circle
                          cx="34"
                          cy="34"
                          r={ringRadius}
                          fill="none"
                          stroke="rgba(251, 191, 36, 0.24)"
                          strokeWidth="4.25"
                          strokeLinecap="round"
                          strokeDasharray={ringCircumference}
                          style={
                            shouldReduceMotion
                              ? { strokeDashoffset: isOrbitExpanded ? 0 : ringCircumference }
                              : { strokeDashoffset: ringDashOffset }
                          }
                        />

                        {/* Primary J.A.R.V.I.S. circular data-loading progress arc */}
                        <motion.circle
                          cx="34"
                          cy="34"
                          r={ringRadius}
                          fill="none"
                          stroke={isSelected || isOrbitLoaded ? '#fcd34d' : '#f59e0b'}
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeDasharray={ringCircumference}
                          style={
                            shouldReduceMotion
                              ? { strokeDashoffset: isOrbitExpanded ? 0 : ringCircumference }
                              : { strokeDashoffset: ringDashOffset }
                          }
                        />
                      </motion.svg>

                      <motion.button
                        type="button"
                        tabIndex={isOrbitExpanded ? 0 : -1}
                        animate={
                          shouldReduceMotion
                            ? undefined
                            : { rotate: isOrbitExpanded ? 0 : gatheredRotate }
                        }
                        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                        onMouseEnter={() => {
                          if (isOrbitExpanded) handleInspectShortcut(item, index);
                        }}
                        onFocus={() => {
                          if (isOrbitExpanded) handleInspectShortcut(item, index);
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isOrbitExpanded) {
                            handleExpandOrbit();
                            return;
                          }
                          setInspectedItem(item);
                          onLaunch(item);
                        }}
                        title={`${item.title} — ${item.url}`}
                        className={`relative w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center transition-all duration-200 cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500/20 border-2 border-amber-400 scale-110 shadow-[0_0_28px_rgba(245,158,11,0.55)]'
                            : 'bg-neutral-900/95 border border-amber-500/40 hover:border-amber-400 hover:bg-amber-500/15 hover:scale-110 hover:shadow-[0_0_24px_rgba(245,158,11,0.4)]'
                        }`}
                      >
                        <div className="w-full h-full rounded-[14px] overflow-hidden flex items-center justify-center">
                          {hasCustomPhoto ? (
                            <img
                              src={item.iconValue}
                              alt={item.title}
                              onError={() =>
                                setFailedCustomPhotos((prev) => ({
                                  ...prev,
                                  [customPhotoKey]: true,
                                }))
                              }
                              className="w-full h-full object-cover"
                            />
                          ) : isDirectory ? (
                            <HardDrive className="w-6 h-6 md:w-7 md:h-7 text-amber-400 stroke-[1.75]" />
                          ) : favicon ? (
                            <img
                              src={favicon}
                              alt={item.title}
                              referrerPolicy="no-referrer"
                              onError={() =>
                                setFailedFavicons((prev) => ({ ...prev, [item.id]: true }))
                              }
                              className="w-6 h-6 md:w-7 md:h-7 object-contain rounded"
                            />
                          ) : (
                            <DynamicIcon
                              name={isImageIcon(item.iconValue) ? 'Globe' : item.iconValue || 'Globe'}
                              className="w-6 h-6 md:w-7 md:h-7 text-amber-400 stroke-[1.75] group-hover:text-amber-300"
                            />
                          )}
                        </div>

                        {item.isPinned && isOrbitExpanded && (
                          <span
                            title="Tersemat"
                            className="absolute -top-1 -right-1 z-10 w-3.5 h-3.5 rounded-full bg-amber-500 text-neutral-950 flex items-center justify-center shadow"
                          >
                            <Pin className="w-2 h-2 fill-current" />
                          </span>
                        )}
                      </motion.button>
                    </div>

                    <motion.span
                      animate={{
                        opacity: isOrbitExpanded ? 1 : 0,
                        scale: isOrbitExpanded ? 1 : 0.8,
                      }}
                      transition={{
                        duration: 0.16,
                        delay: isOrbitExpanded && !shouldReduceMotion ? 0.1 + index * 0.018 : 0,
                      }}
                      className={`mt-2 px-1.5 py-0.5 rounded-md bg-[#08080a]/90 text-[11px] font-medium max-w-[84px] md:max-w-[100px] truncate text-center leading-tight transition-colors ${
                        isSelected
                          ? 'text-amber-300 font-semibold'
                          : 'text-neutral-300 group-hover:text-white'
                      }`}
                    >
                      {item.title}
                    </motion.span>
                  </motion.div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </div>

      {/* Overflow Strip if group has more than 12 shortcuts */}
      {overflowItems.length > 0 && (
        <div className="relative z-20 mt-4 pt-4 border-t border-amber-500/20">
          <p className="text-[11px] font-mono text-amber-400/90 mb-2.5">
            Pintasan Lainnya ({overflowItems.length})
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {overflowItems.map((item, overflowIndex) => {
              const customPhotoKey = `${item.id}:${item.iconValue || ''}`;
              const hasCustomPhoto =
                item.iconType === 'custom' &&
                isImageIcon(item.iconValue) &&
                !failedCustomPhotos[customPhotoKey];

              return (
                <button
                  key={item.id}
                  type="button"
                  onMouseEnter={() => handleInspectShortcut(item, maxOrbitCount + overflowIndex)}
                  onFocus={() => handleInspectShortcut(item, maxOrbitCount + overflowIndex)}
                  onClick={() => onLaunch(item)}
                  className="flex items-center gap-2 p-2 rounded-xl border border-amber-500/25 bg-neutral-900/75 hover:bg-amber-500/15 hover:border-amber-400 text-left transition-colors cursor-pointer min-w-0"
                >
                  {hasCustomPhoto ? (
                    <img
                      src={item.iconValue}
                      alt={item.title}
                      onError={() =>
                        setFailedCustomPhotos((prev) => ({
                          ...prev,
                          [customPhotoKey]: true,
                        }))
                      }
                      className="w-5 h-5 rounded object-cover shrink-0"
                    />
                  ) : item.type === 'directory' ? (
                    <HardDrive className="w-4 h-4 text-amber-400 shrink-0" />
                  ) : (
                    <DynamicIcon
                      name={isImageIcon(item.iconValue) ? 'Globe' : item.iconValue || 'Globe'}
                      className="w-4 h-4 text-amber-400 shrink-0"
                    />
                  )}
                  <span className="text-xs text-neutral-200 truncate">{item.title}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
