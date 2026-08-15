// enemy.js - 10-Stage Hardcore Enemy, Elite, Mini-Boss & Main Boss Database
let enemy = null;

const STAGE_THEMES = {
    1: { id: 1, name: 'Forgotten Crypt', icon: 'fa-skull', bg: 'linear-gradient(180deg, #15101a, #0b0912)' },
    2: { id: 2, name: 'Cursed Catacombs', icon: 'fa-bone', bg: 'linear-gradient(180deg, #181216, #0c080e)' },
    3: { id: 3, name: 'Plague Warrens', icon: 'fa-biohazard', bg: 'linear-gradient(180deg, #141a12, #080e07)' },
    4: { id: 4, name: 'Shadow Ruins', icon: 'fa-ghost', bg: 'linear-gradient(180deg, #10141e, #070912)' },
    5: { id: 5, name: 'Infernal Depths', icon: 'fa-fire-alt', bg: 'linear-gradient(180deg, #221010, #100606)' },
    6: { id: 6, name: 'Blood Sanctum', icon: 'fa-tint', bg: 'linear-gradient(180deg, #200d14, #0f0509)' },
    7: { id: 7, name: 'Abyssal Prison', icon: 'fa-dungeon', bg: 'linear-gradient(180deg, #121820, #060a10)' },
    8: { id: 8, name: 'Demon Citadel', icon: 'fa-khanda', bg: 'linear-gradient(180deg, #221210, #0e0706)' },
    9: { id: 9, name: 'Void Realm', icon: 'fa-atom', bg: 'linear-gradient(180deg, #1b1024, #0a0412)' },
    10: { id: 10, name: 'The Final Realm', icon: 'fa-crown', bg: 'linear-gradient(180deg, #261a10, #0f0a06)' }
};

