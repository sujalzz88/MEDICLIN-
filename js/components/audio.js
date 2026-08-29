/* ==========================================================================
   MEDICLIN CLINICAL AUDIO SYSTEM (AUDIO.JS)
   Web Audio API Synthesizer: STAT Emergency Siren, Urgent Tones & Chimes
   ========================================================================== */

class ClinicalAudioEngine {
  constructor() {
    this.ctx = null;
    let muted = false;
    try {
      if (typeof localStorage !== 'undefined') {
        muted = localStorage.getItem('mediclin_audio_muted') === 'true';
      }
    } catch (e) {}
    this.isMuted = muted;
  }

  getAudioContext() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('mediclin_audio_muted', this.isMuted);
      }
    } catch (e) {}
    return this.isMuted;
  }

  // 1. STAT Emergency Hospital & Ambulance Siren
  playEmergencySiren() {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      
      // Main oscillating tone generator (European / Resuscitation Hi-Lo siren)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';

      // Modulate frequency between 920Hz and 660Hz
      osc.frequency.setValueAtTime(920, now);
      osc.frequency.setValueAtTime(920, now + 0.25);
      osc.frequency.setValueAtTime(660, now + 0.26);
      osc.frequency.setValueAtTime(660, now + 0.50);
      osc.frequency.setValueAtTime(920, now + 0.51);
      osc.frequency.setValueAtTime(920, now + 0.75);
      osc.frequency.setValueAtTime(660, now + 0.76);
      osc.frequency.setValueAtTime(660, now + 1.05);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.05);
      gain.gain.setValueAtTime(0.18, now + 0.95);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.15);

      // Lowpass filter for smooth hospital acoustic
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, now);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 1.2);
    } catch (e) {
      console.warn("Audio feedback error:", e);
    }
  }

  // 2. Urgent Fast-Track Caution Beep
  playUrgentBeep() {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      [0, 0.14, 0.28].forEach((timeOffset, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(740 + idx * 40, now + timeOffset);

        gain.gain.setValueAtTime(0.01, now + timeOffset);
        gain.gain.linearRampToValueAtTime(0.14, now + timeOffset + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + timeOffset + 0.1);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + timeOffset);
        osc.stop(now + timeOffset + 0.11);
      });
    } catch (e) {}
  }

  // 3. Routine / Evaluation Confirmation Chime
  playChime() {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5 - E5 - G5 - C6
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);

        gain.gain.setValueAtTime(0.001, now + idx * 0.07);
        gain.gain.linearRampToValueAtTime(0.12, now + idx * 0.07 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.07 + 0.45);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.5);
      });
    } catch (e) {}
  }

  // 4. Subtle Tactile Mechanical Click
  playClick() {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.03);

      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.035);
    } catch (e) {}
  }
}

export const clinicalAudio = new ClinicalAudioEngine();
