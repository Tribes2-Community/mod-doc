# 28 · Hunters & Team Hunters

Two files, one mechanic, split by whether scoring is individual or shared. Neither is touched by Classic.

## Hunters

`scripts/HuntersGame.cs` is the second-largest gametype in base at 1745 lines — larger than Siege, larger
than Defend and Destroy — almost entirely because of the timing machinery described below.

The rules **[script]**:

```
Kill other players to make them drop flags
Return flags to the Nexus for points
The more flags brought to Nexus at one time, the more each flag scores
GREED mode: you must return 8 or more flags at once to score
HOARD mode: no returns between 5 and 2 min. left in game
Flag Colors: Red = 1pt, Blue = 2pts, Yellow = 4pts, Green = 8pts
```

Killing a player drops whatever flags they are carrying; carrying flags to the `Nexus` objective scores
them, with a bonus for turning in several at once. The four flag colours are fixed point values —
red/blue/yellow/green worth 1/2/4/8 — so a single green flag is worth as much as four reds.

### GREED and HOARD are optional rules, not fixed behaviour

Both are `$Host::` toggles, vote-controlled with an admin override, in the same shape as
[40 · The ruleset toggles](../40-classic-ruleset-toggles/README.md) — except this one shipped in base,
not in Classic **[script]**:

```php
%game.greedMode = $Host::HuntersGreedMode;
%game.greedMinFlags = 8;   // min number of flags you must have before you can cap

%game.hoardMode = $Host::HuntersHoardMode;
%game.HoardStartTime = 5;  // time left in the game at which hoard mode will start
%game.HoardDuration = 3;   // duration of the hoard period
```

**GREED mode** raises the minimum turn-in from one flag to `greedMinFlags` (8 by default) — you cannot
cap at all until you are carrying a substantial haul, which rewards aggressive, sustained flag-runs over
opportunistic single returns.

**HOARD mode** closes the Nexus for a window near the end of the match — by default the last five minutes
until two minutes remain — forcing whoever is sitting on flags to either have already turned them in or
risk losing them to a kill once returns reopen. `%game.setupHoardCountdown()` schedules eight separate
warnings before the window opens and eight more before it closes (30, 10, 5, 4, 3, 2, 1, 0 seconds out,
both directions) **[script]** — a strikingly dense notification schedule for what is, mechanically, one
boolean flipping twice per match.

### The game outs hoarders automatically

Past 15 carried flags, a player becomes the tracked "Flag Hoarder," and the game gives **every other
client** a waypoint to their position **[script]**:

```php
// new tracking - *everyone* automatically tracks the "flag hoarder" if they have at least 15 flags
%game.updateFlagHoarder(%client);
```

```php
if (%client.flagCount > %game.flagHoarderMin && %client.flagCount > %maxFlags)
{
   %hoarder = %client;
   ...
   %game.hoarderWaypoint = new WayPoint() { ... name = "Flag Hoarder Was Here"; };
```

This is the mechanic that actually enforces the spirit of GREED and HOARD: rather than only penalising
turtling through the scoring window, the game exposes whoever is sitting on a large stockpile to the
entire server, in real time, as a directed target. Combined with the turn-in restrictions above, hoarding
flags is made progressively more dangerous rather than simply less profitable.

## Team Hunters

`scripts/TeamHuntersGame.cs`, 614 lines — under half of Hunters despite reusing nearly all of its
underlying flag mechanics — is the team variant. Its rules **[script]**:

```
Collect flags and bring them to Nexus
You may pass flags to a Capper
Capper can collect many flags and try for massive score
However, any player may score at Nexus
All scores of team members count toward team score
```

There is no separate "Capper" role or datablock in the code — "Capper" is simply the name for whichever
teammate a player chooses to pass their collected flags to, using the same flag-pass mechanic every other
gametype uses. The design is social, not mechanical: nothing stops any player from walking their own
flags to the Nexus, but consolidating a team's flags onto one runner before turning them in captures the
same "more flags at once scores more" bonus Hunters rewards individually, now amplified by however many
teammates fed the runner. Individual scores still roll up into the team total either way, so there is no
purely-mechanical reason to designate a Capper — it is a coordination strategy the ruleset merely permits.

## Related

- [40 · The ruleset toggles](../40-classic-ruleset-toggles/README.md) — the same vote/admin-override toggle shape, in Classic's context
- [25 · Bounty](../25-bounty/README.md) — another gametype with per-player rather than shared state
- [Gametypes](../05-gameplay-systems/gametypes.md) — `MissionTypes`, package activation
- [30 · Team Rabbit 2](../30-team-rabbit-2/README.md) — flag-passing pushed much further, with a scored bonus matrix
