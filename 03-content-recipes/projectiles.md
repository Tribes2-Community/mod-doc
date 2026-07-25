# Projectiles

Ten projectile datablock types ship with Tribes 2. Each maps to a C++ class with its own flight model,
rendering, and collision behaviour. You cannot add a new type — that would need engine changes — so
building a new weapon means picking the closest existing type and tuning it.

## The type hierarchy

`scripts/projectiles.cs` documents it in a header comment **[script]**:

```
ProjectileData            : GameBaseData
LinearProjectileData      : ProjectileData
LinearFlareProjectileData : LinearProjectileData
GrenadeProjectileData     : ProjectileData
SeekerProjectileData      : ProjectileData
SniperProjectileData      : ProjectileData
```

The remaining four — `EnergyProjectileData`, `TracerProjectileData`, `ELFProjectileData`,
`TargetProjectileData`, `ShockLanceProjectileData` — are not listed in that comment but exist in the
shipped weapon files.

> That same header claims the file contains illustrative default-value datablocks. **It does not** — the
> blocks were removed at some point before release and only the functions remain. The real reference is
> the weapon files, reproduced below.

**`ProjectileData` itself is abstract** — the comment says so explicitly: *"ProjectileData cannot be used
as a concrete datablock type."*

## Choosing a type

| Type | Used by | Flight | Pick it for |
|---|---|---|---|
| `EnergyProjectileData` | Blaster | Bounces off surfaces, gravity-affected via `gravityMod`, motion-blurred billboard | Bouncing energy shots |
| `LinearProjectileData` | Spinfusor | Straight line, constant speed, uses a `.dts` shape | Dumbfire rockets, discs, thrown shapes |
| `LinearFlareProjectileData` | Plasma gun | Linear, rendered as a flare sprite cluster | Glowing bolts without a model |
| `GrenadeProjectileData` | Grenade launcher, mortar | Ballistic arc, bounces, arming delay | Anything that lobs |
| `SeekerProjectileData` | Missile launcher | Homing with turn rate and terrain avoidance | Guided missiles |
| `TracerProjectileData` | Chaingun | Very fast, tracer-rendered, leaves decals | Bullets |
| `SniperProjectileData` | Sniper rifle | Instant beam with range limit and headshot multiplier | Hitscan beams |
| `TargetProjectileData` | Targeting laser | Persistent beam, marks targets | Designators |
| `ELFProjectileData` | ELF gun | Sustained lightning beam, drains energy | Continuous-effect beams |
| `ShockLanceProjectileData` | Shock lance | Very short range, rear-hit multiplier | Melee-range weapons |

## Fields shared by most types

| Field | Meaning |
|---|---|
| `projectileShapeName` | `.dts` model. Not used by flare/tracer/beam types. |
| `directDamage` | Damage on a direct hit |
| `directDamageType` | `$DamageType::` constant for direct hits |
| `hasDamageRadius` | Enables splash damage |
| `indirectDamage` | Maximum splash damage at the centre |
| `damageRadius` | Splash radius in metres |
| `radiusDamageType` | `$DamageType::` constant for splash |
| `kickBackStrength` | Impulse applied to hit objects — this is what makes disc jumping work |
| `explosion` | `ExplosionData` on detonation |
| `underwaterExplosion` | Alternate `ExplosionData` underwater |
| `splash` | `SplashData` on water entry |
| `sound` | Looping `AudioProfile` while in flight |
| `velInheritFactor` | Fraction of the shooter's velocity added. `0.5` is typical; missiles use `1.0`. |
| `lifetimeMS` | Maximum flight time |
| `fizzleTimeMS` | Time before it fizzles out |
| `explodeOnDeath` | Detonate when lifetime expires |
| `hasLight`, `lightRadius`, `lightColor` | Dynamic light while in flight |
| `scale` | Model scale, `"x y z"` |
| `emitterDelay` | Delay before trail emitters start. `-1` disables. |
| `baseEmitter`, `bubbleEmitter`, `delayEmitter`, `puffEmitter` | Trail particle emitters |
| `dryVelocity`, `wetVelocity` | Speed in air and in water |
| `reflectOnWaterImpactAngle` | Skip angle in degrees |
| `explodeOnWaterImpact` | Detonate at the surface |
| `deflectionOnWaterImpact` | Deflection amount |
| `fizzleUnderwaterMS` | Underwater lifetime |
| `activateDelayMS` | Arming delay before it can hurt anything |

