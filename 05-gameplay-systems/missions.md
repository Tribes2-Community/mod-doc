# Missions

A `.mis` file is TorqueScript, like a `.gui`. It is a single nested `new SimGroup(MissionGroup)`
declaration containing every object in the level, preceded by a block of metadata comments that the engine
parses as data.

## The header comments

From `missions/Slapdash.mis` **[script]**:

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
new SimGroup(MissionGroup) {
   …
};
```

| Line | Parsed by | Effect |
|---|---|---|
| `// MissionTypes = CTF DM Hunters` | `buildMissionList()` | Which gametypes this map supports — space-separated |
| `// DisplayName = Slapdash` | `buildMissionList()` | Menu name, overriding the filename |
| `MISSION QUOTE` block | Loading screen | Flavour text |
| `MISSION STRING` block | Loading screen | Per-gametype briefing lines; a `[CTF]` prefix restricts a line to that gametype |

`buildMissionList` scans every `.mis` on the mod path stack and builds the type list from these comments
**[script]**:

```php
function buildMissionList()
{
   %search = "missions/*.mis";
   …
   for( %file = findFirstFile( %search ); %file !$= ""; %file = findNextFile( %search ) )
   {
      %name = fileBase( %file );
      …
      while ( !%fobject.isEOF() )
      {
         %line = %fobject.readLine();
         if ( getSubStr( %line, 0, 17 ) $= "// DisplayName = " )
            $HostMissionName[%idx] = getSubStr( %line, 17, 1000 );
         else if ( getSubStr( %line, 0, 18 ) $= "// MissionTypes = " )
         {
            %typeList = getSubStr( %line, 18, 1000 );
            break;
         }
      }
      %fobject.close();

      // Don't include single player missions:
      if ( strstr( %typeList, "SinglePlayer" ) != -1 )
         continue;

      // Test to see if the mission is bot-enabled:
      %navFile = "terrains/" @ %name @ ".nav";
      $BotEnabled[%idx] = isFile( %navFile );

      for( %word = 0; ( %misType = getWord( %typeList, %word ) ) !$= ""; %word++ )
      {
         for ( %i = 0; %i < $HostTypeCount; %i++ )
            if ( $HostTypeName[%i] $= %misType )
               break;
         if ( %i == $HostTypeCount )
         {
            $HostTypeCount++;
            $HostTypeName[%i] = %misType;
            $HostMissionCount[%i] = 0;
         }
         %ct = $HostMissionCount[%i];
         $HostMission[%i, $HostMissionCount[%i]] = %idx;
         $HostMissionCount[%i]++;
      }
   }
   getMissionTypeDisplayNames();
}
```

Three consequences worth internalising:

1. **The gametype list is built from the missions, not the other way round.** A gametype with no mission
   declaring it never appears in the host menu, even if `scripts/RaceGame.cs` exists and loaded fine. This
   is the usual reason a new gametype "doesn't show up".
2. **The exact prefix matters** — `"// MissionTypes = "`, 18 characters, one space either side of `=`.
3. **Bot support is inferred from a file's existence**: `$BotEnabled[%idx] = isFile("terrains/" @ %name @ ".nav")`.
   No nav graph means no bots on that map. See [AI and bots](ai-bots.md).

## The object tree

125 objects in Slapdash **[script]**, nested in `SimGroup`s:

```
MissionGroup
├── MissionArea          play boundary and flight ceiling
├── Sun                  lighting and lens flare
├── TerrainBlock         the terrain, references Slapdash.ter
├── NavigationGraph      references Slapdash.nav
├── RandomOrganics       SimGroup of vegetation clusters
├── Sky                  skybox and fog
└── Teams
    ├── Team1
    │   ├── spawnspheres
    │   │   └── SpawnSphere ×n
    │   └── base0
    │       ├── StaticShape(Team1generatorLarge1)
    │       ├── Item(Team1flag1)
    │       ├── InteriorInstance ×n
    │       ├── StaticShape(Team1StationInventory1)
    │       ├── StaticShape(Team1SensorMediumPulse1)
    │       └── …
    └── Team2
        └── …
```

