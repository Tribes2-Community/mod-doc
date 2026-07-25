# Vehicles

Three vehicle datablock types ship with Tribes 2, each backed by a different C++ physics model. Like
projectiles, you cannot add a new type — you pick the closest and tune it.

| Type | Vehicles | Physics |
|---|---|---|
| `FlyingVehicleData` | Shrike (`ScoutFlyer`), Havoc (`HAPCFlyer`), Bomber (`BomberFlyer`) | Thrust and control surfaces, auto-stabilised hover |
| `HoverVehicleData` | Wildcat (`ScoutVehicle`), Tank (`AssaultVehicle`) | Ground-hugging hover with drag |
| `WheeledVehicleData` | MPB (`MobileBaseVehicle`) | Wheel contacts and suspension |

All six inherit from a per-vehicle damage profile **[script]**:

```php
datablock FlyingVehicleData(ScoutFlyer)         : ShrikeDamageProfile  { … };
datablock FlyingVehicleData(HAPCFlyer)          : HavocDamageProfile   { … };
datablock FlyingVehicleData(BomberFlyer)        : BomberDamageProfile  { … };
datablock HoverVehicleData(ScoutVehicle)        : WildcatDamageProfile { … };
datablock HoverVehicleData(AssaultVehicle)      : TankDamageProfile    { … };
datablock WheeledVehicleData(MobileBaseVehicle) : MPBDamageProfile     { … };
```

## Load order — read this first

`CreateServer()` carries two shouted comments about vehicles **[script]**:

```php
exec("scripts/vehicles/vehicle_spec_fx.cs");  // Must exist before other vehicle files or CRASH BOOM
exec("scripts/vehicles/serverVehicleHud.cs");
exec("scripts/vehicles/vehicle_shrike.cs");
exec("scripts/vehicles/vehicle_bomber.cs");
exec("scripts/vehicles/vehicle_havoc.cs");
exec("scripts/vehicles/vehicle_wildcat.cs");
exec("scripts/vehicles/vehicle_tank.cs");
exec("scripts/vehicles/vehicle_mpb.cs");
exec("scripts/vehicles/vehicle.cs");          // Must be added after all other vehicle files or EVIL BAD THINGS
```

`vehicle_spec_fx.cs` declares the shared emitters and effects every vehicle references, so it must come
first. `vehicle.cs` declares the shared `VehicleData::` handlers and expects all the datablocks to exist,
so it must come last. **A new vehicle file goes between them.**

## The Shrike, annotated

Sierra commented this datablock unusually well. It is the best reference in the game for flight tuning
**[script]**:

