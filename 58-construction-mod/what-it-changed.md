# What Construction changed

Architecture. How a total conversion is actually assembled on this engine, and what it costs.

## The shadowing strategy

Construction is **almost entirely file shadowing**. It ships `GameData/Construction/scripts/` containing
27 files with the same names as vanilla's, which win the mod-path lookup and replace them outright.

Shadowed **[mod-script]**:

```
OptionsDlg.cs   admin.cs        client.cs       controlDefaults.cs   damageTypes.cs
deathMessages.cs defaultGame.cs deployables.cs  editor.cs            forceField.cs
gameBase.cs     hud.cs          inventory.cs    inventoryHud.cs      item.cs
message.cs      pack.cs         player.cs       power.cs             projectiles.cs
server.cs       serverCommanderMap.cs           staticShape.cs       station.cs
turret.cs       weapTurretCode.cs               weapons.cs
```

New **[mod-script]**:

```
ConstructionGame.cs  TR2Game.cs      saveBuilding.cs   chatCommands.cs
functions.cs         hfunctions.cs   libraries.cs      expertLibraries.cs
deployables' packs/  weapons/        turrets/          vehicles/
dEffects.cs          hazard.cs       ion.cs            nerf.cs
prison.cs            skywrite.cs     solitudeBlock.cs  truPhysics.cs
JTLmeteorStorm.cs    MTC_core.cs     MTC_ai.cs         MTC_weap.cs
MTC_eWeap.cs         MTC_level.cs    MPM/ (11 files)
```

### Only one package

Across the entire mod — 128 files in 0.70a — there is exactly **one** `package` declaration
**[mod-script]**:

```php
package DefaultGame { … }
```

This handbook recommends packages over shadowing throughout
([Packages](../02-engine-model/packages.md), [Your first mod](../01-getting-started/your-first-mod.md)).
Construction does the opposite, at maximum scale. It is worth being honest about why that was the right
call here, and where it still hurt.

**Why shadowing was correct for Construction:**

- It is a **total conversion**. When you are changing what the game *is*, you are not making a delta
  against vanilla behaviour — you are replacing it. A package override of every function in `player.cs`
  would be a worse-organised copy of `player.cs`.
- It is the **only mod on the server**. Composability with other mods buys nothing when nothing else is
  loaded. `-mod Construction` collapses the stack to `Construction;base`.
- Sierra did the same for **Classic** **[script]**, which is precedent from the engine's own authors.

**What it cost:**

- **No composability.** Two Construction-family forks cannot be combined. This is why the ecosystem is a
  *fork tree* rather than a stack of add-ons — every derivative had to start by copying the whole mod.
- **Pinned to one base version.** A shadowed `player.cs` is a snapshot. It cannot benefit from a fix to
  vanilla's, and diverges further with every edit.
- **Enormous review surface.** The delta against vanilla is a 27-file diff, not a list of overrides.

**The lesson for your mod:** shadow when you are replacing a subsystem wholesale and own the server;
package when you are adding to one. Construction is not a counter-example to the advice — it is the case
the advice explicitly carves out.

## It still uses the vanilla conventions

Where the engine offered an extension point, Construction used it rather than working around it. This is
the most instructive thing about the codebase.

### The gametype convention

`scripts/ConstructionGame.cs` **[mod-script]**:

```php
// DisplayName = Construction

//--- GAME RULES BEGIN ---
// Build
//--- GAME RULES END ---
```

Exactly the format documented in [Gametypes](../05-gameplay-systems/gametypes.md) — the `// DisplayName = `
comment parsed by `getMissionTypeDisplayNames()`, the game-rules block for the loading screen, and
`ConstructionGame::` methods dispatched through the `Game` ScriptObject's `class` field.

And its shadowed `server.cs` **preserves the auto-discovery glob verbatim** **[mod-script]**:

```php
//automatically load any mission type that follows naming convention typeGame.name.cs
%search = "scripts/*Game.cs";
for(%file = findFirstFile(%search); %file !$= ""; %file = findNextFile(%search))
{
   %type = fileBase(%file); // get the name of the script
  exec("scripts/" @ %type @ ".cs");
}
```

So Construction ships two gametypes (`ConstructionGame`, `TR2Game`) and both load through Sierra's
mechanism untouched.

### The `CreateServer` ordering constraints

Its `server.cs` keeps Sierra's ordering comments **word for word** **[mod-script]**:

```php
exec("scripts/particleEmitter.cs");    // Must exist before item.cs and explosion.cs
exec("scripts/projectiles.cs");        // Must exits before item.cs
…
exec("scripts/vehicles/vehicle_spec_fx.cs");  // Must exist before other vehicle files or CRASH BOOM
…
exec("scripts/vehicles/vehicle.cs");   // Must be added after all other vehicle files or EVIL BAD THINGS
```

typo and all. Then it appends its own subsystems after `prefs/banlist.cs`, in dependency order
**[mod-script]**:

```php
exec("scripts/savebuilding.cs");
exec("scripts/JTLmeteorStorm.cs");
exec("scripts/prison.cs");
exec("scripts/hazard.cs");
exec("scripts/ion.cs");
exec("scripts/solitudeBlock.cs");
exec("scripts/chatCommands.cs");
if (!$Host::MTC::NoLoad)
   exec("scripts/MTC_core.cs");
exec("scripts/skywrite.cs");
exec("scripts/dEffects.cs");

//Wierd placing due to dependencies.
exec("scripts/mpm/mpm_blast.cs");
exec("scripts/mpm/mpm_launch.cs");
exec("scripts/mpm/mpm.cs");
exec("scripts/mpm/mpm_base.cs");
exec("scripts/packs/antinuketurret.cs");
exec("scripts/mpm/nuke_cannon.cs");
exec("scripts/mpm/Nuclear_blast.cs");
exec("scripts/weapons/dragonmissile.cs");
```

Two things to take from that block. First, `// Wierd placing due to dependencies` is the datablock
declaration-order rule from [Datablocks](../02-engine-model/datablocks.md#declaration-order-matters)
biting a real project — the nuke cannon must come after the blast it references. Second,
`if (!$Host::MTC::NoLoad)` shows a **whole subsystem made optional by a server pref**, which is a clean
pattern for a large mod.

Note also `exec("scripts/nerf.cs")` inserted mid-list, before `weapons.cs` — a shadowed file's ordering
being used as an injection point.

### Extending, not replacing, the deployable framework

Vanilla's deployable system validates placement through overridable `ShapeBaseImageData::testXxx` methods
([Turrets and deployables](../03-content-recipes/turrets-and-deployables.md#the-placement-tests)).
Construction keeps every one of them and **adds its own** **[mod-script]**:

| Vanilla test | Construction addition |
|---|---|
| `testMaxDeployed` | `testInventoryTooClose` |
| `testNoSurfaceInRange` | `testTurretTooClose` |
| `testSlopeTooGreat` | `testSurfaceTooNarrow` |
| `testSelfTooClose` | |
| `testObjectTooClose` | |
| `testNoTerrainFound` / `testNoInteriorFound` | |
| `testHavePurchase` | |

with per-deployable overrides layered on exactly as vanilla does for the indoor and outdoor turrets:

```php
function TurretIndoorDeployableImage::testTurretTooClose(%item, %plyr) { … }
function TurretOutdoorDeployableImage::testTurretTooClose(%item, %plyr) { … }
function DiscTurretDeployableImage::testTurretTooClose(%item, %plyr) { … }
function TurretMissileRackDeployableImage::testTurretTooClose(%item, %plyr) { … }
```

It also keeps the vanilla helpers untouched — `posFromTransform`, `rotFromTransform`, `posFromRaycast`,
`normalFromRaycast`, `addToDeployGroup`, `Deployables::searchView`.

**This is the framework working as designed.** Sierra wrote the base-class tests as deliberate no-ops so
subclasses could opt in ([Turrets and deployables](../03-content-recipes/turrets-and-deployables.md));
Construction is the proof that it scaled.

## New subsystems

| File(s) | Provides |
|---|---|
| `saveBuilding.cs` (841 lines) | Building persistence — see [Building systems](building-systems.md#saving-and-loading-buildings) |
| `MPM/` (11 files) | Multi-Purpose Missile system — nukes, launchers, blast effects |
| `MTC_*.cs` (5 files, ~4600 lines) | A large optional subsystem, gated on `$Host::MTC::NoLoad` |
| `functions.cs`, `hfunctions.cs`, `libraries.cs`, `expertLibraries.cs` | Shared helper libraries |
| `prison.cs`, `solitudeBlock.cs` | Player jailing / admin containment |
| `hazard.cs`, `JTLmeteorStorm.cs`, `ion.cs` | Environmental hazard events |
| `skywrite.cs` | Sky text rendering |
| `dEffects.cs` | Deployment effects |
| `nerf.cs` | Weapon rebalancing, exec'd before `weapons.cs` |
| `truPhysics.cs` | Physics experiment — **commented out** of the exec chain in 0.70a **[mod-script]** |
| `chatCommands.cs` | Chat-driven commands (0.70a) |

`truPhysics.cs` being present but disabled is worth noting: abandoned experiments left in the tree are
normal in this codebase, and a fork inherits them.

### `do_not_delete/`

A directory containing `Dfunctions.cs` and `loadscreen.cs.dso` **[mod-script]** — the latter shipped as
**compiled bytecode only**, with no `.cs` source. That is the source-hiding distribution option described
in [Packaging](../06-shipping/packaging.md#three-shipping-choices), used selectively for one file in a mod
that otherwise ships all its source.

## The DSO problem, at scale

0.68a and 0.69a ship **three** stale-`.dso` cleaner batch files **[mod-script]**:

```
Constructs-DSO-Remover-2.1.bat
Constructs-DSO-deleter-1.2.bat
JTLdelDSO.bat
```

Three people wrote the same fix independently and all three shipped. 0.70a consolidates to one
`DSO Remover.bat`.

This is the problem documented in [Debugging](../06-shipping/debugging.md#my-change-did-nothing) as the
number one support question, showing up as a distribution artifact. If your mod ships loose `.cs`, ship a
cleaner too — Construction's users evidently needed one badly enough to write three.

## Related

- [Building systems](building-systems.md) — the mechanics this architecture supports
- [Section overview](README.md) — motivation, lineage, versions
- [Packages](../02-engine-model/packages.md) — the strategy Construction did *not* use, and why
- [Boot sequence](../02-engine-model/boot-sequence.md) — the `CreateServer` chain it extends
- [Turrets and deployables](../03-content-recipes/turrets-and-deployables.md) — the framework it builds on