### `MissionGroup`'s own fields carry gametype settings

```php
new SimGroup(MissionGroup) {
   musicTrack = "lush";
   CTF_scoreLimit = "4";
   cdTrack = "2";
   CTF_timeLimit = "25";
   powerCount = "0";
   …
```

**Per-gametype settings are prefixed with the gametype name** — `CTF_scoreLimit`, `CTF_timeLimit`. A map
supporting several types carries a set for each. Your gametype reads them the same way:
`MissionGroup.Race_lapCount`.

### The objects you will place

| Class | Purpose |
|---|---|
| `MissionArea` | Play boundary + `flightCeiling` |
| `TerrainBlock` | The terrain — `terrainFile`, `squareSize`, `detailTexture`, `visibleDistance`, `hazeDistance` |
| `Sun` | Direction, colour, ambient, lens flare textures |
| `Sky` | Skybox, fog, cloud layers |
| `NavigationGraph` | `GraphFile` pointing at the `.nav` |
| `InteriorInstance` | A `.dif` building |
| `StaticShape` | Generators, stations, sensors, turret bases — anything with a `StaticShapeData` |
| `Item` | Flags, deployed items |
| `SpawnSphere` | Spawn area — position, radius, weight |
| `Trigger` | Volume triggers, dispatched via `Game.onEnterTrigger` |
| `WaterBlock` | Water volumes |
| `AudioEmitter` | Ambient positional sound |
| `Marker` / `Path` | Waypoints for moving objects |
| `SimGroup` | Organisation — `Teams`, `Team1`, `base0`, `spawnspheres` |

### Naming conventions the scripts rely on

`Team1flag1`, `Team1generatorLarge1`, `Team1StationInventory1`, `team1vehiclestation` — the gametype and
support scripts find mission objects **by name**, using `nameToID()`:

```php
nametoid(team1vehiclestation).station.setTransform("…");
```

That is from `Classic/scripts/autoexec/minivstationx.cs` **[script]**. If you author a mission for a stock
gametype, follow the naming convention exactly or the gametype will not find your objects.

## Loading

The mission is executed as a script by `loadMissionStage2` **[script]**:

```php
%file = "missions/" @ $missionName @ ".mis";
if(!isFile(%file))
   return;

// send the mission file crc to the clients (used for mission lighting)
$missionCRC = getFileCRC(%file);
%count = ClientGroup.getCount();
for(%i = 0; %i < %count; %i++)
{
   %client = ClientGroup.getObject(%i);
   if(!%client.isAIControlled())
      %client.setMissionCRC($missionCRC);
}

$countDownStarted = false;
exec(%file);
$instantGroup = MissionCleanup;

// pre-game mission stuff
if(!isObject(MissionGroup))
{
   error("No 'MissionGroup' found in mission \"" @ $missionName @ "\".");
   schedule(3000, ServerGroup, CycleMissions);
   return;
}

MissionGroup.cleanNonType($CurrentMissionType);

// construct paths
pathOnMissionLoadDone();
```

Two things happen here that matter to a mission author:

- **`getFileCRC(%file)` is sent to clients** and used for mission lighting. Editing a `.mis` invalidates
  cached lightmaps.
- **`MissionGroup.cleanNonType($CurrentMissionType)`** deletes objects that do not belong to the current
  gametype. This is how one `.mis` supports several types — objects can be tagged for a specific type and
  are removed when a different one loads.

## Companion files

A mission is not one file:

| File | Location | Purpose |
|---|---|---|
| `<Name>.mis` | `missions/` | The object tree |
| `<Name>.ter` | `terrains/` | The heightfield |
| `<Name>.nav` | `terrains/` | AI navigation graph |
| `<Name>.spn` | `terrains/` | Terrain spawn/placement data |
| `<Name>_<crc>.ml` | `lighting/` | Generated lightmaps |
| `.dif` interiors | `interiors/` | Referenced buildings |

Nav and spawn data are **generated**, not authored, via launch modes **[script]**:

```bash
Tribes2.exe -navBuild <MissionName> <MissionType>
```

```bash
Tribes2.exe -spnBuild <MissionName> <MissionType>
```

