// player.js - Complete Hero Classes, Skills, Stats, & Progression System
let player = null;

// Hero Class Definitions & Skill Database
const HERO_CLASSES = {
    Warrior: {
        name: 'Warrior',
        title: 'The Vanguard Berserker',
        desc: 'Warriors possess mighty strength and heavy armor, tearing through foes with devastating melee strikes and shield defenses.',
        img: 'characters imgs/player/Warrior.jpg',
        baseStats: { hp: 220, mp: 40, str: 45, agi: 20, int: 10, vit: 40, spd: 35 },
        skills: [
            { id: 'w1', name: 'Heavy Slash', manaCost: 0, cooldown: 0, desc: 'A powerful sword strike dealing 120% physical damage.', sound: 'slash', type: 'physical', mult: 1.2 },
            { id: 'w2', name: 'Berserk Rampage', manaCost: 20, cooldown: 2, desc: 'Unleash wild fury hitting 2 times for 90% physical damage each.', sound: 'heavyHit', type: 'physical', mult: 0.9, hits: 2 },
            { id: 'w3', name: 'Iron Wall', manaCost: 15, cooldown: 3, desc: 'Raise a heavy shield to absorb incoming damage for 2 turns.', sound: 'shield', type: 'buff', shieldVal: 60 },
            { id: 'w4', name: 'Execute', manaCost: 30, cooldown: 4, desc: 'A devastating finisher dealing 250% physical damage. Deals extra damage if target is below 50% HP.', sound: 'heavyHit', type: 'physical', mult: 2.5 }
        ]
    },
    Rogue: {
        name: 'Rogue',
        title: 'Shadow Assassin',
        desc: 'Masters of speed and lethal precision. Rogues strike swiftly with high critical hit rates and deadly poisons.',
        img: 'characters imgs/player/Rouge.jpg',
        baseStats: { hp: 140, mp: 60, str: 35, agi: 55, int: 20, vit: 20, spd: 65 },
        skills: [
            { id: 'r1', name: 'Dual Strike', manaCost: 0, cooldown: 0, desc: 'Swift twin blade attack dealing 2 hits of 65% damage.', sound: 'slash', type: 'physical', mult: 0.65, hits: 2 },
            { id: 'r2', name: 'Venom Dagger', manaCost: 15, cooldown: 2, desc: 'Strike with a poisoned blade dealing 110% damage + applies Bleed.', sound: 'slash', type: 'physical', mult: 1.1, dot: 15 },
            { id: 'r3', name: 'Shadow Dance', manaCost: 25, cooldown: 3, desc: 'Vanish into shadows, boosting agility and guaranteeing critical hit next turn.', sound: 'shield', type: 'buff', critBuff: true },
            { id: 'r4', name: 'Assassinate', manaCost: 40, cooldown: 4, desc: 'Lethal ambush from the shadows dealing 300% critical damage!', sound: 'heavyHit', type: 'physical', mult: 3.0 }
        ]
    },
    Wizard: {
        name: 'Wizard',
        title: 'Master Arcane Weaver',
        desc: 'Wizards command elemental destructive magic from afar, burning and freezing enemies with high burst damage.',
        img: 'characters imgs/player/Wizard.jpg',
        baseStats: { hp: 120, mp: 220, str: 15, agi: 25, int: 60, vit: 18, spd: 40 },
        skills: [
            { id: 'mz1', name: 'Arcane Bolt', manaCost: 10, cooldown: 0, desc: 'Fires a glowing energy orb dealing 130% magical damage.', sound: 'fireball', type: 'magic', mult: 1.3, element: 'dark' },
            { id: 'mz2', name: 'Inferno Fireball', manaCost: 35, cooldown: 2, desc: 'Launches a massive blazing fireball dealing 220% fire damage.', sound: 'fireball', type: 'magic', mult: 2.2, element: 'fire' },
            { id: 'mz3', name: 'Frost Nova', manaCost: 30, cooldown: 3, desc: 'Freezes target dealing 140% ice damage and reducing enemy speed.', sound: 'fireball', type: 'magic', mult: 1.4, element: 'ice', slow: true },
            { id: 'mz4', name: 'Arcane Barrier', manaCost: 40, cooldown: 4, desc: 'Converts mana into a protective magical shield and recovers 30 MP.', sound: 'heal', type: 'buff', shieldVal: 80, mpRecover: 30 }
        ]
    },
    Hunter: {
        name: 'Hunter',
        title: 'Master Sharpshooter',
        desc: 'Versatile marksmen who excel in precision ranged combat, multiple arrow volleys, and survival instincts.',
        img: 'characters imgs/player/hunter.jpg',
        baseStats: { hp: 160, mp: 80, str: 38, agi: 45, int: 25, vit: 25, spd: 55 },
        skills: [
            { id: 'h1', name: 'Quick Shot', manaCost: 0, cooldown: 0, desc: 'Fire a rapid arrow dealing 110% physical damage.', sound: 'slash', type: 'physical', mult: 1.1 },
            { id: 'h2', name: 'Multi-Shot Volley', manaCost: 20, cooldown: 2, desc: 'Unleash a hail of arrows hitting 3 times for 60% damage each.', sound: 'slash', type: 'physical', mult: 0.6, hits: 3 },
            { id: 'h3', name: 'Eagle Eye', manaCost: 15, cooldown: 3, desc: 'Focus target weak points, gaining +25% Crit Chance for 3 turns.', sound: 'shield', type: 'buff' },
            { id: 'h4', name: 'Sniper Piercing Arrow', manaCost: 35, cooldown: 4, desc: 'A lethal armor-piercing shot dealing 240% damage ignoring armor.', sound: 'heavyHit', type: 'physical', mult: 2.4 }
        ]
    },
    Paladin: {
        name: 'Paladin',
        title: 'Holy Champion of Light',
        desc: 'Blessed defenders of righteousness who balance radiant smites with divine healing and unbreakable defense.',
        img: 'characters imgs/player/Paladin.jpg',
        baseStats: { hp: 200, mp: 100, str: 38, agi: 22, int: 35, vit: 38, spd: 32 },
        skills: [
            { id: 'p1', name: 'Righteous Hammer', manaCost: 0, cooldown: 0, desc: 'Strike with holy force dealing 110% physical + 20% holy damage.', sound: 'slash', type: 'physical', mult: 1.3 },
            { id: 'p2', name: 'Divine Smite', manaCost: 25, cooldown: 2, desc: 'Call down holy pillar dealing 180% radiant magic damage.', sound: 'fireball', type: 'magic', mult: 1.8, element: 'holy' },
            { id: 'p3', name: 'Lay on Hands', manaCost: 35, cooldown: 3, desc: 'Channel holy light to heal 35% of max HP.', sound: 'heal', type: 'heal', healPercent: 0.35 },
            { id: 'p4', name: 'Aegis of Light', manaCost: 40, cooldown: 4, desc: 'Grant a holy shield that blocks 100 damage and reflects 20% back.', sound: 'shield', type: 'buff', shieldVal: 100 }
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
            { id: 'n3', name: 'Curse of Decay', manaCost: 20, cooldown: 3, desc: 'Weaken enemy strength and agility by 20% for 3 turns.', sound: 'fireball', type: 'debuff' },
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

        // Base Stats
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

        // Equipment Slots
        this.equipment = {
            weapon: { name: 'Iron Sword', str: 10, int: 0, price: 0 },
            armor: { name: 'Leather Vest', vit: 8, price: 0 },
            accessory: { name: 'Wooden Ring', agi: 5, price: 0 }
        };

        // Inventory
        this.potions = {
            hpPotion: 3,
            mpPotion: 2
        };

        // Status Effects (Shield, Buffs)
        this.shield = 0;
        this.buffCrit = false;
        this.speedGauge = 0;
    }

    recalculateStats() {
        const weaponStr = this.equipment.weapon ? (this.equipment.weapon.str || 0) : 0;
        const weaponInt = this.equipment.weapon ? (this.equipment.weapon.int || 0) : 0;
        const armorVit = this.equipment.armor ? (this.equipment.armor.vit || 0) : 0;
        const accAgi = this.equipment.accessory ? (this.equipment.accessory.agi || 0) : 0;

        const totalVit = this.vit + armorVit;
        const totalInt = this.int + weaponInt;

        this.maxHealth = HERO_CLASSES[this.classType].baseStats.hp + (totalVit * 15) + (this.level * 25);
        if (this.health > this.maxHealth) this.health = this.maxHealth;

        this.maxMana = HERO_CLASSES[this.classType].baseStats.mp + (totalInt * 12) + (this.level * 15);
        if (this.mana > this.maxMana) this.mana = this.maxMana;
    }

    get TotalStr() {
        return this.str + (this.equipment.weapon ? (this.equipment.weapon.str || 0) : 0);
    }
    get TotalAgi() {
        return this.agi + (this.equipment.accessory ? (this.equipment.accessory.agi || 0) : 0);
    }
    get TotalInt() {
        return this.int + (this.equipment.weapon ? (this.equipment.weapon.int || 0) : 0);
    }
    get TotalVit() {
        return this.vit + (this.equipment.armor ? (this.equipment.armor.vit || 0) : 0);
    }

    get CritChance() {
        let chance = 0.05 + (this.TotalAgi * 0.004);
        if (this.buffCrit) chance += 0.35;
        return Math.min(chance, 0.75);
    }

    get DodgeChance() {
        return Math.min(0.03 + (this.TotalAgi * 0.003), 0.40);
    }

    addXP(amount) {
        this.xp += amount;
        let leveledUp = false;
        while (this.xp >= this.nextLevelXp) {
            this.xp -= this.nextLevelXp;
            this.level += 1;
            this.statPoints += 3;
            this.nextLevelXp = Math.floor(this.nextLevelXp * 1.5);
            leveledUp = true;
        }
        this.recalculateStats();
        this.health = this.maxHealth;
        this.mana = this.maxMana;
        return leveledUp;
    }

    useHpPotion() {
        if (this.potions.hpPotion <= 0) return false;
        this.potions.hpPotion--;
        const healAmt = Math.floor(this.maxHealth * 0.5);
        this.health = Math.min(this.health + healAmt, this.maxHealth);
        SoundEngine.playHeal();
        return healAmt;
    }

    useMpPotion() {
        if (this.potions.mpPotion <= 0) return false;
        this.potions.mpPotion--;
        const mpAmt = Math.floor(this.maxMana * 0.6);
        this.mana = Math.min(this.mana + mpAmt, this.maxMana);
        SoundEngine.playHeal();
        return mpAmt;
    }

    updateCooldowns() {
        this.skills.forEach(s => {
            if (s.currentCD > 0) s.currentCD--;
        });
    }
}