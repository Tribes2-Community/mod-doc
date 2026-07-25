# 39 · Team Rabbit 2

Not a gametype file. Team Rabbit 2 is a total-conversion sport mod shipped as **three separate base
archives**, distinct from every other gametype in sections 31–38 — and the most elaborate single piece of
game design in vanilla 25034.

| | |
|---|---|
| Archives | `base/TR2final093-extras.vl2` (29.6 MB), `base/TR2final105-client.vl2` (48.1 MB), `base/TR2final105-server.vl2` (395 KB) |
| Studio | Codality, Inc. |
| Gametype file | `scripts/TR2Game.cs` — 3204 lines, inside `TR2final105-server.vl2` |
| Class | `TR2Game` |
| Ships in | Every clean 25034 install — these are three of the nineteen `base/` archives (section 90) |

Unlike Defend and Destroy, this is not a case of a mod author's work being absorbed into base. Team
Rabbit 2 was purpose-built for Tribes 2 by an outside studio and shipped by Sierra as part of the retail
product from the start.

**A note on markers.** Like `DnDGame.cs` (section 08), these are third-party-authored files — but they
ship inside `base/`, load with a clean install, and require nothing opted into. This page marks citations
from them **[script]**, the same tier as `base/scripts.vl2`, and reserves **[community]** for material
this page draws from the TribalWar strategy guide quoted below rather than from the shipped code itself.

`TR2Game.cs`'s own header credits the team by name **[script]**:

```
// Team Rabbit 2
// Created by Codality, Inc.
// www.codality.com
// -------------------------------
// Michael "KineticPoet" Johnston  - Designer, Lead Programmer, Maps
// Dan "daunt" Kolta               - Physics design, Maps
// Scott "FSB-AO" Estabrook        - Programmer
// John "CObbler" Carter           - Bonus sound effects
// Buddy "sLaM" Pritchard          - Sound effects
// Gregg "illy" Fellows            - 3D models and skins
// Alan "Nefilim" Schwertel        - Maps
// Kenneth "SONOFMAN" Cook         - Sky art
```

KineticPoet is the same person Classic's readme thanks for the CTF flag-collision fix (section 31) — one
developer credited by name in two unrelated codebases shipped in the same retail install.

## The rules

`TR2Game.cs`'s header **[script]**:

```
Get the flag and throw it into the other team's goal
You can only hold onto the flag for 15 seconds
Passing the flag increases the size of the Jackpot
Scoring a goal awards the Jackpot to your team!
When your health reaches zero, you are knocked down
Replenish your ammo by pressing your suicide button
```

Six lines that describe a genuinely different game from anything else in this handbook: flag *passing*
between teammates rather than flag *carrying* to a stand, a shared risk-reward pool rather than a fixed
per-capture score, and no permanent death.

### The jackpot

Every completed pass adds points to a jackpot shared by both teams — the readme is explicit that it is
one pot, not two — and the first team to score with it above a minimum cashes it in **[script]**:

```php
$TR2::MinimumJackpot = 40;
$TR2::MaximumJackpot = 250;
```

A goal cannot be scored with fewer than 40 points banked, and the pot caps at 250 regardless of how many
uncashed passes accumulate. This creates a genuine tension: keep passing to build a bigger prize, or
score now before the other team intercepts and claims what you built.

### No kills, no deaths

Damage reduces a player to a "knocked down" state rather than removing them from play. Two timers govern
recovery **[script]**:

```php
$TR2::MinimumKnockdownDelay = 2300;
$TR2::MaximumKnockdownDelay = 7000;
```

A knocked-down player respawns where they fell after this window, cannot be looted for ammo by opponents,
and is only fully reset — sent back to their spawn hutch with a full loadout — by a deliberate suicide
(`Ctrl+K`). Accidentally killing yourself with your own weapon is mechanically identical to being knocked
down by an opponent: play continues either way.

## Roles: three classes, assigned automatically

`scripts/TR2Roles.cs` defines the entire role system as data, not code — three roles, each with a hard
cap, an armour class, and a capture radius from the goal **[script]**:

