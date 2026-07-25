# Gametypes

A gametype is a file named `scripts/<Name>Game.cs`. It is discovered automatically, instantiated as a
`ScriptObject` named `Game`, and its same-named package is activated and deactivated with the mission.
There is no registration step anywhere.

## Discovery

`CreateServer()` globs for them **[script]**:

```php
//automatically load any mission type that follows naming convention typeGame.name.cs
%search = "scripts/*Game.cs";
for(%file = findFirstFile(%search); %file !$= ""; %file = findNextFile(%search))
{
   %type = fileBase(%file); // get the name of the script
   exec("scripts/" @ %type @ ".cs");
}
```

The glob runs through the mod path stack, so `MyMod/scripts/RaceGame.cs` is found and executed with no
further work. **This is the cleanest extension point in the engine.**

The shipped set: `DefaultGame`, `CTFGame`, `DMGame`, `CnHGame`, `DnDGame`, `HuntersGame`,
`TeamHuntersGame`, `RabbitGame`, `SiegeGame`, `BountyGame`, `SinglePlayerGame`, and the five `Training*`
gametypes.

## Instantiation

`loadMissionStage2` creates the object **[script]**:

```php
if($CurrentMissionType $= "")
{
   new ScriptObject(Game) {
      class = DefaultGame;
   };
}
else
{
   new ScriptObject(Game) {
      class = $CurrentMissionType @ "Game";      // e.g. "CTFGame"
      superClass = DefaultGame;
   };
}
// allow the game to activate any packages.
Game.activatePackages();
```

