// GameManager.js - Core Turn-Based RPG Engine & State Machine
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

const GameManager = {
    currentStage: 1,
    highScore: 1,
    isTurnInProgress: false,
    gameMode: 'dungeon', // 'dungeon' or 'endless'

    init: function() {
        ParticleEngine.init('fx-canvas');
        this.loadSaveData();
        this.renderHeroSelection();
        this.updateHeaderStats();
    },

    setGameStart: function(classType) {
        player = new Player(classType);
        SoundEngine.playClick();
        this.logAction(`Hero selected: <strong style="color:var(--gold)">${player.classType}</strong> - ${player.title}!`, 'info');
        this.startStage(this.currentStage);
    },

    startStage: function(stageNum) {
        this.currentStage = stageNum;
        if (stageNum > this.highScore) {
            this.highScore = stageNum;
            this.saveGameData();
        }

        // Select Monster based on stage
        let monsterData;
        let scale = 1.0 + (stageNum - 1) * 0.28;

        if (stageNum % 5 === 0) {
            // Boss stage
            monsterData = ENEMY_DATABASE.find(m => m.isBoss && m.tier <= Math.ceil(stageNum / 5)) || ENEMY_DATABASE[ENEMY_DATABASE.length - 1];
        } else {
            const regularMonsters = ENEMY_DATABASE.filter(m => !m.isBoss);
            const mIndex = (stageNum - 1) % regularMonsters.length;
            monsterData = regularMonsters[mIndex];
        }

        enemy = new Enemy(monsterData, scale);
        player.health = player.maxHealth;
        player.mana = player.maxMana;
        player.shield = 0;
        player.skills.forEach(s => s.currentCD = 0);

        this.renderBattleArena();
        this.updateHeaderStats();
        this.logAction(`Encountered stage ${stageNum} foe: <span style="color:#ff4444">${enemy.name}</span>!`, 'warning');
        this.isTurnInProgress = false;
    },

    renderHeroSelection: function() {
        const viewContainer = document.getElementById('main-view');
        if (!viewContainer) return;

        let cardsHtml = '';
        Object.keys(HERO_CLASSES).forEach(key => {
            const hero = HERO_CLASSES[key];
            cardsHtml += `
                <div class="hero-card glass-panel" onclick="GameManager.setGameStart('${key}')" onmouseenter="SoundEngine.playHover()">
                    <div class="hero-img-wrapper">
                        <img src="${hero.img}" alt="${hero.name}" class="hero-portrait">
                        <div class="hero-badge">${hero.name}</div>
                    </div>
                    <h3>${hero.name}</h3>
                    <p class="hero-title">${hero.title}</p>
                    <p class="hero-desc">${hero.desc}</p>
                    <div class="hero-stats-mini">
                        <span><i class="fas fa-heart"></i> HP: ${hero.baseStats.hp}</span>
                        <span><i class="fas fa-bolt"></i> MP: ${hero.baseStats.mp}</span>
                        <span><i class="fas fa-fist-raised"></i> STR: ${hero.baseStats.str}</span>
                        <span><i class="fas fa-running"></i> AGI: ${hero.baseStats.agi}</span>
                    </div>
                    <button class="btn btn-primary" style="margin-top:12px; width:100%;">Choose ${hero.name}</button>
                </div>
            `;
        });

        viewContainer.innerHTML = `
            <div class="hero-select-header">
                <h2>Choose Your Champion</h2>
                <p>Embark on an epic fantasy dungeon crawl. Defeat deadly beasts, harvest legendary loot, and ascend to immortality!</p>
            </div>
            <div class="hero-grid">
                ${cardsHtml}
            </div>
        `;
    },

    renderBattleArena: function() {
        const viewContainer = document.getElementById('main-view');
        if (!viewContainer) return;

        viewContainer.innerHTML = `
            <div class="battle-stage">
                <!-- Player Combat Box -->
                <div class="combat-unit glass-panel" id="player-unit">
                    <div class="unit-portrait-box">
                        <img src="${player.img}" alt="${player.classType}" class="unit-img" id="player-img">
                        <div class="shield-overlay" id="player-shield-badge" style="display:${player.shield > 0 ? 'block' : 'none'}">🛡️ ${player.shield}</div>
                    </div>
                    <div class="unit-info">
                        <h3>${player.classType} <span class="unit-lvl">Lvl ${player.level}</span></h3>
                        <p class="unit-sub">${player.title}</p>

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

                <!-- VS Badge -->
                <div class="vs-divider">
                    <span class="stage-tag">Stage ${this.currentStage}</span>
                    <div class="vs-circle">VS</div>
                </div>

                <!-- Enemy Combat Box -->
                <div class="combat-unit glass-panel" id="enemy-unit">
                    <div class="unit-portrait-box">
                        <img src="${enemy.img}" alt="${enemy.name}" class="unit-img" id="enemy-img">
                        ${enemy.isBoss ? '<div class="boss-crown">👑 BOSS</div>' : ''}
                    </div>
                    <div class="unit-info">
                        <h3 style="color:${enemy.isBoss ? '#ff3366' : '#fff'}">${enemy.name}</h3>
                        <p class="unit-sub">${enemy.isBoss ? 'Dungeon Overseer' : 'Wild Monster'}</p>

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
                    <button class="btn btn-potion" onclick="GameManager.usePotion('hp')" onmouseenter="SoundEngine.playHover()">
                        ❤️ HP Potion (${player.potions.hpPotion})
                    </button>
                    <button class="btn btn-potion" onclick="GameManager.usePotion('mp')" onmouseenter="SoundEngine.playHover()">
                        🧪 MP Potion (${player.potions.mpPotion})
                    </button>
                    <button class="btn btn-secondary" onclick="GameManager.openInventoryModal()" onmouseenter="SoundEngine.playHover()">
                        🎒 Gear & Stats
                    </button>
                    <button class="btn btn-secondary" onclick="GameManager.openShopModal()" onmouseenter="SoundEngine.playHover()">
                        🛒 Merchant
                    </button>
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
        skill.currentCD = skill.cooldown + 1; // set CD

        // Trigger sound & particle
        if (skill.sound === 'slash') SoundEngine.playSlash();
        else if (skill.sound === 'heavyHit') SoundEngine.playHeavyHit();
        else if (skill.sound === 'fireball') SoundEngine.playFireball();
        else if (skill.sound === 'heal') SoundEngine.playHeal();
        else if (skill.sound === 'shield') SoundEngine.playShield();

        const enemyImgEl = document.getElementById('enemy-img');
        const playerImgEl = document.getElementById('player-img');

        if (skill.type === 'physical' || skill.type === 'magic') {
            ParticleEngine.spawnSlashFX(enemyImgEl, skill.element === 'dark' ? '#aa00ff' : '#ff3366');

            // Dodge check
            if (Math.random() < enemy.DodgeChance) {
                this.spawnFloatingText(enemyImgEl, 'DODGED!', 'dodge');
                this.logAction(`${enemy.name} dodged your ${skill.name}!`, 'warning');
            } else {
                // Calculate Damage
                let baseDmg = skill.type === 'magic' ? (player.TotalInt * 2.8) : (player.TotalStr * 2.2);
                let hitMult = skill.mult || 1.0;
                let damage = Math.floor(baseDmg * hitMult + (Math.random() * 8));

                // Crit Check
                let isCrit = Math.random() < player.CritChance;
                if (isCrit) {
                    damage = Math.floor(damage * 1.75);
                    ParticleEngine.triggerShake(16);
                }

                enemy.health = Math.max(0, enemy.health - damage);
                this.spawnFloatingText(enemyImgEl, `-${damage}${isCrit ? ' CRIT!' : ''}`, isCrit ? 'crit' : 'dmg');
                this.logAction(`You cast <strong>${skill.name}</strong> dealing <span style="color:#ff4444">${damage} damage</span>${isCrit ? ' (CRITICAL HIT!)' : ''}.`, 'player');

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
            this.logAction(`You cast <strong>${skill.name}</strong> granting defensive benefits!`, 'info');
        } else if (skill.type === 'heal') {
            const healAmt = Math.floor(player.maxHealth * (skill.healPercent || 0.3));
            player.health = Math.min(player.maxHealth, player.health + healAmt);
            ParticleEngine.spawnSpellFX(playerImgEl, 'heal');
            this.spawnFloatingText(playerImgEl, `+${healAmt} HP`, 'heal');
            this.logAction(`You cast <strong>${skill.name}</strong> restoring <span style="color:#00ffaa">${healAmt} HP</span>.`, 'info');
        }

        this.updateUI();

        // Check Enemy Death
        if (enemy.health <= 0) {
            setTimeout(() => this.handleVictory(), 600);
            return;
        }

        // Enemy Counter Turn
        setTimeout(() => this.executeEnemyTurn(), 1000);
    },

    executeEnemyTurn: function() {
        const playerImgEl = document.getElementById('player-img');
        const enemySkill = enemy.getRandomSkill();

        // Player Dodge check
        if (Math.random() < player.DodgeChance) {
            this.spawnFloatingText(playerImgEl, 'DODGED!', 'dodge');
            this.logAction(`You dodged ${enemy.name}'s ${enemySkill.name}!`, 'info');
        } else {
            let baseDmg = enemy.strength * 1.8;
            let damage = Math.floor(baseDmg * enemySkill.mult + (Math.random() * 6));
            let isCrit = Math.random() < enemy.CritChance;
            if (isCrit) damage = Math.floor(damage * 1.5);

            // Shield Absorption
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
                this.logAction(`${enemy.name} used <strong>${enemySkill.name}</strong> dealing <span style="color:#ff3366">${damage} damage</span> to you!`, 'enemy');
            }
        }

        // Reduce player skill CDs
        player.updateCooldowns();
        this.updateUI();

        // Check Player Death
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

    handleVictory: function() {
        SoundEngine.playVictory();
        player.gold += enemy.goldReward;
        const leveledUp = player.addXP(enemy.xpReward);

        if (leveledUp) SoundEngine.playLevelUp();
        this.saveGameData();

        const modalHtml = `
            <div class="modal-overlay">
                <div class="modal-card glass-panel text-center animate-bounce">
                    <h2 style="color:var(--gold); font-size:2.4rem;">🎉 VICTORY!</h2>
                    <p class="subtitle">Defeated ${enemy.name}</p>

                    <div class="victory-rewards">
                        <div class="reward-pill"><span>🪙 Gold:</span> <strong>+${enemy.goldReward}</strong></div>
                        <div class="reward-pill"><span>⭐ EXP:</span> <strong>+${enemy.xpReward}</strong></div>
                    </div>

                    ${leveledUp ? `<div class="level-up-banner">🔥 LEVEL UP! You reached Level ${player.level}! +3 Stat Points Earned!</div>` : ''}

                    <div style="margin-top:24px; display:flex; gap:12px; justify-content:center;">
                        <button class="btn btn-primary" onclick="GameManager.closeModal(); GameManager.startStage(${this.currentStage + 1})">Next Stage (${this.currentStage + 1})</button>
                        <button class="btn btn-secondary" onclick="GameManager.closeModal(); GameManager.openShopModal()">Merchant Shop</button>
                        ${player.statPoints > 0 ? `<button class="btn btn-potion" onclick="GameManager.closeModal(); GameManager.openStatModal()">Allocate Stats (${player.statPoints})</button>` : ''}
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
                    <p class="subtitle">You were vanquished by ${enemy.name} on Stage ${this.currentStage}.</p>

                    <div style="margin-top:24px; display:flex; gap:12px; justify-content:center;">
                        <button class="btn btn-primary" onclick="GameManager.closeModal(); GameManager.startStage(${this.currentStage})">Retry Stage ${this.currentStage}</button>
                        <button class="btn btn-secondary" onclick="GameManager.closeModal(); GameManager.renderHeroSelection()">Change Champion</button>
                    </div>
                </div>
            </div>
        `;
        this.showModal(modalHtml);
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
                            <div class="item-stat">+${player.equipment.weapon.str || 0} STR | +${player.equipment.weapon.int || 0} INT</div>
                        </div>
                        <div class="gear-slot">
                            <label>Armor</label>
                            <div class="item-name">${player.equipment.armor.name}</div>
                            <div class="item-stat">+${player.equipment.armor.vit || 0} Vitality</div>
                        </div>
                        <div class="gear-slot">
                            <label>Accessory</label>
                            <div class="item-name">${player.equipment.accessory.name}</div>
                            <div class="item-stat">+${player.equipment.accessory.agi || 0} Agility</div>
                        </div>
                    </div>

                    <div class="stats-detail-box" style="margin-top:16px;">
                        <div><strong>Strength (STR):</strong> ${player.TotalStr}</div>
                        <div><strong>Agility (AGI):</strong> ${player.TotalAgi} (Crit: ${Math.floor(player.CritChance*100)}%)</div>
                        <div><strong>Intelligence (INT):</strong> ${player.TotalInt}</div>
                        <div><strong>Vitality (VIT):</strong> ${player.TotalVit}</div>
                        <div><strong>Available Stat Points:</strong> ${player.statPoints}</div>
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

    openShopModal: function() {
        SoundEngine.playClick();
        let weaponOptions = SHOP_ITEMS.weapons.map((w, idx) => `
            <div class="shop-item">
                <div><strong>${w.name}</strong> <div class="item-desc">${w.desc}</div></div>
                <button class="btn btn-primary" onclick="GameManager.buyGear('weapon', ${idx})">Buy 🪙${w.price}</button>
            </div>
        `).join('');

        let armorOptions = SHOP_ITEMS.armors.map((a, idx) => `
            <div class="shop-item">
                <div><strong>${a.name}</strong> <div class="item-desc">${a.desc}</div></div>
                <button class="btn btn-primary" onclick="GameManager.buyGear('armor', ${idx})">Buy 🪙${a.price}</button>
            </div>
        `).join('');

        let potionOptions = SHOP_ITEMS.consumables.map((c, idx) => `
            <div class="shop-item">
                <div><strong>${c.name}</strong> <div class="item-desc">${c.desc}</div></div>
                <button class="btn btn-potion" onclick="GameManager.buyConsumable('${c.type}', ${c.price})">Buy 🪙${c.price}</button>
            </div>
        `).join('');

        const modalHtml = `
            <div class="modal-overlay">
                <div class="modal-card glass-panel" style="max-width:700px;">
                    <div class="modal-header">
                        <h2>🛒 Dungeon Merchant Shop</h2>
                        <span class="gold-badge">🪙 Gold: ${player.gold}</span>
                        <button class="close-btn" onclick="GameManager.closeModal()">&times;</button>
                    </div>

                    <div class="shop-section">
                        <h4>⚔️ Weapons</h4>
                        ${weaponOptions}
                        <h4>🛡️ Armors & Accessories</h4>
                        ${armorOptions}
                        <h4>🧪 Consumables</h4>
                        ${potionOptions}
                    </div>

                    <div style="margin-top:16px; text-align:right;">
                        <button class="btn btn-secondary" onclick="GameManager.closeModal()">Exit Shop</button>
                    </div>
                </div>
            </div>
        `;
        this.showModal(modalHtml);
    },

    buyGear: function(category, idx) {
        let item = category === 'weapon' ? SHOP_ITEMS.weapons[idx] : SHOP_ITEMS.armors[idx];
        if (!item || player.gold < item.price) {
            alert("Not enough gold!");
            return;
        }
        player.gold -= item.price;
        if (category === 'weapon') player.equipment.weapon = item;
        else player.equipment.armor = item;

        player.recalculateStats();
        SoundEngine.playLevelUp();
        this.saveGameData();
        this.openShopModal();
    },

    buyConsumable: function(type, price) {
        if (player.gold < price) {
            alert("Not enough gold!");
            return;
        }
        player.gold -= price;
        player.potions[type]++;
        SoundEngine.playLevelUp();
        this.saveGameData();
        this.openShopModal();
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
                        <div class="stat-alloc-row">
                            <span>Strength (STR: ${player.str})</span>
                            <button class="btn btn-primary" onclick="GameManager.addStat('str')">+1 STR</button>
                        </div>
                        <div class="stat-alloc-row">
                            <span>Agility (AGI: ${player.agi})</span>
                            <button class="btn btn-primary" onclick="GameManager.addStat('agi')">+1 AGI</button>
                        </div>
                        <div class="stat-alloc-row">
                            <span>Intelligence (INT: ${player.int})</span>
                            <button class="btn btn-primary" onclick="GameManager.addStat('int')">+1 INT</button>
                        </div>
                        <div class="stat-alloc-row">
                            <span>Vitality (VIT: ${player.vit})</span>
                            <button class="btn btn-primary" onclick="GameManager.addStat('vit')">+1 VIT</button>
                        </div>
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
                    equipment: player.equipment,
                    potions: player.potions
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

window.addEventListener('DOMContentLoaded', () => {
    GameManager.init();
});