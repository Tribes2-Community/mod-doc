# Grenades and hand inventory

Thrown items — grenades, mines, beacons — use `className = HandInventory`. They are the simplest content
type in the game: no image, no state machine, just two `ItemData` blocks and the shared throw code.

## The two-datablock pattern

Every thrown item is **a pair**:

| Datablock | `className` | Role |
|---|---|---|
| The **inventory** item | `HandInventory` | What you carry and count. Never exists in the world. |
| The **thrown** item | `Weapon` | What exists in the world after you throw it. Carries the explosion. |

Linked by the `thrownItem` field. The grenade **[script]**:

```php
datablock ItemData(GrenadeThrown)
{
   className = Weapon;
   shapeFile = "grenade.dts";
   mass = 0.7;
   elasticity = 0.2;
   friction = 1;
   pickupRadius = 2;
   maxDamage = 0.5;                            // ← it can be shot out of the air
   explosion = HandGrenadeExplosion;
   underwaterExplosion = UnderwaterHandGrenadeExplosion;
   indirectDamage      = 0.4;
   damageRadius        = 10.0;
   radiusDamageType    = $DamageType::Grenade;
   kickBackStrength    = 2000;

   computeCRC = true;
};

datablock ItemData(Grenade)
{
   className = HandInventory;
   catagory = "Handheld";                      // ← the inventory station group
   shapeFile = "grenade.dts";
   mass = 0.7;
   elasticity = 0.2;
   friction = 1;
   pickupRadius = 2;
   thrownItem = GrenadeThrown;                 // ← the link
   pickUpName = "some grenades";
   isGrenade = true;                           // ← AI uses this

   computeCRC = true;
};
```

Note that the *thrown* half carries the damage fields directly on the `ItemData` rather than on a
projectile datablock. Thrown items are not projectiles — they are physical `Item` objects that explode.

## The throw code

`HandInventory::onUse` in `scripts/weapons.cs` does everything **[script]**:

```php
$HandInvThrowTimeout = 0.8 * 1000; // 1/2 second between throwing grenades or mines

function HandInventory::onUse(%data, %obj)
{
   // %obj = player  %data = datablock of what's being thrown
   if(Game.handInvOnUse(%data, %obj))
   {
      //AI HOOK - If you change the %throwStren, tell Tinman!!!
      //Or edit aiInventory.cs and search for: use(%grenadeType);

      %tossTimeout = getSimTime() - %obj.lastThrowTime[%data];
      if(%tossTimeout < $HandInvThrowTimeout)
         return;

      %throwStren = %obj.throwStrength;

      %obj.decInventory(%data, 1);
      %thrownItem = new Item()
      {
         dataBlock = %data.thrownItem;
         sourceObject = %obj;
      };
      MissionCleanup.add(%thrownItem);

      // throw it
      %eye = %obj.getEyeVector();
      %vec = vectorScale(%eye, (%throwStren * 20.0));

      // add a vertical component to give it a better arc
      %dot = vectorDot("0 0 1", %eye);
      if(%dot < 0)
         %dot = -%dot;
      %vec = vectorAdd(%vec, vectorScale("0 0 4", 1 - %dot));

      // add player's velocity
      %vec = vectorAdd(%vec, vectorScale(%obj.getVelocity(), 0.4));
      %pos = getBoxCenter(%obj.getWorldBox());

      %thrownItem.sourceObject = %obj;
      %thrownItem.team = %obj.team;
      %thrownItem.setTransform(%pos);

      %thrownItem.applyImpulse(%pos, %vec);
      %thrownItem.setCollisionTimeout(%obj);
      serverPlay3D(GrenadeThrowSound, %pos);
      %obj.lastThrowTime[%data] = getSimTime();

      %thrownItem.getDataBlock().onThrow(%thrownItem, %obj);
      %obj.throwStrength = 0;
   }
}
```

Worth reading closely — it is a compact tour of most of the engine's script API:

