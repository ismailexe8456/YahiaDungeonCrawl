// DialogueEngine.js - Animated Typewriter Text, Hades Vocal Synth, & 120+ In-Combat Dynamic Reaction Speech Bubbles
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

// 120+ Dynamic In-Combat Reaction Dialogue Database
const COMBAT_DIALOGUES = {
    enemy_low_dmg: [
        "Ha! Doesn't even hurt!",
        "Is that a tickle, weakling?",
        "My thick hide barely felt that!",
        "Pathetic! You strike like a mouse!",
        "You call that a hit? Laughable!",
        "Try harder, mortal!",
        "My armor is impenetrable!",
        "Did a breeze just blow past me?",
        "You missed my vitals entirely!",
        "Puny strike! Mosquito bite!",
        "Bah! Zero impact!",
        "Keep trying, hero!",
        "Is that all your class can do?",
        "Hardly a scratch!",
        "Me not even feeling that!"
    ],
    enemy_heavy_dmg: [
        "ARGHHH! My bones!",
        "OOF! Curse your blade!",
        "Agh! That actually hurt!",
        "GRAHH! You'll pay for that strike!",
        "My blood spills... DAMN YOU!",
        "Furious agony!",
        "NO! My flesh tears!",
        "A devastating blow... impossible!",
        "Ughhh! I'm bleeding out!",
        "Curse your demonic power!",
        "That cut deep!",
        "My defenses shattered!",
        "You'll regret that, mortal!",
        "Gargggh! Vital hit!",
        "Shattered bone!"
    ],
    hero_crit: [
        "FEEL THE MIGHT OF MY BLADE!",
        "TASTE CRITICAL ANNIHILATION!",
        "BEHOLD RADIANT DESTRUCTION!",
        "TO DUST WITH YOU!",
        "DIE, BEAST OF THE SHADOWS!",
        "NO MERCY!",
        "UNLEASH FURY!",
        "BY THE LIGHT, FALL!",
        "PERISH IN AGONY!",
        "CRUSHING BLOW!",
        "YOUR TIME IS AT AN END!",
        "FEEL THE ARCANE STORM!",
        "STRIKE TRUE!",
        "EXECUTION!",
        "ASCEND TO IMMORTALITY!"
    ],
    hero_attack: [
        "Take this!",
        "Strike down the beast!",
        "For honor and glory!",
        "Face my wrath!",
        "Yield to my power!",
        "Forward, into battle!",
        "Taste my steel!",
        "Burn in darkness!",
        "Shatter!",
        "Feel my fury!",
        "No escape!",
        "Piercing strike!",
        "Clean hit!",
        "Fall back!",
        "Unstoppable force!"
    ],
    enemy_attack: [
        "DIE, PUNY MORTAL!",
        "Me crush your skull!",
        "Feel the dark void!",
        "RAAAGH! Tear you apart!",
        "Your soul belongs to us!",
        "Kneel before my power!",
        "No intruder leaves alive!",
        "Feast on your bones!",
        "Blood for the cavern gods!",
        "I'll rip your armor off!",
        "Suffer in agony!",
        "Your journey ends here!",
        "Feel my venomous claws!",
        "Smash into pulp!",
        "Shadows consume you!",
        "Bite down hard!",
        "Chop you to pieces!",
        "Taste my dark magic!",
        "Tremble in terror!",
        "Your blood is mine!"
    ],
    hero_dodge: [
        "Too slow, beast!",
        "You missed me!",
        "Clean dodge!",
        "Predictable swing!",
        "Is that your best speed?",
        "Can't touch a master!",
        "Swift like the wind!",
        "Nothin' but air!",
        "Step aside!",
        "Shadow step!"
    ],
    enemy_dodge: [
        "Can't touch me, hero!",
        "Slippery like shadow!",
        "HA! Missed completely!",
        "Too slow for my speed!",
        "You hit air!",
        "Quick reflexes!",
        "Nice try, amateur!",
        "You swung wide!",
        "Can't catch a goblin!",
        "Dodged with ease!"
    ],
    hero_heal: [
        "Fresh blood flows!",
        "I stand renewed!",
        "Radiant recovery!",
        "Vitality restored!",
        "The light heals me!",
        "Back to full strength!",
        "Pain fades away!",
        "Rejuvenated!",
        "I will never fall!",
        "Second wind!"
    ],
    boss_enrage: [
        "ME KILL YOU NOW!",
        "UNLEASH THE DARK CATACLYSM!",
        "YOU DARE WOUND A GOD?!",
        "FEEL MY ENRAGED FURY!",
        "DESTRUCTION REBORN!",
        "THE VOID CONSUMES ALL!",
        "I WILL CRUSH THIS REALM!",
        "ANCIENT POWER AWAKENS!",
        "NO MORTAL SHALL SURVIVE!",
        "BLOOD AND FIRE!"
    ]
};

