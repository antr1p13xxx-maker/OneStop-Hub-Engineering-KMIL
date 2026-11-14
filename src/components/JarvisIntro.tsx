import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  VolumeX,
  FastForward,
  ShieldCheck,
  HardDrive,
  Cpu,
  Activity,
  Layers,
  Terminal,
  Zap,
} from 'lucide-react';
import {
  playJarvisBootSound,
  playJarvisBeep,
  playJarvisLockSound,
  speakJarvisGreeting,
} from '../utils/jarvisAudio';
import { UserRole, CustomLogoConfig } from '../types';
import { ROLE_CONFIGS } from '../services/auth';

interface JarvisIntroProps {
  onComplete: () => void;
  currentRole: UserRole;
  audioEnabled: boolean;
  onToggleAudio: () => void;
  customLogo?: CustomLogoConfig | null;
}

export const JarvisIntro: React.FC<JarvisIntroProps> = ({
  onComplete,
  currentRole,
  audioEnabled,
  onToggleAudio,
  customLogo,
}) => {
  const [logoImgError, setLogoImgError] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [systemClock, setSystemClock] = useState('');
  const [audioBars, setAudioBars] = useState<number[]>([30, 65, 45, 80, 55, 90, 40, 75, 60, 85, 50, 70]);
  const hasTriggeredVoiceRef = useRef(false);

  const steps = [
    { title: 'INITIALIZING J.A.R.V.I.S. PROTOCOLS', code: 'SYS_BOOT::0x7F4B', detail: 'Calibrating neural core & engine sensors...' },
    { title: 'INDEXING DIRECTORIES & MOUNTING DRIVE D:\\', code: 'I/O::STORAGE_ACCELERATOR', detail: 'Local drive pathways & folder links synchronized.' },
    { title: 'VERIFYING SECURITY MATRIX & ENCRYPTION', code: 'SEC::AES-256_GCM', detail: `User privilege authorized: [${ROLE_CONFIGS[currentRole].name.toUpperCase()}].` },
    { title: 'ONE-STOP HUB ENGINEERING ONLINE', code: 'CORE::READY_100%', detail: 'All systems calibrated. Welcome back, Engineer.' },
  ];

  // System real-time clock
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0').slice(0, 2);
      setSystemClock(timeStr);
    };
    updateClock();
    const interval = setInterval(updateClock, 50);
    return () => clearInterval(interval);
  }, []);

  // Audio wave bars animation
  useEffect(() => {
    const interval = setInterval(() => {
      setAudioBars(Array.from({ length: 14 }, () => Math.floor(Math.random() * 75) + 20));
    }, 120);
    return () => clearInterval(interval);
  }, []);

  // Escape key handler to skip immediately
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        handleFinish();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Startup audio & timeline
  useEffect(() => {
    // Play initial boot swell
    playJarvisBootSound(audioEnabled);

    // Progress counter timer
    const startTime = Date.now();
    const duration = 3200; // 3.2 seconds total

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const rawPct = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(rawPct);

      // Phase changes
      if (rawPct >= 25 && rawPct < 55) {
        setCurrentStep(1);
      } else if (rawPct >= 55 && rawPct < 85) {
        setCurrentStep(2);
      } else if (rawPct >= 85) {
        setCurrentStep(3);
      }

      // Audio cues along the timeline
      if (rawPct === 30 && audioEnabled) {
        playJarvisBeep(980, true);
      } else if (rawPct === 60 && audioEnabled) {
        playJarvisBeep(1240, true);
      } else if (rawPct >= 88 && !hasTriggeredVoiceRef.current) {
        hasTriggeredVoiceRef.current = true;
        playJarvisLockSound(audioEnabled);
        speakJarvisGreeting(audioEnabled);
      }

      if (rawPct >= 100) {
        clearInterval(timer);
        // Brief pause at 100% before smooth fade-out
        setTimeout(() => {
          handleFinish();
        }, 450);
      }
    }, 30);

    return () => clearInterval(timer);
  }, [audioEnabled]);

  const handleFinish = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      onComplete();
    }, 400);
  };

  return (
    <div
      className={`fixed inset-0 z-50 bg-neutral-950 text-cyan-400 font-mono select-none overflow-hidden transition-all duration-400 ${
        isFadingOut ? 'opacity-0 scale-105 pointer-events-none filter blur-xs' : 'opacity-100 scale-100'
      }`}
    >
      {/* Background High-Tech Hex Mesh & Scanlines */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-950/30 via-neutral-950 to-black pointer-events-none" />
      
      {/* Subtle Grid Backdrop */}
      <div
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(6, 182, 212, 0.25) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(6, 182, 212, 0.25) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Moving Holographic Scanline */}
      <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent pointer-events-none animate-jarvis-scanline" />

      {/* Top Left: System Telemetry HUD */}
      <div className="absolute top-4 left-4 sm:top-6 sm:left-8 z-20 space-y-1.5 text-[11px] leading-tight">
        <div className="flex items-center gap-2 text-cyan-300 font-bold tracking-wider">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>J.A.R.V.I.S. // OS_v4.2</span>
        </div>
        <div className="text-neutral-500 flex items-center gap-2">
          <span>SYS_CLOCK:</span>
          <span className="text-cyan-400 font-semibold">{systemClock}</span>
        </div>
        <div className="text-neutral-500 hidden sm:flex items-center gap-2">
          <span>KERNEL:</span>
          <span className="text-emerald-400">ONLINE [OPTIMAL]</span>
        </div>
        <div className="text-neutral-500 hidden sm:flex items-center gap-2">
          <span>STORAGE:</span>
          <span className="text-cyan-300">MOUNT_DRIVE_D:\ READY</span>
        </div>
      </div>

      {/* Top Right: Protocol Matrix & Audio Toggle */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-8 z-20 flex flex-col items-end gap-2 text-[11px]">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleAudio}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-cyan-800/80 bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-300 hover:text-cyan-100 transition-colors shadow-2xs cursor-pointer"
            title={audioEnabled ? 'Matikan Suara Jarvis' : 'Aktifkan Suara Jarvis'}
          >
            {audioEnabled ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">AUDIO: ON</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5 text-neutral-500" />
                <span className="hidden sm:inline text-neutral-400">AUDIO: MUTED</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleFinish}
            className="flex items-center gap-1.5 px-3 py-1 rounded border border-indigo-600/80 bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-300 hover:text-indigo-100 transition-colors shadow-2xs font-semibold cursor-pointer"
          >
            <FastForward className="w-3.5 h-3.5" />
            <span>LEWATI [ESC]</span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 text-neutral-500 text-[10px]">
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
          <span>ROLE: {ROLE_CONFIGS[currentRole].name.toUpperCase()}</span>
          <span>·</span>
          <span className="text-emerald-400">AUTHORIZED</span>
        </div>
      </div>

      {/* Center: Holographic Arc Reactor & Telemetry Rings */}
      <div className="relative w-full h-full flex flex-col items-center justify-center p-4">
        {/* Arc Reactor Container */}
        <div className="relative w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 flex items-center justify-center">
          
          {/* Outer Ambient Glow */}
          <div className="absolute inset-0 rounded-full bg-cyan-500/10 blur-2xl pointer-events-none" />

          {/* Ring 1: Outer Tech Degree Arc (SVG) - Slowly rotating clockwise */}
          <svg className="absolute inset-0 w-full h-full animate-jarvis-spin-slow pointer-events-none" viewBox="0 0 400 400">
            {/* Degree marks */}
            <circle cx="200" cy="200" r="185" fill="none" stroke="rgba(6, 182, 212, 0.25)" strokeWidth="1" strokeDasharray="4 8" />
            <circle cx="200" cy="200" r="175" fill="none" stroke="rgba(6, 182, 212, 0.4)" strokeWidth="1.5" strokeDasharray="40 180 80 120" />
            
            {/* Tech graduation marks */}
            {Array.from({ length: 24 }).map((_, i) => {
              const angle = (i * 360) / 24;
              return (
                <line
                  key={i}
                  x1="200"
                  y1="18"
                  x2="200"
                  y2={i % 6 === 0 ? "32" : "24"}
                  stroke={i % 6 === 0 ? "rgba(6, 182, 212, 0.8)" : "rgba(6, 182, 212, 0.3)"}
                  strokeWidth={i % 6 === 0 ? "2" : "1"}
                  transform={`rotate(${angle} 200 200)`}
                />
              );
            })}
          </svg>

          {/* Ring 2: Segmented Data Arc - Rotating counter-clockwise */}
          <svg className="absolute inset-6 sm:inset-8 w-auto h-auto animate-jarvis-spin-reverse-medium pointer-events-none" viewBox="0 0 350 350">
            <circle cx="175" cy="175" r="145" fill="none" stroke="rgba(99, 102, 241, 0.5)" strokeWidth="2" strokeDasharray="30 20 60 40 100 50" />
            <circle cx="175" cy="175" r="130" fill="none" stroke="rgba(6, 182, 212, 0.3)" strokeWidth="1" strokeDasharray="6 6" />
            
            {/* Hexagon nodes */}
            {[0, 60, 120, 180, 240, 300].map((deg) => (
              <circle
                key={deg}
                cx="175"
                cy="30"
                r="3"
                fill="rgba(6, 182, 212, 0.9)"
                transform={`rotate(${deg} 175 175)`}
              />
            ))}
          </svg>

          {/* Ring 3: Middle Precision Reticle - Rotating clockwise medium */}
          <svg className="absolute inset-12 sm:inset-16 w-auto h-auto animate-jarvis-spin-medium pointer-events-none" viewBox="0 0 300 300">
            <circle cx="150" cy="150" r="105" fill="none" stroke="rgba(6, 182, 212, 0.7)" strokeWidth="1.5" strokeDasharray="12 12" />
            <circle cx="150" cy="150" r="95" fill="none" stroke="rgba(56, 189, 248, 0.4)" strokeWidth="1" />
            
            {/* Crosshair cardinal notches */}
            <line x1="150" y1="40" x2="150" y2="60" stroke="#38bdf8" strokeWidth="2" />
            <line x1="150" y1="240" x2="150" y2="260" stroke="#38bdf8" strokeWidth="2" />
            <line x1="40" y1="150" x2="60" y2="150" stroke="#38bdf8" strokeWidth="2" />
            <line x1="240" y1="150" x2="260" y2="150" stroke="#38bdf8" strokeWidth="2" />
          </svg>

          {/* Ring 4: Rotating Radar Sweep Beam */}
          <div className="absolute inset-16 sm:inset-20 rounded-full overflow-hidden pointer-events-none">
            <div
              className="w-full h-full animate-jarvis-radar"
              style={{
                background: 'conic-gradient(from 0deg, rgba(6, 182, 212, 0.35) 0deg, rgba(6, 182, 212, 0) 65deg, transparent 360deg)',
              }}
            />
          </div>

          {/* Center Arc Reactor Core (Pulsing Energy Hub) */}
          <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-cyan-950/90 border-2 border-cyan-400 flex flex-col items-center justify-center shadow-[0_0_50px_rgba(6,182,212,0.6)] animate-jarvis-pulse z-10">
            <div className="absolute inset-1 rounded-full border border-cyan-300/40" />
            <div className="absolute inset-3 rounded-full border border-indigo-400/50" />
            
            {/* Central Holographic Icon / Custom Photo Logo */}
            {customLogo?.src && !logoImgError ? (
              <div className="w-12 h-12 rounded-xl bg-cyan-950/80 border border-cyan-300 overflow-hidden flex items-center justify-center mb-1 shadow-[0_0_20px_rgba(6,182,212,0.8)]">
                <img
                  src={customLogo.src}
                  alt="OneStop Hub Engineering"
                  onError={() => setLogoImgError(true)}
                  className={`w-full h-full ${
                    customLogo.fit === 'contain' ? 'object-contain p-1' : 'object-cover'
                  }`}
                />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-300 flex items-center justify-center text-cyan-200 mb-1 shadow-[0_0_20px_rgba(6,182,212,0.8)]">
                <Zap className="w-6 h-6 text-cyan-300 animate-pulse" />
              </div>
            )}

            {/* Percentage Display */}
            <div className="text-xl sm:text-2xl font-black tracking-tight text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.8)]">
              {progress}%
            </div>

            <div className="text-[9px] tracking-widest text-cyan-300 uppercase font-semibold">
              CALIBRATED
            </div>
          </div>
        </div>

        {/* Diagnostic Status Box below Reactor */}
        <div className="mt-6 sm:mt-8 w-full max-w-xl text-center space-y-3 z-20 px-4">
          {/* Main Title of Current Boot Phase */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded border border-cyan-500/40 bg-cyan-950/60 shadow-[0_0_20px_rgba(6,182,212,0.25)] text-xs sm:text-sm font-bold tracking-wider text-cyan-200">
            <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span>{steps[currentStep].title}</span>
          </div>

          {/* Sub detail & code */}
          <div className="space-y-1">
            <p className="text-xs sm:text-sm text-neutral-300 font-medium">
              {steps[currentStep].detail}
            </p>
            <p className="text-[11px] text-neutral-500 font-mono">
              STATUS_CODE: <span className="text-cyan-400">{steps[currentStep].code}</span> · MEM: ALLOCATED · DRIVE D: OK
            </p>
          </div>

          {/* Cyber Progress Bar with Glowing Head */}
          <div className="relative w-full h-2.5 bg-neutral-900 rounded-full border border-neutral-800 overflow-hidden shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-indigo-600 via-cyan-500 to-emerald-400 transition-all duration-100 ease-out rounded-full shadow-[0_0_15px_rgba(6,182,212,0.8)]"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Interactive Steps Checklist Indicator */}
          <div className="grid grid-cols-4 gap-2 pt-2 text-[10px]">
            {steps.map((st, i) => {
              const isDone = currentStep > i || progress >= 100;
              const isCurrent = currentStep === i && progress < 100;
              return (
                <div
                  key={i}
                  className={`p-1.5 rounded border transition-colors ${
                    isDone
                      ? 'border-emerald-500/50 bg-emerald-950/30 text-emerald-300'
                      : isCurrent
                      ? 'border-cyan-400/80 bg-cyan-950/60 text-cyan-200 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                      : 'border-neutral-800 bg-neutral-900/50 text-neutral-600'
                  }`}
                >
                  <div className="font-bold truncate">STEP 0{i + 1}</div>
                  <div className="text-[9px] truncate opacity-80">{isDone ? 'COMPLETE' : isCurrent ? 'RUNNING' : 'QUEUED'}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Footer Telemetry Strip & Fast Action Button */}
      <div className="absolute bottom-4 inset-x-4 sm:bottom-6 sm:inset-x-8 z-20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs border-t border-cyan-950/80 pt-3">
        {/* Dynamic Voice Telemetry Equalizer Bars */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-neutral-500 mr-1.5">VOICE_FREQ:</span>
          <div className="flex items-end gap-1 h-5">
            {audioBars.map((height, idx) => (
              <div
                key={idx}
                className="w-1 bg-cyan-400/80 rounded-t transition-all duration-100"
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
        </div>

        {/* Enter Dashboard Action Button */}
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-neutral-500 hidden md:inline">
            Tekan <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-neutral-300 font-mono text-[10px]">ESC</kbd> atau <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-neutral-300 font-mono text-[10px]">ENTER</kbd>
          </span>

          <button
            type="button"
            onClick={handleFinish}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold tracking-wide shadow-[0_0_25px_rgba(6,182,212,0.5)] active:scale-98 transition-all flex items-center gap-2 cursor-pointer"
          >
            <span>MASUK KE DASBOR</span>
            <FastForward className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