| Line | Technique |
|---|---|
| `Game.handInvOnUse(%data, %obj)` | The gametype's veto on throwing |
| `getSimTime() - %obj.lastThrowTime[%data]` | Per-item cooldown using array syntax on a dynamic field |
| `new Item() { dataBlock = %data.thrownItem; … }` | Spawning the world object |
| `MissionCleanup.add(…)` | Automatic cleanup |
| `vectorScale(%eye, %throwStren * 20.0)` | Direction × strength |
| `vectorAdd(…, vectorScale("0 0 4", 1 - %dot))` | The arc — more lift when looking level, less when looking up or down |
| `vectorScale(%obj.getVelocity(), 0.4)` | 40 % of the thrower's velocity is inherited |
| `%thrownItem.setCollisionTimeout(%obj)` | Stops the grenade colliding with the thrower immediately |
| `%thrownItem.getDataBlock().onThrow(…)` | The per-item hook — this is where your custom behaviour goes |
| `%obj.throwStrength = 0` | Reset the charge |

**`onThrow` is the extension point.** Define `<YourThrownItem>::onThrow(%obj, %thrower)` and it is called
with the world object and the player who threw it.

> The comment says half a second; `$HandInvThrowTimeout` is `0.8 * 1000` = 800 ms. Trust the code.

> The `//AI HOOK` comment is a genuine warning **[script]** — changing throw strength affects the bot
> code in `aiInventory.cs`, which computes throw arcs assuming these numbers.

## Mines — a thrown item with deployment logic

```php
datablock ItemData(MineDeployed)
{
   className = Weapon;
   shapeFile = "mine.dts";
   mass = 0.75;
   elasticity = 0.2;
   friction = 0.6;
   pickupRadius = 3;
   maxDamage = 0.2;
   explosion = MineExplosion;
   underwaterExplosion = UnderwaterMineExplosion;
   indirectDamage = 0.55;
   damageRadius = 6.0;
   radiusDamageType = $DamageType::Mine;
   kickBackStrength = 1500;
   aiAvoidThis = true;
   dynamicType = $TypeMasks::DamagableItemObjectType;
   spacing = 6.0;        // how close together mines can be
   proximity = 2.5;      // how close causes a detonation (by player/vehicle)
   armTime = 2200;       // 2.2 seconds to arm a mine after it comes to rest
   maxDepCount = 9;      // try to deploy this many times before detonating
};

datablock ItemData(Mine)
{
   className    = HandInventory;
   catagory     = "Handheld";
   shapeFile    = "ammo_mine.dts";
   mass         = 1;
   elasticity   = 0.2;
   friction     = 0.7;
   pickupRadius = 2;
   thrownItem   = MineDeployed;
   pickUpName   = "some mines";
};
```

The mine-specific fields — `spacing`, `proximity`, `armTime`, `maxDepCount` — are read by the mine's own
`onThrow` and proximity-check code, not by the engine. They are ordinary dynamic fields. Any thrown item
you write can define its own.

| Field | Meaning |
|---|---|
| `spacing` | Minimum distance between mines. Prevents mine stacking. |
| `proximity` | Trigger distance |
| `armTime` | Delay after coming to rest before it can trigger |
| `maxDepCount` | Deployment retry attempts before giving up and detonating |
| `aiAvoidThis` | Bots path around it |
| `dynamicType` | Extra type mask bits — makes the mine shootable. See [Damage and type masks](damage-and-typemasks.md). |

## The shipped hand-inventory items

`scripts/weapons.cs` executes six throwing-weapon files **[script]**:

```php
// --- Throwing weapons
exec("scripts/weapons/mine.cs");
exec("scripts/weapons/grenade.cs");
exec("scripts/weapons/flashGrenade.cs");
exec("scripts/weapons/flareGrenade.cs");
exec("scripts/weapons/concussionGrenade.cs");
exec("scripts/weapons/cameraGrenade.cs");
```

| Item | Behaviour |
|---|---|
| `Grenade` | Standard explosive |
| `Mine` | Proximity-triggered, sticks where it lands |
| `FlashGrenade` | Blinds |
| `FlareGrenade` | Missile countermeasure — see `flareDistance` / `flareAngle` on `SeekerProjectileData` |
| `ConcussionGrenade` | Impulse without damage; has a special path in `RadiusExplosion` |
| `CameraGrenade` | Deployable remote camera |

The concussion grenade's special case is visible in `RadiusExplosion` **[script]**:

```php
else if( %explosionSource.getDataBlock().getName() $= "ConcussionGrenadeThrown"
         && %data.getClassName() $= "PlayerData" )
{
   %data.applyConcussion( %dist, %radius, %sourceObject, %targetObject );
   …
}
```

— i.e. when computed damage is zero, a concussion grenade still applies its screen-shake effect. If you
build a non-damaging effect grenade, this is the pattern to copy.

