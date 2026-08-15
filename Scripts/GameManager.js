// GameManager.js - Procedural Roguelite Core Engine, Safe Camp, 10 Stages x 12 Levels, Blacksmith Limits & Shrines
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

const ITEM_DATABASE = {
    'iron_sword': {
        name: 'Iron Sword',
        type: 'Weapon (Tier 1)',
        img: 'characters imgs/items/iron_sword.jpg',
        stats: '+15% Base Attack Power / STR',
        flavor: '"Forged in cold mountain iron, standard issue for dungeon vanguard conquerors."'
    },
    'leather_vest': {
        name: 'Leather Vest',
        type: 'Armor (Tier 1)',
        img: 'characters imgs/items/leather_vest.jpg',
        stats: '+15% Base Max Health / VIT',
        flavor: '"Supple dire-boar hide stitched with heavy iron rivets."'
    },
    'wooden_ring': {
        name: 'Wooden Ring',
        type: 'Accessory (Tier 1)',
        img: 'characters imgs/items/wooden_ring.jpg',
        stats: '+15% Agility & Critical Strike Rate',
        flavor: '"Carved from elder ironwood, attuned to ancient forest spirits."'
    },
    'ruby_gem': {
        name: 'Ruby of Infernal Flame',
        type: 'Socketed Gem',
        img: 'characters imgs/items/ruby_gem.jpg',
        stats: '+20% Fire Spell Power & Lifesteal',
        flavor: '"Pulsating with embers of a slain subterranean fire drake."'
    },
    'sapphire_gem': {
        name: 'Sapphire of Frost Shield',
        type: 'Socketed Gem',
        img: 'characters imgs/items/sapphire_gem.jpg',
        stats: '+25% Max Shield Points & Glacial Ice Armor',
        flavor: '"Crystallized ice that never melts, reinforcing armor barrier."'
    },
    'emerald_gem': {
        name: 'Emerald of Venom Lifesteal',
        type: 'Socketed Gem',
        img: 'characters imgs/items/emerald_gem.jpg',
        stats: '+15% Poison Damage & +10% Lifesteal',
        flavor: '"Dripping with viper toxins that drain vitality from wounded foes."'
    },
    'diamond_gem': {
        name: 'Diamond of Holy Radiance',
        type: 'Socketed Gem',
        img: 'characters imgs/items/diamond_gem.jpg',
        stats: '+30% Holy Spell Power & Undead Smite',
        flavor: '"Pure consecrated diamond prism refracts divine light against shadow fiends."'
    },
    'pet_egg': {
        name: 'Unhatched Mythic Pet Egg',
        type: 'Pet Ally Chamber',
        img: 'characters imgs/items/pet_egg.jpg',
        stats: 'Hatchable Companion (Dire Wolf / Arcane Golem / Holy Cleric)',
        flavor: '"Dormant mythic egg emitting a faint warm pulse. Visit Wandering Merchant to hatch."'
    }
};

