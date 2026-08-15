// player.js - Complete Hero Classes, Skills, Stats, Companions, Gems, Masteries & Gear Upgrades
let player = null;

// Companions Database & Evolution Branches
const COMPANIONS = {
    wolf: {
        id: 'wolf',
        name: 'Dire Wolf',
        tier: 1,
        title: 'Fierce Beast',
        desc: 'Attacks enemy every turn dealing 75% physical damage and inflicting Bleed.',
        price: 150,
        evolveCost: 30,
        img: 'characters imgs/enemy/goblin_scout.jpg',
        act: function(hero, target) {
            const mult = this.tier === 3 ? 1.5 : (this.tier === 2 ? 1.0 : 0.75);
            const dmg = Math.floor(hero.TotalStr * mult);
            target.health = Math.max(0, target.health - dmg);
            SoundEngine.playSlash();
            return { msg: `${this.name} lunged at ${target.name} dealing <span style="color:#ff3366">${dmg} damage</span>!`, dmg: dmg, type: 'dmg' };
        }
    },
    golem: {
        id: 'golem',
        name: 'Arcane Golem',
        tier: 1,
        title: 'Rune Guardian',
        desc: 'Grants hero Shield points every turn.',
        price: 200,
        evolveCost: 35,
        img: 'characters imgs/enemy/forest_troll.jpg',
        act: function(hero, target) {
            const val = this.tier === 3 ? 100 : (this.tier === 2 ? 65 : 40);
            hero.shield += val;
            SoundEngine.playShield();
            return { msg: `${this.name} granted <span style="color:#00d2ff">+${val} Shield</span>!`, shield: val, type: 'heal' };
        }
    },
    cleric: {
        id: 'cleric',
        name: 'Holy Cleric',
        tier: 1,
        title: 'Divine Companion',
        desc: 'Heals hero every turn.',
        price: 220,
        evolveCost: 40,
        img: 'characters imgs/player/Paladin.jpg',
        act: function(hero, target) {
            const pct = this.tier === 3 ? 0.30 : (this.tier === 2 ? 0.22 : 0.18);
            const heal = Math.floor(hero.maxHealth * pct);
            hero.health = Math.min(hero.maxHealth, hero.health + heal);
            SoundEngine.playHeal();
            return { msg: `${this.name} healed hero for <span style="color:#00ffaa">+${heal} HP</span>!`, heal: heal, type: 'heal' };
        }
    },
    drake: {
        id: 'drake',
        name: 'Shadow Drake',
        tier: 1,
        title: 'Void Hatchling',
        desc: 'Fires dark magic blasts every turn.',
        price: 250,
        evolveCost: 45,
        img: 'characters imgs/enemy/void_dragon.jpg',
        act: function(hero, target) {
            const mult = this.tier === 3 ? 2.0 : (this.tier === 2 ? 1.3 : 0.95);
            const dmg = Math.floor(hero.TotalInt * mult);
            target.health = Math.max(0, target.health - dmg);
            SoundEngine.playFireball();
            return { msg: `${this.name} blasted ${target.name} for <span style="color:#aa00ff">${dmg} dark magic damage</span>!`, dmg: dmg, type: 'crit' };
        }
    }
};

const COMPANION_EVOLUTIONS = {
    wolf: [
        { tier: 1, name: 'Dire Wolf', cost: 0, levelReq: 1 },
        { tier: 2, name: 'Dire Fenrir Wolf', cost: 30, levelReq: 5 },
        { tier: 3, name: 'Mythic Alpha Fenrir', cost: 60, levelReq: 10 }
    ],
    golem: [
        { tier: 1, name: 'Arcane Golem', cost: 0, levelReq: 1 },
        { tier: 2, name: 'Titan Rune Golem', cost: 35, levelReq: 5 },
        { tier: 3, name: 'Ancient Titan Guardian', cost: 70, levelReq: 10 }
    ],
    cleric: [
        { tier: 1, name: 'Holy Cleric', cost: 0, levelReq: 1 },
        { tier: 2, name: 'Radiant Archangel', cost: 40, levelReq: 5 },
        { tier: 3, name: 'Seraphim Divine Sovereign', cost: 80, levelReq: 10 }
    ],
    drake: [
        { tier: 1, name: 'Shadow Drake', cost: 0, levelReq: 1 },
        { tier: 2, name: 'Void Hell-Drake', cost: 45, levelReq: 5 },
        { tier: 3, name: 'Cosmic Abyssal Dragon', cost: 90, levelReq: 10 }
    ]
};

