// SoundEngine.js - Procedural Web Audio API Sound Effects & Hades-Style Voice Synthesizer
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

    toggleMute: function() {
        this.muted = !this.muted;
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

    // Hades-Style Character Voice Blips (Dynamic Vocal Timbre & Pitch Inflexions per Speaker)
    playVoiceBlip: function(speakerName = 'Warrior') {
        if (this.muted) return;
        this.init();
        if (!this.audioCtx) return;

        let baseFreq = 200;
        let waveType = 'triangle';
        let duration = 0.05;

        // Custom pitch & timbre ranges for each speaker
        if (speakerName === 'Warrior' || speakerName === 'Forest Troll' || speakerName === 'Orc Berserker') {
            baseFreq = 120 + Math.random() * 45; // Deep resonant rumble
            waveType = 'sawtooth';
        } else if (speakerName === 'Rogue' || speakerName === 'Goblin Scout') {
            baseFreq = 650 + Math.random() * 150; // Fast squeaky vocal blips
            waveType = 'sine';
        } else if (speakerName === 'Wizard' || speakerName === 'Shadow Goblin Warlord') {
            baseFreq = 380 + Math.random() * 80; // Arcane warble
            waveType = 'sine';
        } else if (speakerName === 'Void Dragon') {
            baseFreq = 75 + Math.random() * 25; // Demonic sub-bass
            waveType = 'sawtooth';
            duration = 0.08;
        } else if (speakerName === 'Paladin') {
            baseFreq = 300 + Math.random() * 60; // Radiant warm vocal tone
            waveType = 'triangle';
        } else if (speakerName === 'Necromancer') {
            baseFreq = 180 + Math.random() * 50; // Spectral gravelly tone
            waveType = 'sawtooth';
        } else {
            baseFreq = 220 + Math.random() * 60;
        }

        try {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();

            osc.type = waveType;
            // Hades dynamic intonation pitch bending
            const endFreq = baseFreq * (Math.random() > 0.5 ? 0.92 : 1.08);
            osc.frequency.setValueAtTime(baseFreq, this.audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(endFreq, this.audioCtx.currentTime + duration);

            gain.gain.setValueAtTime(0.18, this.audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);

            osc.connect(gain);
            gain.connect(this.audioCtx.destination);

            osc.start();
            osc.stop(this.audioCtx.currentTime + duration);
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
    }
};