```php
$TR2::role[0] = Goalie;
$TR2::role[1] = Defense;
$TR2::role[2] = Offense;
$TR2::numRoles = 3;

$TR2::roleMax[Goalie] = 1;
$TR2::roleMax[Defense] = 2;
$TR2::roleMax[Offense] = 10;

$TR2::roleArmor[Goalie] = Heavy;
$TR2::roleArmor[Defense] = Medium;
$TR2::roleArmor[Offense] = Light;

// Roles are automated via concentric circles around goals
$TR2::roleDistanceFromGoal[Goalie] = 70;
$TR2::roleDistanceFromGoal[Defense] = 350;
$TR2::roleDistanceFromGoal[Offense] = 10000;
```

A player's role is not chosen — it is a function of position, recalculated as they move. Inside 70 metres
of the goal you become the Goalie (if the slot is open — only one per team), inside 350 metres you become
Defense (up to two), and beyond that you are Offense by default, uncapped. Walk toward your own goal and
your armour class changes underneath you.

Each role's loadout is data too **[script]**:

```php
$TR2::roleExtraItem[Goalie0] = TR2Shocklance;
$TR2::roleExtraItem[Goalie1] = TR2Mortar;
$TR2::roleExtraItem[Goalie2] = TR2MortarAmmo;
$TR2::roleExtraItemCount[Goalie2] = 99;

$TR2::roleExtraItem[Defense0] = TR2Shocklance;
```

The Goalie gets a heavy frame, a shocklance, and ninety-nine mortar rounds to clear the goal mouth.
Defense gets a shocklance alone — enough to knock an attacker off course, not enough to hold the line
solo. Offense gets neither; speed and numbers are its answer to everything.

There is no inventory-station shopping trip anywhere in this — roles equip automatically the moment they
change, which is the same "no economy" instinct Spawn CTF applies to its armour class (section 31),
pushed further into a fully automatic role assignment.

## The bonus matrix

The standout technical feature, and the reason `TR2Game.cs` alone is larger than most complete
gametypes. Every completed pass is scored against a **ten-dimensional matrix** — passer speed, receiver
speed, receiver height, horizontal and vertical flag speed, flag hang-time, passer direction, passer
orientation, flag direction relative to the receiver, and receiver orientation — collapsed into four
lookup categories that compose into a named, voiced "composite bonus."

The categories, each its own file, each a genuine 3-axis lookup table keyed by matrix indices **[script]**:

```php
// NounData components
// [Passer speed, grabber speed, grabber height]
$NounList[0,0,0] = new ScriptObject() {
   text = "Llama's";
   value = -1;
   sound = NounLlamaSound;
   class = NounData;
};

$NounList[1,0,0] = new ScriptObject() {
   text = "Turtle's";
   value = 1;
   sound = NounTurtleSound;
   class = NounData;
};
```

```php
// DescriptionData components
// [Passer direction, pass direction, flag direction]
$DescriptionList[0,0,0] = new ScriptObject() {
   text = "Bullet";
   value = 5;
   sound = Description000Sound;
   class = DescriptionData;
};
```

Every cell is an object — text, a point value, and a sound — addressed by up to three matrix coordinates
at once, `$NounList[%a, %b, %c]`. Verified counts across the four files **[script]**:

| Category | Matrix dimensions | Entries | Example |
|---|---|---:|---|
| Prefix | Receiver's orientation relative to the flag | 3 | *Angled*, *Twisted* |
| Noun | Passer speed, receiver speed, receiver height | 64 | *Llama's* (`−1`), *Turtle's* (`+1`), *Cougar's*, *Astronaut's* |
| Qualifier | Horizontal/vertical flag speed, hang-time | 24 | *Sharp*, *Spitting*, *Whipped* |
| Description | Passer direction, pass direction, flag direction | 27 | *Bullet* (`+5`), *Heist* (`+7`), *Smack Shot* (`+9`) |

