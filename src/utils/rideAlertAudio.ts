/**
 * Persistent foreground Ride Dispatch Audio & Vibration Controller.
 *
 * - Uses synthesized Web Audio API dual-tone alert pattern (no external .mp3 dependency or CORS failure).
 * - Automatically unlocks AudioContext on the first user gesture so browser autoplay policies never silence alerts silently.
 * - Continuously repeats while `activeAlertKeys.size > 0` unless muted or snoozed for the current panel.
 * - Immediately stops sound & vibration the instant active pending rides become empty (CONFIRMED / REJECTED / CANCELLED / EXPIRED).
 * - Prevents overlapping duplicate streams via strict single-interval & active-key deduplication.
 */

export type RideAlertPanelRole = 'driver' | 'admin' | 'customer';

interface PanelAudioState {
  muted: boolean;
  snoozedUntilMs: number;
  activeKeys: Set<string>;
  lastPlayedSignature: string;
}

class RideAlertAudioController {
  private ctx: AudioContext | null = null;
  private loopTimer: number | null = null;
  private unlocked = false;
  private listeners = new Set<() => void>();
  private panels: Record<RideAlertPanelRole, PanelAudioState> = {
    driver: { muted: false, snoozedUntilMs: 0, activeKeys: new Set(), lastPlayedSignature: '' },
    admin: { muted: false, snoozedUntilMs: 0, activeKeys: new Set(), lastPlayedSignature: '' },
    customer: { muted: false, snoozedUntilMs: 0, activeKeys: new Set(), lastPlayedSignature: '' }
  };

