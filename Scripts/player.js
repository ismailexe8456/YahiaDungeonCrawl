// player.js - Complete Hero Classes, Skills, Stats, Companions, Gems, & Masteries
let player = null;

// Companions Database
const COMPANIONS = {
    wolf: {
        id: 'wolf',
        name: 'Dire Wolf',
        title: 'Fierce Beast',
        desc: 'Attacks enemy every turn dealing 75% physical damage and inflicting Bleed.',
        price: 150,
        img: 'characters imgs/enemy/Goblin.jpg',
        act: function(hero, target) {
            const dmg = Math.floor(hero.TotalStr * 0.75);
            target.health = Math.max(0, target.health - dmg);
            SoundEngine.playSlash();
            return { msg: `Dire Wolf lunged at ${target.name} dealing <span style="color:#ff3366">${dmg} damage</span>!`, dmg: dmg, type: 'dmg' };
        }
    },
    golem: {
        id: 'golem',
        name: 'Arcane Golem',
        title: 'Rune Guardian',
        desc: 'Grants hero 40 Shield points every 2 turns.',
        price: 200,
        img: 'characters imgs/enemy/Troll.jpg',
        act: function(hero, target) {
            hero.shield += 40;
            SoundEngine.playShield();
            return { msg: `Arcane Golem granted <span style="color:#00d2ff">+40 Shield</span>!`, shield: 40, type: 'heal' };
        }
    },
    cleric: {
        id: 'cleric',
        name: 'Holy Cleric',
        title: 'Divine Companion',
        desc: 'Heals hero for 18% of max HP every turn.',
        price: 220,
        img: 'characters imgs/player/Paladin.jpg',
        act: function(hero, target) {
            const heal = Math.floor(hero.maxHealth * 0.18);
            hero.health = Math.min(hero.maxHealth, hero.health + heal);
            SoundEngine.playHeal();
            return { msg: `Holy Cleric healed hero for <span style="color:#00ffaa">+${heal} HP</span>!`, heal: heal, type: 'heal' };
        }
    },
    drake: {
        id: 'drake',
        name: 'Shadow Drake',
        title: 'Void Hatchling',
        desc: 'Fires dark magic blasts for 95% magic damage.',
        price: 250,
        img: 'characters imgs/player/Necromancer.jpg',
        act: function(hero, target) {
            const dmg = Math.floor(hero.TotalInt * 0.95);
            target.health = Math.max(0, target.health - dmg);
            SoundEngine.playFireball();
            return { msg: `Shadow Drake blasted ${target.name} for <span style="color:#aa00ff">${dmg} dark magic damage</span>!`, dmg: dmg, type: 'crit' };
        }
    }
};

// Gem Gems Database
const GEMS = {
    ruby: { id: 'ruby', name: 'Fire Ruby', stat: '+30 Fire Damage', price: 120, extraDmg: 30, color: '#ff3300' },
    emerald: { id: 'emerald', name: 'Life Emerald', stat: '+15% Lifesteal', price: 150, lifesteal: 0.15, color: '#00ff66' },
    topaz: { id: 'topaz', name: 'Thunder Topaz', stat: '+20% Speed & +10% Crit', price: 160, crit: 0.10, color: '#ffcc00' }
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
            id: 'wiz_arch',
            name: 'Archmage Elementalist',
            desc: 'Boosts Intelligence and reduces spell mana costs by 20%.',
            skill: { id: 'm_spec', name: 'Cataclysm Meteor', manaCost: 50, cooldown: 4, desc: 'Summons a colossal meteor dealing 360% Fire magic damage!', sound: 'fireball', type: 'magic', mult: 3.6, element: 'fire' }
        },
        {
            id: 'wiz_frost',
            name: 'Frost Sovereign',
            desc: 'Freezes attackers and gains +100 Max Mana.',
            skill: { id: 'm_spec2', name: 'Absolute Zero', manaCost: 40, cooldown: 3, desc: 'Freezes foe dealing 250% Ice damage and granting 70 Shield.', sound: 'fireball', type: 'magic', mult: 2.5, element: 'ice', shieldVal: 70 }
        }
    ],
    Hunter: [
        {
            id: 'hunt_hawk',
            name: 'Sniper Hawk Eye',
            desc: 'Increases Crit Chance by 20% and attack range.',
            skill: { id: 'h_spec', name: 'Orbital Arrow Flare', manaCost: 35, cooldown: 3, desc: 'Fires flare arrow dealing 300% armor-piercing damage.', sound: 'heavyHit', type: 'physical', mult: 3.0 }
        }
    ],
    Paladin: [
        {
            id: 'pal_sun',
            name: 'Sun Champion',
            desc: 'Infuses hits with Holy light and gains +25 STR.',
            skill: { id: 'p_spec', name: 'Solar Wrath Smite', manaCost: 40, cooldown: 3, desc: 'Holy pillar dealing 320% Holy damage + heals hero 20%.', sound: 'heal', type: 'magic', mult: 3.2, element: 'holy', healPercent: 0.2 }
        }
    ],
    Necromancer: [
        {
            id: 'nec_lich',
            name: 'Lich Sovereign',
            desc: 'Increases Lifesteal by 25% and Dark magic power.',
            skill: { id: 'n_spec', name: 'Soul Annihilation', manaCost: 50, cooldown: 4, desc: 'Drains soul: 350% dark damage and steals 40% as HP!', sound: 'fireball', type: 'magic', mult: 3.5, lifesteal: 0.4, element: 'dark' }
        }
    ]
};

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
            { id: 'w4', name: 'Execute', manaCost: 30, cooldown: 4, desc: 'A devastating finisher dealing 250% physical damage.', sound: 'heavyHit', type: 'physical', mult: 2.5 }
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

        // Phase 2 Expansions
        this.companion = null; // COMPANIONS obj
        this.socketedGem = null; // GEMS obj
        this.specialization = null; // Specialization obj
        this.blessings = []; // Shrine blessings
        this.achievements = []; // Unlocked trophies

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

        const totalVit = this.vit + armorVit + (this.hasBlessing('vit') ? 20 : 0);
        const totalInt = this.int + weaponInt + (this.hasBlessing('int') ? 20 : 0);

        let hpMult = 1.0;
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
        let val = this.str + (this.equipment.weapon ? (this.equipment.weapon.str || 0) : 0);
        if (this.socketedGem && this.socketedGem.extraDmg) val += this.socketedGem.extraDmg;
        return val;
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
        if (this.hasBlessing('crit')) chance += 0.20;
        if (this.socketedGem && this.socketedGem.crit) chance += this.socketedGem.crit;
        return Math.min(chance, 0.85);
    }

    get DodgeChance() {
        let dodge = 0.03 + (this.TotalAgi * 0.003);
        if (this.hasBlessing('dodge')) dodge += 0.15;
        return Math.min(dodge, 0.50);
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

    setSpecialization(specObj) {
        this.specialization = specObj;
        if (specObj.skill && !this.skills.find(s => s.id === specObj.skill.id)) {
            this.skills.push({ ...specObj.skill, currentCD: 0 });
        }
        this.recalculateStats();
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