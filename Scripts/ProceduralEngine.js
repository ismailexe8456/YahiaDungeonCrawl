// ProceduralEngine.js - Seeded PRNG, 12-Level Procedural Layout Generator & Validator
const ProceduralEngine = {
    // Mulberry32 deterministic pseudo-random number generator
    mulberry32: function(a) {
        return function() {
            let t = a += 0x6D2B79F5;
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    },

    generateRunSeed: function() {
        return Math.floor(10000000 + Math.random() * 89999999);
    },

    generateStageLayout: function(stageNum, seed) {
        let currentSeed = seed + (stageNum * 9999);
        let attempts = 0;
        let validLayout = null;

        while (attempts < 50) {
            const rng = this.mulberry32(currentSeed);
            const layout = this.buildLayout(stageNum, rng);
            
            if (this.validateStage(layout)) {
                validLayout = { seed: currentSeed, levels: layout };
                break;
            }
            currentSeed++;
            attempts++;
        }

        if (!validLayout) {
            // Fallback guaranteed template if 50 seeds fail
            validLayout = { seed: seed, levels: this.getFallbackLayout(stageNum) };
        }

        return validLayout;
    },

    buildLayout: function(stageNum, rng) {
        const levels = new Array(12);

        // 1. Level 12 is always Main Boss
        levels[11] = {
            levelNumber: 12,
            type: 'boss',
            title: `${STAGE_THEMES[stageNum]?.name || 'Stage'} Boss`,
            icon: 'fa-dragon',
            enemyData: STAGE_ENEMIES[stageNum]?.boss
        };

        // 2. Select 2 non-adjacent Mini-Boss slots between Level 4 and Level 11 (index 3 to 10)
        let mb1 = 3 + Math.floor(rng() * 4); // Index 3, 4, 5, 6 (Level 4, 5, 6, 7)
        let mb2 = 7 + Math.floor(rng() * 4); // Index 7, 8, 9, 10 (Level 8, 9, 10, 11)

        if (mb2 - mb1 <= 1) {
            mb2 = Math.min(10, mb1 + 3);
        }

        const miniBossPool = STAGE_ENEMIES[stageNum]?.miniboss || [];
        const mb1Data = miniBossPool[0] || STAGE_ENEMIES[1].miniboss[0];
        const mb2Data = miniBossPool[1] || miniBossPool[0] || STAGE_ENEMIES[1].miniboss[1];

        levels[mb1] = {
            levelNumber: mb1 + 1,
            type: 'miniboss',
            title: `Mini-Boss: ${mb1Data.name}`,
            icon: 'fa-skull-crossbones',
            enemyData: mb1Data
        };

        levels[mb2] = {
            levelNumber: mb2 + 1,
            type: 'miniboss',
            title: `Mini-Boss: ${mb2Data.name}`,
            icon: 'fa-skull-crossbones',
            enemyData: mb2Data
        };

        // 3. Fill remaining open level slots
        const openPool = ['combat', 'combat', 'combat', 'combat', 'elite', 'shrine', 'merchant', 'blacksmith', 'event', 'treasure'];
        
        // Shuffle pool deterministically using rng
        for (let i = openPool.length - 1; i > 0; i--) {
            const j = Math.floor(rng() * (i + 1));
            [openPool[i], openPool[j]] = [openPool[j], openPool[i]];
        }

        let poolIdx = 0;
        const stageEnemies = STAGE_ENEMIES[stageNum] || STAGE_ENEMIES[1];

        for (let i = 0; i < 12; i++) {
            if (levels[i]) continue; // Already filled with boss or mini-boss

            let encType = openPool[poolIdx % openPool.length];
            poolIdx++;

            // Ensure Level 1 is always Combat
            if (i === 0) encType = 'combat';

            levels[i] = this.createLevelNode(i + 1, encType, stageEnemies, rng);
        }

        return levels;
    },

    createLevelNode: function(levelNum, type, stageEnemies, rng) {
        if (type === 'combat') {
            const monsterList = stageEnemies.normal || STAGE_ENEMIES[1].normal;
            const monsterData = monsterList[Math.floor(rng() * monsterList.length)];
            return {
                levelNumber: levelNum,
                type: 'combat',
                title: monsterData.name,
                icon: 'fa-paw',
                enemyData: monsterData
            };
        } else if (type === 'elite') {
            const eliteList = stageEnemies.elite || stageEnemies.normal;
            const eliteData = eliteList[Math.floor(rng() * eliteList.length)];
            return {
                levelNumber: levelNum,
                type: 'elite',
                title: `ELITE: ${eliteData.name}`,
                icon: 'fa-khanda',
                enemyData: eliteData,
                isElite: true
            };
        } else if (type === 'shrine') {
            const shrineTypes = ['healing', 'power', 'defense', 'blood', 'fortune', 'curse'];
            const shrineType = shrineTypes[Math.floor(rng() * shrineTypes.length)];
            return {
                levelNumber: levelNum,
                type: 'shrine',
                shrineType: shrineType,
                title: `${shrineType.toUpperCase()} Shrine`,
                icon: 'fa-place-of-worship'
            };
        } else if (type === 'merchant') {
            return {
                levelNumber: levelNum,
                type: 'merchant',
                title: 'Wandering Merchant',
                icon: 'fa-store'
            };
        } else if (type === 'blacksmith') {
            return {
                levelNumber: levelNum,
                type: 'blacksmith',
                title: 'Blacksmith Forge',
                icon: 'fa-hammer'
            };
        } else if (type === 'event') {
            return {
                levelNumber: levelNum,
                type: 'event',
                title: 'Mystery Encounter',
                icon: 'fa-question-circle'
            };
        } else if (type === 'treasure') {
            return {
                levelNumber: levelNum,
                type: 'treasure',
                title: 'Treasure Chest',
                icon: 'fa-gem'
            };
        }
    },

    validateStage: function(levels) {
        if (!levels || levels.length !== 12) return false;

        // Check boss at level 12
        if (levels[11].type !== 'boss') return false;

        // Count encounter types
        let combatCount = 0;
        let miniBossCount = 0;
        let recoveryCount = 0;
        let miniBossIndices = [];

        for (let i = 0; i < 12; i++) {
            const t = levels[i].type;
            if (t === 'combat' || t === 'elite') combatCount++;
            if (t === 'miniboss') {
                miniBossCount++;
                miniBossIndices.push(i);
            }
            if (t === 'shrine' || t === 'merchant' || t === 'treasure' || t === 'blacksmith') recoveryCount++;
        }

        if (combatCount < 4) return false;
        if (miniBossCount !== 2) return false;
        if (recoveryCount < 1) return false;

        // Ensure Mini-Bosses are not adjacent
        if (Math.abs(miniBossIndices[0] - miniBossIndices[1]) < 2) return false;

        return true;
    },

    getFallbackLayout: function(stageNum) {
        const stageEnemies = STAGE_ENEMIES[stageNum] || STAGE_ENEMIES[1];
        const normal = stageEnemies.normal[0];
        const elite = stageEnemies.elite[0] || normal;
        const mb1 = stageEnemies.miniboss[0];
        const mb2 = stageEnemies.miniboss[1] || mb1;

        return [
            { levelNumber: 1, type: 'combat', title: normal.name, icon: 'fa-paw', enemyData: normal },
            { levelNumber: 2, type: 'shrine', shrineType: 'healing', title: 'HEALING Shrine', icon: 'fa-place-of-worship' },
            { levelNumber: 3, type: 'combat', title: normal.name, icon: 'fa-paw', enemyData: normal },
            { levelNumber: 4, type: 'elite', title: `ELITE: ${elite.name}`, icon: 'fa-khanda', enemyData: elite, isElite: true },
            { levelNumber: 5, type: 'miniboss', title: `Mini-Boss: ${mb1.name}`, icon: 'fa-skull-crossbones', enemyData: mb1 },
            { levelNumber: 6, type: 'combat', title: normal.name, icon: 'fa-paw', enemyData: normal },
            { levelNumber: 7, type: 'merchant', title: 'Wandering Merchant', icon: 'fa-store' },
            { levelNumber: 8, type: 'combat', title: normal.name, icon: 'fa-paw', icon: 'fa-paw', enemyData: normal },
            { levelNumber: 9, type: 'blacksmith', title: 'Blacksmith Forge', icon: 'fa-hammer' },
            { levelNumber: 10, type: 'elite', title: `ELITE: ${elite.name}`, icon: 'fa-khanda', enemyData: elite, isElite: true },
            { levelNumber: 11, type: 'miniboss', title: `Mini-Boss: ${mb2.name}`, icon: 'fa-skull-crossbones', enemyData: mb2 },
            { levelNumber: 12, type: 'boss', title: `${STAGE_THEMES[stageNum]?.name} Boss`, icon: 'fa-dragon', enemyData: stageEnemies.boss }
        ];
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProceduralEngine;
}
