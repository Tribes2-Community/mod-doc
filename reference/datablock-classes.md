# Datablock classes

Every datablock type you can declare, with usage counts from the 334 files in `base/scripts.vl2`
**[script]** and the engine's own validation ranges where they exist **[binary]**.

## Census

| Type | Count | Purpose | Recipe |
|---|---:|---|---|
| `AudioProfile` | 298 | A sound | [Audio](../03-content-recipes/audio.md) |
| `EffectProfile` | 140 | Immersion force-feedback effect | [Audio](../03-content-recipes/audio.md) |
| `ParticleData` | 114 | One particle's look and physics | [Effects](../03-content-recipes/particles-explosions-effects.md) |
| `ParticleEmitterData` | 114 | Emission pattern | [Effects](../03-content-recipes/particles-explosions-effects.md) |
| `ExplosionData` | 66 | Explosion assembly | [Effects](../03-content-recipes/particles-explosions-effects.md) |
| `ItemData` | 58 | Any pickable item | [Weapons](../03-content-recipes/weapons.md), [Packs](../03-content-recipes/packs.md) |
| `ShapeBaseImageData` | 35 | A mountable image | [Weapons](../03-content-recipes/weapons.md) |
| `StaticShapeData` | 35 | Non-moving world object | [Deployables](../03-content-recipes/turrets-and-deployables.md) |
| `DebrisData` | 18 | Destruction fragments | [Effects](../03-content-recipes/particles-explosions-effects.md) |
| `TurretImageData` | 17 | Turret barrel | [Turrets](../03-content-recipes/turrets-and-deployables.md) |
| `CommanderIconData` | 16 | Command-map icon | — |
| `SensorData` | 15 | Detection behaviour | [Turrets](../03-content-recipes/turrets-and-deployables.md) |
| `AudioDescription` | 13 | Sound category | [Audio](../03-content-recipes/audio.md) |
| `DecalData` | 12 | Surface marks | — |
| `SimDataBlock` | 11 | Generic script datablock — used for damage profiles | [Damage](../03-content-recipes/damage-and-typemasks.md) |
| `RunningLightData` | 11 | Vehicle running lights | [Vehicles](../03-content-recipes/vehicles.md) |
| `TurretData` | 10 | Turret base | [Turrets](../03-content-recipes/turrets-and-deployables.md) |
| `ShockwaveData` | 10 | Expanding ring | [Effects](../03-content-recipes/particles-explosions-effects.md) |
| `SplashData` | 9 | Water entry | [Effects](../03-content-recipes/particles-explosions-effects.md) |
| `PlayerData` | 9 | Armor | [Armors](../03-content-recipes/armors.md) |
| `TSShapeConstructor` | 8 | Binds `.dsq` sequences to a `.dts` | [Armors](../03-content-recipes/armors.md) |
| `TriggerData` | 7 | Volume trigger | [Missions](../05-gameplay-systems/missions.md) |
| `ForceFieldBareData` | 6 | Force field | — |
| `TracerProjectileData` | 5 | Hitscan tracer | [Projectiles](../03-content-recipes/projectiles.md) |
| `LinearFlareProjectileData` | 5 | Flare-rendered linear projectile | [Projectiles](../03-content-recipes/projectiles.md) |
| `MissionMarkerData` | 4 | Editor marker | — |
| `JetEffectData` | 4 | Jetpack effect | [Armors](../03-content-recipes/armors.md) |
| `GrenadeProjectileData` | 4 | Ballistic projectile | [Projectiles](../03-content-recipes/projectiles.md) |
| `PrecipitationData` | 3 | Rain and snow | — |
| `ParticleEmissionDummyData` | 3 | Standalone emitter | [Effects](../03-content-recipes/particles-explosions-effects.md) |
| `FlyingVehicleData` | 3 | Shrike, Havoc, Bomber | [Vehicles](../03-content-recipes/vehicles.md) |
| `AudioEnvironment` | 3 | Reverb space | [Audio](../03-content-recipes/audio.md) |
| `TargetProjectileData` | 2 | Targeting laser | [Projectiles](../03-content-recipes/projectiles.md) |
| `SeekerProjectileData` | 2 | Homing missile | [Projectiles](../03-content-recipes/projectiles.md) |
| `HoverVehicleData` | 2 | Wildcat, Tank | [Vehicles](../03-content-recipes/vehicles.md) |
| `ELFProjectileData` | 2 | Sustained beam | [Projectiles](../03-content-recipes/projectiles.md) |
| `CameraData` | 2 | Camera behaviour | — |
| `WheeledVehicleData` | 1 | MPB | [Vehicles](../03-content-recipes/vehicles.md) |
| `StationFXVehicleData` | 1 | Vehicle station effect | — |
| `StationFXPersonalData` | 1 | Inventory station effect | — |