So `Game.someMethod()` resolves against `CTFGame::someMethod` first, `DefaultGame::someMethod` second. See
[SimObjects and namespaces](../02-engine-model/simobject-and-namespaces.md#method-dispatch).

## The package convention

```php
function DefaultGame::activatePackages(%game)
{
   // activate the default package for the game type
   activatePackage(DefaultGame);
   if(isPackage(%game.class) && %game.class !$= DefaultGame)
      activatePackage(%game.class);
}

function DefaultGame::deactivatePackages(%game)
{
   deactivatePackage(DefaultGame);
   if(isPackage(%game.class) && %game.class !$= DefaultGame)
      deactivatePackage(%game.class);
}
```

**A package whose name matches the gametype class is activated at mission start and deactivated at
mission end.** Every shipped gametype uses it **[script]**:

```php
package CTFGame {
   function ShapeBaseData::onDestroyed(%data, %obj)
   {
      … CTF-specific scoring for destroyed objects …
   }
   …
};
```

That override only applies during a CTF mission. In a Deathmatch mission it is not in the chain at all.
This is a genuinely elegant piece of design and worth exploiting: **anything your mod should do only in
one gametype belongs in that gametype's package.**

## The file structure

A gametype file has four parts, in order:

```php
// DisplayName = Capture the Flag         ← 1. metadata comment

//--- GAME RULES BEGIN ---
//Prevent enemy from capturing your flag
//Score one point for grabbing the enemy's flag
//To capture, your flag must be at its stand
//Score 100 points each time enemy flag is captured
//--- GAME RULES END ---

//exec the AI scripts
exec("scripts/aiCTF.cs");                 ← 2. AI companion file

function CTFGame::initGameVars(%game)     ← 3. namespaced methods
{
   %game.SCORE_PER_KILL = 1;
   %game.SCORE_PER_PLYR_FLAG_CAP = 3;
   %game.SCORE_PER_TEAM_FLAG_CAP = 100;
   …
   %game.FLAG_RETURN_DELAY = 45 * 1000; //45 seconds
   %game.TIME_CONSIDERED_FLAGCARRIER_THREAT = 3 * 1000;
   %game.RADIUS_GEN_DEFENSE = 20;  //meters
}
…

package CTFGame {                          ← 4. the package
   …
};
```

### `// DisplayName = `

The first-line comment is parsed at runtime **[script]**:

```php
function getMissionTypeDisplayNames()
{
   %file = new FileObject();
   for ( %type = 0; %type < $HostTypeCount; %type++ )
   {
      $HostTypeDisplayName[%type] = $HostTypeName[%type];
      if ( %file.openForRead( "scripts/" @ $HostTypeName[%type] @ "Game.cs" ) )
      {
         while ( !%file.isEOF() )
         {
            %line = %file.readLine();
            if ( getSubStr( %line, 0, 17 ) $= "// DisplayName = " )
            {
               $HostTypeDisplayName[%type] = getSubStr( %line, 17, 1000 );
               break;
            }
         }
      }
   }
   %file.delete();
}
```

**The match is exact, on the first 17 characters** — `"// DisplayName = "` with one space after `//`, one
space either side of `=`. Get it wrong and your gametype appears in menus under its raw class name.

Without it, `RaceGame` shows as "Race". With it you can call it whatever you like.

### `initGameVars` — the tuning block

`DefaultGame::initGameVars` sets defaults; each gametype overrides it to set its own **[script]**:

```php
function CTFGame::initGameVars(%game)
{
   %game.SCORE_PER_KILL                        = 1;
   %game.SCORE_PER_SUICIDE                     = -1;
   %game.SCORE_PER_TEAMKILL                    = -1;
   %game.SCORE_PER_DEATH                       = -1;
   %game.SCORE_PER_PLYR_FLAG_CAP               = 3;
   %game.SCORE_PER_TEAM_FLAG_CAP               = 100;
   %game.SCORE_PER_TEAM_FLAG_TOUCH             = 1;
   %game.SCORE_PER_GEN_DESTROY                 = 2;
   %game.SCORE_PER_ESCORT_ASSIST               = 1;
   %game.SCORE_PER_TURRET_KILL                 = 1;
   %game.SCORE_PER_FLAG_DEFEND                 = 1;
   %game.SCORE_PER_CARRIER_KILL                = 1;
   %game.SCORE_PER_FLAG_RETURN                 = 1;
   %game.SCORE_PER_GEN_DEFEND                  = 1;
   %game.SCORE_PER_GEN_REPAIR                  = 1;

   %game.FLAG_RETURN_DELAY                     = 45 * 1000; //45 seconds
   %game.TIME_CONSIDERED_FLAGCARRIER_THREAT    = 3 * 1000;  //after damaging enemy flag carrier
   %game.RADIUS_GEN_DEFENSE                    = 20;        //meters
   …
}
```

Every tunable number lives on `%game` as an ALL_CAPS field. It is called from
`DefaultGame::missionLoadDone` **[script]**, so overriding `initGameVars` in a package is the tidiest way
to rebalance a gametype:

```php
package MyMod
{
   function CTFGame::initGameVars(%game)
   {
      Parent::initGameVars(%game);
      %game.SCORE_PER_TEAM_FLAG_CAP = 50;
      %game.FLAG_RETURN_DELAY = 20 * 1000;
   }
};
```

## The `DefaultGame::` callback surface

Roughly sixty methods **[script]**. The ones you will actually override:

### Lifecycle

| Callback | When |
|---|---|
| `initGameVars(%game)` | Set scoring and tuning constants |
| `missionLoadDone(%game)` | Mission loaded — set up sensor groups, power, game state |
| `setUpTeams(%game)` | Build the teams |
| `startMatch(%game)` | The match begins |
| `checkTimeLimit(%game, %forced)` | Time-limit test |
| `checkObjectives(%game)` | Win-condition test |
| `gameOver(%game)` | The match ends |
| `sendDebriefing(%game, %client)` | Post-match summary |
| `activatePackages(%game)` / `deactivatePackages(%game)` | Package lifecycle |

### Clients

| Callback | When |
|---|---|
| `clientMissionDropReady(%game, %client)` | Client finished loading |
| `assignClientTeam(%game, %client, %respawn)` | Team assignment |
| `clientJoinTeam(%game, %client, %team, %respawn)` | Joined a team |
| `clientChangeTeam(%game, %client, %team, %fromObs)` | Changed team |
| `onClientLeaveGame(%game, %client)` | Disconnected |
| `sendClientTeamList(%game, %client)` | Send the roster |
| `setupClientHuds(%game, %client)` | Initialise their HUD |
| `onClientEnterObserverMode(%game, %client)` | Went to observer |
| `forceObserver(%game, %client, %reason)` | Forced to observer |

### Spawning

| Callback | When |
|---|---|
| `spawnPlayer(%game, %client, %respawn)` | Spawn entry point |
| `createPlayer(%game, %client, %spawnLoc, %respawn)` | Create the player object |
| `playerSpawned(%game, %player)` | After spawning |
| `equip(%game, %player)` | **Give the starting loadout** |
| `pickPlayerSpawn(%game, %client, %respawn)` | Choose a spawn point |
| `pickTeamSpawn(%game, %team)` | Team spawn selection |
| `selectSpawnSphere(%game, %team)` | Spawn sphere selection |
| `selectSpawnZone(%game, %sphere)` | Zone within a sphere |
| `selectSpawnFacing(%game, %src, %target, %zone)` | Facing direction |
| `pickObserverSpawn(%game, %client, %next)` | Observer camera |

### Combat and scoring

| Callback | When |
|---|---|
| `onClientDamaged(%game, %clVictim, %clAttacker, %damageType, %sourceObject)` | Damage dealt |
| `onClientKilled(%game, %clVictim, %clKiller, %damageType, %implement, %damageLocation)` | Kill |
| `displayDeathMessages(%game, %clVictim, %clKiller, %damageType, %implement)` | Kill message |
| `friendlyFireMessage(%game, %damaged, %damager)` | Team-damage warning |
| `testKill` / `testSuicide` / `testTeamKill` / `testTurretKill` / `testOOBDeath` | Kill classification |
| `recalcScore(%game, %cl)` | Recompute a score |
| `recalcTeamRanks(%game, %client)` | Recompute rankings |

### Objects and triggers

| Callback | When |
|---|---|
| `playerTouchFlag(%game, %player, %flag)` | Flag touched |
| `playerDroppedFlag(%game, %player, %flag)` | Flag dropped |
| `flagStandCollision(%game, %dataBlock, %obj, %colObj)` | Flag stand contact |
| `onEnterTrigger(%game, %triggerName, %data, %obj, %colobj)` | Entered a trigger |
| `onLeaveTrigger(...)` / `onTickTrigger(...)` | Left / inside a trigger |
| `notifyMineDeployed(%game, %mine)` | Mine placed |
| `claimSpawn(%game, %obj, %newTeam, %oldTeam)` | Spawn point captured |
| `claimFlipflopResources(%game, %flipflop, %team)` | Contested resource captured |
| `clearDeployableMaxes(%game)` | Reset deployable counts |

### Item and weapon vetoes

Three methods act as vetoes and are how gametypes restrict equipment:

| Method | Vetoes |
|---|---|
| `Game.weaponOnUse(%data, %obj)` | Mounting a weapon — called from `Weapon::onUse` **[script]** |
| `Game.weaponOnInventory(%this, %obj, %amount)` | Weapon inventory changes |
| `Game.handInvOnUse(%data, %obj)` | Throwing a hand item — called from `HandInventory::onUse` **[script]** |

```php
function Weapon::onUse(%data, %obj)
{
   if(Game.weaponOnUse(%data, %obj))            // ← return false to block
      if (%obj.getDataBlock().className $= Armor)
         %obj.mountImage(%data.image, $WeaponSlot);
}
```

Overriding these in your gametype package is the correct way to build a weapon-restricted mode.

## Recipe: a new gametype

`MyMod/scripts/RaceGame.cs`:

```php
// DisplayName = Race

//--- GAME RULES BEGIN ---
//Reach every checkpoint in order, then return to the start
//Fastest lap wins
//--- GAME RULES END ---

//------------------------------------------------------------------------------
function RaceGame::initGameVars(%game)
{
   Parent::initGameVars(%game);

   %game.SCORE_PER_CHECKPOINT = 1;
   %game.SCORE_PER_LAP        = 25;
   %game.LAP_COUNT            = 3;
   %game.numTeams             = 1;      // free-for-all
}

//------------------------------------------------------------------------------
function RaceGame::missionLoadDone(%game)
{
   Parent::missionLoadDone(%game);

   %game.checkpointCount = 0;
   // Count the checkpoint triggers the .mis placed.
   for (%i = 0; %i < MissionGroup.getCount(); %i++)
   {
      %obj = MissionGroup.getObject(%i);
      if (%obj.getName() $= "checkpoint" @ %game.checkpointCount)
         %game.checkpointCount++;
   }
   echo("RaceGame: " @ %game.checkpointCount @ " checkpoints");
}

//------------------------------------------------------------------------------
function RaceGame::equip(%game, %player)
{
   // No weapons in a race.
   %player.clearInventory();
   %player.setInventory(RepairKit, 1);
}

//------------------------------------------------------------------------------
function RaceGame::onEnterTrigger(%game, %triggerName, %data, %obj, %colobj)
{
   if (getSubStr(%triggerName, 0, 10) !$= "checkpoint")
   {
      Parent::onEnterTrigger(%game, %triggerName, %data, %obj, %colobj);
      return;
   }

   %client = %colobj.client;
   if (!isObject(%client))
      return;

   %index = getSubStr(%triggerName, 10, 10);
   if (%index != %client.nextCheckpoint)
      return;                                   // out of order — ignore

   %client.nextCheckpoint++;
   %game.recalcScore(%client);

   if (%client.nextCheckpoint >= %game.checkpointCount)
   {
      %client.nextCheckpoint = 0;
      %client.laps++;
      bottomPrint(%client, "Lap " @ %client.laps @ " of " @ %game.LAP_COUNT, 3, 1);

      if (%client.laps >= %game.LAP_COUNT)
         %game.gameOver();
   }
   else
      bottomPrint(%client, "Checkpoint " @ %client.nextCheckpoint, 2, 1);
}

//------------------------------------------------------------------------------
function RaceGame::clientJoinTeam(%game, %client, %team, %respawn)
{
   Parent::clientJoinTeam(%game, %client, %team, %respawn);
   %client.nextCheckpoint = 0;
   %client.laps = 0;
}

//------------------------------------------------------------------------------
// Gametype-scoped overrides go in the package — automatically activated when a
// Race mission loads, deactivated when it ends.
package RaceGame
{
   function Weapon::onUse(%data, %obj)
   {
      // Weapons are disabled entirely in Race.
   }
};
```

Then a mission needs `// MissionTypes = Race` in its header — see [Missions](missions.md).

> **A real example at scale.** The [Construction mod](../40-construction-mod/what-it-changed.md) ships two
> gametypes this way (`ConstructionGame`, `TR2Game`) and preserves the `scripts/*Game.cs` discovery glob
> verbatim inside its own shadowed `server.cs` **[mod-script]** — a total conversion that still loads its
> gametypes through Sierra's mechanism untouched.

## Overriding an existing gametype

```php
package MyMod
{
   function CTFGame::initGameVars(%game)
   {
      Parent::initGameVars(%game);
      %game.SCORE_PER_TEAM_FLAG_CAP = 50;
   }

   function DefaultGame::onClientKilled(%game, %clVictim, %clKiller, %damageType,
                                        %implement, %damageLocation)
   {
      Parent::onClientKilled(%game, %clVictim, %clKiller, %damageType,
                             %implement, %damageLocation);

      if (%damageType == $DamageType::ShockLance)
         messageAll('MyModStyleKill', '\c2%1 shocked %2!',
                    getTaggedString(%clKiller.name), getTaggedString(%clVictim.name));
   }
};
activatePackage(MyMod);
```

Remember `getTaggedString()` around player names — see
[Text and messaging](../04-interface/text-and-messaging.md#tagged-strings).

## Under the community patches

**Gametype discovery, instantiation, the package convention, and the entire `DefaultGame::` callback
surface are unchanged.** A gametype written against vanilla runs on a patched server as-is.

Two things to know.

### The master-server type functions are stubbed

`t2csri_server` replaces four vanilla functions with no-ops **[patch-script]**:

```php
// deactivating old master list server protocol handlers in script
// sending a game type list to a dedicated server would result in a massive number
// of nuiscance calls to the following functions, and spam the console with pages of errors
// the errors were the main source of CPU utilization, so just setting stubs is adequate protection
function addGameType()                 { return; }
function clearGameTypes()              { return; }
function clearMissionTypes()           { return; }
function sortGameAndMissionTypeLists() { return; }
```

**If your gametype calls `addGameType()`, it silently does nothing on a patched server.** This is
deliberate and harmless — the old WON master-server type registration has nowhere to go, and the calls
were a genuine CPU cost.

What still works, unaffected:

- `scripts/*Game.cs` auto-discovery by `CreateServer()`.
- `// MissionTypes = ` parsing by `buildMissionList()`.
- `// DisplayName = ` parsing by `getMissionTypeDisplayNames()`.
- The `Game` ScriptObject, `class` / `superClass` dispatch, and package auto-activation.

Your gametype appears in the host menu through the mission scan, not through `addGameType`.

### `CreateServer` has another link in the chain

The QoL patch packages it to load the server auth stack after vanilla's work **[patch-script]**. If your
gametype file or mod also packages `CreateServer`, all three chain correctly provided every link calls
`Parent::`. See
[Modding against a patched install](../07-community-patches/modding-against-a-patched-install.md#creating-server-content).

### Client-connection callbacks fire differently

`DefaultGame::clientMissionDropReady` and the rest of the client lifecycle are unchanged, but
`GameConnection::onConnect` now runs twice per remote client because of the pre-authentication phase. If
your gametype hooks connection directly rather than through `DefaultGame::`, read
[Client/server split](../02-engine-model/client-server-split.md#under-the-community-patches).

## Related

- [Missions](missions.md) — the `.mis` side of the pairing
- [Boot sequence](../02-engine-model/boot-sequence.md) — the mission load chain
- [22 · Classic 1.1](../22-classic-1-1/README.md) — Defend and Destroy, a shipped gametype addition you can read end to end
- [23 · Classic 1.5.2](../23-classic-152/README.md) — Spawn CTF, and the `ai<Type>.cs` companion in practice
- [Packages](../02-engine-model/packages.md) — the auto-activation convention
- [AI and bots](ai-bots.md) — the `ai<Type>.cs` companion file
- [Modding against a patched install](../07-community-patches/modding-against-a-patched-install.md) — the collision surface
