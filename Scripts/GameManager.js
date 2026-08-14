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
        flavor: '"Dormant mythic egg emitting a faint warm pulse. Visit Wandering Merchant at Node 6 to hatch."'
    }
};

const GameManager = {
    currentStage: 1,
    highScore: 1,
    currentNodeIndex: 0,
    stageNodes: [],
    isTurnInProgress: false,
    activeWorld: 1,

    renderHeroSelect: function() {
        const viewContainer = document.getElementById('main-view');
        if (!viewContainer) return;
        player = null;
        this.updateHeaderStats();
        viewContainer.innerHTML = `
            <div class="hero-select-screen text-center animate-fade-in">
                <h2 style="font-family:'MedievalSharp',serif; color:var(--gold); font-size:2.4rem; margin-bottom:4px;">
                    ⚔️ Choose Your Hero Class (World ${this.activeWorld})
                </h2>
                <p style="color:var(--text-muted); margin-bottom:24px;">Select a legendary champion for World ${this.activeWorld} to begin your expedition!</p>

                <div style="margin-bottom:20px; display:flex; gap:12px; justify-content:center;">
                    <button class="btn btn-potion" onclick="GameManager.openSettingsModal()">
                        ⚙️ Settings & World Switcher (World ${this.activeWorld})
                    </button>
                    <button class="btn btn-secondary" onclick="TutorialEngine.openTutorial(0)" style="color:var(--gold);">
                        <i class="fas fa-question-circle"></i> How to Play
                    </button>
                </div>

                <div class="hero-class-grid" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:20px;">
                    <div class="hero-card glass-panel" onclick="GameManager.setGameStart('Warrior')" onmouseenter="SoundEngine.playHover()">
                        <div class="hero-avatar"><img src="characters imgs/player/Warrior.jpg" alt="Warrior"></div>
                        <h3 style="color:var(--gold); margin:10px 0 4px 0;">Warrior</h3>
                        <div style="color:var(--text-muted); font-size:0.85rem; margin-bottom:12px;">Heavy Melee & Iron Shield</div>
                        <button class="btn btn-primary" style="width:100%;">Select Warrior</button>
                    </div>
                    <div class="hero-card glass-panel" onclick="GameManager.setGameStart('Rogue')" onmouseenter="SoundEngine.playHover()">
                        <div class="hero-avatar"><img src="characters imgs/player/Rouge.jpg" alt="Rogue"></div>
                        <h3 style="color:var(--gold); margin:10px 0 4px 0;">Rogue</h3>
                        <div style="color:var(--text-muted); font-size:0.85rem; margin-bottom:12px;">High Criticals & Stealth Dodge</div>
                        <button class="btn btn-primary" style="width:100%;">Select Rogue</button>
                    </div>
                    <div class="hero-card glass-panel" onclick="GameManager.setGameStart('Wizard')" onmouseenter="SoundEngine.playHover()">
                        <div class="hero-avatar"><img src="characters imgs/player/Wizard.jpg" alt="Wizard"></div>
                        <h3 style="color:var(--gold); margin:10px 0 4px 0;">Wizard</h3>
                        <div style="color:var(--text-muted); font-size:0.85rem; margin-bottom:12px;">Elemental Spells & Mana Barrier</div>
                        <button class="btn btn-primary" style="width:100%;">Select Wizard</button>
                    </div>
                    <div class="hero-card glass-panel" onclick="GameManager.setGameStart('Hunter')" onmouseenter="SoundEngine.playHover()">
                        <div class="hero-avatar"><img src="characters imgs/player/hunter.jpg" alt="Hunter"></div>
                        <h3 style="color:var(--gold); margin:10px 0 4px 0;">Hunter</h3>
                        <div style="color:var(--text-muted); font-size:0.85rem; margin-bottom:12px;">Precision Bows & Pet Companion</div>
                        <button class="btn btn-primary" style="width:100%;">Select Hunter</button>
                    </div>
                    <div class="hero-card glass-panel" onclick="GameManager.setGameStart('Paladin')" onmouseenter="SoundEngine.playHover()">
                        <div class="hero-avatar"><img src="characters imgs/player/Paladin.jpg" alt="Paladin"></div>
                        <h3 style="color:var(--gold); margin:10px 0 4px 0;">Paladin</h3>
                        <div style="color:var(--text-muted); font-size:0.85rem; margin-bottom:12px;">Holy Shield & Light Restoration</div>
                        <button class="btn btn-primary" style="width:100%;">Select Paladin</button>
                    </div>
                    <div class="hero-card glass-panel" onclick="GameManager.setGameStart('Necromancer')" onmouseenter="SoundEngine.playHover()">
                        <div class="hero-avatar"><img src="characters imgs/player/Necromancer.jpg" alt="Necromancer"></div>
                        <h3 style="color:var(--gold); margin:10px 0 4px 0;">Necromancer</h3>
                        <div style="color:var(--text-muted); font-size:0.85rem; margin-bottom:12px;">Shadow Lifesteal & Undead Army</div>
                        <button class="btn btn-primary" style="width:100%;">Select Necromancer</button>
                    </div>
                </div>
            </div>
        `;
    },

    openSaveLoadModal: function() {
        this.openSettingsModal();
    },

    openSettingsModal: function() {
        SoundEngine.playClick();
        if (player) this.saveGameData();

        let w1Data = null, w2Data = null;
        try {
            let r1 = this.getCookie('dungeon_crawl_world_1') || localStorage.getItem('dungeon_crawl_save_slot_1');
            if (r1) w1Data = JSON.parse(r1);
            let r2 = this.getCookie('dungeon_crawl_world_2') || localStorage.getItem('dungeon_crawl_save_slot_2');
            if (r2) w2Data = JSON.parse(r2);
        } catch(e) {}

        const modalHtml = `
            <div class="modal-overlay" onclick="if(event.target === this) GameManager.closeModal()">
                <div class="modal-card glass-panel" style="max-width:740px; max-height:88vh; overflow-y:auto;">
                    <div class="modal-header">
                        <h2>⚙️ Game Settings & World Save Manager</h2>
                        <button class="close-btn" onclick="GameManager.closeModal()">&times;</button>
                    </div>

                    <!-- Audio Control Section -->
                    <div class="glass-panel" style="padding:14px; margin-bottom:16px; display:flex; justify-content:space-between; align-items:center; border:1px solid var(--gold);">
                        <div>
                            <strong style="color:var(--gold); font-size:1.05rem;"><i class="fas fa-volume-up"></i> Sound Engine & Audio Controls</strong>
                            <div style="font-size:0.85rem; color:var(--text-muted);">Toggle dark fantasy combat sound effects and background audio ambience.</div>
                        </div>
                        <button class="btn ${SoundEngine.isMuted ? 'btn-secondary' : 'btn-potion'}" id="audio-btn" onclick="GameManager.toggleMuteAudio(); GameManager.openSettingsModal();" style="padding:8px 16px;">
                            ${SoundEngine.isMuted ? '🔇 Sound OFF' : '🔊 Sound ON'}
                        </button>
                    </div>

                    <!-- Dual World Save Manager -->
                    <h3 style="color:var(--gold); margin-bottom:10px; font-size:1.1rem;"><i class="fas fa-globe"></i> Independent Game Worlds</h3>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:20px;">
                        <!-- World 1 Card -->
                        <div class="glass-panel" style="padding:16px; border:2px solid ${this.activeWorld === 1 ? '#00e5ff' : 'rgba(255,255,255,0.1)'}; border-radius:12px; background:rgba(0,30,60,0.4);">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                                <h3 style="color:#00e5ff; margin:0;">🌍 World 1</h3>
                                ${this.activeWorld === 1 ? '<span style="background:#00e5ff; color:#000; font-size:0.75rem; font-weight:800; padding:2px 8px; border-radius:10px;">ACTIVE WORLD</span>' : ''}
                            </div>
                            ${w1Data && w1Data.playerData ? `
                                <div style="font-size:0.9rem; line-height:1.5; color:var(--text-muted); margin-bottom:14px;">
                                    <div>🧙 <strong>Hero:</strong> ${w1Data.playerData.classType.toUpperCase()} (Lvl ${w1Data.playerData.level})</div>
                                    <div>🗺️ <strong>Progress:</strong> Stage ${w1Data.currentStage || 1} - Node ${(w1Data.currentNodeIndex || 0) + 1}</div>
                                    <div>🪙 <strong>Gold & Coins:</strong> ${w1Data.playerData.gold} Gold | ⚔️ ${w1Data.playerData.coins || 0} Coins</div>
                                    <div style="font-size:0.75rem; color:#888; margin-top:4px;">🕒 ${w1Data.timestamp || 'Saved'}</div>
                                </div>
                                <div style="display:flex; gap:8px; flex-wrap:wrap;">
                                    <button class="btn btn-primary" onclick="GameManager.switchWorld(1)" style="flex:1;">▶️ Play World 1</button>
                                    <button class="btn btn-danger" onclick="GameManager.deleteWorldSlot(1)" style="background:#ff2a5f; padding:8px 12px;" title="Reset World 1">&times;</button>
                                </div>
                            ` : `
                                <div style="color:#888; font-size:0.9rem; margin:20px 0;">Empty World Slot</div>
                                <button class="btn btn-primary" onclick="GameManager.switchWorld(1)" style="width:100%;">➕ Start World 1</button>
                            `}
                        </div>

                        <!-- World 2 Card -->
                        <div class="glass-panel" style="padding:16px; border:2px solid ${this.activeWorld === 2 ? '#00e5ff' : 'rgba(255,255,255,0.1)'}; border-radius:12px; background:rgba(0,30,60,0.4);">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                                <h3 style="color:#00e5ff; margin:0;">🪐 World 2</h3>
                                ${this.activeWorld === 2 ? '<span style="background:#00e5ff; color:#000; font-size:0.75rem; font-weight:800; padding:2px 8px; border-radius:10px;">ACTIVE WORLD</span>' : ''}
                            </div>
                            ${w2Data && w2Data.playerData ? `
                                <div style="font-size:0.9rem; line-height:1.5; color:var(--text-muted); margin-bottom:14px;">
                                    <div>🧙 <strong>Hero:</strong> ${w2Data.playerData.classType.toUpperCase()} (Lvl ${w2Data.playerData.level})</div>
                                    <div>🗺️ <strong>Progress:</strong> Stage ${w2Data.currentStage || 1} - Node ${(w2Data.currentNodeIndex || 0) + 1}</div>
                                    <div>🪙 <strong>Gold & Coins:</strong> ${w2Data.playerData.gold} Gold | ⚔️ ${w2Data.playerData.coins || 0} Coins</div>
                                    <div style="font-size:0.75rem; color:#888; margin-top:4px;">🕒 ${w2Data.timestamp || 'Saved'}</div>
                                </div>
                                <div style="display:flex; gap:8px; flex-wrap:wrap;">
                                    <button class="btn btn-primary" onclick="GameManager.switchWorld(2)" style="flex:1;">▶️ Play World 2</button>
                                    <button class="btn btn-danger" onclick="GameManager.deleteWorldSlot(2)" style="background:#ff2a5f; padding:8px 12px;" title="Reset World 2">&times;</button>
                                </div>
                            ` : `
                                <div style="color:#888; font-size:0.9rem; margin:20px 0;">Empty World Slot</div>
                                <button class="btn btn-primary" onclick="GameManager.switchWorld(2)" style="width:100%;">➕ Start World 2</button>
                            `}
                        </div>
                    </div>

                    <!-- Cloud Sync & Backup Box -->
                    <div class="cloud-db-box glass-panel" style="margin-bottom:16px; padding:14px; border:1px solid var(--gold);">
                        <h4 style="color:var(--gold); margin-bottom:6px;"><i class="fas fa-cloud-upload-alt"></i> Online Cloud Database Sync</h4>
                        <div style="display:flex; gap:8px; flex-wrap:wrap;">
                            <input type="text" id="cloud-username-input" class="glass-input" placeholder="Hero Account Name" style="flex-grow:1; padding:8px; border-radius:6px; border:1px solid var(--glass-border); background:rgba(0,0,0,0.5); color:#fff;">
                            ${player ? `<button class="btn btn-primary" onclick="GameManager.saveToCloudDB()"><i class="fas fa-cloud-upload-alt"></i> Save Cloud</button>` : ''}
                            <button class="btn btn-potion" onclick="GameManager.loadFromCloudDB()"><i class="fas fa-cloud-download-alt"></i> Load Cloud</button>
                        </div>
                        <div id="cloud-status-msg" style="font-size:0.85rem; font-weight:700; margin-top:6px;"></div>
                    </div>

                    <!-- Actions Bar -->
                    <div style="display:flex; gap:10px; justify-content:space-between; align-items:center; flex-wrap:wrap;">
                        <div style="display:flex; gap:8px; flex-wrap:wrap;">
                            <button class="btn btn-secondary" onclick="GameManager.exportSaveCode()">📋 Copy Code</button>
                            <button class="btn btn-secondary" onclick="GameManager.importSaveCode()">📥 Import Code</button>
                            <button class="btn btn-secondary" onclick="GameManager.openLeaderboardModal()"><i class="fas fa-trophy"></i> Leaderboard</button>
                        </div>
                        <div style="display:flex; gap:8px;">
                            ${player ? `<button class="btn btn-danger" onclick="GameManager.resetGameSession()" style="background:#ff2a5f; color:#fff;"><i class="fas fa-undo"></i> 🔄 New Game / Reset</button>` : ''}
                            <button class="btn btn-secondary" onclick="GameManager.closeModal()">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        this.showModal(modalHtml);
    },

    loadWorldSave: function(worldNum) {
        this.activeWorld = worldNum;
        this.setCookie('dungeon_crawl_last_world', worldNum.toString(), 365);
        try {
            let raw = this.getCookie(`dungeon_crawl_world_${worldNum}`);
            if (!raw) raw = localStorage.getItem(`dungeon_crawl_save_slot_${worldNum}`);
            if (raw) {
                const data = JSON.parse(raw);
                if (data.playerData && data.playerData.classType) {
                    this.loadFromData(data);
                    this.startStageMap(this.currentStage);
                    this.currentNodeIndex = data.currentNodeIndex || 0;
                    this.renderDungeonMap();
                    this.logAction(`Loaded <strong>World ${worldNum}</strong>: <strong style="color:var(--gold)">Level ${player.level} ${player.classType}</strong> on Stage ${this.currentStage}!`, 'info');
                    return true;
                }
            }
        } catch(e) {}

        player = null;
        this.currentStage = 1;
        this.currentNodeIndex = 0;
        this.renderHeroSelect();
        return false;
    },

    switchWorld: function(worldNum) {
        if (player) this.saveGameData();
        SoundEngine.playClick();
        this.closeModal();
        this.loadWorldSave(worldNum);
    },

    deleteWorldSlot: function(worldNum) {
        this.showConfirmModal({
            title: `Delete & Reset World ${worldNum}`,
            message: `Are you sure you want to reset all progress for World ${worldNum}? This hero run will be permanently erased.`,
            confirmText: `Delete World ${worldNum}`,
            danger: true,
            onConfirm: () => {
                try {
                    this.setCookie(`dungeon_crawl_world_${worldNum}`, '', -1);
                    localStorage.removeItem(`dungeon_crawl_save_slot_${worldNum}`);
                } catch(e) {}

                SoundEngine.playClick();
                this.showToast(`World ${worldNum} reset successfully.`, 'info');
                if (this.activeWorld === worldNum) {
                    player = null;
                    this.currentStage = 1;
                    this.currentNodeIndex = 0;
                    this.renderHeroSelect();
                } else {
                    this.openSettingsModal();
                }
            }
        });
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

            // Keyboard accessibility: ESC key closes all active modals
            window.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    GameManager.closeConfirmModal();
                    GameManager.closeInputModal();
                    GameManager.closeModal();
                }
            });
        } catch (e) {
            console.error("Game initialization error:", e);
        }
    },

    setGameStart: function(classType) {
        SoundEngine.playClick();
        player = new Player(classType);
        player.gold = 50;
        player.coins = 0;
        this.currentStage = 1;
        this.currentNodeIndex = 0;
        this.saveGameData();
        this.updateHeaderStats();
        this.logAction(`Hero selected: <strong style="color:var(--gold)">${player.classType.toUpperCase()}</strong>!`, 'info');
        this.startStageMap(1);
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
            { type: 'battle', title: 'Dungeon Fight 1', icon: 'fa-skull-crossbones' },
            { type: 'battle', title: 'Dungeon Fight 2', icon: 'fa-paw' },
            { type: 'forge', title: 'Blacksmith Forge', icon: 'fa-hammer' },
            { type: 'battle', title: 'Dungeon Fight 3', icon: 'fa-ghost' },
            { type: 'battle', title: 'Mini-Boss Fight', icon: 'fa-khanda' },
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
                <p style="color:var(--text-muted); margin-bottom:20px;">Clear 4 fights, upgrade in the Blacksmith Forge, trade at the Merchant after finishing all fights, and defeat the Stage Boss!</p>

                <div class="map-nodes-container">
                    ${nodesHtml}
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
        } else if (node.type === 'forge') {
            this.openUpgradeModal(true);
        } else if (node.type === 'treasure') {
            this.openTreasureModal();
        } else if (node.type === 'rest') {
            this.openRestModal();
        } else if (node.type === 'merchant') {
            this.openShopModal(true);
        }
    },

    advanceMapNode: function() {
        this.currentNodeIndex++;
        if (this.currentNodeIndex >= this.stageNodes.length) {
            this.startStageMap(this.currentStage + 1);
        } else {
            this.saveGameData();
            this.renderDungeonMap();
        }
    },

    startCombat: function(isBossStage = false) {
        let scale = 1.0 + (this.currentStage - 1) * 0.35;
        let diffMult = this.difficulty === 'nightmare' ? 2.0 : (this.difficulty === 'hardcore' ? 1.5 : 1.0);
        let monsterData;

        if (isBossStage) {
            monsterData = ENEMY_DATABASE.find(m => m.isBoss && m.tier === Math.min(this.currentStage, 3)) || ENEMY_DATABASE.find(m => m.isBoss);
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

        const arenaHtml = `
            <div class="battle-arena">
                <!-- Clash Royale Compact Battle Stage -->
                <div class="clash-battle-stage">
                    <!-- Hero Unit Left -->
                    <div class="clash-unit-card" id="player-unit">
                        <div class="clash-portrait-box">
                            <img src="${player.img}" alt="${player.classType}" class="unit-img" id="player-img">
                            <div class="shield-overlay" id="player-shield-badge" style="display:${player.shield > 0 ? 'block' : 'none'}">🛡️ ${player.shield}</div>
                        </div>
                        <div class="clash-unit-details">
                            <div class="clash-unit-title">${player.classType} <span class="unit-lvl">Lvl ${player.level}</span></div>
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
                    <div class="clash-vs-badge">VS</div>

                    <!-- Enemy Unit Right -->
                    <div class="clash-unit-card" id="enemy-unit">
                        <div class="clash-portrait-box">
                            <img src="${enemy.img}" alt="${enemy.name}" class="unit-img" id="enemy-img">
                            ${enemy.isBoss ? '<div class="boss-crown">👑 BOSS</div>' : ''}
                        </div>
                        <div class="clash-unit-details">
                            <div class="clash-unit-title" style="color:${enemy.isBoss ? '#ff3366' : '#fff'}">${enemy.name}</div>
                            <div class="stat-bar-group">
                                <div class="bar-label"><span>HP</span> <span id="enemy-hp-txt">${enemy.health}/${enemy.maxHealth}</span></div>
                                <div class="bar-bg"><div class="bar-fill bar-hp" id="enemy-hp-bar" style="width: ${(enemy.health/enemy.maxHealth)*100}%"></div></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Clash Royale Action Deck Panel -->
                <div class="action-panel glass-panel">
                    <div class="clash-deck-header">
                        <div class="clash-mana-title">⚔️ Deck (Mana: <span style="color:#00d2ff;">${player.mana}/${player.maxMana} MP</span>)</div>
                        <div class="clash-potions-row">
                            <button class="btn btn-potion" onclick="GameManager.usePotion('hp')">❤️ (${player.potions.hpPotion})</button>
                            <button class="btn btn-potion" onclick="GameManager.usePotion('mp')">🧪 (${player.potions.mpPotion})</button>
                            <button class="btn btn-primary" onclick="GameManager.openInventoryModal()" style="background:linear-gradient(135deg, #f5c518 0%, #ff8c00 100%); color:#000; font-weight:800;">🎒 Inv</button>
                        </div>
                    </div>

                    <div id="skills-container">
                        ${this.renderSkillButtons()}
                    </div>
                </div>

                <!-- 1-Line Compact Battle Ticker -->
                <div class="clash-battle-ticker glass-panel" id="combat-ticker-box">
                    <div class="ticker-content" id="log-body"></div>
                </div>
            </div>
        `;

        viewContainer.innerHTML = arenaHtml;
    },

    renderSkillButtons: function() {
        if (enemy && enemy.health <= 0) {
            return `
                <button class="btn btn-primary animate-bounce" onclick="GameManager.advanceMapNode()" style="padding: 16px; font-size: 1.2rem; font-weight: 800; width: 100%;">
                    🎉 VICTORY! Click to Continue Expedition ➡️
                </button>
            `;
        }
        
    inspectedSkillIndex: null,

    toggleSkillInspect: function(skillIndex, event) {
        if (event) event.stopPropagation();
        SoundEngine.playClick();
        if (this.inspectedSkillIndex === skillIndex) {
            this.inspectedSkillIndex = null;
        } else {
            this.inspectedSkillIndex = skillIndex;
        }
        const skillsContainer = document.getElementById('skills-container');
        if (skillsContainer) {
            skillsContainer.innerHTML = this.renderSkillButtons();
        }
    },

    renderSkillButtons: function() {
        if (enemy && enemy.health <= 0) {
            return `
                <button class="btn btn-primary animate-bounce" onclick="GameManager.advanceMapNode()" style="padding: 16px; font-size: 1.2rem; font-weight: 800; width: 100%;">
                    🎉 VICTORY! Click to Continue Expedition ➡️
                </button>
            `;
        }
        
        let cardsHtml = player.skills.map((skill, index) => {
            const isCooldown = skill.currentCD > 0;
            const isInsufficientMana = player.mana < skill.manaCost;
            const disabled = isCooldown || isInsufficientMana || (enemy && enemy.health <= 0);
            const isInspected = this.inspectedSkillIndex === index;

            let iconClass = 'fa-khanda';
            if (skill.type === 'magic' || skill.element === 'fire') iconClass = 'fa-fire-flame-curved';
            else if (skill.element === 'dark') iconClass = 'fa-ghost';
            else if (skill.element === 'holy') iconClass = 'fa-sun';
            else if (skill.sound === 'heal') iconClass = 'fa-heart-pulse';
            else if (skill.sound === 'shield' || skill.type === 'buff') iconClass = 'fa-shield-halved';
            else if (skill.sound === 'heavyHit') iconClass = 'fa-skull';

            let elemClass = '';
            if (skill.element === 'fire') elemClass = 'elem-fire';
            else if (skill.element === 'dark') elemClass = 'elem-dark';
            else if (skill.element === 'holy') elemClass = 'elem-holy';
            else if (skill.type === 'buff') elemClass = 'elem-buff';

            return `
                <div class="clash-skill-card ${elemClass} ${disabled ? 'disabled' : ''}" 
                     onclick="${disabled ? '' : `GameManager.useSkill(${index})`}" 
                     onmouseenter="SoundEngine.playHover()">
                    
                    <div class="skill-mana-badge ${skill.manaCost === 0 ? 'free' : ''}">
                        ${skill.manaCost > 0 ? `${skill.manaCost} 💧` : 'Free'}
                    </div>

                    <button class="skill-star-btn ${isInspected ? 'active' : ''}" onclick="GameManager.toggleSkillInspect(${index}, event)" title="Inspect Skill Details">
                        ${isInspected ? '★' : '☆'}
                    </button>

                    <div class="skill-art-container">
                        <i class="fas ${iconClass}"></i>
                    </div>

                    <div class="skill-card-footer">
                        <div class="skill-card-name">${skill.name}</div>
                    </div>

                    ${isCooldown ? `
                        <div class="skill-lock-overlay">
                            <i class="fas fa-hourglass-half" style="font-size:1.4rem; margin-bottom:4px;"></i>
                            <span>${skill.currentCD} TURNS</span>
                        </div>
                    ` : ''}

                    ${!isCooldown && isInsufficientMana ? `
                        <div class="skill-lock-overlay">
                            <i class="fas fa-lock" style="font-size:1.4rem; margin-bottom:4px;"></i>
                            <span>NO MP</span>
                        </div>
                    ` : ''}

                    ${isInspected ? `
                        <div class="skill-inspect-popover animate-bounce" onclick="event.stopPropagation()">
                            <strong style="color:var(--gold); display:block; margin-bottom:4px; font-size:0.85rem;">${skill.name}</strong>
                            <p style="margin:0; font-size:0.75rem; color:#eee; line-height:1.3;">${skill.desc}</p>
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');

        return `
            <div class="clash-card-row">${cardsHtml}</div>
            <div style="font-size:0.75rem; color:var(--text-muted); text-align:center; margin-top:6px;">
                <i class="fas fa-hand-pointer" style="color:var(--gold);"></i> Tap ☆ on any card to reveal details
            </div>
        `;
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

        let dodgeChance = Math.min(player.DodgeChance, 0.25);
        if (Math.random() < dodgeChance) {
            this.spawnFloatingText(playerImgEl, 'DODGED!', 'dodge');
            this.logAction(`You dodged ${enemy.name}'s ${enemySkill.name}!`, 'info');
            DialogueEngine.spawnSpeechBubble('player-unit', DialogueEngine.getRandomDialogue('hero_dodge'), true);
        } else {
            let minDmg = enemy.isBoss ? Math.floor(player.maxHealth * 0.35) : Math.floor(player.maxHealth * 0.15);
            let baseDmg = enemy.strength * (enemy.isBoss ? 2.8 : 1.8);
            let damage = Math.max(minDmg, Math.floor(baseDmg * enemySkill.mult + (Math.random() * 15)));
            let isCrit = Math.random() < enemy.CritChance;
            if (isCrit) damage = Math.floor(damage * 1.6);

            // Item 5: Shield Absorption Bug Fix (100% absorption up to player.shield)
            // Hardcore Counter-Balance: Bosses execute 25% Shield Piercing (25% of boss damage bypasses shield directly to test hero HP!)
            if (player.shield > 0) {
                let piercingDmg = enemy.isBoss ? Math.floor(damage * 0.25) : 0;
                let blockableDmg = damage - piercingDmg;

                if (player.shield >= blockableDmg) {
                    player.shield -= blockableDmg;
                    damage = piercingDmg;
                    this.spawnFloatingText(playerImgEl, `Absorbed (${blockableDmg})`, 'heal');
                } else {
                    damage = (blockableDmg - player.shield) + piercingDmg;
                    this.spawnFloatingText(playerImgEl, `Absorbed (${player.shield})`, 'heal');
                    player.shield = 0;
                }

                if (piercingDmg > 0) {
                    this.logAction(`⚠️ ${enemy.name}'s Boss Strike pierced 25% of your shield! (${piercingDmg} Piercing Dmg)`, 'warning');
                }
            }

            if (damage > 0) {
                if (playerImgEl) {
                    playerImgEl.classList.add('anim-recoil');
                    setTimeout(() => playerImgEl.classList.remove('anim-recoil'), 400);
                }

                player.health = Math.max(0, player.health - damage);
                SoundEngine.playHeavyHit();
                ParticleEngine.triggerShake(enemy.isBoss ? 24 : 12);
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

    farmCount: 0,

    handleVictory: function() {
        SoundEngine.playVictory();

        // Item 6: Diminishing Returns Multiplier for Farmed Stage Runs
        // Multiplier = Math.max(0.20, Math.pow(0.50, farmCount))
        // 0 farm runs: 1.0 (100% full rewards)
        // 1 farm run: 0.50 (50% rewards)
        // 2 farm runs: 0.25 (25% rewards)
        // 3+ farm runs: 0.20 (20% floor minimum rewards)
        const mult = this.farmCount > 0 ? Math.max(0.20, Math.pow(0.50, this.farmCount)) : 1.0;
        const goldLoot = Math.max(1, Math.floor(enemy.goldReward * mult));
        const xpLoot = Math.max(1, Math.floor(enemy.xpReward * mult));
        const coinsLoot = Math.max(1, Math.floor((Math.random() * 10 + 15) * mult));

        player.gold += goldLoot;
        player.coins = (player.coins || 0) + coinsLoot;
        const leveledUp = player.addXP(xpLoot);

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

                    ${this.farmCount > 0 ? `
                        <div style="background:rgba(255,140,0,0.15); border:1px solid #ff8c00; border-radius:8px; padding:6px 12px; font-size:0.8rem; color:#ffb732; margin-bottom:12px;">
                            ⚠️ Repeat Farm Clear (Yield: ${Math.floor(mult * 100)}% - Diminishing Returns Active)
                        </div>
                    ` : ''}

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
        SoundEngine.playDefeat();
        if (player) {
            player.health = player.maxHealth;
            player.mana = player.maxMana;
            player.shield = 0;
        }

        const modalHtml = `
            <div class="modal-overlay">
                <div class="modal-card glass-panel text-center animate-bounce" style="max-width:520px; border:2px solid #ff2a5f; box-shadow:0 0 35px rgba(255,42,95,0.6);">
                    <h2 style="color:#ff2a5f; font-family:'MedievalSharp',serif; font-size:2.5rem; margin-bottom:6px;">💀 VANQUISHED</h2>
                    <p style="color:var(--text-muted); font-size:0.95rem; margin-bottom:18px;">
                        Slain on Stage ${this.currentStage} - Node ${this.currentNodeIndex + 1}.
                    </p>

                    <div class="glass-panel" style="padding:14px; text-align:left; font-size:0.85rem; color:var(--text-muted); margin-bottom:20px; border:1px solid rgba(255,255,255,0.1);">
                        <strong style="color:var(--gold);"><i class="fas fa-shield-halved"></i> Hardcore Guidance:</strong>
                        <div style="margin-top:6px; line-height:1.4;">
                            You can retry this node directly, or farm earlier stage fights to collect Gold & XP to upgrade gear/stats.
                            <br><span style="color:#ff3366; font-weight:700;">⚠️ Diminishing Returns:</span> Farmed node rewards scale down by 50% per repeat run (Min 20% floor). Grinding narrows the gap, but strategy is mandatory!
                        </div>
                    </div>

                    <div style="display:flex; gap:10px; justify-content:center; flex-wrap:wrap;">
                        <button class="btn btn-primary" onclick="GameManager.closeModal(); GameManager.startCombat(enemy ? enemy.isBoss : false);" style="padding:12px 18px;">
                            🔄 Retry Fight
                        </button>
                        <button class="btn btn-potion" onclick="GameManager.farmStageFights();" style="padding:12px 18px; background:linear-gradient(135deg, #ff8c00 0%, #d97706 100%); color:#fff; font-weight:800;">
                            🌾 Farm Stage Fights
                        </button>
                        <button class="btn btn-secondary" onclick="GameManager.closeModal(); GameManager.renderDungeonMap();" style="padding:12px 18px;">
                            🗺️ Expedition Map
                        </button>
                    </div>
                </div>
            </div>
        `;
        this.showModal(modalHtml);
    },

    farmStageFights: function() {
        this.farmCount = (this.farmCount || 0) + 1;
        this.currentNodeIndex = 0;
        this.closeModal();
        const yieldPct = Math.max(20, Math.floor(Math.pow(0.50, this.farmCount) * 100));
        this.showToast(`Stage reset for farming! Repeat clear rewards yield: ${yieldPct}% (Diminishing Returns)`, 'warning');
        this.renderDungeonMap();
    },

    openUpgradeModal: function(isMapNode = false) {
        if (isMapNode) this.isCurrentNodeForge = true;
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
                <div class="modal-card glass-panel" style="max-width:720px;">
                    <div class="modal-header">
                        <h2>🔨 Blacksmith Forge, Gem Workbench & Pet Evolution</h2>
                        <span class="stat-chip coin-badge">⚔️ ${player.coins || 0} Victory Coins</span>
                        <button class="close-btn" onclick="GameManager.closeForgeModal()">&times;</button>
                    </div>

                    <p style="color:var(--text-muted); margin-bottom:16px;">Forge gear upgrades, socket elemental gems, and evolve pet companions into mythic legendary beasts!</p>

                    <!-- Section 1: Gear Upgrades -->
                    <h3 style="color:var(--gold); margin-bottom:10px; font-size:1.1rem;"><i class="fas fa-hammer"></i> Gear Refinement (+1 to +10)</h3>
                    <div class="upgrade-grid" style="margin-bottom:20px;">
                        <div class="upgrade-card glass-panel relative-item-card text-center">
                            <button class="item-inspect-star-btn" onclick="GameManager.showItemInfo('iron_sword', event)" title="Inspect Item Lore & Stats">⭐</button>
                            <div class="item-icon-frame">
                                <img src="characters imgs/items/iron_sword.jpg" alt="Iron Sword" class="item-icon-img">
                            </div>
                            <div class="upgrade-top">
                                <strong>⚔️ Weapon (+${wLvl})</strong>
                                <span class="upgrade-stat" style="color:var(--gold);">+${Math.floor(wLvl * 15)}% STR/INT</span>
                            </div>
                            <div class="item-name" style="margin:6px 0; font-weight:700;">${player.equipment.weapon ? player.equipment.weapon.name : 'Iron Sword'}</div>
                            <button class="btn btn-primary" onclick="GameManager.upgradeGearSlot('weapon')" ${(player.coins || 0) < wCost || wLvl >= 10 ? 'disabled' : ''} style="width:100%;">
                                ${wLvl >= 10 ? 'MAX +10' : `Upgrade (+1) ⚔️ ${wCost} Coins`}
                            </button>
                        </div>

                        <div class="upgrade-card glass-panel relative-item-card text-center">
                            <button class="item-inspect-star-btn" onclick="GameManager.showItemInfo('leather_vest', event)" title="Inspect Item Lore & Stats">⭐</button>
                            <div class="item-icon-frame">
                                <img src="characters imgs/items/leather_vest.jpg" alt="Leather Vest" class="item-icon-img">
                            </div>
                            <div class="upgrade-top">
                                <strong>🛡️ Armor (+${aLvl})</strong>
                                <span class="upgrade-stat" style="color:var(--heal-green);">+${Math.floor(aLvl * 15)}% VIT/HP</span>
                            </div>
                            <div class="item-name" style="margin:6px 0; font-weight:700;">${player.equipment.armor ? player.equipment.armor.name : 'Leather Vest'}</div>
                            <button class="btn btn-primary" onclick="GameManager.upgradeGearSlot('armor')" ${(player.coins || 0) < aCost || aLvl >= 10 ? 'disabled' : ''} style="width:100%;">
                                ${aLvl >= 10 ? 'MAX +10' : `Upgrade (+1) ⚔️ ${aCost} Coins`}
                            </button>
                        </div>

                        <div class="upgrade-card glass-panel relative-item-card text-center">
                            <button class="item-inspect-star-btn" onclick="GameManager.showItemInfo('wooden_ring', event)" title="Inspect Item Lore & Stats">⭐</button>
                            <div class="item-icon-frame">
                                <img src="characters imgs/items/wooden_ring.jpg" alt="Wooden Ring" class="item-icon-img">
                            </div>
                            <div class="upgrade-top">
                                <strong>💍 Accessory (+${accLvl})</strong>
                                <span class="upgrade-stat" style="color:var(--mana-blue);">+${Math.floor(accLvl * 15)}% AGI/Crit</span>
                            </div>
                            <div class="item-name" style="margin:6px 0; font-weight:700;">${player.equipment.accessory ? player.equipment.accessory.name : 'Wooden Ring'}</div>
                            <button class="btn btn-primary" onclick="GameManager.upgradeGearSlot('accessory')" ${(player.coins || 0) < accCost || accLvl >= 10 ? 'disabled' : ''} style="width:100%;">
                                ${accLvl >= 10 ? 'MAX +10' : `Upgrade (+1) ⚔️ ${accCost} Coins`}
                            </button>
                        </div>
                    </div>

                    <!-- Section 2: Elemental Gem Workbench -->
                    <h3 style="color:var(--gold); margin-bottom:10px; font-size:1.1rem;"><i class="fas fa-gem"></i> ✨ Elemental Gem Socketing</h3>
                    <div style="background:rgba(0,0,0,0.3); padding:12px; border-radius:10px; margin-bottom:20px; border:1px solid var(--glass-border);">
                        <div style="margin-bottom:10px; font-size:0.9rem;">
                            Current Socketed Gem: <strong style="color:${player.socketedGem ? player.socketedGem.color : '#aaa'}">${player.socketedGem ? player.socketedGem.name : 'Empty Socket'}</strong>
                        </div>
                        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:10px;">
                            ${Object.values(GEMS).map(gem => {
                                const gemKey = gem.id === 'ruby' ? 'ruby_gem' : (gem.id === 'sapphire' ? 'sapphire_gem' : (gem.id === 'emerald' ? 'emerald_gem' : 'diamond_gem'));
                                return `
                                    <div class="glass-panel relative-item-card" style="padding:10px; border-radius:8px; border:1px solid ${gem.color}; text-align:center;">
                                        <button class="item-inspect-star-btn" onclick="GameManager.showItemInfo('${gemKey}', event)" title="Inspect Gem Lore & Stats">⭐</button>
                                        <div class="item-icon-frame" style="width:52px; height:52px; border-color:${gem.color}; margin-bottom:6px;">
                                            <img src="characters imgs/items/${gemKey}.jpg" alt="${gem.name}" class="item-icon-img">
                                        </div>
                                        <div style="font-weight:700; color:${gem.color}; font-size:0.85rem;">${gem.name}</div>
                                        <div style="color:var(--text-muted); font-size:0.75rem; margin:3px 0 8px 0;">${gem.stat}</div>
                                        <button class="btn btn-potion" onclick="GameManager.socketGem('${gem.id}')" ${player.gold < gem.price ? 'disabled' : ''} style="width:100%; font-size:0.8rem; padding:6px;">
                                            Socket (${gem.price} Gold)
                                        </button>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>

                    <!-- Section 3: Pet Evolution Chamber -->
                    <h3 style="color:var(--gold); margin-bottom:10px; font-size:1.1rem;"><i class="fas fa-dragon"></i> 🐉 Pet Evolution Chamber</h3>
                    <div style="background:rgba(0,0,0,0.3); padding:12px; border-radius:10px; border:1px solid var(--glass-border);">
                        ${!player.companion ? `
                            <div class="relative-item-card" style="display:flex; align-items:center; gap:16px;">
                                <button class="item-inspect-star-btn" onclick="GameManager.showItemInfo('pet_egg', event)" title="Inspect Pet Egg">⭐</button>
                                <div class="item-icon-frame" style="width:60px; height:60px; margin:0; flex-shrink:0;">
                                    <img src="characters imgs/items/pet_egg.jpg" alt="Unhatched Egg" class="item-icon-img">
                                </div>
                                <div style="color:var(--text-muted); font-size:0.9rem;">
                                    <strong>No Pet Companion Recruited</strong><br>
                                    Visit the Wandering Merchant at Node 6 on the Expedition Map to adopt a mythic companion!
                                </div>
                            </div>
                        ` : `
                            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                                <div>
                                    <strong style="color:var(--gold); font-size:1rem;">${player.companion.name} (Tier ${player.companion.tier || 1})</strong>
                                    <div style="color:var(--text-muted); font-size:0.8rem;">${player.companion.desc}</div>
                                </div>
                                <div>
                                    ${(player.companion.tier || 1) >= 3 ? `
                                        <span class="stat-chip" style="color:var(--gold); background:rgba(245,197,24,0.2);">MAX TIER 3 MYTHIC</span>
                                    ` : `
                                        <button class="btn btn-primary" onclick="GameManager.evolveCompanion()" 
                                                ${(player.coins || 0) < (player.companion.evolveCost || 30) || player.level < ((player.companion.tier || 1) === 1 ? 5 : 10) ? 'disabled' : ''}>
                                            🐉 Evolve to Tier ${(player.companion.tier || 1) + 1} (⚔️ ${player.companion.evolveCost || 30} Coins)
                                        </button>
                                        <div style="font-size:0.75rem; color:var(--text-muted); text-align:right; margin-top:2px;">
                                            Requires Level ${(player.companion.tier || 1) === 1 ? 5 : 10} (Current: Lvl ${player.level})
                                        </div>
                                    `}
                                </div>
                            </div>
                        `}
                    </div>

                    <div style="margin-top:20px; text-align:right;">
                        <button class="btn btn-secondary" onclick="GameManager.closeForgeModal()">Exit Forge</button>
                    </div>
                </div>
            </div>
        `;
        this.showModal(modalHtml);
    },

    closeForgeModal: function() {
        this.closeModal();
        if (this.isCurrentNodeForge) {
            this.isCurrentNodeForge = false;
            this.advanceMapNode();
        }
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
        this.openUpgradeModal(this.isCurrentNodeForge);
    },

    socketGem: function(gemKey) {
        if (!player) return;
        const gem = GEMS[gemKey];
        if (!gem) return;

        if (player.gold < gem.price) {
            this.logAction(`Not enough gold to socket ${gem.name}!`, 'warning');
            return;
        }

        player.gold -= gem.price;
        player.socketedGem = gem;
        SoundEngine.playLevelUp();
        this.logAction(`Socketed <strong>${gem.name}</strong>! Passive active in combat!`, 'info');
        this.saveGameData();
        this.updateHeaderStats();
        this.openUpgradeModal(this.isCurrentNodeForge);
    },

    evolveCompanion: function() {
        if (!player || !player.companion) return;
        const currentTier = player.companion.tier || 1;
        if (currentTier >= 3) return;

        const reqLevel = currentTier === 1 ? 5 : 10;
        if (player.level < reqLevel) {
            this.logAction(`Pet evolution requires Hero Level ${reqLevel}!`, 'warning');
            return;
        }

        const cost = player.companion.evolveCost || 30;
        if ((player.coins || 0) < cost) {
            this.logAction(`Not enough Victory Coins to evolve pet! Need ⚔️ ${cost} Coins.`, 'warning');
            return;
        }

        player.coins -= cost;
        player.companion.tier = currentTier + 1;
        const compKey = player.companion.id;
        const evoList = COMPANION_EVOLUTIONS[compKey];
        if (evoList && evoList[currentTier]) {
            player.companion.name = evoList[currentTier].name;
        }
        player.companion.evolveCost = cost * 2;
        SoundEngine.playLevelUp();
        ParticleEngine.triggerShake(20);
        this.logAction(`🐉 MYTHIC EVOLUTION! Pet evolved into <strong>${player.companion.name} (Tier ${player.companion.tier})</strong>!`, 'info');
        this.saveGameData();
        this.updateHeaderStats();
        this.openUpgradeModal(this.isCurrentNodeForge);
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
                        <button class="btn btn-danger" onclick="GameManager.resetGameSession()" style="background:#ff2a5f; color:#fff; border:none; padding:10px 16px; font-weight:700; border-radius:8px; cursor:pointer;"><i class="fas fa-undo"></i> 🔄 Reset & New Game</button>
                        <button class="btn btn-secondary" onclick="GameManager.closeModal()">Close</button>
                    </div>
                </div>
            </div>
        `;
        this.showModal(modalHtml);
    },

    resetGameSession: function() {
        this.showConfirmModal({
            title: "New Game / Reset Run",
            message: "Are you sure you want to reset your hero progress and start a new run from scratch? All active stage progress for this world will be cleared.",
            confirmText: "Reset & Start New Run",
            danger: true,
            onConfirm: () => {
                try {
                    this.setCookie(`dungeon_crawl_world_${this.activeWorld}`, '', -1);
                    this.setCookie('dungeon_crawl_session', '', -1);
                    localStorage.removeItem(`dungeon_crawl_save_slot_${this.activeWorld}`);
                    localStorage.removeItem('antigravity_rpg_save');
                } catch(e) {}

                player = null;
                this.currentStage = 1;
                this.currentNodeIndex = 0;
                this.closeModal();

                SoundEngine.playClick();
                this.showToast("Hero run reset successfully! Choose your champion.", "info");
                this.renderHeroSelect();
            }
        });
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
        this.showToast(`Saved progress successfully to Local Slot ${slotIdx}!`, 'success');
        this.openSettingsModal();
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
        this.showToast(`Loaded Hero Run (Slot ${slotIdx})`, 'success');
    },

    deleteSlot: function(slotIdx) {
        this.showConfirmModal({
            title: `Delete Slot ${slotIdx}`,
            message: `Are you sure you want to delete Local Save Slot ${slotIdx}?`,
            confirmText: `Delete Slot ${slotIdx}`,
            danger: true,
            onConfirm: () => {
                localStorage.removeItem(`dungeon_crawl_save_slot_${slotIdx}`);
                SoundEngine.playClick();
                this.showToast(`Slot ${slotIdx} deleted.`, 'info');
                this.openSettingsModal();
            }
        });
    },

    exportSaveCode: function() {
        if (!player) {
            this.showToast("No active hero to export!", "error");
            return;
        }
        const raw = localStorage.getItem('dungeon_crawl_save_slot_1') || localStorage.getItem('antigravity_rpg_save');
        if (!raw) {
            this.showToast("Please save your game first before exporting code!", "warning");
            return;
        }
        const code = btoa(raw);
        navigator.clipboard.writeText(code);
        this.showToast("📋 Save Code copied to clipboard!", "success");
    },

    importSaveCode: function() {
        this.showInputModal({
            title: "📥 Import Game Save Code",
            message: "Paste your base64 encoded save code below to restore your hero expedition:",
            placeholder: "Paste Save Code here...",
            onSubmit: (code) => {
                if (!code || !code.trim()) return;
                try {
                    const raw = atob(code.trim());
                    localStorage.setItem('dungeon_crawl_save_slot_1', raw);
                    this.loadFromSlot(1);
                    this.showToast("Imported Save Code successfully!", "success");
                } catch (e) {
                    this.showToast("Invalid Save Code format!", "error");
                }
            }
        });
    },

    openShrineModal: function() {
        SoundEngine.playClick();
        const modalHtml = `
            <div class="modal-overlay" onclick="if(event.target === this) GameManager.closeShrineModal()">
                <div class="modal-card glass-panel text-center" style="max-width:580px;">
                    <div class="modal-header">
                        <h2 style="color:var(--gold); font-size:2rem; margin:0;">🏛️ Ancient Rune Shrine</h2>
                        <button class="close-btn" onclick="GameManager.closeShrineModal()">&times;</button>
                    </div>
                    <p style="color:var(--text-muted); margin:12px 0 20px 0;">Touch an ancient glowing rune to receive a permanent stage blessing!</p>

                    <div style="display:flex; flex-direction:column; gap:14px;">
                        <button class="btn btn-potion" onclick="GameManager.claimShrine('crit')" style="padding:14px; text-align:left; font-size:1.05rem; width:100%;">
                            ⚡ <strong>Rune of Lethality:</strong> +20% Critical Hit Rate & Critical Damage
                        </button>
                        <button class="btn btn-potion" onclick="GameManager.claimShrine('dodge')" style="padding:14px; text-align:left; font-size:1.05rem; width:100%;">
                            🛡️ <strong>Rune of Evasion:</strong> +15% Dodge Chance & Evasion Speed
                        </button>
                        <button class="btn btn-potion" onclick="GameManager.claimShrine('maxHp')" style="padding:14px; text-align:left; font-size:1.05rem; width:100%;">
                            ❤️ <strong>Rune of Vitality:</strong> +30% Max HP & 100% Full Health Restoration
                        </button>
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

    openRestModal: function() {
        SoundEngine.playClick();
        const modalHtml = `
            <div class="modal-overlay" onclick="if(event.target === this) GameManager.closeRestModal()">
                <div class="modal-card glass-panel text-center" style="max-width:550px;">
                    <div class="modal-header">
                        <h2 style="color:#ff9900; font-size:2rem; margin:0;">🏕️ Campfire Rest Site</h2>
                        <button class="close-btn" onclick="GameManager.closeRestModal()">&times;</button>
                    </div>
                    <p style="color:var(--text-muted); margin:12px 0 20px 0;">Warm fire crackles in the dungeon depths. Rest your weary bones before proceeding further!</p>

                    <div style="display:flex; flex-direction:column; gap:12px;">
                        <button class="btn btn-potion" onclick="GameManager.restAtCampfire('heal')" style="padding:14px; font-size:1.1rem;">
                            ❤️ <strong>Rest & Recover:</strong> Restore 100% HP & MP
                        </button>
                        <button class="btn btn-primary" onclick="GameManager.restAtCampfire('buff')" style="padding:14px; font-size:1.1rem;">
                            ⚔️ <strong>Sharpen Blade:</strong> Gain +15% Damage Boost for Next Battle
                        </button>
                    </div>

                    <div style="margin-top:20px; text-align:right;">
                        <button class="btn btn-secondary" onclick="GameManager.closeRestModal()">Skip Rest & Continue</button>
                    </div>
                </div>
            </div>
        `;
        this.showModal(modalHtml);
    },

    restAtCampfire: function(option) {
        if (option === 'heal') {
            player.health = player.maxHealth;
            player.mana = player.maxMana;
            SoundEngine.playHeal();
            this.logAction("Rested at Campfire: <strong>HP & MP 100% Restored!</strong>", "heal");
        } else if (option === 'buff') {
            player.buffCrit = true;
            SoundEngine.playLevelUp();
            this.logAction("Sharpened Blade: <strong>+15% Critical Damage Boosted!</strong>", "info");
        }
        this.closeModal();
        this.advanceMapNode();
    },

    closeRestModal: function() {
        this.closeModal();
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

    openInventoryModal: function(activeTab = 'wealth') {
        SoundEngine.playClick();
        if (!player) {
            const modalHtml = `
                <div class="modal-overlay" onclick="if(event.target === this) GameManager.closeModal()">
                    <div class="modal-card glass-panel text-center" style="max-width:480px;">
                        <h2 style="color:var(--gold); margin-bottom:10px;"><i class="fas fa-briefcase"></i> RPG Inventory</h2>
                        <p style="color:var(--text-muted); margin-bottom:20px;">You have not chosen a Hero Champion yet! Please select your Hero class to unlock your inventory, coins, pets, and power-ups.</p>
                        <button class="btn btn-primary" onclick="GameManager.closeModal()">OK, Choose Champion</button>
                    </div>
                </div>
            `;
            this.showModal(modalHtml);
            return;
        }

        const wLvl = player.equipment.weaponLevel || 0;
        const aLvl = player.equipment.armorLevel || 0;
        const accLvl = player.equipment.accessoryLevel || 0;

        const modalHtml = `
            <div class="modal-overlay" onclick="if(event.target === this) GameManager.closeModal()">
                <div class="modal-card glass-panel inventory-modal-box">
                    <div class="modal-header" style="margin-bottom:12px;">
                        <div style="display:flex; align-items:center; gap:10px;">
                            <img src="${player.img}" alt="${player.classType}" style="width:42px; height:42px; border-radius:50%; border:2px solid var(--gold); object-fit:cover;">
                            <div>
                                <h2 style="margin:0; font-size:1.4rem;"><i class="fas fa-briefcase" style="color:var(--gold);"></i> ${player.classType} Inventory</h2>
                                <div style="font-size:0.8rem; color:var(--text-muted);">Level ${player.level} ${player.specialization ? player.specialization.name : player.title}</div>
                            </div>
                        </div>
                        <button class="close-btn" onclick="GameManager.closeModal()">&times;</button>
                    </div>

                    <!-- Inventory Tabs -->
                    <div class="inventory-tabs">
                        <button class="inv-tab-btn ${activeTab === 'wealth' ? 'active' : ''}" onclick="GameManager.switchInventoryTab('wealth')">
                            <i class="fas fa-coins"></i> Stats & Coins
                        </button>
                        <button class="inv-tab-btn ${activeTab === 'gear' ? 'active' : ''}" onclick="GameManager.switchInventoryTab('gear')">
                            <i class="fas fa-shield-halved"></i> Gear & Gems
                        </button>
                        <button class="inv-tab-btn ${activeTab === 'pets' ? 'active' : ''}" onclick="GameManager.switchInventoryTab('pets')">
                            <i class="fas fa-dragon"></i> Pets & Allies
                        </button>
                        <button class="inv-tab-btn ${activeTab === 'potions' ? 'active' : ''}" onclick="GameManager.switchInventoryTab('potions')">
                            <i class="fas fa-flask"></i> Potions & Buffs
                        </button>
                    </div>

                    <!-- Tab 1: Stats & Coins -->
                    <div id="inv-tab-wealth" class="inv-tab-pane ${activeTab === 'wealth' ? 'active' : ''}">
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:16px;">
                            <div class="glass-panel" style="padding:12px; border:1px solid var(--gold); text-align:center;">
                                <div style="font-size:0.8rem; color:var(--text-muted);">🪙 Gold Treasures</div>
                                <div style="font-size:1.6rem; font-weight:800; color:var(--gold);">${player.gold}</div>
                            </div>
                            <div class="glass-panel" style="padding:12px; border:1px solid #ff9900; text-align:center;">
                                <div style="font-size:0.8rem; color:var(--text-muted);">⚔️ Victory Coins</div>
                                <div style="font-size:1.6rem; font-weight:800; color:#ff9900;">${player.coins || 0}</div>
                            </div>
                        </div>

                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                            <h3 style="color:var(--gold); font-size:1.05rem; margin:0;"><i class="fas fa-chart-line"></i> Attribute Point Allocation</h3>
                            <span class="stat-pts-badge" style="background:rgba(138,43,226,0.3); border:1px solid var(--primary); padding:4px 12px; border-radius:20px; font-weight:800; font-size:0.85rem;">
                                Points Available: ${player.statPoints}
                            </span>
                        </div>

                        <div class="stat-alloc-card">
                            <div>
                                <strong style="color:#ff3366;"><i class="fas fa-fist-raised"></i> Strength (STR)</strong>
                                <div style="font-size:0.8rem; color:var(--text-muted);">Total: ${player.TotalStr} (+${player.str - (HERO_CLASSES[player.classType]?.baseStats.str || 0)} allocated)</div>
                            </div>
                            <button class="stat-alloc-btn" onclick="GameManager.addStatFromInventory('str')" ${player.statPoints <= 0 ? 'disabled' : ''}>+</button>
                        </div>

                        <div class="stat-alloc-card">
                            <div>
                                <strong style="color:#00d2ff;"><i class="fas fa-running"></i> Agility (AGI)</strong>
                                <div style="font-size:0.8rem; color:var(--text-muted);">Total: ${player.TotalAgi} | Dodge: ${Math.floor(player.DodgeChance*100)}%</div>
                            </div>
                            <button class="stat-alloc-btn" onclick="GameManager.addStatFromInventory('agi')" ${player.statPoints <= 0 ? 'disabled' : ''}>+</button>
                        </div>

                        <div class="stat-alloc-card">
                            <div>
                                <strong style="color:#aa00ff;"><i class="fas fa-hat-wizard"></i> Intelligence (INT)</strong>
                                <div style="font-size:0.8rem; color:var(--text-muted);">Total: ${player.TotalInt} | Max MP: ${player.maxMana}</div>
                            </div>
                            <button class="stat-alloc-btn" onclick="GameManager.addStatFromInventory('int')" ${player.statPoints <= 0 ? 'disabled' : ''}>+</button>
                        </div>

                        <div class="stat-alloc-card">
                            <div>
                                <strong style="color:#00ff9d;"><i class="fas fa-heart"></i> Vitality (VIT)</strong>
                                <div style="font-size:0.8rem; color:var(--text-muted);">Total: ${player.TotalVit} | Max HP: ${player.maxHealth}</div>
                            </div>
                            <button class="stat-alloc-btn" onclick="GameManager.addStatFromInventory('vit')" ${player.statPoints <= 0 ? 'disabled' : ''}>+</button>
                        </div>
                    </div>

                    <!-- Tab 2: Gear & Gems -->
                    <div id="inv-tab-gear" class="inv-tab-pane ${activeTab === 'gear' ? 'active' : ''}">
                        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:12px; margin-bottom:16px;">
                            <div class="glass-panel relative-item-card text-center" style="padding:12px;">
                                <button class="item-inspect-star-btn" onclick="GameManager.showItemInfo('iron_sword', event)" title="Inspect Item Lore & Stats">⭐</button>
                                <div class="item-icon-frame" style="width:54px; height:54px;">
                                    <img src="characters imgs/items/iron_sword.jpg" alt="Iron Sword" class="item-icon-img">
                                </div>
                                <div style="font-size:0.8rem; color:var(--text-muted);">⚔️ Weapon (+${wLvl})</div>
                                <div style="font-weight:700; color:var(--gold); margin:4px 0;">${player.equipment.weapon ? player.equipment.weapon.name : 'Iron Sword'}</div>
                                <div style="font-size:0.8rem; color:#aaa;">+${Math.floor(wLvl * 15)}% Bonus Attack Power</div>
                            </div>

                            <div class="glass-panel relative-item-card text-center" style="padding:12px;">
                                <button class="item-inspect-star-btn" onclick="GameManager.showItemInfo('leather_vest', event)" title="Inspect Item Lore & Stats">⭐</button>
                                <div class="item-icon-frame" style="width:54px; height:54px;">
                                    <img src="characters imgs/items/leather_vest.jpg" alt="Leather Vest" class="item-icon-img">
                                </div>
                                <div style="font-size:0.8rem; color:var(--text-muted);">🛡️ Armor (+${aLvl})</div>
                                <div style="font-weight:700; color:var(--heal-green); margin:4px 0;">${player.equipment.armor ? player.equipment.armor.name : 'Leather Vest'}</div>
                                <div style="font-size:0.8rem; color:#aaa;">+${Math.floor(aLvl * 15)}% Bonus Health</div>
                            </div>

                            <div class="glass-panel relative-item-card text-center" style="padding:12px;">
                                <button class="item-inspect-star-btn" onclick="GameManager.showItemInfo('wooden_ring', event)" title="Inspect Item Lore & Stats">⭐</button>
                                <div class="item-icon-frame" style="width:54px; height:54px;">
                                    <img src="characters imgs/items/wooden_ring.jpg" alt="Wooden Ring" class="item-icon-img">
                                </div>
                                <div style="font-size:0.8rem; color:var(--text-muted);">💍 Accessory (+${accLvl})</div>
                                <div style="font-weight:700; color:var(--mana-blue); margin:4px 0;">${player.equipment.accessory ? player.equipment.accessory.name : 'Wooden Ring'}</div>
                                <div style="font-size:0.8rem; color:#aaa;">+${Math.floor(accLvl * 15)}% Bonus Crit/Agility</div>
                            </div>
                        </div>

                        <div class="glass-panel" style="padding:14px; border:1px solid ${player.socketedGem ? player.socketedGem.color : 'var(--glass-border)'}; margin-bottom:16px;">
                            <div style="display:flex; justify-content:space-between; align-items:center;">
                                <div>
                                    <div style="font-size:0.8rem; color:var(--text-muted);">✨ Socketed Elemental Gem</div>
                                    <strong style="color:${player.socketedGem ? player.socketedGem.color : '#aaa'}; font-size:1.05rem;">
                                        ${player.socketedGem ? player.socketedGem.name : 'Empty Gem Socket'}
                                    </strong>
                                    <div style="font-size:0.85rem; color:var(--text-muted); margin-top:2px;">
                                        ${player.socketedGem ? player.socketedGem.stat : 'Socket a gem in the Blacksmith Forge to unlock elemental passives.'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="glass-panel text-center" style="padding:12px; border:1px dashed var(--gold); color:var(--text-muted); font-size:0.88rem; margin-top:10px;">
                            <i class="fas fa-map-marker-alt" style="color:var(--gold); font-size:1.1rem; margin-bottom:4px;"></i><br>
                            📍 <strong>Map Navigation Required</strong>: Visit the <strong>Blacksmith Forge at Node 3</strong> on the Expedition Map to refine gear & socket gems.
                        </div>
                    </div>

                    <!-- Tab 3: Pets & Allies -->
                    <div id="inv-tab-pets" class="inv-tab-pane ${activeTab === 'pets' ? 'active' : ''}">
                        ${!player.companion ? `
                            <div class="glass-panel text-center" style="padding:24px;">
                                <i class="fas fa-paw" style="font-size:2.4rem; color:var(--text-muted); margin-bottom:12px;"></i>
                                <h4 style="color:var(--gold); margin-bottom:6px;">No Pet Companion Recruited</h4>
                                <p style="color:var(--text-muted); font-size:0.9rem; margin-bottom:14px;">Visit the Wandering Merchant at Node 6 to hire a loyal Dire Wolf, Arcane Golem, Holy Cleric, or Shadow Drake!</p>
                                <div style="font-size:0.85rem; color:var(--text-muted); font-style:italic;">📍 Visit Node 6 on Map to Recruit</div>
                            </div>
                        ` : `
                            <div class="glass-panel" style="padding:16px; border:1px solid var(--gold); margin-bottom:12px;">
                                <div style="display:flex; gap:16px; align-items:center;">
                                    <img src="${player.companion.img || 'characters imgs/enemy/goblin_scout.jpg'}" alt="${player.companion.name}" style="width:70px; height:70px; border-radius:14px; object-fit:cover; border:2px solid var(--gold);">
                                    <div style="flex-grow:1;">
                                        <div style="display:flex; justify-content:space-between; align-items:center;">
                                            <h3 style="color:var(--gold); margin:0;">${player.companion.name}</h3>
                                            <span class="stat-chip" style="color:var(--gold); background:rgba(245,197,24,0.2); font-size:0.75rem;">Tier ${player.companion.tier || 1} Ally</span>
                                        </div>
                                        <div style="color:var(--text-muted); font-size:0.85rem; margin:4px 0;">${player.companion.title}</div>
                                        <div style="font-size:0.85rem; color:#fff;">${player.companion.desc}</div>
                                    </div>
                                </div>
                            </div>
                            <div class="glass-panel text-center" style="padding:12px; border:1px dashed var(--mana-blue); color:var(--text-muted); font-size:0.88rem;">
                                <i class="fas fa-map-marker-alt" style="color:var(--mana-blue); font-size:1.1rem; margin-bottom:4px;"></i><br>
                                📍 <strong>Map Navigation Required</strong>: Visit the <strong>Blacksmith Forge at Node 3</strong> to evolve your Pet Companion.
                            </div>
                        `}
                    </div>

                    <!-- Tab 4: Potions & Buffs -->
                    <div id="inv-tab-potions" class="inv-tab-pane ${activeTab === 'potions' ? 'active' : ''}">
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-bottom:16px;">
                            <div class="glass-panel" style="padding:14px; text-align:center;">
                                <div style="margin-bottom:6px;"><i class="fas fa-flask" style="color:#ff2a5f; font-size:2.2rem;"></i></div>
                                <h4 style="color:var(--heal-green); margin-bottom:2px;">Health Potion</h4>
                                <div style="font-size:0.8rem; color:var(--text-muted); margin-bottom:8px;">Restores 50% Max HP</div>
                                <div style="font-size:1.1rem; font-weight:800; margin-bottom:10px;">${player.potions.hpPotion} Remaining</div>
                                <button class="btn btn-potion" onclick="GameManager.usePotion('hp'); GameManager.openInventoryModal('potions');" ${player.potions.hpPotion <= 0 ? 'disabled' : ''} style="width:100%; background:linear-gradient(135deg, #ff2a5f 0%, #b3002d 100%); color:#fff; font-weight:800;">
                                    Drink HP Potion
                                </button>
                            </div>

                            <div class="glass-panel" style="padding:14px; text-align:center;">
                                <div style="margin-bottom:6px;"><i class="fas fa-flask" style="color:#00d2ff; font-size:2.2rem;"></i></div>
                                <h4 style="color:var(--mana-blue); margin-bottom:2px;">Mana Potion</h4>
                                <div style="font-size:0.8rem; color:var(--text-muted); margin-bottom:8px;">Restores 60% Max MP</div>
                                <div style="font-size:1.1rem; font-weight:800; margin-bottom:10px;">${player.potions.mpPotion} Remaining</div>
                                <button class="btn btn-potion" onclick="GameManager.usePotion('mp'); GameManager.openInventoryModal('potions');" ${player.potions.mpPotion <= 0 ? 'disabled' : ''} style="width:100%; background:linear-gradient(135deg, #00d2ff 0%, #0066cc 100%); color:#fff; font-weight:800;">
                                    Drink MP Potion
                                </button>
                            </div>
                        </div>

                        <div class="glass-panel" style="padding:14px;">
                            <h4 style="color:var(--gold); margin-bottom:8px;"><i class="fas fa-bolt"></i> Active Combat Buffs & Status</h4>
                            <div style="font-size:0.88rem; line-height:1.6;">
                                <div>🛡️ <strong>Shield Points:</strong> <span style="color:var(--mana-blue);">${player.shield || 0} Shield</span></div>
                                <div>🎯 <strong>Critical Hit Rate:</strong> ${Math.floor(player.CritChance*100)}%</div>
                                <div>💨 <strong>Dodge Evasion Rate:</strong> ${Math.floor(player.DodgeChance*100)}%</div>
                            </div>
                        </div>
                    </div>

                    <div style="margin-top:20px; text-align:right;">
                        <button class="btn btn-secondary" onclick="GameManager.closeModal()">Close Inventory</button>
                    </div>
                </div>
            </div>
        `;
        this.showModal(modalHtml);
    },

    switchInventoryTab: function(tabName) {
        SoundEngine.playClick();
        const tabs = document.querySelectorAll('.inv-tab-btn');
        tabs.forEach(t => t.classList.remove('active'));
        const panes = document.querySelectorAll('.inv-tab-pane');
        panes.forEach(p => p.classList.remove('active'));

        const targetPane = document.getElementById(`inv-tab-${tabName}`);
        if (targetPane) targetPane.classList.add('active');

        const activeBtn = Array.from(tabs).find(b => b.getAttribute('onclick') && b.getAttribute('onclick').includes(tabName));
        if (activeBtn) activeBtn.classList.add('active');
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
        if (pData.companion && COMPANIONS[pData.companion]) player.companion = COMPANIONS[pData.companion];
        if (pData.socketedGem && GEMS[pData.socketedGem]) player.socketedGem = GEMS[pData.socketedGem];
        if (pData.specialization) player.specialization = pData.specialization;
        player.blessings = pData.blessings || [];
        player.achievements = pData.achievements || [];

        if (player.specialization) player.setSpecialization(player.specialization);
        player.recalculateStats();

        this.currentStage = data.currentStage || 1;
        this.currentNodeIndex = data.currentNodeIndex || 0;
        this.difficulty = data.difficulty || 'hardcore';

        return true;
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
    },

    saveGameData: function() {
        if (!player) return;
        try {
            const data = {
                highScore: this.highScore,
                currentStage: this.currentStage,
                currentNodeIndex: this.currentNodeIndex,
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

            if (typeof CloudDatabase !== 'undefined' && CloudDatabase.savePlayerData) {
                CloudDatabase.savePlayerData(data.playerData);
            }
        } catch (e) {}
    },

    loadSaveData: function() {
        try {
            let raw = this.getCookie('dungeon_crawl_session');
            if (!raw) raw = localStorage.getItem('dungeon_crawl_save_slot_1') || localStorage.getItem('antigravity_rpg_save');
            if (raw) {
                const data = JSON.parse(raw);
                if (data.highScore) this.highScore = data.highScore;
                if (data.playerData && data.playerData.classType) {
                    if (this.loadFromData(data)) {
                        this.startStageMap(this.currentStage);
                        this.currentNodeIndex = data.currentNodeIndex || 0;
                        this.renderDungeonMap();
                        this.logAction(`Welcome back! Resumed cookie session: <strong style="color:var(--gold)">Level ${player.level} ${player.classType}</strong> on Stage ${this.currentStage}!`, 'info');
                        return true;
                    }
                }
            }
        } catch (e) {}
        return false;
    },

    showConfirmModal: function({ title = 'Confirm Action', message = 'Are you sure?', confirmText = 'Confirm', cancelText = 'Cancel', onConfirm, danger = false }) {
        const modalHtml = `
            <div class="modal-overlay animate-fade-in" id="confirm-modal-overlay" onclick="if(event.target === this) GameManager.closeConfirmModal()">
                <div class="modal-card glass-panel text-center animate-bounce" style="max-width:440px; border: 2px solid ${danger ? '#ff2a5f' : 'var(--gold)'}; box-shadow: 0 0 35px ${danger ? 'rgba(255,42,95,0.5)' : 'var(--gold-glow)'};">
                    <div style="font-size: 2.4rem; margin-bottom: 6px;">${danger ? '⚠️' : '❓'}</div>
                    <h3 style="color: ${danger ? '#ff2a5f' : 'var(--gold)'}; font-family:'MedievalSharp',serif; font-size: 1.5rem; margin-bottom: 10px;">${title}</h3>
                    <p style="color: var(--text-muted); font-size: 0.95rem; line-height: 1.5; margin-bottom: 22px;">${message}</p>
                    <div style="display: flex; gap: 12px; justify-content: center;">
                        <button class="btn btn-secondary" onclick="GameManager.closeConfirmModal()" style="flex: 1;">${cancelText}</button>
                        <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" id="confirm-modal-yes-btn" style="flex: 1; ${danger ? 'background:#ff2a5f; color:#fff; font-weight:800;' : ''}">${confirmText}</button>
                    </div>
                </div>
            </div>
        `;
        let confirmContainer = document.getElementById('confirm-modal-container');
        if (!confirmContainer) {
            confirmContainer = document.createElement('div');
            confirmContainer.id = 'confirm-modal-container';
            document.body.appendChild(confirmContainer);
        }
        confirmContainer.innerHTML = modalHtml;
        const yesBtn = document.getElementById('confirm-modal-yes-btn');
        if (yesBtn) {
            yesBtn.onclick = () => {
                GameManager.closeConfirmModal();
                if (onConfirm) onConfirm();
            };
        }
    },

    closeConfirmModal: function() {
        const confirmContainer = document.getElementById('confirm-modal-container');
        if (confirmContainer) confirmContainer.innerHTML = '';
    },

    showToast: function(message, type = 'info') {
        let toastContainer = document.getElementById('toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container';
            toastContainer.style.cssText = 'position:fixed; bottom:24px; right:24px; z-index:99999; display:flex; flex-direction:column; gap:10px; pointer-events:none;';
            document.body.appendChild(toastContainer);
        }
        const toast = document.createElement('div');
        toast.className = `glass-panel animate-bounce`;
        const borderColor = type === 'error' ? '#ff2a5f' : (type === 'success' ? '#00ff9d' : 'var(--gold)');
        const icon = type === 'error' ? '❌' : (type === 'success' ? '✅' : 'ℹ️');
        toast.style.cssText = `padding:12px 20px; border-radius:12px; border:1px solid ${borderColor}; background:rgba(15,15,28,0.95); color:#fff; font-weight:700; font-size:0.9rem; box-shadow:0 10px 25px rgba(0,0,0,0.8); pointer-events:auto; display:flex; align-items:center; gap:10px;`;
        toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
        toastContainer.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(10px)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3200);
    },

    showInputModal: function({ title = 'Input Required', message = '', placeholder = '', defaultValue = '', onSubmit }) {
        const modalHtml = `
            <div class="modal-overlay animate-fade-in" onclick="if(event.target === this) GameManager.closeInputModal()">
                <div class="modal-card glass-panel" style="max-width:460px; border:1px solid var(--gold);">
                    <h3 style="color:var(--gold); font-family:'MedievalSharp',serif; font-size:1.4rem; margin-bottom:8px;">${title}</h3>
                    <p style="color:var(--text-muted); font-size:0.9rem; margin-bottom:14px;">${message}</p>
                    <input type="text" id="input-modal-field" value="${defaultValue}" placeholder="${placeholder}" style="width:100%; padding:12px; border-radius:10px; border:1px solid var(--glass-border); background:rgba(0,0,0,0.6); color:#fff; font-size:1rem; margin-bottom:18px;">
                    <div style="display:flex; gap:10px; justify-content:flex-end;">
                        <button class="btn btn-secondary" onclick="GameManager.closeInputModal()">Cancel</button>
                        <button class="btn btn-primary" id="input-modal-submit-btn">Submit</button>
                    </div>
                </div>
            </div>
        `;
        let inputContainer = document.getElementById('input-modal-container');
        if (!inputContainer) {
            inputContainer = document.createElement('div');
            inputContainer.id = 'input-modal-container';
            document.body.appendChild(inputContainer);
        }
        inputContainer.innerHTML = modalHtml;
        const field = document.getElementById('input-modal-field');
        if (field) field.focus();
        const submitBtn = document.getElementById('input-modal-submit-btn');
        if (submitBtn) {
            submitBtn.onclick = () => {
                const val = field ? field.value : '';
                GameManager.closeInputModal();
                if (onSubmit) onSubmit(val);
            };
        }
    },

    closeInputModal: function() {
        const inputContainer = document.getElementById('input-modal-container');
        if (inputContainer) inputContainer.innerHTML = '';
    },

    showItemInfo: function(itemId, event) {
        if (event) event.stopPropagation();
        
        const existing = document.getElementById('item-popover-tooltip');
        if (existing) {
            existing.remove();
            if (this.activePopoverId === itemId) {
                this.activePopoverId = null;
                return;
            }
        }

        const item = ITEM_DATABASE[itemId];
        if (!item) return;

        this.activePopoverId = itemId;

        const popover = document.createElement('div');
        popover.id = 'item-popover-tooltip';
        popover.className = 'glass-panel item-popover-box animate-bounce';
        popover.innerHTML = `
            <div style="display:flex; gap:10px; align-items:center; margin-bottom:8px; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:6px;">
                <img src="${item.img}" alt="${item.name}" style="width:38px; height:38px; border-radius:8px; border:1px solid var(--gold); object-fit:cover;">
                <div>
                    <strong style="color:var(--gold); font-size:1.05rem; display:block;">${item.name}</strong>
                    <span style="font-size:0.75rem; color:var(--text-muted);">${item.type}</span>
                </div>
            </div>
            <div style="color:#00ff9d; font-weight:800; font-size:0.88rem; margin-bottom:8px;">${item.stats}</div>
            <div style="color:var(--text-muted); font-size:0.8rem; font-style:italic; line-height:1.4;">${item.flavor}</div>
        `;

        document.body.appendChild(popover);

        const targetEl = event ? (event.currentTarget || event.target) : null;
        if (targetEl) {
            const rect = targetEl.getBoundingClientRect();
            let left = rect.left + 28;
            let top = rect.top + 28;

            if (left + 310 > window.innerWidth) left = window.innerWidth - 320;
            if (top + 190 > window.innerHeight) top = window.innerHeight - 200;

            popover.style.left = `${Math.max(10, left)}px`;
            popover.style.top = `${Math.max(10, top)}px`;
        }

        const dismissHandler = (e) => {
            if (!popover.contains(e.target) && e.target !== targetEl) {
                popover.remove();
                GameManager.activePopoverId = null;
                window.removeEventListener('click', dismissHandler);
            }
        };
        setTimeout(() => window.addEventListener('click', dismissHandler), 10);
    }
};

if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => GameManager.init());
    } else {
        GameManager.init();
    }
}