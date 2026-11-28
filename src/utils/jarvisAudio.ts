/**
 * Web Audio API synthesizer for J.A.R.V.I.S. sci-fi sound effects.
 * Uses pure native browser oscillators, filters, and envelope gains.
 * No external audio files or dependencies needed.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch {
    return null;
  }
}

/**
 * Ascending holographic power-up swell (Arc Reactor Ignition)
 */
export function playJarvisBootSound(enabled: boolean = true) {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    // 1. Sub bass hum
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(60, now);
    subOsc.frequency.exponentialRampToValueAtTime(140, now + 1.2);
    subGain.gain.setValueAtTime(0.01, now);
    subGain.gain.linearRampToValueAtTime(0.18, now + 0.4);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);

    subOsc.connect(subGain);
    subGain.connect(ctx.destination);
    subOsc.start(now);
    subOsc.stop(now + 1.4);

    // 2. High-tech ascending frequency chirp
    const chirpOsc = ctx.createOscillator();
    const chirpGain = ctx.createGain();
    chirpOsc.type = 'triangle';
    chirpOsc.frequency.setValueAtTime(280, now + 0.1);
    chirpOsc.frequency.exponentialRampToValueAtTime(960, now + 0.8);
    chirpOsc.frequency.exponentialRampToValueAtTime(1440, now + 1.2);

    chirpGain.gain.setValueAtTime(0.001, now);
    chirpGain.gain.linearRampToValueAtTime(0.12, now + 0.3);
    chirpGain.gain.exponentialRampToValueAtTime(0.001, now + 1.3);

    chirpOsc.connect(chirpGain);
    chirpGain.connect(ctx.destination);
    chirpOsc.start(now + 0.1);
    chirpOsc.stop(now + 1.3);

    // 3. Shimmer harmonic
    const shimmerOsc = ctx.createOscillator();
    const shimmerGain = ctx.createGain();
    shimmerOsc.type = 'sine';
    shimmerOsc.frequency.setValueAtTime(1760, now + 0.6);
    shimmerOsc.frequency.setValueAtTime(2640, now + 0.8);
    shimmerGain.gain.setValueAtTime(0.001, now + 0.6);
    shimmerGain.gain.linearRampToValueAtTime(0.06, now + 0.7);
    shimmerGain.gain.exponentialRampToValueAtTime(0.001, now + 1.1);

    shimmerOsc.connect(shimmerGain);
    shimmerGain.connect(ctx.destination);
    shimmerOsc.start(now + 0.6);
    shimmerOsc.stop(now + 1.1);
  } catch {
    // Graceful fallback if user hasn't interacted or audio is blocked
  }
}

/**
 * Quick telemetry diagnostic beep / pulse
 */
export function playJarvisBeep(freq: number = 880, enabled: boolean = true) {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.09);
  } catch {
    // Silently ignore
  }
}

/**
 * Systems lock confirmation chord (Iron Man engagement lock)
 */
export function playJarvisLockSound(enabled: boolean = true) {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const chordFrequencies = [523.25, 659.25, 783.99, 1046.5]; // C Major chord

    chordFrequencies.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.04);

      gain.gain.setValueAtTime(0.001, now + idx * 0.04);
      gain.gain.linearRampToValueAtTime(0.08, now + idx * 0.04 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.04);
      osc.stop(now + idx * 0.04 + 0.36);
    });
  } catch {
    // Silently ignore
  }
}

let lastOrbitHoverAt = 0;
let lastOrbitDeployAt = 0;

/**
 * Subtle futuristic HUD target-lock shimmer when cursor detects an icon in Orbit Hub
 */