// Elemental Socketable Gem Database
const GEMS = {
    ruby: { id: 'ruby', name: '🔴 Ruby of Infernal Flame', stat: '+25% Skill Damage & Burn', price: 120, extraDmgMult: 0.25, color: '#ff3366' },
    sapphire: { id: 'sapphire', name: '🔷 Sapphire of Frost Shield', stat: '+35 Shield on skill cast', price: 130, shieldBonus: 35, color: '#00d2ff' },
    emerald: { id: 'emerald', name: '🟢 Emerald of Venom Lifesteal', stat: '+20% Lifesteal on hits', price: 150, lifestealPct: 0.20, color: '#00ff66' },
    diamond: { id: 'diamond', name: '🟡 Diamond of Holy Radiance', stat: '+20% Crit Rate & +25 MP/turn', price: 180, critBonus: 0.20, mpRegen: 25, color: '#ffcc00' }
};

// Level 5 Specializations / Masteries
const CLASS_SPECIALIZATIONS = {
    Warrior: [
        {
            id: 'war_pyro',
            name: 'Pyromancer Berserker',
            desc: 'Ignites weapons in flames. Physical strikes deal +25% Fire damage.',
            skill: { id: 'w_spec', name: 'Inferno Cleave', manaCost: 35, cooldown: 3, desc: 'Unleash a fiery arc dealing 280% Fire physical damage!', sound: 'fireball', type: 'physical', mult: 2.8, element: 'fire' }
        },
        {
            id: 'war_jug',
            name: 'Iron Juggernaut',
            desc: 'Gains +30% Max HP and +20 Vitality.',
            bonusHpPercent: 0.30,
            skill: { id: 'w_spec2', name: 'Unstoppable Shield Bash', manaCost: 30, cooldown: 3, desc: 'Smash enemy dealing 200% damage and gaining 80 Shield.', sound: 'heavyHit', type: 'physical', mult: 2.0, shieldVal: 80 }
        }
    ],
    Rogue: [
        {
            id: 'rog_poison',
            name: 'Venom Shadow',
            desc: 'Poisons all attacks, increasing Bleed and Critical hit damage.',
            skill: { id: 'r_spec', name: 'Toxic Shadow Rain', manaCost: 35, cooldown: 3, desc: 'Rains 4 poison daggers dealing 70% damage each + Bleed.', sound: 'slash', type: 'physical', mult: 0.7, hits: 4 }
        },
        {
            id: 'rog_reaper',
            name: 'Shadow Reaper',
            desc: 'Gains +25% Dodge chance and stealth strikes.',
            skill: { id: 'r_spec2', name: 'Phantom Decapitation', manaCost: 45, cooldown: 4, desc: 'Lethal shadow strike dealing 350% critical damage!', sound: 'heavyHit', type: 'physical', mult: 3.5 }
        }
    ],
    Wizard: [
        {
            id: 'wiz_archmage',
            name: 'Arcane Archmage',
            desc: 'Multiplies spell power and reduces all mana costs by 20%.',
            skill: { id: 'wiz_spec', name: 'Supernova Collapse', manaCost: 50, cooldown: 4, desc: 'Unleash cosmic explosion dealing 320% elemental magic damage!', sound: 'fireball', type: 'magic', mult: 3.2, element: 'fire' }
        }
    ],
    Hunter: [
        {
            id: 'hunt_sniper',
            name: 'Deadeye Sniper',
            desc: '+20% Critical Hit Chance and armor piercing shots.',
            skill: { id: 'h_spec', name: 'Headshot Annihilation', manaCost: 40, cooldown: 3, desc: 'Precision sniper shot dealing 300% critical physical damage!', sound: 'slash', type: 'physical', mult: 3.0 }
        }
    ],
    Paladin: [
        {
            id: 'pal_crusader',
            name: 'High Templar Crusader',
            desc: 'Empowers holy healing and smite bursts by 40%.',
            skill: { id: 'p_spec', name: 'Wrath of the Heavens', manaCost: 45, cooldown: 4, desc: 'Call down holy wrath dealing 280% radiant damage + 60 Heal.', sound: 'heal', type: 'magic', mult: 2.8, healPercent: 0.2, element: 'holy' }
        }
    ],
    Necromancer: [
        {
            id: 'nec_lich',
            name: 'Lich King Sovereign',
            desc: 'Drains soul essence to boost lifesteal and dark spell power.',
            skill: { id: 'n_spec', name: 'Soul Cataclysm', manaCost: 50, cooldown: 4, desc: 'Devour enemy soul: 300% dark damage + 40% lifesteal!', sound: 'fireball', type: 'magic', mult: 3.0, lifesteal: 0.4, element: 'dark' }
        }
    ]
};