const STAGE_ENEMIES = {
    1: {
        normal: [
            { name: 'Crypt Ghoul', img: 'characters imgs/enemy/goblin_scout.jpg', baseHp: 240, str: 28, agi: 30, def: 8, spd: 38, xp: 45, gold: 25, skills: [{ name: 'Claw Strike', mult: 1.0, type: 'physical' }] },
            { name: 'Skeleton Guard', img: 'characters imgs/enemy/forest_troll.jpg', baseHp: 380, str: 38, agi: 18, def: 18, spd: 28, xp: 65, gold: 40, skills: [{ name: 'Bone Shield Smash', mult: 1.2, type: 'physical' }] }
        ],
        elite: [
            { name: 'Elite Bonebreaker', img: 'characters imgs/enemy/orc_berserker.jpg', baseHp: 520, str: 55, agi: 24, def: 25, spd: 32, xp: 110, gold: 75, skills: [{ name: 'Crushing Cleave', mult: 1.5, type: 'physical' }] }
        ],
        miniboss: [
            { name: 'Crypt Dreadlord', img: 'characters imgs/enemy/shadow_warlord.jpg', baseHp: 750, str: 65, agi: 35, def: 30, spd: 36, xp: 180, gold: 110, skills: [{ name: 'Shadow Bolt', mult: 1.6, type: 'magic' }, { name: 'Vampiric Touch', mult: 1.4, type: 'magic' }] },
            { name: 'Bone Collector', img: 'characters imgs/enemy/gorgon_earthshaker.jpg', baseHp: 820, str: 70, agi: 25, def: 35, spd: 30, xp: 190, gold: 120, skills: [{ name: 'Skeleton Slam', mult: 1.7, type: 'physical' }] }
        ],
        boss: { name: 'Gorgon Earthshaker', img: 'characters imgs/enemy/gorgon_earthshaker.jpg', baseHp: 1100, str: 85, agi: 30, def: 40, spd: 35, xp: 350, gold: 200, skills: [{ name: 'Earthshaker Slam', mult: 1.7, type: 'physical' }, { name: 'Stone Crush', mult: 2.2, type: 'physical' }], phase2Skill: { name: 'EARTHQUAKE CATACLYSM', mult: 3.0, type: 'physical' } }
    },
    2: {
        normal: [
            { name: 'Catacomb Fiend', img: 'characters imgs/enemy/goblin_scout.jpg', baseHp: 320, str: 42, agi: 35, def: 15, spd: 40, xp: 75, gold: 45, skills: [{ name: 'Shadow Strike', mult: 1.1, type: 'physical' }] },
            { name: 'Tomb Necromancer', img: 'characters imgs/enemy/shadow_warlord.jpg', baseHp: 440, str: 48, agi: 22, def: 20, spd: 32, xp: 95, gold: 60, skills: [{ name: 'Dark Blast', mult: 1.4, type: 'magic' }] }
        ],
        elite: [
            { name: 'Corpse Revenant', img: 'characters imgs/enemy/orc_berserker.jpg', baseHp: 680, str: 72, agi: 28, def: 32, spd: 34, xp: 150, gold: 100, skills: [{ name: 'Soul Cleave', mult: 1.6, type: 'physical' }] }
        ],
        miniboss: [
            { name: 'Corpse Golem', img: 'characters imgs/enemy/forest_troll.jpg', baseHp: 1100, str: 88, agi: 20, def: 45, spd: 28, xp: 260, gold: 160, skills: [{ name: 'Flesh Crush', mult: 1.8, type: 'physical' }] },
            { name: 'Tomb Banshee', img: 'characters imgs/enemy/shadow_warlord.jpg', baseHp: 950, str: 80, agi: 42, def: 28, spd: 45, xp: 250, gold: 150, skills: [{ name: 'Screaming Wail', mult: 1.9, type: 'magic' }] }
        ],
        boss: { name: 'Shadow Warlord', img: 'characters imgs/enemy/shadow_warlord.jpg', baseHp: 1600, str: 105, agi: 45, def: 50, spd: 48, xp: 500, gold: 300, skills: [{ name: 'Poison Dagger Volley', mult: 1.8, type: 'physical' }, { name: 'Shadow Bomb', mult: 2.4, type: 'magic' }], phase2Skill: { name: 'ENRAGED SHADOW STORM', mult: 3.2, type: 'magic' } }
    },
    3: {
        normal: [
            { name: 'Plague Stalker', img: 'characters imgs/enemy/goblin_scout.jpg', baseHp: 420, str: 55, agi: 40, def: 20, spd: 44, xp: 110, gold: 70, skills: [{ name: 'Venom Bite', mult: 1.2, type: 'physical' }] },
            { name: 'Rot Spawn', img: 'characters imgs/enemy/forest_troll.jpg', baseHp: 580, str: 62, agi: 24, def: 28, spd: 34, xp: 140, gold: 85, skills: [{ name: 'Toxic Burst', mult: 1.5, type: 'magic' }] }
        ],
        elite: [
            { name: 'Plague Abomination', img: 'characters imgs/enemy/gorgon_earthshaker.jpg', baseHp: 920, str: 90, agi: 30, def: 42, spd: 36, xp: 220, gold: 140, skills: [{ name: 'Noxious Slime', mult: 1.8, type: 'magic' }] }
        ],
        miniboss: [
            { name: 'Swarm Queen', img: 'characters imgs/enemy/goblin_scout.jpg', baseHp: 1350, str: 102, agi: 55, def: 38, spd: 50, xp: 340, gold: 210, skills: [{ name: 'Infestation Sting', mult: 2.0, type: 'physical' }] },
            { name: 'Toxic Behemoth', img: 'characters imgs/enemy/forest_troll.jpg', baseHp: 1550, str: 115, agi: 25, def: 55, spd: 32, xp: 360, gold: 230, skills: [{ name: 'Acid Volley', mult: 2.1, type: 'magic' }] }
        ],
        boss: { name: 'Rot Leviathan', img: 'characters imgs/enemy/gorgon_earthshaker.jpg', baseHp: 2200, str: 130, agi: 35, def: 60, spd: 40, xp: 700, gold: 420, skills: [{ name: 'Blight Slam', mult: 2.0, type: 'physical' }, { name: 'Rot Wave', mult: 2.6, type: 'magic' }], phase2Skill: { name: 'PLAGUE CATACLYSM', mult: 3.5, type: 'magic' } }
    },
    4: {
        normal: [
            { name: 'Shadow Assassin', img: 'characters imgs/enemy/shadow_warlord.jpg', baseHp: 550, str: 72, agi: 50, def: 25, spd: 52, xp: 150, gold: 95, skills: [{ name: 'Shadow Blade', mult: 1.3, type: 'physical' }] },
            { name: 'Dark Spectre', img: 'characters imgs/enemy/goblin_scout.jpg', baseHp: 650, str: 78, agi: 38, def: 32, spd: 40, xp: 180, gold: 115, skills: [{ name: 'Soul Drain', mult: 1.6, type: 'magic' }] }
        ],
        elite: [
            { name: 'Void Executioner', img: 'characters imgs/enemy/orc_berserker.jpg', baseHp: 1150, str: 115, agi: 36, def: 50, spd: 42, xp: 300, gold: 190, skills: [{ name: 'Dark Decapitation', mult: 2.0, type: 'physical' }] }
        ],
        miniboss: [
            { name: 'Phantom Executioner', img: 'characters imgs/enemy/orc_berserker.jpg', baseHp: 1800, str: 135, agi: 45, def: 58, spd: 46, xp: 450, gold: 290, skills: [{ name: 'Soul Sever', mult: 2.2, type: 'physical' }] },
            { name: 'Shade Stalker', img: 'characters imgs/enemy/shadow_warlord.jpg', baseHp: 1650, str: 128, agi: 60, def: 48, spd: 58, xp: 430, gold: 270, skills: [{ name: 'Abyssal Ambush', mult: 2.3, type: 'magic' }] }
        ],
        boss: { name: 'Nightbringer', img: 'characters imgs/enemy/shadow_warlord.jpg', baseHp: 2900, str: 155, agi: 55, def: 70, spd: 52, xp: 950, gold: 580, skills: [{ name: 'Eclipse Strike', mult: 2.2, type: 'physical' }, { name: 'Shadow Eclipse', mult: 2.8, type: 'magic' }], phase2Skill: { name: 'ETERNAL NIGHT FALL', mult: 3.8, type: 'magic' } }
    },
    5: {
        normal: [
            { name: 'Hellhound', img: 'characters imgs/enemy/goblin_scout.jpg', baseHp: 720, str: 90, agi: 52, def: 32, spd: 54, xp: 210, gold: 130, skills: [{ name: 'Flame Bite', mult: 1.4, type: 'physical' }] },
            { name: 'Cinder Imp', img: 'characters imgs/enemy/forest_troll.jpg', baseHp: 820, str: 95, agi: 42, def: 38, spd: 45, xp: 240, gold: 150, skills: [{ name: 'Fireball Flare', mult: 1.7, type: 'magic' }] }
        ],
        elite: [
            { name: 'Magma Behemoth', img: 'characters imgs/enemy/gorgon_earthshaker.jpg', baseHp: 1450, str: 135, agi: 32, def: 62, spd: 38, xp: 400, gold: 250, skills: [{ name: 'Lava Eruption', mult: 2.1, type: 'magic' }] }
        ],
        miniboss: [
            { name: 'Cinder Drake', img: 'characters imgs/enemy/void_dragon.jpg', baseHp: 2300, str: 160, agi: 50, def: 68, spd: 52, xp: 600, gold: 380, skills: [{ name: 'Inferno Breath', mult: 2.4, type: 'magic' }] },
            { name: 'Molten Vanguard', img: 'characters imgs/enemy/orc_berserker.jpg', baseHp: 2500, str: 172, agi: 35, def: 78, spd: 40, xp: 630, gold: 400, skills: [{ name: 'Flame Hammer', mult: 2.5, type: 'physical' }] }
        ],
        boss: { name: 'Infernal Balrog', img: 'characters imgs/enemy/void_dragon.jpg', baseHp: 3800, str: 195, agi: 48, def: 85, spd: 48, xp: 1250, gold: 780, skills: [{ name: 'Hellfire Slash', mult: 2.5, type: 'physical' }, { name: 'Flame Apocalypse', mult: 3.2, type: 'magic' }], phase2Skill: { name: 'INFERNAL BALROG ANNIHILATION', mult: 4.2, type: 'magic' } }
    },
    6: {
        normal: [
            { name: 'Blood Thrall', img: 'characters imgs/enemy/goblin_scout.jpg', baseHp: 900, str: 110, agi: 58, def: 40, spd: 56, xp: 280, gold: 175, skills: [{ name: 'Crimson Fang', mult: 1.5, type: 'physical' }] },
            { name: 'Sanguine Knight', img: 'characters imgs/enemy/orc_berserker.jpg', baseHp: 1050, str: 120, agi: 45, def: 52, spd: 48, xp: 320, gold: 200, skills: [{ name: 'Blood Slash', mult: 1.8, type: 'physical' }] }
        ],
        elite: [
            { name: 'Crimson Executioner', img: 'characters imgs/enemy/orc_berserker.jpg', baseHp: 1850, str: 160, agi: 42, def: 72, spd: 44, xp: 520, gold: 320, skills: [{ name: 'Blood Cleave', mult: 2.3, type: 'physical' }] }
        ],
        miniboss: [
            { name: 'Blood Countess', img: 'characters imgs/enemy/shadow_warlord.jpg', baseHp: 2900, str: 190, agi: 62, def: 75, spd: 60, xp: 800, gold: 500, skills: [{ name: 'Sanguine Siphon', mult: 2.6, type: 'magic' }] },
            { name: 'Crimson Sanguinar', img: 'characters imgs/enemy/gorgon_earthshaker.jpg', baseHp: 3100, str: 205, agi: 48, def: 88, spd: 46, xp: 840, gold: 530, skills: [{ name: 'Vampiric Decapitation', mult: 2.7, type: 'physical' }] }
        ],
        boss: { name: 'Blood Sovereign', img: 'characters imgs/enemy/lich_king.jpg', baseHp: 4800, str: 235, agi: 58, def: 98, spd: 55, xp: 1650, gold: 1050, skills: [{ name: 'Crimson Apocalypse', mult: 2.8, type: 'magic' }, { name: 'Blood Feast', mult: 3.4, type: 'physical' }], phase2Skill: { name: 'ULTIMATE BLOOD REAPING', mult: 4.5, type: 'magic' } }
    },
    7: {
        normal: [
            { name: 'Abyssal Fiend', img: 'characters imgs/enemy/goblin_scout.jpg', baseHp: 1150, str: 135, agi: 62, def: 48, spd: 58, xp: 360, gold: 230, skills: [{ name: 'Abyssal Claw', mult: 1.6, type: 'physical' }] },
            { name: 'Torment Sentinel', img: 'characters imgs/enemy/forest_troll.jpg', baseHp: 1300, str: 145, agi: 48, def: 62, spd: 46, xp: 400, gold: 260, skills: [{ name: 'Chain Crush', mult: 1.9, type: 'physical' }] }
        ],
        elite: [
            { name: 'Soul Harvester', img: 'characters imgs/enemy/shadow_warlord.jpg', baseHp: 2300, str: 190, agi: 52, def: 82, spd: 48, xp: 680, gold: 420, skills: [{ name: 'Soul Scythe', mult: 2.4, type: 'magic' }] }
        ],
        miniboss: [
            { name: 'Chain Torturer', img: 'characters imgs/enemy/orc_berserker.jpg', baseHp: 3600, str: 230, agi: 50, def: 95, spd: 50, xp: 1050, gold: 650, skills: [{ name: 'Chains of Agony', mult: 2.8, type: 'physical' }] },
            { name: 'Abyssal Inquisitor', img: 'characters imgs/enemy/shadow_warlord.jpg', baseHp: 3800, str: 245, agi: 58, def: 90, spd: 56, xp: 1100, gold: 680, skills: [{ name: 'Void Torture', mult: 2.9, type: 'magic' }] }
        ],
        boss: { name: 'Abyssal Warden', img: 'characters imgs/enemy/lich_king.jpg', baseHp: 5900, str: 280, agi: 60, def: 115, spd: 58, xp: 2100, gold: 1350, skills: [{ name: 'Abyssal Shockwave', mult: 3.0, type: 'physical' }, { name: 'Hellish Agony', mult: 3.7, type: 'magic' }], phase2Skill: { name: 'ABYSSAL REALM OBLIVION', mult: 4.8, type: 'magic' } }
    },
    8: {
        normal: [
            { name: 'Dread Knight', img: 'characters imgs/enemy/orc_berserker.jpg', baseHp: 1450, str: 160, agi: 54, def: 65, spd: 52, xp: 450, gold: 290, skills: [{ name: 'Dread Slash', mult: 1.7, type: 'physical' }] },
            { name: 'Pit Fiend', img: 'characters imgs/enemy/goblin_scout.jpg', baseHp: 1600, str: 175, agi: 60, def: 58, spd: 56, xp: 500, gold: 320, skills: [{ name: 'Infernal Bite', mult: 2.0, type: 'physical' }] }
        ],
        elite: [
            { name: 'Doom Herald', img: 'characters imgs/enemy/shadow_warlord.jpg', baseHp: 2850, str: 220, agi: 56, def: 95, spd: 50, xp: 850, gold: 540, skills: [{ name: 'Doom Nova', mult: 2.6, type: 'magic' }] }
        ],
        miniboss: [
            { name: 'Hellfire General', img: 'characters imgs/enemy/orc_berserker.jpg', baseHp: 4400, str: 270, agi: 55, def: 110, spd: 52, xp: 1350, gold: 850, skills: [{ name: 'Hellfire Cleave', mult: 3.0, type: 'physical' }] },
            { name: 'Demon High Priest', img: 'characters imgs/enemy/shadow_warlord.jpg', baseHp: 4200, str: 285, agi: 64, def: 100, spd: 58, xp: 1300, gold: 820, skills: [{ name: 'Demonic Curse', mult: 3.1, type: 'magic' }] }
        ],
        boss: { name: 'Demon Overlord', img: 'characters imgs/enemy/void_dragon.jpg', baseHp: 7200, str: 330, agi: 62, def: 130, spd: 60, xp: 2700, gold: 1750, skills: [{ name: 'Demon Cleave', mult: 3.2, type: 'physical' }, { name: 'Hellfire Storm', mult: 4.0, type: 'magic' }], phase2Skill: { name: 'DEMON OVERLORD CATACLYSM', mult: 5.0, type: 'magic' } }
    },
    9: {
        normal: [
            { name: 'Void Walker', img: 'characters imgs/enemy/shadow_warlord.jpg', baseHp: 1800, str: 195, agi: 68, def: 75, spd: 62, xp: 580, gold: 370, skills: [{ name: 'Void Rend', mult: 1.9, type: 'physical' }] },
            { name: 'Chaos Weaver', img: 'characters imgs/enemy/goblin_scout.jpg', baseHp: 1950, str: 210, agi: 72, def: 70, spd: 64, xp: 620, gold: 400, skills: [{ name: 'Chaos Burst', mult: 2.2, type: 'magic' }] }
        ],
        elite: [
            { name: 'Nether Anomaly', img: 'characters imgs/enemy/gorgon_earthshaker.jpg', baseHp: 3500, str: 265, agi: 60, def: 115, spd: 54, xp: 1100, gold: 700, skills: [{ name: 'Singularity Collapse', mult: 2.8, type: 'magic' }] }
        ],
        miniboss: [
            { name: 'Reality Tearer', img: 'characters imgs/enemy/shadow_warlord.jpg', baseHp: 5200, str: 320, agi: 70, def: 125, spd: 62, xp: 1750, gold: 1100, skills: [{ name: 'Dimensional Rip', mult: 3.3, type: 'physical' }] },
            { name: 'Void Sentinel', img: 'characters imgs/enemy/void_dragon.jpg', baseHp: 5500, str: 335, agi: 65, def: 135, spd: 58, xp: 1850, gold: 1150, skills: [{ name: 'Void Cannon', mult: 3.4, type: 'magic' }] }
        ],
        boss: { name: 'Void Dragon', img: 'characters imgs/enemy/void_dragon.jpg', baseHp: 8800, str: 390, agi: 68, def: 150, spd: 64, xp: 3500, gold: 2200, skills: [{ name: 'Claw Slash', mult: 3.4, type: 'physical' }, { name: 'Void Breath', mult: 4.2, type: 'magic' }], phase2Skill: { name: 'ANCIENT VOID CATACLYSM', mult: 5.5, type: 'magic' } }
    },
    10: {
        normal: [
            { name: 'Celestial Fallen', img: 'characters imgs/enemy/shadow_warlord.jpg', baseHp: 2300, str: 240, agi: 75, def: 90, spd: 66, xp: 750, gold: 480, skills: [{ name: 'Fallen Judgement', mult: 2.1, type: 'magic' }] },
            { name: 'Eldritch Titan', img: 'characters imgs/enemy/gorgon_earthshaker.jpg', baseHp: 2600, str: 260, agi: 65, def: 105, spd: 58, xp: 820, gold: 520, skills: [{ name: 'Cosmic Slam', mult: 2.4, type: 'physical' }] }
        ],
        elite: [
            { name: 'Fate Weaver', img: 'characters imgs/enemy/shadow_warlord.jpg', baseHp: 4400, str: 320, agi: 72, def: 135, spd: 62, xp: 1450, gold: 920, skills: [{ name: 'Fate Collapse', mult: 3.1, type: 'magic' }] }
        ],
        miniboss: [
            { name: 'Avatar of Oblivion', img: 'characters imgs/enemy/lich_king.jpg', baseHp: 6800, str: 390, agi: 75, def: 155, spd: 66, xp: 2300, gold: 1450, skills: [{ name: 'Oblivion Gaze', mult: 3.8, type: 'magic' }] },
            { name: 'Eldritch Sovereign', img: 'characters imgs/enemy/void_dragon.jpg', baseHp: 7200, str: 410, agi: 70, def: 165, spd: 62, xp: 2450, gold: 1550, skills: [{ name: 'Cosmic Apocalypse', mult: 4.0, type: 'magic' }] }
        ],
        boss: { name: 'Lich King of the Abyss', img: 'characters imgs/enemy/lich_king.jpg', baseHp: 11500, str: 480, agi: 80, def: 190, spd: 70, xp: 5000, gold: 3500, skills: [{ name: 'Soul Reaper Slash', mult: 3.8, type: 'magic' }, { name: 'Frost Nova Burst', mult: 4.5, type: 'magic' }, { name: 'Abyssal Oblivion', mult: 5.2, type: 'magic' }], phase2Skill: { name: 'ULTIMATE LICH OBLIVION REAPER', mult: 6.2, type: 'magic' } }
    }
};

