# Building systems

The mechanics. How you build a sandbox construction game out of `ShapeBaseImageData`, `StaticShapeData`,
and the deployable framework.

## The core idea: deployables as building material

Vanilla has five deployables — inventory station, two sensors, two turrets — each a one-shot placement
with a fixed shape. Construction reframes the same machinery as **construction pieces**: structural
elements you place in relation to each other, at chosen sizes and angles, in unlimited quantity.

By 0.70a there are **35 deployable pack files** **[mod-script]**:

```
spine.cs          mspine.cs        blastfloor.cs     blastwall.cs      blastwwall.cs
door.cs           doorbu.cs        jumpad.cs         telepadpack.cs    energizer.cs
solarpanel.cs     generator.cs     switch.cs         lightpack.cs      tripwire.cs
forcefieldpack.cs gravityfieldpack.cs               treepack.cs       decorationpack.cs
logoprojectorpack.cs              escapepodpack.cs   cratepack.cs      vehiclepad.cs
largeInventory.cs largeSensor.cs   mediumSensor.cs   discturret.cs     laserturret.cs
turretpack.cs     missilerackturret.cs              AntiNuketurret.cs  repairpack.cs
satchelCharge.cs  Effectpacks.cs   deconExamples.cs
```

### Pieces are armor-gated

