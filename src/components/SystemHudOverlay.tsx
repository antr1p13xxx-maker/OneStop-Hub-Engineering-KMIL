import React, { useEffect, useRef, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Cpu,
  Eye,
  EyeOff,
  HardDrive,
  RefreshCw,
  WifiOff,
} from 'lucide-react';
import type { CloudSyncStatus } from './Header';
import type { ViewMode } from '../types';

interface SystemHudOverlayProps {
  isVisible: boolean;
  onToggleVisible: (visible: boolean) => void;
  isOnline: boolean;
  cloudSyncStatus: CloudSyncStatus;
  viewMode: ViewMode;
}

interface PerformanceMemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

interface NavigatorConnectionInfo {
  effectiveType?: string;
  rtt?: number;
}

interface ExtendedPerformance extends Performance {
  memory?: PerformanceMemoryInfo;
}

interface ExtendedNavigator extends Navigator {
  deviceMemory?: number;
  connection?: NavigatorConnectionInfo;
}

interface TelemetrySnapshot {
  cpuPercent: number;
  cores: number | null;
  fps: number;
  memUsedMB: number | null;
  memTotalMB: number | null;
  memPercent: number | null;
  memLabel: string;
  deviceMemoryGB: number | null;
  netLabel: string | null;
  timeText: string;
}

