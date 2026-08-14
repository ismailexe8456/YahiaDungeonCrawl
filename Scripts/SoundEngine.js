// SoundEngine.js - Procedural Web Audio API Sound Effects Engine
const SoundEngine = {
    audioCtx: null,
    muted: false,

    init: function() {
        if (!this.audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.audioCtx = new AudioContext();
            }
        }
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
    },

    ambientOscs: [],
    ambientGain: null,
    isAmbientPlaying: false,

    startAmbientMusic: function() {
        if (this.isAmbientPlaying || this.muted) return;
        this.init();
        if (!this.audioCtx) return;

        try {
            this.ambientGain = this.audioCtx.createGain();
            this.ambientGain.gain.setValueAtTime(0.001, this.audioCtx.currentTime);
            // Soft atmospheric non-loud volume (0.10 gain)
            this.ambientGain.gain.exponentialRampToValueAtTime(0.10, this.audioCtx.currentTime + 3.0);

            // Dark fantasy D minor ambient pad drones (D2, A2, F3, D3)
            const freqs = [73.42, 110.00, 174.61, 293.66];
            this.ambientOscs = freqs.map((freq, idx) => {
                const osc = this.audioCtx.createOscillator();
                const filter = this.audioCtx.createBiquadFilter();
                
                osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
                osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);

                // Low-pass filter for soft warm ambient sound
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(320 + (idx * 60), this.audioCtx.currentTime);

                osc.connect(filter);
                filter.connect(this.ambientGain);
                osc.start();
                return osc;
            });

            this.ambientGain.connect(this.audioCtx.destination);
            this.isAmbientPlaying = true;
        } catch (e) {
            console.error("Ambient music error:", e);
        }
    },

    stopAmbientMusic: function() {
        if (this.ambientGain && this.audioCtx) {
            try {
                this.ambientGain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + 1.0);
                setTimeout(() => {
                    this.ambientOscs.forEach(osc => { try { osc.stop(); } catch(e){} });
                    this.ambientOscs = [];
                    this.isAmbientPlaying = false;
                }, 1050);
            } catch(e) {
                this.ambientOscs = [];
                this.isAmbientPlaying = false;
            }
        }
    },

    toggleMute: function() {
        this.muted = !this.muted;
        if (this.muted) {
            this.stopAmbientMusic();
        } else {
            this.startAmbientMusic();
        }
        return this.muted;
    },

    playTone: function(freq, type, duration, startVol = 0.3, endVol = 0.001) {
        if (this.muted) return;
        this.init();
        if (!this.audioCtx) return;

        try {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);

            gain.gain.setValueAtTime(startVol, this.audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(endVol, this.audioCtx.currentTime + duration);

            osc.connect(gain);
            gain.connect(this.audioCtx.destination);

            osc.start();
            osc.stop(this.audioCtx.currentTime + duration);
        } catch (e) {
            console.error("Audio error:", e);
        }
    },

    // Soft Smooth Synth Pop / Marimba Blip for Dialogue (Zero typewriter clicks)
    playSoftDialogueBlip: function() {
        if (this.muted) return;
        this.init();
        if (!this.audioCtx) return;

        try {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();

            // Ultra-soft sine wave tone (warm synth pop)
            osc.type = 'sine';
            const freq = 420 + Math.random() * 80;
            osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);

            gain.gain.setValueAtTime(0.06, this.audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0005, this.audioCtx.currentTime + 0.035);

            osc.connect(gain);
            gain.connect(this.audioCtx.destination);

            osc.start();
            osc.stop(this.audioCtx.currentTime + 0.035);
        } catch (e) {}
    },

    // Blade / Slash Sound
    playSlash: function() {
        if (this.muted) return;
        this.init();
        if (!this.audioCtx) return;

        try {
            const bufferSize = this.audioCtx.sampleRate * 0.15;
            const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }

            const noise = this.audioCtx.createBufferSource();
            noise.buffer = buffer;

            const filter = this.audioCtx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(1200, this.audioCtx.currentTime);
            filter.frequency.exponentialRampToValueAtTime(300, this.audioCtx.currentTime + 0.15);
            filter.Q.value = 3;

            const gain = this.audioCtx.createGain();
            gain.gain.setValueAtTime(0.4, this.audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.15);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.audioCtx.destination);

            noise.start();
        } catch (e) {}
    },

    // Critical Heavy Hit
    playHeavyHit: function() {
        if (this.muted) return;
        this.init();
        if (!this.audioCtx) return;

        try {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, this.audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(40, this.audioCtx.currentTime + 0.3);

            gain.gain.setValueAtTime(0.6, this.audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.3);

            osc.connect(gain);
            gain.connect(this.audioCtx.destination);

            osc.start();
            osc.stop(this.audioCtx.currentTime + 0.3);

            this.playSlash();
        } catch (e) {}
    },

    // Magic Fireball / Spell Explosion
    playFireball: function() {
        if (this.muted) return;
        this.init();
        if (!this.audioCtx) return;

        try {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, this.audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(100, this.audioCtx.currentTime + 0.35);

            gain.gain.setValueAtTime(0.5, this.audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.35);

            osc.connect(gain);
            gain.connect(this.audioCtx.destination);

            osc.start();
            osc.stop(this.audioCtx.currentTime + 0.35);
        } catch (e) {}
    },

    // Healing Magical Chime
    playHeal: function() {
        if (this.muted) return;
        this.init();
        if (!this.audioCtx) return;

        const notes = [440, 554.37, 659.25, 880];
        notes.forEach((freq, index) => {
            setTimeout(() => {
                this.playTone(freq, 'sine', 0.25, 0.25, 0.001);
            }, index * 60);
        });
    },

    // Shield / Buff Sound
    playShield: function() {
        if (this.muted) return;
        this.init();
        if (!this.audioCtx) return;

        const notes = [300, 450, 600];
        notes.forEach((freq, index) => {
            setTimeout(() => {
                this.playTone(freq, 'triangle', 0.3, 0.2, 0.001);
            }, index * 70);
        });
    },

    // Victory Fanfare
    playVictory: function() {
        if (this.muted) return;
        const melody = [
            { f: 523.25, d: 0.15 },
            { f: 659.25, d: 0.15 },
            { f: 783.99, d: 0.15 },
            { f: 1046.50, d: 0.4 }
        ];
        melody.forEach((note, index) => {
            setTimeout(() => {
                this.playTone(note.f, 'triangle', note.d, 0.4, 0.01);
            }, index * 140);
        });
    },

    // Defeat Sound
    playDefeat: function() {
        if (this.muted) return;
        const notes = [400, 350, 300, 220];
        notes.forEach((freq, index) => {
            setTimeout(() => {
                this.playTone(freq, 'sawtooth', 0.4, 0.3, 0.01);
            }, index * 200);
        });
    },

    // UI Click Sound
    playClick: function() {
        this.playTone(800, 'sine', 0.05, 0.15, 0.001);
    },

    // UI Hover Sound
    playHover: function() {
        this.playTone(400, 'sine', 0.03, 0.05, 0.001);
    },

    // Level Up Sound
    playLevelUp: function() {
        const arpeggio = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99];
        arpeggio.forEach((freq, index) => {
            setTimeout(() => {
                this.playTone(freq, 'triangle', 0.2, 0.3, 0.001);
            }, index * 80);
        });
    },

    // Insufficient Funds / Error Buzzer Sound
    playError: function() {
        if (this.muted) return;
        this.playTone(140, 'sawtooth', 0.2, 0.4, 0.01);
        setTimeout(() => this.playTone(100, 'sawtooth', 0.25, 0.4, 0.01), 80);
    }
};
