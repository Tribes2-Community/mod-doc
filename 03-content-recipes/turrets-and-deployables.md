# Turrets and deployables

Two related systems. **Turrets** are a base plus a swappable barrel image. **Deployables** are packs that
place a `StaticShape` in the world after passing a battery of placement tests.

## Turrets

### The base

`TurretBaseLarge` is the mission-placed turret base **[script]**:

```php
datablock TurretData(TurretBaseLarge) : TurretDamageProfile
{
   className      = TurretBase;
   catagory       = "Turrets";
   shapeFile      = "turret_base_large.dts";
   preload        = true;

   mass           = 1.0;  // Not really relevant

   maxDamage      = 2.25;
   destroyedLevel = 2.25;
   disabledLevel  = 1.35;      // ← damage level at which it stops working but is not destroyed
   explosion      = TurretExplosion;
   expDmgRadius   = 15.0;
   expDamage      = 0.66;
   expImpulse     = 2000.0;
   repairRate     = 0;
   emap = true;

   thetaMin = 15;              // ← elevation limits, degrees
   thetaMax = 140;

   isShielded           = true;
   energyPerDamagePoint = 50;
   maxEnergy = 150;
   rechargeRate = 0.31;
   humSound = SensorHumSound;
   pausePowerThread = true;

   canControl = true;          // ← a player can enter and manually aim it
   cmdCategory = "Tactical";
   cmdIcon = CMDTurretIcon;
   cmdMiniIconName = "commander/MiniIcons/com_turretbase_grey";
   targetNameTag = 'Base';
   targetTypeTag = 'Turret';
   sensorData = TurretBaseSensorObj;
   sensorRadius = TurretBaseSensorObj.detectRadius;
   sensorColor = "0 212 45";

   firstPersonOnly = true;

   debrisShapeName = "debris_generic.dts";
   debris = TurretDebris;
};
```

with its own sensor **[script]**:

```php
datablock SensorData(TurretBaseSensorObj)
{
   detects = true;
   detectsUsingLOS = true;
   detectsPassiveJammed = false;
   detectsActiveJammed = false;
   detectsCloaked = false;
   detectionPings = true;
   detectRadius = 80;
};
```

`SensorData` governs what the turret can see, and it is where cloak and jammer interactions are decided.
A turret with `detectsCloaked = true` defeats the cloaking pack.

### The barrel

The barrel is a `TurretImageData` — an image mounted to slot 0 of the base. Eight ship **[script]**:

```
scripts/turrets/aaBarrelLarge.cs              anti-air
scripts/turrets/ELFBarrelLarge.cs             ELF
scripts/turrets/missileBarrelLarge.cs         missile
scripts/turrets/mortarBarrelLarge.cs          mortar
scripts/turrets/plasmaBarrelLarge.cs          plasma
scripts/turrets/indoorDeployableBarrel.cs     spider clamp
scripts/turrets/outdoorDeployableBarrel.cs    landspike
scripts/turrets/sentryTurret.cs               sentry
```

A barrel file follows the same bottom-up shape as a weapon — effects, sounds, projectile, then the image.
From `outdoorDeployableBarrel.cs` **[script]**:

```php
datablock TracerProjectileData(FusionBolt)
{
   doDynamicClientHits = true;
   projectileShapeName = "";
   directDamage        = 0.0;
   directDamageType    = $DamageType::OutdoorDepTurret;
   hasDamageRadius     = true;
   indirectDamage      = 0.24;
   damageRadius        = 4.0;
   kickBackStrength    = 0.0;
   radiusDamageType    = $DamageType::OutdoorDepTurret;
   sound               = BlasterProjectileSound;
   explosion           = PlasmaBoltExplosion;
   dryVelocity         = 60.0;
   wetVelocity         = 40.0;
   …
};
```

Note that each turret type has its **own damage type** — `$DamageType::OutdoorDepTurret`,
`$DamageType::PlasmaTurret`, and so on. That is how kill messages distinguish them. See
[Damage and type masks](damage-and-typemasks.md).

### Barrel swapping

Barrels are swapped by an engineer carrying a barrel pack. `TurretData::replaceCallback` does it
**[script]**:

```php
function TurretData::replaceCallback(%this, %turret, %engineer)
{
   // This is a valid replacement.  First, let's see if the engineer
   //  still has the correct pack in place...
   if (%engineer.getMountedImage($BackPackSlot) != 0)
   {
      %barrel = %engineer.getMountedImage($BackPackSlot).turretBarrel;
      if (%barrel !$= "")
      {
         // if there was a barrel there before, get rid of it
         %turret.unmountImage(0);
         // remove the turret barrel pack
         %engineer.setInventory(%engineer.getMountedImage($BackPackSlot).item, 0);
         // mount new barrel on base
         %turret.mountImage(%barrel, 0, false);
      }
   }
}
```

