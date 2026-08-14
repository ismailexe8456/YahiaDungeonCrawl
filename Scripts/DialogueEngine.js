// DialogueEngine.js - Animated Typewriter Text & Hades-Style RPG Encounter Dialogue System
const HERO_QUOTES = {
    Warrior: "My blade hungers for glory! Let none stand in my path!",
    Rogue: "In the shadows, death strikes swift and unseen.",
    Wizard: "The arcane elements obey my command. Burn them to ashes!",
    Hunter: "One arrow, one kill. My aim never falters.",
    Paladin: "By the radiant light, evil shall be purged from these lands!",
    Necromancer: "From dust to shadow... all souls belong to me."
};

const BOSS_TAUNTS = {
    'Goblin Scout': "Hehehe! A foolish intruder enters our cavern! Get 'em, boys!",
    'Forest Troll': "ROAAAR! Me smash little hero into bloody pulp!",
    'Orc Berserker': "Grahhh! Blood for the Orc tribe! Die, weakling!",
    'Shadow Goblin Warlord': "Kneel, mortal! The dark shadow council has decreed your doom!",
    'Void Dragon': "I am the Void Dragon, ancient flame of destruction! You dare challenge a god?!"
};

const DialogueEngine = {
    typingTimer: null,

    typeText: function(targetEl, text, speakerName = 'Warrior', speed = 30, onComplete = null) {
        if (!targetEl) return;
        targetEl.innerHTML = '';
        let index = 0;

        if (this.typingTimer) clearInterval(this.typingTimer);

        this.typingTimer = setInterval(() => {
            if (index < text.length) {
                const char = text.charAt(index);
                targetEl.innerHTML += char;
                // Play Hades-style pitch-shifting character voice blip on non-space characters
                if (char !== ' ' && index % 2 === 0) {
                    SoundEngine.playVoiceBlip(speakerName);
                }
                index++;
            } else {
                clearInterval(this.typingTimer);
                this.typingTimer = null;
                if (onComplete) onComplete();
            }
        }, speed);
    },

    showDialogueModal: function(speakerName, speakerImg, text, onComplete = null) {
        const container = document.getElementById('modal-container');
        if (!container) return;

        container.innerHTML = `
            <div class="modal-overlay">
                <div class="dialogue-box glass-panel">
                    <div class="dialogue-portrait-wrapper">
                        <img src="${speakerImg}" alt="${speakerName}" class="dialogue-portrait">
                        <div class="dialogue-name-tag">${speakerName}</div>
                    </div>
                    <div class="dialogue-content">
                        <div class="dialogue-text" id="dialogue-text-target"></div>
                        <div class="dialogue-footer">
                            <button class="btn btn-primary" id="dialogue-next-btn">Continue ▶</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const textTarget = document.getElementById('dialogue-text-target');
        const nextBtn = document.getElementById('dialogue-next-btn');

        this.typeText(textTarget, text, speakerName, 30);

        nextBtn.onclick = () => {
            SoundEngine.playClick();
            GameManager.closeModal();
            if (onComplete) onComplete();
        };
    },

    triggerEncounterDialogue: function(enemyObj, onFinish) {
        const taunt = BOSS_TAUNTS[enemyObj.name] || `Prepare yourself! ${enemyObj.name} challenges you to mortal combat!`;
        this.showDialogueModal(enemyObj.name, enemyObj.img, taunt, onFinish);
    },

    triggerHeroSelectQuote: function(heroClass, onFinish) {
        const quote = HERO_QUOTES[heroClass] || "Forward into the abyss!";
        const heroDef = HERO_CLASSES[heroClass];
        this.showDialogueModal(heroClass, heroDef.img, quote, onFinish);
    }
};
