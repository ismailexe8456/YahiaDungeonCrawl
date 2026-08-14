// TutorialEngine.js - Interactive Guild Master RPG Guide & How to Play System

const TutorialEngine = {
    currentStep: 0,

    steps: [
        {
            title: "⚔️ Welcome to Dungeon Crawl! (Hero Classes & Stats)",
            icon: "fa-shield-alt",
            content: `
                <p>Choose from 6 unique Hero Classes: <strong>Warrior, Rogue, Wizard, Hunter, Paladin, or Necromancer</strong>.</p>
                <div class="tutorial-stats-box" style="margin:14px 0; background:rgba(20,20,40,0.7); padding:12px; border-radius:10px; text-align:left; font-size:0.9rem;">
                    <div>💪 <strong>STR (Strength):</strong> Increases melee physical skill damage.</div>
                    <div>⚡ <strong>AGI (Agility):</strong> Boosts Critical Hit Chance & Dodge Evasion.</div>
                    <div>🔮 <strong>INT (Intelligence):</strong> Multiplies magic spell damage & Max MP.</div>
                    <div>❤️ <strong>VIT (Vitality):</strong> Increases Max Health & Defense resilience.</div>
                </div>
                <p style="color:var(--gold);">Reach Level 5 to unlock powerful Sub-Class Specialization masteries!</p>
            `
        },
        {
            title: "🛡️ Tactical Hardcore Combat & Speech Bubbles",
            icon: "fa-khanda",
            content: `
                <p>Combat is turn-based and tactical in permanent Hardcore difficulty!</p>
                <ul style="text-align:left; font-size:0.9rem; margin:12px 0 12px 20px; color:var(--text-muted);">
                    <li>Use <strong>Skills & MP</strong> strategically to inflict heavy critical hits and lifesteal.</li>
                    <li>Absorb heavy boss blows using <strong>Shield Defenses</strong> before your health drops!</li>
                    <li>Watch out for live <strong>💬 In-Combat Speech Bubbles</strong> popping above hero and beast portraits!</li>
                </ul>
                <p style="color:#00ffaa;">❤️ HP Potions restore 55% Health | 🧪 MP Potions restore 65% Mana</p>
            `
        },
        {
            title: "🗺️ 8-Node Stage Expedition Map",
            icon: "fa-map-marked-alt",
            content: `
                <p>Each dungeon Stage features an 8-Node Expedition Path to navigate:</p>
                <div style="text-align:left; font-size:0.85rem; margin:12px 0; display:grid; grid-template-columns:1fr 1fr; gap:8px;">
                    <div>💀 <strong>Node 1 & 2:</strong> Skirmish & Beast Patrol</div>
                    <div>🏛️ <strong>Node 3:</strong> Ancient Rune Shrine</div>
                    <div>👻 <strong>Node 4:</strong> Shadow Depths Fight</div>
                    <div>🏕️ <strong>Node 5:</strong> Campfire Rest Site</div>
                    <div>⚔️ <strong>Node 6:</strong> Vanguard Mini-Boss</div>
                    <div>🛒 <strong>Node 7:</strong> Wandering Merchant</div>
                    <div>👑 <strong>Node 8:</strong> Stage Boss Gate</div>
                </div>
            `
        },
        {
            title: "🔨 Blacksmith Forge & Victory Coins (+1 to +10 Upgrades)",
            icon: "fa-hammer",
            content: `
                <p>Every victory rewards you with <strong>⚔️ Victory Coins</strong> alongside Gold!</p>
                <div style="margin:14px 0; background:rgba(255,153,0,0.1); border:1px solid #ff9900; padding:12px; border-radius:10px;">
                    <p style="color:#ff9900; font-weight:700; margin-bottom:6px;">🔨 Blacksmith Forge & Upgrades</p>
                    <p style="font-size:0.88rem;">Spend Victory Coins in the Blacksmith Forge anytime to upgrade your <strong>Weapon, Armor, and Accessories from +1 to +10</strong>, boosting stats by +15% per tier!</p>
                </div>
            `
        }
    ],

    openTutorial: function(startStep = 0) {
        SoundEngine.playClick();
        this.currentStep = startStep;
        this.renderStep();
    },

    renderStep: function() {
        const step = this.steps[this.currentStep];
        const isFirst = this.currentStep === 0;
        const isLast = this.currentStep === this.steps.length - 1;

        const modalHtml = `
            <div class="modal-overlay" onclick="if(event.target === this) GameManager.closeModal()">
                <div class="modal-card glass-panel text-center" style="max-width:620px;">
                    <div class="modal-header">
                        <h2><i class="fas ${step.icon}" style="color:var(--gold);"></i> ${step.title}</h2>
                        <button class="close-btn" onclick="GameManager.closeModal()">&times;</button>
                    </div>

                    <div class="tutorial-body" style="margin:16px 0; line-height:1.6;">
                        ${step.content}
                    </div>

                    <div class="tutorial-dots" style="margin:16px 0; display:flex; justify-content:center; gap:8px;">
                        ${this.steps.map((_, idx) => `
                            <span style="width:12px; height:12px; border-radius:50%; background:${idx === this.currentStep ? 'var(--gold)' : 'rgba(255,255,255,0.2)'}; display:inline-block; transition:all 0.3s;"></span>
                        `).join('')}
                    </div>

                    <div style="margin-top:20px; display:flex; justify-content:space-between; align-items:center;">
                        <button class="btn btn-secondary" onclick="TutorialEngine.prevStep()" ${isFirst ? 'disabled style="opacity:0.4;"' : ''}>⬅️ Previous</button>
                        ${isLast ? 
                            `<button class="btn btn-primary" onclick="TutorialEngine.closeTutorial()">⚔️ Start Playing!</button>` :
                            `<button class="btn btn-primary" onclick="TutorialEngine.nextStep()">Next Step ➡️</button>`
                        }
                    </div>
                </div>
            </div>
        `;
        GameManager.showModal(modalHtml);
    },

    nextStep: function() {
        if (this.currentStep < this.steps.length - 1) {
            this.currentStep++;
            SoundEngine.playClick();
            this.renderStep();
        }
    },

    prevStep: function() {
        if (this.currentStep > 0) {
            this.currentStep--;
            SoundEngine.playClick();
            this.renderStep();
        }
    },

    closeTutorial: function() {
        try {
            localStorage.setItem('dungeon_tutorial_seen', 'true');
        } catch(e) {}
        SoundEngine.playClick();
        GameManager.closeModal();
    },

    checkAutoTrigger: function() {
        try {
            const seen = localStorage.getItem('dungeon_tutorial_seen');
            if (!seen) {
                setTimeout(() => this.openTutorial(0), 600);
            }
        } catch(e) {}
    }
};

if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        TutorialEngine.checkAutoTrigger();
    });
}