**A barrel pack is an ordinary pack with a `turretBarrel` field naming the `TurretImageData`.** That is
the whole mechanism. To add a barrel type, write the barrel image, then write a pack whose
`ShapeBaseImageData` declares `turretBarrel = YourBarrelImage;`. See [Packs](packs.md).

`checkTurretMount` finds the base the player is looking at, using a ray cast **[script]**:

```php
function checkTurretMount(%data, %obj, %slot)
{
   // search for a turret base in player's LOS
   %eyeVec = VectorNormalize(%obj.getEyeVector());
   %srchRange = VectorScale(%eyeVec, 5.0); // look 5m for a turret base
   %plTm = %obj.getEyeTransform();
   %plyrLoc = firstWord(%plTm) @ " " @ getWord(%plTm, 1) @ " " @ getWord(%plTm, 2);
   %srchEnd = VectorAdd(%plyrLoc, %srchRange);
   %potTurret = ContainerRayCast(%obj.getEyeTransform(), %srchEnd, $TypeMasks::TurretObjectType);
   …
}
```

`ContainerRayCast(%start, %end, %mask)` is the general "what am I looking at" call. Worth memorising.

### Target selection

```php
function TurretData::selectTarget(%this, %turret)
{
   %turretTarg = %turret.getTarget();
   if(%turretTarg == -1)
      return;

   // if the turret isn't on a team, don't fire at anyone
   if(getTargetSensorGroup(%turretTarg) == 0)
   {  %turret.clearTarget();  return;  }

   // stop firing if turret is disabled or if it needs power and isn't powered
   if((!%turret.isPowered()) && (!%turret.needsNoPower))
   {  %turret.clearTarget();  return;  }

   %TargetSearchMask = $TypeMasks::PlayerObjectType | $TypeMasks::VehicleObjectType;

   InitContainerRadiusSearch(%turret.getMuzzlePoint(0),
                             %turret.getMountedImage(0).attackRadius,
                             %TargetSearchMask);

   while ((%potentialTarget = ContainerSearchNext()) != 0)
   {
      %potTargTarg = %potentialTarget.getTarget();
      if (%turret.isValidTarget(%potentialTarget)
          && (getTargetSensorGroup(%turretTarg) != getTargetSensorGroup(%potTargTarg)))
      {
         %turret.setTargetObject(%potentialTarget);
         return;
      }
   }
}
```

Override this in a package to change targeting priority — the shipped version picks the **first** result
from the container search, which is not necessarily the nearest or most dangerous. This is a well-known
place for mods to improve on the base game.

`attackRadius` lives on the **barrel image**, not the base — so different barrels have different ranges.

### Power

Turrets participate in the base power system:

| Callback | When |
|---|---|
| `TurretData::onGainPowerEnabled(%data, %obj)` | Power restored — re-enables the sensor |
| `TurretData::onLosePowerDisabled(%data, %obj)` | Power lost — clears the target and kicks out players |

`%turret.needsNoPower` exempts deployed turrets, which run on their own.

## Deployables

A deployable is a **pack** (`className = Pack`) whose image, when activated, tries to place a
`StaticShape` in the world.

### The three-datablock pattern

From `TurretOutdoorDeployable` — the landspike **[script]**:

```php
datablock ShapeBaseImageData(TurretOutdoorDeployableImage)
{
   mass = 15;

   shapeFile = "pack_deploy_turreto.dts";
   item = TurretOutdoorDeployable;
   mountPoint = 1;
   offset = "0 0 0";
   deployed = TurretDeployedOutdoor;      // ← the StaticShapeData that gets placed

   stateName[0] = "Idle";
   stateTransitionOnTriggerDown[0] = "Activate";

   stateName[1] = "Activate";
   stateScript[1] = "onActivate";
   stateTransitionOnTriggerUp[1] = "Idle";

   maxDamage = 4.5;
   destroyedLevel = 4.5;
   disabledLevel = 4.0;

   isLarge = true;
   emap = true;

   maxDepSlope = 40;                      // ← max surface angle, degrees
   deploySound = TurretDeploySound;

   minDeployDis = 0.5;
   maxDeployDis = 5.0;  //meters from body
};

datablock ItemData(TurretOutdoorDeployable)
{
   className = Pack;
   catagory = "Deployables";              // ← the station group
   shapeFile = "pack_deploy_turreto.dts";
   mass = 3.0;
   elasticity = 0.2;
   friction = 0.6;
   pickupRadius = 1;
   rotate = false;
   image = "TurretOutdoorDeployableImage";
   pickUpName = "a landspike turret pack";

   computeCRC = true;
   emap = true;
};
```

The third block is the `StaticShapeData` that appears in the world — `TurretDeployedOutdoor`, declared in
the turret barrel file, with `deployedObject = true;`.

