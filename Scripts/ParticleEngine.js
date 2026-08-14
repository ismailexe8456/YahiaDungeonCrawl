// ParticleEngine.js - Canvas visual FX, ambient particles, & spell animations
const ParticleEngine = {
    canvas: null,
    ctx: null,
    particles: [],
    combatFX: [],
    shakeIntensity: 0,
    shakeDecay: 0.9,
    animFrame: null,

    init: function(canvasId = 'fx-canvas') {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Spawn initial background ambient embers
        for (let i = 0; i < 40; i++) {
            this.particles.push(this.createAmbientParticle());
        }

        this.loop();
    },

    resize: function() {
        if (!this.canvas) return;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    },

    createAmbientParticle: function() {
        return {
            x: Math.random() * (this.canvas ? this.canvas.width : 1000),
            y: Math.random() * (this.canvas ? this.canvas.height : 800),
            size: Math.random() * 2.5 + 0.5,
            speedY: - (Math.random() * 0.6 + 0.2),
            speedX: (Math.random() - 0.5) * 0.4,
            alpha: Math.random() * 0.6 + 0.2,
            color: Math.random() > 0.4 ? '#ff9900' : '#ff4400'
        };
    },

    triggerShake: function(intensity = 15) {
        this.shakeIntensity = intensity;
        const mainContainer = document.querySelector('.game-container') || document.body;
        mainContainer.classList.add('shake-active');
        setTimeout(() => mainContainer.classList.remove('shake-active'), 400);
    },

    spawnSlashFX: function(targetEl, color = '#ff3366') {
        if (!targetEl) return;
        const rect = targetEl.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        for (let i = 0; i < 25; i++) {
            const angle = (Math.random() * 60 - 30) * (Math.PI / 180);
            const speed = Math.random() * 12 + 4;
            this.combatFX.push({
                x: centerX,
                y: centerY,
                vx: Math.cos(angle) * speed * (Math.random() > 0.5 ? 1 : -1),
                vy: Math.sin(angle) * speed,
                size: Math.random() * 4 + 2,
                color: color,
                life: 1.0,
                decay: Math.random() * 0.05 + 0.03
            });
        }
    },

    spawnSpellFX: function(targetEl, type = 'fireball') {
        if (!targetEl) return;
        const rect = targetEl.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        let color = '#ff5500';
        if (type === 'ice') color = '#00e5ff';
        if (type === 'heal') color = '#00ffaa';
        if (type === 'holy') color = '#ffea00';
        if (type === 'dark') color = '#aa00ff';

        for (let i = 0; i < 35; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 8 + 2;
            this.combatFX.push({
                x: centerX,
                y: centerY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: Math.random() * 5 + 2,
                color: color,
                life: 1.0,
                decay: Math.random() * 0.04 + 0.02
            });
        }
    },

    loop: function() {
        if (!this.ctx || !this.canvas) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Render Ambient Embers
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            p.y += p.speedY;
            p.x += p.speedX;
            if (p.y < 0) {
                p.y = this.canvas.height;
                p.x = Math.random() * this.canvas.width;
            }
            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = p.alpha;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
        }

        // Render Combat Explosions / FX
        for (let i = this.combatFX.length - 1; i >= 0; i--) {
            const fx = this.combatFX[i];
            fx.x += fx.vx;
            fx.y += fx.vy;
            fx.life -= fx.decay;

            if (fx.life <= 0) {
                this.combatFX.splice(i, 1);
                continue;
            }

            this.ctx.fillStyle = fx.color;
            this.ctx.globalAlpha = fx.life;
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = fx.color;
            this.ctx.beginPath();
            this.ctx.arc(fx.x, fx.y, fx.size * fx.life, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        }

        this.ctx.globalAlpha = 1.0;
        this.animFrame = requestAnimationFrame(() => this.loop());
    }
};