A composite bonus always carries a Noun and a Description; the Prefix and Qualifier are conditional on
whether the pass qualifies for them. TribalWar's own strategy guide to the mod — quoted below, and the
best surviving explanation of how the matrix reads in practice — describes the assembled result as "a
Llama's Grab, worth 0 points" for the simplest possible pass, up to "Twisted Cougar's Bursting Back
Breaker" for an elaborate one **[community]**. The shipped code confirms the Llama Noun itself is worth
`−1`, not `0`; the composite's total is the sum across whichever categories apply, so the readme's
headline number reflects the full assembly rather than any single category viewed alone.

Up to four sounds layer per bonus, by design **[community]**, attributed to TribalWar's guide and
consistent with the separate sound-category files shipped: animal Noun sounds play immediately, Qualifier
sounds linger underneath, and Description sounds — the most distinctive — play a beat after the pass
completes. `TR2final093-extras.vl2` alone carries this vocabulary as audio: dozens of named creature and
vehicle sounds under `audio/fx/Bonuses/Nouns/` (`cheetah.wav`, `hornet.wav`, `zeppellin.wav`, `astronaut.wav`,
`helicopter.wav`), plus tiered Qualifier and Description sound sets (`down_passback3_rocket.wav`,
`horz_perppass2_blender.wav`, `wow-level6-elite.wav`) — the majority of that archive's 29.6 MB is this
one system's voice.

## Physics: its own gravity

`TR2Physics.cs` does not tune the base player datablocks — it defines a parallel set of constants that
override player and flag behaviour specifically for TR2 missions **[script]**:

```php
$TR2::Gravity = -43;

$TR2_playerJetForce = 7030; //4000;//26.21 * 90;
$TR2_playerMass = 130;
$TR2_playerRechargeRate = 0.251;

$TR2_FlagMass = 30;
$TR2_FlagThrowScale = 3.0;
```

