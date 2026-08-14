// enemy.js - Expanded RPG Monsters, Bosses, Multi-Phase Bosses, & Scaling
let enemy = null;

const ENEMY_DATABASE = [
    // Tier 1 Monsters
    {
        name: 'Goblin Scout',
        img: 'characters imgs/enemy/Goblin.jpg',
        tier: 1,
        isBoss: false,
        baseHp: 90,
        baseMp: 0,
        str: 25,
        agi: 35,
        spd: 42,
        xpReward: 35,
        goldReward: 20,
        skills: [{ name: 'Rusty Dagger', mult: 1.0, type: 'physical' }]
    },
    {
        name: 'Forest Troll',
        img: 'characters imgs/enemy/Troll.jpg',
        tier: 1,
        isBoss: false,
        baseHp: 160,
        baseMp: 20,
        str: 42,
        agi: 15,
        spd: 28,
        xpReward: 55,
        goldReward: 35,
        skills: [
            { name: 'Club Smash', mult: 1.2, type: 'physical' },
            { name: 'Ground Slam', mult: 1.5, type: 'physical' }
        ]
    },

    // Tier 2 Monsters & Boss
    {
        name: 'Orc Berserker',
        img: 'characters imgs/enemy/Troll.jpg',
        tier: 2,
        isBoss: false,
        baseHp: 240,
        baseMp: 30,
        str: 60,
        agi: 25,
        spd: 35,
        xpReward: 90,
        goldReward: 60,
        skills: [
            { name: 'Axe Chop', mult: 1.3, type: 'physical' },
            { name: 'Blood Cleave', mult: 1.8, type: 'physical' }
        ]
    },
    {
        name: 'Shadow Goblin Warlord',
        img: 'characters imgs/enemy/Goblin.jpg',
        tier: 2,
        isBoss: true,
        baseHp: 420,
        baseMp: 80,
        str: 75,
        agi: 50,
        spd: 50,
        xpReward: 180,
        goldReward: 140,
        skills: [
            { name: 'Poison Dagger Volley', mult: 1.4, type: 'physical' },
            { name: 'Shadow Bomb', mult: 2.0, type: 'magic' }
        ],
        phase2Skill: { name: '🔥 ENRAGED SHADOW STORM', mult: 2.8, type: 'magic' }
    },

    // Tier 3 Bosses
    {
        name: 'Void Dragon',
        img: 'characters imgs/enemy/Troll.jpg',
        tier: 3,
        isBoss: true,
        baseHp: 750,
        baseMp: 200,
        str: 110,
        agi: 45,
        spd: 55,
        xpReward: 450,
        goldReward: 300,
        skills: [
            { name: 'Claw Slash', mult: 1.2, type: 'physical' },
            { name: 'Void Breath', mult: 2.3, type: 'magic' },
            { name: 'Cataclysm Shockwave', mult: 2.8, type: 'magic' }
        ],
        phase2Skill: { name: '⚡ ANCIENT DRAGON CATACLYSM', mult: 3.5, type: 'magic' }
    }
];

class Enemy {
    constructor(monsterData, stageMultiplier = 1.0) {
        this.enemyType = monsterData.name;
        this.name = monsterData.name;
        this.img = monsterData.img;
        this.isBoss = monsterData.isBoss || false;

        // Scaled Stats
        this.maxHealth = Math.floor(monsterData.baseHp * stageMultiplier);
        this.health = this.maxHealth;
        this.maxMana = Math.floor(monsterData.baseMp * stageMultiplier);
        this.mana = this.maxMana;

        this.strength = Math.floor(monsterData.str * stageMultiplier);
        this.agility = Math.floor(monsterData.agi * stageMultiplier);
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
            this.strength = Math.floor(this.strength * 1.3);
            if (this.phase2Skill) this.skills.push(this.phase2Skill);
            return true;
        }
        return false;
    }

    get CritChance() {
        return Math.min(0.04 + (this.agility * 0.003), 0.35);
    }

    get DodgeChance() {
        return Math.min(0.02 + (this.agility * 0.002), 0.30);
    }

    getRandomSkill() {
        if (this.inPhase2 && this.phase2Skill && Math.random() < 0.45) {
            return this.phase2Skill;
        }
        const randIndex = Math.floor(Math.random() * this.skills.length);
        return this.skills[randIndex];
    }
}