```php
datablock FlyingVehicleData(ScoutFlyer) : ShrikeDamageProfile
{
   spawnOffset = "0 0 2";

   catagory = "Vehicles";
   shapeFile = "vehicle_air_scout.dts";
   multipassenger = false;
   computeCRC = true;

   debrisShapeName = "vehicle_air_scout_debris.dts";
   debris = ShapeDebris;
   renderWhenDestroyed = false;

   drag    = 0.15;
   density = 1.0;

   mountPose[0] = sitting;
   numMountPoints = 1;
   isProtectedMountPoint[0] = true;    // ← occupants immune to splash; see below
   cameraMaxDist = 15;
   cameraOffset = 2.5;
   cameraLag = 0.9;
   explosion = VehicleExplosion;
   explosionDamage = 0.5;
   explosionRadius = 5.0;

   maxDamage = 1.40;
   destroyedLevel = 1.40;

   isShielded = true;
   energyPerDamagePoint = 160;
   maxEnergy = 280;      // Afterburner and any energy weapon pool
   rechargeRate = 0.8;

   minDrag = 30;           // Linear Drag (eventually slows you down when not thrusting...constant drag)
   rotationalDrag = 900;   // Anguler Drag (dampens the drift after you stop moving the mouse...also tumble drag)

   maxAutoSpeed = 15;      // Autostabilizer kicks in when less than this speed. (meters/second)
   autoAngularForce = 400; // Angular stabilizer force (this force levels you out when autostabilizer kicks in)
   autoLinearForce = 300;  // Linear stabilzer force (this slows you down when autostabilizer kicks in)
   autoInputDamping = 0.95;// Dampen control input so you don't whack out at very slow speeds

   // Maneuvering
   maxSteeringAngle = 5;         // Max radiens you can rotate the wheel. Smaller number is more maneuverable.
   horizontalSurfaceForce = 6;   // Horizontal center "wing" (provides "bite" into the wind for climbing/diving and turning)
   verticalSurfaceForce = 4;     // Vertical center "wing" (controls side slip. lower numbers make MORE slide.)
   maneuveringForce = 3000;      // Horizontal jets (W,S,D,A key thrust)
   steeringForce = 1200;         // Steering jets (force applied when you move the mouse)
   steeringRollForce = 400;      // Steering jets (how much you heel over when you turn)
   rollForce = 4;                // Auto-roll (self-correction to right you after you roll/invert)
   hoverHeight = 5;              // Height off the ground at rest
   createHoverHeight = 3;        // Height off the ground when created
   maxForwardSpeed = 100;        // speed in which forward thrust force is no longer applied (meters/second)

   // Turbo Jet
   jetForce = 2000;              // Afterburner thrust (this is in addition to normal thrust)
   minJetEnergy = 28;            // Afterburner can't be used if below this threshhold.
   jetEnergyDrain = 2.8;         // Energy use of the afterburners (low number is less drain...can be fractional)
   vertThrustMultiple = 3.0;

   // Rigid body
   mass = 150;                   // Mass of the vehicle
   bodyFriction = 0;             // Don't mess with this.
   bodyRestitution = 0.5;        // When you hit the ground, how much you rebound. (between 0 and 1)
   minRollSpeed = 0;             // Don't mess with this.
   softImpactSpeed = 14;         // Sound hooks. This is the soft hit.
   hardImpactSpeed = 25;         // Sound hooks. This is the hard hit.

   // Ground Impact Damage (uses DamageType::Ground)
   minImpactSpeed = 10;          // If hit ground at speed above this then it's an impact. Meters/second
   speedDamageScale = 0.06;

   // Object Impact Damage (uses DamageType::Impact)
   collDamageThresholdVel = 23.0;
   collDamageMultiplier   = 0.02;

   minTrailSpeed = 15;           // The speed your contrail shows up at.
   trailEmitter = ContrailEmitter;
   forwardJetEmitter = FlyerJetEmitter;
   downJetEmitter = FlyerJetEmitter;

   max[chaingunAmmo] = 1000;     // ← vehicles have inventory limits too
   minMountDist = 4;

   cmdCategory = "Tactical";
   cmdIcon = CMDFlyingScoutIcon;
   cmdMiniIconName = "commander/MiniIcons/com_scout_grey";
   targetNameTag = 'Shrike';
   targetTypeTag = 'Turbograv';
   sensorData = AWACPulseSensor;
   sensorRadius = AWACPulseSensor.detectRadius;
   sensorColor = "255 194 9";

   checkRadius = 5.5;
   observeParameters = "1 10 10";

   runningLight[0] = ShrikeLight1;
   shieldEffectScale = "0.937 1.125 0.60";
};
```

Take Sierra's two "Don't mess with this" comments seriously — `bodyFriction` and `minRollSpeed` interact
with the C++ integrator in ways the script layer cannot see.

### The flight-feel dials

If you want a vehicle to *feel* different, these five are where to start:

| Field | Raise it to get |
|---|---|
| `maneuveringForce` | Snappier translation on WASD |
| `steeringForce` | Faster turning |
| `rotationalDrag` | Less drift/tumble after input stops — tighter, less floaty |
| `horizontalSurfaceForce` | More "bite" — climbs and dives harder, turns tighter at speed |
| `verticalSurfaceForce` | Less side-slip in turns |

And for speed: `maxForwardSpeed` caps thrust application, `minDrag` bleeds it off, `jetForce` /
`jetEnergyDrain` / `minJetEnergy` tune the afterburner.

