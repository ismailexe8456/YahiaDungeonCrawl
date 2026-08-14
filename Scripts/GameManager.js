// GameManager.js - Core Turn-Based RPG Engine, Save/Load System, & Hardcore Mechanics
const SHOP_ITEMS = {
    weapons: [
        { name: 'Steel Longsword', str: 20, int: 0, price: 100, desc: '+20 Strength' },
        { name: 'Arcane Staff', str: 5, int: 25, price: 120, desc: '+25 Intelligence' },
        { name: 'Shadow Daggers', str: 15, int: 0, agi: 20, price: 150, desc: '+15 STR, +20 Agility' },
        { name: 'Mythic Excalibur', str: 45, int: 15, price: 350, desc: '+45 STR, +15 INT' }
    ],
    armors: [
        { name: 'Chainmail Armor', vit: 15, price: 90, desc: '+15 Vitality' },
        { name: 'Dragon Scale Plate', vit: 35, price: 250, desc: '+35 Vitality' }
    ],
    accessories: [
        { name: 'Ring of Agility', agi: 15, price: 80, desc: '+15 Agility' },
        { name: 'Amulet of the Phoenix', vit: 15, int: 15, price: 180, desc: '+15 VIT, +15 INT' }
    ],
    consumables: [
        { name: 'Health Potion', type: 'hpPotion', price: 25, desc: 'Restores 50% max HP' },
        { name: 'Mana Potion', type: 'mpPotion', price: 20, desc: 'Restores 60% max MP' }
    ]
};

const ACHIEVEMENTS_LIST = [
    { id: 'first_win', title: '🗡️ First Blood', desc: 'Win your first dungeon battle.', bonus: '+5 STR' },
    { id: 'dragon_slayer', title: '🐉 Dragon Slayer', desc: 'Defeat the terrifying Void Dragon boss.', bonus: '+15 All Stats' },
    { id: 'potion_hoarder', title: '🧪 Alchemist', desc: 'Use 5 health or mana potions.', bonus: '+20 Max HP' },
    { id: 'rich', title: '🪙 Wealthy Tycoon', desc: 'Accumulate over 300 Gold.', bonus: '+10% Gold Gain' },
    { id: 'lvl5', title: '🔥 Class Master', desc: 'Reach Level 5 and unlock a Specialization.', bonus: '+1 Legendary Skill' }
];