## Reference: every shipped projectile

### `LinearProjectileData` — spinfusor

```php
datablock LinearProjectileData(DiscProjectile)
{
   projectileShapeName = "disc.dts";
   emitterDelay        = -1;
   directDamage        = 0.0;
   hasDamageRadius     = true;
   indirectDamage      = 0.50;
   damageRadius        = 7.5;
   radiusDamageType    = $DamageType::Disc;
   kickBackStrength    = 1750;

   sound               = discProjectileSound;
   explosion           = "DiscExplosion";
   underwaterExplosion = "UnderwaterDiscExplosion";
   splash              = DiscSplash;

   dryVelocity       = 90;
   wetVelocity       = 50;
   velInheritFactor  = 0.5;
   fizzleTimeMS      = 5000;
   lifetimeMS        = 5000;
   explodeOnDeath    = true;
   reflectOnWaterImpactAngle = 15.0;
   explodeOnWaterImpact      = true;
   deflectionOnWaterImpact   = 0.0;
   fizzleUnderwaterMS        = 5000;

   activateDelayMS = 200;

   hasLight    = true;
   lightRadius = 6.0;
   lightColor  = "0.175 0.175 0.5";
};
```

The spinfusor does **zero direct damage** — all 0.50 of its damage is splash. This is why point-blank
discs and near-misses do the same damage, and why disc jumping works at all.

### `EnergyProjectileData` — blaster

```php
datablock EnergyProjectileData(EnergyBolt)
{
   emitterDelay        = -1;
   directDamage        = 0.15;
   directDamageType    = $DamageType::Blaster;
   kickBackStrength    = 0.0;
   bubbleEmitTime      = 1.0;

   sound = BlasterProjectileSound;
   velInheritFactor    = 0.5;

   explosion           = "BlasterExplosion";
   splash              = BlasterSplash;

   grenadeElasticity = 0.998;      // ← bounce: 0.998 is almost lossless
   grenadeFriction   = 0.0;
   armingDelayMS     = 500;

   muzzleVelocity    = 90.0;
   drag              = 0.05;
   gravityMod        = 0.0;        // ← raise this and the bolt arcs

   dryVelocity       = 200.0;
   wetVelocity       = 150.0;

   reflectOnWaterImpactAngle = 0.0;
   explodeOnWaterImpact      = false;
   deflectionOnWaterImpact   = 0.0;
   fizzleUnderwaterMS        = 3000;

   hasLight    = true;
   lightRadius = 3.0;
   lightColor  = "0.5 0.175 0.175";

   scale        = "0.25 20.0 1.0";
   crossViewAng = 0.99;
   crossSize    = 0.55;

   lifetimeMS   = 3000;
   blurLifetime = 0.2;
   blurWidth    = 0.25;
   blurColor    = "0.4 0.0 0.0 1.0";

   texture[0] = "special/blasterBolt";
   texture[1] = "special/blasterBoltCross";
};
```

The community documentation is right about this one **[community]**: `gravityMod` turns the blaster bolt
into a grenade, and it bounces further the faster it travels. It can take a `.dts` shape, but the shape
renders distorted because the projectile is scaled non-uniformly (`scale = "0.25 20.0 1.0"`) for the
bolt-streak effect.

### `LinearFlareProjectileData` — plasma

```php
datablock LinearFlareProjectileData(PlasmaBolt)
{
   projectileShapeName = "plasmabolt.dts";
   scale               = "2.0 2.0 2.0";
   faceViewer          = true;
   directDamage        = 0.0;
   hasDamageRadius     = true;
   indirectDamage      = 0.45;
   damageRadius        = 4.0;
   kickBackStrength    = 0.0;
   radiusDamageType    = $DamageType::Plasma;

   explosion = "PlasmaBoltExplosion";
   splash    = PlasmaSplash;

   dryVelocity      = 55.0;
   wetVelocity      = -1;          // ← -1 = cannot travel underwater
   velInheritFactor = 0.3;
   fizzleTimeMS     = 2000;
   lifetimeMS       = 3000;
   explodeOnDeath   = false;

   size[0] = 0.2;  size[1] = 0.5;  size[2] = 0.1;

   numFlares        = 35;
   flareColor       = "1 0.75 0.25";
   flareModTexture  = "flaremod";
   flareBaseTexture = "flarebase";

   sound        = PlasmaProjectileSound;
   fireSound    = PlasmaFireSound;
   wetFireSound = PlasmaFireWetSound;

   hasLight    = true;
   lightRadius = 3.0;
   lightColor  = "1 0.75 0.25";
};
```