The indoor variant differs in exactly two fields: `maxDepSlope = 360` (any orientation — it clamps to
walls and ceilings) and no `deployed` reference in the same place.

### The placement tests

This is the most reusable machinery in `deployables.cs`. Each test is a `ShapeBaseImageData::` method,
overridable per deployable **[script]**:

| Test | Fails when |
|---|---|
| `testMaxDeployed(%item, %plyr)` | The team is at its cap for this item |
| `testNoSurfaceInRange(%item, %plyr)` | Nothing within `$MaxDeployDistance` |
| `testSlopeTooGreat(%item)` | Surface angle exceeds `maxDepSlope` |
| `testSelfTooClose(%item, %plyr)` | The player is inside `$MinDeployDistance` of the target point |
| `testObjectTooClose(%item)` | Another object is within `$MinDeployDistance` |
| `testNoTerrainFound(%item)` | Outdoor-only item placed on a non-`TerrainBlock` |
| `testNoInteriorFound(%item)` | Indoor-only item placed on a non-`InteriorInstance` |
| `testHavePurchase(%item, %xform)` | Not enough flat surface under the footprint |

```php
function ShapeBaseImageData::testMaxDeployed(%item, %plyr)
{
   if(%item.item $= TurretOutdoorDeployable || %item.item $= TurretIndoorDeployable)
      %itemCount = countTurretsAllowed(%item.item);
   else
      %itemCount = $TeamDeployableMax[%item.item];

   return $TeamDeployedCount[%plyr.team, %item.item] >= %itemCount;
}

function ShapeBaseImageData::testObjectTooClose(%item)
{
   %mask =    ($TypeMasks::VehicleObjectType     | $TypeMasks::MoveableObjectType   |
               $TypeMasks::StaticShapeObjectType |
               $TypeMasks::ForceFieldObjectType  | $TypeMasks::ItemObjectType       |
               $TypeMasks::PlayerObjectType      | $TypeMasks::TurretObjectType);

   InitContainerRadiusSearch( %item.surfacePt, $MinDeployDistance, %mask );

   %test = containerSearchNext();
   return %test;
}
```

The base-class versions of the terrain/interior tests are deliberate no-ops **[script]**:

```php
function ShapeBaseImageData::testNoTerrainFound(%item, %surface)
{
   //don't check this for non-Landspike turret deployables
}
```

— so a new deployable inherits "no surface-type restriction" and opts in by overriding.

### Team caps

`$TeamDeployableMax[<ItemName>]` sets the per-team limit; `$TeamDeployedCount[<team>, <ItemName>]` tracks
current usage. Register your deployable's cap or `testMaxDeployed` reads an empty string, which compares
as zero, and **nothing can ever be deployed**.

### Failure messages

`Deployables::displayErrorMsg` maps a `$NotDeployableReason::` constant to a client message **[script]**:

```php
switch (%error)
{
   case $NotDeployableReason::None:
      %item.onDeploy(%plyr, %slot);
      messageClient(%plyr.client, 'MsgTeamDeploySuccess', "");
      return;

   case $NotDeployableReason::NoSurfaceFound:
      %msg = '\c2Item must be placed within reach.%1';

   case $NotDeployableReason::MaxDeployed:
      %msg = '\c2Your team\'s control network has reached its capacity for this item.%1';

   case $NotDeployableReason::SlopeTooGreat:
      %msg = '\c2Surface is too steep to place this item on.%1';

   case $NotDeployableReason::SelfTooClose:
      %msg = '\c2You are too close to the surface you are trying to place the item on.%1';

   case $NotDeployableReason::ObjectTooClose:
      %msg = '\c2You cannot place this item so close to another object.%1';

   case $NotDeployableReason::NoTerrainFound:
      %msg = '\c2You must place this on outdoor terrain.%1';

   case $NotDeployableReason::NoInteriorFound:
      %msg = '\c2You must place this on a solid surface.%1';

   case $NotDeployableReason::TurretTooClose:
      %msg = '\c2Interference from a nearby turret prevents placement here.%1';
   …
}
```

**`%item.onDeploy(%plyr, %slot)` is your hook** — it is called only on success. Define
`<YourDeployableImage>::onDeploy` to create your object.

The `\c2` prefix is a colour code and `%1` is a substitution slot for the error sound. See
[Text and messaging](../04-interface/text-and-messaging.md).

### The deploy sensor

The green/red placement indicator is three small functions **[script]**:

```php
function activateDeploySensorRed(%pl) { … messageClient(%pl.client, 'msgDeploySensorRed', ""); … }
function activateDeploySensorGrn(%pl) { … messageClient(%pl.client, 'msgDeploySensorGrn', ""); … }
function deactivateDeploySensor(%pl)  { … messageClient(%pl.client, 'msgDeploySensorOff', ""); … }
```

