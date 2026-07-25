# 31 · The base ruleset for 25034

Every mod in this handbook is a **delta against this**. Classic raises gravity from it; Construction
switches its combat off; TacoServer inherits it through two intermediaries. Before you change a number,
you should know what the number is and where it lives.

This section is the shipped ruleset of build 25034 as it exists in `base/scripts.vl2` — not what the
manual says, and not what twenty years of forum posts remember.

## Where the ruleset lives

There is no single rules file. The ruleset is distributed across the shipped scripts, and knowing which
file owns which decision is most of the work:

| File | Owns |
|---|---|
| `scripts/server.cs` | Global physics — `$DefaultGravity`, server lifecycle |
| `scripts/serverDefaults.cs` | The 36 `$Host::` preferences, team names and skins |
| `scripts/player.cs` | The nine armour datablocks — mass, speed, energy, jets |
| `scripts/defaultGame.cs` | The gametype base class, scoring, tournament mode (3377 lines) |
| `scripts/<Type>Game.cs` | One per gametype — eleven of them |
| `scripts/weapons.cs`, `scripts/weapons/*.cs` | Weapon behaviour and damage |
| `scripts/damageTypes.cs` | Damage type registry |

## Gravity

```php
$DefaultGravity = -20;
```

`scripts/server.cs:9` **[script]**, applied at `scripts/server.cs:257` behind a guard:

```php
if ($DefaultGravity !$= "")
   setGravity($DefaultGravity);
```

This one constant defines the feel of vanilla Tribes 2, and it is the single number Classic changes
(to `-26.9`, section 37). Everything ballistic in the game — mortar arcs, grenade throws, disc drop,
maximum ski speed — is downstream of it.

**Gravity is mission-scoped.** A `.mis` can set its own, and loading one resets it, which is why Classic
re-asserts its value on every mission load rather than once at startup. If you change gravity in your own
mod, do it per mission or it will silently revert at the first map change. See
[38 · Classic 1.1](../38-classic-1-1/README.md).

## The armours

Nine `PlayerData` datablocks, in a deliberate inheritance chain **[script]**:

```php
datablock PlayerData(LightMaleHumanArmor)     : LightPlayerDamageProfile   { … };
datablock PlayerData(MediumMaleHumanArmor)    : MediumPlayerDamageProfile  { … };
datablock PlayerData(HeavyMaleHumanArmor)     : HeavyPlayerDamageProfile   { … };

datablock PlayerData(LightFemaleHumanArmor)   : LightMaleHumanArmor        { … };
datablock PlayerData(MediumFemaleHumanArmor)  : MediumMaleHumanArmor       { … };
datablock PlayerData(HeavyFemaleHumanArmor)   : HeavyMaleHumanArmor        { … };

datablock PlayerData(LightMaleBiodermArmor)   : LightMaleHumanArmor        { … };
datablock PlayerData(MediumMaleBiodermArmor)  : MediumMaleHumanArmor       { … };
datablock PlayerData(HeavyMaleBiodermArmor)   : HeavyMaleHumanArmor        { … };
```

Three weight classes are the ruleset; the other six are **appearance inheriting balance**. Female and
Bioderm armours derive from the male human of the same weight, so they are visually distinct and
mechanically identical.

That is the important structural point for a modder: **there are three balance decisions here, not
nine.** Retune `MediumMaleHumanArmor` and the female and Bioderm mediums follow automatically. Retune
`MediumFemaleHumanArmor` instead and you have created an imbalance that most players will experience as a
bug. See [Datablocks](../02-engine-model/datablocks.md) for how datablock inheritance resolves.

The three weight classes, from `scripts/player.cs` **[script]**:

| | Light | Medium | Heavy |
|---|---:|---:|---:|
| `mass` | 90 | 130 | 180 |
| `maxDamage` | 0.66 | 1.1 | 1.32 |
| `maxEnergy` | 60 | 80 | 110 |
| `maxForwardSpeed` | 15 | 12 | 7 |
| `jetForce` coefficient | 26.21 | 25.22 | 22.47 |

Light armour reference values: `maxSideSpeed = 13`, `maxBackwardSpeed = 13`, `rechargeRate = 0.256`,
`jetEnergyDrain = 0.8`, `minJetEnergy = 1`, `drag = 0.275`, `density = 10` **[script]**.

### Read the jet force carefully

```php
jetForce = 26.21 * 90;    // Light
jetForce = 25.22 * 130;   // Medium
jetForce = 22.47 * 180;   // Heavy
```

The field is written as **coefficient × mass**, not as a literal. That is not decoration — force divided
by mass is acceleration, so the coefficient *is* the thrust-to-weight ratio and the literal product is
meaningless on its own.

Read as coefficients, the balance is legible at a glance: heavy armour has 86% of light armour's
thrust-to-weight (22.47 / 26.21), while carrying 2.7× the mass and 2× the health. `runForce` follows the
same convention (`55.20 * 90` for light).