const GameManager = {
    currentStage: 1,
    unlockedStage: 1,
    highScore: 1,
    currentNodeIndex: 0,
    runSeed: 48392017,
    merchantSummonsRemaining: 2,
    blacksmithSummonsRemaining: 2,
    blacksmithUpgradesRemaining: 2,
    stageNodes: [],
    isTurnInProgress: false,
    activeWorld: 1,
    permanentMeta: {
        maxHpRanks: 0,
        dmgRanks: 0,
        critRanks: 0,
        darkOrbs: 0
    },

    setGameStart: function(classType, event) {
        if (event && event.stopPropagation) event.stopPropagation();
        try { SoundEngine.playClick(); } catch(e) {}
        this.selectCampHero(classType);
    },

    renderHeroSelect: function() {
        this.renderCampHub();
    },

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

            window.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    GameManager.closeConfirmModal();
                    GameManager.closeInputModal();
                    GameManager.closeModal();
                }
            });

            if (!player) {
                this.renderCampHub();
            }
        } catch (e) {
            console.error("Game initialization error:", e);
        }
    },

    renderCampHub: function() {
        if (typeof document === 'undefined') return;
        const viewContainer = document.getElementById('main-view');
        if (!viewContainer) return;
        this.updateHeaderStats();

        let stageButtonsHtml = '';
        for (let i = 1; i <= 10; i++) {
            const isUnlocked = i <= this.unlockedStage;
            const theme = STAGE_THEMES[i] || STAGE_THEMES[1];
            stageButtonsHtml += `
                <button class="icon-btn ${isUnlocked ? 'stage-unlocked-btn' : 'stage-locked-btn'}" 
                        onclick="${isUnlocked ? `GameManager.startStageMap(${i})` : ''}"
                        style="padding:10px 14px; text-align:left; border:1px solid ${isUnlocked ? 'var(--gold)' : 'var(--border-rune)'}; background:${isUnlocked ? 'var(--bg-inset)' : 'rgba(0,0,0,0.5)'}; color:${isUnlocked ? 'var(--ink)' : 'var(--ink-faint)'}; border-radius:10px; opacity:${isUnlocked ? 1 : 0.5}; cursor:${isUnlocked ? 'pointer' : 'not-allowed'};">
                    <div style="font-family:var(--font-display); font-size:12px; color:${isUnlocked ? 'var(--gold-bright)' : 'var(--ink-faint)'};">
                        <i class="fas ${theme.icon}"></i> STAGE ${i}
                    </div>
                    <div style="font-weight:700; font-size:13px; margin:2px 0;">${theme.name}</div>
                    <div style="font-size:10px;">${isUnlocked ? '👉 START EXPEDITION' : '🔒 CLEAR STAGE ' + (i-1)}</div>
                </button>
            `;
        }

        const darkOrbs = (this.permanentMeta && this.permanentMeta.darkOrbs !== undefined) ? this.permanentMeta.darkOrbs : (player ? player.coins : 0);

        viewContainer.innerHTML = `
            <div class="camp-hub-screen animate-fade-in" style="padding:16px;">
                <div style="text-align:center; margin-bottom:20px;">
                    <h2 style="font-family:var(--font-display); color:var(--gold-bright); font-size:2.2rem; font-weight:700; margin-bottom:4px;">
                        🏕️ Safe Adventurers' Camp
                    </h2>
                    <p style="color:var(--ink-dim); margin-top:4px;">Select your Hero, upgrade permanent meta-stats, and choose an unlocked stage for your procedural expedition!</p>
                </div>

                <!-- Section 1: Hero Class Selection -->
                <div class="panel" style="padding:16px; margin-bottom:20px;">
                    <div class="eyebrow" style="margin-bottom:12px;">Step 1: Choose Your Hero Champion</div>
                    <div class="hero-class-grid" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(140px, 1fr)); gap:10px;">
                        ${this.renderCampClassCard('Warrior', 'Heavy Melee & Iron Shield', 'characters imgs/player/Warrior.jpg')}
                        ${this.renderCampClassCard('Rogue', 'Critical Hit Assassin', 'characters imgs/player/Rouge.jpg')}
                        ${this.renderCampClassCard('Wizard', 'Arcane Burst Sorcerer', 'characters imgs/player/Wizard.jpg')}
                        ${this.renderCampClassCard('Hunter', 'Ranged Bow & Companion', 'characters imgs/player/hunter.jpg')}
                        ${this.renderCampClassCard('Paladin', 'Holy Shield Crusader', 'characters imgs/player/Paladin.jpg')}
                        ${this.renderCampClassCard('Necromancer', 'Shadow Lifesteal Lich', 'characters imgs/player/Necromancer.jpg')}
                    </div>
                </div>

                <!-- Section 2: Permanent Metaprogression Upgrades -->
                <div class="panel" style="padding:16px; margin-bottom:20px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                        <div class="eyebrow">Step 2: Permanent Meta-Progression (🔮 ${darkOrbs} Dark Orbs)</div>
                        <span style="font-size:11px; color:var(--gold-bright);">Persists across all runs & deaths!</span>
                    </div>
                    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(190px, 1fr)); gap:10px;">
                        <div class="glass-panel text-center" style="padding:10px;">
                            <div style="font-weight:700; color:var(--gold);">❤️ Vitality (+2% HP)</div>
                            <div style="font-size:11px; color:var(--ink-dim); margin:4px 0;">Rank: ${this.permanentMeta.maxHpRanks || 0}</div>
                            <button class="btn btn-primary" onclick="GameManager.buyMetaUpgrade('maxHpRanks')" style="width:100%; padding:6px 8px; font-size:11px;">
                                Upgrade (🔮 ${((this.permanentMeta.maxHpRanks || 0) + 1) * 20} Orbs)
                            </button>
                        </div>
                        <div class="glass-panel text-center" style="padding:10px;">
                            <div style="font-weight:700; color:var(--gold);">⚔️ Might (+1.5% Dmg)</div>
                            <div style="font-size:11px; color:var(--ink-dim); margin:4px 0;">Rank: ${this.permanentMeta.dmgRanks || 0}</div>
                            <button class="btn btn-primary" onclick="GameManager.buyMetaUpgrade('dmgRanks')" style="width:100%; padding:6px 8px; font-size:11px;">
                                Upgrade (🔮 ${((this.permanentMeta.dmgRanks || 0) + 1) * 25} Orbs)
                            </button>
                        </div>
                        <div class="glass-panel text-center" style="padding:10px;">
                            <div style="font-weight:700; color:var(--gold);">🎯 Precision (+1% Crit)</div>
                            <div style="font-size:11px; color:var(--ink-dim); margin:4px 0;">Rank: ${this.permanentMeta.critRanks || 0}</div>
                            <button class="btn btn-primary" onclick="GameManager.buyMetaUpgrade('critRanks')" style="width:100%; padding:6px 8px; font-size:11px;">
                                Upgrade (🔮 ${((this.permanentMeta.critRanks || 0) + 1) * 30} Orbs)
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Section 3: Select Stage & Start Expedition -->
                <div class="panel" style="padding:16px;">
                    <div class="eyebrow" style="margin-bottom:12px;">Step 3: Select Unlocked Stage (1 to 10)</div>
                    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:10px;">
                        ${stageButtonsHtml}
                    </div>
                </div>
            </div>
        `;
    },

    renderCampClassCard: function(className, subtitle, imgSrc) {
        const isSelected = player && player.classType === className;
        return `
            <div class="hero-card panel ${isSelected ? 'selected-class' : ''}" 
                 onclick="GameManager.selectCampHero('${className}')" 
                 style="padding:10px; cursor:pointer; border:1.5px solid ${isSelected ? 'var(--gold-bright)' : 'var(--border-rune)'}; background:${isSelected ? 'rgba(217,168,60,0.18)' : 'var(--bg-inset)'}; border-radius:10px; text-align:center;">
                <img src="${imgSrc}" alt="${className}" style="width:48px; height:48px; border-radius:50%; object-fit:cover; margin-bottom:4px;">
                <div style="font-family:var(--font-display); font-size:13px; font-weight:700; color:var(--gold-bright);">${className}</div>
                <div style="font-size:10px; color:var(--ink-dim);">${subtitle}</div>
            </div>
        `;
    },

    selectCampHero: function(className) {
        SoundEngine.playClick();
        player = new Player(className);
        this.applyPermanentMeta();
        this.saveGameData();
        this.renderCampHub();
    },

    buyMetaUpgrade: function(upgradeKey) {
        SoundEngine.playClick();
        if (!this.permanentMeta) this.permanentMeta = { maxHpRanks: 0, dmgRanks: 0, critRanks: 0, darkOrbs: 0 };
        const currentRank = this.permanentMeta[upgradeKey] || 0;
        const costMult = upgradeKey === 'maxHpRanks' ? 20 : (upgradeKey === 'dmgRanks' ? 25 : 30);
        const cost = (currentRank + 1) * costMult;

        const currentOrbs = this.permanentMeta.darkOrbs || (player ? player.coins : 0);
        if (currentOrbs < cost) {
            this.showToast(`Not enough Dark Orbs / Coins (Need 🔮 ${cost})!`, 'warning');
            return;
        }

        this.permanentMeta.darkOrbs -= cost;
        if (player) player.coins = this.permanentMeta.darkOrbs;
        this.permanentMeta[upgradeKey] = currentRank + 1;
        if (player) this.applyPermanentMeta();
        this.saveGameData();
        this.renderCampHub();
        this.showToast(`Upgraded ${upgradeKey} to Rank ${currentRank + 1}!`, 'success');
    },

    applyPermanentMeta: function() {
        if (!player || !this.permanentMeta) return;
        const hpBonus = (this.permanentMeta.maxHpRanks || 0) * 0.02;
        const dmgBonus = (this.permanentMeta.dmgRanks || 0) * 0.015;
        const critBonus = (this.permanentMeta.critRanks || 0) * 0.01;

        player.critBonus = critBonus;
        player.recalculateStats();

        player.maxHealth = Math.floor(player.maxHealth * (1 + hpBonus));
        player.health = player.maxHealth;
        player.str = Math.floor(player.str * (1 + dmgBonus));
    },

    startStageMap: function(stageNum, seed) {
        if (stageNum > 10) stageNum = 10;
        if (!player) {
            player = new Player('Warrior');
            this.applyPermanentMeta();
        }

        this.currentStage = stageNum;
        this.runSeed = seed || ProceduralEngine.generateRunSeed();
        this.merchantSummonsRemaining = 2;
        this.blacksmithSummonsRemaining = 2;
        this.blacksmithUpgradesRemaining = 2;

        const layoutObj = ProceduralEngine.generateStageLayout(stageNum, this.runSeed);
        this.stageNodes = layoutObj.levels;
        this.currentSeedUsed = layoutObj.seed;
        this.currentNodeIndex = 0;

        player.health = player.maxHealth;
        player.mana = player.maxMana;
        player.shield = 0;

        this.saveGameData();
        this.renderDungeonMap();
    },

    renderDungeonMap: function() {
        const viewContainer = document.getElementById('main-view');
        if (!viewContainer) return;

        const theme = STAGE_THEMES[this.currentStage] || STAGE_THEMES[1];
        const currentNode = this.stageNodes[this.currentNodeIndex] || this.stageNodes[0];

        let levelTimelineHtml = this.stageNodes.map((node, index) => {
            const isCompleted = index < this.currentNodeIndex;
            const isCurrent = index === this.currentNodeIndex;
            const isLocked = index > this.currentNodeIndex;

            let badgeColor = 'var(--ink-faint)';
            let statusText = `Lvl ${index + 1}`;
            let clickHandler = '';

            if (isCurrent) {
                badgeColor = 'var(--gold-bright)';
                statusText = '👉 ENTER';
                clickHandler = `GameManager.enterMapNode(${index})`;
            } else if (isCompleted) {
                badgeColor = '#00ffaa';
                statusText = '✓ Cleared';
                clickHandler = ''; // Strictly no backtracking! Cleared levels cannot be revisited.
            } else {
                statusText = '🔒 Locked';
            }

            return `
                <div class="level-slot-card panel ${isCurrent ? 'active-current-slot' : ''} ${isCompleted ? 'cleared-slot' : ''} ${isLocked ? 'locked-slot' : ''}"
                     onclick="${clickHandler}"
                     style="padding:8px 6px; border:1.5px solid ${isCurrent ? 'var(--gold)' : (isCompleted ? '#00ffaa' : 'var(--border-rune)')}; opacity:${isLocked ? 0.45 : 1}; cursor:${isCurrent ? 'pointer' : 'not-allowed'}; text-align:center;">
                    <div style="font-family:var(--font-mono); font-size:9px; color:var(--ink-faint);">LVL ${index + 1}</div>
                    <div class="node-icon" style="font-size:16px; margin:4px 0; color:${badgeColor};">
                        <i class="fas ${node.icon}"></i>
                    </div>
                    <div class="node-title" style="font-size:10px; font-weight:700; color:var(--ink); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${node.type.toUpperCase()}</div>
                    <div class="node-status" style="font-size:9px; color:${badgeColor}; font-weight:700; margin-top:2px;">${statusText}</div>
                </div>
            `;
        }).join('');

        viewContainer.innerHTML = `
            <div class="map-screen text-center animate-fade-in" style="padding:14px;">
                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:12px;">
                    <div>
                        <h2 style="font-family:var(--font-display); color:var(--gold-bright); font-size:1.8rem; margin:0;">
                            <i class="fas ${theme.icon}"></i> STAGE ${this.currentStage}: ${theme.name.toUpperCase()}
                        </h2>
                        <div style="font-size:12px; color:var(--ink-dim); font-weight:600;">
                            PROGRESS: LEVEL ${this.currentNodeIndex + 1} / 12 | RUN SEED: <span style="font-family:var(--font-mono); color:var(--gold);">${this.currentSeedUsed}</span>
                        </div>
                    </div>
                    <button class="icon-btn" onclick="GameManager.renderCampHub()" style="padding:6px 12px;">
                        🏕️ Return to Safe Camp
                    </button>
                </div>

                <div class="panel" style="padding:10px 14px; margin-bottom:16px; display:flex; justify-content:space-around; flex-wrap:wrap; gap:10px; font-size:11.5px; border:1px solid var(--border-rune);">
                    <div>🛒 <strong>MERCHANT SUMMONS:</strong> <span style="color:var(--gold-bright); font-family:var(--font-mono);">${this.merchantSummonsRemaining} / 2</span></div>
                    <div>🔨 <strong>BLACKSMITH SUMMONS:</strong> <span style="color:var(--gold-bright); font-family:var(--font-mono);">${this.blacksmithSummonsRemaining} / 2</span></div>
                    <div>⚡ <strong>BLACKSMITH UPGRADES:</strong> <span style="color:${this.blacksmithUpgradesRemaining > 0 ? 'var(--gold-bright)' : 'var(--crimson)'}; font-family:var(--font-mono);">${this.blacksmithUpgradesRemaining} / 2 ${this.blacksmithUpgradesRemaining === 0 ? '(EXHAUSTED)' : ''}</span></div>
                </div>

                <div style="display:flex; gap:10px; justify-content:center; flex-wrap:wrap; margin-bottom:16px;">
                    <button class="icon-btn" onclick="GameManager.summonMerchant()" ${this.merchantSummonsRemaining <= 0 || this.currentNodeIndex >= 11 ? 'disabled' : ''} style="padding:8px 14px; border:1px solid var(--gold); color:var(--gold-bright);">
                        🛒 Summon Merchant (${this.merchantSummonsRemaining}/2)
                    </button>
                    <button class="icon-btn" onclick="GameManager.summonBlacksmith()" ${this.blacksmithSummonsRemaining <= 0 || this.currentNodeIndex >= 11 || this.blacksmithUpgradesRemaining <= 0 ? 'disabled' : ''} style="padding:8px 14px; border:1px solid var(--gold); color:var(--gold-bright);">
                        🔨 Summon Blacksmith (${this.blacksmithSummonsRemaining}/2)
                    </button>
                </div>

                <div style="display:grid; grid-template-columns:repeat(6, 1fr); gap:8px; margin-bottom:16px;">
                    ${levelTimelineHtml}
                </div>

                <div class="panel" style="padding:14px; background:var(--bg-inset); border:1.5px solid var(--gold); text-align:center;">
                    <div style="font-family:var(--font-display); font-size:14px; color:var(--gold-bright); margin-bottom:4px;">
                        CURRENT LEVEL ${this.currentNodeIndex + 1}: ${currentNode.title.toUpperCase()}
                    </div>
                    <button class="cta animate-bounce" onclick="GameManager.enterMapNode(${this.currentNodeIndex})" style="padding:12px 24px; font-size:1.1rem; width:100%; max-width:360px;">
                        👉 ENTER LEVEL ${this.currentNodeIndex + 1}
                    </button>
                </div>
            </div>
        `;
    },

    summonMerchant: function() {
        if (this.merchantSummonsRemaining <= 0) {
            this.showToast("NO MERCHANT SUMMONS REMAINING FOR THIS STAGE!", "warning");
            return;
        }
        if (this.currentNodeIndex >= 11) {
            this.showToast("CANNOT SUMMON MERCHANT ON BOSS LEVEL!", "warning");
            return;
        }
        SoundEngine.playClick();
        this.merchantSummonsRemaining--;
        this.renderDungeonMap();
        this.openShopModal(false);
    },

    summonBlacksmith: function() {
        if (this.blacksmithSummonsRemaining <= 0) {
            this.showToast("NO BLACKSMITH SUMMONS REMAINING FOR THIS STAGE!", "warning");
            return;
        }
        if (this.currentNodeIndex >= 11) {
            this.showToast("CANNOT SUMMON BLACKSMITH ON BOSS LEVEL!", "warning");
            return;
        }
        if (this.blacksmithUpgradesRemaining <= 0) {
            this.showToast("BLACKSMITH EXHAUSTED: Max 2 upgrades reached for this stage!", "warning");
            return;
        }
        SoundEngine.playClick();
        this.blacksmithSummonsRemaining--;
        this.renderDungeonMap();
        this.openUpgradeModal(false);
    },

    enterMapNode: function(nodeIndex) {
        if (nodeIndex !== this.currentNodeIndex) return;
        const node = this.stageNodes[nodeIndex];
        if (!node) return;

        SoundEngine.playClick();

        if (node.type === 'combat' || node.type === 'elite' || node.type === 'miniboss' || node.type === 'boss') {
            this.startCombatNode(node);
        } else if (node.type === 'shrine') {
            this.openShrineModal(node.shrineType);
        } else if (node.type === 'merchant') {
            this.openShopModal(true);
        } else if (node.type === 'blacksmith') {
            this.openUpgradeModal(true);
        } else if (node.type === 'treasure') {
            this.openTreasureModal();
        } else if (node.type === 'event') {
            this.openEventModal();
        }
    },

    startCombatNode: function(node) {
        if (!player || !node.enemyData) return;
        const isBoss = node.type === 'boss';
        enemy = new Enemy(node.enemyData, this.currentStage, node.isElite);
        this.renderBattleArena();
        this.logAction(`Encountered <strong>'${enemy.name}'</strong> (${enemy.health} HP)!`, 'warning');
    },

    advanceMapNode: function() {
        this.currentNodeIndex++;
        if (this.currentNodeIndex >= 12) {
            this.unlockedStage = Math.min(10, Math.max(this.unlockedStage, this.currentStage + 1));
            this.saveGameData();

            const isCampaignClear = this.currentStage >= 10;
            this.showModal(`
                <div class="modal-overlay">
                    <div class="modal-card glass-panel text-center" style="max-width:540px;">
                        <h2 style="font-family:var(--font-display); color:var(--gold-bright); font-size:2rem; margin-bottom:10px;">
                            ${isCampaignClear ? '🎉 CAMPAIGN COMPLETE!' : '🏆 STAGE ' + this.currentStage + ' CLEARED!'}
                        </h2>
                        <p style="color:var(--ink-dim); margin-bottom:16px;">
                            ${isCampaignClear ? 'You defeated the Lich King of the Abyss and saved the Realm!' : 'You vanquished the Stage Boss! Stage ' + (this.currentStage + 1) + ' is now unlocked in Camp.'}
                        </p>
                        <button class="cta" onclick="GameManager.closeModal(); GameManager.renderCampHub();" style="width:100%;">
                            🏕️ Return to Safe Camp
                        </button>
                    </div>
                </div>
            `);
        } else {
            this.saveGameData();
            this.renderDungeonMap();
        }
    },

    openShrineModal: function(shrineType) {
        SoundEngine.playClick();
        const modalHtml = `
            <div class="modal-overlay">
                <div class="modal-card glass-panel text-center" style="max-width:560px;">
                    <h2 style="font-family:var(--font-display); color:var(--gold-bright); font-size:1.8rem; margin-bottom:6px;">
                        ⛩️ Ancient ${shrineType ? shrineType.toUpperCase() : 'SACRED'} Shrine
                    </h2>
                    <p style="color:var(--ink-dim); margin-bottom:16px;">Step forward and make your offering to the ancient spirits.</p>

                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:20px;">
                        <div class="panel" onclick="GameManager.chooseShrineOption('heal')" style="padding:12px; cursor:pointer; border:1px solid var(--gold);">
                            <div style="font-weight:700; color:#00ffaa;">💚 Healing Blessing</div>
                            <div style="font-size:11px; color:var(--ink-dim);">Restore 40% Max HP</div>
                        </div>
                        <div class="panel" onclick="GameManager.chooseShrineOption('power')" style="padding:12px; cursor:pointer; border:1px solid var(--gold);">
                            <div style="font-weight:700; color:var(--gold-bright);">⚔️ Might Blessing</div>
                            <div style="font-size:11px; color:var(--ink-dim);">+15% Physical & Magic Damage</div>
                        </div>
                        <div class="panel" onclick="GameManager.chooseShrineOption('blood')" style="padding:12px; cursor:pointer; border:1px solid var(--crimson);">
                            <div style="font-weight:700; color:var(--crimson);">🩸 Blood Sacrifice</div>
                            <div style="font-size:11px; color:var(--ink-dim);">Sacrifice 20% HP for 100 Gold & 20 Orbs</div>
                        </div>
                        <div class="panel" onclick="GameManager.chooseShrineOption('defense')" style="padding:12px; cursor:pointer; border:1px solid var(--arcane);">
                            <div style="font-weight:700; color:var(--arcane);">🛡️ Iron Barrier</div>
                            <div style="font-size:11px; color:var(--ink-dim);">+25 Defense & +50 Shield</div>
                        </div>
                    </div>

                    <button class="btn btn-secondary" onclick="GameManager.chooseShrineOption('leave')">Leave Shrine</button>
                </div>
            </div>
        `;
        this.showModal(modalHtml);
    },

    chooseShrineOption: function(opt) {
        SoundEngine.playClick();
        if (opt === 'heal' && player) {
            const healVal = Math.floor(player.maxHealth * 0.40);
            player.health = Math.min(player.maxHealth, player.health + healVal);
            this.showToast(`Shrine restored +${healVal} HP!`, 'success');
        } else if (opt === 'power' && player) {
            player.str = Math.floor(player.str * 1.15);
            this.showToast(`Shrine granted +15% Damage!`, 'success');
        } else if (opt === 'blood' && player) {
            const cost = Math.floor(player.maxHealth * 0.20);
            player.health = Math.max(1, player.health - cost);
            player.gold += 100;
            player.coins = (player.coins || 0) + 20;
            this.showToast(`Blood Shrine: -${cost} HP, +100 Gold, +20 Orbs!`, 'warning');
        } else if (opt === 'defense' && player) {
            player.defense = (player.defense || 10) + 25;
            player.shield = (player.shield || 0) + 50;
            this.showToast(`Shrine granted +25 Defense & +50 Shield!`, 'success');
        }

        this.closeModal();
        this.advanceMapNode();
    },

    openTreasureModal: function() {
        SoundEngine.playClick();
        const goldLoot = Math.floor(50 + Math.random() * 80);
        const coinsLoot = Math.floor(15 + Math.random() * 20);
        if (player) {
            player.gold += goldLoot;
            player.coins = (player.coins || 0) + coinsLoot;
        }

        this.showModal(`
            <div class="modal-overlay">
                <div class="modal-card glass-panel text-center" style="max-width:480px;">
                    <h2 style="font-family:var(--font-display); color:var(--gold-bright); font-size:2rem; margin-bottom:6px;">
                        💎 Ornate Treasure Vault
                    </h2>
                    <p style="color:var(--ink-dim); margin-bottom:16px;">You unlocked an ancient dungeon chest!</p>
                    <div class="victory-rewards" style="margin-bottom:20px;">
                        <div class="reward-pill"><span>🪙 Gold:</span> <strong>+${goldLoot}</strong></div>
                        <div class="reward-pill"><span>⚔️ Victory Coins:</span> <strong>+${coinsLoot}</strong></div>
                    </div>
                    <button class="cta" onclick="GameManager.closeModal(); GameManager.advanceMapNode();" style="width:100%;">
                        Claim Loot & Continue ➡️
                    </button>
                </div>
            </div>
        `);
    },

    openEventModal: function() {
        SoundEngine.playClick();
        this.showModal(`
            <div class="modal-overlay">
                <div class="modal-card glass-panel text-center" style="max-width:520px;">
                    <h2 style="font-family:var(--font-display); color:var(--gold-bright); font-size:1.8rem; margin-bottom:6px;">
                        ❓ Mysterious Wandering Traveler
                    </h2>
                    <p style="color:var(--ink-dim); margin-bottom:16px;">A cloaked hermit offers you a mysterious choice.</p>
                    <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:20px;">
                        <button class="btn btn-primary" onclick="GameManager.chooseEventOption(1)" style="padding:10px;">Accept Mystical Elixir (+100 MP, +30 HP)</button>
                        <button class="btn btn-primary" onclick="GameManager.chooseEventOption(2)" style="padding:10px;">Inspect Ancient Map (+40 Gold)</button>
                    </div>
                    <button class="btn btn-secondary" onclick="GameManager.closeModal(); GameManager.advanceMapNode();">Ignore & Move On</button>
                </div>
            </div>
        `);
    },

    chooseEventOption: function(opt) {
        if (opt === 1 && player) {
            player.health = Math.min(player.maxHealth, player.health + 30);
            player.mana = Math.min(player.maxMana, player.mana + 100);
            this.showToast("Drank Elixir: +30 HP, +100 MP!", "success");
        } else if (opt === 2 && player) {
            player.gold += 40;
            this.showToast("Found Hidden Coins: +40 Gold!", "success");
        }
        this.closeModal();
        this.advanceMapNode();
    },

    renderBattleArena: function() {
        const viewContainer = document.getElementById('main-view');
        if (!viewContainer) return;

        const arenaHtml = `
            <div class="battle-arena-wrapper">
                <div class="panel arena" style="padding:14px; margin-bottom:12px;">
                    <div class="eyebrow" style="margin-bottom:12px;">Stage ${this.currentStage} — Level ${this.currentNodeIndex + 1} / 12</div>
                    
                    <div class="combatants" style="display:flex; align-items:center; gap:10px;">
                        <div class="fighter" style="flex:1; display:flex; flex-direction:column; gap:6px;">
                            <div class="who" style="display:flex; align-items:center; gap:8px;">
                                <div class="medallion" style="width:52px; height:52px;">
                                    <img src="${player.img}" alt="${player.classType}" id="player-img">
                                </div>
                                <div class="id">
                                    <div class="lvl" style="font-size:10px; color:var(--ink-faint); font-weight:600;">LV ${player.level}</div>
                                    <div class="nm" style="font-family:var(--font-display); font-size:14px; color:var(--ink);">${player.classType}</div>
                                </div>
                            </div>
                            <div class="stat-row">
                                <div class="stat-label">HP <span class="val" id="player-hp-txt">${player.health}/${player.maxHealth}</span></div>
                                <div class="bar hp"><i id="player-hp-bar" style="width: ${(player.health/player.maxHealth)*100}%"></i></div>
                            </div>
                            <div class="stat-row">
                                <div class="stat-label">MP <span class="val" id="player-mp-txt">${player.mana}/${player.maxMana}</span></div>
                                <div class="bar mp"><i id="player-mp-bar" style="width: ${(player.mana/player.maxMana)*100}%"></i></div>
                            </div>
                        </div>

                        <div class="vs-badge" style="font-family:var(--font-display); font-size:11px; color:var(--gold); border:1px solid var(--gold-dim); border-radius:50%; width:32px; height:32px; display:flex; align-items:center; justify-content:center; background:var(--bg-inset); flex-shrink:0;">VS</div>

                        <div class="fighter enemy" style="flex:1; display:flex; flex-direction:column; gap:6px; align-items:flex-end;">
                            <div class="who" style="display:flex; align-items:center; gap:8px; flex-direction:row-reverse;">
                                <div class="medallion enemy" style="width:52px; height:52px;">
                                    <img src="${enemy.img}" alt="${enemy.name}" id="enemy-img">
                                </div>
                                <div class="id" style="text-align:right;">
                                    <div class="lvl" style="font-size:10px; color:var(--ink-faint); font-weight:600;">${enemy.isBoss ? 'BOSS GATE' : (enemy.isElite ? 'ELITE' : 'BEAST')}</div>
                                    <div class="nm" style="font-family:var(--font-display); font-size:14px; color:var(--ink);">${enemy.name}</div>
                                </div>
                            </div>
                            <div class="stat-row" style="width:100%;">
                                <div class="stat-label" style="justify-content:flex-end;"><span class="val" id="enemy-hp-txt">${enemy.health}/${enemy.maxHealth}</span> HP</div>
                                <div class="bar hp"><i id="enemy-hp-bar" style="width: ${(enemy.health/enemy.maxHealth)*100}%"></i></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="dock">
                    <div class="dock-head" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                        <div class="mana" style="display:flex; align-items:center; gap:6px;">
                            <img src="characters imgs/items/sapphire_gem.jpg" style="width:16px; height:16px; border-radius:50%; object-fit:cover;">
                            <span class="mana-val" style="font-family:var(--font-mono); font-size:12px; color:var(--arcane); font-weight:700;">${player.mana} / ${player.maxMana} MP</span>
                        </div>
                        <div class="badges" style="display:flex; gap:6px;">
                            <button class="badge-sm" onclick="GameManager.usePotion('hp')" title="Drink Health Potion"><img src="characters imgs/items/health_potion.jpg" style="width:16px; height:16px; border-radius:3px; object-fit:cover;"> ${player.potions.hpPotion}</button>
                            <button class="badge-sm" onclick="GameManager.usePotion('mp')" title="Drink Mana Potion"><img src="characters imgs/items/mana_potion.jpg" style="width:16px; height:16px; border-radius:3px; object-fit:cover;"> ${player.potions.mpPotion}</button>
                            <button class="badge-sm" onclick="GameManager.openInventoryModal()" title="Open Inventory"><img src="characters imgs/items/leather_vest.jpg" style="width:16px; height:16px; border-radius:3px; object-fit:cover;"></button>
                        </div>
                    </div>

                    <div id="skills-container">
                        ${this.renderSkillButtons()}
                    </div>
                </div>
            </div>
        `;

        viewContainer.innerHTML = arenaHtml;
    },

    selectedSkillIndex: 0,

    selectSkill: function(index) {
        SoundEngine.playClick();
        this.selectedSkillIndex = index;
        const skillsContainer = document.getElementById('skills-container');
        if (skillsContainer) {
            skillsContainer.innerHTML = this.renderSkillButtons();
        }
    },

    renderSkillButtons: function() {
        if (enemy && enemy.health <= 0) {
            return `
                <button class="cta animate-bounce" onclick="GameManager.closeModal(); GameManager.advanceMapNode()" style="padding:14px; font-size:1.1rem; width:100%;">
                    VICTORY! Continue Expedition ➡️
                </button>
            `;
        }

        if (!player || !player.skills || player.skills.length === 0) return '';
        if (this.selectedSkillIndex >= player.skills.length) {
            this.selectedSkillIndex = 0;
        }

        const selectedSkill = player.skills[this.selectedSkillIndex] || player.skills[0];

        let cardsHtml = player.skills.map((skill, index) => {
            const isCooldown = skill.currentCD > 0;
            const isInsufficientMana = player.mana < skill.manaCost;
            const disabled = isCooldown || isInsufficientMana;
            const isSelected = this.selectedSkillIndex === index;

            let skillImg = 'characters imgs/items/iron_sword.jpg';
            if (skill.name.includes('Heavy Slash') || skill.name.includes('Slash')) skillImg = 'characters imgs/items/heavy_slash.jpg';
            else if (skill.name.includes('Berserk') || skill.name.includes('Rampage')) skillImg = 'characters imgs/items/berserk_rampage.jpg';
            else if (skill.name.includes('Iron Wall') || skill.name.includes('Shield') || skill.name.includes('Guard')) skillImg = 'characters imgs/items/iron_wall.jpg';
            else if (skill.element === 'fire') skillImg = 'characters imgs/items/ruby_gem.jpg';
            else if (skill.element === 'dark') skillImg = 'characters imgs/items/diamond_gem.jpg';

            return `
                <div class="skill ${isSelected ? 'selected' : ''} ${disabled ? 'disabled' : ''}" 
                     onclick="GameManager.selectSkill(${index})"
                     style="position:relative; background:var(--bg-inset); border:1px solid ${isSelected ? 'var(--gold)' : 'var(--border-rune)'}; border-radius:10px; padding:6px 4px; display:flex; flex-direction:column; align-items:center; gap:4px; cursor:pointer;">
                    
                    <div class="cost ${skill.manaCost === 0 ? 'free' : (isInsufficientMana ? 'locked' : '')}"
                         style="position:absolute; top:-6px; right:-6px; font-family:var(--font-mono); font-size:9.5px; font-weight:700; background:${skill.manaCost === 0 ? 'var(--gold)' : (isInsufficientMana ? '#3a3040' : 'var(--arcane)')}; color:${skill.manaCost === 0 ? '#241a06' : '#eaf4fb'}; border-radius:5px; padding:1px 4px;">
                        ${skill.manaCost > 0 ? skill.manaCost : 'FREE'}
                    </div>

                    <div class="glyph" style="width:32px; height:32px; border-radius:6px; overflow:hidden; display:flex; align-items:center; justify-content:center;">
                        <img src="${skillImg}" alt="${skill.name}" style="width:100%; height:100%; object-fit:cover;">
                    </div>
                    <div class="name" style="font-size:10.5px; font-weight:600; color:${isSelected ? 'var(--gold-bright)' : 'var(--ink-dim)'}; text-align:center; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; width:100%;">${skill.name}</div>

                    ${isCooldown ? `<div style="position:absolute; inset:0; background:rgba(10,8,20,0.85); border-radius:10px; display:flex; align-items:center; justify-content:center; color:var(--crimson); font-weight:800; font-size:10px;">⌛ ${skill.currentCD}T</div>` : ''}
                </div>
            `;
        }).join('');

        const isCastDisabled = selectedSkill.currentCD > 0 || player.mana < selectedSkill.manaCost || (enemy && enemy.health <= 0);
        let btnText = `CAST ${selectedSkill.name.toUpperCase()}`;
        if (selectedSkill.currentCD > 0) btnText = `COOLDOWN (${selectedSkill.currentCD} TURNS)`;
        else if (player.mana < selectedSkill.manaCost) btnText = `NOT ENOUGH MP (${selectedSkill.manaCost} MP)`;

        return `
            <div class="skills-row" style="display:grid; grid-template-columns:repeat(4,1fr); gap:7px; margin-bottom:10px;">
                ${cardsHtml}
            </div>
            
            <div class="cast-card" style="background:var(--bg-inset); border:1px solid var(--border-rune); border-radius:10px; padding:10px 12px; margin-bottom:10px;">
                <div class="row1" style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom:4px;">
                    <span class="nm" style="font-family:var(--font-display); font-size:13px; color:var(--gold-bright);">${selectedSkill.name}</span>
                    <span class="cost" style="font-family:var(--font-mono); font-size:11px; color:var(--ink-faint);">Cost: ${selectedSkill.manaCost > 0 ? `${selectedSkill.manaCost} MP` : 'Free'}</span>
                </div>
                <div class="desc" style="font-size:11.5px; color:var(--ink-dim); line-height:1.4;">${selectedSkill.desc}</div>
            </div>

            <button class="cta" onclick="GameManager.useSkill(${this.selectedSkillIndex})" ${isCastDisabled ? 'disabled' : ''}>
                ${btnText}
            </button>
        `;
    },

    useSkill: function(skillIndex) {
        if (this.isTurnInProgress) return;
        const skill = player.skills[skillIndex];
        if (!skill || skill.currentCD > 0 || player.mana < skill.manaCost) return;

        this.isTurnInProgress = true;
        player.mana -= skill.manaCost;

        let dmg = 0;
        let isCrit = false;

        if (skill.type === 'buff') {
            if (skill.shieldVal) player.shield += skill.shieldVal;
            if (skill.mpRecover) player.mana = Math.min(player.maxMana, player.mana + skill.mpRecover);
            this.logAction(`Hero used <strong>${skill.name}</strong>! Gained Shield!`, 'info');
        } else {
            const basePower = skill.type === 'magic' ? player.TotalInt : player.TotalStr;
            isCrit = Math.random() < player.CritChance;
            dmg = Math.floor(basePower * skill.mult * (isCrit ? (1.75 + (player.critBonus || 0)) : 1.0));
            const enemyDef = enemy.defense || 10;
            dmg = Math.max(1, dmg - Math.floor(enemyDef * 0.3));

            enemy.health = Math.max(0, enemy.health - dmg);
            this.spawnFloatingText(document.getElementById('enemy-img'), `${isCrit ? 'CRIT! ' : ''}${dmg}`, isCrit ? 'crit' : 'dmg');
            this.logAction(`Hero used <strong>${skill.name}</strong> dealing <span style="color:#ff3366">${dmg} damage</span>!`, 'info');
        }

        if (skill.cooldown > 0) skill.currentCD = skill.cooldown;

        if (enemy.checkPhase2()) {
            this.logAction(`<strong>⚠️ ${enemy.name} ENRAGED INTO PHASE 2!</strong> Strength & Stats Boosted!`, 'warning');
        }

        if (enemy.health <= 0) {
            this.isTurnInProgress = false;
            this.handleVictory();
            return;
        }

        setTimeout(() => {
            this.executeEnemyTurn();
        }, 800);
    },

    executeEnemyTurn: function() {
        if (!enemy || enemy.health <= 0) {
            this.isTurnInProgress = false;
            return;
        }

        const enemySkill = enemy.getRandomSkill();
        const baseDmg = Math.floor(enemy.strength * enemySkill.mult);
        let playerDef = player.TotalDefense || 10;
        let netDmg = Math.max(1, baseDmg - Math.floor(playerDef * 0.4));

        if (player.shield > 0) {
            if (player.shield >= netDmg) {
                player.shield -= netDmg;
                netDmg = 0;
            } else {
                netDmg -= player.shield;
                player.shield = 0;
            }
        }

        if (netDmg > 0) {
            player.health = Math.max(0, player.health - netDmg);
        }

        this.spawnFloatingText(document.getElementById('player-img'), `${netDmg > 0 ? netDmg : 'BLOCKED!'}`, 'dmg');
        this.logAction(`<strong>${enemy.name}</strong> used ${enemySkill.name} dealing <span style="color:#ff2a5f">${netDmg} damage</span>!`, 'warning');

        // Turn tick: decrement skill cooldowns
        player.skills.forEach(s => {
            if (s.currentCD > 0) s.currentCD--;
        });

        this.updateUI();

        if (player.health <= 0) {
            this.isTurnInProgress = false;
            this.handlePlayerDeath();
            return;
        }

        this.isTurnInProgress = false;
    },

    handleVictory: function() {
        SoundEngine.playVictory();
        const goldLoot = Math.max(15, Math.floor(enemy.goldReward));
        const xpLoot = Math.max(25, Math.floor(enemy.xpReward));
        const coinsLoot = Math.max(10, Math.floor(Math.random() * 10 + 15));

        player.gold += goldLoot;
        player.coins = (player.coins || 0) + coinsLoot;
        const leveledUp = player.addXP(xpLoot);

        this.checkAchievement('first_win');
        if (enemy.name === 'Void Dragon' || enemy.name === 'Lich King of the Abyss') this.checkAchievement('dragon_slayer');
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
                    <p class="subtitle">Cleared Level ${this.currentNodeIndex + 1} / 12 — Defeated ${enemy.name}</p>

                    <div class="victory-rewards">
                        <div class="reward-pill"><span>🪙 Gold:</span> <strong>+${goldLoot}</strong></div>
                        <div class="reward-pill"><span>⚔️ Victory Coins:</span> <strong>+${coinsLoot}</strong></div>
                        <div class="reward-pill"><span>⭐ EXP:</span> <strong>+${xpLoot}</strong></div>
                    </div>

                    ${leveledUp ? `<div class="level-up-banner">🔥 LEVEL UP! Reached Level ${player.level}! +3 Stat Points!</div>` : ''}
                    ${player.level >= 5 && !player.specialization ? `<div class="special-unlock-banner">⭐ SPECIALIZATION UNLOCKED! Pick your Level 5 Hero Mastery!</div>` : ''}

                    <div style="margin-top:24px; display:flex; gap:12px; justify-content:center; flex-wrap:wrap;">
                        <button class="btn btn-primary" onclick="GameManager.closeModal(); GameManager.advanceMapNode()" style="padding:14px 28px; font-size:1.15rem;">🎉 Continue Map Exploration ➡️</button>
                    </div>
                </div>
            </div>
        `;
        this.showModal(modalHtml);
    },

    handleDefeat: function() {
        this.handlePlayerDeath();
    },

    handlePlayerDeath: function() {
        SoundEngine.playDefeat();
        const darkOrbsEarned = Math.max(10, (this.currentStage * 15) + (this.currentNodeIndex * 5));
        if (player) player.coins = (player.coins || 0) + darkOrbsEarned;
        if (!this.permanentMeta) this.permanentMeta = { darkOrbs: 0 };
        this.permanentMeta.darkOrbs = (this.permanentMeta.darkOrbs || 0) + darkOrbsEarned;

        const modalHtml = `
            <div class="modal-overlay">
                <div class="modal-card glass-panel text-center" style="max-width:540px;">
                    <h2 style="font-family:var(--font-display); color:var(--crimson); font-size:2.2rem; margin-bottom:6px;">
                        💀 YOU HAVE PERISHED
                    </h2>
                    <p style="color:var(--ink-dim); margin-bottom:16px;">Your hero succumbed to the darkness on Stage ${this.currentStage}, Level ${this.currentNodeIndex + 1}.</p>

                    <div class="panel" style="padding:14px; margin-bottom:20px; text-align:left; font-size:12px; line-height:1.6;">
                        <div>🗺️ <strong>Stage Reached:</strong> Stage ${this.currentStage} (${STAGE_THEMES[this.currentStage]?.name})</div>
                        <div>📊 <strong>Level Reached:</strong> Level ${this.currentNodeIndex + 1} / 12</div>
                        <div>🎲 <strong>Run Seed:</strong> <span style="font-family:var(--font-mono); color:var(--gold);">${this.currentSeedUsed}</span></div>
                        <div>🔮 <strong>Permanent Meta-Currency Earned:</strong> <span style="color:var(--gold-bright); font-weight:700;">+${darkOrbsEarned} Dark Orbs</span></div>
                    </div>

                    <button class="cta" onclick="GameManager.closeModal(); GameManager.renderCampHub();" style="width:100%;">
                        🏕️ Return to Safe Camp
                    </button>
                </div>
            </div>
        `;
        this.showModal(modalHtml);
    },

    usePotion: function(type) {
        if (!player) return;
        if (type === 'hp') {
            if (player.potions.hpPotion <= 0) {
                this.showToast('No Health Potions remaining!', 'warning');
                return;
            }
            player.potions.hpPotion--;
            const healVal = Math.floor(player.maxHealth * 0.50);
            player.health = Math.min(player.maxHealth, player.health + healVal);
            SoundEngine.playHeal();
            this.logAction(`Hero drank Health Potion, restored ${healVal} HP.`, 'info');
        } else if (type === 'mp') {
            if (player.potions.mpPotion <= 0) {
                this.showToast('No Mana Potions remaining!', 'warning');
                return;
            }
            player.potions.mpPotion--;
            const restored = Math.floor(player.maxMana * 0.60);
            player.mana = Math.min(player.maxMana, player.mana + restored);
            SoundEngine.playHeal();
            this.logAction(`Hero drank Mana Potion, restored ${restored} MP.`, 'info');
        }
        this.updateUI();
    },

    openUpgradeModal: function(isNaturalMapNode = false) {
        SoundEngine.playClick();
        if (!player) return;

        const wLvl = player.equipment.weaponLevel || 0;
        const aLvl = player.equipment.armorLevel || 0;
        const accLvl = player.equipment.accessoryLevel || 0;

        const wCost = (wLvl + 1) * 10;
        const aCost = (aLvl + 1) * 10;
        const accCost = (accLvl + 1) * 10;

        const modalHtml = `
            <div class="modal-overlay" onclick="if(event.target === this) GameManager.closeForgeModal()">
                <div class="modal-card glass-panel" style="max-width:740px; max-height:88vh; overflow-y:auto;">
                    <div class="modal-header">
                        <h2>🔨 Blacksmith Forge, Gem Workbench & Pet Evolution</h2>
                        <span class="stat-chip coin-badge">⚔️ ${player.coins || 0} Victory Coins</span>
                        <button class="close-btn" onclick="GameManager.closeForgeModal()">&times;</button>
                    </div>

                    <div style="background:rgba(217,168,60,0.12); padding:8px 12px; border-radius:8px; border:1px solid var(--gold); margin-bottom:14px; display:flex; justify-content:space-between; align-items:center; font-size:12px;">
                        <div>
                            ⚡ <strong>BLACKSMITH UPGRADES:</strong> <span style="font-weight:800; color:${this.blacksmithUpgradesRemaining > 0 ? 'var(--gold-bright)' : 'var(--crimson)'}">${this.blacksmithUpgradesRemaining} / 2</span> ${this.blacksmithUpgradesRemaining === 0 ? '(EXHAUSTED)' : ''}
                        </div>
                        <div style="font-size:11px; color:var(--ink-dim);">
                            ${isNaturalMapNode ? 'Natural Node Encounter' : 'Summoned Blacksmith'}
                        </div>
                    </div>

                    <!-- Section 1: Gear Upgrades -->
                    <h3 style="color:var(--gold); margin-bottom:10px; font-size:1.1rem;"><i class="fas fa-hammer"></i> Gear Refinement (+1 to +10)</h3>
                    <div class="upgrade-grid" style="margin-bottom:20px; display:grid; grid-template-columns:repeat(3, 1fr); gap:10px;">
                        <div class="upgrade-card glass-panel text-center" style="padding:10px;">
                            <div class="item-icon-frame" style="width:48px; height:48px; margin:0 auto 6px;">
                                <img src="characters imgs/items/iron_sword.jpg" alt="Iron Sword" style="width:100%; height:100%; object-fit:cover; border-radius:6px;">
                            </div>
                            <div class="upgrade-top">
                                <strong>⚔️ Weapon (+${wLvl})</strong>
                                <div style="color:var(--gold); font-size:11px;">+${Math.floor(wLvl * 15)}% STR</div>
                            </div>
                            <button class="btn btn-primary" onclick="GameManager.upgradeGearSlot('weapon')" ${this.blacksmithUpgradesRemaining <= 0 || (player.coins || 0) < wCost || wLvl >= 10 ? 'disabled' : ''} style="width:100%; margin-top:8px; font-size:11px;">
                                ${wLvl >= 10 ? 'MAX +10' : `Upgrade (+1) ⚔️ ${wCost}`}
                            </button>
                        </div>

                        <div class="upgrade-card glass-panel text-center" style="padding:10px;">
                            <div class="item-icon-frame" style="width:48px; height:48px; margin:0 auto 6px;">
                                <img src="characters imgs/items/leather_vest.jpg" alt="Leather Vest" style="width:100%; height:100%; object-fit:cover; border-radius:6px;">
                            </div>
                            <div class="upgrade-top">
                                <strong>🛡️ Armor (+${aLvl})</strong>
                                <div style="color:#00ffaa; font-size:11px;">+${Math.floor(aLvl * 15)}% VIT</div>
                            </div>
                            <button class="btn btn-primary" onclick="GameManager.upgradeGearSlot('armor')" ${this.blacksmithUpgradesRemaining <= 0 || (player.coins || 0) < aCost || aLvl >= 10 ? 'disabled' : ''} style="width:100%; margin-top:8px; font-size:11px;">
                                ${aLvl >= 10 ? 'MAX +10' : `Upgrade (+1) ⚔️ ${aCost}`}
                            </button>
                        </div>

                        <div class="upgrade-card glass-panel text-center" style="padding:10px;">
                            <div class="item-icon-frame" style="width:48px; height:48px; margin:0 auto 6px;">
                                <img src="characters imgs/items/wooden_ring.jpg" alt="Wooden Ring" style="width:100%; height:100%; object-fit:cover; border-radius:6px;">
                            </div>
                            <div class="upgrade-top">
                                <strong>💍 Accessory (+${accLvl})</strong>
                                <div style="color:var(--arcane); font-size:11px;">+${Math.floor(accLvl * 15)}% AGI</div>
                            </div>
                            <button class="btn btn-primary" onclick="GameManager.upgradeGearSlot('accessory')" ${this.blacksmithUpgradesRemaining <= 0 || (player.coins || 0) < accCost || accLvl >= 10 ? 'disabled' : ''} style="width:100%; margin-top:8px; font-size:11px;">
                                ${accLvl >= 10 ? 'MAX +10' : `Upgrade (+1) ⚔️ ${accCost}`}
                            </button>
                        </div>
                    </div>

                    <div style="margin-top:16px; text-align:right;">
                        <button class="btn btn-secondary" onclick="GameManager.closeForgeModal()">Exit Forge</button>
                    </div>
                </div>
            </div>
        `;
        this.showModal(modalHtml);
    },

    closeForgeModal: function() {
        this.closeModal();
    },

    upgradeGearSlot: function(slot) {
        if (!player) return;
        if (this.blacksmithUpgradesRemaining <= 0) {
            this.showToast("BLACKSMITH EXHAUSTED: Maximum 2 upgrades allowed per stage!", "warning");
            return;
        }
        const currentLvl = player.equipment[slot + 'Level'] || 0;
        const cost = (currentLvl + 1) * 10;

        if ((player.coins || 0) < cost) {
            this.showToast(`Not enough Victory Coins (Need ${cost})!`, "warning");
            return;
        }

        this.blacksmithUpgradesRemaining--;
        player.coins -= cost;
        player.equipment[slot + 'Level'] = currentLvl + 1;
        player.recalculateStats();
        SoundEngine.playLevelUp();
        this.logAction(`Forged <strong>${slot.toUpperCase()} +${currentLvl + 1}</strong>! Stats boosted! (${this.blacksmithUpgradesRemaining} upgrades left)`, 'info');
        this.saveGameData();
        this.openUpgradeModal(false);
    },

    addStatFromInventory: function(stat) {
        if (!player || player.statPoints <= 0) return;
        player.statPoints--;
        player[stat]++;
        player.recalculateStats();
        SoundEngine.playClick();
        this.saveGameData();
        this.updateHeaderStats();
        this.openInventoryModal('wealth');
    },

    buyPotion: function(type) {
        SoundEngine.playClick();
        if (!player) return;
        const cost = 15;
        if (player.gold < cost) {
            this.showToast("Not enough gold to purchase potion!", "warning");
            return;
        }
        player.gold -= cost;
        if (type === 'hp') player.potions.hpPotion = (player.potions.hpPotion || 0) + 1;
        else if (type === 'mp') player.potions.mpPotion = (player.potions.mpPotion || 0) + 1;
        this.saveGameData();
        this.updateHeaderStats();
        this.openShopModal(false);
        this.showToast(`Bought 1 ${type.toUpperCase()} Potion!`, 'success');
    },

    openShopModal: function(isNaturalMapNode = false) {
        SoundEngine.playClick();
        let weaponOptions = SHOP_ITEMS.weapons.map((w, idx) => `
            <div class="shop-item glass-panel" id="shop-item-weapon-${idx}" style="padding:10px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
                <div><strong>${w.name}</strong> <div class="item-desc" style="font-size:11px; color:var(--ink-dim);">${w.desc}</div></div>
                <button class="btn btn-primary" onclick="GameManager.buyGear('weapon', ${idx})" ${player.gold < w.price ? 'disabled' : ''}>Buy 🪙${w.price}</button>
            </div>
        `).join('');

        const modalHtml = `
            <div class="modal-overlay">
                <div class="modal-card glass-panel" id="merchant-shop-card" style="max-width:720px; max-height:85vh; overflow-y:auto;">
                    <div class="modal-header">
                        <h2>🛒 Dungeon Merchant Shop</h2>
                        <span class="gold-badge">🪙 Gold: ${player ? player.gold : 0}</span>
                        <button class="close-btn" onclick="GameManager.closeShopModal()">&times;</button>
                    </div>

                    <div class="shop-section">
                        <h4 style="color:var(--gold); margin-bottom:8px;">🧪 Emergency Potions & Supplies</h4>
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:16px;">
                            <div class="shop-item panel" style="padding:10px; display:flex; justify-content:space-between; align-items:center;">
                                <div>
                                    <strong style="color:var(--gold-bright);"><img src="characters imgs/items/health_potion.jpg" style="width:20px; height:20px; border-radius:4px; vertical-align:middle;"> Health Potion (+150 HP)</strong>
                                    <div class="item-desc" style="font-size:0.8rem; color:var(--ink-dim);">Restores 150 Health in battle</div>
                                </div>
                                <button class="btn btn-primary" onclick="GameManager.buyPotion('hp')" ${player.gold < 15 ? 'disabled' : ''}>Buy 🪙15 Gold</button>
                            </div>

                            <div class="shop-item panel" style="padding:10px; display:flex; justify-content:space-between; align-items:center;">
                                <div>
                                    <strong style="color:var(--gold-bright);"><img src="characters imgs/items/mana_potion.jpg" style="width:20px; height:20px; border-radius:4px; vertical-align:middle;"> Mana Potion (+100 MP)</strong>
                                    <div class="item-desc" style="font-size:0.8rem; color:var(--ink-dim);">Restores 100 Mana in battle</div>
                                </div>
                                <button class="btn btn-primary" onclick="GameManager.buyPotion('mp')" ${player.gold < 15 ? 'disabled' : ''}>Buy 🪙15 Gold</button>
                            </div>
                        </div>

                        <h4 style="color:var(--gold); margin-bottom:8px;">⚔️ Weapons & Gear</h4>
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
    },

    buyGear: function(slot, idx) {
        if (!player) return;
        const item = SHOP_ITEMS[slot + 's'][idx];
        if (!item || player.gold < item.price) {
            this.showToast("Not enough gold!", "warning");
            return;
        }
        player.gold -= item.price;
        if (slot === 'weapon') player.equipment.weapon = item;
        player.recalculateStats();
        SoundEngine.playLevelUp();
        this.saveGameData();
        this.openShopModal(false);
        this.showToast(`Purchased ${item.name}!`, 'success');
    },

    openInventoryModal: function(activeTab = 'wealth') {
        SoundEngine.playClick();
        if (!player) {
            this.renderCampHub();
            return;
        }

        const modalHtml = `
            <div class="modal-overlay" onclick="if(event.target === this) GameManager.closeModal()">
                <div class="modal-card glass-panel inventory-modal-box" style="max-width:680px; max-height:85vh; overflow-y:auto;">
                    <div class="modal-header" style="margin-bottom:12px;">
                        <div style="display:flex; align-items:center; gap:10px;">
                            <img src="${player.img}" alt="${player.classType}" style="width:42px; height:42px; border-radius:50%; border:2px solid var(--gold); object-fit:cover;">
                            <div>
                                <h2 style="margin:0; font-size:1.4rem;"><i class="fas fa-briefcase" style="color:var(--gold);"></i> ${player.classType} Inventory</h2>
                                <div style="font-size:0.8rem; color:var(--ink-dim);">Level ${player.level} ${player.specialization ? player.specialization.name : player.title}</div>
                            </div>
                        </div>
                        <button class="close-btn" onclick="GameManager.closeModal()">&times;</button>
                    </div>

                    <div class="panel" style="padding:14px; margin-bottom:16px;">
                        <h4 style="color:var(--gold); margin-bottom:8px;">🔥 Stat Point Allocations (Points: ${player.statPoints})</h4>
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; font-size:12px;">
                            <div>STR: ${player.str} <button class="btn btn-primary" onclick="GameManager.addStatFromInventory('str')" ${player.statPoints <= 0 ? 'disabled' : ''} style="padding:2px 8px;">+1</button></div>
                            <div>AGI: ${player.agi} <button class="btn btn-primary" onclick="GameManager.addStatFromInventory('agi')" ${player.statPoints <= 0 ? 'disabled' : ''} style="padding:2px 8px;">+1</button></div>
                            <div>INT: ${player.int} <button class="btn btn-primary" onclick="GameManager.addStatFromInventory('int')" ${player.statPoints <= 0 ? 'disabled' : ''} style="padding:2px 8px;">+1</button></div>
                            <div>VIT: ${player.vit} <button class="btn btn-primary" onclick="GameManager.addStatFromInventory('vit')" ${player.statPoints <= 0 ? 'disabled' : ''} style="padding:2px 8px;">+1</button></div>
                        </div>
                    </div>

                    <div style="text-align:right;">
                        <button class="btn btn-secondary" onclick="GameManager.closeModal()">Close</button>
                    </div>
                </div>
            </div>
        `;
        this.showModal(modalHtml);
    },

    openSettingsModal: function() {
        SoundEngine.playClick();
        const modalHtml = `
            <div class="modal-overlay" onclick="if(event.target === this) GameManager.closeModal()">
                <div class="modal-card glass-panel" style="max-width:740px; max-height:88vh; overflow-y:auto;">
                    <div class="modal-header">
                        <h2>⚙️ Game Settings & World Save Manager</h2>
                        <button class="close-btn" onclick="GameManager.closeModal()">&times;</button>
                    </div>

                    <div class="glass-panel" style="padding:14px; margin-bottom:16px; display:flex; justify-content:space-between; align-items:center; border:1px solid var(--gold);">
                        <div>
                            <strong style="color:var(--gold); font-size:1.05rem;"><i class="fas fa-volume-up"></i> Sound Engine Controls</strong>
                            <div style="font-size:0.85rem; color:var(--ink-dim);">Toggle dark fantasy combat sound effects and ambience.</div>
                        </div>
                        <button class="btn ${SoundEngine.isMuted ? 'btn-secondary' : 'btn-potion'}" id="audio-btn" onclick="GameManager.toggleMuteAudio(); GameManager.openSettingsModal();" style="padding:8px 16px;">
                            ${SoundEngine.isMuted ? '🔇 Sound OFF' : '🔊 Sound ON'}
                        </button>
                    </div>

                    <div style="text-align:right; margin-top:16px;">
                        <button class="btn btn-secondary" onclick="GameManager.closeModal()">Close</button>
                    </div>
                </div>
            </div>
        `;
        this.showModal(modalHtml);
    },

    saveGameData: function() {
        if (!player) return;
        try {
            const data = {
                highScore: this.highScore,
                unlockedStage: this.unlockedStage || 1,
                currentStage: this.currentStage,
                currentNodeIndex: this.currentNodeIndex,
                runSeed: this.runSeed,
                merchantSummonsRemaining: this.merchantSummonsRemaining,
                blacksmithSummonsRemaining: this.blacksmithSummonsRemaining,
                blacksmithUpgradesRemaining: this.blacksmithUpgradesRemaining,
                permanentMeta: this.permanentMeta || { maxHpRanks: 0, dmgRanks: 0, critRanks: 0, darkOrbs: 0 },
                difficulty: this.difficulty,
                playerData: {
                    classType: player.classType,
                    level: player.level,
                    xp: player.xp,
                    gold: player.gold,
                    coins: player.coins || 0,
                    str: player.str,
                    agi: player.agi,
                    int: player.int,
                    vit: player.vit,
                    statPoints: player.statPoints,
                    equipment: player.equipment,
                    companion: player.companion ? player.companion.id : null,
                    socketedGem: player.socketedGem ? player.socketedGem.id : null,
                    specialization: player.specialization ? player.specialization.id : null,
                    blessings: player.blessings || [],
                    achievements: player.achievements || []
                }
            };

            const jsonStr = JSON.stringify(data);
            localStorage.setItem('dungeon_crawl_save_slot_1', jsonStr);
            this.setCookie('dungeon_crawl_session', jsonStr, 365);
        } catch (e) {}
    },

    loadSaveData: function() {
        try {
            let raw = this.getCookie('dungeon_crawl_session');
            if (!raw) raw = localStorage.getItem('dungeon_crawl_save_slot_1');
            if (raw) {
                const data = JSON.parse(raw);
                if (data.highScore) this.highScore = data.highScore;
                if (data.unlockedStage) this.unlockedStage = data.unlockedStage;
                if (data.permanentMeta) this.permanentMeta = data.permanentMeta;
                if (data.runSeed) this.runSeed = data.runSeed;
                if (data.merchantSummonsRemaining !== undefined) this.merchantSummonsRemaining = data.merchantSummonsRemaining;
                if (data.blacksmithSummonsRemaining !== undefined) this.blacksmithSummonsRemaining = data.blacksmithSummonsRemaining;
                if (data.blacksmithUpgradesRemaining !== undefined) this.blacksmithUpgradesRemaining = data.blacksmithUpgradesRemaining;

                if (data.playerData && data.playerData.classType) {
                    this.loadFromData(data);
                    return true;
                }
            }
        } catch (e) {}
        return false;
    },

    loadFromData: function(data) {
        if (!data || !data.playerData) return false;
        const pData = data.playerData;

        player = new Player(pData.classType);
        player.level = pData.level || 1;
        player.xp = pData.xp || 0;
        player.gold = pData.gold || 50;
        player.coins = pData.coins || 0;
        player.str = pData.str || 20;
        player.agi = pData.agi || 20;
        player.int = pData.int || 20;
        player.vit = pData.vit || 20;
        player.statPoints = pData.statPoints || 0;
        if (pData.equipment) player.equipment = pData.equipment;
        if (pData.specialization) player.specialization = pData.specialization;
        player.blessings = pData.blessings || [];
        player.achievements = pData.achievements || [];

        this.applyPermanentMeta();

        this.currentStage = data.currentStage || 1;
        this.currentNodeIndex = data.currentNodeIndex || 0;
        this.difficulty = data.difficulty || 'hardcore';

        return true;
    },

    showToast: function(msg, type = 'info') {
        const toast = document.createElement('div');
        toast.style.position = 'fixed';
        toast.style.bottom = '20px';
        toast.style.right = '20px';
        toast.style.background = type === 'warning' ? '#ff8c00' : (type === 'success' ? '#00ffaa' : 'var(--gold)');
        toast.style.color = '#000';
        toast.style.fontWeight = '800';
        toast.style.padding = '10px 16px';
        toast.style.borderRadius = '8px';
        toast.style.zIndex = '99999';
        toast.style.boxShadow = '0 6px 20px rgba(0,0,0,0.5)';
        toast.innerText = msg;
        document.body.appendChild(toast);
        setTimeout(() => {
            if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 2500);
    },

    showModal: function(htmlContent) {
        const container = document.getElementById('modal-container');
        if (container) container.innerHTML = htmlContent;
    },

    closeModal: function() {
        const container = document.getElementById('modal-container');
        if (container) container.innerHTML = '';
    },

    closeConfirmModal: function() {
        const el = document.getElementById('confirm-modal-overlay');
        if (el && el.parentNode) el.parentNode.removeChild(el);
    },

    closeInputModal: function() {
        const el = document.getElementById('input-modal-overlay');
        if (el && el.parentNode) el.parentNode.removeChild(el);
    },

    updateUI: function() {
        const pHealthTxt = document.getElementById('player-hp-txt');
        const pHealthBar = document.getElementById('player-hp-bar');
        const pManaTxt = document.getElementById('player-mp-txt');
        const pManaBar = document.getElementById('player-mp-bar');

        if (pHealthTxt) pHealthTxt.innerText = `${player.health}/${player.maxHealth}`;
        if (pHealthBar) pHealthBar.style.width = `${Math.max(0, (player.health / player.maxHealth) * 100)}%`;
        if (pManaTxt) pManaTxt.innerText = `${player.mana}/${player.maxMana}`;
        if (pManaBar) pManaBar.style.width = `${Math.max(0, (player.mana / player.maxMana) * 100)}%`;

        const eHealthTxt = document.getElementById('enemy-hp-txt');
        const eHealthBar = document.getElementById('enemy-hp-bar');
        if (eHealthTxt) eHealthTxt.innerText = `${enemy ? enemy.health : 0}/${enemy ? enemy.maxHealth : 1}`;
        if (eHealthBar) eHealthBar.style.width = `${Math.max(0, ((enemy ? enemy.health : 0) / (enemy ? enemy.maxHealth : 1)) * 100)}%`;

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
        floatEl.style.position = 'fixed';
        floatEl.style.left = `${rect.left + rect.width / 2 - 20}px`;
        floatEl.style.top = `${rect.top + 20}px`;
        floatEl.style.zIndex = '9999';
        floatEl.style.fontWeight = '800';
        floatEl.style.color = type === 'crit' ? '#ff3366' : '#fff';
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

        if (goldEl) goldEl.innerText = player ? player.gold : 0;
        if (coinsEl) coinsEl.innerText = (this.permanentMeta && this.permanentMeta.darkOrbs !== undefined) ? this.permanentMeta.darkOrbs : (player ? player.coins : 0);
        if (stageEl) stageEl.innerText = this.currentStage;
    },

    toggleMuteAudio: function() {
        SoundEngine.toggleMute();
    },

    setCookie: function(name, value, days = 365) {
        try {
            const d = new Date();
            d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
            const expires = "expires=" + d.toUTCString();
            document.cookie = name + "=" + encodeURIComponent(value) + ";" + expires + ";path=/;SameSite=Lax";
        } catch (e) {}
    },

    getCookie: function(name) {
        try {
            const cname = name + "=";
            const decodedCookie = decodeURIComponent(document.cookie);
            const ca = decodedCookie.split(';');
            for (let i = 0; i < ca.length; i++) {
                let c = ca[i];
                while (c.charAt(0) === ' ') {
                    c = c.substring(1);
                }
                if (c.indexOf(cname) === 0) {
                    return c.substring(cname.length, c.length);
                }
            }
        } catch (e) {}
        return "";
    }
};

if (typeof window !== 'undefined') {
    window.onload = function() {
        GameManager.init();
    };
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameManager;
}