const HERO_CLASSES = {
    Warrior: {
        name: 'Warrior',
        title: 'The Vanguard Berserker',
        desc: 'Warriors possess mighty strength and heavy armor, tearing through foes with devastating melee strikes and shield defenses.',
        img: 'characters imgs/player/Warrior.jpg',
        baseStats: { hp: 220, mp: 40, str: 45, agi: 20, int: 15, vit: 45, spd: 30 },
        skills: [
            { id: 'w1', name: 'Heavy Slash', manaCost: 0, cooldown: 0, desc: 'Strike enemy dealing 120% physical damage.', sound: 'slash', type: 'physical', mult: 1.2 },
            { id: 'w2', name: 'Berserk Rampage', manaCost: 20, cooldown: 2, desc: 'Unleash wild frenzy dealing 180% damage.', sound: 'heavyHit', type: 'physical', mult: 1.8 },
            { id: 'w3', name: 'Iron Wall', manaCost: 15, cooldown: 3, desc: 'Gain 50 Shield points to absorb damage.', sound: 'shield', type: 'buff', shieldVal: 50 },
            { id: 'w4', name: 'Execute', manaCost: 30, cooldown: 4, desc: 'Devastating strike dealing 250% damage.', sound: 'heavyHit', type: 'physical', mult: 2.5 }
        ]
    },
    Rogue: {
        name: 'Rogue',
        title: 'Shadow Assassin',
        desc: 'Masters of speed and lethal precision. Rogues strike swiftly with high critical hit rates and deadly poisons.',
        img: 'characters imgs/player/Rouge.jpg',
        baseStats: { hp: 140, mp: 60, str: 35, agi: 55, int: 20, vit: 25, spd: 50 },
        skills: [
            { id: 'r1', name: 'Quick Dagger', manaCost: 0, cooldown: 0, desc: 'Swift strike dealing 100% physical damage.', sound: 'slash', type: 'physical', mult: 1.0 },
            { id: 'r2', name: 'Poison Ambush', manaCost: 15, cooldown: 2, desc: 'Strike for 150% damage + 20% Lifesteal.', sound: 'slash', type: 'physical', mult: 1.5, lifesteal: 0.2 },
            { id: 'r3', name: 'Shadow Dance', manaCost: 20, cooldown: 3, desc: 'Increase Crit Chance by 35% for next turn.', sound: 'shield', type: 'buff', critBuff: true },
            { id: 'r4', name: 'Shadowblade Flurry', manaCost: 35, cooldown: 4, desc: 'Multi-hit strike dealing 260% physical damage.', sound: 'heavyHit', type: 'physical', mult: 2.6 }
        ]
    },
    Wizard: {
        name: 'Wizard',
        title: 'Master Arcane Weaver',
        desc: 'Wizards command elemental destructive magic from afar, burning and freezing enemies with high burst damage.',
        img: 'characters imgs/player/Wizard.jpg',
        baseStats: { hp: 120, mp: 220, str: 15, agi: 25, int: 60, vit: 20, spd: 35 },
        skills: [
            { id: 'm1', name: 'Arcane Bolt', manaCost: 0, cooldown: 0, desc: 'Cast energy bolt dealing 110% magic damage.', sound: 'fireball', type: 'magic', mult: 1.1 },
            { id: 'm2', name: 'Inferno Fireball', manaCost: 30, cooldown: 2, desc: 'Blast enemy dealing 200% elemental fire damage.', sound: 'fireball', type: 'magic', mult: 2.0, element: 'fire' },
            { id: 'm3', name: 'Mana Barrier', manaCost: 25, cooldown: 3, desc: 'Convert mana into 65 Shield points & recover MP.', sound: 'shield', type: 'buff', shieldVal: 65, mpRecover: 30 },
            { id: 'm4', name: 'Lightning Storm', manaCost: 50, cooldown: 4, desc: 'Summon cataclysmic storm dealing 280% magic damage.', sound: 'fireball', type: 'magic', mult: 2.8, element: 'lightning' }
        ]
    },
    Hunter: {
        name: 'Hunter',
        title: 'Master Sharpshooter',
        desc: 'Versatile marksmen who excel in precision ranged combat, multiple arrow volleys, and survival instincts.',
        img: 'characters imgs/player/hunter.jpg',
        baseStats: { hp: 160, mp: 80, str: 38, agi: 45, int: 22, vit: 32, spd: 45 },
        skills: [
            { id: 'h1', name: 'Piercing Arrow', manaCost: 0, cooldown: 0, desc: 'Ranged shot dealing 115% physical damage.', sound: 'slash', type: 'physical', mult: 1.15 },
            { id: 'h2', name: 'Multi-Arrow Volley', manaCost: 20, cooldown: 2, desc: 'Fire array of arrows dealing 170% damage.', sound: 'slash', type: 'physical', mult: 1.7 },
            { id: 'h3', name: 'Eagle Focus', manaCost: 15, cooldown: 3, desc: '+25% Crit chance and gain 30 Shield.', sound: 'shield', type: 'buff', shieldVal: 30, critBuff: true },
            { id: 'h4', name: 'Sniper Assassinate', manaCost: 40, cooldown: 4, desc: 'Lethal headshot dealing 270% physical damage.', sound: 'heavyHit', type: 'physical', mult: 2.7 }
        ]
    },
    Paladin: {
        name: 'Paladin',
        title: 'Holy Champion of Light',
        desc: 'Blessed defenders of righteousness who balance radiant smites with divine healing and unbreakable defense.',
        img: 'characters imgs/player/Paladin.jpg',
        baseStats: { hp: 200, mp: 100, str: 38, agi: 22, int: 35, vit: 38, spd: 32 },
        skills: [
            { id: 'p1', name: 'Righteous Hammer', manaCost: 0, cooldown: 0, desc: 'Strike with holy force dealing 110% physical damage.', sound: 'slash', type: 'physical', mult: 1.1 },
            { id: 'p2', name: 'Divine Smite', manaCost: 25, cooldown: 2, desc: 'Call down holy pillar dealing 180% radiant magic damage.', sound: 'fireball', type: 'magic', mult: 1.8, element: 'holy' },
            { id: 'p3', name: 'Lay on Hands', manaCost: 35, cooldown: 3, desc: 'Channel holy light to heal 35% of max HP.', sound: 'heal', type: 'heal', healPercent: 0.35 },
            { id: 'p4', name: 'Aegis of Light', manaCost: 40, cooldown: 4, desc: 'Grant a holy shield that blocks 100 damage.', sound: 'shield', type: 'buff', shieldVal: 100 }
        ]
    },
    Necromancer: {
        name: 'Necromancer',
        title: 'Sovereign of Death',
        desc: 'Dark sorcerers who drain life essence from foes and command bone magic to crush opposition.',
        img: 'characters imgs/player/Necromancer.jpg',
        baseStats: { hp: 130, mp: 180, str: 18, agi: 28, int: 55, vit: 22, spd: 38 },
        skills: [
            { id: 'n1', name: 'Bone Spear', manaCost: 10, cooldown: 0, desc: 'Hurl sharp bone projectiles dealing 125% magic damage.', sound: 'fireball', type: 'magic', mult: 1.25, element: 'dark' },
            { id: 'n2', name: 'Siphon Life', manaCost: 25, cooldown: 2, desc: 'Drain life force: deals 150% damage and heals user for 50% of damage dealt.', sound: 'heal', type: 'magic', mult: 1.5, lifesteal: 0.5, element: 'dark' },
            { id: 'n3', name: 'Curse of Decay', manaCost: 20, cooldown: 3, desc: 'Corrupt enemy: deals 140% dark magic damage & weakens enemy strength by 20% for 3 turns.', sound: 'fireball', type: 'magic', mult: 1.4, debuffStrPct: 0.2, element: 'dark' },
            { id: 'n4', name: 'Army of the Dead', manaCost: 45, cooldown: 4, desc: 'Summon spectral forces dealing 260% dark damage!', sound: 'heavyHit', type: 'magic', mult: 2.6, element: 'dark' }
        ]
    }
};

