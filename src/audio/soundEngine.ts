/**
 * Kirby Web Audio 8-Bit Chiptune Synthesizer
 * Provides authentic NES-era sound effects & background music
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private sfxGain: GainNode | null = null;
  private bgmGain: GainNode | null = null;
  private masterGain: GainNode | null = null;

  public sfxMuted: boolean = false;
  public bgmMuted: boolean = false;

  private isBgmPlaying: boolean = false;
  private bgmTimeoutId: number | null = null;
  private currentNoteIndex: number = 0;

  // Inhale loop sound tracking
  private inhaleOsc: OscillatorNode | null = null;
  private inhaleGain: GainNode | null = null;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.8;
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.7;
      this.sfxGain.connect(this.masterGain);

      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.value = 0.35;
      this.bgmGain.connect(this.masterGain);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public enableAudio() {
    this.initContext();
    if (!this.bgmMuted && !this.isBgmPlaying) {
      this.startBgm();
    }
  }

  public setSfxMuted(muted: boolean) {
    this.sfxMuted = muted;
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(muted ? 0 : 0.7, this.ctx.currentTime);
    }
  }

  public setBgmMuted(muted: boolean) {
    this.bgmMuted = muted;
    if (this.bgmGain && this.ctx) {
      this.bgmGain.gain.setValueAtTime(muted ? 0 : 0.35, this.ctx.currentTime);
    }
    if (muted) {
      this.stopBgm();
    } else {
      this.startBgm();
    }
  }

  // --- SOUND EFFECTS ---
  public play(
    type:
      | 'jump'
      | 'float'
      | 'air_puff'
      | 'spit'
      | 'swallow'
      | 'copy'
      | 'fire'
      | 'spark'
      | 'sword'
      | 'slide'
      | 'hit'
      | 'block_break'
      | 'collect'
      | 'tomato'
      | 'drop_star'
      | 'victory'
      | 'game_over'
  ) {
    if (this.sfxMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const ctx = this.ctx;
    const now = ctx.currentTime;

    switch (type) {
      case 'jump': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(360, now + 0.12);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.12);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.12);
        break;
      }

      case 'float': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(280, now);
        osc.frequency.exponentialRampToValueAtTime(460, now + 0.08);
        gain.gain.setValueAtTime(0.28, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.08);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.08);
        break;
      }

      case 'air_puff': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(420, now);
        osc.frequency.exponentialRampToValueAtTime(160, now + 0.1);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.1);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.1);
        break;
      }

      case 'spit': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(560, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.18);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.18);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.18);
        break;
      }

      case 'swallow': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.15);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.15);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.15);
        break;
      }

      case 'copy': {
        const notes = [261.6, 329.6, 392.0, 523.3, 659.3];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(freq, now + idx * 0.05);
          gain.gain.setValueAtTime(0.2, now + idx * 0.05);
          gain.gain.linearRampToValueAtTime(0, now + idx * 0.05 + 0.12);
          osc.connect(gain);
          gain.connect(this.sfxGain!);
          osc.start(now + idx * 0.05);
          osc.stop(now + idx * 0.05 + 0.12);
        });
        break;
      }

      case 'fire': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180 + Math.random() * 80, now);
        osc.frequency.linearRampToValueAtTime(80, now + 0.08);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.08);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.08);
        break;
      }

      case 'spark': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(600 + Math.random() * 400, now);
        osc.frequency.setValueAtTime(200, now + 0.04);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.07);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.07);
        break;
      }

      case 'sword': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(620, now);
        osc.frequency.exponentialRampToValueAtTime(180, now + 0.12);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.12);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.12);
        break;
      }

      case 'slide': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.linearRampToValueAtTime(90, now + 0.14);
        gain.gain.setValueAtTime(0.22, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.14);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.14);
        break;
      }

      case 'block_break': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(190, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.15);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.15);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.15);
        break;
      }

      case 'hit': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(130, now);
        osc.frequency.linearRampToValueAtTime(45, now + 0.18);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.18);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.18);
        break;
      }

      case 'collect': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(659.3, now); // E5
        osc.frequency.setValueAtTime(783.9, now + 0.06); // G5
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.14);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.14);
        break;
      }

      case 'tomato': {
        const notes = [392.0, 523.3, 659.3, 783.9, 1046.5];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.08);
          gain.gain.setValueAtTime(0.3, now + idx * 0.08);
          gain.gain.linearRampToValueAtTime(0, now + idx * 0.08 + 0.15);
          osc.connect(gain);
          gain.connect(this.sfxGain!);
          osc.start(now + idx * 0.08);
          osc.stop(now + idx * 0.08 + 0.15);
        });
        break;
      }

      case 'drop_star': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.linearRampToValueAtTime(220, now + 0.16);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.16);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.16);
        break;
      }

      case 'victory': {
        const melody = [
          { f: 523.3, d: 0.12 }, // C5
          { f: 523.3, d: 0.12 }, // C5
          { f: 523.3, d: 0.12 }, // C5
          { f: 659.3, d: 0.28 }, // E5
          { f: 587.3, d: 0.12 }, // D5
          { f: 659.3, d: 0.12 }, // E5
          { f: 698.5, d: 0.12 }, // F5
          { f: 783.9, d: 0.4 },  // G5
          { f: 1046.5, d: 0.6 }  // C6
        ];
        let offset = 0;
        melody.forEach(note => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(note.f, now + offset);
          gain.gain.setValueAtTime(0.3, now + offset);
          gain.gain.linearRampToValueAtTime(0, now + offset + note.d);
          osc.connect(gain);
          gain.connect(this.sfxGain!);
          osc.start(now + offset);
          osc.stop(now + offset + note.d);
          offset += note.d * 1.05;
        });
        break;
      }

      case 'game_over': {
        const melody = [
          { f: 392.0, d: 0.2 },
          { f: 349.2, d: 0.2 },
          { f: 329.6, d: 0.2 },
          { f: 261.6, d: 0.5 }
        ];
        let offset = 0;
        melody.forEach(note => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(note.f, now + offset);
          gain.gain.setValueAtTime(0.25, now + offset);
          gain.gain.linearRampToValueAtTime(0, now + offset + note.d);
          osc.connect(gain);
          gain.connect(this.sfxGain!);
          osc.start(now + offset);
          osc.stop(now + offset + note.d);
          offset += note.d;
        });
        break;
      }
    }
  }

  // --- VACUUM INHALE CONTINUOUS SOUND ---
  public startInhaleSound() {
    if (this.sfxMuted || this.inhaleOsc) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const ctx = this.ctx;
    const now = ctx.currentTime;
    this.inhaleOsc = ctx.createOscillator();
    this.inhaleGain = ctx.createGain();

    this.inhaleOsc.type = 'triangle';
    this.inhaleOsc.frequency.setValueAtTime(160, now);
    this.inhaleGain.gain.setValueAtTime(0.01, now);
    this.inhaleGain.gain.linearRampToValueAtTime(0.18, now + 0.1);

    this.inhaleOsc.connect(this.inhaleGain);
    this.inhaleGain.connect(this.sfxGain);
    this.inhaleOsc.start(now);
  }

  public stopInhaleSound() {
    if (!this.inhaleOsc || !this.ctx || !this.inhaleGain) return;
    const now = this.ctx.currentTime;
    this.inhaleGain.gain.linearRampToValueAtTime(0.01, now + 0.05);
    try {
      this.inhaleOsc.stop(now + 0.06);
    } catch {
      // ignore
    }
    this.inhaleOsc = null;
    this.inhaleGain = null;
  }

  // --- 8-BIT CHIPTUNE BGM (Green Greens Style Melody) ---
  private bgmNotes = [
    // Measure 1
    { pitch: 523.3, dur: 0.15, bass: 130.8 }, // C5, C3
    { pitch: 587.3, dur: 0.15, bass: 130.8 }, // D5
    { pitch: 659.3, dur: 0.30, bass: 164.8 }, // E5, E3
    { pitch: 523.3, dur: 0.15, bass: 130.8 }, // C5
    { pitch: 659.3, dur: 0.15, bass: 164.8 }, // E5
    { pitch: 783.9, dur: 0.45, bass: 196.0 }, // G5, G3
    { pitch: 659.3, dur: 0.15, bass: 164.8 }, // E5
    // Measure 2
    { pitch: 880.0, dur: 0.25, bass: 220.0 }, // A5, A3
    { pitch: 783.9, dur: 0.20, bass: 196.0 }, // G5, G3
    { pitch: 698.5, dur: 0.25, bass: 174.6 }, // F5, F3
    { pitch: 659.3, dur: 0.25, bass: 164.8 }, // E5, E3
    { pitch: 587.3, dur: 0.35, bass: 146.8 }, // D5, D3
    { pitch: 0,     dur: 0.10, bass: 0 },
    // Measure 3
    { pitch: 587.3, dur: 0.15, bass: 146.8 }, // D5
    { pitch: 659.3, dur: 0.15, bass: 164.8 }, // E5
    { pitch: 698.5, dur: 0.30, bass: 174.6 }, // F5
    { pitch: 587.3, dur: 0.15, bass: 146.8 }, // D5
    { pitch: 698.5, dur: 0.15, bass: 174.6 }, // F5
    { pitch: 880.0, dur: 0.45, bass: 220.0 }, // A5
    { pitch: 783.9, dur: 0.15, bass: 196.0 }, // G5
    // Measure 4
    { pitch: 783.9, dur: 0.25, bass: 196.0 }, // G5
    { pitch: 698.5, dur: 0.20, bass: 174.6 }, // F5
    { pitch: 659.3, dur: 0.25, bass: 164.8 }, // E5
    { pitch: 587.3, dur: 0.25, bass: 146.8 }, // D5
    { pitch: 523.3, dur: 0.45, bass: 130.8 }, // C5
    { pitch: 0,     dur: 0.15, bass: 0 }
  ];

  public startBgm() {
    if (this.bgmMuted || this.isBgmPlaying) return;
    this.initContext();
    this.isBgmPlaying = true;
    this.currentNoteIndex = 0;
    this.playNextBgmNote();
  }

  public stopBgm() {
    this.isBgmPlaying = false;
    if (this.bgmTimeoutId !== null) {
      window.clearTimeout(this.bgmTimeoutId);
      this.bgmTimeoutId = null;
    }
  }

  private playNextBgmNote() {
    if (!this.isBgmPlaying || this.bgmMuted || !this.ctx || !this.bgmGain) return;

    const note = this.bgmNotes[this.currentNoteIndex];
    const now = this.ctx.currentTime;
    const dur = note.dur;

    if (note.pitch > 0) {
      // Lead square wave melody
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(note.pitch, now);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + dur * 0.9);
      osc.connect(gain);
      gain.connect(this.bgmGain);
      osc.start(now);
      osc.stop(now + dur * 0.92);

      // Bass triangle wave
      if (note.bass > 0) {
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bassOsc.type = 'triangle';
        bassOsc.frequency.setValueAtTime(note.bass, now);
        bassGain.gain.setValueAtTime(0.22, now);
        bassGain.gain.exponentialRampToValueAtTime(0.02, now + dur * 0.85);
        bassOsc.connect(bassGain);
        bassGain.connect(this.bgmGain);
        bassOsc.start(now);
        bassOsc.stop(now + dur * 0.88);
      }
    }

    this.currentNoteIndex = (this.currentNoteIndex + 1) % this.bgmNotes.length;
    this.bgmTimeoutId = window.setTimeout(() => {
      this.playNextBgmNote();
    }, dur * 1000);
  }
}

export const sound = new SoundEngine();
