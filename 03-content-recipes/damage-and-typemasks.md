# Damage and type masks

Two orthogonal systems that show up in every gameplay mod: **damage types**, which classify what hurt you
and by how much, and **type masks**, which classify what an object *is* for collision and search purposes.

## Damage types

`scripts/damageTypes.cs` defines the complete set **[script]**:

```php
$DamageType::Default          = 0;
$DamageType::Blaster          = 1;
$DamageType::Plasma           = 2;
$DamageType::Bullet           = 3;
$DamageType::Disc             = 4;
$DamageType::Grenade          = 5;
$DamageType::Laser            = 6;    // NOTE: This value is referenced directly in code.  DO NOT CHANGE!
$DamageType::ELF              = 7;
$DamageType::Mortar           = 8;
$DamageType::Missile          = 9;
$DamageType::ShockLance       = 10;
$DamageType::Mine             = 11;
$DamageType::Explosion        = 12;
$DamageType::Impact           = 13;   // Object to object collisions
$DamageType::Ground           = 14;   // Object to ground collisions
$DamageType::Turret           = 15;

$DamageType::PlasmaTurret     = 16;
$DamageType::AATurret         = 17;
$DamageType::ElfTurret        = 18;
$DamageType::MortarTurret     = 19;
$DamageType::MissileTurret    = 20;
$DamageType::IndoorDepTurret  = 21;
$DamageType::OutdoorDepTurret = 22;
$DamageType::SentryTurret     = 23;

$DamageType::OutOfBounds      = 24;
$DamageType::Lava             = 25;

$DamageType::ShrikeBlaster    = 26;
$DamageType::BellyTurret      = 27;
$DamageType::BomberBombs      = 28;
$DamageType::TankChaingun     = 29;
$DamageType::TankMortar       = 30;
$DamageType::SatchelCharge    = 31;
$DamageType::MPBMissile       = 32;
$DamageType::Lightning        = 33;
$DamageType::VehicleSpawn     = 34;
$DamageType::ForceFieldPowerup = 35;
$DamageType::Crash            = 36;

// DMM -- added so MPBs that blow up under water get a message
$DamageType::Water            = 97;

//Tinman - used in Hunters for cheap bastards  ;)
$DamageType::NexusCamping     = 98;

// MES -- added so CTRL-K can get a distinctive message
$DamageType::Suicide          = 99;
```

Each has a display string:

```php
$DamageTypeText[0]  = 'default';
$DamageTypeText[1]  = 'blaster';
$DamageTypeText[3]  = 'chaingun';
$DamageTypeText[4]  = 'disc';
$DamageTypeText[21] = 'clamp turret';
$DamageTypeText[22] = 'spike turret';
…
```