and lighting via:

```bash
Tribes2.exe -light <MissionName>
```

All three set `$Host::Dedicated = true`, enable the Windows console, and call `CreateServer()` directly
**[script]**. See [Launch options](../01-getting-started/launch-options.md).

## The in-game mission editor

Tribes 2 ships a full editor. `scripts/editor.cs`, `editorGui.cs`, `editorRender.cs`, `editorProfiles.cs`,
and `pathEdit.cs` implement it; `help/` in `scripts.vl2` holds eight `.hfl` help documents for it.

It is reachable in-game and it is how the shipped missions were built — the `//--- OBJECT WRITE BEGIN ---`
marker is its signature. Workflow:

1. Start a mission with your gametype.
2. Open the editor, place and configure objects.
3. Save into `MyMod/missions/<Name>.mis`.
4. Add the `// MissionTypes = ` and `// DisplayName = ` header lines by hand — the editor does not write
   them.
5. Run `-navBuild` if you want bot support.

> Step 4 is easy to forget and produces a mission that exists but never appears in any menu.

## Recipe: a mission for a custom gametype

Minimal header for the `RaceGame` example from [Gametypes](gametypes.md):

```php
// MissionTypes = Race
// DisplayName = Canyon Run

//--- MISSION STRING BEGIN ---
//[Race]Three laps, checkpoints in order
//Low gravity
//--- MISSION STRING END ---

//--- OBJECT WRITE BEGIN ---
new SimGroup(MissionGroup) {
   musicTrack = "desert";
   Race_lapCount = "3";

   new MissionArea(MissionArea) {
      area = "-848 -864 1264 1472";
      flightCeiling = "240";
      flightCeilingRange = "20";
   };

   new Sun(Sun) { … };
   new TerrainBlock(Terrain) { terrainFile = "CanyonRun.ter"; … };
   new Sky(Sky) { … };

   new SimGroup(Teams) {
      new SimGroup(Team1) {
         new SimGroup(spawnspheres) {
            new SpawnSphere() { position = "…"; radius = "20"; … };
         };
      };
   };

   new Trigger(checkpoint0) { position = "…"; scale = "20 20 20"; dataBlock = "…"; };
   new Trigger(checkpoint1) { position = "…"; scale = "20 20 20"; dataBlock = "…"; };
   new Trigger(checkpoint2) { position = "…"; scale = "20 20 20"; dataBlock = "…"; };
};
```

The trigger names `checkpoint0`, `checkpoint1`, … are what `RaceGame::onEnterTrigger` matches on. Build
the geometry in the editor; write the header and the trigger names by hand.

## Under the community patches

**Mission authoring is unchanged.** `.mis` syntax, the header comments, `buildMissionList()`,
`MissionGroup`, `cleanNonType`, the CRC-based lighting cache, `-navBuild` / `-spnBuild` / `-light`, and the
in-game editor all behave exactly as described.

Three small notes:

- **Custom terrain gets a fallback material.** The QoL patch registers
  `addMaterialMapping("terrain/default", "color: 0.46 0.36 0.26 0.4 0.0", "sound: 0")` at load
  **[patch-script]**, so an unmapped terrain material renders as a flat colour instead of failing. Useful
  safety net, not a licence to skip your `.dml`.
- **Mission and terrain files may reach clients via asset downloads.** `enableAssetDownloads` can deliver
  missing files on connect. User-toggleable — ship a client package regardless.
- **The terrain painter has two extra slots.** The patch extends the editor's painter from six material
  slots (0–5) to eight (0–7) **[patch-script]**. A mission painted with slots 6 or 7 will not paint
  correctly in the vanilla editor.

## Related

- [Gametypes](gametypes.md) — the `// MissionTypes = ` counterpart
- [AI and bots](ai-bots.md) — `.nav` graphs and `-navBuild`
- [Boot sequence](../02-engine-model/boot-sequence.md) — the mission load chain
- [File formats](../90-reference/file-formats.md) — `.mis`, `.ter`, `.nav`, `.dif`, `.spn`
- [07 · Community Patches](../07-community-patches/README.md) — asset downloads and editor changes
