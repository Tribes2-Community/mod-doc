# 43 · CCM

A **combat/construction hybrid**. Where base Construction treats combat as a mode you switch off, CCM
adds combat gametypes, a rank system, a large vehicle roster, and ships its own battle maps. The building
tools remain; the point of building changes.

| | |
|---|---|
| Base | **Construction 0.69a** |
| Scripts | 166 `.cs` — 37 identical to base (34 %), 55 changed, 74 new, 18 removed |
| Size | 206 files, 6.7 MB |
| Installs as | `GameData/Construction/` |
| Sibling | [46 · TCCM](../46-tccm/README.md) — 78 % identical to CCM |

## What it added

### Combat gametypes

The clearest signal of intent — CCM ships gametypes alongside `ConstructionGame.cs` **[mod-script]**:

```
ArenaGame.cs
CTFGame.cs
```

Both load through the vanilla `scripts/*Game.cs` auto-discovery glob that base Construction preserves
([Gametypes](../05-gameplay-systems/gametypes.md)) — no registration needed, drop the file in and it
appears in the host menu. CTF *on player-built terrain* is a genuinely different game from either
Construction or vanilla CTF.

### A vehicle roster

Fifteen-plus new vehicles, well beyond the base six **[mod-script]**:

```
vehicle_Helicopter.cs      vehicle_HeavyHelicopter.cs   vehicle_gunship.cs
vehicle_boat.cs            vehicle_sub.cs               vehicle_AWACS.cs
vehicle_HeavyTank.cs       vehicle_CGTank.cs            Vehicle_strikefighter.cs
vehicle_spec_fx.cs
```

Note `vehicle_boat.cs` and `vehicle_sub.cs` — water vehicles, which vanilla Tribes 2 does not have. The
three vehicle physics types (`FlyingVehicleData`, `HoverVehicleData`, `WheeledVehicleData`) are fixed and
cannot be extended ([Vehicles](../03-content-recipes/vehicles.md)), so a boat is a hover vehicle tuned for
water and a submarine is the same trick pointed downward. Whether that works well is a separate question;
that it is the only available route is not.

### Ranks and AI

```
RankStuff.cs        persistent rank progression
DroneAI.cs          custom AI
aiInventory.cs      AI loadout knowledge
aiDefaultTasks.cs   AI task overrides
```

`aiInventory.cs` is the important one. It is the file the base game warns about
([AI and bots](../05-gameplay-systems/ai-bots.md)) — bots do not know how to use a weapon until it is
described there. A fork adding this many weapons and vehicles **has** to touch it or the bots carry the
new content and never use it.

### Weapons

```
weapons/allweapons.cs      weapons/RPchaingun.cs      weapons/modifiertool.cs
```

`RPchaingun.cs` — the "RP" prefix marks the role-play direction several forks in this family took.

### Its own maps

CCM ships `missions/` and `terrains/` directories — most forks ship neither **[mod-script]**:

```
Beach.mis                          BeachStorm.mis
CityArena.mis                      ConFortWarsV2005.mis
ConFortWarsV2005_Night.mis         ConstructionFortWarsV2004.mis
ConstructionFortWarsV2004night.mis
```

"Construction Fort Wars" is the mod's thesis in a filename: build a fort, then fight over it. The
day/night variants of the same map show real map-making effort rather than one-off test levels.

Shipping missions means shipping `.mis` files with `// MissionTypes = ` headers that name CCM's own
gametypes ([Missions](../05-gameplay-systems/missions.md)). It also means **clients need the maps** —
mission files are not transmitted like datablocks are
([Datablocks](../02-engine-model/datablocks.md#datablocks-are-transmitted-to-clients)).

## Relationship to TCCM

CCM and [TCCM](../46-tccm/README.md) are **78 % identical** at file level. The differences are small:

| | Present in |
|---|---|
| `Buildingstuff.cs`, `TCCM.cs`, `neededfunctions.cs`, `vehicles/vehicle_transTruck.cs` | TCCM only |
| `vehicles/vehicle_CGTank.cs` | CCM only |
| `ConFortWars*` map set | CCM |
| `TCCMBattlegrounds1/2` map set | TCCM |

They are the same project at different points, or a rename with divergence. **TCCM installs under its own
name** rather than as `Construction/` — the only fork in this family that does — which makes it the one
you can have installed alongside another.

## What it removed

18 base files gone, 55 changed. CCM is a **heavy fork**: only a third of 0.69a survives untouched. Adding
combat gametypes to a mod built around switching combat off means reworking scoring, spawning, damage, and
team handling, and the diff reflects that.

## For someone working on it

- **Combat changes are in the gametypes**, not in the shadowed base files. Look at `ArenaGame.cs` and
  `CTFGame.cs` first, and use the `package <Type>Game` convention
  ([Gametypes](../05-gameplay-systems/gametypes.md#the-package-convention)) so your changes scope to one
  mode.
- **Register new content with `aiInventory.cs`** or bots will ignore it.
- **New maps need `// MissionTypes = ` headers** naming CCM's gametypes, or they will not appear.
- The deployable checklist in
  [Building systems](../40-construction-mod/building-systems.md#extending-a-construction-fork) applies
  unchanged.

## Related

- [46 · TCCM](../46-tccm/README.md) — the sibling
- [40 · The Construction Mod](../40-construction-mod/README.md) — the 0.69a base
- [Gametypes](../05-gameplay-systems/gametypes.md) — the mechanism CCM's combat modes use
- [Vehicles](../03-content-recipes/vehicles.md) — the three fixed physics types