export function playJarvisOrbitHoverSound(enabled: boolean = true, slotIndex: number = 0) {
  if (!enabled) return;

  const nowMs = typeof performance !== 'undefined' ? performance.now() : Date.now();
  if (nowMs - lastOrbitHoverAt < 60) return;

  const ctx = getAudioContext();
  if (!ctx || ctx.state !== 'running') return;
  lastOrbitHoverAt = nowMs;

  try {
    const now = ctx.currentTime;
    const baseFreq = 1040 + (Math.abs(slotIndex) % 6) * 70;

    // 1. Soft bandpass-shaped holographic ping
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1650, now);
    filter.Q.setValueAtTime(1.8, now);
    filter.connect(ctx.destination);

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.42, now + 0.055);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.028, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);

    osc.connect(gain);
    gain.connect(filter);
    osc.start(now);
    osc.stop(now + 0.095);

    // 2. Crisp micro telemetry harmonic
    const tickOsc = ctx.createOscillator();
    const tickGain = ctx.createGain();
    tickOsc.type = 'triangle';
    tickOsc.frequency.setValueAtTime(2180 + (Math.abs(slotIndex) % 4) * 95, now + 0.012);

    tickGain.gain.setValueAtTime(0.0001, now + 0.012);
    tickGain.gain.linearRampToValueAtTime(0.011, now + 0.018);
    tickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.068);

    tickOsc.connect(tickGain);
    tickGain.connect(filter);
    tickOsc.start(now + 0.012);
    tickOsc.stop(now + 0.072);
  } catch {
    // Silently ignore audio errors
  }
}

/**
 * Subtle radial holographic deployment pulse when Orbit Hub icons spread outward
 */
export function playJarvisOrbitDeploySound(enabled: boolean = true) {
  if (!enabled) return;

  const nowMs = typeof performance !== 'undefined' ? performance.now() : Date.now();
  if (nowMs - lastOrbitDeployAt < 280) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  const triggerDeploySynth = (activeCtx: AudioContext) => {
    const fireMs = typeof performance !== 'undefined' ? performance.now() : Date.now();
    lastOrbitDeployAt = fireMs;
    try {
      const now = activeCtx.currentTime;

      const filter = activeCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2400, now);
      filter.connect(activeCtx.destination);

      // Soft rising sweep
      const sweepOsc = activeCtx.createOscillator();
      const sweepGain = activeCtx.createGain();
      sweepOsc.type = 'sine';
      sweepOsc.frequency.setValueAtTime(340, now);
      sweepOsc.frequency.exponentialRampToValueAtTime(780, now + 0.22);

      sweepGain.gain.setValueAtTime(0.0001, now);
      sweepGain.gain.linearRampToValueAtTime(0.032, now + 0.035);
      sweepGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);

      sweepOsc.connect(sweepGain);
      sweepGain.connect(filter);
      sweepOsc.start(now);
      sweepOsc.stop(now + 0.26);

      // Subtle crystalline accent
      const shimmerOsc = activeCtx.createOscillator();
      const shimmerGain = activeCtx.createGain();
      shimmerOsc.type = 'sine';
      shimmerOsc.frequency.setValueAtTime(1320, now + 0.04);
      shimmerOsc.frequency.exponentialRampToValueAtTime(1760, now + 0.2);

      shimmerGain.gain.setValueAtTime(0.0001, now + 0.04);
      shimmerGain.gain.linearRampToValueAtTime(0.015, now + 0.075);
      shimmerGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

      shimmerOsc.connect(shimmerGain);
      shimmerGain.connect(filter);
      shimmerOsc.start(now + 0.04);
      shimmerOsc.stop(now + 0.23);
    } catch {
      // Silently ignore audio errors
    }
  };

  if (ctx.state === 'running') {
    triggerDeploySynth(ctx);
  } else if (ctx.state === 'suspended') {
    const requestedAt = typeof performance !== 'undefined' ? performance.now() : Date.now();
    ctx
      .resume()
      .then(() => {
        const resolvedAt = typeof performance !== 'undefined' ? performance.now() : Date.now();
        if (ctx.state === 'running' && resolvedAt - requestedAt < 100) {
          triggerDeploySynth(ctx);
        }
      })
      .catch(() => {});
  }
}

/**
 * Optional Jarvis vocal greeting using browser SpeechSynthesis
 */
export function speakJarvisGreeting(enabled: boolean = true) {
  if (!enabled) return;
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  try {
    window.speechSynthesis.cancel(); // Stop any pending speech

    const utterance = new SpeechSynthesisUtterance('Jarvis online. Welcome to OneStop Hub Engineering.');
    utterance.rate = 1.05;
    utterance.pitch = 0.95;
    utterance.volume = 0.7;

    // Try to pick an English voice with British/sleek cadence if available
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(
      (v) => v.lang.includes('en-GB') || v.name.includes('Daniel') || v.name.includes('Oliver') || v.name.includes('Male') || v.lang.includes('en')
    );
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    window.speechSynthesis.speak(utterance);
  } catch {
    // Speech synthesis blocked or unsupported
  }
}