## Recipe: a smoke grenade

`MyMod/scripts/weapons/smokeGrenade.cs`:

```php
//------------------------------------------------------------------------------
// MyMod — Smoke Grenade: no damage, persistent smoke cloud
//------------------------------------------------------------------------------

datablock ParticleData(SmokeGrenadeParticle)
{
   dragCoefficient      = 1.5;
   gravityCoefficient   = -0.05;
   inheritedVelFactor   = 0.1;
   lifetimeMS           = 6000;
   lifetimeVarianceMS   = 1500;
   useInvAlpha          = true;
   textureName          = "particleTest";
   spinRandomMin        = -30.0;
   spinRandomMax        =  30.0;

   colors[0] = "0.6 0.6 0.6 0.0";
   colors[1] = "0.5 0.5 0.5 0.9";
   colors[2] = "0.4 0.4 0.4 0.0";
   sizes[0]  = 1.0;
   sizes[1]  = 6.0;
   sizes[2]  = 10.0;
   times[0]  = 0.0;
   times[1]  = 0.3;
   times[2]  = 1.0;
};

datablock ParticleEmitterData(SmokeGrenadeEmitter)
{
   ejectionPeriodMS = 12;
   periodVarianceMS = 4;
   ejectionVelocity = 2.0;
   velocityVariance = 1.0;
   ejectionOffset   = 0.5;
   thetaMin         = 0;
   thetaMax         = 90;
   phiReferenceVel  = 0;
   phiVariance      = 360;
   lifetimeMS       = 12000;
   particles        = "SmokeGrenadeParticle";
};

datablock ItemData(SmokeGrenadeThrown)
{
   className    = Weapon;
   shapeFile    = "grenade.dts";
   mass         = 0.7;
   elasticity   = 0.2;
   friction     = 1;
   pickupRadius = 2;
   maxDamage    = 0.5;

   // No explosion, no damage fields — it is a pure effect item.
   smokeDuration = 12000;

   computeCRC = true;
};

datablock ItemData(SmokeGrenade)
{
   className    = HandInventory;
   catagory     = "Handheld";
   shapeFile    = "grenade.dts";
   mass         = 0.7;
   elasticity   = 0.2;
   friction     = 1;
   pickupRadius = 2;
   thrownItem   = SmokeGrenadeThrown;
   pickUpName   = "some smoke grenades";
   isGrenade    = true;

   computeCRC = true;
};

// Called by HandInventory::onUse right after the throw impulse is applied.
function SmokeGrenadeThrown::onThrow(%data, %obj, %thrower)
{
   // Wait for it to come to rest, then start smoking.
   %obj.schedule(1500, "startSmoke", %data);
}

function Item::startSmoke(%obj, %data)
{
   if (!isObject(%obj))
      return;

   %emitter = new ParticleEmissionDummy()
   {
      dataBlock  = SmokeGrenadeEmitterDummy;
      emitter    = SmokeGrenadeEmitter;
      position   = %obj.getPosition();
   };
   MissionCleanup.add(%emitter);

   %emitter.schedule(%data.smokeDuration, delete);
   %obj.schedule(%data.smokeDuration, delete);
}

datablock ParticleEmissionDummyData(SmokeGrenadeEmitterDummy)
{
   timeMultiple = 1.0;
};

$AmmoIncrement[SmokeGrenade] = 5;
```

Register it as usual: `max[SmokeGrenade]` on the armors, a `stationSetInv` entry, and an inventory HUD
slot. See [Ammo and inventory](ammo-and-inventory.md#the-complete-checklist-for-a-new-item).

> `ParticleEmissionDummyData` must be declared before it is referenced. In the listing above it appears
> after `Item::startSmoke` for readability — in a real file, move it to the top with the other datablocks.
> See [Datablocks](../02-engine-model/datablocks.md#declaration-order-matters).

## Related

- [Ammo and inventory](ammo-and-inventory.md) — carry limits and station loadouts
- [Particles, explosions, and effects](particles-explosions-effects.md) — the emitter chain used above
- [Damage and type masks](damage-and-typemasks.md) — `RadiusExplosion` and `dynamicType`
- [Weapons](weapons.md) — the `Weapon` className handlers the thrown half uses

> **On a patched install:** nothing on this page changes. Neither TribesNEXT patch touches gameplay
> content — see [03 · Content Recipes](README.md#under-the-community-patches).