class Player {
    constructor(classType) {
        const classDef = HERO_CLASSES[classType] || HERO_CLASSES.Warrior;
        this.classType = classType;
        this.title = classDef.title;
        this.img = classDef.img;
        
        // Progression
        this.level = 1;
        this.xp = 0;
        this.nextLevelXp = 100;
        this.statPoints = 0;
        this.gold = 50;
        this.coins = 15; // Victory Coins for Gear Upgrades

        // Base Stats
        this.baseStats = { ...classDef.baseStats };
        this.str = classDef.baseStats.str;
        this.agi = classDef.baseStats.agi;
        this.int = classDef.baseStats.int;
        this.vit = classDef.baseStats.vit;
        this.spd = classDef.baseStats.spd;

        // Calculated HP & MP
        this.maxHealth = classDef.baseStats.hp + (this.vit * 12);
        this.health = this.maxHealth;
        this.maxMana = classDef.baseStats.mp + (this.int * 10);
        this.mana = this.maxMana;

        // Active Skills & Cooldowns
        this.skills = classDef.skills.map(s => ({ ...s, currentCD: 0 }));

        // Phase 2 & 3 Expansions
        this.companion = null;
        this.socketedGem = null;
        this.specialization = null;
        this.blessings = [];
        this.achievements = [];

        // Equipment & Smithing Upgrade Levels (+0 to +10)
        this.equipment = {
            weapon: { name: 'Iron Sword', str: 10, int: 0, price: 0 },
            armor: { name: 'Leather Vest', vit: 8, price: 0 },
            accessory: { name: 'Wooden Ring', agi: 5, price: 0 },
            weaponLevel: 0,
            armorLevel: 0,
            accessoryLevel: 0
        };

        // Inventory
        this.potions = {
            hpPotion: 3,
            mpPotion: 2
        };

        // Status Effects
        this.shield = 0;
        this.buffCrit = false;
        this.speedGauge = 0;
    }