## Mount points

```php
   mountPose[0] = sitting;               // animation the passenger plays
   numMountPoints = 1;
   isProtectedMountPoint[0] = true;
```

The Havoc has six **[script]**:

```php
   mountPose[0] = sitting;
   numMountPoints = 6;
   isProtectedMountPoint[0] = true;
   … through isProtectedMountPoint[5] = true;
```

Mount points correspond to nodes in the `.dts` shape. `mountPose[n]` names a sequence from the player's
`TSShapeConstructor` — see [Armors](armors.md#animation-binding).

`isProtectedMountPoint[n]` is honoured by `RadiusExplosion` **[script]** — occupants of a protected mount
point are skipped entirely by splash damage:

```php
if (%targetObject.isMounted())
{
   %mount = %targetObject.getObjectMount();
   %found = -1;
   for (%i = 0; %i < %mount.getDataBlock().numMountPoints; %i++)
      if (%mount.getMountNodeObject(%i) == %targetObject)
      {  %found = %i;  break;  }

   if (%found != -1 && %mount.getDataBlock().isProtectedMountPoint[%found])
      continue;      // ← no splash damage to this occupant
}
```

Related fields:

| Field | Meaning |
|---|---|
| `multipassenger` | Whether more than one player may board |
| `minMountDist` | How close a player must be to mount |
| `weaponNode` | Which mount node is the gunner seat — read by `Player::isWeaponOperator` **[script]** |
| `spawnOffset` | Where the vehicle appears relative to the pad |
| `checkRadius` | Clearance check radius at spawn |

Role tests **[script]**:

```php
function Player::isPilot(%this)
{
   %vehicle = %this.getObjectMount();
   if (%vehicle)
      if (%vehicle.getMountNodeObject(0) == %this)
         return true;
   return false;
}

function Player::isWeaponOperator(%this)
{
   %vehicle = %this.getObjectMount();
   if ( %vehicle )
   {
      %weaponNode = %vehicle.getDatablock().weaponNode;
      if ( %weaponNode > 0 && %vehicle.getMountNodeObject( %weaponNode ) == %this )
         return( true );
   }
   return( false );
}
```

**Node 0 is always the pilot.**

## The `VehicleData::` callback surface

`scripts/vehicles/vehicle.cs` defines the shared behaviour **[script]**. Override any of these in a
package, or define a `<YourVehicle>::` version for one vehicle:

| Callback | When |
|---|---|
| `VehicleData::onAdd(%data, %obj)` | Vehicle created |
| `VehicleData::onRemove(%this, %obj)` | Vehicle removed |
| `VehicleData::onDamage(%this, %obj)` | Damage taken |
| `VehicleData::onDestroyed(%data, %obj, %prevState)` | Destroyed |
| `VehicleData::playerMounted(%data, %obj, %player, %node)` | A player boarded |
| `VehicleData::playerDismounted(%data, %obj, %player)` | A player left |
| `VehicleData::onEnterLiquid(%data, %obj, %coverage, %type)` | Entered water |
| `VehicleData::onLeaveLiquid(%data, %obj, %type)` | Left water |
| `VehicleData::onAvoidCollisions(%data, %obj)` | Collision avoidance tick |
| `VehicleData::deleteAllMounted()` | Eject and destroy occupants |

Per-vehicle overrides exist for most of these — `ScoutFlyer::onAdd`, `BomberFlyer::playerMounted`,
`AssaultVehicle::onDamage`, `MobileBaseVehicle::vehicleDeploy`, and so on. That is the pattern to copy for
a new vehicle: inherit the datablock, then define only the `<YourVehicle>::` handlers that differ.

Class-level liquid handlers exist per physics type **[script]** — `FlyingVehicle::liquidDamage`,
`WheeledVehicle::liquidDamage`, `HoverVehicle::liquidDamage` — which is why a Shrike and an MPB behave
differently in water.

## Vehicle weapons

Vehicle weapons are `ShapeBaseImageData` mounted to the vehicle, exactly like player weapons
**[script]**:

```php
datablock ShapeBaseImageData(ScoutChaingunPairImage) { … };
datablock ShapeBaseImageData(ScoutChaingunImage) : ScoutChaingunPairImage { … };
datablock ShapeBaseImageData(ScoutChaingunParam) { … };
```

with fire handlers in `scripts/weapTurretCode.cs` **[script]**:

```php
function ScoutChaingunImage::onFire(%data,%obj,%slot) { … }
function ScoutChaingunPairImage::onFire(%data,%obj,%slot) { … }
```

Vehicle-mounted weapons draw from the vehicle's energy pool when `useMountEnergy = true` — the generic
`ShapeBaseImageData::onFire` handles the routing **[script]**:

```php
if(%data.useMountEnergy)
{
   %useEnergyObj = %obj.getObjectMount();
   if(!%useEnergyObj)
      %useEnergyObj = %obj;
   %energy = %useEnergyObj.getEnergyLevel();
   %vehicle = %useEnergyObj;
}
```

See [Weapons](weapons.md) for the image state machine, and
[Turrets and deployables](turrets-and-deployables.md) for turret-style mounts.

## Recipe: a fast interceptor

`MyMod/scripts/vehicles/vehicle_interceptor.cs` — loaded between `vehicle_mpb.cs` and `vehicle.cs`:

```php
//------------------------------------------------------------------------------
// MyMod — Interceptor: a Shrike tuned for speed at the cost of durability
//------------------------------------------------------------------------------

datablock FlyingVehicleData(InterceptorFlyer) : ScoutFlyer
{
   shapeFile = "vehicle_air_scout.dts";      // reuse the Shrike model

   // Fragile
   maxDamage      = 0.95;
   destroyedLevel = 0.95;
   mass           = 120;

   // Faster and tighter
   maxForwardSpeed        = 130;
   maneuveringForce       = 3600;
   steeringForce          = 1500;
   rotationalDrag         = 1100;
   horizontalSurfaceForce = 8;
   verticalSurfaceForce   = 5;

   // Bigger afterburner, thirstier
   jetForce       = 2600;
   jetEnergyDrain = 4.0;
   minJetEnergy   = 40;
   maxEnergy      = 240;
   rechargeRate   = 0.7;

   // Hits the ground harder
   minImpactSpeed   = 8;
   speedDamageScale = 0.09;

   targetNameTag = 'Interceptor';
   targetTypeTag = 'Turbograv';
};

function InterceptorFlyer::onAdd(%this, %obj)
{
   Parent::onAdd(%this, %obj);
   // ScoutFlyer::onAdd mounts the chaingun pair; nothing more needed here.
}
```

Load it from your package:

```php
package MyMod
{
   function CreateServer(%mission, %missionType)
   {
      Parent::CreateServer(%mission, %missionType);
      exec("scripts/vehicles/vehicle_interceptor.cs");
   }
};
```

> The `Parent::CreateServer` call runs the whole stock list including `vehicle.cs`, so your file lands
> *after* the "must be last" file. In practice this works for a datablock that inherits from an existing
> vehicle, because `vehicle.cs` only defines functions. If you write a vehicle that does not inherit, you
> need it inside the ordered block — shadow `scripts/vehicles/vehicle.cs` in your mod and add your `exec`
> at the top of your copy. See [Mod paths and overrides](../02-engine-model/mod-paths-and-overrides.md).

To make it purchasable you must also add it to the vehicle station's list — see
[Turrets and deployables](turrets-and-deployables.md).

## Related

- [Turrets and deployables](turrets-and-deployables.md) — vehicle stations and pads
- [Weapons](weapons.md) — the image system vehicle weapons use
- [Damage and type masks](damage-and-typemasks.md) — `isProtectedMountPoint` and splash
- [Armors](armors.md) — `mountPose` sequences come from the player shape

> **On a patched install:** nothing on this page changes. Neither TribesNEXT patch touches gameplay
> content — see [03 · Content Recipes](README.md#under-the-community-patches).
