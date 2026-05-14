---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: rendering
protected: false
---
# Synty Polygon Fantasy Rivals — Asset Index

**Package root:** `Assets/Synty/PolygonFantasyRivals/`
**Total prefabs:** 77

---

## Characters (20)

All in `Prefabs/Characters/`. Static meshes, no skeleton. Each has a matching weapon.

| Prefab | Description | Battlefield Use |
|--------|-------------|-----------------|
| `SM_Chr_AncientWarrior_01` | Armored ancient humanoid warrior | Heavy melee unit |
| `SM_Chrr_AncientQueen_01` | Armored ancient queen (note double-r typo in filename) | Boss / commander |
| `SM_Chr_BR_BarbarianGiant_01` | Large barbarian giant | Tank / heavy melee |
| `SM_Chr_BR_BigOrk_01` | Large orc fighter | Standard melee enemy |
| `SM_Chr_BR_Dwarf_01` | Stout dwarf warrior | Short-range melee |
| `SM_Chr_BR_ElementalGolem_01` | Elemental stone golem | Tank boss |
| `SM_Chr_BR_FortGolem_01` | Fortress golem (largest) | Boss / obstacle |
| `SM_Chr_BR_MechanicalGolem_01` | Mechanical/clockwork golem | Boss variant |
| `SM_Chr_BR_MutantGuy_01` | Mutant humanoid | Melee enemy |
| `SM_Chr_BR_PigButcher_01` | Pig-headed butcher | Brutish melee |
| `SM_Chr_BR_RedDemon_01` | Red demon | Boss / ranged magic |
| `SM_Chr_BR_Slayer_01` | Slayer (armored humanoid) | Elite melee |
| `SM_Chr_BR_Troll_01` | Troll | Large melee enemy |
| `SM_Chr_DarkElf_01` | Dark elf archer/rogue | Ranged/stealth unit |
| `SM_Chr_EvilGod_01` | Evil god — large winged being | Final boss |
| `SM_Chr_ForestGuardian_01` | Tree/nature guardian | Nature boss |
| `SM_Chr_ForestWitch_01` | Forest witch | Magic caster |
| `SM_Chr_Medusa_01` | Medusa (snake-haired) | Caster boss |
| `SM_Chr_Mystic_01` | Mystic humanoid mage | Support/caster |
| `SM_Chr_SpiritDemon_01` | Ghostly spirit demon | Magic boss |

---

## Weapons (21)

All in `Prefabs/Weapons/`. One-to-one match with characters (MechanicalGolem has 2).

| Prefab | Matched Character |
|--------|------------------|
| `SM_Wep_AncientWarrior_01` | AncientWarrior |
| `SM_Wep_AncientQueen_01` | AncientQueen |
| `SM_Wep_BarbarianGiant_01` | BarbarianGiant |
| `SM_Wep_BigOrk_01` | BigOrk |
| `SM_Wep_DarkElf_01` | DarkElf |
| `SM_Wep_Dwarf_01` | Dwarf |
| `SM_Wep_ElementalGolem_01` | ElementalGolem |
| `SM_Wep_EvilGod_01` | EvilGod |
| `SM_Wep_ForestGuardian_01` | ForestGuardian |
| `SM_Wep_ForestWitch_01` | ForestWitch |
| `SM_Wep_FortGolem_01` | FortGolem |
| `SM_Wep_MechanicalGolem_01` | MechanicalGolem (variant 1) |
| `SM_Wep_MechanicalGolem_02` | MechanicalGolem (variant 2) |
| `SM_Wep_Medusa_01` | Medusa |
| `SM_Wep_MutantGuy_01` | MutantGuy |
| `SM_Wep_Mystic_01` | Mystic |
| `SM_Wep_PigButcher_01` | PigButcher |
| `SM_Wep_RedDemon_01` | RedDemon |
| `SM_Wep_Slayer_01` | Slayer |
| `SM_Wep_SpiritDemon_01` | SpiritDemon |
| `SM_Wep_Troll_01` | Troll |

---

## Props (13)

All in `Prefabs/Props/`.

| Prefab | Description | Battlefield Use |
|--------|-------------|-----------------|
| `SM_Base_Dirt_01` | Dirt display base | Character showcase stand |
| `SM_Base_Dungeon_01` | Dark dungeon stone base | Boss arena floor piece |
| `SM_Base_Grass_01` | Grass display base | Nature zone stand |
| `SM_Base_Mechanical_01` | Mechanical/gear base | Golem spawn platform |
| `SM_Base_Rock_01` | Rock display base | Mountain zone stand |
| `SM_Prop_Backharness_01/02/03` | Back equipment harness variants | Character accessories |
| `SM_Prop_Bones_01` | Bone pile | Battlefield decoration |
| `SM_Prop_Mushroom_01/02` | Fantasy mushrooms | Nature zone decoration |
| `SM_Prop_Pouch_01/02/03` | Pouches | Loot/item prop |
| `SM_Prop_Pouch_Bag_01` | Larger pouch bag | Loot decoration |
| `SM_Prop_Skull_01` | Skull | Dungeon/dark zone deco |
| `SM_Prop_Tree_01/02` | Fantasy trees | Area decoration |
| `SM_Prop_Troll_Helmet` | Large troll helmet prop | Obstacle/decoration |

---

## FX (17)

All in `Prefabs/FX/`. All use `ParticleSystem` — **not ECS bake-able**, use as separate GameObjects.

| Prefab | Effect | Use |
|--------|--------|-----|
| `FX_BloodSplat_FX` | Blood splatter | Hit effect |
| `FX_EnergyPull_01` | Energy pull vortex | Ability FX |
| `FX_EnergyPush_01` | Energy push burst | Ability FX |
| `FX_Fire_01_01` | Small fire | Torch / campfire |
| `FX_Fire_02_01` | Medium fire | Large torch |
| `FX_Fire_Circle_01` | Fire ring on ground | AoE indicator |
| `FX_Fire_Swirls_01` | Swirling fire | Boss fire aura |
| `FX_Fireball_01` | Fireball burst | Explosion FX |
| `FX_Fireball_Shooting_01` | Projectile fireball | Ranged attack FX |
| `FX_Magic_Missile_01` | Magic missile projectile | Ranged magic attack |
| `FX_Magic_Swirl_01` | Magic swirl aura | Caster idle FX |
| `FX_Runes_01` | Glowing rune circle | Spell cast / summoning |
| `FX_Small_Energy_Cube_01` | Small geometric energy cube | Ability/buff FX |
| `FX_Small_Energy_Soft_01` | Soft energy glow | Ambient magic glow |
| `FX_Smoke_Large_01` | Large smoke cloud | Destruction / spawn |
| `FX_Smoke_Small_Dark_01` | Small dark smoke | Hit/death puff |
| `FX_Sparks_01` | Spark burst | Impact / electrical FX |