const GameManager = {
    currentStage: 1,
    highScore: 1,
    currentNodeIndex: 0,
    stageNodes: [],
    isTurnInProgress: false,
    difficulty: 'normal', // 'normal', 'hardcore', 'nightmare'

    init: function() {
        const viewContainer = document.getElementById('main-view');
        if (!viewContainer) {
            setTimeout(() => GameManager.init(), 50);
            return;
        }
        try {
            ParticleEngine.init('fx-canvas');
            this.loadSaveData();
            this.updateHeaderStats();
        } catch (e) {
            console.error("Game initialization error:", e);
        }
    },

    setGameStart: function(classType) {
        player = new Player(classType);
        SoundEngine.playClick();
        this.logAction(`Hero selected: <strong style="color:var(--gold)">${player.classType}</strong> - ${player.title}!`, 'info');
        DialogueEngine.triggerHeroSelectQuote(classType, () => {
            this.startStageMap(this.currentStage);
        });
    },

    setDifficulty: function(diffMode) {
        this.difficulty = diffMode;
        SoundEngine.playClick();
        this.logAction(`Difficulty set to: <strong>${diffMode.toUpperCase()}</strong>!`, 'warning');
    },

    startStageMap: function(stageNum) {
        this.currentStage = stageNum;
        if (player) {
            player.health = player.maxHealth;
            player.mana = player.maxMana;
            player.shield = 0;
        }
        if (stageNum > this.highScore) {
            this.highScore = stageNum;
            this.saveGameData();
        }

        this.stageNodes = [
            { type: 'battle', title: 'Dungeon Skirmish', icon: 'fa-skull-crossbones' },
            { type: 'shrine', title: 'Ancient Rune Shrine', icon: 'fa-gavel' },
            { type: 'treasure', title: 'Hidden Treasure Vault', icon: 'fa-gem' },
            { type: 'merchant', title: 'Wandering Merchant', icon: 'fa-store' },
            { type: 'boss', title: 'Stage Boss Gate', icon: 'fa-dragon' }
        ];

        this.currentNodeIndex = 0;
        this.renderDungeonMap();
    },

    renderDungeonMap: function() {
        const viewContainer = document.getElementById('main-view');
        if (!viewContainer) return;

        let nodesHtml = this.stageNodes.map((node, index) => {
            const isCompleted = index < this.currentNodeIndex;
            const isCurrent = index === this.currentNodeIndex;
            const isLocked = index > this.currentNodeIndex;

            return `
                <div class="map-node ${isCompleted ? 'node-completed' : ''} ${isCurrent ? 'node-current' : ''} ${isLocked ? 'node-locked' : ''}" 
                     onclick="${isCurrent ? `GameManager.enterMapNode(${index})` : ''}">
                    <div class="node-icon"><i class="fas ${node.icon}"></i></div>
                    <div class="node-title">${node.title}</div>
                    <div class="node-status">${isCompleted ? '✓ Cleared' : isCurrent ? '👉 ENTER' : '🔒 Locked'}</div>
                </div>
            `;
        }).join('<div class="node-connector"></div>');

        viewContainer.innerHTML = `
            <div class="map-screen text-center">
                <h2 style="font-family:'MedievalSharp',serif; color:var(--gold); font-size:2.2rem; margin-bottom:6px;">
                    🗺️ Stage ${this.currentStage} Expedition Map
                </h2>
                <p style="color:var(--text-muted); margin-bottom:20px;">Navigate node paths to fight beasts, claim ancient shrine blessings, and challenge stage bosses!</p>

                <div class="map-nodes-container">
                    ${nodesHtml}
                </div>

                <div style="margin-top:30px; display:flex; gap:12px; justify-content:center; flex-wrap:wrap;">
                    <button class="btn btn-potion" onclick="GameManager.openUpgradeModal()"><i class="fas fa-hammer"></i> Blacksmith Forge & Upgrades</button>
                    <button class="btn btn-secondary" onclick="GameManager.openInventoryModal()"><i class="fas fa-user-shield"></i> Gear & Gems</button>
                    <button class="btn btn-secondary" onclick="GameManager.openAchievementsModal()"><i class="fas fa-trophy"></i> Achievements</button>
                    <button class="btn btn-secondary" onclick="GameManager.openSaveLoadModal()"><i class="fas fa-save"></i> Save / Load</button>
                </div>
            </div>
        `;
    },

    enterMapNode: function(nodeIndex) {
        const node = this.stageNodes[nodeIndex];
        if (!node) return;

        SoundEngine.playClick();

        if (node.type === 'battle' || node.type === 'boss') {
            this.startCombat(node.type === 'boss');
        } else if (node.type === 'shrine') {
            this.openShrineModal();
        } else if (node.type === 'treasure') {
            this.openTreasureModal();
        } else if (node.type === 'merchant') {
            this.openShopModal(true);
        }
    },

    advanceMapNode: function() {
        this.currentNodeIndex++;
        if (this.currentNodeIndex >= this.stageNodes.length) {
            this.startStageMap(this.currentStage + 1);
        } else {
            this.renderDungeonMap();
        }
    },

    startCombat: function(isBossStage = false) {
        let scale = 1.0 + (this.currentStage - 1) * 0.35;
        let diffMult = this.difficulty === 'nightmare' ? 2.0 : (this.difficulty === 'hardcore' ? 1.5 : 1.0);
        let monsterData;

        if (isBossStage) {
            monsterData = ENEMY_DATABASE.find(m => m.isBoss && m.tier <= Math.ceil(this.currentStage / 2)) || ENEMY_DATABASE[ENEMY_DATABASE.length - 1];
        } else {
            const regularMonsters = ENEMY_DATABASE.filter(m => !m.isBoss);
            monsterData = regularMonsters[(this.currentStage + this.currentNodeIndex) % regularMonsters.length];
        }

        enemy = new Enemy(monsterData, scale, diffMult);
        player.health = player.maxHealth;
        player.mana = player.maxMana;
        player.shield = 0;
        player.skills.forEach(s => s.currentCD = 0);

        this.renderBattleArena();
        this.updateHeaderStats();
        this.logAction(`Encountered: <span style="color:${enemy.isBoss ? '#ff3366' : '#ff9900'}">${enemy.name}</span> (${enemy.maxHealth} HP)!`, 'warning');
        this.isTurnInProgress = false;

        DialogueEngine.triggerEncounterDialogue(enemy);
    },

    renderBattleArena: function() {
        const viewContainer = document.getElementById('main-view');
        if (!viewContainer) return;

        viewContainer.innerHTML = `
            <div class="battle-stage">
                <!-- Player Unit -->
                <div class="combat-unit glass-panel" id="player-unit">
                    <div class="unit-portrait-box">
                        <img src="${player.img}" alt="${player.classType}" class="unit-img" id="player-img">
                        <div class="shield-overlay" id="player-shield-badge" style="display:${player.shield > 0 ? 'block' : 'none'}">🛡️ ${player.shield}</div>
                    </div>
                    
                    ${player.companion ? `<div class="companion-badge">🐾 ${player.companion.name} (${player.companion.title})</div>` : ''}

                    <div class="unit-info">
                        <h3>${player.classType} <span class="unit-lvl">Lvl ${player.level}</span></h3>
                        <p class="unit-sub">${player.specialization ? player.specialization.name : player.title}</p>

                        <div class="stat-bar-group">
                            <div class="bar-label"><span>HP</span> <span id="player-hp-txt">${player.health}/${player.maxHealth}</span></div>
                            <div class="bar-bg"><div class="bar-fill bar-hp" id="player-hp-bar" style="width: ${(player.health/player.maxHealth)*100}%"></div></div>
                        </div>

                        <div class="stat-bar-group">
                            <div class="bar-label"><span>MP</span> <span id="player-mp-txt">${player.mana}/${player.maxMana}</span></div>
                            <div class="bar-bg"><div class="bar-fill bar-mp" id="player-mp-bar" style="width: ${(player.mana/player.maxMana)*100}%"></div></div>
                        </div>
                    </div>
                </div>

                <!-- VS Divider -->
                <div class="vs-divider">
                    <span class="stage-tag">Stage ${this.currentStage} - Node ${this.currentNodeIndex + 1}</span>
                    <div class="vs-circle">VS</div>
                </div>

                <!-- Enemy Unit -->
                <div class="combat-unit glass-panel" id="enemy-unit">
                    <div class="unit-portrait-box">
                        <img src="${enemy.img}" alt="${enemy.name}" class="unit-img" id="enemy-img">
                        ${enemy.isBoss ? '<div class="boss-crown">👑 BOSS</div>' : ''}
                    </div>
                    <div class="unit-info">
                        <h3 style="color:${enemy.isBoss ? '#ff3366' : '#fff'}">${enemy.name}</h3>
                        <p class="unit-sub" id="enemy-phase-txt">${enemy.inPhase2 ? '🔥 ENRAGED PHASE 2' : (enemy.isBoss ? 'Dungeon Overseer' : `Def: ${enemy.defense}`)}</p>

                        <div class="stat-bar-group">
                            <div class="bar-label"><span>HP</span> <span id="enemy-hp-txt">${enemy.health}/${enemy.maxHealth}</span></div>
                            <div class="bar-bg"><div class="bar-fill bar-hp" id="enemy-hp-bar" style="width: ${(enemy.health/enemy.maxHealth)*100}%"></div></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Action Command Panel -->
            <div class="action-panel glass-panel">
                <div class="action-skills" id="skills-container">
                    ${this.renderSkillButtons()}
                </div>

                <div class="action-items">
                    ${enemy && enemy.health <= 0 ? `<button class="btn btn-primary" onclick="GameManager.advanceMapNode()"><i class="fas fa-arrow-right"></i> Continue Expedition</button>` : ''}
                    <button class="btn btn-potion" onclick="GameManager.usePotion('hp')">❤️ HP (${player.potions.hpPotion})</button>
                    <button class="btn btn-potion" onclick="GameManager.usePotion('mp')">🧪 MP (${player.potions.mpPotion})</button>
                    <button class="btn btn-secondary" onclick="GameManager.openInventoryModal()">🎒 Gear & Gems</button>
                    <button class="btn btn-secondary" onclick="GameManager.openShopModal()">🛒 Merchant</button>
                    <button class="btn btn-potion" onclick="GameManager.openSaveLoadModal()"><i class="fas fa-save"></i> Save Game</button>
                </div>
            </div>

            <!-- Combat History Log -->
            <div class="combat-log-container glass-panel">
                <div class="log-header"><i class="fas fa-scroll"></i> Battle Log</div>
                <div class="log-body" id="log-body"></div>
            </div>
        `;
    },

    renderSkillButtons: function() {
        if (enemy && enemy.health <= 0) {
            return `
                <button class="btn btn-primary animate-bounce" onclick="GameManager.advanceMapNode()" style="grid-column: 1 / -1; padding: 16px; font-size: 1.3rem; font-weight: 800; width: 100%;">
                    🎉 VICTORY! Click to Continue Expedition ➡️
                </button>
            `;
        }
        return player.skills.map((skill, index) => {
            const disabled = skill.currentCD > 0 || player.mana < skill.manaCost || (enemy && enemy.health <= 0);
            return `
                <button class="btn btn-skill ${disabled ? 'disabled' : ''}" 
                        onclick="GameManager.useSkill(${index})" 
                        onmouseenter="SoundEngine.playHover()" 
                        ${disabled ? 'disabled' : ''}>
                    <div class="skill-top">
                        <span class="skill-name">${skill.name}</span>
                        ${skill.manaCost > 0 ? `<span class="skill-cost">${skill.manaCost} MP</span>` : ''}
                    </div>
                    <div class="skill-desc">${skill.desc}</div>
                    ${skill.currentCD > 0 ? `<div class="cd-overlay">CD: ${skill.currentCD} turns</div>` : ''}
                </button>
            `;
        }).join('');
    },

    useSkill: function(skillIndex) {
        if (this.isTurnInProgress) return;
        const skill = player.skills[skillIndex];
        if (!skill || skill.currentCD > 0 || player.mana < skill.manaCost) return;

        this.isTurnInProgress = true;
        player.mana -= skill.manaCost;
        skill.currentCD = skill.cooldown + 1;

        if (skill.sound === 'slash') SoundEngine.playSlash();
        else if (skill.sound === 'heavyHit') SoundEngine.playHeavyHit();
        else if (skill.sound === 'fireball') SoundEngine.playFireball();
        else if (skill.sound === 'heal') SoundEngine.playHeal();
        else if (skill.sound === 'shield') SoundEngine.playShield();

        const enemyImgEl = document.getElementById('enemy-img');
        const playerImgEl = document.getElementById('player-img');

        if (playerImgEl) {
            playerImgEl.classList.add('anim-lunge-right');
            setTimeout(() => playerImgEl.classList.remove('anim-lunge-right'), 450);
        }

        if (skill.type === 'physical' || skill.type === 'magic') {
            ParticleEngine.spawnSlashFX(enemyImgEl, skill.element === 'dark' ? '#aa00ff' : '#ff3366');

            if (Math.random() < enemy.DodgeChance) {
                this.spawnFloatingText(enemyImgEl, 'DODGED!', 'dodge');
                this.logAction(`${enemy.name} dodged your ${skill.name}!`, 'warning');
                DialogueEngine.spawnSpeechBubble('enemy-unit', DialogueEngine.getRandomDialogue('enemy_dodge'), false);
            } else {
                // Hardcore Balanced Damage Calculation with Armor Reduction
                let baseDmg = skill.type === 'magic' ? (player.TotalInt * 1.5) : (player.TotalStr * 1.3);
                let hitMult = skill.mult || 1.0;
                let rawDmg = Math.floor(baseDmg * hitMult + (Math.random() * 6));
                let damage = Math.max(12, rawDmg - Math.floor(enemy.defense * 0.6));

                let isCrit = Math.random() < player.CritChance;
                if (isCrit) {
                    damage = Math.floor(damage * 1.6);
                    ParticleEngine.triggerShake(16);
                    DialogueEngine.spawnSpeechBubble('player-unit', DialogueEngine.getRandomDialogue('hero_crit'), true);
                } else {
                    DialogueEngine.spawnSpeechBubble('player-unit', DialogueEngine.getRandomDialogue('hero_attack'), true);
                }

                if (enemyImgEl) {
                    enemyImgEl.classList.add('anim-recoil');
                    setTimeout(() => enemyImgEl.classList.remove('anim-recoil'), 400);
                }

                // Enemy reaction dialogue ("Doesn't even hurt!" vs heavy damage groans)
                setTimeout(() => {
                    if (enemy.health > 0) {
                        DialogueEngine.spawnSpeechBubble('enemy-unit', DialogueEngine.getRandomDialogue(damage < 60 ? 'enemy_low_dmg' : 'enemy_heavy_dmg'), false);
                    }
                }, 350);

                enemy.health = Math.max(0, enemy.health - damage);
                this.spawnFloatingText(enemyImgEl, `-${damage}${isCrit ? ' CRIT!' : ''}`, isCrit ? 'crit' : 'dmg');
                this.logAction(`You cast <strong>${skill.name}</strong> dealing <span style="color:#ff3366">${damage} damage</span> (Enemy Def: ${enemy.defense})!`, 'player');

                if (skill.lifesteal) {
                    const healAmt = Math.floor(damage * skill.lifesteal);
                    player.health = Math.min(player.maxHealth, player.health + healAmt);
                    this.spawnFloatingText(playerImgEl, `+${healAmt} HP`, 'heal');
                }
            }
        } else if (skill.type === 'buff') {
            if (skill.shieldVal) {
                player.shield += skill.shieldVal;
                this.spawnFloatingText(playerImgEl, `+${skill.shieldVal} Shield`, 'heal');
            }
            if (skill.critBuff) player.buffCrit = true;
            if (skill.mpRecover) {
                player.mana = Math.min(player.maxMana, player.mana + skill.mpRecover);
                this.spawnFloatingText(playerImgEl, `+${skill.mpRecover} MP`, 'mp');
            }
            ParticleEngine.spawnSpellFX(playerImgEl, 'holy');
            DialogueEngine.spawnSpeechBubble('player-unit', "Power surging!", true);
            this.logAction(`You cast <strong>${skill.name}</strong>!`, 'info');
        }

        if (enemy.checkPhase2()) {
            SoundEngine.playHeavyHit();
            ParticleEngine.triggerShake(20);
            ParticleEngine.spawnSpellFX(enemyImgEl, 'fireball');
            DialogueEngine.spawnSpeechBubble('enemy-unit', DialogueEngine.getRandomDialogue('boss_enrage'), false);
            this.logAction(`🔥 WARNING! ${enemy.name} shifted into <strong>ENRAGED PHASE 2</strong>! Damage increased!`, 'warning');
            const phaseTxtEl = document.getElementById('enemy-phase-txt');
            if (phaseTxtEl) phaseTxtEl.innerHTML = '<span style="color:#ff3366; font-weight:800;">🔥 ENRAGED PHASE 2</span>';
        }

        this.updateUI();

        if (enemy.health <= 0) {
            setTimeout(() => this.handleVictory(), 600);
            return;
        }

        if (player.companion && enemy.health > 0) {
            const compRes = player.companion.act(player, enemy);
            if (compRes.dmg) this.spawnFloatingText(enemyImgEl, `-${compRes.dmg}`, compRes.type);
            if (compRes.shield) this.spawnFloatingText(playerImgEl, `+${compRes.shield} Shield`, 'heal');
            if (compRes.heal) this.spawnFloatingText(playerImgEl, `+${compRes.heal} HP`, 'heal');
            this.logAction(compRes.msg, 'info');
            this.updateUI();
        }

        if (enemy.health <= 0) {
            setTimeout(() => this.handleVictory(), 600);
            return;
        }

        setTimeout(() => this.executeEnemyTurn(), 1000);
    },

    executeEnemyTurn: function() {
        const playerImgEl = document.getElementById('player-img');
        const enemyImgEl = document.getElementById('enemy-img');
        const enemySkill = enemy.getRandomSkill();

        if (enemyImgEl) {
            enemyImgEl.classList.add('anim-lunge-left');
            setTimeout(() => enemyImgEl.classList.remove('anim-lunge-left'), 450);
        }

        DialogueEngine.spawnSpeechBubble('enemy-unit', DialogueEngine.getRandomDialogue('enemy_attack'), false);

        if (Math.random() < player.DodgeChance) {
            this.spawnFloatingText(playerImgEl, 'DODGED!', 'dodge');
            this.logAction(`You dodged ${enemy.name}'s ${enemySkill.name}!`, 'info');
            DialogueEngine.spawnSpeechBubble('player-unit', DialogueEngine.getRandomDialogue('hero_dodge'), true);
        } else {
            let baseDmg = enemy.strength * 1.6;
            let damage = Math.floor(baseDmg * enemySkill.mult + (Math.random() * 8));
            let isCrit = Math.random() < enemy.CritChance;
            if (isCrit) damage = Math.floor(damage * 1.5);

            if (player.shield > 0) {
                if (player.shield >= damage) {
                    player.shield -= damage;
                    this.spawnFloatingText(playerImgEl, `Absorbed (${damage})`, 'heal');
                    damage = 0;
                } else {
                    damage -= player.shield;
                    player.shield = 0;
                }
            }

            if (damage > 0) {
                if (playerImgEl) {
                    playerImgEl.classList.add('anim-recoil');
                    setTimeout(() => playerImgEl.classList.remove('anim-recoil'), 400);
                }

                player.health = Math.max(0, player.health - damage);
                SoundEngine.playHeavyHit();
                ParticleEngine.triggerShake(12);
                ParticleEngine.spawnSlashFX(playerImgEl, '#ff0044');
                this.spawnFloatingText(playerImgEl, `-${damage}`, isCrit ? 'crit' : 'dmg');
                this.logAction(`${enemy.name} cast <strong>${enemySkill.name}</strong> dealing <span style="color:#ff3366">${damage} damage</span>!`, 'enemy');
            }
        }

        player.updateCooldowns();
        this.updateUI();

        if (player.health <= 0) {
            setTimeout(() => this.handleDefeat(), 600);
        } else {
            this.isTurnInProgress = false;
        }
    },

    usePotion: function(type) {
        if (this.isTurnInProgress) return;
        const playerImgEl = document.getElementById('player-img');
        if (type === 'hp') {
            const restored = player.useHpPotion();
            if (restored) {
                this.spawnFloatingText(playerImgEl, `+${restored} HP`, 'heal');
                DialogueEngine.spawnSpeechBubble('player-unit', DialogueEngine.getRandomDialogue('hero_heal'), true);
                this.logAction(`Used Health Potion, restored ${restored} HP.`, 'info');
                this.checkAchievement('potion_hoarder');
            }
        } else if (type === 'mp') {
            const restored = player.useMpPotion();
            if (restored) {
                this.spawnFloatingText(playerImgEl, `+${restored} MP`, 'mp');
                DialogueEngine.spawnSpeechBubble('player-unit', "Mana restored!", true);
                this.logAction(`Used Mana Potion, restored ${restored} MP.`, 'info');
            }
        }
        this.updateUI();
    },

    handleVictory: function() {
        SoundEngine.playVictory();
        const coinsReward = Math.floor(Math.random() * 10 + 15);
        player.gold += enemy.goldReward;
        player.coins = (player.coins || 0) + coinsReward;
        const leveledUp = player.addXP(enemy.xpReward);

        this.checkAchievement('first_win');
        if (enemy.name === 'Void Dragon') this.checkAchievement('dragon_slayer');
        if (player.gold >= 300) this.checkAchievement('rich');

        if (leveledUp) {
            SoundEngine.playLevelUp();
            if (player.level >= 5 && !player.specialization) {
                this.checkAchievement('lvl5');
            }
        }

        this.saveGameData();
        this.updateUI();

        const modalHtml = `
            <div class="modal-overlay">
                <div class="modal-card glass-panel text-center animate-bounce">
                    <h2 style="color:var(--gold); font-size:2.4rem;">🎉 VICTORY!</h2>
                    <p class="subtitle">Cleared Node ${this.currentNodeIndex + 1} - Defeated ${enemy.name}</p>

                    <div class="victory-rewards">
                        <div class="reward-pill"><span>🪙 Gold:</span> <strong>+${enemy.goldReward}</strong></div>
                        <div class="reward-pill"><span>⚔️ Victory Coins:</span> <strong>+${coinsReward}</strong></div>
                        <div class="reward-pill"><span>⭐ EXP:</span> <strong>+${enemy.xpReward}</strong></div>
                    </div>

                    ${leveledUp ? `<div class="level-up-banner">🔥 LEVEL UP! Reached Level ${player.level}! +3 Stat Points!</div>` : ''}
                    ${player.level >= 5 && !player.specialization ? `<div class="special-unlock-banner">⭐ SPECIALIZATION UNLOCKED! Pick your Level 5 Hero Mastery!</div>` : ''}

                    <div style="margin-top:24px; display:flex; gap:12px; justify-content:center; flex-wrap:wrap;">
                        <button class="btn btn-potion" onclick="GameManager.closeModal(); GameManager.openUpgradeModal()">🔨 Upgrade Gear in Forge</button>
                        <button class="btn btn-primary" onclick="GameManager.closeModal(); GameManager.advanceMapNode()">Continue Map Exploration</button>
                    </div>
                </div>
            </div>
        `;
        this.showModal(modalHtml);
    },

    openUpgradeModal: function() {
        SoundEngine.playClick();
        if (!player) return;

        const wLvl = player.equipment.weaponLevel || 0;
        const aLvl = player.equipment.armorLevel || 0;
        const accLvl = player.equipment.accessoryLevel || 0;

        const wCost = (wLvl + 1) * 10;
        const aCost = (aLvl + 1) * 10;
        const accCost = (accLvl + 1) * 10;

        const modalHtml = `
            <div class="modal-overlay">
                <div class="modal-card glass-panel" style="max-width:650px;">
                    <div class="modal-header">
                        <h2>🔨 Blacksmith Forge & Gear Upgrades</h2>
                        <span class="stat-chip coin-badge">⚔️ ${player.coins || 0} Victory Coins</span>
                        <button class="close-btn" onclick="GameManager.closeModal()">&times;</button>
                    </div>

                    <p style="color:var(--text-muted); margin-bottom:16px;">Spend Victory Coins earned from battle victories to upgrade weapon, armor, and accessories up to +10!</p>

                    <div class="upgrade-grid">
                        <div class="upgrade-card glass-panel">
                            <div class="upgrade-top">
                                <strong>⚔️ Weapon (+${wLvl})</strong>
                                <span class="upgrade-stat" style="color:var(--gold);">+${Math.floor(wLvl * 15)}% STR/INT</span>
                            </div>
                            <div class="item-name" style="margin:8px 0; font-weight:700;">${player.equipment.weapon ? player.equipment.weapon.name : 'Weapon'}</div>
                            <button class="btn btn-primary" onclick="GameManager.upgradeGearSlot('weapon')" ${(player.coins || 0) < wCost || wLvl >= 10 ? 'disabled' : ''} style="width:100%;">
                                ${wLvl >= 10 ? 'MAX +10' : `Upgrade (+1) ⚔️ ${wCost} Coins`}
                            </button>
                        </div>

                        <div class="upgrade-card glass-panel">
                            <div class="upgrade-top">
                                <strong>🛡️ Armor (+${aLvl})</strong>
                                <span class="upgrade-stat" style="color:var(--heal-green);">+${Math.floor(aLvl * 15)}% VIT/HP</span>
                            </div>
                            <div class="item-name" style="margin:8px 0; font-weight:700;">${player.equipment.armor ? player.equipment.armor.name : 'Armor'}</div>
                            <button class="btn btn-primary" onclick="GameManager.upgradeGearSlot('armor')" ${(player.coins || 0) < aCost || aLvl >= 10 ? 'disabled' : ''} style="width:100%;">
                                ${aLvl >= 10 ? 'MAX +10' : `Upgrade (+1) ⚔️ ${aCost} Coins`}
                            </button>
                        </div>

                        <div class="upgrade-card glass-panel">
                            <div class="upgrade-top">
                                <strong>💍 Accessory (+${accLvl})</strong>
                                <span class="upgrade-stat" style="color:var(--mana-blue);">+${Math.floor(accLvl * 15)}% AGI/Crit</span>
                            </div>
                            <div class="item-name" style="margin:8px 0; font-weight:700;">${player.equipment.accessory ? player.equipment.accessory.name : 'Accessory'}</div>
                            <button class="btn btn-primary" onclick="GameManager.upgradeGearSlot('accessory')" ${(player.coins || 0) < accCost || accLvl >= 10 ? 'disabled' : ''} style="width:100%;">
                                ${accLvl >= 10 ? 'MAX +10' : `Upgrade (+1) ⚔️ ${accCost} Coins`}
                            </button>
                        </div>
                    </div>

                    <div style="margin-top:20px; text-align:right;">
                        <button class="btn btn-secondary" onclick="GameManager.closeModal()">Exit Forge</button>
                    </div>
                </div>
            </div>
        `;
        this.showModal(modalHtml);
    },

    upgradeGearSlot: function(slot) {
        if (!player) return;
        const currentLvl = player.equipment[slot + 'Level'] || 0;
        const cost = (currentLvl + 1) * 10;

        if ((player.coins || 0) < cost) {
            this.showInsufficientFunds('merchant-shop-card', cost, 'Victory Coins');
            return;
        }

        player.coins -= cost;
        player.equipment[slot + 'Level'] = currentLvl + 1;
        player.recalculateStats();
        SoundEngine.playLevelUp();
        this.logAction(`Forged <strong>${slot.toUpperCase()} +${currentLvl + 1}</strong>! Stats boosted!`, 'info');
        this.saveGameData();
        this.openUpgradeModal();
    },

    handleDefeat: function() {
        SoundEngine.playDefeat();
        if (player) {
            player.health = player.maxHealth;
            player.mana = player.maxMana;
            player.shield = 0;
        }
        const modalHtml = `
            <div class="modal-overlay">
                <div class="modal-card glass-panel text-center">
                    <h2 style="color:#ff3366; font-size:2.4rem;">💀 DEFEATED</h2>
                    <p class="subtitle">Vanquished on Stage ${this.currentStage} Node ${this.currentNodeIndex + 1}.</p>

                    <div style="margin-top:24px; display:flex; gap:12px; justify-content:center;">
                        <button class="btn btn-primary" onclick="GameManager.closeModal(); GameManager.renderDungeonMap()">Return to Map</button>
                    </div>
                </div>
            </div>
        `;
        this.showModal(modalHtml);
    },

    // Multi-Slot Save / Load & Cloud Database System
    openSaveLoadModal: function() {
        SoundEngine.playClick();
        let slotsHtml = '';
        for (let i = 1; i <= 3; i++) {
            const raw = localStorage.getItem(`dungeon_crawl_save_slot_${i}`);
            let slotData = raw ? JSON.parse(raw) : null;

            slotsHtml += `
                <div class="save-slot-card glass-panel">
                    <div class="slot-title">💾 Local Slot ${i}</div>
                    ${slotData ? `
                        <div class="slot-info">
                            <strong>${slotData.playerData.classType}</strong> (Lvl ${slotData.playerData.level})<br>
                            Stage ${slotData.currentStage} | 🪙 ${slotData.playerData.gold} Gold<br>
                            <span class="slot-time">${slotData.timestamp || 'Saved'}</span>
                        </div>
                        <div class="slot-actions">
                            <button class="btn btn-primary" onclick="GameManager.saveToSlot(${i})">Save Slot ${i}</button>
                            <button class="btn btn-potion" onclick="GameManager.loadFromSlot(${i})">Load Slot ${i}</button>
                            <button class="btn btn-secondary" onclick="GameManager.deleteSlot(${i})" style="color:#ff2a5f;">&times;</button>
                        </div>
                    ` : `
                        <div class="slot-info" style="color:#888;">Empty Local Slot</div>
                        <div class="slot-actions">
                            ${player ? `<button class="btn btn-primary" onclick="GameManager.saveToSlot(${i})">Save Slot ${i}</button>` : ''}
                        </div>
                    `}
                </div>
            `;
        }

        const modalHtml = `
            <div class="modal-overlay">
                <div class="modal-card glass-panel" style="max-width:700px; max-height:85vh; overflow-y:auto;">
                    <div class="modal-header">
                        <h2>💾 Game Save & Cloud Database</h2>
                        <button class="close-btn" onclick="GameManager.closeModal()">&times;</button>
                    </div>

                    <!-- Cloud Database Realtime Sync Box -->
                    <div class="cloud-db-box glass-panel" style="margin-bottom:20px; padding:16px; border:1px solid var(--gold);">
                        <h4 style="color:var(--gold); margin-bottom:8px;"><i class="fas fa-cloud-upload-alt"></i> Realtime Cloud Database Sync</h4>
                        <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:12px;">Save progress directly to our online cloud database to sync your character across any computer or mobile browser!</p>

                        <div style="display:flex; gap:10px; margin-bottom:10px; flex-wrap:wrap;">
                            <input type="text" id="cloud-username-input" class="glass-input" placeholder="Enter Hero Account Name (e.g. Yahia_Legend)" style="flex-grow:1; padding:10px; border-radius:8px; border:1px solid var(--glass-border); background:rgba(0,0,0,0.5); color:#fff;">
                            ${player ? `<button class="btn btn-primary" onclick="GameManager.saveToCloudDB()"><i class="fas fa-cloud-upload-alt"></i> Save to Cloud DB</button>` : ''}
                            <button class="btn btn-potion" onclick="GameManager.loadFromCloudDB()"><i class="fas fa-cloud-download-alt"></i> Load from Cloud DB</button>
                        </div>
                        <div id="cloud-status-msg" style="font-size:0.85rem; font-weight:700;"></div>
                    </div>

                    <h4 style="color:var(--text-muted); margin-bottom:10px;">Local Offline Save Slots</h4>
                    <div class="save-slots-list">${slotsHtml}</div>

                    <div style="margin-top:20px; display:flex; gap:10px; justify-content:space-between; align-items:center; flex-wrap:wrap;">
                        <button class="btn btn-secondary" onclick="GameManager.openLeaderboardModal()"><i class="fas fa-trophy"></i> Global Leaderboard</button>
                        <button class="btn btn-secondary" onclick="GameManager.exportSaveCode()">📋 Copy Save Code</button>
                        <button class="btn btn-secondary" onclick="GameManager.importSaveCode()">📥 Import Code</button>
                        <button class="btn btn-secondary" onclick="GameManager.closeModal()">Close</button>
                    </div>
                </div>
            </div>
        `;
        this.showModal(modalHtml);
    },

    saveToCloudDB: async function() {
        if (!player) return;
        const inputEl = document.getElementById('cloud-username-input');
        const statusEl = document.getElementById('cloud-status-msg');
        const username = inputEl ? inputEl.value.trim() : '';

        if (!username) {
            if (statusEl) statusEl.innerHTML = '<span style="color:#ff2a5f;">❌ Please enter a Hero Account Name!</span>';
            return;
        }

        if (statusEl) statusEl.innerHTML = '<span style="color:var(--gold);">⏳ Saving hero to Cloud Database...</span>';

        const saveData = {
            timestamp: new Date().toLocaleString(),
            currentStage: this.currentStage,
            currentNodeIndex: this.currentNodeIndex,
            difficulty: this.difficulty,
            playerData: {
                classType: player.classType,
                level: player.level,
                xp: player.xp,
                gold: player.gold,
                str: player.str,
                agi: player.agi,
                int: player.int,
                vit: player.vit,
                statPoints: player.statPoints,
                equipment: player.equipment,
                companion: player.companion,
                socketedGem: player.socketedGem,
                specialization: player.specialization,
                blessings: player.blessings,
                achievements: player.achievements
            }
        };

        try {
            await CloudDatabase.saveToCloud(username, saveData);
            SoundEngine.playLevelUp();
            if (statusEl) statusEl.innerHTML = `<span style="color:var(--heal-green);">✓ Successfully saved hero '${username}' to Cloud DB!</span>`;
        } catch (err) {
            if (statusEl) statusEl.innerHTML = `<span style="color:#ff2a5f;">❌ Cloud DB error: ${err.message}</span>`;
        }
    },

    loadFromCloudDB: async function() {
        const inputEl = document.getElementById('cloud-username-input');
        const statusEl = document.getElementById('cloud-status-msg');
        const username = inputEl ? inputEl.value.trim() : '';

        if (!username) {
            if (statusEl) statusEl.innerHTML = '<span style="color:#ff2a5f;">❌ Please enter your Hero Account Name!</span>';
            return;
        }

        if (statusEl) statusEl.innerHTML = '<span style="color:var(--gold);">⏳ Fetching hero from Cloud Database...</span>';

        try {
            const data = await CloudDatabase.loadFromCloud(username);
            const pData = data.saveData.playerData;

            player = new Player(pData.classType);
            player.level = pData.level;
            player.xp = pData.xp;
            player.gold = pData.gold;
            player.str = pData.str;
            player.agi = pData.agi;
            player.int = pData.int;
            player.vit = pData.vit;
            player.statPoints = pData.statPoints;
            player.equipment = pData.equipment;
            player.companion = pData.companion;
            player.socketedGem = pData.socketedGem;
            player.specialization = pData.specialization;
            player.blessings = pData.blessings || [];
            player.achievements = pData.achievements || [];

            if (player.specialization) player.setSpecialization(player.specialization);
            player.recalculateStats();

            this.currentStage = data.saveData.currentStage || 1;
            this.currentNodeIndex = data.saveData.currentNodeIndex || 0;
            this.difficulty = data.saveData.difficulty || 'normal';

            SoundEngine.playLevelUp();
            this.closeModal();
            this.renderDungeonMap();
            this.logAction(`Loaded Cloud DB Hero <strong>'${username}'</strong>: Level ${player.level} ${player.classType} on Stage ${this.currentStage}!`, 'info');
        } catch (err) {
            if (statusEl) statusEl.innerHTML = `<span style="color:#ff2a5f;">❌ Could not load: ${err.message}</span>`;
        }
    },

    openLeaderboardModal: async function() {
        SoundEngine.playClick();
        this.showModal(`
            <div class="modal-overlay">
                <div class="modal-card glass-panel text-center" style="max-width:600px;">
                    <h2 style="color:var(--gold); font-size:2rem;"><i class="fas fa-trophy"></i> Global Cloud DB Leaderboard</h2>
                    <p style="color:var(--text-muted); margin-bottom:16px;">Top players worldwide fetched from Cloud Database</p>
                    <div id="leaderboard-content" style="min-height:180px; display:flex; align-items:center; justify-content:center;">
                        <span style="color:var(--gold);">⏳ Loading global scores...</span>
                    </div>
                    <div style="margin-top:20px; text-align:right;">
                        <button class="btn btn-secondary" onclick="GameManager.closeModal()">Close</button>
                    </div>
                </div>
            </div>
        `);

        const list = await CloudDatabase.fetchLeaderboard();
        const contentEl = document.getElementById('leaderboard-content');
        if (!contentEl) return;

        if (list.length === 0) {
            contentEl.innerHTML = '<p style="color:var(--text-muted);">No cloud records found yet. Be the first to save your hero to Cloud DB!</p>';
            return;
        }

        const rowsHtml = list.map((item, index) => `
            <div class="leaderboard-row ${index === 0 ? 'rank-gold' : (index === 1 ? 'rank-silver' : (index === 2 ? 'rank-bronze' : ''))}">
                <div class="rank-num">#${index + 1}</div>
                <div class="rank-user"><strong>${item.username}</strong> (${item.classType} Lvl ${item.level})</div>
                <div class="rank-score">Stage ${item.stage} | 🪙 ${item.gold} Gold</div>
            </div>
        `).join('');

        contentEl.innerHTML = `<div class="leaderboard-list">${rowsHtml}</div>`;
    },

    saveToSlot: function(slotIdx) {
        if (!player) return;
        const saveData = {
            timestamp: new Date().toLocaleString(),
            currentStage: this.currentStage,
            currentNodeIndex: this.currentNodeIndex,
            difficulty: this.difficulty,
            playerData: {
                classType: player.classType,
                level: player.level,
                xp: player.xp,
                gold: player.gold,
                str: player.str,
                agi: player.agi,
                int: player.int,
                vit: player.vit,
                statPoints: player.statPoints,
                equipment: player.equipment,
                companion: player.companion,
                socketedGem: player.socketedGem,
                specialization: player.specialization,
                blessings: player.blessings,
                achievements: player.achievements
            }
        };
        localStorage.setItem(`dungeon_crawl_save_slot_${slotIdx}`, JSON.stringify(saveData));
        SoundEngine.playLevelUp();
        alert(`Saved successfully to Slot ${slotIdx}!`);
        this.openSaveLoadModal();
    },

    loadFromSlot: function(slotIdx) {
        const raw = localStorage.getItem(`dungeon_crawl_save_slot_${slotIdx}`);
        if (!raw) return;
        const data = JSON.parse(raw);
        const pData = data.playerData;

        player = new Player(pData.classType);
        player.level = pData.level;
        player.xp = pData.xp;
        player.gold = pData.gold;
        player.str = pData.str;
        player.agi = pData.agi;
        player.int = pData.int;
        player.vit = pData.vit;
        player.statPoints = pData.statPoints;
        player.equipment = pData.equipment;
        player.companion = pData.companion;
        player.socketedGem = pData.socketedGem;
        player.specialization = pData.specialization;
        player.blessings = pData.blessings || [];
        player.achievements = pData.achievements || [];

        if (player.specialization) player.setSpecialization(player.specialization);
        player.recalculateStats();

        this.currentStage = data.currentStage || 1;
        this.currentNodeIndex = data.currentNodeIndex || 0;
        this.difficulty = data.difficulty || 'normal';

        SoundEngine.playLevelUp();
        this.closeModal();
        this.renderDungeonMap();
        this.logAction(`Loaded Save Slot ${slotIdx}: <strong style="color:var(--gold)">Level ${player.level} ${player.classType}</strong> on Stage ${this.currentStage}!`, 'info');
    },

    deleteSlot: function(slotIdx) {
        localStorage.removeItem(`dungeon_crawl_save_slot_${slotIdx}`);
        SoundEngine.playClick();
        this.openSaveLoadModal();
    },

    exportSaveCode: function() {
        if (!player) return;
        const raw = localStorage.getItem('dungeon_crawl_save_slot_1') || localStorage.getItem('antigravity_rpg_save');
        if (!raw) return;
        const code = btoa(raw);
        navigator.clipboard.writeText(code);
        alert("Save Code copied to clipboard! Paste it anytime to restore your game.");
    },

    importSaveCode: function() {
        const code = prompt("Paste your Save Code below:");
        if (!code) return;
        try {
            const raw = atob(code);
            localStorage.setItem('dungeon_crawl_save_slot_1', raw);
            this.loadFromSlot(1);
        } catch (e) {
            alert("Invalid Save Code!");
        }
    },

    openShrineModal: function() {
        SoundEngine.playClick();
        const modalHtml = `
            <div class="modal-overlay" onclick="if(event.target === this) GameManager.closeShrineModal()">
                <div class="modal-card glass-panel" style="max-width:600px;">
                    <div class="modal-header">
                        <h2 style="color:var(--mana-blue); font-size:2rem; margin:0;">🏛️ Ancient Rune Shrine</h2>
                        <button class="close-btn" onclick="GameManager.closeShrineModal()">&times;</button>
                    </div>
                    <p style="color:var(--text-muted); margin:12px 0 20px 0;">Choose a permanent blessing to empower your hero for the remainder of this stage!</p>

                    <div class="shrine-options">
                        <div class="shrine-card" onclick="GameManager.claimShrine('crit')">
                            <h4>🔥 Blessing of Precision</h4>
                            <p>+20% Critical Hit Chance</p>
                        </div>
                        <div class="shrine-card" onclick="GameManager.claimShrine('maxHp')">
                            <h4>🛡️ Blessing of Endurance</h4>
                            <p>+30% Max HP & Full Heal</p>
                        </div>
                        <div class="shrine-card" onclick="GameManager.claimShrine('dodge')">
                            <h4>⚡ Blessing of Swiftness</h4>
                            <p>+15% Dodge Chance</p>
                        </div>
                    </div>

                    <div style="margin-top:24px; text-align:right;">
                        <button class="btn btn-secondary" onclick="GameManager.closeShrineModal()"><i class="fas fa-times"></i> Skip Shrine & Exit</button>
                    </div>
                </div>
            </div>
        `;
        this.showModal(modalHtml);
    },

    closeShrineModal: function() {
        this.closeModal();
        this.advanceMapNode();
    },

    claimShrine: function(type) {
        if (!player.blessings.includes(type)) player.blessings.push(type);
        player.recalculateStats();
        player.health = player.maxHealth;
        SoundEngine.playLevelUp();
        this.closeModal();
        this.logAction(`Claimed Shrine Blessing: <strong>${type}</strong>!`, 'info');
        this.advanceMapNode();
    },

    openTreasureModal: function() {
        SoundEngine.playClick();
        const goldWon = Math.floor(Math.random() * 80 + 50);
        player.gold += goldWon;
        player.potions.hpPotion += 1;
        player.potions.mpPotion += 1;
        SoundEngine.playLevelUp();

        const modalHtml = `
            <div class="modal-overlay" onclick="if(event.target === this) { GameManager.closeModal(); GameManager.advanceMapNode(); }">
                <div class="modal-card glass-panel text-center" style="max-width:500px;">
                    <div class="modal-header" style="justify-content:flex-end;">
                        <button class="close-btn" onclick="GameManager.closeModal(); GameManager.advanceMapNode()">&times;</button>
                    </div>
                    <h2 style="color:var(--gold); font-size:2rem; margin-top:-10px;">🎁 Hidden Treasure Vault!</h2>
                    <p style="margin-top:12px;">You opened an ancient chest and found:</p>
                    <div style="font-size:1.3rem; margin:16px 0; color:var(--gold);">
                        🪙 +${goldWon} Gold <br>
                        ❤️ +1 HP Potion | 🧪 +1 MP Potion
                    </div>
                    <button class="btn btn-primary" onclick="GameManager.closeModal(); GameManager.advanceMapNode()">Collect & Continue</button>
                </div>
            </div>
        `;
        this.showModal(modalHtml);
    },

    openSpecializationModal: function() {
        SoundEngine.playClick();
        const specs = CLASS_SPECIALIZATIONS[player.classType] || CLASS_SPECIALIZATIONS.Warrior;
        const optionsHtml = specs.map((s, idx) => `
            <div class="spec-card glass-panel" onclick="GameManager.selectSpecialization(${idx})">
                <h3>${s.name}</h3>
                <p>${s.desc}</p>
                <div class="spec-skill-tag">Legendary Skill: <strong>${s.skill.name}</strong> (${s.skill.desc})</div>
            </div>
        `).join('');

        const modalHtml = `
            <div class="modal-overlay" onclick="if(event.target === this) GameManager.closeModal()">
                <div class="modal-card glass-panel text-center" style="max-width:650px;">
                    <div class="modal-header">
                        <h2>⭐ Level 5 Class Mastery</h2>
                        <button class="close-btn" onclick="GameManager.closeModal()">&times;</button>
                    </div>
                    <p style="color:var(--text-muted); margin-bottom:20px;">Select your sub-class specialization to unlock a 5th Legendary Skill and passive boosts!</p>
                    <div class="spec-grid">${optionsHtml}</div>
                    <div style="margin-top:20px; text-align:right;">
                        <button class="btn btn-secondary" onclick="GameManager.closeModal()">Decide Later</button>
                    </div>
                </div>
            </div>
        `;
        this.showModal(modalHtml);
    },

    selectSpecialization: function(idx) {
        const specs = CLASS_SPECIALIZATIONS[player.classType] || CLASS_SPECIALIZATIONS.Warrior;
        const selected = specs[idx];
        if (selected) {
            player.setSpecialization(selected);
            SoundEngine.playLevelUp();
            this.logAction(`Unlocked Mastery: <strong style="color:var(--gold)">${selected.name}</strong>!`, 'info');
        }
        this.closeModal();
    },

    openInventoryModal: function() {
        SoundEngine.playClick();
        const modalHtml = `
            <div class="modal-overlay">
                <div class="modal-card glass-panel" style="max-width:650px;">
                    <div class="modal-header">
                        <h2>🎒 Character Gear & Attributes</h2>
                        <button class="close-btn" onclick="GameManager.closeModal()">&times;</button>
                    </div>
                    
                    <div class="gear-grid">
                        <div class="gear-slot">
                            <label>Weapon</label>
                            <div class="item-name">${player.equipment.weapon.name}</div>
                            <div class="item-stat">+${player.equipment.weapon.str || 0} STR</div>
                        </div>
                        <div class="gear-slot">
                            <label>Socketed Gem</label>
                            <div class="item-name" style="color:${player.socketedGem ? player.socketedGem.color : '#aaa'}">
                                ${player.socketedGem ? player.socketedGem.name : 'Empty Socket'}
                            </div>
                            <div class="item-stat">${player.socketedGem ? player.socketedGem.stat : 'No gem socketed'}</div>
                        </div>
                        <div class="gear-slot">
                            <label>Companion</label>
                            <div class="item-name">${player.companion ? player.companion.name : 'None Recruited'}</div>
                        </div>
                    </div>

                    <div class="stats-detail-box" style="margin-top:16px;">
                        <div><strong>STR:</strong> ${player.TotalStr} | <strong>AGI:</strong> ${player.TotalAgi} | <strong>INT:</strong> ${player.TotalInt} | <strong>VIT:</strong> ${player.TotalVit}</div>
                        <div><strong>Crit Chance:</strong> ${Math.floor(player.CritChance*100)}% | <strong>Dodge:</strong> ${Math.floor(player.DodgeChance*100)}%</div>
                        <div><strong>Stat Points Available:</strong> ${player.statPoints}</div>
                    </div>

                    <div style="margin-top:20px; text-align:right;">
                        ${player.statPoints > 0 ? `<button class="btn btn-potion" onclick="GameManager.closeModal(); GameManager.openStatModal()">Allocate Stat Points (${player.statPoints})</button>` : ''}
                        <button class="btn btn-secondary" onclick="GameManager.closeModal()">Close</button>
                    </div>
                </div>
            </div>
        `;
        this.showModal(modalHtml);
    },

    openShopModal: function(isMapNode = false) {
        if (isMapNode) this.isCurrentNodeMerchant = true;
        SoundEngine.playClick();
        let weaponOptions = SHOP_ITEMS.weapons.map((w, idx) => `
            <div class="shop-item glass-panel" id="shop-item-weapon-${idx}">
                <div><strong>${w.name}</strong> <div class="item-desc">${w.desc}</div></div>
                <button class="btn btn-primary" onclick="GameManager.buyGear('weapon', ${idx})">Buy 🪙${w.price}</button>
            </div>
        `).join('');

        let companionOptions = Object.keys(COMPANIONS).map(key => {
            const comp = COMPANIONS[key];
            return `
                <div class="shop-item glass-panel" id="shop-item-comp-${key}">
                    <div><strong>${comp.name}</strong> (${comp.title}) <div class="item-desc">${comp.desc}</div></div>
                    <button class="btn btn-potion" onclick="GameManager.buyCompanion('${key}')">Hire 🪙${comp.price}</button>
                </div>
            `;
        }).join('');

        let gemOptions = Object.keys(GEMS).map(key => {
            const g = GEMS[key];
            return `
                <div class="shop-item glass-panel" id="shop-item-gem-${key}">
                    <div style="color:${g.color}"><strong>${g.name}</strong> <div class="item-desc">${g.stat}</div></div>
                    <button class="btn btn-primary" onclick="GameManager.buyGem('${key}')">Buy 🪙${g.price}</button>
                </div>
            `;
        }).join('');

        const modalHtml = `
            <div class="modal-overlay">
                <div class="modal-card glass-panel" id="merchant-shop-card" style="max-width:720px; max-height:85vh; overflow-y:auto;">
                    <div class="modal-header">
                        <h2>🛒 Dungeon Merchant Shop</h2>
                        <span class="gold-badge">🪙 Gold: ${player.gold}</span>
                        <button class="close-btn" onclick="GameManager.closeShopModal()">&times;</button>
                    </div>

                    <div id="shop-error-toast" style="display:none; margin-bottom:12px; padding:10px 16px; border-radius:10px; background:rgba(255,42,95,0.2); border:1px solid var(--crimson); color:#ff2a5f; font-weight:800; text-align:center;"></div>

                    <div class="shop-section">
                        <h4>🐾 Party Companions</h4>
                        ${companionOptions}
                        <h4>💎 Socketable Elemental Gems</h4>
                        ${gemOptions}
                        <h4>⚔️ Weapons & Gear</h4>
                        ${weaponOptions}
                    </div>

                    <div style="margin-top:16px; text-align:right;">
                        <button class="btn btn-secondary" onclick="GameManager.closeShopModal()">Exit Shop</button>
                    </div>
                </div>
            </div>
        `;
        this.showModal(modalHtml);
    },

    closeShopModal: function() {
        this.closeModal();
        if (this.isCurrentNodeMerchant) {
            this.isCurrentNodeMerchant = false;
            this.advanceMapNode();
        }
    },

    showInsufficientFunds: function(elementId, neededAmt, currencyType = 'Gold') {
        SoundEngine.playError();
        const toastEl = document.getElementById('shop-error-toast');
        const cardEl = document.getElementById(elementId) || document.getElementById('merchant-shop-card');

        if (cardEl) {
            cardEl.classList.add('shake-active');
            setTimeout(() => cardEl.classList.remove('shake-active'), 400);
        }

        if (toastEl) {
            toastEl.style.display = 'block';
            toastEl.innerHTML = `⚠️ Insufficient Funds! You need ${neededAmt} ${currencyType} (You have ${currencyType === 'Gold' ? player.gold : (player.coins || 0)})!`;
            setTimeout(() => { toastEl.style.display = 'none'; }, 2500);
        }
    },

    buyCompanion: function(compKey) {
        const comp = COMPANIONS[compKey];
        if (!comp) return;
        if (player.gold < comp.price) {
            this.showInsufficientFunds(`shop-item-comp-${compKey}`, comp.price, 'Gold');
            return;
        }
        player.gold -= comp.price;
        player.companion = comp;
        SoundEngine.playLevelUp();
        this.saveGameData();
        this.openShopModal();
    },

    buyGem: function(gemKey) {
        const gem = GEMS[gemKey];
        if (!gem) return;
        if (player.gold < gem.price) {
            this.showInsufficientFunds(`shop-item-gem-${gemKey}`, gem.price, 'Gold');
            return;
        }
        player.gold -= gem.price;
        player.socketedGem = gem;
        player.recalculateStats();
        SoundEngine.playLevelUp();
        this.saveGameData();
        this.openShopModal();
    },

    buyGear: function(category, idx) {
        let item = category === 'weapon' ? SHOP_ITEMS.weapons[idx] : SHOP_ITEMS.armors[idx];
        if (!item) return;
        if (player.gold < item.price) {
            this.showInsufficientFunds(`shop-item-weapon-${idx}`, item.price, 'Gold');
            return;
        }
        player.gold -= item.price;
        if (category === 'weapon') player.equipment.weapon = item;
        player.recalculateStats();
        SoundEngine.playLevelUp();
        this.saveGameData();
        this.openShopModal();
    },

    openAchievementsModal: function() {
        SoundEngine.playClick();
        const achievementsHtml = ACHIEVEMENTS_LIST.map(a => {
            const unlocked = player.achievements.includes(a.id);
            return `
                <div class="achievement-card ${unlocked ? 'ach-unlocked' : 'ach-locked'}">
                    <div>
                        <strong>${a.title}</strong>
                        <div class="ach-desc">${a.desc}</div>
                    </div>
                    <div class="ach-bonus">${unlocked ? `✓ ${a.bonus}` : '🔒 Locked'}</div>
                </div>
            `;
        }).join('');

        const modalHtml = `
            <div class="modal-overlay">
                <div class="modal-card glass-panel" style="max-width:600px;">
                    <div class="modal-header">
                        <h2>🏆 Trophies & Achievements</h2>
                        <button class="close-btn" onclick="GameManager.closeModal()">&times;</button>
                    </div>
                    <div class="ach-grid">${achievementsHtml}</div>
                </div>
            </div>
        `;
        this.showModal(modalHtml);
    },

    checkAchievement: function(id) {
        if (!player.achievements.includes(id)) {
            player.achievements.push(id);
            SoundEngine.playLevelUp();
            this.logAction(`🏆 Achievement Unlocked: <strong>${id}</strong>!`, 'info');
        }
    },

    openStatModal: function() {
        SoundEngine.playClick();
        const modalHtml = `
            <div class="modal-overlay">
                <div class="modal-card glass-panel" style="max-width:500px;">
                    <div class="modal-header">
                        <h2>🔥 Stat Point Allocation</h2>
                        <span class="stat-pts-badge">Points Remaining: ${player.statPoints}</span>
                    </div>

                    <div class="stat-alloc-list" style="margin-top:16px;">
                        <div class="stat-alloc-row"><span>STR: ${player.str}</span><button class="btn btn-primary" onclick="GameManager.addStat('str')">+1 STR</button></div>
                        <div class="stat-alloc-row"><span>AGI: ${player.agi}</span><button class="btn btn-primary" onclick="GameManager.addStat('agi')">+1 AGI</button></div>
                        <div class="stat-alloc-row"><span>INT: ${player.int}</span><button class="btn btn-primary" onclick="GameManager.addStat('int')">+1 INT</button></div>
                        <div class="stat-alloc-row"><span>VIT: ${player.vit}</span><button class="btn btn-primary" onclick="GameManager.addStat('vit')">+1 VIT</button></div>
                    </div>

                    <div style="margin-top:20px; text-align:right;">
                        <button class="btn btn-secondary" onclick="GameManager.closeModal(); GameManager.updateUI();">Done</button>
                    </div>
                </div>
            </div>
        `;
        this.showModal(modalHtml);
    },

    addStat: function(stat) {
        if (player.statPoints <= 0) return;
        player.statPoints--;
        player[stat]++;
        player.recalculateStats();
        SoundEngine.playClick();
        this.saveGameData();
        this.openStatModal();
    },

    showModal: function(htmlContent) {
        const container = document.getElementById('modal-container');
        if (container) container.innerHTML = htmlContent;
    },

    closeModal: function() {
        const container = document.getElementById('modal-container');
        if (container) container.innerHTML = '';
    },

    updateUI: function() {
        const pHealthTxt = document.getElementById('player-hp-txt');
        const pHealthBar = document.getElementById('player-hp-bar');
        const pManaTxt = document.getElementById('player-mp-txt');
        const pManaBar = document.getElementById('player-mp-bar');
        const pShieldBadge = document.getElementById('player-shield-badge');

        if (pHealthTxt) pHealthTxt.innerText = `${player.health}/${player.maxHealth}`;
        if (pHealthBar) pHealthBar.style.width = `${Math.max(0, (player.health / player.maxHealth) * 100)}%`;
        if (pManaTxt) pManaTxt.innerText = `${player.mana}/${player.maxMana}`;
        if (pManaBar) pManaBar.style.width = `${Math.max(0, (player.mana / player.maxMana) * 100)}%`;

        if (pShieldBadge) {
            pShieldBadge.style.display = player.shield > 0 ? 'block' : 'none';
            pShieldBadge.innerText = `🛡️ ${player.shield}`;
        }

        const eHealthTxt = document.getElementById('enemy-hp-txt');
        const eHealthBar = document.getElementById('enemy-hp-bar');
        if (eHealthTxt) eHealthTxt.innerText = `${enemy.health}/${enemy.maxHealth}`;
        if (eHealthBar) eHealthBar.style.width = `${Math.max(0, (enemy.health / enemy.maxHealth) * 100)}%`;

        const skillsContainer = document.getElementById('skills-container');
        if (skillsContainer) skillsContainer.innerHTML = this.renderSkillButtons();

        this.updateHeaderStats();
    },

    spawnFloatingText: function(targetEl, text, type = 'dmg') {
        if (!targetEl) return;
        const rect = targetEl.getBoundingClientRect();
        const floatEl = document.createElement('div');
        floatEl.className = `floating-text text-${type}`;
        floatEl.innerText = text;
        floatEl.style.left = `${rect.left + rect.width / 2 - 20}px`;
        floatEl.style.top = `${rect.top + 20}px`;
        document.body.appendChild(floatEl);

        setTimeout(() => {
            if (floatEl.parentNode) floatEl.parentNode.removeChild(floatEl);
        }, 1000);
    },

    logAction: function(msg, category = 'info') {
        const logBody = document.getElementById('log-body');
        if (!logBody) return;

        const entry = document.createElement('div');
        entry.className = `log-entry log-${category}`;
        entry.innerHTML = `<span class="log-time">[${new Date().toLocaleTimeString().split(' ')[0]}]</span> ${msg}`;
        logBody.appendChild(entry);
        logBody.scrollTop = logBody.scrollHeight;
    },

    updateHeaderStats: function() {
        const goldEl = document.getElementById('hdr-gold');
        const coinsEl = document.getElementById('hdr-coins');
        const stageEl = document.getElementById('hdr-stage');
        const highEl = document.getElementById('hdr-high');

        if (goldEl) goldEl.innerText = player ? player.gold : 0;
        if (coinsEl) coinsEl.innerText = player ? (player.coins || 0) : 0;
        if (stageEl) stageEl.innerText = this.currentStage;
        if (highEl) highEl.innerText = this.highScore;
    },

    toggleMuteAudio: function() {
        const muted = SoundEngine.toggleMute();
        const btn = document.getElementById('audio-btn');
        if (btn) btn.innerHTML = muted ? '<i class="fas fa-volume-mute"></i> Muted' : '<i class="fas fa-volume-up"></i> Sound ON';
    },

    saveGameData: function() {
        try {
            const data = {
                highScore: this.highScore,
                currentStage: this.currentStage,
                difficulty: this.difficulty,
                playerData: player ? {
                    classType: player.classType,
                    level: player.level,
                    xp: player.xp,
                    gold: player.gold,
                    str: player.str,
                    agi: player.agi,
                    int: player.int,
                    vit: player.vit,
                    statPoints: player.statPoints,
                    achievements: player.achievements
                } : null
            };
            localStorage.setItem('dungeon_crawl_save_slot_1', JSON.stringify(data));
        } catch (e) {}
    },

    loadSaveData: function() {
        try {
            const raw = localStorage.getItem('dungeon_crawl_save_slot_1') || localStorage.getItem('antigravity_rpg_save');
            if (raw) {
                const data = JSON.parse(raw);
                if (data.highScore) this.highScore = data.highScore;
            }
        } catch (e) {}
    }
};

if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => GameManager.init());
    } else {
        GameManager.init();
    }
}