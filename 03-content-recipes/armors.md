# Armors

An armor is a `PlayerData` datablock. It defines the player's model, physics, energy, jetpack, inventory
limits, footstep sounds, damage locations, and animation bindings — around 200 fields. This page covers
the ones that matter, with the shipped `LightMaleHumanArmor` as reference.

## The nine shipped armors

```php
datablock PlayerData(LightMaleHumanArmor)    : LightPlayerDamageProfile  { … };
datablock PlayerData(MediumMaleHumanArmor)   : MediumPlayerDamageProfile { … };
datablock PlayerData(HeavyMaleHumanArmor)    : HeavyPlayerDamageProfile  { … };

datablock PlayerData(LightFemaleHumanArmor)  : LightMaleHumanArmor  { … };
datablock PlayerData(MediumFemaleHumanArmor) : MediumMaleHumanArmor { … };
datablock PlayerData(HeavyFemaleHumanArmor)  : HeavyMaleHumanArmor  { … };

datablock PlayerData(LightMaleBiodermArmor)  : LightMaleHumanArmor  { … };
datablock PlayerData(MediumMaleBiodermArmor) : MediumMaleHumanArmor { … };
datablock PlayerData(HeavyMaleBiodermArmor)  : HeavyMaleHumanArmor  { … };
```

Three real armors; six variants that inherit and change little more than the shape file. **[script]**

The `*PlayerDamageProfile` parents carry the damage-scaling tables — see
[Damage and type masks](damage-and-typemasks.md).

**If you are adding an armor, inherit.** Deriving from `LightMaleHumanArmor` and overriding twenty fields
is dramatically less work and less bug-prone than copying 200.

## Core identity

```php
   emap = true;
   className = Armor;                 // ← dispatch namespace: Armor::…
   shapeFile = "light_male.dts";
   cameraMaxDist = 3;
   computeCRC = true;                 // ← client/server asset validation

   canObserve = true;
   cmdCategory = "Clients";
   cmdIcon = CMDPlayerIcon;
   cmdMiniIconName = "commander/MiniIcons/com_player_grey";

   cameraDefaultFov = 90.0;
   cameraMinFov = 5.0;
   cameraMaxFov = 120.0;

   debrisShapeName = "debris_player.dts";
   debris = playerDebris;

   aiAvoidThis = true;

   minLookAngle = -1.5;
   maxLookAngle = 1.5;
   maxFreelookAngle = 3.0;
```

`className = Armor` is what makes `%obj.getDataBlock().className $= Armor` tests throughout the shipped
code work — weapons only mount on objects whose datablock says `Armor` **[script]**.

## Movement and physics

This is what people actually change.

```php
   mass = 90;
   drag = 0.275;
   maxdrag = 0.4;
   density = 10;
   maxDamage = 0.66;                  // ← health. Light armor dies at 0.66 damage.
   maxEnergy = 60;
   repairRate = 0.0033;
   energyPerDamagePoint = 75.0;       // shield energy required to block one point of damage

   rechargeRate = 0.256;

   jetForce = 26.21 * 90;             // ← note: multiplied by mass
   underwaterJetForce = 26.21 * 90 * 1.5;
   underwaterVertJetFactor = 1.5;
   jetEnergyDrain = 0.8;
   underwaterJetEnergyDrain = 0.6;
   minJetEnergy = 1;
   maxJetHorizontalPercentage = 0.8;

   runForce = 55.20 * 90;
   runEnergyDrain = 0;
   minRunEnergy = 0;
   maxForwardSpeed = 15;
   maxBackwardSpeed = 13;
   maxSideSpeed = 13;

   maxUnderwaterForwardSpeed = 11;
   maxUnderwaterBackwardSpeed = 10;
   maxUnderwaterSideSpeed = 10;

   jumpForce = 8.3 * 90;
   jumpEnergyDrain = 0;
   minJumpEnergy = 0;
   jumpDelay = 0;

   recoverDelay = 9;
   recoverRunForceScale = 1.2;

   minImpactSpeed = 45;               // ← below this, falling does no damage
   speedDamageScale = 0.004;
```

The `* 90` idiom is Sierra writing force as *acceleration × mass* so the numbers stay comparable when the
armor's mass changes. Keep it if you derive an armor with a different mass.

### The skiing and momentum fields