class Enemy {
    constructor(monsterData, stageNum = 1, isElite = false) {
        this.enemyType = monsterData.name;
        this.name = monsterData.name;
        this.img = monsterData.img;
        this.isBoss = monsterData.isBoss || false;
        this.isElite = isElite;

        const stageScale = 1.0 + ((stageNum - 1) * 0.25);
        const eliteMult = isElite ? 1.45 : 1.0;

        this.maxHealth = Math.floor(monsterData.baseHp * stageScale * eliteMult);
        this.health = this.maxHealth;
        this.maxMana = 200;
        this.mana = this.maxMana;

        this.strength = Math.floor(monsterData.str * stageScale * (isElite ? 1.25 : 1.0));
        this.agility = Math.floor(monsterData.agi * stageScale);
        this.defense = Math.floor((monsterData.def || 10) * stageScale);
        this.speed = Math.floor(monsterData.spd * stageScale);

        this.xpReward = Math.floor(monsterData.xp * stageScale * (isElite ? 1.5 : 1.0));
        this.goldReward = Math.floor(monsterData.gold * stageScale * (isElite ? 1.5 : 1.0));

        this.skills = [...monsterData.skills];
        this.phase2Skill = monsterData.phase2Skill || null;
        this.inPhase2 = false;
        this.speedGauge = 0;
    }

    checkPhase2() {
        if (this.isBoss && !this.inPhase2 && this.health <= Math.floor(this.maxHealth * 0.5)) {
            this.inPhase2 = true;
            this.strength = Math.floor(this.strength * 1.35);
            if (this.phase2Skill) this.skills.push(this.phase2Skill);
            return true;
        }
        return false;
    }

    get CritChance() {
        return Math.min(0.05 + (this.agility * 0.003), 0.40);
    }

    get DodgeChance() {
        return Math.min(0.02 + (this.agility * 0.002), 0.30);
    }

    getRandomSkill() {
        if (this.inPhase2 && this.phase2Skill && Math.random() < 0.5) {
            return this.phase2Skill;
        }
        const randIndex = Math.floor(Math.random() * this.skills.length);
        return this.skills[randIndex];
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Enemy, STAGE_ENEMIES, STAGE_THEMES };
}