`flareColor` only takes effect when no shape is used. `numFlares` is the sprite count in the cluster.

### `GrenadeProjectileData` — grenade launcher

```php
datablock GrenadeProjectileData(BasicGrenade)
{
   projectileShapeName = "grenade_projectile.dts";
   emitterDelay        = -1;
   directDamage        = 0.0;
   hasDamageRadius     = true;
   indirectDamage      = 0.40;
   damageRadius        = 15.0;
   radiusDamageType    = $DamageType::Grenade;
   kickBackStrength    = 1500;
   bubbleEmitTime      = 1.0;

   sound               = GrenadeProjectileSound;
   explosion           = "GrenadeExplosion";
   underwaterExplosion = "UnderwaterGrenadeExplosion";
   velInheritFactor    = 0.5;
   splash              = GrenadeSplash;

   baseEmitter   = GrenadeSmokeEmitter;
   bubbleEmitter = GrenadeBubbleEmitter;

   grenadeElasticity = 0.35;      // ← bounce
   grenadeFriction   = 0.2;       // ← roll
   armingDelayMS     = 1000;      // ← cannot detonate before this
   muzzleVelocity    = 47.00;
   drag              = 0.1;
};
```

The mortar (`MortarShot`) is the same type with different numbers.

### `SeekerProjectileData` — missile launcher

```php
datablock SeekerProjectileData(ShoulderMissile)
{
   casingShapeName     = "weapon_missile_casement.dts";
   projectileShapeName = "weapon_missile_projectile.dts";
   hasDamageRadius     = true;
   indirectDamage      = 0.8;
   damageRadius        = 8.0;
   radiusDamageType    = $DamageType::Missile;
   kickBackStrength    = 2000;

   explosion        = "MissileExplosion";
   splash           = MissileSplash;
   velInheritFactor = 1.0;

   baseEmitter    = MissileSmokeEmitter;
   delayEmitter   = MissileFireEmitter;
   puffEmitter    = MissilePuffEmitter;
   bubbleEmitter  = GrenadeBubbleEmitter;
   bubbleEmitTime = 1.0;

   exhaustEmitter  = MissileLauncherExhaustEmitter;
   exhaustTimeMs   = 300;
   exhaustNodeName = "muzzlePoint1";

   lifetimeMS     = 6000;
   muzzleVelocity = 10.0;      // ← slow launch, then accelerates
   maxVelocity    = 80.0;
   turningSpeed   = 110.0;     // ← degrees/sec — the key homing tuning value
   acceleration   = 200.0;

   proximityRadius = 3;        // ← detonate within this distance of the target

   terrainAvoidanceSpeed  = 180;
   terrainScanAhead       = 25;
   terrainHeightFail      = 12;
   terrainAvoidanceRadius = 100;

   flareDistance = 200;        // ← flare countermeasure decoy range
   flareAngle    = 30;

   sound = MissileProjectileSound;

   hasLight    = true;
   lightRadius = 5.0;
   lightColor  = "0.2 0.05 0";

   useFlechette     = true;
   flechetteDelayMs = 550;
   casingDeb        = FlechetteDebris;

   explodeOnWaterImpact = false;
};
```

The `velInheritFactor = 1.0` carries a comment explaining itself **[script]**: *"to compensate for slow
starting velocity, this value is cranked up to full so the missile doesn't start out behind the player
when the player is moving very quickly."*