```php
   // Controls over slope of runnable/jumpable surfaces
   runSurfaceAngle  = 70;
   jumpSurfaceAngle = 80;

   minJumpSpeed = 20;
   maxJumpSpeed = 30;

   // noFrictionOnSki is not set by any base armor — shown below for clarity
   horizMaxSpeed     = 68;
   horizResistSpeed  = 33;
   horizResistFactor = 0.35;
   maxJetForwardSpeed = 30;

   upMaxSpeed     = 80;
   upResistSpeed  = 25;
   upResistFactor = 0.3;
```

These are the numbers that define Tribes movement. `runSurfaceAngle = 70` means the player can run on
slopes up to 70°; beyond that they slide, which is what makes skiing possible in the first place —
identical across every base armor, so all three weights start skiing at the same slope.

Once skiing, three fields govern the ride: `horizResistSpeed` is the speed above which drag starts to
bite; `horizResistFactor` is how hard; `horizMaxSpeed` is the hard cap. `noFrictionOnSki` is a separate
switch — it removes ground friction entirely while skiing, on top of whatever the three fields above are
doing. It is a real, engine-recognised field **[binary]**, but no base armor assigns it a value; base
skiing runs on whatever the compiled-in default is, and this handbook has not verified that default from
source. Treat it as a field that exists purely for a mod to opt into.