`-43` against base's `-20` and Classic's `-26.9` (section 21) — more than double retail gravity, tuned
for a game built entirely around aerial passing rather than ground combat. The commented-out
`26.21 * 90` next to the jet force literal is the base formula from
[08 · The base ruleset](../08-base-ruleset/README.md#the-armours) left in place as a reference point the
developers tuned away from — visible evidence that TR2's physics started from the shipped armour
constants and diverged deliberately.

A separate "grid boost" system supplies the impulse pads and tubes the readme describes for crossing
maps quickly **[script]**:

```php
$TR2_MinimumGridBoost = 80;
$TR2_GridVelocityScale = 1.15;
$TR2_MaximumGridSpeed = 310;
```

The readme's claim that the mission boundary physically "bounces" players and the flag back into play is
not something this handbook can confirm in script — what `TR2Game.cs` does implement is a scripted
out-of-bounds penalty: a player who leaves the play area is tracked, and if they remain outside it for
roughly a second the game forcibly kills them (`$DamageType::OOB = 204`) and drops any flag they carry
(`boundaryLoseFlag`) **[script]**. Whether the physical bounce the readme describes is implemented in
mission geometry (invisible barrier objects, unverified here) or is players' shorthand for narrowly
avoiding this penalty, the effect either way is the same: nothing stays out of bounds for long.

## Maps

The readme documents nine **[community]**: Crater 71, Frozen Fury, God's Rift, Haven, Mount Olympus,
Phasma Dust, Skinny Dip, Sol's Descent, and Treasure Island. **The shipped `TR2final105-client.vl2`
contains eight** — Mount Olympus has no `.mis`, `.ter`, or `.spn` file in the archive **[script]**. Every
other named map is present and verified. This is a straightforward case of documentation outliving a
build: the guide was written against a roster that included Mount Olympus at some point in TR2's
development or release history, and the specific archive shipped in this 25034 install does not carry it.

## Classic's integration

Classic does not shadow Team Rabbit 2 — there is no `Classic/scripts/TR2Game.cs` anywhere in any version
covered in sections 21–24 — but it treats the gametype as first-class rather than ignoring it.

**A load toggle**, defaulting on **[mod-script]**:

```php
$Host::ClassicLoadTR2Gametype = 0;   // Option to not load Tr2 gametype
```

**A conditional load of the base file**, in Classic's own `server.cs` **[mod-script]**:

```php
if($Host::ClassicLoadTR2Gametype)
{
   ...
   exec("scripts/TR2Game.cs");
```

Classic ships no `TR2Game.cs` of its own, so this `exec()` resolves through the mod path stack
(section 02) straight to the copy inside `base/TR2final105-server.vl2`. The toggle governs whether
Classic bothers loading a gametype it does not modify, not which implementation runs.

**Six files patched for compatibility.** `Classic_technical.txt` names the work under its own heading —
*"CHANGES NEEDED FOR TR2 + CLASSIC, SEARCH FILES WITH: tr2"* **[mod-script]** — listing `inventory.cs`,
`weapons.cs`, `hud.cs`, `player.cs`, `inventoryhud.cs`, `server.cs`. Two concrete examples: Classic's
`player.cs` registers TR2's own ammo types so Classic's inventory HUD recognises them —

```php
// z0dd - ZOD, 9/13/02. For TR2 weapons
$ammoType[6] = "TR2DiscAmmo";
$ammoType[7] = "TR2GrenadeLauncherAmmo";
$ammoType[8] = "TR2ChaingunAmmo";
$ammoType[9] = "TR2MortarAmmo";
```

— and `weapons.cs` extends the shared `$WeaponsHudData` table with TR2's weapon icons **[mod-script]**:

```php
// z0dd - ZOD, 9/13/02. TR2 weapons for compatability.
$WeaponsHudData[11, itemDataName] = "TR2Disc";
$WeaponsHudData[11, ammoDataName] = "TR2DiscAmmo";
$WeaponsHudData[12, itemDataName] = "TR2GrenadeLauncher";
```

Both patches exist so a Classic server hosting a TR2 mission renders the correct HUD for TR2's own weapon
set — `TR2Disc`, `TR2Chaingun`, `TR2GrenadeLauncher`, `TR2Mortar`, `TR2ShockLance`, `TR2TargetingLaser`,
`TR2Grenade` — rather than falling back to base icons or showing nothing. This is meaningfully more
integration work than a toggle requires, and it corroborates the KineticPoet credit in section 31: TR2's
developers and Classic's were reading and patching around each other's code.

Evolution Admin Mod's `.ovl` overlay (section 25) reaches TR2 too, with its own `TR2Game.ovl` overriding
`TR2Game::getTeamName` for custom team naming and `TR2Game::onClientKilled` / `sendDebriefing` for stats
tracking **[mod-script]** — a third codebase treating TR2 as a gametype worth supporting explicitly rather
than an edge case to ignore.

## Footprint

| Archive | Size | Contents |
|---|---:|---|
| `TR2final093-extras.vl2` | 29.6 MB | Almost entirely audio — the bonus-matrix sound vocabulary |
| `TR2final105-client.vl2` | 48.1 MB | Missions, terrains, textures, custom armour shapes and animations, weapon models, HUD |
| `TR2final105-server.vl2` | 395 KB | Every `.cs` — the entire gameplay logic, three orders of magnitude smaller than the assets it drives |

The server archive's `.cs` files span physics, roles, the four-category bonus system, an observer queue,
role-specific weapon variants, and a dedicated energy pack — a genuine total conversion, in the sense
Construction is (section 40): built on Tribes 2's engine, but not recognisably Tribes 2's ruleset once
you are inside a match.

## Related

- [31 · Capture the Flag](../31-capture-the-flag/README.md) — KineticPoet's other credited contribution, the flag-collision fix
- [08 · The base ruleset](../08-base-ruleset/README.md#the-armours) — the armour jet-force formula TR2's physics diverged from
- [21 · Classic](../21-classic/README.md) — the shadowing model TR2 sits outside of
- [25 · Evolution Admin Mod](../25-evolution-admin-mod/README.md) — `TR2Game.ovl`, the third codebase integrating this gametype
- [40 · The Construction Mod](../40-construction-mod/README.md) — the other total conversion in this handbook
- [Mod paths and overrides](../02-engine-model/mod-paths-and-overrides.md) — how Classic's `exec()` reaches the base copy