Guidance is script-driven — see [Weapons](weapons.md#what-happens-on-fire) for `MissileLauncherImage::onFire`
calling `setObjectTarget` / `setPositionTarget` / `setNoTarget`.

### `TracerProjectileData` — chaingun

```php
datablock TracerProjectileData(ChaingunBullet)
{
   doDynamicClientHits = true;    // ← client-side hit prediction

   directDamage     = 0.0825;
   directDamageType = $DamageType::Bullet;
   explosion        = "ChaingunExplosion";
   splash           = ChaingunSplash;

   kickBackStrength = 0.0;
   sound            = ChaingunProjectile;

   dryVelocity      = 425.0;
   wetVelocity      = 100.0;
   velInheritFactor = 1.0;
   fizzleTimeMS     = 3000;
   lifetimeMS       = 3000;
   explodeOnDeath   = false;

   tracerLength    = 15.0;
   tracerAlpha     = false;
   tracerMinPixels = 6;
   tracerColor     = 211.0/255.0 @ " " @ 215.0/255.0 @ " " @ 120.0/255.0 @ " 0.75";
   tracerTex[0]    = "special/tracer00";
   tracerTex[1]    = "special/tracercross";
   tracerWidth     = 0.10;
   crossSize       = 0.20;
   crossViewAng    = 0.990;
   renderCross     = true;

   decalData[0] = ChaingunDecal1;
   … decalData[5] = ChaingunDecal6;
};
```

Note `tracerColor` built with arithmetic and `@` concatenation — a legitimate way to write colours as
0–255 values.

### `SniperProjectileData` — sniper rifle

```php
datablock SniperProjectileData(BasicSniperShot)
{
   directDamage     = 0.4;
   hasDamageRadius  = false;
   velInheritFactor = 1.0;
   sound            = SniperRifleProjectileSound;
   explosion        = "SniperExplosion";
   splash           = SniperSplash;
   directDamageType = $DamageType::Laser;

   maxRifleRange       = 1000;
   rifleHeadMultiplier = 1.3;      // ← headshot multiplier
   beamColor           = "1 0.1 0.1";
   fadeTime            = 1.0;

   startBeamWidth = 0.145;
   endBeamWidth   = 0.25;
   pulseBeamWidth = 0.5;
   beamFlareAngle = 3.0;
   minFlareSize   = 0.0;
   maxFlareSize   = 400.0;
   pulseSpeed     = 6.0;
   pulseLength    = 0.150;

   lightRadius = 1.0;
   lightColor  = "0.3 0.0 0.0";

   textureName[0…11] = "special/flare", "special/nonlingradient",
                       "special/laserrip01" … "special/laserrip09", "special/sniper00";
};
```

Headshots are implemented in `SniperProjectileData::onCollision` **[script]**:

```php
if(%targetObject.getDataBlock().getClassName() $= "PlayerData")
{
   %damLoc = firstWord(%targetObject.getDamageLocation(%position));
   if(%damLoc $= "head")
   {
      %targetObject.getOwnerClient().headShot = 1;
      %modifier = %data.rifleHeadMultiplier;
   }
   else
   {
      %modifier = 1;
      %targetObject.getOwnerClient().headShot = 0;
   }
}
```

`getDamageLocation()` is the general hit-location API — usable by any weapon mod that wants location
sensitivity.

> `$DamageType::Laser = 6` carries the comment *"This value is referenced directly in code. DO NOT CHANGE!"*
> **[script]**. Take it seriously.

### `ELFProjectileData` — ELF gun

```php
datablock ELFProjectileData(BasicELF)
{
   beamRange         = 30;
   numControlPoints  = 8;
   restorativeFactor = 3.75;
   dragFactor        = 4.5;
   endFactor         = 2.25;
   randForceFactor   = 2;
   randForceTime     = 0.125;
   drainEnergy       = 1.0;      // ← energy drained per tick
   drainHealth       = 0.0;      // ← damage once the target is out of energy
   directDamageType  = $DamageType::ELF;
   mainBeamWidth     = 0.1;      // width of blue wave beam
   mainBeamSpeed     = 9.0;      // speed that the beam travels forward
   mainBeamRepeat    = 0.25;     // number of times the texture repeats
   lightningWidth    = 0.1;
   lightningDist     = 0.15;     // distance of lightning from main beam

   fireSound    = ElfGunFireSound;
   wetFireSound = ElfFireWetSound;

   textures[0] = "special/ELFBeam";
   textures[1] = "special/ELFLightning";
   textures[2] = "special/BlueImpact";

   emitter = ELFSparksEmitter;
};
```

`restorativeFactor`, `dragFactor`, `endFactor`, `randForceFactor`, `randForceTime` control the beam's
rope-like visual simulation across its `numControlPoints`. **[inferred]** — the names and the presence of
`numControlPoints` imply a spring/damper chain, but the engine code has not been traced. The 2002 tutorial
corpus admits the same ignorance **[community]**.

The behaviour that matters is in script and is fully readable **[script]**: `ELFProjectileData::zapTarget`
subtracts `drainEnergy` from the target's recharge rate, and `ELFProjectile::checkELFStatus` reschedules
itself every 32 ms, applying `drainHealth` as damage once the target's energy hits zero.

```php
%enLevel = %target.getEnergyLevel();
if(%enLevel < 1.0)
   %dataBlock.damageObject(%target, %this.sourceObject, %target.getPosition(),
                           %data.drainHealth, %data.directDamageType);
else
   %target.playShieldEffect( %normal );

%this.ELFrecur = %this.schedule(32, checkELFStatus, %data, %target, %targeter);
```

`drainHealth = 1.0` kills instantly on energy depletion **[community]** — the shipped value is `0.0`.

The zap also respects friendly fire **[script]**:

```php
%teammates = %target.client.team == %targeter.client.team;
if( %target.teamDamageStateOnZap || !%teammates )
   %target.setRechargeRate(%oldERate - %data.drainEnergy);
```

### `TargetProjectileData` — targeting laser

```php
datablock TargetProjectileData(BasicTargeter)
{
   directDamage    = 0.0;
   hasDamageRadius = false;
   maxRifleRange   = 1000;
   beamColor       = "0.1 1.0 0.1";
   startBeamWidth  = 0.20;
   pulseBeamWidth  = 0.15;
   beamFlareAngle  = 3.0;
   minFlareSize    = 0.0;
   maxFlareSize    = 400.0;
   pulseSpeed      = 6.0;
   pulseLength     = 0.150;
   textureName[0…3] = "special/nonlingradient", "special/flare",
                      "special/pulse", "special/expFlare";
   beacon          = true;      // ← marks the target for missile lock
};
```

### `ShockLanceProjectileData` — shock lance

```php
datablock ShockLanceProjectileData(BasicShocker)
{
   directDamage     = 0.45;
   radiusDamageType = $DamageType::ShockLance;
   kickBackStrength = 2500;
   velInheritFactor = 0;

   zapDuration      = 1.0;
   impulse          = 1800;
   boltLength       = 14.0;
   extension        = 14.0;   // script variable indicating distance you can shock people from
   lightningFreq    = 25.0;
   lightningDensity = 3.0;
   lightningAmp     = 0.25;
   lightningWidth   = 0.05;

   shockwave = ShocklanceHit;

   boltSpeed[0] = 2.0;   boltSpeed[1] = -0.5;
   texWrap[0]   = 1.5;   texWrap[1]   = 1.5;
   startWidth[0] = 0.3;  endWidth[0]  = 0.6;
   startWidth[1] = 0.3;  endWidth[1]  = 0.6;

   texture[0…3] = "special/shockLightning01" … "special/ELFBeam";
   emitter[0]   = ShockParticleEmitter;
};
```

The rear-hit bonus is script, in `ShockLanceImage::onFire` **[script]** — a 120° cone test behind the
target, `%damageMultiplier = 3.0` on success:

```php
// 120 Deg angle test...
// 1.05 == 60 degrees in radians
if (%dot >= mCos(1.05)) {
   // Rear hit
   %damageMultiplier = 3.0;
}
```

## Collision and explosion callbacks

Two functions do all the damage work, both in `scripts/projectiles.cs` **[script]**:

```php
function ProjectileData::onCollision(%data, %projectile, %targetObject, %modifier, %position, %normal)
{
   %targetObject.damage(%projectile.sourceObject, %position,
                        %data.directDamage * %modifier, %data.directDamageType);
}

function ProjectileData::onExplode(%data, %proj, %pos, %mod)
{
   if (%data.hasDamageRadius)
      RadiusExplosion(%proj, %pos, %data.damageRadius, %data.indirectDamage,
                      %data.kickBackStrength, %proj.sourceObject, %data.radiusDamageType);
}
```

Override either in a package to change hit behaviour globally, or define a
`<YourProjectileDatablock>::onCollision` for one projectile only. `RadiusExplosion` is documented in
[Damage and type masks](damage-and-typemasks.md).

## Related

- [Weapons](weapons.md) — the image that fires these
- [Damage and type masks](damage-and-typemasks.md) — `$DamageType::`, `RadiusExplosion`, falloff
- [Particles, explosions, and effects](particles-explosions-effects.md) — `ExplosionData` and `SplashData`
- [Audio](audio.md) — the `sound` / `fireSound` fields

> **On a patched install:** nothing on this page changes. Neither TribesNEXT patch touches gameplay
> content — see [03 · Content Recipes](README.md#under-the-community-patches).