From the readme **[mod-script]**, each piece is tied to an armor class — the vanilla `max[]` mechanism
from [Ammo and inventory](../03-content-recipes/ammo-and-inventory.md#carry-limits) used as a
build-material tier system:

| Piece | Armor | Behaviour |
|---|---|---|
| **Light support beam** | Light | 5 fixed lengths (1.5 m, 4 m, 8 m, 40 m, 160 m), plus **auto-size** (scales 0.5–16 m to fit the gap, defaults to 4 m unconfined) and **pad** mode (scales *and* stretches into a platform) |
| **Light blast wall** | Light | Pad-style sizing; user declares whether they are inside or outside the structure to correct deploy orientation |
| **Light walk way** | Light | Face a cliff edge and deploy; slope selectable 0 %, 20 %, 45 %, 90 % up or down |
| **Medium support beam** | Medium | Stronger, fixed length; ships with **rings** you deploy onto and stand on to place the next spine above — a bootstrapping ladder |
| **Medium floor** | Medium | Deploying a floor on a floor creates an adjacent floor at the nearest edge |
| **Jumpad** | Medium | Launches players |
| **Teleporter** | Heavy | **40 frequencies**, shared across both teams; links only to matching frequency; damaged pads produce "dangerous side effects" |
| **Energizer** | Heavy | Replenishes energy in radius, via an *"higly unstable reactor"* — protect it |
| **Disk / base turrets** | Medium / Heavy | Defence; disc turrets can damage your own structure |
| **Deployable tree** | Medium/Heavy | Decoration |

The design intent shows in the details: the medium spine's rings exist purely so a player can *reach* the
place the next piece goes. Vertical construction on an engine with no scaffolding.

## Beacon-key mode switching

The signature interaction, and a neat piece of engine abuse **[mod-script]**:

> ```
> [[Beacon switching]]
> -Some packs have more than one function.
> -use the beacon key to switch.
> ```

Vanilla gives a pack one activation trigger ([Packs](../03-content-recipes/packs.md#the-pack-key)).
Construction needs *modes* — a beam that can be 1.5 m, 4 m, 8 m, 40 m, 160 m, auto or pad. There is no
spare input, so the **beacon key is repurposed as a mode cycler**.

That is the general technique when you need more input than the engine offers: find an existing bound
action whose meaning you control server-side, and overload it. See
[Ammo and inventory](../03-content-recipes/ammo-and-inventory.md#weapon-slots-and-cycling) for the input
surface available.

## Border snapping

> ```
> [[Border snapping]]
> -When deploying on the far edge of an object the object will snap correctly to the border.
> ```
> **[mod-script]**

Placement assistance built on the vanilla raycast helpers — `posFromRaycast`, `normalFromRaycast`,
`Deployables::searchView` **[mod-script]**, all inherited unchanged from vanilla
([Turrets and deployables](../03-content-recipes/turrets-and-deployables.md#useful-helpers)). The mod adds
the snap logic; the engine already provided the surface query.

## Extending the deployable tests

Vanilla validates placement through overridable `ShapeBaseImageData::testXxx` methods, with base-class
versions deliberately written as no-ops so subclasses opt in. Construction keeps all of them and adds
three **[mod-script]**:

```php
function ShapeBaseImageData::testInventoryTooClose(%item, %plyr)
function ShapeBaseImageData::testTurretTooClose(%item, %plyr)
function ShapeBaseImageData::testSurfaceTooNarrow(%item, %surface)
```

with per-deployable overrides in the vanilla style:

```php
function TurretIndoorDeployableImage::testTurretTooClose(%item, %plyr) { … }
function TurretOutdoorDeployableImage::testTurretTooClose(%item, %plyr) { … }
function DiscTurretDeployableImage::testTurretTooClose(%item, %plyr) { … }
function TurretLaserDeployableImage::testTurretTooClose(%item, %plyr) { … }
function TurretMissileRackDeployableImage::testTurretTooClose(%item, %plyr) { … }
function TurretMpm_Anti_DeployableImage::testTurretTooClose(%item, %plyr) { … }
```

**If you are adding a deployable to a Construction fork, this is the pattern to follow** — write
`<YourImage>::testXxx` overrides, not new validation code.

## The Construction Tool

The deconstruct gun. Its lineage is in its header **[mod-script]**:

```php
// Deconstruct Gun / Construction Tool
// Originally from Hammer Mod. Changed and redone for LuCiD MoD.
// Also Changed again and redone for Construction Mod.
```

The mechanism is a **reverse-deploy table** mapping a deployed `StaticShapeData` back to the item that
placed it **[mod-script]**:

```php
$ReverseDeployItem[DeployedStationInventory] = InventoryDeployable;
$ReverseDeployItem[TurretDeployedOutdoor]    = TurretOutdoorDeployable;
$ReverseDeployItem[DeployedSpine]            = "poof spineDeployable";
$ReverseDeployItem[Deployedfloor]            = "poof floorDeployable";
$ReverseDeployItem[DeployedEnergizer]        = EnergizerDeployable;
$ReverseDeployItem[DiscTurretDeployed]       = DiscTurretDeployable;
…
```

Point at a piece, fire, and it becomes the pack again. The `"poof <item>"` prefix marks pieces that
deconstruct with an effect rather than returning inventory.

**If you add a deployable to a fork, add its `$ReverseDeployItem` entry** or players cannot remove it —
the same class of registration omission as a missing `max[]` or `$AmmoIncrement`
([Ammo and inventory](../03-content-recipes/ammo-and-inventory.md#the-complete-checklist-for-a-new-item)).

The readme is candid about why it exists: *"If you make an mistake you can correct it with this with out
any dangerous side effects. Make sure you remove mistakes right after you made them."* **[mod-script]**

## Saving and loading buildings

`saveBuilding.cs` — 841 lines, credited as *"a joint effort of DynaBlade and JackTL"* **[mod-script]**.
The hardest problem the mod solves, and the one with no engine support at all.

### The API

```
saveBuilding(clientId, radius, file, quiet)
saveBuildingCentered(clientId, radius, file, quiet, centerAtMinZ)
loadBuilding(file)
saveBuildingTimer(seconds, globalEcho, file, useMultipleFiles)
saveBuildingTimerOn() / saveBuildingTimerOff()
delDupPieces(clientId, radius, quiet)
delBuildingWaypoint()
```

Configured by globals **[mod-script]**:

```php
$SaveBuilding::SaveFolder       = "Buildings/";
$SaveBuilding::AutoSaveFolder   = "Buildings/AutoSave/";
$SaveBuilding::TimerDefaultTime = 5 * 60 * 1000; // 5 minutes
$SaveBuilding::QuickDelete      = 1;
```

with an honest performance note: *"Saving may cause stutter on low-end servers with high number of
pieces"* **[mod-script]**.

### How it works

It **generates TorqueScript source** and writes it with a `FileObject`. Each piece becomes a `new`
statement **[mod-script]**:

```php
%buildingPiece = "%building = new (" @ %obj.getClassName() @ ") () {";
%buildingPiece = %buildingPiece @ "datablock = \"" @ %dataBlockName @ "\";";
if (%obj.position !$= "")   %buildingPiece = %buildingPiece @ "position = \"" @ %obj.position @ "\";";
if (%obj.rotation !$= "")   %buildingPiece = %buildingPiece @ "rotation = \"" @ %obj.rotation @ "\";";
if (%obj.realScale !$= "")  %buildingPiece = %buildingPiece @ "scale = \"" @ %obj.realScale @ "\";";
if (%obj.team !$= "")       %buildingPiece = %buildingPiece @ "team = \"" @ %obj.team @ "\";";
if (%obj.ownerGUID !$= "")  %buildingPiece = %buildingPiece @ "ownerGUID = \"" @ %obj.ownerGUID @ "\";";
…
```

— roughly thirty conditional field writes covering `needsFit`, `grounded`, `deployed`, `impulse`,
`velocityMod`, `gravityMod`, `appliedForce`, `powerFreq`, `isSwitchedOff`, `switchRadius`, `holoBlock`,
`noSlow`, `static`, `timed`, `beamRange`, `tripMode`, `fieldMode` and more. Loading is then just
`exec()` on the generated file.

**This is a hand-rolled version of `SimObject::save()`**, and the comparison is instructive. Vanilla's
`save()` writes every persistable field and its dynamic fields automatically
([SimObjects and namespaces](../02-engine-model/simobject-and-namespaces.md)) — but it writes *everything*,
in engine-defined form, for whole `SimGroup` subtrees. Construction needs a **filtered, per-datablock,
composite-aware** serialisation, so it emits the fields it wants and nothing else.

The composite handling is the reason. Pieces that are parts of other pieces are skipped so the parent
recreates them **[mod-script]**:

```php
if (%dataBlockName $= "DeployedMSpineRing") // Handled by DeployedMSpine
   return;
if (%dataBlockName $= "TelePadBeam")        // Handled by TelePadDeployedBase
   return;
if (%dataBlockName $= "DeployedLTarget")    // Handled by parent object
   return;
```

And `saveBuildingCheck(%obj)` is an explicit allow-list `switch$` over datablock names — only recognised
construction pieces are saved, so world objects and player equipment in the radius are ignored.

**If you add a piece to a fork, add it to `saveBuildingCheck()`** or it silently vanishes on reload.

### Why `ownerGUID`

0.68a *"Added GUID owner tracking. Owner status is now saved with buildings"* **[mod-script]**. On a
persistent build server the question "who placed this, and may I remove it?" outlives any session, so
ownership is keyed to the account GUID rather than the client ID — and serialised with the structure.

## Server modes

Construction is heavily configurable at runtime, because a build server and a build-and-fight server are
different games. Modes surface as `$Host::` globals with admin-menu toggles and **player votes**
**[mod-script]**:

| Mode | Effect |
|---|---|
| `$Host::Purebuild` | Building only — combat off |
| `$Host::ExpertMode` | Advanced tools and settings |
| `$Host::Cascade` | Cascading structural collapse |
| `$Host::Vehicles` | Vehicles on/off |
| `$Host::InvincibleArmors` | Players cannot be damaged |
| `$Host::InvincibleDeployables` | Structures cannot be damaged |
| `$Host::AllowUnderground` | Underground building |
| `$Host::JailMode`, `$Host::Prison::DeploySpam` | Jail griefers; optionally auto-jail deploy spammers |
| `$Host::Hazard`, `$Host::MTC` | Optional hazard and MTC subsystems |

Each gets a vote string pair **[mod-script]**:

```php
$VoteMessage["VotePurebuild", 0] = "enable pure building";
$VoteMessage["VotePurebuild", 1] = "disable pure building";
$VoteMessage["VoteExpertMode", 0] = "enable expert mode";
$VoteMessage["VoteExpertMode", 1] = "disable expert mode";
$VoteMessage["VotePrisonDeploySpam", 0] = "enable jailing deploy spammers";
```

hooking vanilla's voting system from `defaultGame.cs`
([Gametypes](../05-gameplay-systems/gametypes.md)). 0.68a's history notes Cascade and Vehicles being
*separated* from Purebuild and saved independently **[mod-script]** — a settings-granularity fix driven by
operators wanting combinations the original lumping did not allow.

0.70a moves configuration into a dedicated `ConstructionPreferences.cs` at the mod root
**[mod-script]**:

```php
//Construction 0.70 Server Configuration File

//Logging:
$Construction::Logging::EchoChat = 1;
$Construction::Logging::LogConnects = 1; //disconnects too
$Construction::Logging::LogChat = 1;
```

A good pattern to copy: one documented config file, namespaced globals, separate from the code.

## Anti-griefing

A build server is uniquely vulnerable — anyone can place thousands of pieces, and unlike a kill, a
structure persists. Construction accumulated a substantial defensive layer, visible in the globals
**[mod-script]**:

```
$Host::DeploySpam                    $Host::DeploySpamCheckTimeMS
$Host::DeploySpamMaxTime             $Host::DeploySpamMultiply
$Host::DeploySpamRemoveRecentMS      $Host::DeploySpamResetWarnCountTime
$Host::DeploySpamTime                $Host::DeploySpamWarnings
```

Eight tunables for one problem — rate detection, warning counts, recent-placement rollback, and
escalation. Plus `prison.cs` and `solitudeBlock.cs` for containment, GUID ownership so structures can be
attributed after the fact, and 0.68a's *"admin menu to remove all orphaned deployables in the mission…
where the owner is no longer in the game"* **[mod-script]**.

**The lesson generalises:** persistent player-created content needs attribution, rate limiting, and bulk
cleanup, and you will not anticipate the scale. Construction added these reactively across many versions.

## Extending a Construction fork

If you are modifying 0.69a or 0.70a — which is what most Construction-family work is — the registration
checklist for a new deployable:

| # | Step | Where |
|---|---|---|
| 1 | `ShapeBaseImageData` + `ItemData` + deployed `StaticShapeData` | `scripts/packs/yourPack.cs` |
| 2 | `exec()` it | The pack list in `pack.cs` |
| 3 | `max[YourPack]` on each armor that may carry it | Shadowed `player.cs` |
| 4 | Placement tests — `<YourImage>::testXxx` overrides | Your pack file |
| 5 | **`$ReverseDeployItem[YourDeployed]`** | `weapons/constructionTool.cs` — or it cannot be removed |
| 6 | **`saveBuildingCheck()` case** | `saveBuilding.cs` — or it vanishes on reload |
| 7 | Field writes in `writeBuildingComponent()` if it has custom state | `saveBuilding.cs` |
| 8 | Inventory HUD entry | Shadowed `inventoryHud.cs` |

Steps 5 and 6 are the ones people miss. They fail silently and only in circumstances players hit long
after you have stopped testing.

## Related

- [What it changed](what-it-changed.md) — the architecture underneath
- [Section overview](README.md) — motivation and lineage
- [Turrets and deployables](../03-content-recipes/turrets-and-deployables.md) — the vanilla framework
- [SimObjects and namespaces](../02-engine-model/simobject-and-namespaces.md) — `save()` versus hand-rolled serialisation
- [Gametypes](../05-gameplay-systems/gametypes.md) — voting and the `DefaultGame::` surface