**Raise `horizMaxSpeed`, zero `horizResistFactor`, and set `noFrictionOnSki = true`, and you get the
"fast" feel that most speed-focused community mods went for** — this is not hypothetical. Classic does
exactly this, on every armor, and the resulting numbers are fully documented in
[22 · Classic 1.1](../22-classic-1-1/README.md#the-physics-change-skiing-friction-and-momentum) as a
worked, field-by-field example of retuning this exact system.

### Heat signature

```php
   // heat inc'ers and dec'ers
   heatDecayPerSec    = 1.0 / 4.0;   // takes 4 seconds to clear heat sig.
   heatIncreasePerSec = 1.0 / 3.0;   // takes 3.0 seconds of constant jet to get full heat sig.
```

This is what missiles lock onto. A stealth armor lowers `heatIncreasePerSec` and raises
`heatDecayPerSec`.

## Damage locations

```php
   boundingBox = "1.2 1.2 2.3";
   pickupRadius = 0.75;

   // damage location details
   boxNormalHeadPercentage       = 0.83;
   boxNormalTorsoPercentage      = 0.49;
   boxHeadLeftPercentage         = 0;
   boxHeadRightPercentage        = 1;
   boxHeadBackPercentage         = 0;
   boxHeadFrontPercentage        = 1;
```

The bounding box is divided by these fractions into head / torso / legs regions. `getDamageLocation()`
returns which was hit — the sniper rifle uses it for headshots **[script]**. If you change
`boundingBox`, revisit these.

## Inventory limits

```php
   maxWeapons  = 3;    // Max number of different weapons the player can have
   maxGrenades = 1;    // Max number of different grenades the player can have
   maxMines    = 1;    // Max number of different mines the player can have

   // Inventory restrictions
   max[RepairKit]           = 1;
   max[Mine]                = 3;
   max[Grenade]             = 5;
   max[Disc]                = 1;
   max[DiscAmmo]            = 15;
   max[Mortar]              = 0;      // ← light armor cannot carry a mortar
   …
```

Covered in full in [Ammo and inventory](ammo-and-inventory.md#carry-limits). The short version: **a new
item needs a `max[]` entry on every armor that may carry it**, and `0` is how restriction is expressed.

## Animation binding

The `.dts` shape has no sequences of its own; `.dsq` files are bound to it by a `TSShapeConstructor`
datablock. `scripts/light_male.cs` is the whole file **[script]**:

```php
datablock TSShapeConstructor(LightMaleDts)
{
   baseShape = "light_male.dts";
   sequence0  = "light_male_root.dsq root";
   sequence1  = "light_male_forward.dsq run";
   sequence2  = "light_male_back.dsq back";
   sequence3  = "light_male_side.dsq side";
   sequence4  = "light_male_lookde.dsq look";
   sequence5  = "light_male_head.dsq head";
   sequence6  = "light_male_fall.dsq fall";
   sequence7  = "light_male_jet.dsq jet";
   sequence8  = "light_male_land.dsq land";
   sequence9  = "light_male_jump.dsq jump";
   sequence10 = "light_male_diehead.dsq death1";
   …
   sequence20 = "light_male_diespin.dsq death11";
   sequence21 = "light_male_idlepda.dsq pda";
   sequence22 = "light_male_looksn.dsq looksn";
   sequence23 = "light_male_lookms.dsq lookms";
   sequence24 = "light_male_scoutroot.dsq scoutroot";
   sequence25 = "light_male_headside.dsq headside";
   sequence26 = "light_male_recoilde.dsq light_recoil";
   sequence27 = "light_male_sitting.dsq sitting";
   sequence28 = "light_male_celsalute.dsq cel1";
   …
   sequence35 = "light_male_celrocky.dsq cel8";
   sequence36 = "light_male_ski.dsq ski";
   sequence37 = "light_male_standjump.dsq standjump";
   sequence38 = "light_male_looknw.dsq looknw";
};
```

Syntax is `sequence<N> = "<file>.dsq <name>";` — the name is what script and the engine reference.

| Sequence name | Used for |
|---|---|
| `root` | Idle |
| `run`, `back`, `side` | Locomotion |
| `look`, `looksn`, `lookms`, `looknw`, `headside` | Arm/aim poses — `setArmThread()` selects these |
| `fall`, `jet`, `land`, `jump`, `standjump`, `ski` | Airborne and skiing |
| `death1` … `death11` | Death animations, chosen by damage location |
| `light_recoil` | Weapon recoil — `stateRecoil[n]` in an image references this |
| `cel1` … `cel8` | Taunts and celebrations |
| `pda`, `sitting`, `scoutroot` | Context poses |

`setArmThread()` is how weapons change the aim pose **[script]**:

```php
function WeaponImage::onMount(%this,%obj,%slot)
{
   …
   if (%this.armthread $= "")
      %obj.setArmThread(look);
   else
      %obj.setArmThread(%this.armThread);
   …
}
```

So an image declaring `armThread = "looksn";` gives the sniper stance. Any name from the shape
constructor works.

## Sounds and effects

`PlayerData` carries a large block of surface-dependent footstep and impact sounds:

```php
   LFootSoftSound  = LFootLightSoftSound;    RFootSoftSound  = RFootLightSoftSound;
   LFootHardSound  = LFootLightHardSound;    RFootHardSound  = RFootLightHardSound;
   LFootMetalSound = LFootLightMetalSound;   RFootMetalSound = RFootLightMetalSound;
   LFootSnowSound  = LFootLightSnowSound;    RFootSnowSound  = RFootLightSnowSound;
   LFootShallowSound / RFootShallowSound / LFootWadingSound / RFootWadingSound
   LFootUnderwaterSound / RFootUnderwaterSound / LFootBubblesSound / RFootBubblesSound
   movingBubblesSound = ArmorMoveBubblesSound;
   waterBreathSound   = WaterBreathMaleSound;

   impactSoftSound / impactHardSound / impactMetalSound / impactSnowSound
   skiSoftSound / skiHardSound / skiMetalSound / skiSnowSound
   impactWaterEasy / impactWaterMedium / impactWaterHard
   exitingWater = ExitingWaterLightSound;
```

plus jet, footprint, dust, and splash effects:

```php
   jetSound   = ArmorJetSound;
   wetJetSound = ArmorJetSound;
   jetEmitter = HumanArmorJetEmitter;
   jetEffect  = HumanArmorJetEffect;

   decalData   = LightMaleFootprint;
   decalOffset = 0.25;

   footPuffEmitter  = LightPuffEmitter;
   footPuffNumParts = 15;
   footPuffRadius   = 0.25;

   dustEmitter = LiftoffDustEmitter;

   splash = PlayerSplash;
   splashVelocity = 4.0;
   splashAngle = 67.0;
   splashFreqMod = 300.0;
   splashVelEpsilon = 0.60;
   bubbleEmitTime = 0.4;
   splashEmitter[0] = PlayerFoamDropletsEmitter;
   splashEmitter[1] = PlayerFoamEmitter;
   splashEmitter[2] = PlayerBubbleEmitter;

   groundImpactMinSpeed      = 10.0;
   groundImpactShakeFreq     = "4.0 4.0 4.0";
   groundImpactShakeAmp      = "1.0 1.0 1.0";
   groundImpactShakeDuration = 0.8;
   groundImpactShakeFalloff  = 10.0;
```

Inheriting an armor gets all of these for free. That is the argument for inheritance in one paragraph.

## HUD icons

```php
   hudImageNameFriendly[0] = "gui/hud_playertriangle";
   hudImageNameEnemy[0]    = "gui/hud_playertriangle_enemy";
   hudRenderModulated[0]   = true;

   hudImageNameFriendly[1] = "commander/MiniIcons/com_flag_grey";
   hudImageNameEnemy[1]    = "commander/MiniIcons/com_flag_grey";
   hudRenderModulated[1]   = true;
   hudRenderAlways[1]      = true;
   hudRenderCenter[1]      = true;
   hudRenderDistance[1]    = true;
```

Slot 0 is the player marker; slots 1 and 2 are the flag-carrier indicators. See [HUD](../04-interface/hud.md).

## Recipe: a scout armor

`MyMod/scripts/scoutArmor.cs`:

```php
//------------------------------------------------------------------------------
// MyMod — Scout Armor: faster and quieter than light, but fragile and lightly armed
//------------------------------------------------------------------------------

datablock PlayerData(ScoutMaleArmor) : LightMaleHumanArmor
{
   // Fragile
   maxDamage = 0.50;
   maxEnergy = 55;

   // Fast on the ground and in the air
   runForce           = 62.00 * 78;
   maxForwardSpeed    = 18;
   maxBackwardSpeed   = 15;
   maxSideSpeed       = 15;
   mass               = 78;
   jetForce           = 28.50 * 78;
   maxJetForwardSpeed = 34;
   horizMaxSpeed      = 78;
   horizResistSpeed   = 40;
   horizResistFactor  = 0.30;

   // Low heat signature — hard to lock onto
   heatDecayPerSec    = 1.0 / 2.0;
   heatIncreasePerSec = 1.0 / 6.0;

   // Restricted loadout: two weapons, no heavy ordnance
   maxWeapons = 2;

   max[Mortar]              = 0;
   max[MortarAmmo]          = 0;
   max[MissileLauncher]     = 0;
   max[MissileLauncherAmmo] = 0;
   max[Chaingun]            = 0;
   max[ChaingunAmmo]        = 0;
   max[Disc]                = 1;
   max[DiscAmmo]            = 10;
   max[SniperRifle]         = 1;
   max[Blaster]             = 1;
   max[Grenade]             = 3;
   max[Mine]                = 2;
   max[EnergyPack]          = 1;
   max[CloakingPack]        = 1;
   max[ShieldPack]          = 0;
   max[AmmoPack]            = 0;
};

function ScoutMaleArmor::stationSetInv(%data, %player)
{
   %saveImage = %player.getMountedImage($WeaponSlot);

   %player.clearInventory();
   %player.client.setWeaponsHudClearAll();

   %player.setInventory(RepairKit, 1);
   %player.setInventory(Grenade, 3);
   %player.setInventory(Blaster, 1);
   %player.setInventory(Disc, 1);
   %player.setInventory(DiscAmmo, 10);
   %player.setInventory(EnergyPack, 1);

   %player.use(%saveImage.Item);
}
```

Everything not named — the shape, all the sounds, the animation binding, the damage locations, the
remaining `max[]` entries — is inherited from `LightMaleHumanArmor`.

To make the armor selectable at an inventory station you must also register it in the station's armor
list; see [Turrets and deployables](turrets-and-deployables.md) for the station code and
[Gametypes](../05-gameplay-systems/gametypes.md) for spawn-armor selection.

## Per-object versus per-datablock

**A datablock field is shared by every player wearing that armor.** Writing `LightMaleHumanArmor.runForce`
from a pack or a power-up changes it for everyone.

Per-player changes go through object setters:

| Setter | Changes |
|---|---|
| `%obj.setRechargeRate(%r)` | Energy recharge |
| `%obj.setEnergyLevel(%e)` | Current energy |
| `%obj.setCloaked(%bool)` | Cloak |
| `%obj.setInvincible(%bool)`, `%obj.setInvincibleMode(%a, %b)` | Invincibility |
| `%obj.setArmThread(%name)` | Arm animation |
| `%obj.setImageTrigger(%slot, %bool)` | Image trigger |
| `%obj.applyImpulse(%pos, %vec)` | Physics impulse |
| `%obj.setVelocity(%vec)` | Velocity |
| `%obj.setDamageLevel(%d)`, `%obj.setDamageState(%s)` | Health |

The shipped packs use exactly these. See [Packs](packs.md).

## Related

- [Ammo and inventory](ammo-and-inventory.md) — `max[]` limits and loadouts
- [Packs](packs.md) — per-object modification patterns
- [Damage and type masks](damage-and-typemasks.md) — the `*PlayerDamageProfile` parents
- [Audio](audio.md) — the footstep and impact sound profiles
- [08 · The base ruleset](../08-base-ruleset/README.md#skiing-friction-and-momentum) — the values base ships, all three weights
- [22 · Classic 1.1](../22-classic-1-1/README.md#the-physics-change-skiing-friction-and-momentum) — this system, retuned, field by field

> **On a patched install:** nothing on this page changes. Neither TribesNEXT patch touches gameplay
> content — see [03 · Content Recipes](README.md#under-the-community-patches).