Note the tagged-string quoting — these cross the network to build kill messages. See
[TorqueScript](../02-engine-model/torquescript.md#tagged-strings).

### Adding your own

Pick a number in a free range. The shipped set uses `0`–`36` and then `97`–`99`, so `37`–`96` is
available:

```php
$DamageType::MyModPlasmaTorch = 50;
$DamageTypeText[50] = 'plasma torch';
```

**`$DamageType::Laser = 6` must not change** — the engine references the constant directly **[script]**.
Do not renumber the existing set.

## Damage profiles — per-target scaling

The most important balance mechanism in the game, and the one least described by the tutorial corpus.

Every armor, vehicle, turret, and static shape inherits from a `SimDataBlock` holding two tables
**[script]**:

| Table | Applied to |
|---|---|
| `damageScale[$DamageType::X]` | Damage to health |
| `shieldDamageScale[$DamageType::X]` | Damage to shields |

From `ShrikeDamageProfile` **[script]**:

```php
datablock SimDataBlock(ShrikeDamageProfile)
{
   shieldDamageScale[$DamageType::Blaster]          = 1.75;
   shieldDamageScale[$DamageType::Bullet]           = 1.75;
   shieldDamageScale[$DamageType::ELF]              = 1.0;
   shieldDamageScale[$DamageType::ShockLance]       = 0.5;
   shieldDamageScale[$DamageType::ShrikeBlaster]    = 4.0;
   shieldDamageScale[$DamageType::AATurret]         = 3.0;
   shieldDamageScale[$DamageType::Mine]             = 3.0;
   shieldDamageScale[$DamageType::Missile]          = 3.0;
   shieldDamageScale[$DamageType::SatchelCharge]    = 3.5;
   shieldDamageScale[$DamageType::Lightning]        = 10.0;
   …

   damageScale[$DamageType::Blaster]                = 1.0;
   damageScale[$DamageType::ELF]                    = 0.0;    // ← ELF does no health damage to a Shrike
   damageScale[$DamageType::ShockLance]             = 0.50;
   damageScale[$DamageType::ShrikeBlaster]          = 3.5;
   damageScale[$DamageType::Mine]                   = 4.0;    // ← mines shred aircraft
   damageScale[$DamageType::Missile]                = 2.0;
   damageScale[$DamageType::Plasma]                 = 0.5;
   damageScale[$DamageType::Lightning]              = 10.0;
   …
};
```

This is where "mines are devastating to vehicles" and "plasma is weak against aircraft" actually live —
not in the weapon datablocks. **If your weapon feels wrong against one target class, the fix is usually a
damage-profile entry, not a change to the weapon.**

The file carries an explicit ordering instruction **[script]**:

```
// ##### PLEASE DO NOT REORDER THE DAMAGE PROFILE TABLES BELOW #####
// (They are set up in the same order as the "Weapons Matrix.xls" sheet for ease of
//  reference when balancing)
```

The spreadsheet is lost, but the convention is worth keeping — every profile lists damage types in the
same order, which makes them diff-able against each other.

### The profiles

| Profile | Used by |
|---|---|
| `LightPlayerDamageProfile`, `MediumPlayerDamageProfile`, `HeavyPlayerDamageProfile` | The three armors |
| `ShrikeDamageProfile`, `BomberDamageProfile`, `HavocDamageProfile`, `WildcatDamageProfile`, `TankDamageProfile`, `MPBDamageProfile` | The six vehicles |
| `TurretDamageProfile` | Turret bases |
| `StaticShapeDamageProfile` | Deployables, generators, stations |

**A new damage type gets a default scale of nothing** — reading an unset array entry returns the empty
string. Add an entry to every profile you care about, or your custom damage type behaves inconsistently
across target classes.

```php
package MyMod
{
   function DefaultGame::missionLoadDone(%game)
   {
      Parent::missionLoadDone(%game);

      LightPlayerDamageProfile.damageScale[$DamageType::MyModPlasmaTorch]  = 1.4;
      MediumPlayerDamageProfile.damageScale[$DamageType::MyModPlasmaTorch] = 1.0;
      HeavyPlayerDamageProfile.damageScale[$DamageType::MyModPlasmaTorch]  = 0.7;
      ShrikeDamageProfile.damageScale[$DamageType::MyModPlasmaTorch]       = 2.0;
      StaticShapeDamageProfile.damageScale[$DamageType::MyModPlasmaTorch]  = 3.0;
   }
};
```

## Radius damage

`RadiusExplosion` in `scripts/projectiles.cs` is the single implementation of splash damage **[script]**.
Every explosive in the game goes through it.

```php
function RadiusExplosion(%explosionSource, %position, %radius, %damage, %impulse,
                         %sourceObject, %damageType)
{
   InitContainerRadiusSearch(%position, %radius, $TypeMasks::PlayerObjectType      |
                                                 $TypeMasks::VehicleObjectType     |
                                                 $TypeMasks::StaticShapeObjectType |
                                                 $TypeMasks::TurretObjectType      |
                                                 $TypeMasks::ItemObjectType);
   …
}
```

### The falloff formula

```php
%coverage = calcExplosionCoverage(%position, %targetObject,
                                  ($TypeMasks::InteriorObjectType |
                                   $TypeMasks::TerrainObjectType |
                                   $TypeMasks::ForceFieldObjectType |
                                   $TypeMasks::VehicleObjectType));
if (%coverage == 0)
   continue;

%amount = (1.0 - ((%dist / %radius) * 0.88)) * %coverage * %damage;
```

Three things fall out of this:

1. **Damage at the edge is 12 % of maximum, not zero.** The `0.88` factor is deliberate — a commented-out
   line right above shows the original linear version **[script]**:
   ```cs
   //%amount = (1.0 - (%dist / %radius)) * %coverage * %damage;
   ```
2. **Cover works.** `calcExplosionCoverage` traces against interiors, terrain, force fields, and vehicles.
   Full cover means `%coverage == 0` and the target is skipped entirely.
3. **Vehicles provide cover.** `$TypeMasks::VehicleObjectType` is in the coverage mask, so standing behind
   a tank protects you.

### Impulse

```php
if (%impulse && %data.shouldApplyImpulse(%targetObject))
{
   %p = %targetObject.getWorldBoxCenter();
   %momVec = VectorSub(%p, %position);
   %momVec = VectorNormalize(%momVec);
   %impulseVec = VectorScale(%momVec, %impulse * (1.0 - (%dist / %radius)));
   %doImpulse = true;
}
```

Impulse falloff **is** linear, unlike damage. `shouldApplyImpulse` is overridable per datablock — the flag
uses it to stay put when at home **[script]**:

```php
function Flag::shouldApplyImpulse(%data, %obj)
{
   if(%obj.isHome)
      return false;
   else
      return true;
}
```

Aircraft get a special case that keeps the impulse from driving them into the ground **[script]**:

```php
else if( %className $= FlyingVehicleData || %className $= HoverVehicleData )
{
   …
   if( getWord( %momVec, 2 ) < -0.5 )
      %momVec = "0 0 1";
   %doImpulse = true;
}
```

The commented-out `WheeledVehicleData` in that condition is a z0dd bug fix **[script]**:

```php
// z0dd - ZOD, 5/8/02. Removed Wheeled Vehicle to eliminate the flying MPB bug
// caused by tossing concussion grenades under a deployed MPB.
```

### Protected mount points

Occupants of a mount point flagged `isProtectedMountPoint[n] = true` are skipped entirely — see
[Vehicles](vehicles.md#mount-points).

## Type masks

Type masks classify objects for collision, container searches, and ray casts. The complete set used by
the shipped scripts **[script]**:

| Mask | Covers |
|---|---|
| `$TypeMasks::PlayerObjectType` | Players |
| `$TypeMasks::VehicleObjectType` | Vehicles |
| `$TypeMasks::ItemObjectType` | Items on the ground |
| `$TypeMasks::StaticShapeObjectType` | Deployables, generators, stations |
| `$TypeMasks::TurretObjectType` | Turrets |
| `$TypeMasks::InteriorObjectType` | `.dif` building interiors |
| `$TypeMasks::TerrainObjectType` | The terrain |
| `$TypeMasks::ForceFieldObjectType` | Force fields |
| `$TypeMasks::StaticObjectType` | Anything static |
| `$TypeMasks::StaticTSObjectType`, `$TypeMasks::TSStaticShapeObjectType` | Static TS shapes |
| `$TypeMasks::MoveableObjectType` | Anything that moves |
| `$TypeMasks::ShapeBaseObjectType` | Any `ShapeBase` |
| `$TypeMasks::GameBaseObjectType` | Any `GameBase` |
| `$TypeMasks::DamagableItemObjectType` | Items that can be shot — mines use this |
| `$TypeMasks::SensorObjectType` | Sensors |
| `$TypeMasks::StationObjectType` | Inventory and vehicle stations |
| `$TypeMasks::GeneratorObjectType` | Generators |

Combine with `|`:

```php
%mask = $TypeMasks::VehicleObjectType     | $TypeMasks::MoveableObjectType   |
        $TypeMasks::StaticShapeObjectType | $TypeMasks::ForceFieldObjectType |
        $TypeMasks::ItemObjectType        | $TypeMasks::PlayerObjectType     |
        $TypeMasks::TurretObjectType;
```

### `dynamicType` — adding bits to an object

A datablock can add mask bits with `dynamicType`. The deployed mine uses it to become shootable
**[script]**:

```php
datablock ItemData(MineDeployed)
{
   …
   dynamicType = $TypeMasks::DamagableItemObjectType;
};
```

Without that, a mine is an `Item` and nothing targets it.

## The search and cast API

| Call | Purpose |
|---|---|
| `InitContainerRadiusSearch(%pos, %radius, %mask)` | Begin a sphere search |
| `containerSearchNext()` | Next result, `0` when done |
| `containerSearchCurrRadDamageDist()` | Distance of the current result, for falloff |
| `ContainerRayCast(%start, %end, %mask)` | Line trace; returns the object hit, or `0` |
| `calcExplosionCoverage(%pos, %obj, %mask)` | Fraction of the target visible from a point, `0.0`–`1.0` |
| `InitContainerRadiusSearch` + `containerSearchNext` loop | The universal "find nearby things" idiom |

The standard shape:

```php
InitContainerRadiusSearch(%position, %radius, %mask);
while ((%obj = containerSearchNext()) != 0)
{
   %dist = containerSearchCurrRadDamageDist();
   if (%dist > %radius)
      continue;
   …
}
```

**The search is not re-entrant.** Starting a second search inside the loop clobbers the first. If you need
nested processing, collect the results into an array first — which is exactly what `RadiusExplosion` does
**[script]**:

```php
%targets[%numTargets]     = %targetObject;
%targetDists[%numTargets] = %dist;
%numTargets++;
```

then processes them in a second loop. Copy that pattern.

## Applying damage from script

```php
%targetObject.damage(%sourceObject, %position, %amount, %damageType);

%data.damageObject(%targetObject, %sourceObject, %position, %amount, %damageType,
                   %momVec, %client, %explosionSource);
```

The first is the simple form. The second is the full datablock-level call that `RadiusExplosion` uses and
that damage-profile scaling flows through.

A `SimObject::damageObject` stub exists in `scripts/weapons.cs` purely to suppress console errors on
objects that cannot be damaged **[script]**:

```php
function SimObject::damageObject(%data)
{
   //function was added to reduce console err msg spam
}
```

If your mod damages arbitrary objects, keep that stub in mind — silence there means "not damageable",
not "damaged".

## Related

- [Projectiles](projectiles.md) — where damage types are declared on weapons
- [Armors](armors.md) — the `*PlayerDamageProfile` parents
- [Vehicles](vehicles.md) — `isProtectedMountPoint` and vehicle profiles
- [Gametypes](../05-gameplay-systems/gametypes.md) — `onClientDamaged` and `onClientKilled`

> **On a patched install:** nothing on this page changes. Neither TribesNEXT patch touches gameplay
> content — see [03 · Content Recipes](README.md#under-the-community-patches).