    recalculateStats() {
        const wLevel = this.equipment.weaponLevel || 0;
        const aLevel = this.equipment.armorLevel || 0;
        const accLevel = this.equipment.accessoryLevel || 0;

        const rawWeaponStr = this.equipment.weapon ? (this.equipment.weapon.str || 0) : 0;
        const rawWeaponInt = this.equipment.weapon ? (this.equipment.weapon.int || 0) : 0;
        const rawArmorVit = this.equipment.armor ? (this.equipment.armor.vit || 0) : 0;

        const weaponStr = Math.floor(rawWeaponStr * (1 + wLevel * 0.15));
        const weaponInt = Math.floor(rawWeaponInt * (1 + wLevel * 0.15));
        const armorVit = Math.floor(rawArmorVit * (1 + aLevel * 0.15));

        const totalVit = this.vit + armorVit + (this.hasBlessing('vit') ? 20 : 0);
        const totalInt = this.int + weaponInt + (this.hasBlessing('int') ? 20 : 0);

        let hpMult = 1.0 + (aLevel * 0.05);
        if (this.specialization && this.specialization.bonusHpPercent) hpMult += this.specialization.bonusHpPercent;
        if (this.hasBlessing('maxHp')) hpMult += 0.30;

        this.maxHealth = Math.floor((HERO_CLASSES[this.classType].baseStats.hp + (totalVit * 15) + (this.level * 25)) * hpMult);
        if (this.health > this.maxHealth) this.health = this.maxHealth;

        this.maxMana = HERO_CLASSES[this.classType].baseStats.mp + (totalInt * 12) + (this.level * 15);
        if (this.mana > this.maxMana) this.mana = this.maxMana;
    }

