# Reusable mechanisms

Twelve techniques from the Construction family that transfer to any Tribes 2 mod. Each is stated as a
pattern, with the shipped implementation as evidence and the failure modes named.

These solve problems the engine does not: extra input, surface-relative placement, fit-to-space geometry,
extensible commands, object persistence, and spatial linking.

---

## 1. Overloading an existing key for mode selection

**Problem.** A pack has one activation trigger ([Packs](../03-content-recipes/packs.md#the-pack-key)) and
the input map is full. You need dozens of options.

**Pattern.** Take an existing bound action whose meaning you control server-side, and branch on context.

Construction overloads the beacon key **[mod-script]**:

```php
function Beacon::onUse(%data, %obj)
{
   %searchRange = 3.0;
   %mask = $TypeMasks::TerrainObjectType | $TypeMasks::InteriorObjectType
         | $TypeMasks::StaticShapeObjectType | $TypeMasks::ForceFieldObjectType;
   %eyePos  = posFromTransform(%obj.getEyeTransform());
   %eyeEnd  = VectorAdd(%eyePos, VectorScale(VectorNormalize(%obj.getEyeVector()), %searchRange));
   %searchResult = containerRayCast(%eyePos, %eyeEnd, %mask, 0);

   if(!%searchResult)
      return cyclePackSetting(%obj,1);      // aiming at nothing → cycle mode
   … normal beacon placement …
}
```

**Aiming at a surface within 3 m** keeps the original behaviour; **aiming at nothing** becomes the mode
switch. The disambiguator costs one raycast.

**Why it works.** `Beacon::onUse` is reached through `className = HandInventory` dispatch
([SimObjects and namespaces](../02-engine-model/simobject-and-namespaces.md#classname-on-datablocks)), so
you override it in script with no client changes and no rebinding.

**Failure modes.** The overloaded action must still work in its original role or players lose a feature.
Pick a disambiguator that is unambiguous in practice — "am I aiming at anything" is good; "am I moving" is
not.

**Alternative.** [QuantiumX](../45-quantiumx/README.md) uses chat commands instead (§6). Better for many
options, worse for fast repeated switching.

---

## 2. Data-driven mode tables

**Problem.** Mode logic ends up as a `switch$` that grows forever.

**Pattern.** Put modes in a global array with a count, and read them.

```php
$packSettings["spine"] = 18;                                  // count
$packSetting["spine",5] = "0.5 6 160 auto adjusting";         // min default max  label…
$packSetting["spine",6] = "0.5 8 160 pad";
```

Cycling is generic **[mod-script]**:

```php
function cyclePackSetting(%plyr,%val) {
   if (%plyr.hasSpine) {
      %plyr.packSet = %plyr.packSet + %val;
      if (%plyr.packSet > $packSettings["spine"]) %plyr.packSet = 0;
      if (%plyr.packSet < 0)                      %plyr.packSet = $packSettings["spine"];
      %line = $packSetting["spine",%plyr.packSet];
      bottomPrint(%plyr.client,"Beam set to" SPC getWords(%line,3,getWordCount(%line)),2,1);
   }
   …
}
```

**The label lives in the same record.** Words 0–2 are numbers, word 3 onward is what the player sees. One
table, no parallel string list to fall out of sync.

Consumption is a `getWords` **[mod-script]**:

```php
%scale = getWords($packSetting["spine",%plyr.packSet],0,2);
```

**Adding a mode is a line of data.** Construction's walkway pack has 74.

**Failure modes.**
- `$packSettings` (count) and `$packSetting` (table) differ by one letter. Getting it wrong silently
  breaks wrapping.
- The label offset is per-pack — spine uses `getWords(%line,3,…)`, mspine uses `6` **[mod-script]**.
  Inconsistent, and a real bug source. Fix the offset across your tables.
- Modes are stored on the **player** (`%plyr.packSet`), so reset it on pack change or a spine mode leaks
  into a floor.

**Second axis.** Construction adds `$expertSetting[…]` / `$expertSettings[…]`, cycled separately and gated
on `$Host::ExpertMode` **[mod-script]** — giving a matrix instead of a list.

---

## 3. Surface-aligned placement

**Problem.** Objects must sit flush against arbitrary geometry, at any orientation.

**Pattern.** Build an orthonormal basis from the surface normal and derive rotation from it
**[mod-script]**:

```php
// axis 1: the surface normal, from the deploy raycast
// axis 2: a tangent — player facing on flat ground, else the cross with world up
%playerVector = vectorNormalize(-1 * getWord(%plyr.getEyeVector(),1)
                              SPC getWord(%plyr.getEyeVector(),0) SPC "0");

if (vAbs(floorVec(%item.surfaceNrm,100)) $= "0 0 1")
   %item.surfaceNrm2 = %playerVector;
else
   %item.surfaceNrm2 = vectorNormalize(vectorCross(%item.surfaceNrm,"0 0 1"));

// axis 3: completes the frame
%item.surfaceNrm3 = vectorCross(%item.surfaceNrm,%item.surfaceNrm2);

%rot = fullRot(%item.surfaceNrm,%item.surfaceNrm2);
%deplObj.setTransform(%item.surfacePt SPC %rot);
```

The flat-surface special case is the subtle part: when the normal is world-up, the cross product with
world-up is degenerate, so it falls back to **player facing**. That is why orientation follows your view
on the ground and the surface everywhere else.

`floorVec(%vec,100)` quantises before comparing — floating-point normals are never exactly `0 0 1`.

**Reuse.** Any mod placing objects against walls, ceilings or slopes — decals, mounted equipment, wall
turrets. The vanilla helpers `posFromRaycast` and `normalFromRaycast` already give you the point and
normal ([Turrets and deployables](../03-content-recipes/turrets-and-deployables.md#useful-helpers)).

---

## 4. Fit-to-gap measurement (`rayDist`)

**Problem.** Size an object to exactly fill the space in front of it.

**Pattern** **[mod-script]**:

```php
function rayDist(%vecs,%sizes,%mask,%obj) {
   if (!%mask) %mask = -1;
   %obj   = mAbs(%obj);
   %start = getWords(%vecs,0,2);
   %dir   = vectorNormalize(getWords(%vecs,3,5));
   %min = getWord(%sizes,0);  %norm = getWord(%sizes,1);  %max = getWord(%sizes,2);
   %endPos = vectorAdd(%start,vectorScale(%dir,%max));

   %res = containerRayCast(%start, %endPos, %mask, %obj);
   if (%res) {
      if (%res.getType() & $TypeMasks::TerrainObjectType)
         %res = containerRayCast(vectorAdd(%start,"0 0 0.1"), %endPos, %mask, %obj);   // ← nudge
      if (%res > 0) %dist = vectorDist(%start,getWords(%res,1,3));
   }
   if (%dist <= 0)   %dist = %norm;      // nothing hit → default
   if (%dist < %min) %dist = %min;       // clamp
   return %dist;
}
```

Three details worth copying:

- **The terrain re-cast.** A ray starting on terrain immediately hits it, so on a terrain hit the cast is
  retried from 0.1 above. Without this, ground-started measurements always return zero.
- **`%obj` exemption** so the caster does not measure itself.
- **Three-value contract** — `min default max` — so "nothing found" is a sensible default rather than a
  failure.

**Reuse.** Auto-sizing anything, clearance checks before placement, working out whether a corridor is wide
enough, ranging weapons.

---

## 5. Two-axis fitting with recentring (`pad`)

`rayDist` extended to a plane: measure along the normal, then left and right, and return **scale,
position and rotation** together **[mod-script]**:

```php
%height = rayDist(%start1 SPC %dir1,%sizes,%mask,%obj);
%start2 = vectorAdd(vectorScale(%dir1,%height/2),%start1);
%right  = rayDist(%start2 SPC %dir2,%sizes,%mask,%obj);
%left   = rayDist(%start2 SPC vectorScale(%dir2,-1),%sizes,%mask,%obj);

if ((%left + %right) > getWord(%sizes,2)) {          // clamp, splitting the excess
   %lef   = %left;
   %left  = %left -(((%left+%right)-getWord(%sizes,2))/2);
   %right = %right-(((%lef +%right)-getWord(%sizes,2))/2);
}
%scale = %height SPC (%left+%right) SPC getWord(%sizes,0);
…
return %scale SPC vectorAdd(%TotalMove,%start1) SPC %rotation;
```

Two ideas generalise:

- **Measure from the midpoint.** The sideways rays start at `height/2`, not at the surface, so the width
  is measured across the middle of the object rather than at its base.
- **A `%center` argument** corrects for models whose origin is not their centre — a per-datablock offset
  applied as `vectorScale(%dir, %scale * getWord(%center,n))`. Every shape has a different origin; this is
  how you cope without re-exporting art.

Returning `scale SPC position SPC rotation` as one string is the idiomatic TorqueScript multi-return
([TorqueScript](../02-engine-model/torquescript.md#the-three-level-string-data-model)).

---

## 6. Chat commands by name construction

**Problem.** You need an open-ended command surface. `eval()` is the obvious answer and the wrong one.

**Pattern** **[mod-script]**:

```php
function chatcommands(%sender, %message) {
   %cmd   = getWord(%message,0);
   %cmd   = stripChars(%cmd,"/");
   %args  = getWords(%message,1);
   %cmd   = "cc" @ %cmd;
   if (%cmd $= "ccopen") %cmd = "ccopendoor";     // alias
   call(%cmd,%sender,%args);
}
```

Prefix the typed word, then `call()` it. **Defining `function cc<name>(%sender,%args)` creates the
command** — no registry, no switch, no `eval`.

**Why the prefix matters.** It namespaces the dispatch. Without `cc`, typing `/delete` would `call()`
straight into an engine function. The prefix confines reachable names to ones you deliberately defined.

**Failure modes.**
- **Validate the caller.** Anything typed in chat reaches the server
  ([Text and messaging](../04-interface/text-and-messaging.md#chat)); check `%sender` is allowed before
  acting.
- **`call()` on an undefined name logs a console error.** Guard, or accept the noise for typos.
- Never build the callee name from unsanitised argument text — only from the first word, prefixed.

[QuantiumX](../45-quantiumx/README.md) took this furthest — `/objectscale 2 2 4`, `/objectscale get`,
`/objectscale x x 4` where `x` means "leave this axis alone" **[mod-script]**. That ergonomics is only
available with a text interface. MooCon layered `/help` and `/door help` on the same shape.

---

## 7. Reverse-deploy tables

**Problem.** Undo. Given a placed object, recover the item that placed it.

**Pattern** — a lookup keyed on datablock name **[mod-script]**:

```php
$ReverseDeployItem[DeployedStationInventory] = InventoryDeployable;
$ReverseDeployItem[TurretDeployedOutdoor]    = TurretOutdoorDeployable;
$ReverseDeployItem[DeployedEnergizer]        = EnergizerDeployable;
$ReverseDeployItem[DeployedSpine]            = "poof spineDeployable";
$ReverseDeployItem[Deployedfloor]            = "poof floorDeployable";
$ReverseDeployItem[Deployedmspinering]       = "poof nothing";
```

The `"poof "` prefix marks pieces that deconstruct with an effect instead of returning inventory, and
`"poof nothing"` marks composite parts that vanish with their parent.

**Reuse.** Any mod where the player creates world objects — a pickup/undo tool costs one table and one
raycast.

**Failure mode, seen in the wild.** A deployable added without its entry **cannot be removed**. Metallic
1.4 shipped exactly this bug and documented the symptom **[mod-script]**:

> *"Objective pack currently not working (can't remove it with the tool either)"*

---

## 8. Ownership that outlives the session

**Problem.** Player-created objects persist across disconnects. Client IDs do not.

**Pattern** — key on account GUID, and resolve lazily **[mod-script]**:

```php
function GameBase::setOwner(%obj,%plyr,%client,%guid) {
   if (!%client) %client = %plyr.client;
   if (!%guid)   %guid   = %client.guid;
   %obj.owner    = %client;
   %obj.ownerGUID = %guid;
}

function GameBase::getOwner(%obj) {
   if (isObject(%obj.owner)) return %obj.owner;      // live client, fast path
   %guid = %obj.ownerGUID;
   if (!%guid) %guid = %obj.lTarget.ownerGUID;       // fall back to composite parents
   if (!%guid) %guid = %obj.lMain.ownerGUID;
   if (%guid) {
      %count = ClientGroup.getCount();
      for (%i=0;%i<%count;%i++) {
         %client = ClientGroup.getObject(%i);
         if (%client.guid == %guid) return %client;   // rejoined under a new client ID
      }
   }
   return "";
}
```

Three things to copy: the **live-object fast path**, the **fallback up the composite chain** (`lTarget`,
`lMain`) so a sub-part inherits its parent's owner, and the **GUID re-scan** so a reconnecting player
regains ownership.

The GUID is also what makes bulk cleanup possible — 0.68a added an admin action to remove all deployables
whose owner has left **[mod-script]**.

**Reuse.** Anything persistent and player-attributable. Note `%client.guid` is only meaningful with an
authenticated account ([07 · Community Patches](../07-community-patches/README.md)).

---

## 9. Frequency-and-radius linking

**Problem.** Link objects spatially without wiring or explicit references.

**Pattern** **[mod-script]**:

```php
function genLinkedObj(%powerObj,%obj) {
   if (%obj.powerFreq == %powerObj.powerFreq) {
      if (vectorDist(%obj.getPosition(),%powerObj.getPosition()) < %powerObj.getDataBlock().powerRadius
      …
}

function genPoweringObj(%powerObj,%obj) {
   if (isObject(%powerObj))
      if (%powerObj.isEnabled() && %powerObj.isPowered())
         if (genLinkedObj(%powerObj,%obj)) return true;
   return false;
}
```

with a maintained `$PowerList` of sources, and a per-object count refreshed on placement **[mod-script]**:

```php
function checkPowerObject(%obj) {
   if (%obj.getDataBlock().needsPower) {
      … count how many sources in $PowerList are powering %obj …
      %obj.powerCount = %powerCount;
      doObjectPower(%obj);
   }
}
```

**Frequency is stamped at creation** from the placing player — `%deplObj.powerFreq = %plyr.powerFreq`
**[mod-script]** — so grouping is a property the builder chooses, not a link they draw.

**Reuse.** Teleporter pairing (Construction uses 40 frequencies the same way), switch-to-door binding,
sensor networks, team-scoped effects. It is O(sources × objects) so keep the source list small and
recompute on change, not per tick.

---

## 10. Serialising objects as generated script

**Problem.** Persist player-built structures. `SimObject::save()` writes everything, for whole subtrees,
in engine-defined form ([SimObjects and namespaces](../02-engine-model/simobject-and-namespaces.md)).
Sometimes you need control.

**Pattern** — emit TorqueScript `new` statements yourself and `exec()` them back **[mod-script]**:

```php
%buildingPiece = "%building = new (" @ %obj.getClassName() @ ") () {";
%buildingPiece = %buildingPiece @ "datablock = \"" @ %dataBlockName @ "\";";
if (%obj.position  !$= "") %buildingPiece = %buildingPiece @ "position = \""  @ %obj.position  @ "\";";
if (%obj.rotation  !$= "") %buildingPiece = %buildingPiece @ "rotation = \""  @ %obj.rotation  @ "\";";
if (%obj.realScale !$= "") %buildingPiece = %buildingPiece @ "scale = \""     @ %obj.realScale @ "\";";
if (%obj.team      !$= "") %buildingPiece = %buildingPiece @ "team = \""      @ %obj.team      @ "\";";
if (%obj.ownerGUID !$= "") %buildingPiece = %buildingPiece @ "ownerGUID = \"" @ %obj.ownerGUID @ "\";";
…
```

Roughly thirty conditional field writes, an **allow-list** of saveable datablocks via
`saveBuildingCheck()`, and **composite skipping** so parents recreate their parts **[mod-script]**:

```php
if (%dataBlockName $= "DeployedMSpineRing") return;   // Handled by DeployedMSpine
if (%dataBlockName $= "TelePadBeam")        return;   // Handled by TelePadDeployedBase
if (%dataBlockName $= "DeployedLTarget")    return;   // Handled by parent object
```

**When to hand-roll instead of `save()`:** you need a subset of fields, an allow-list of types, composite
awareness, or a stable on-disk format you control. **When not to:** anything else — `save()` walks the real
field tables in C++ and you cannot match it for completeness.

**The obligation this creates.** Once players have hours invested, the save format is a compatibility
contract. MooCon is the only fork that shipped a converter (`Updates/SaveFileConverter.cs`)
**[mod-script]**. Version your format from day one.

---

## 11. Extending a validation framework instead of replacing it

Vanilla's deployable tests are overridable `ShapeBaseImageData::testXxx` methods whose base versions are
deliberate no-ops
([Turrets and deployables](../03-content-recipes/turrets-and-deployables.md#the-placement-tests)).

Construction keeps every one and adds its own **[mod-script]**:

```php
function ShapeBaseImageData::testInventoryTooClose(%item, %plyr)
function ShapeBaseImageData::testTurretTooClose(%item, %plyr)
function ShapeBaseImageData::testSurfaceTooNarrow(%item, %surface)
```

then narrows per deployable, exactly as vanilla does:

```php
function TurretIndoorDeployableImage::testTurretTooClose(%item, %plyr)  { … }
function DiscTurretDeployableImage::testTurretTooClose(%item, %plyr)    { … }
function TurretMissileRackDeployableImage::testTurretTooClose(%item, %plyr) { … }
```

Individual packs opt out by returning empty **[mod-script]**:

```php
function spineDeployableImage::testObjectTooClose(%item) { return ""; }
```

— building pieces *must* be placeable adjacent to each other, so the base game's anti-clustering rule is
disabled for them specifically.

**The pattern:** when the engine gives you a hook set, add hooks in the same shape rather than writing a
parallel system. Anything downstream that understands the vanilla framework then understands yours.

---

## 12. The geometry library

`do_not_delete/Dfunctions.cs` — 1431 lines, credited to **DynaBlade** **[mod-script]** — is a complete 3D
toolkit in TorqueScript, and the single most portable asset in this family. It depends on nothing
Construction-specific.

| Group | Functions |
|---|---|
| Vector | `vAbs`, `vlev`, `vectorright`, `vectorproject`, `vectorcouple`, `vectorangle`, `vectormultiply`, `vectordescale`, `floorvec` |
| Rotation | `getrot`, `setrot`, `setrot2`, `rotAdd`, `invrot`, `rotfromnrm`, `slopfromnrm`, `slopeRot`, `intRot`, `fullrot`, `rotatenormal`, `rotatedot`, `realrot`, `virrot`, `remoteRotate` |
| Object geometry | `realSize`, `isCubic`, `realvec`, `virvec`, `getface`, `invface`, `getfacesize`, `topface` |
| Placement | `rayDist`, `pad`, `link`, `sidelink`, `cubefix`, `vircubefix`, `pullaxis`, `pullobject` |
| Animation | `DynamicRotate`, `DynamicRotate2`, `DynamicScale` |
| Structure | `rotateSection`, `checkAfterRot`, `adjustTrigger`, `adjustLMain` |
| Lists | `createList`, `listAdd`, `listReplace`, `listDel`, `listSort`, `listBuild`, `findWord` |

Three worth singling out:

- **`vectormultiply(%vec1,%vec2)`** — componentwise multiply. Vanilla has `vectorScale` (by a scalar) but
  no per-axis scale, and you need it constantly for non-uniform sizing.
- **`realSize(%obj)` / `realvec` / `virvec`** — convert between an object's local ("virtual") space and
  world ("real") space accounting for its scale. Essential once objects are non-uniformly scaled, which in
  Construction they always are.
- **`link` / `sidelink` / `cubefix`** — snapping a face of one object to a face of another, which is what
  makes pieces align when stacked.

**Provenance.** DynaBlade is also a [tutorial author](../90-reference/source-tutorial-index.md) and
co-credited on `saveBuilding.cs`. The library predates the mod and was written to be shared.

---

## Anti-patterns

Also visible in this family, and worth not copying.

| Anti-pattern | Where | Cost |
|---|---|---|
| Shadowing 27 base files for a fork that is not a total conversion | Most of 41–48 | Nothing merges; the ecosystem became a fork tree ([What it changed](what-it-changed.md#the-shadowing-strategy)) |
| Rewriting instead of extending | [QuantiumX](../45-quantiumx/README.md), 8 % of base intact | Base documentation stops applying; no fix can be ported in |
| Shipping `.cs` and `.dso` together | [c2kconstruction](../48-c2k-construction/README.md), 520 `.dso` : 218 `.cs` | Edits are silently inert; three DSO-deleter batch files shipped as a workaround |
| Inconsistent table offsets | `getWords(%line,3,…)` for spine, `6` for mspine | Silent label corruption |
| Leaving disabled experiments in the tree | `truPhysics.cs`, `putback/` | Every fork inherits the confusion |
| Not updating the inherited readme | QuantiumX ships base Construction's readme at 8 % similarity | Readers trust the wrong document |
| Four incompatible economies | MooCon, QuantiumX, Ultimate Build, CCM | Same problem solved four times, shared zero times |

The last is the one to sit with. Four teams, one base mod, the same conclusion — a persistent building
server needs an economy — and four implementations that cannot be combined. **MooCon's add-on system**
([42 · MooCon](../42-moocon/README.md#the-add-on-system)) is the only structural answer anyone in this
family built, and it arrived late.

## Related

- [Playing Construction](playing.md) — these mechanisms from the player's side
- [Building systems](building-systems.md) — the piece inventory and the extension checklist
- [What it changed](what-it-changed.md) — the architecture that constrains all of it
- [02 · Engine Model](../02-engine-model/README.md) — the engine surface every one of these builds on