**Keep the convention if you touch these.** Writing `jetForce = 2358.9;` is arithmetically identical and
destroys the reader's ability to see what you changed. This is the same instinct as Classic's
`gravityMod = 20.0 / mabs($Classic::gravSetting)` — express a tuning value as the relationship it
encodes.

### Skiing, friction and momentum

What each field does — `runSurfaceAngle`, `horizMaxSpeed`, `horizResistSpeed`, `horizResistFactor`,
`noFrictionOnSki`, `drag`/`maxdrag` — is covered in full in
[Armors](../03-content-recipes/armors.md#the-skiing-and-momentum-fields). The values base actually ships,
across all three weights, from `scripts/player.cs` **[script]**:

| | Light | Medium | Heavy |
|---|---:|---:|---:|
| `runSurfaceAngle` | 70 | 70 | 70 |
| `horizMaxSpeed` | 68 | 60 | 52 |
| `horizResistSpeed` | 33 | 28 | 23 |
| `horizResistFactor` | 0.35 | 0.32 | 0.29 |
| `upMaxSpeed` | 80 | 70 | 60 |
| `drag` / `maxdrag` | 0.275 / 0.4 | 0.3 / 0.5 | 0.33 / 0.6 |
| `noFrictionOnSki` | *(unset)* | *(unset)* | *(unset)* |

The ski-trigger angle is identical across weights; everything governing what happens once you are skiing
scales down with mass — light armour skis fastest and is reined in most gently, heavy armour is capped
lowest and resisted hardest, consistent with light being the mobility class and heavy the durability
class. `noFrictionOnSki` is set by **no** base armour, of any weight — see
[Armors](../03-content-recipes/armors.md#the-skiing-and-momentum-fields) for what leaving it unset
implies and does not imply.

This whole system is exactly what [38 · Classic 1.1](../38-classic-1-1/README.md#the-physics-change-skiing-friction-and-momentum)
retunes, field by field, and the base numbers above are the "before" side of that comparison.

## The gametypes

Eleven ship in `base/scripts.vl2` **[script]**:

| File | Lines | |
|---|---:|---|
| `defaultGame.cs` | 3377 | The base class every gametype extends |
| `CTFGame.cs` | 2014 | Capture the Flag |
| `HuntersGame.cs` | 1745 | Hunters |
| `DnDGame.cs` | 1331 | Defend and Destroy — see below |
| `SinglePlayerGame.cs` | 1310 | The campaign |
| `SiegeGame.cs` | 1213 | Siege |
| `BountyGame.cs` | 899 | Bounty |
| `RabbitGame.cs` | 739 | Rabbit |
| `TeamHuntersGame.cs` | 614 | Team Hunters |
| `CnHGame.cs` | 466 | Capture and Hold |
| `DMGame.cs` | 374 | Deathmatch |

`defaultGame.cs` at 3377 lines is larger than any individual gametype, which tells you the design: **the
gametypes are thin.** Scoring, spawning, teams, tournament mode, admin plumbing and the mission lifecycle
all live in the base class, and a gametype overrides the handful of methods that make it distinct. `DMGame.cs`
implements deathmatch in 374 lines because it inherits everything else.

That is the model to copy when adding your own — see
[Gametypes](../05-gameplay-systems/gametypes.md), and the package convention that scopes a gametype's
overrides to missions of that type.

### The DnD anomaly

`DnDGame.cs` sits in `base/scripts.vl2` alongside Sierra's own gametypes, and its header reads
**[script]**:

```
//  <> Defend and Destroy <>
//
//  Version: 1.1.25026
//  Date: October 23, 2002
//  By: ZOD
```

ZOD is z0dd, author of the Classic mod. The file carries four of his signature comments, and it is **not
in the Classic mod tree** — it ships in Sierra's base archive, versioned against build 25026.

So one of the eleven base gametypes is community-authored work that Sierra absorbed into the retail
product. It is the hardest evidence available for the claim in [37 · Classic](../37-classic/README.md)
that Classic was not merely tolerated but adopted, and it is why the Classic readme notes that DnD "isn't
limited to just Classic mod" **[mod-script]** — by 25034 it belongs to everybody.

## The server preferences

`scripts/serverDefaults.cs` declares **36** `$Host::` variables **[script]**. The ones that constitute
the ruleset rather than the configuration:

| Preference | Default | |
|---|---|---|
| `$Host::PureServer` | `1` | **Clients may not load their own scripts.** The default is on |
| `$Host::MissionType` | `"CTF"` | |
| `$Host::TimeLimit` | `30` | Minutes |
| `$Host::MaxPlayers` | `64` | 32 on the demo |
| `$Host::VoteTime` | `30` | Seconds a vote stays open |
| `$Host::VotePassPercent` | `60` | |
| `$Host::KickBanTime` | `300` | Seconds |
| `$Host::BanTime` | `1800` | Seconds |
| `$Host::PlayerRespawnTimeout` | `60` | |
| `$Host::BotsEnabled` | `0` | Off by default; `BotCount = 2` when on |
| `$Host::MinBotDifficulty` / `Max` | `0.5` / `0.75` | |
| `$Host::NoSmurfs` | `0` | |

`$Host::PureServer = 1` is the one to internalise. A PURE server refuses client-side script additions,
which is what makes client-side mods a distribution problem rather than a drop-in — see
[Mod paths and overrides](../02-engine-model/mod-paths-and-overrides.md).

### The demo branch

The file opens with team tables, then splits **[script]**:

```php
// Demo-specific preferences:
if ( isDemo() )
```

`GameName`, `Info`, `Map` and `MaxPlayers` are each declared twice — demo values (`"Tribes 2 Demo Server"`,
`SlapDash`, 32 players) and retail values (`"Tribes 2 Server"`, `Katabatic`, 64). If you grep this file
you will see apparent duplicates; they are branches, not redefinitions.

Classic 1.1's changelog notes it "Removed all of the Tribes2 trial demo code. This lowers the memory
requirement and speeds up processing a bit" **[mod-script]** — so a mod that never runs on the demo can
drop the branch.

### Teams

Seven team slots, indexed `0`–`6` **[script]**:

| Index | `teamName` | `teamSkin` | `holoName` |
|---:|---|---|---|
| 0 | Unassigned | blank | *(empty)* |
| 1 | Storm | base | Storm |
| 2 | Inferno | baseb | Inferno |
| 3 | Starwolf | swolf | Starwolf |
| 4 | Diamond Sword | dsword | DSword |
| 5 | Blood Eagle | beagle | BloodEagle |
| 6 | Phoenix | cotp | Harbinger |

Slot 0 is the unassigned/neutral pseudo-team, so a two-team match uses 1 and 2. Slots 3–6 are the lore
tribes, used by the campaign and available to missions. Note that `holoName` diverges from `teamName` for
slots 4–6 — Phoenix holograms say "Harbinger".

Classic reduces this to Storm and Inferno only **[mod-script]**, and NecroBones' mapping tutorial
documents the editor's Team0/1/2 groups against the same indices — see
[18 · The editor windows](../18-bones-editor-windows/README.md).

## Tournament mode

`$Host::TournamentMode` is referenced 15 times in `defaultGame.cs` and 7 in `server.cs` **[script]** — a
shipped, first-class competitive mode, not a mod invention. It gates match start behind a countdown and
readiness, and every combat mod from section 37 onward branches on it.

The convention those mods inherit is worth stating plainly: **a rule that helps public play is disabled in
tournament mode.** Classic's anti-turtling, TacoServer's blaster buff and population-scaled rules all
follow it. If you add a quality-of-life rule, check `$Host::TournamentMode` before applying it.

## What to do with this

**Read the number before you change it.** Most balance mods in the corpus are a handful of altered
constants; the ones that aged well changed few numbers and documented each.

**Change the class, not the instance.** Three armour weights, nine datablocks.

**Express relationships, not literals.** `26.21 * 90` and `20.0 / mabs($Classic::gravSetting)` are the
shipped house style, and they are why these files are still readable twenty-four years on.

**Expect the ruleset to be distributed.** There is no rules file to open. The gametype owns scoring, the
armour datablock owns mobility, `server.cs` owns gravity, `serverDefaults.cs` owns the knobs.

## Under the community patches

Neither TribesNEXT QoL nor RC2a changes the base ruleset. Both patch authentication, presentation and
platform layers; the gameplay constants above are untouched, which is why a 2004 mod still balances
correctly on a 2026 install.

Two interactions worth knowing:

- **`$Host::PureServer`** still governs client script loading, and the patches' own client-side scripts
  are delivered through the patch archive rather than as user scripts. See
  [Modding a patched install](../07-community-patches/modding-against-a-patched-install.md).
- **`isDemo()`** is vestigial. The demo was never patched and no patched install reports as one, so the
  demo branch is dead code on any modern server.

## Related

- [09 · The Support Pack](../09-support-pack/README.md) — the community library layered on this base
- [37 · Classic](../37-classic/README.md) — the ruleset that replaced this one in practice
- [Armors](../03-content-recipes/armors.md#the-skiing-and-momentum-fields) — what every movement field means, field by field
- [38 · Classic 1.1](../38-classic-1-1/README.md#the-physics-change-skiing-friction-and-momentum) — the same fields, retuned
- [Gametypes](../05-gameplay-systems/gametypes.md) — extending `DefaultGame`
- [Datablocks](../02-engine-model/datablocks.md) — how armour inheritance resolves
- [Global variables](../reference/global-variables.md) — the full `$Host::` reference
- [Mod paths and overrides](../02-engine-model/mod-paths-and-overrides.md) — PURE servers
