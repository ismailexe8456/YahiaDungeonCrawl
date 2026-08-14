// GameManager.js - Core Turn-Based RPG Engine, Roguelike Map, & Expansion Systems
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

    init: function() {
        const viewContainer = document.getElementById('main-view');
        if (!viewContainer) {
            setTimeout(() => GameManager.init(), 50);
            return;
        }
        try {
            ParticleEngine.init('fx-canvas');
            this.loadSaveData();
            this.renderHeroSelection();
            this.updateHeaderStats();
        } catch (e) {
            console.error("Game initialization error:", e);
        }
    },

    setGameStart: function(classType) {
        player = new Player(classType);
        SoundEngine.playClick();
        this.logAction(`Hero selected: <strong style="color:var(--gold)">${player.classType}</strong> - ${player.title}!`, 'info');
        this.startStageMap(this.currentStage);
    },

    startStageMap: function(stageNum) {
        this.currentStage = stageNum;
        if (stageNum > this.highScore) {
            this.highScore = stageNum;
            this.saveGameData();
        }

        // Generate 5 Map Nodes for the stage
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
                <h2 style="font-family:'Cinzel',serif; color:var(--gold); font-size:2rem; margin-bottom:6px;">
                    🗺️ Stage ${this.currentStage} Expedition Map
                </h2>
                <p style="color:var(--text-muted); margin-bottom:30px;">Navigate node paths to fight beasts, claim ancient shrine blessings, and challenge stage bosses!</p>

                <div class="map-nodes-container">
                    ${nodesHtml}
                </div>

                <div style="margin-top:40px; display:flex; gap:16px; justify-content:center;">
                    <button class="btn btn-secondary" onclick="GameManager.openInventoryModal()"><i class="fas fa-user-shield"></i> Hero Inventory</button>
                    <button class="btn btn-secondary" onclick="GameManager.openAchievementsModal()"><i class="fas fa-trophy"></i> Achievements</button>
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
        let scale = 1.0 + (this.currentStage - 1) * 0.3;
        let monsterData;

        if (isBossStage) {
            monsterData = ENEMY_DATABASE.find(m => m.isBoss && m.tier <= Math.ceil(this.currentStage / 2)) || ENEMY_DATABASE[ENEMY_DATABASE.length - 1];
        } else {
            const regularMonsters = ENEMY_DATABASE.filter(m => !m.isBoss);
            monsterData = regularMonsters[(this.currentStage + this.currentNodeIndex) % regularMonsters.length];
        }

        enemy = new Enemy(monsterData, scale);
        player.shield = 0;
        player.skills.forEach(s => s.currentCD = 0);

        this.renderBattleArena();
        this.updateHeaderStats();
        this.logAction(`Encountered: <span style="color:${enemy.isBoss ? '#ff3366' : '#ff9900'}">${enemy.name}</span>!`, 'warning');
        this.isTurnInProgress = false;
    },

    renderBattleArena: function() {
        const viewContainer = document.getElementById('main-view');
        if (!viewContainer) return;

        viewContainer.innerHTML = `
            <div class="battle-stage">
                <!-- Player & Companion Combat Unit -->
                <div class="combat-unit glass-panel" id="player-unit">
                    <div class="unit-portrait-box">
                        <img src="${player.img}" alt="${player.classType}" class="unit-img" id="player-img">
                        <div class="shield-overlay" id="player-shield-badge" style="display:${player.shield > 0 ? 'block' : 'none'}">🛡️ ${player.shield}</div>
                    </div>
                    
                    ${player.companion ? `
                        <div class="companion-badge">
                            🐾 ${player.companion.name} (${player.companion.title})
                        </div>
                    ` : ''}

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

                <!-- Enemy Combat Unit -->
                <div class="combat-unit glass-panel" id="enemy-unit">
                    <div class="unit-portrait-box">
                        <img src="${enemy.img}" alt="${enemy.name}" class="unit-img" id="enemy-img">
                        ${enemy.isBoss ? '<div class="boss-crown">👑 BOSS</div>' : ''}
                    </div>
                    <div class="unit-info">
                        <h3 style="color:${enemy.isBoss ? '#ff3366' : '#fff'}">${enemy.name}</h3>
                        <p class="unit-sub" id="enemy-phase-txt">${enemy.inPhase2 ? '🔥 ENRAGED PHASE 2' : (enemy.isBoss ? 'Dungeon Overseer' : 'Wild Beast')}</p>

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
                    <button class="btn btn-potion" onclick="GameManager.usePotion('hp')">❤️ HP (${player.potions.hpPotion})</button>
                    <button class="btn btn-potion" onclick="GameManager.usePotion('mp')">🧪 MP (${player.potions.mpPotion})</button>
                    <button class="btn btn-secondary" onclick="GameManager.openInventoryModal()">🎒 Gear & Gems</button>
                    <button class="btn btn-secondary" onclick="GameManager.openShopModal()">🛒 Merchant</button>
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
        return player.skills.map((skill, index) => {
            const disabled = skill.currentCD > 0 || player.mana < skill.manaCost;
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

        if (skill.type === 'physical' || skill.type === 'magic') {
            ParticleEngine.spawnSlashFX(enemyImgEl, skill.element === 'dark' ? '#aa00ff' : '#ff3366');

            if (Math.random() < enemy.DodgeChance) {
                this.spawnFloatingText(enemyImgEl, 'DODGED!', 'dodge');
                this.logAction(`${enemy.name} dodged your ${skill.name}!`, 'warning');
            } else {
                let baseDmg = skill.type === 'magic' ? (player.TotalInt * 2.8) : (player.TotalStr * 2.2);
                let hitMult = skill.mult || 1.0;
                let damage = Math.floor(baseDmg * hitMult + (Math.random() * 8));

                let isCrit = Math.random() < player.CritChance;
                if (isCrit) {
                    damage = Math.floor(damage * 1.8);
                    ParticleEngine.triggerShake(16);
                }

                enemy.health = Math.max(0, enemy.health - damage);
                this.spawnFloatingText(enemyImgEl, `-${damage}${isCrit ? ' CRIT!' : ''}`, isCrit ? 'crit' : 'dmg');
                this.logAction(`You cast <strong>${skill.name}</strong> dealing <span style="color:#ff3366">${damage} damage</span>!`, 'player');

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
            this.logAction(`You cast <strong>${skill.name}</strong>!`, 'info');
        }

        // Check Boss Phase 2 Transition
        if (enemy.checkPhase2()) {
            SoundEngine.playHeavyHit();
            ParticleEngine.triggerShake(20);
            ParticleEngine.spawnSpellFX(enemyImgEl, 'fireball');
            this.logAction(`🔥 WARNING! ${enemy.name} shifted into <strong>ENRAGED PHASE 2</strong>! Damage increased!`, 'warning');
            const phaseTxtEl = document.getElementById('enemy-phase-txt');
            if (phaseTxtEl) phaseTxtEl.innerHTML = '<span style="color:#ff3366; font-weight:800;">🔥 ENRAGED PHASE 2</span>';
        }

        this.updateUI();

        if (enemy.health <= 0) {
            setTimeout(() => this.handleVictory(), 600);
            return;
        }

        // Companion Turn
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
        const enemySkill = enemy.getRandomSkill();

        if (Math.random() < player.DodgeChance) {
            this.spawnFloatingText(playerImgEl, 'DODGED!', 'dodge');
            this.logAction(`You dodged ${enemy.name}'s ${enemySkill.name}!`, 'info');
        } else {
            let baseDmg = enemy.strength * 1.8;
            let damage = Math.floor(baseDmg * enemySkill.mult + (Math.random() * 6));
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
                this.logAction(`Used Health Potion, restored ${restored} HP.`, 'info');
                this.checkAchievement('potion_hoarder');
            }
        } else if (type === 'mp') {
            const restored = player.useMpPotion();
            if (restored) {
                this.spawnFloatingText(playerImgEl, `+${restored} MP`, 'mp');
                this.logAction(`Used Mana Potion, restored ${restored} MP.`, 'info');
            }
        }
        this.updateUI();
    },

    handleVictory: function() {
        SoundEngine.playVictory();
        player.gold += enemy.goldReward;
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

        const modalHtml = `
            <div class="modal-overlay">
                <div class="modal-card glass-panel text-center animate-bounce">
                    <h2 style="color:var(--gold); font-size:2.4rem;">🎉 VICTORY!</h2>
                    <p class="subtitle">Cleared Node ${this.currentNodeIndex + 1} - Defeated ${enemy.name}</p>

                    <div class="victory-rewards">
                        <div class="reward-pill"><span>🪙 Gold:</span> <strong>+${enemy.goldReward}</strong></div>
                        <div class="reward-pill"><span>⭐ EXP:</span> <strong>+${enemy.xpReward}</strong></div>
                    </div>

                    ${leveledUp ? `<div class="level-up-banner">🔥 LEVEL UP! Reached Level ${player.level}! +3 Stat Points!</div>` : ''}
                    ${player.level >= 5 && !player.specialization ? `<div class="special-unlock-banner">⭐ SPECIALIZATION UNLOCKED! Pick your Level 5 Hero Mastery!</div>` : ''}

                    <div style="margin-top:24px; display:flex; gap:12px; justify-content:center; flex-wrap:wrap;">
                        <button class="btn btn-primary" onclick="GameManager.closeModal(); GameManager.advanceMapNode()">Continue Map Exploration</button>
                        ${player.level >= 5 && !player.specialization ? `<button class="btn btn-potion" onclick="GameManager.closeModal(); GameManager.openSpecializationModal()">Pick Class Mastery</button>` : ''}
                    </div>
                </div>
            </div>
        `;
        this.showModal(modalHtml);
    },

    handleDefeat: function() {
        SoundEngine.playDefeat();
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

    openShrineModal: function() {
        SoundEngine.playClick();
        const modalHtml = `
            <div class="modal-overlay">
                <div class="modal-card glass-panel text-center" style="max-width:600px;">
                    <h2 style="color:var(--mana-blue); font-size:2rem;">🏛️ Ancient Rune Shrine</h2>
                    <p style="color:var(--text-muted); margin-bottom:20px;">Choose a permanent blessing to empower your hero for the remainder of this stage!</p>

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
                </div>
            </div>
        `;
        this.showModal(modalHtml);
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
            <div class="modal-overlay">
                <div class="modal-card glass-panel text-center" style="max-width:500px;">
                    <h2 style="color:var(--gold); font-size:2rem;">🎁 Hidden Treasure Vault!</h2>
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
            <div class="modal-overlay">
                <div class="modal-card glass-panel text-center" style="max-width:650px;">
                    <h2 style="color:var(--gold); font-size:2rem;">⭐ Level 5 Class Mastery</h2>
                    <p style="color:var(--text-muted); margin-bottom:20px;">Select your sub-class specialization to unlock a 5th Legendary Skill and passive boosts!</p>
                    <div class="spec-grid">${optionsHtml}</div>
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
        SoundEngine.playClick();
        let weaponOptions = SHOP_ITEMS.weapons.map((w, idx) => `
            <div class="shop-item">
                <div><strong>${w.name}</strong> <div class="item-desc">${w.desc}</div></div>
                <button class="btn btn-primary" onclick="GameManager.buyGear('weapon', ${idx})">Buy 🪙${w.price}</button>
            </div>
        `).join('');

        let companionOptions = Object.keys(COMPANIONS).map(key => {
            const comp = COMPANIONS[key];
            return `
                <div class="shop-item">
                    <div><strong>${comp.name}</strong> (${comp.title}) <div class="item-desc">${comp.desc}</div></div>
                    <button class="btn btn-potion" onclick="GameManager.buyCompanion('${key}')">Hire 🪙${comp.price}</button>
                </div>
            `;
        }).join('');

        let gemOptions = Object.keys(GEMS).map(key => {
            const g = GEMS[key];
            return `
                <div class="shop-item">
                    <div style="color:${g.color}"><strong>${g.name}</strong> <div class="item-desc">${g.stat}</div></div>
                    <button class="btn btn-primary" onclick="GameManager.buyGem('${key}')">Buy 🪙${g.price}</button>
                </div>
            `;
        }).join('');

        const modalHtml = `
            <div class="modal-overlay">
                <div class="modal-card glass-panel" style="max-width:720px; max-height:85vh; overflow-y:auto;">
                    <div class="modal-header">
                        <h2>🛒 Dungeon Merchant Shop</h2>
                        <span class="gold-badge">🪙 Gold: ${player.gold}</span>
                        <button class="close-btn" onclick="GameManager.closeModal(); ${isMapNode ? 'GameManager.advanceMapNode();' : ''}">&times;</button>
                    </div>

                    <div class="shop-section">
                        <h4>🐾 Party Companions</h4>
                        ${companionOptions}
                        <h4>💎 Socketable Elemental Gems</h4>
                        ${gemOptions}
                        <h4>⚔️ Weapons & Gear</h4>
                        ${weaponOptions}
                    </div>

                    <div style="margin-top:16px; text-align:right;">
                        <button class="btn btn-secondary" onclick="GameManager.closeModal(); ${isMapNode ? 'GameManager.advanceMapNode();' : ''}">Exit Shop</button>
                    </div>
                </div>
            </div>
        `;
        this.showModal(modalHtml);
    },

    buyCompanion: function(compKey) {
        const comp = COMPANIONS[compKey];
        if (!comp || player.gold < comp.price) {
            alert("Not enough gold!");
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
        if (!gem || player.gold < gem.price) {
            alert("Not enough gold!");
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
        if (!item || player.gold < item.price) {
            alert("Not enough gold!");
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
        const stageEl = document.getElementById('hdr-stage');
        const highEl = document.getElementById('hdr-high');

        if (goldEl) goldEl.innerText = player ? player.gold : 0;
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
            localStorage.setItem('antigravity_rpg_save', JSON.stringify(data));
        } catch (e) {}
    },

    loadSaveData: function() {
        try {
            const raw = localStorage.getItem('antigravity_rpg_save');
            if (raw) {
                const data = JSON.parse(raw);
                if (data.highScore) this.highScore = data.highScore;
            }
        } catch (e) {}
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => GameManager.init());
} else {
    GameManager.init();
}