Types used only by mission files and not declared in `scripts.vl2`: `EnergyProjectileData` (blaster),
`SniperProjectileData`, `ShockLanceProjectileData`, `LinearProjectileData`, `RepairProjectileData`, and
`ProjectileData` (abstract — *"cannot be used as a concrete datablock type"* **[script]**).

## Validated field ranges

The engine validates many fields in `onAdd` and refuses the datablock — or clamps — if they are out of
range. These messages are in the binary **[binary]** and are the authoritative bounds. Violating them
produces a console error at load time and a datablock that does not work.

### `ProjectileData` and descendants

| Field | Constraint |
|---|---|
| `directDamage` | `>= 0.0` |
| `indirectDamage` | `>= 0.0` |
| `damageRadius` | `>= 0.0` |
| `kickBackStrength` | `>= 0` |
| `lightRadius` | `[1, 20]` |
| `lifetimeMS` | bounded range, engine-defined |
| `fizzleTimeMS` | `>= 0` and `<= lifetimeMS` |
| `wetVelocity` | `>= 0.1` — *"wetVelocity < .1, resetting"* |

### `GrenadeProjectileData`

| Field | Constraint |
|---|---|
| `grenadeElasticity` | `[0, 0.999]` — *"to prevent FP errors from accumulating"* |
| `grenadeFriction` | `[0, 1]` |
| `drag` | `[0, inf]` |
| `lifetimeMS` | must be non-zero |

The blaster's `grenadeElasticity = 0.998` sits deliberately just under the ceiling **[script]**.

### `SeekerProjectileData`

| Field | Constraint |
|---|---|
| `turningSpeed` | `[0, 2000]` |
| `acceleration` | `[0.0, 30000]` |
| `maxVelocity` | `>= 0.1` |
| `muzzleVelocity` | `>= 0.1` |
| `terrainAvoidanceSpeed` | `[0, 2000]` |
| `terrainScanAhead` | `[0, 200]` |
| `terrainAvoidanceRadius` | `>= 0` |
| `terrainHeightFail` | `>= 0` |
| `flareDistance` | `>= 0` — *"0 indicates missile unaffected by flares"* |
| `flareAngle` | `>= 0` — same |
| `flechetteDelayMs` | `<= 30000` |

### `SniperProjectileData` / `TargetProjectileData`

| Field | Constraint |
|---|---|
| `maxRifleRange` | `[10, 2000]` |

### `TracerProjectileData`

| Field | Constraint |
|---|---|
| `tracerLength` | `[1, 50]` |
| `tracerMinPixels` | `[1, 20]` |

### `ELFProjectileData`

| Field | Constraint |
|---|---|
| `beamRange` | `>= 2` |
| `beamHitWidth` | `[0, 90]` |

### `ShockLanceProjectileData`

| Field | Constraint |
|---|---|
| `zapDuration` | `[0.05, 2.0]` |
| `boltLength` | `[0.5, 50.0]` |

### `ParticleData`

| Field | Constraint |
|---|---|
| `lifetimeMS` | `>= 1` |
| `lifetimeVarianceMS` | `< lifetimeMS` |
| `spinSpeed`, `spinRandomMin`, `spinRandomMax` | validated |
| `numFrames`, `framesPerSec` | validated |
| `times[n]` | **must be non-decreasing** — *"times[%d] < times[%d]"* |

The `times[]` ordering rule catches people out. Keyframe times must ascend.

### `ParticleEmitterData`

| Field | Constraint |
|---|---|
| `ejectionPeriodMS` | `>= 1 ms` |
| `periodVarianceMS` | `< ejectionPeriodMS` |
| `ejectionVelocity` | `>= 0.0` |
| `ejectionOffset` | `>= 0` |
| `thetaMin` | `>= 0.0` and `<= thetaMax` |
| `thetaMax` | `<= 180.0` |
| `phiVariance` | validated |
| `lifetimeVarianceMS` | `< lifetimeMS` |
| `particles` | must name at least one existing `ParticleData`; the string is capped at **255 characters** |

