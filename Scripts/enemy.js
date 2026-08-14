// enemy.js - Hardcore RPG Monsters, Bosses, Multi-Phase Mechanics & Defense System
let enemy = null;

const ENEMY_DATABASE = [
    // Tier 1 Monsters & Boss
    {
        name: 'Goblin Scout',
        img: 'characters imgs/enemy/Goblin.jpg',
        tier: 1,
        isBoss: false,
        baseHp: 220,
        baseMp: 0,
        str: 26,
        agi: 30,
        defense: 8,
        spd: 38,
        xpReward: 40,
        goldReward: 25,
        skills: [{ name: 'Rusty Dagger', mult: 1.0, type: 'physical' }]
    },
    {
        name: 'Forest Troll',
        img: 'characters imgs/enemy/Troll.jpg',
        tier: 1,
        isBoss: false,
        baseHp: 380,
        baseMp: 20,
        str: 38,
        agi: 15,
        defense: 18,
        spd: 28,
        xpReward: 65,
        goldReward: 40,
        skills: [
            { name: 'Club Smash', mult: 1.2, type: 'physical' },
            { name: 'Ground Slam', mult: 1.4, type: 'physical' }
        ]
    },
    {
        name: 'Gorgon Earthshaker',
        img: 'characters imgs/enemy/Troll.jpg',
        tier: 1,
        isBoss: true,
        baseHp: 750,
        baseMp: 60,
        str: 58,
        agi: 25,
        defense: 25,
        spd: 32,
        xpReward: 140,
        goldReward: 100,
        skills: [
            { name: 'Earthshaker Slam', mult: 1.6, type: 'physical' },
            { name: 'Stone Crush', mult: 2.1, type: 'physical' }
        ],
        phase2Skill: { name: '🔥 EARTH QUAKE CATACLYSM', mult: 2.8, type: 'physical' }
    },
    {
        name: 'Orc Berserker',
        img: 'characters imgs/enemy/Troll.jpg',
        tier: 2,
        isBoss: false,
        baseHp: 540,
        baseMp: 30,
        str: 52,
        agi: 22,
        defense: 25,
        spd: 32,
        xpReward: 100,
        goldReward: 70,
        skills: [
            { name: 'Axe Chop', mult: 1.3, type: 'physical' },
            { name: 'Blood Cleave', mult: 1.7, type: 'physical' }
        ]
    },
    {
        name: 'Shadow Goblin Warlord',
        img: 'characters imgs/enemy/Goblin.jpg',
        tier: 2,
        isBoss: true,
        baseHp: 1200,
        baseMp: 100,
        str: 85,
        agi: 50,
        defense: 45,
        spd: 50,
        xpReward: 220,
        goldReward: 160,
        skills: [
            { name: 'Poison Dagger Volley', mult: 1.5, type: 'physical' },
            { name: 'Shadow Bomb', mult: 2.2, type: 'magic' }
        ],
        phase2Skill: { name: '🔥 ENRAGED SHADOW STORM', mult: 3.0, type: 'magic' }
    },

    // Tier 3 Bosses
    {
        name: 'Void Dragon',
        img: 'characters imgs/enemy/Troll.jpg',
        tier: 3,
        isBoss: true,
        baseHp: 2200,
        baseMp: 300,
        str: 125,
        agi: 45,
        defense: 60,
        spd: 55,
        xpReward: 550,
        goldReward: 350,
        skills: [
            { name: 'Claw Slash', mult: 1.3, type: 'physical' },
            { name: 'Void Breath', mult: 2.5, type: 'magic' },
            { name: 'Cataclysm Shockwave', mult: 3.2, type: 'magic' }
        ],
        phase2Skill: { name: '⚡ ANCIENT DRAGON CATACLYSM', mult: 4.0, type: 'magic' }
    }
];

class Enemy {
    constructor(monsterData, stageMultiplier = 1.0, difficultyMult = 1.0) {
        this.enemyType = monsterData.name;
        this.name = monsterData.name;
        this.img = monsterData.img;
        this.isBoss = monsterData.isBoss || false;

        // Rebalanced Hardcore Stats
        this.maxHealth = Math.floor(monsterData.baseHp * stageMultiplier * difficultyMult);
        this.health = this.maxHealth;
        this.maxMana = Math.floor(monsterData.baseMp * stageMultiplier);
        this.mana = this.maxMana;

        this.strength = Math.floor(monsterData.str * stageMultiplier * Math.sqrt(difficultyMult));
        this.agility = Math.floor(monsterData.agi * stageMultiplier);
        this.defense = Math.floor((monsterData.defense || 10) * stageMultiplier);
        this.speed = Math.floor(monsterData.spd * stageMultiplier);

        this.xpReward = Math.floor(monsterData.xpReward * stageMultiplier);
        this.goldReward = Math.floor(monsterData.goldReward * stageMultiplier);

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