function formatClock(date: Date): string {
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

export const SystemHudOverlay: React.FC<SystemHudOverlayProps> = ({
  isVisible,
  onToggleVisible,
  isOnline,
  cloudSyncStatus,
  viewMode,
}) => {
  const isOrbit = viewMode === 'orbit';

  const [telemetry, setTelemetry] = useState<TelemetrySnapshot>(() => {
    const nav = typeof navigator !== 'undefined' ? (navigator as ExtendedNavigator) : undefined;
    return {
      cpuPercent: 0,
      cores: nav?.hardwareConcurrency ?? null,
      fps: 60,
      memUsedMB: null,
      memTotalMB: null,
      memPercent: null,
      memLabel: 'MEM —',
      deviceMemoryGB: nav?.deviceMemory ?? null,
      netLabel: null,
      timeText: formatClock(new Date()),
    };
  });

  const cpuSmoothedRef = useRef<number>(8);
  const storageEstimateRef = useRef<{ usedMB: number; quotaMB: number } | null>(null);

  useEffect(() => {
    if (!isVisible) return;

    let rafId = 0;
    let lastFrameAt = performance.now();
    let frameCount = 0;
    let overBudgetMs = 0;
    let longTaskMs = 0;
    let driftOverMs = 0;
    let lastHeartbeatAt = performance.now();
    let isPageVisible = document.visibilityState === 'visible';

    const onVisibilityChange = () => {
      isPageVisible = document.visibilityState === 'visible';
      lastFrameAt = performance.now();
      lastHeartbeatAt = performance.now();
      frameCount = 0;
      overBudgetMs = 0;
      longTaskMs = 0;
      driftOverMs = 0;
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    // Track browser Long Tasks on main thread when supported
    let longTaskObserver: PerformanceObserver | null = null;
    if (typeof PerformanceObserver !== 'undefined') {
      try {
        const supported = PerformanceObserver.supportedEntryTypes || [];
        if (supported.includes('longtask')) {
          longTaskObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              longTaskMs += entry.duration;
            }
          });
          longTaskObserver.observe({ entryTypes: ['longtask'] });
        }
      } catch {
        longTaskObserver = null;
      }
    }

    // Track real animation frame intervals & frame budget overshoot
    const tickFrame = (now: number) => {
      if (isPageVisible) {
        const delta = now - lastFrameAt;
        frameCount += 1;
        // Count work beyond standard 16.67ms frame budget (ignore huge tab-switch gaps)
        if (delta > 18 && delta < 300) {
          overBudgetMs += delta - 16.67;
        }
      }
      lastFrameAt = now;
      rafId = window.requestAnimationFrame(tickFrame);
    };
    rafId = window.requestAnimationFrame(tickFrame);

    // Measure event-loop scheduling drift every 200ms
    const heartbeatTimer = window.setInterval(() => {
      const now = performance.now();
      if (isPageVisible) {
        const lag = Math.max(0, now - lastHeartbeatAt - 200);
        if (lag < 500) {
          driftOverMs += lag;
        }
      }
      lastHeartbeatAt = now;
    }, 200);

    // Fallback storage estimate (for browsers without performance.memory)
    const refreshStorageEstimate = () => {
      if (typeof navigator !== 'undefined' && navigator.storage?.estimate) {
        navigator.storage
          .estimate()
          .then((est) => {
            if (typeof est.usage === 'number' && typeof est.quota === 'number' && est.quota > 0) {
              storageEstimateRef.current = {
                usedMB: est.usage / (1024 * 1024),
                quotaMB: est.quota / (1024 * 1024),
              };
            }
          })
          .catch(() => {});
      }
    };
    refreshStorageEstimate();
    const storageTimer = window.setInterval(refreshStorageEstimate, 6000);

    // Aggregate telemetry snapshot every 850ms
    const SAMPLE_WINDOW_MS = 850;
    const sampleTimer = window.setInterval(() => {
      if (!isPageVisible) return;

      const perf = performance as ExtendedPerformance;
      const nav = navigator as ExtendedNavigator;

      // 1. Real main-thread CPU / UI load %
      const busyMs = Math.min(
        SAMPLE_WINDOW_MS,
        longTaskMs + driftOverMs * 1.4 + overBudgetMs * 0.65
      );
      const rawCpuPct = Math.max(
        2,
        Math.min(99, (busyMs / SAMPLE_WINDOW_MS) * 100 + (frameCount > 0 ? Math.min(12, overBudgetMs / Math.max(1, frameCount)) : 0))
      );
      cpuSmoothedRef.current = cpuSmoothedRef.current * 0.45 + rawCpuPct * 0.55;
      const cpuPercent = Math.round(cpuSmoothedRef.current);

      const fps = Math.max(
        1,
        Math.min(240, Math.round((frameCount * 1000) / SAMPLE_WINDOW_MS))
      );

      // Reset accumulators
      frameCount = 0;
      overBudgetMs = 0;
      longTaskMs = 0;
      driftOverMs = 0;

      // 2. Real Memory reading (Chromium JS Heap -> fallback Device RAM / Storage)
      let memUsedMB: number | null = null;
      let memTotalMB: number | null = null;
      let memPercent: number | null = null;
      let memLabel = 'MEM —';

      if (perf.memory && perf.memory.totalJSHeapSize > 0) {
        memUsedMB = perf.memory.usedJSHeapSize / (1024 * 1024);
        memTotalMB = perf.memory.totalJSHeapSize / (1024 * 1024);
        memPercent = Math.min(100, Math.max(1, Math.round((memUsedMB / memTotalMB) * 100)));
        memLabel = `${memUsedMB.toFixed(1)}/${memTotalMB.toFixed(0)} MB`;
      } else if (storageEstimateRef.current) {
        memUsedMB = storageEstimateRef.current.usedMB;
        memTotalMB = storageEstimateRef.current.quotaMB;
        memPercent = Math.min(
          100,
          Math.max(1, Math.round((memUsedMB / Math.max(1, memTotalMB)) * 100))
        );
        memLabel = nav.deviceMemory
          ? `RAM ${nav.deviceMemory} GB`
          : `${memUsedMB.toFixed(1)} MB Cache`;
      } else if (nav.deviceMemory) {
        memLabel = `RAM ${nav.deviceMemory} GB`;
      }

      // 3. Real Network hint
      let netLabel: string | null = null;
      if (nav.connection) {
        const parts: string[] = [];
        if (nav.connection.effectiveType) {
          parts.push(nav.connection.effectiveType.toUpperCase());
        }
        if (typeof nav.connection.rtt === 'number' && nav.connection.rtt > 0) {
          parts.push(`${nav.connection.rtt}ms`);
        }
        if (parts.length > 0) {
          netLabel = parts.join(' ');
        }
      }

      setTelemetry({
        cpuPercent,
        cores: nav.hardwareConcurrency ?? null,
        fps,
        memUsedMB,
        memTotalMB,
        memPercent,
        memLabel,
        deviceMemoryGB: nav.deviceMemory ?? null,
        netLabel,
        timeText: formatClock(new Date()),
      });
    }, SAMPLE_WINDOW_MS);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.clearInterval(heartbeatTimer);
      window.clearInterval(sampleTimer);
      window.clearInterval(storageTimer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      longTaskObserver?.disconnect();
    };
  }, [isVisible]);

  // System status label + icon (never hue-only)
  const getSystemStatus = () => {
    if (!isOnline || cloudSyncStatus === 'offline') {
      return {
        label: 'Offline',
        tone: 'text-amber-600 dark:text-amber-400',
        bar: 'bg-amber-500',
        icon: <WifiOff className="w-3 h-3 shrink-0" />,
      };
    }
    if (cloudSyncStatus === 'error') {
      return {
        label: 'Gangguan Cloud',
        tone: 'text-rose-600 dark:text-rose-400',
        bar: 'bg-rose-500',
        icon: <AlertTriangle className="w-3 h-3 shrink-0" />,
      };
    }
    if (cloudSyncStatus === 'syncing') {
      return {
        label: 'Sinkronisasi',
        tone: 'text-cyan-600 dark:text-cyan-400',
        bar: 'bg-cyan-500',
        icon: <RefreshCw className="w-3 h-3 animate-spin shrink-0" />,
      };
    }
    if (cloudSyncStatus === 'synced') {
      return {
        label: 'Sistem Aktif · Cloud',
        tone: 'text-emerald-600 dark:text-emerald-400',
        bar: 'bg-emerald-500',
        icon: <Activity className="w-3 h-3 shrink-0" />,
      };
    }
    return {
      label: 'Sistem Aktif · Lokal',
      tone: 'text-emerald-600 dark:text-emerald-400',
      bar: 'bg-emerald-500',
      icon: <Activity className="w-3 h-3 shrink-0" />,
    };
  };

  const statusInfo = getSystemStatus();
  const cpuBarColor =
    telemetry.cpuPercent >= 75
      ? 'bg-rose-500'
      : telemetry.cpuPercent >= 45
      ? 'bg-amber-500'
      : isOrbit
      ? 'bg-amber-400'
      : 'bg-cyan-500';
  const memPercentSafe = telemetry.memPercent ?? 0;
  const memBarColor =
    memPercentSafe >= 85
      ? 'bg-rose-500'
      : memPercentSafe >= 65
      ? 'bg-amber-500'
      : 'bg-emerald-500';

  if (!isVisible) {
    return (
      <button
        type="button"
        onClick={() => onToggleVisible(true)}
        title="Tampilkan HUD Monitor Sistem"
        aria-label="Tampilkan HUD Monitor Sistem"
        className={`fixed bottom-2.5 right-3 z-30 inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-mono backdrop-blur-md border transition-colors cursor-pointer ${
          isOrbit
            ? 'bg-[#080a0f]/80 border-amber-500/35 text-amber-300 hover:bg-amber-500/15'
            : 'bg-white/85 dark:bg-neutral-900/85 border-neutral-300/80 dark:border-cyan-500/30 text-neutral-600 dark:text-cyan-300 hover:text-neutral-900 dark:hover:text-white'
        }`}
      >
        <Eye className="w-3 h-3" />
        <span>HUD</span>
      </button>
    );
  }

  const bracketColor = isOrbit
    ? 'border-amber-500/45'
    : 'border-cyan-500/35 dark:border-cyan-400/40';

  const surfaceClass = isOrbit
    ? 'bg-[#080a0f]/82 border-amber-500/35 text-neutral-200 shadow-[0_4px_18px_rgba(245,158,11,0.12)]'
    : 'bg-white/85 dark:bg-[#090d16]/82 border-neutral-200/90 dark:border-cyan-500/25 text-neutral-700 dark:text-neutral-200 shadow-sm dark:shadow-[0_4px_18px_rgba(6,182,212,0.1)]';

  return (
    <div
      aria-label="HUD Monitor Sistem"
      className="fixed inset-0 z-30 pointer-events-none select-none"
    >
      {/* Perimeter Corner Brackets (Desktop lg+) */}
      <div
        aria-hidden="true"
        className={`hidden lg:block fixed top-2 left-2 w-3.5 h-3.5 border-t border-l ${bracketColor}`}
      />
      <div
        aria-hidden="true"
        className={`hidden lg:block fixed top-2 right-2 w-3.5 h-3.5 border-t border-r ${bracketColor}`}
      />
      <div
        aria-hidden="true"
        className={`hidden lg:block fixed bottom-2 left-2 w-3.5 h-3.5 border-b border-l ${bracketColor}`}
      />
      <div
        aria-hidden="true"
        className={`hidden lg:block fixed bottom-2 right-2 w-3.5 h-3.5 border-b border-r ${bracketColor}`}
      />

      {/* Side-edge hairline ticks on wide monitors */}
      <div
        aria-hidden="true"
        className={`hidden xl:flex fixed left-1.5 top-1/2 -translate-y-1/2 flex-col gap-1.5 opacity-45`}
      >
        <span className={`w-1.5 h-px ${isOrbit ? 'bg-amber-400' : 'bg-cyan-500'}`} />
        <span className={`w-2.5 h-px ${isOrbit ? 'bg-amber-400' : 'bg-cyan-500'}`} />
        <span className={`w-1.5 h-px ${isOrbit ? 'bg-amber-400' : 'bg-cyan-500'}`} />
      </div>
      <div
        aria-hidden="true"
        className={`hidden xl:flex fixed right-1.5 top-1/2 -translate-y-1/2 flex-col items-end gap-1.5 opacity-45`}
      >
        <span className={`w-1.5 h-px ${isOrbit ? 'bg-amber-400' : 'bg-cyan-500'}`} />
        <span className={`w-2.5 h-px ${isOrbit ? 'bg-amber-400' : 'bg-cyan-500'}`} />
        <span className={`w-1.5 h-px ${isOrbit ? 'bg-amber-400' : 'bg-cyan-500'}`} />
      </div>

      {/* Bottom-Left Edge Strip: System Status + Real-Time CPU & Memory */}
      <div
        className={`fixed bottom-1.5 sm:bottom-2.5 left-2 right-2 sm:right-auto sm:left-3.5 pointer-events-auto flex items-center justify-between sm:justify-start gap-2 sm:gap-2.5 px-2.5 py-1 rounded-lg border backdrop-blur-md text-[10px] sm:text-[11px] font-mono tabular-nums transition-colors ${surfaceClass}`}
      >
        {/* System Status */}
        <div className={`flex items-center gap-1.5 font-medium whitespace-nowrap ${statusInfo.tone}`}>
          {statusInfo.icon}
          <span className="truncate max-w-[115px] sm:max-w-none">{statusInfo.label}</span>
          {telemetry.netLabel && (
            <span className="hidden md:inline text-neutral-400 dark:text-neutral-500">
              · {telemetry.netLabel}
            </span>
          )}
        </div>

        <span aria-hidden="true" className="text-neutral-300 dark:text-neutral-700">
          |
        </span>

        {/* CPU Load */}
        <div
          className="flex items-center gap-1.5 whitespace-nowrap"
          title={
            telemetry.cores
              ? `Beban CPU thread utama: ${telemetry.cpuPercent}% (${telemetry.cores} Core logis)`
              : `Beban CPU thread utama: ${telemetry.cpuPercent}%`
          }
        >
          <Cpu
            className={`w-3 h-3 shrink-0 ${
              isOrbit ? 'text-amber-400' : 'text-cyan-600 dark:text-cyan-400'
            }`}
          />
          <span>
            CPU{' '}
            <strong className="font-semibold text-neutral-900 dark:text-white">
              {telemetry.cpuPercent}%
            </strong>
            {telemetry.cores && (
              <span className="hidden md:inline text-neutral-400 dark:text-neutral-500">
                {' '}
                · {telemetry.cores}C
              </span>
            )}
          </span>
          <div className="hidden sm:block w-7 h-1 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
            <div
              className={`h-full origin-left transition-transform duration-500 ease-out ${cpuBarColor}`}
              style={{ transform: `scaleX(${Math.max(0.06, telemetry.cpuPercent / 100)})` }}
            />
          </div>
        </div>

        <span aria-hidden="true" className="text-neutral-300 dark:text-neutral-700">
          |
        </span>

        {/* Memory Usage */}
        <div
          className="flex items-center gap-1.5 whitespace-nowrap min-w-0"
          title={
            telemetry.memPercent !== null
              ? `Penggunaan Memori JS Heap: ${telemetry.memLabel} (${telemetry.memPercent}%)`
              : `Info Memori: ${telemetry.memLabel}`
          }
        >
          <HardDrive
            className={`w-3 h-3 shrink-0 ${
              isOrbit ? 'text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
            }`}
          />
          <span className="truncate">
            MEM{' '}
            <strong className="font-semibold text-neutral-900 dark:text-white">
              {telemetry.memLabel}
            </strong>
          </span>
          {telemetry.memPercent !== null && (
            <div className="hidden sm:block w-7 h-1 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
              <div
                className={`h-full origin-left transition-transform duration-500 ease-out ${memBarColor}`}
                style={{ transform: `scaleX(${Math.max(0.06, telemetry.memPercent / 100)})` }}
              />
            </div>
          )}
        </div>

        {/* Mobile Hide Toggle */}
        <button
          type="button"
          onClick={() => onToggleVisible(false)}
          title="Sembunyikan HUD"
          aria-label="Sembunyikan HUD"
          className="sm:hidden p-0.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-white rounded cursor-pointer shrink-0"
        >
          <EyeOff className="w-3 h-3" />
        </button>
      </div>

      {/* Bottom-Right Edge Strip (Desktop sm+): FPS, Clock & Collapse Toggle */}
      <div
        className={`hidden sm:inline-flex fixed bottom-2.5 right-3.5 pointer-events-auto items-center gap-2 px-2.5 py-1 rounded-lg border backdrop-blur-md text-[11px] font-mono tabular-nums transition-colors ${surfaceClass}`}
      >
        <span className="text-neutral-500 dark:text-neutral-400">
          <strong className="font-semibold text-neutral-900 dark:text-white">{telemetry.fps}</strong>{' '}
          FPS
        </span>
        <span aria-hidden="true" className="text-neutral-300 dark:text-neutral-700">
          ·
        </span>
        <span className={isOrbit ? 'text-amber-300' : 'text-cyan-700 dark:text-cyan-300'}>
          {telemetry.timeText}
        </span>
        <button
          type="button"
          onClick={() => onToggleVisible(false)}
          title="Sembunyikan HUD Pinggiran Layar"
          aria-label="Sembunyikan HUD Pinggiran Layar"
          className="ml-0.5 p-0.5 rounded text-neutral-400 hover:text-neutral-800 dark:hover:text-white transition-colors cursor-pointer"
        >
          <EyeOff className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