*"invalid particles string. No datablocks found"* and *"particle string too long [> 255 chars]"* are the
two failure messages. The second bites when you list many particle types in one emitter.

### `ExplosionData`

| Field | Constraint |
|---|---|
| `lifetimeMS` | `>= 1` |
| `lifetimeVariance` | `<= lifetimeMS` |
| `delayMS` | `>= 0` |
| `delayVariance` | `<= delayMS` |
| `offset` | `>= 0.0` |
| `debrisNum`, `debrisNumVariance` | `<= 1000` |
| `debrisThetaMin` | `>= 0.0` and `<= debrisThetaMax` |
| `debrisPhiMin` | `>= 0.0` and `<= debrisPhiMax` |
| `debrisPhiMax` | `<= 360.0` |

### `DebrisData`

| Field | Constraint |
|---|---|
| `lifetime`, `lifetimeVariance` | validated |
| `elasticity`, `friction` | validated |
| `numBounces`, `bounceVariance` | validated |
| `velocity`, `velocityVariance` | validated |
| `minSpinSpeed`, `maxSpinSpeed` | validated |

### `TurretData` / `TurretImageData`

| Field | Constraint |
|---|---|
| `thetaMin` | `[0, 90]` |
| `degPerSecTheta` | `[1, 1080]` |
| `activationMS` | `[engine min, 5000]` |
| `deactivateDelayMS` | `[engine min, 5000]` |
| `thinkTimeMS` | `[engine min, 5000]` |

### `ForceFieldBareData`

| Field | Constraint |
|---|---|
| `fadeMS` | `[0, 10000]` |

### `PrecipitationData`

| Field | Constraint |
|---|---|
| `sizeX` | `(0, 20]` |

## Declaring a datablock

```php
datablock <Type>(<Name>)
{
   field = value;
};

datablock <Type>(<Name>) : <ParentName>
{
   field = value;      // everything else inherited
};
```

Rules:

- **The parent must exist** at declaration time.
- **Referenced datablocks must exist** at declaration time — see
  [Datablocks](../02-engine-model/datablocks.md#declaration-order-matters).
- **Unknown fields become dynamic fields** — no error, no effect on the engine, readable from script.
- **`className` selects the script dispatch namespace**, and is how `ItemData` becomes a weapon, a pack,
  or hand inventory.

## The `className` values

| `className` | Handlers in | Behaviour you inherit |
|---|---|---|
| `Weapon` | `scripts/weapons.cs` | `onUse` (mount to `$WeaponSlot`), `onInventory`, `onPickup`, `incCatagory` |
| `Ammo` | `scripts/weapons.cs` | `onInventory` — drives image ammo state and HUD |
| `WeaponImage` | `scripts/weapons.cs` | `onMount` / `onUnmount` — arm thread, HUD, reticle |
| `Pack` | `scripts/pack.cs` | `onCollision`, `onUse` (toggle trigger), `onInventory` (auto-mount) |
| `HandInventory` | `scripts/weapons.cs` | `onUse` (the throw code), `onInventory` |
| `HandInventoryImage` | `scripts/weapons.cs` | `onMount` |
| `Armor` | `scripts/player.cs` | Player behaviour; required for weapons to mount |
| `TurretBase` | `scripts/turret.cs` | Turret base behaviour |

Setting `className` to an existing value is the cheapest way to get a complete behaviour set. See
[SimObjects and namespaces](../02-engine-model/simobject-and-namespaces.md#classname-on-datablocks).

## Under the community patches

**No datablock types are added, removed, or changed**, and every validated range above still applies —
the validation lives in `Tribes2.exe`, which neither patch modifies.

One type is functionally inert on the QoL patch: **`EffectProfile`** (140 declared in the shipped
scripts). The blocks still parse and `AudioProfile.effect` still accepts them, but TribesNEXT's
`IFC22.dll` stubs the Immersion force-feedback exports **[binary]**, so nothing plays. Declaring them
remains harmless; omitting them was always fine. RC2a keeps the vendor DLL and force feedback works.

Everything else — every field, every range, every `className` dispatch value — is identical.

## Related

- [Datablocks](../02-engine-model/datablocks.md) — semantics, inheritance, ghosting
- [03 · Content Recipes](../03-content-recipes/README.md) — each type in use
- [Class hierarchy](class-hierarchy.md) — the engine classes behind these
- [07 · Community Patches](../07-community-patches/README.md) — what the patches do change