const DialogueEngine = {
    typingTimer: null,

    getRandomDialogue: function(category) {
        const list = COMBAT_DIALOGUES[category] || COMBAT_DIALOGUES.hero_attack;
        return list[Math.floor(Math.random() * list.length)];
    },

    spawnSpeechBubble: function(unitElementId, text, isPlayer = false) {
        const unitEl = document.getElementById(unitElementId);
        if (!unitEl) return;

        // Remove old bubble if exists
        const oldBubble = unitEl.querySelector('.speech-bubble');
        if (oldBubble) oldBubble.remove();

        const bubble = document.createElement('div');
        bubble.className = `speech-bubble ${isPlayer ? 'speech-bubble-player' : 'speech-bubble-enemy'}`;
        bubble.innerHTML = `<span class="bubble-text"></span>`;

        unitEl.appendChild(bubble);

        const textEl = bubble.querySelector('.bubble-text');
        this.typeText(textEl, text, isPlayer ? 'Warrior' : 'Enemy', 25, () => {
            setTimeout(() => {
                bubble.classList.add('bubble-fade-out');
                setTimeout(() => bubble.remove(), 400);
            }, 1800);
        });
    },

    typeText: function(targetEl, text, speakerName = 'Warrior', speed = 25, onComplete = null) {
        if (!targetEl) return;
        targetEl.innerHTML = '';
        let index = 0;

        if (this.typingTimer) clearInterval(this.typingTimer);

        this.typingTimer = setInterval(() => {
            if (index < text.length) {
                const char = text.charAt(index);
                targetEl.innerHTML += char;
                if (char !== ' ' && index % 2 === 0) {
                    SoundEngine.playSoftDialogueBlip();
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
                        <div class="dialogue-footer" style="display:flex; gap:10px; justify-content:flex-end;">
                            <button class="btn btn-secondary" id="dialogue-skip-btn">⏩ Skip</button>
                            <button class="btn btn-primary" id="dialogue-next-btn">Continue ▶</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const textTarget = document.getElementById('dialogue-text-target');
        const nextBtn = document.getElementById('dialogue-next-btn');
        const skipBtn = document.getElementById('dialogue-skip-btn');

        this.typeText(textTarget, text, speakerName, 25);

        const dismiss = () => {
            if (this.typingTimer) {
                clearInterval(this.typingTimer);
                this.typingTimer = null;
            }
            SoundEngine.playClick();
            GameManager.closeModal();
            if (onComplete) onComplete();
        };

        nextBtn.onclick = dismiss;
        skipBtn.onclick = dismiss;
    },

    triggerEncounterDialogue: function(enemyObj, onFinish) {
        const taunt = BOSS_TAUNTS[enemyObj.name] || `Prepare yourself! ${enemyObj.name} challenges you to combat!`;
        // Bypass popup modal overlay completely; spawn real-time speech bubble over unit portrait
        this.spawnSpeechBubble('enemy-unit', taunt, false);
        if (onFinish) onFinish();
    },

    triggerHeroSelectQuote: function(heroClass, onFinish) {
        if (onFinish) onFinish();
    }
};