Each caches state on `%pl.deploySensor` so the message is only sent on change — a good pattern to copy
for any per-frame client indicator.

### The shipped deployables

| Item | Deployed object |
|---|---|
| `InventoryDeployable` | `DeployedStationInventory` |
| `MotionSensorDeployable` | `DeployedMotionSensor` |
| `PulseSensorDeployable` | `DeployedPulseSensor` |
| `TurretOutdoorDeployable` | `TurretDeployedOutdoor` (landspike) |
| `TurretIndoorDeployable` | `TurretDeployedIndoor` (spider clamp) |
| Beacon, satchel charge | see `scripts/packs/satchelCharge.cs` |

### Useful helpers

`deployables.cs` defines four transform helpers worth reusing **[script]**:

```php
function posFromTransform(%transform)      // first three words
function rotFromTransform(%transform)      // last four words
function posFromRaycast(%transform)        // hit position from a raycast result
function normalFromRaycast(%transform)     // surface normal from a raycast result
function addToDeployGroup(%object)         // register for team counting and cleanup
function Deployables::searchView(%obj, %searchRange, %mask)   // raycast from the eye
```

## Recipe: a deployable ammo crate

```php
//------------------------------------------------------------------------------
// MyMod — Deployable ammo crate
//------------------------------------------------------------------------------

datablock StaticShapeData(DeployedAmmoCrate) : StaticShapeDamageProfile
{
   className      = DeployedAmmoCrate;
   catagory       = "DSupport";
   shapeFile      = "stat_deploy_station.dts";      // reuse a stock shape
   maxDamage      = 1.2;
   destroyedLevel = 1.2;
   disabledLevel  = 0.9;
   explosion      = SmallTurretExplosion;
   deployedObject = true;
   isShielded     = false;
   needsNoPower   = true;

   dynamicType = $TypeMasks::StaticShapeObjectType;

   cmdCategory     = "DSupport";
   targetNameTag   = 'Ammo';
   targetTypeTag   = 'Crate';

   debrisShapeName = "debris_generic.dts";
   debris          = DeployableDebris;

   resupplyAmount  = 30;
   resupplyPeriod  = 4000;
};

datablock ShapeBaseImageData(AmmoCrateDeployableImage)
{
   mass       = 10;
   shapeFile  = "pack_deploy_station.dts";
   item       = AmmoCrateDeployable;
   mountPoint = 1;
   offset     = "0 0 0";
   deployed   = DeployedAmmoCrate;

   stateName[0] = "Idle";
   stateTransitionOnTriggerDown[0] = "Activate";

   stateName[1] = "Activate";
   stateScript[1] = "onActivate";
   stateTransitionOnTriggerUp[1] = "Idle";

   isLarge     = true;
   maxDepSlope = 30;
   deploySound = StationDeploySound;

   minDeployDis = 0.5;
   maxDeployDis = 5.0;
};

datablock ItemData(AmmoCrateDeployable)
{
   className    = Pack;
   catagory     = "Deployables";
   shapeFile    = "pack_deploy_station.dts";
   mass         = 3.0;
   elasticity   = 0.2;
   friction     = 0.6;
   pickupRadius = 1;
   rotate       = false;
   image        = "AmmoCrateDeployableImage";
   pickUpName   = "an ammo crate pack";

   computeCRC = true;
};

// Outdoor terrain only.
function AmmoCrateDeployableImage::testNoTerrainFound(%item)
{
   return %item.surface.getClassName() !$= TerrainBlock;
}

// Team cap — without this, testMaxDeployed reads "" and nothing deploys.
$TeamDeployableMax[AmmoCrateDeployable] = 4;
```

Register `max[AmmoCrateDeployable] = 1;` on the armors that may carry it, and add it to the appropriate
`stationSetInv` — see [Ammo and inventory](ammo-and-inventory.md#the-complete-checklist-for-a-new-item).

## Seeing the framework pushed hard

The test system above was designed to be extended, and the
[Construction mod](../58-construction-mod/building-systems.md#extending-the-deployable-tests) is the proof
that it scaled: it keeps every vanilla test and helper, adds `testInventoryTooClose`, `testTurretTooClose`,
and `testSurfaceTooNarrow`, and layers per-deployable overrides in exactly the shipped style — across 35
deployable types **[mod-script]**.

If you are writing more than one or two deployables, that codebase is the best worked example available.

## Related

- [Packs](packs.md) — deployables are packs; barrel packs use `turretBarrel`
- [Damage and type masks](damage-and-typemasks.md) — the type masks used by the placement tests
- [Projectiles](projectiles.md) — turret barrel projectiles
- [Ammo and inventory](ammo-and-inventory.md) — making deployables obtainable

> **On a patched install:** nothing on this page changes. Neither TribesNEXT patch touches gameplay
> content — see [03 · Content Recipes](README.md#under-the-community-patches).
