# 16 · Shipping a map

Wiring a map to a gametype, and getting it onto other people's machines.

## The headers the editor does not write

**Save Mission writes the object tree. It does not write the metadata comments.** You add those by hand,
above the `//--- OBJECT WRITE BEGIN ---` marker, or the map is invisible.

```php
// MissionTypes = CTF
// DisplayName = Slapdash

//--- MISSION QUOTE BEGIN ---
//Thunder is good, thunder is impressive; but it is lightning that does the work.
//  -- Mark Twain
//--- MISSION QUOTE END ---

//--- MISSION STRING BEGIN ---
//[CTF]400 points to win
//[CTF]Flag located outside base
//Vehicle-centric mission
//High visibility
//--- MISSION STRING END ---

//--- OBJECT WRITE BEGIN ---
new SimGroup(MissionGroup) { … };
```

| Line | Parsed by | Consequence if missing |
|---|---|---|
| `// MissionTypes = CTF DM Hunters` | `buildMissionList()` | **The map never appears in any host menu** |
| `// DisplayName = Slapdash` | `buildMissionList()` | Menu shows the raw filename |
| `MISSION QUOTE` block | Loading screen | No flavour text |
| `MISSION STRING` block | Loading screen | No briefing; `[CTF]` prefix scopes a line to one gametype |

The match is on exact prefixes — `"// MissionTypes = "` is 18 characters, `"// DisplayName = "` is 17
**[script]**. One space either side of the `=`.

Because the editor rewrites everything inside the OBJECT WRITE block, **put the headers above it and they
survive re-saves**.

## Object naming conventions

Gametype code finds mission objects **by name**, using `nameToID()`. If you are authoring a map for a stock
gametype, the names are a contract.

From `Slapdash.mis` **[script]**:

```
Team1generatorLarge1    Team1flag1          Team1StationInventory1
Team1SensorMediumPulse1 Team1StationInventory2  Team1generatorLarge2
team1vehiclestation
```

with the structural grouping:

```
MissionGroup
├── MissionArea, Sun, TerrainBlock, NavigationGraph, Sky
├── RandomOrganics
└── Teams
    ├── Team1
    │   ├── spawnspheres  →  SpawnSphere ×n
    │   └── base0         →  generators, flags, stations, sensors, interiors
    └── Team2
```

The pattern is `Team<N><ObjectType><Index>`. Classic's `minivstationx.cs` relies on it directly
**[script]**:

```php
nametoid(team1vehiclestation).station.setTransform("-180.737 264.173 73.9045 0 0 -0.999913 0.0206931");
```

**Deviate from the naming and stock gametypes will not find your objects.** Build the group structure with
the World Editor's instant group ([12 · World Editor](../12-world-editor/README.md#the-tree-and-the-instant-group))
rather than fixing it afterwards.

## Per-map gametype settings

`MissionGroup`'s own dynamic fields carry per-map configuration, prefixed by gametype **[script]**:

```php
new SimGroup(MissionGroup) {
   musicTrack = "lush";
   CTF_scoreLimit = "4";
   cdTrack = "2";
   CTF_timeLimit = "25";
   powerCount = "0";
```

Add these through the Inspector's **Dynamic Fields Add** button
([12 · World Editor](../12-world-editor/README.md#the-inspector)). A map supporting several gametypes
carries a set per type.

**If you are writing a gametype, this is your configuration surface** — read
`MissionGroup.<Type>_<setting>` and document the field names so mappers can set them.

## `cleanNonType` — one file, several gametypes

`loadMissionStage2` calls **[script]**:

```php
MissionGroup.cleanNonType($CurrentMissionType);
```

which removes objects that do not belong to the current gametype. That is how one `.mis` supports several
types from a single object tree — tag objects for a gametype and they are stripped when a different one
loads.

## What has to reach the client

This is where map distribution differs sharply from script modding. **Datablocks are transmitted to
clients; map files are not** ([Datablocks](../02-engine-model/datablocks.md#datablocks-are-transmitted-to-clients)).

| File | Client needs it? |
|---|---|
| `.mis` | **Yes** — clients load their own copy |
| `.ter` | **Yes** |
| `.dif` interiors | **Yes**, if not stock |
| Terrain textures, `.dml` | **Yes**, if not stock |
| `<Name>_<crc>.ml` lightmaps | **Yes** — keyed to the mission CRC |
| `.nav` | **Server only** — bots run server-side |
| `.spn` | **Yes** |

So a custom map is a **client-side download**, unlike a server-side gameplay mod. Plan for it: either
distribute a package players install, or rely on the QoL patch's `enableAssetDownloads`
([Packaging](../06-shipping/packaging.md#under-the-community-patches)) — which is user-toggleable, so ship
a package regardless.

## Packaging

Mirror the base layout inside your mod or a `.vl2`:

```
MyMaps/
├── missions/
│   └── CanyonRun.mis
├── terrains/
│   ├── CanyonRun.ter
│   ├── CanyonRun.nav
│   └── CanyonRun.spn
├── lighting/
│   └── CanyonRun_<crc>.ml
├── interiors/          (if custom)
└── textures/terrains/  (if custom)
```

Then zip it as a `.vl2` ([Packaging](../06-shipping/packaging.md#building-a-vl2)) — standard PKZIP, no
compression required.

Clear stale `_<crc>.ml` files first; iterating on a mission leaves a trail of dead lightmaps.

## Testing checklist

| Test | Catches |
|---|---|
| Map appears in the host menu | Missing or malformed `// MissionTypes = ` |
| Each declared gametype actually loads | Objects the gametype needs but the map lacks |
| **Bots enabled** | Missing or stale `.nav` |
| A **second client** connects | Missing client-side assets — the failure mode you cannot see when hosting |
| Play to a **mission change** | Objects leaking, or spawn logic that only works on first load |
| Walk the boundary | Undefined or wrong `MissionArea` |
| Check footstep audio on each surface | Terrain material sound types ([14](../14-terrain-texturing/README.md#custom-terrain-materials-in-a-mod)) |
| Fly to the ceiling | `flightCeiling` set sensibly |

The second-client test is the one people skip and the one that matters most for maps, because every asset
resolution problem is invisible to the host.

## Distribution notes

State in your readme:

- Which **gametypes** the map declares.
- Whether it needs a **mod** (a map for a Construction fork is not a vanilla map).
- Whether **bots** are supported — i.e. whether you shipped a `.nav`.
- Which **custom assets** are included, and that clients need them.

Maps for a specific mod belong with that mod. Several Construction forks ship their own map sets —
CCM's `ConFortWars` series and TCCM's `TCCMBattlegrounds` **[mod-script]** — and those maps declare
gametypes that only exist in those mods.

## Related

- [10 · Mapping](../10-mapping/README.md) — the workflow this concludes
- [15 · Lighting, navigation & spawn data](../15-lighting-nav-spawn/README.md) — generating what you ship
- [Missions](../05-gameplay-systems/missions.md) — the `.mis` format in full
- [Gametypes](../05-gameplay-systems/gametypes.md) — what a gametype expects from a map
- [Packaging](../06-shipping/packaging.md) — `.vl2` building and distribution