  private notifyListeners() {
    this.listeners.forEach((cb) => {
      try {
        cb();
      } catch {}
    });
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public attachGestureUnlock(): () => void {
    if (typeof window === 'undefined') return () => {};
    const onGesture = () => {
      this.unlockAudio().catch(() => {});
    };
    window.addEventListener('pointerdown', onGesture, { passive: true });
    window.addEventListener('keydown', onGesture, { passive: true });
    window.addEventListener('touchstart', onGesture, { passive: true });
    return () => {
      window.removeEventListener('pointerdown', onGesture);
      window.removeEventListener('keydown', onGesture);
      window.removeEventListener('touchstart', onGesture);
    };
  }

  public async unlockAudio(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return false;
      if (!this.ctx) {
        this.ctx = new AudioCtx();
      }
      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }
      this.unlocked = this.ctx.state === 'running';
      this.notifyListeners();
      return this.unlocked;
    } catch {
      return false;
    }
  }

  public isUnlocked(): boolean {
    return this.unlocked && this.ctx?.state === 'running';
  }

  public getPanelStatus(role: RideAlertPanelRole, nowMs: number = Date.now()) {
    const panel = this.panels[role];
    const snoozeRemainingSec =
      panel.snoozedUntilMs > nowMs ? Math.ceil((panel.snoozedUntilMs - nowMs) / 1000) : 0;
    return {
      muted: panel.muted,
      snoozed: snoozeRemainingSec > 0,
      snoozeRemainingSec,
      activeCount: panel.activeKeys.size,
      isRinging:
        panel.activeKeys.size > 0 && !panel.muted && snoozeRemainingSec === 0,
      unlocked: this.isUnlocked()
    };
  }

  public setMuted(role: RideAlertPanelRole, muted: boolean) {
    this.panels[role].muted = muted;
    if (muted && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(0);
      } catch {}
    }
    this.evaluateLoop();
    this.notifyListeners();
  }

  public snooze(role: RideAlertPanelRole, durationMs: number = 5 * 60 * 1000) {
    this.panels[role].snoozedUntilMs = Date.now() + durationMs;
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(0);
      } catch {}
    }
    this.evaluateLoop();
    this.notifyListeners();
  }

  public clearSnooze(role: RideAlertPanelRole) {
    this.panels[role].snoozedUntilMs = 0;
    this.evaluateLoop();
    this.notifyListeners();
  }

  private canVibrateSafely(): boolean {
    if (typeof navigator === 'undefined' || !('vibrate' in navigator)) return false;
    const navWithActivation = navigator as Navigator & {
      userActivation?: { hasBeenActive?: boolean };
    };
    if (navWithActivation.userActivation && !navWithActivation.userActivation.hasBeenActive && !this.unlocked) {
      return false;
    }
    return this.unlocked || Boolean(navWithActivation.userActivation?.hasBeenActive);
  }

  /**
   * Synchronizes the exact set of actionable pending ride keys for a panel.
   * When keys become empty (e.g., ride confirmed/rejected/cancelled/expired),
   * persistent sound stops immediately.
   */
  public syncPendingRides(role: RideAlertPanelRole, keys: string[], vibrateOnNew = true) {
    const panel = this.panels[role];
    const nextSet = new Set(keys);
    const sig = [...nextSet].sort().join('|');
    const hasNewEntries = [...nextSet].some((k) => !panel.activeKeys.has(k));

    panel.activeKeys = nextSet;
    const nowMs = Date.now();
    const canPlayNow = nextSet.size > 0 && !panel.muted && panel.snoozedUntilMs <= nowMs;

    if (hasNewEntries && canPlayNow && sig !== panel.lastPlayedSignature) {
      panel.lastPlayedSignature = sig;
      this.playUrgentChime(vibrateOnNew);
    }

    if (nextSet.size === 0) {
      panel.lastPlayedSignature = '';
      if (this.canVibrateSafely()) {
        try {
          navigator.vibrate(0);
        } catch {}
      }
    }

    this.evaluateLoop();
    this.notifyListeners();
  }

  public stopAllForPanel(role: RideAlertPanelRole) {
    this.syncPendingRides(role, [], false);
  }

  public playOneShotConfirmationChime() {
    this.unlockAudio().then((ok) => {
      if (!ok || !this.ctx) return;
      const now = this.ctx.currentTime;
      this.scheduleTone(523.25, now, 0.12, 0.18, 'triangle');
      this.scheduleTone(659.25, now + 0.13, 0.16, 0.2, 'triangle');
      this.scheduleTone(783.99, now + 0.28, 0.22, 0.22, 'triangle');
    });
  }

  public playUrgentChime(withVibration = true) {
    if (withVibration && this.canVibrateSafely()) {
      try {
        navigator.vibrate([240, 120, 240, 120, 320]);
      } catch {}
    }

    this.unlockAudio().then((ok) => {
      if (!ok || !this.ctx) return;
      const now = this.ctx.currentTime;
      // Crisp 3-pulse hyperlocal dispatch bell (non-harsh, unmistakable)
      this.scheduleTone(880, now, 0.14, 0.22, 'sine');
      this.scheduleTone(1174.66, now + 0.16, 0.16, 0.22, 'sine');
      this.scheduleTone(880, now + 0.42, 0.14, 0.22, 'sine');
      this.scheduleTone(1318.51, now + 0.58, 0.22, 0.24, 'sine');
    });
  }

  private scheduleTone(
    freq: number,
    startTime: number,
    durationSec: number,
    peakGain: number,
    type: OscillatorType
  ) {
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.exponentialRampToValueAtTime(peakGain, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + durationSec);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + durationSec + 0.02);
    } catch {}
  }

  private anyPanelShouldRing(nowMs: number = Date.now()): boolean {
    return (['driver', 'admin', 'customer'] as RideAlertPanelRole[]).some((role) => {
      const p = this.panels[role];
      return p.activeKeys.size > 0 && !p.muted && p.snoozedUntilMs <= nowMs;
    });
  }

  private evaluateLoop() {
    if (typeof window === 'undefined') return;
    const shouldRing = this.anyPanelShouldRing();

    if (shouldRing && this.loopTimer === null) {
      this.loopTimer = window.setInterval(() => {
        const nowMs = Date.now();
        if (!this.anyPanelShouldRing(nowMs)) {
          this.stopLoop();
          this.notifyListeners();
          return;
        }
        const shouldVibrate = this.panels.driver.activeKeys.size > 0 && !this.panels.driver.muted && this.panels.driver.snoozedUntilMs <= nowMs;
        this.playUrgentChime(shouldVibrate);
      }, 4200);
    } else if (!shouldRing && this.loopTimer !== null) {
      this.stopLoop();
    }
  }

  private stopLoop() {
    if (this.loopTimer !== null && typeof window !== 'undefined') {
      window.clearInterval(this.loopTimer);
      this.loopTimer = null;
    }
  }
}

export const rideAlertAudio = new RideAlertAudioController();