    hasBlessing(id) {
        return this.blessings && this.blessings.includes(id);
    }

    get TotalStr() {
        const wLevel = this.equipment.weaponLevel || 0;
        let baseW = this.equipment.weapon ? (this.equipment.weapon.str || 0) : 0;
        let val = this.str + Math.floor(baseW * (1 + wLevel * 0.15));
        if (this.socketedGem && this.socketedGem.extraDmg) val += this.socketedGem.extraDmg;
        return val;
    }

    get TotalAgi() {
        const accLevel = this.equipment.accessoryLevel || 0;
        let baseAcc = this.equipment.accessory ? (this.equipment.accessory.agi || 0) : 0;
        return this.agi + Math.floor(baseAcc * (1 + accLevel * 0.15));
    }

    get TotalInt() {
        const wLevel = this.equipment.weaponLevel || 0;
        let baseW = this.equipment.weapon ? (this.equipment.weapon.int || 0) : 0;
        return this.int + Math.floor(baseW * (1 + wLevel * 0.15));
    }

    get TotalVit() {
        const aLevel = this.equipment.armorLevel || 0;
        let baseA = this.equipment.armor ? (this.equipment.armor.vit || 0) : 0;
        return this.vit + Math.floor(baseA * (1 + aLevel * 0.15));
    }

    get CritChance() {
        const accLevel = this.equipment.accessoryLevel || 0;
        let chance = 0.05 + (this.TotalAgi * 0.004) + (accLevel * 0.02);
        if (this.buffCrit) chance += 0.35;
        if (this.socketedGem && this.socketedGem.crit) chance += this.socketedGem.crit;
        if (this.hasBlessing('crit')) chance += 0.20;
        return Math.min(chance, 0.75);
    }

    get DodgeChance() {
        const accLevel = this.equipment.accessoryLevel || 0;
        let chance = 0.03 + (this.TotalAgi * 0.003) + (accLevel * 0.015);
        if (this.hasBlessing('dodge')) chance += 0.15;
        return Math.min(chance, 0.50);
    }

    addXP(amount) {
        this.xp += amount;
        let leveledUp = false;
        while (this.xp >= this.nextLevelXp) {
            this.xp -= this.nextLevelXp;
            this.level++;
            this.statPoints += 3;
            this.nextLevelXp = Math.floor(this.nextLevelXp * 1.5);
            this.recalculateStats();
            this.health = this.maxHealth;
            this.mana = this.maxMana;
            leveledUp = true;
        }
        return leveledUp;
    }

    useHpPotion() {
        if (this.potions.hpPotion <= 0) return 0;
        this.potions.hpPotion--;
        const restored = Math.floor(this.maxHealth * 0.50);
        this.health = Math.min(this.maxHealth, this.health + restored);
        return restored;
    }

    useMpPotion() {
        if (this.potions.mpPotion <= 0) return 0;
        this.potions.mpPotion--;
        const restored = Math.floor(this.maxMana * 0.60);
        this.mana = Math.min(this.maxMana, this.mana + restored);
        return restored;
    }

    updateCooldowns() {
        this.skills.forEach(s => {
            if (s.currentCD > 0) s.currentCD--;
        });
    }

    setSpecialization(specObj) {
        this.specialization = specObj;
        if (specObj.skill && !this.skills.find(s => s.id === specObj.skill.id)) {
            this.skills.push({ ...specObj.skill, currentCD: 0 });
        }
        this.recalculateStats();
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Player, COMPANIONS, GEMS, HERO_CLASSES };
}