# 24 · Siege

The second gametype Classic ships its own copy of, and the only base gametype with no score limit —
Sierra's own comment explains why.

## The rules

`scripts/SiegeGame.cs`'s header **[script]**:

```
One team defends base, other team tries to conquer it as quickly as possible
Game has two rounds: Round 1 ends when base is conquered or time runs out
Round 2: Teams switch sides, play again -- to win, attackers MUST beat the time set by the attackers in Round 1
Touching base switch conquers base
```

The fuller comment above the package declaration explains the design choice explicitly **[script]**:

> "This mission type doesn't have a scoreLimit because, well, it really doesn't need one or lend itself
> to one."

Siege is a **time trial with roles reversed on the second lap**, not a points race. Round 1 is timed;
Round 2 repeats the same objective with sides swapped, and the winner is whichever team's offense was
faster. If the first attacking team never captures the base, the second team simply has to capture it at
all — there is no clock to beat. Sierra's mission comment states the asymmetry plainly:

```
If time runs out before initial defending team's objective is captured, then roles switch
and new offense team has to try to capture the objective before time runs out.
```

## Conquering the base

The win condition is a single trigger touch, not a scoring accumulation **[script]**:

```php
function FlipFlop::playerTouch(%data, %flipflop, %player)
{
   if(%player.team != Game.offenseTeam)
      return;
   ...
   Game.allObjectivesCompleted();
}
```

`FlipFlop` is the same switch object DnD holds for continuous points (section 23); here, touching it while
on the attacking side ends the round outright — `Game.allObjectivesCompleted()` — rather than paying out
per second. Same object class, two entirely different scoring philosophies layered on top of it depending
on which gametype's package is active. That reuse is a good demonstration of the
[package convention](../02-engine-model/packages.md#the-gametype-convention): the `FlipFlop` datablock
stays fixed, and each gametype's package supplies its own `playerTouch` handler.

## What Classic changed

Classic's `SiegeGame.cs` grows from 1213 lines to 1648 — the largest expansion of any shadowed gametype in
this handbook. As with CTF, the growth splits into a consolidation and a set of genuine additions.

**Removed by consolidation.** Five per-object repair handlers — `genOnRepaired`, `sensorOnRepaired`,
`stationOnRepaired`, `turretOnRepaired`, `vStationOnRepaired` — collapse into one generic
`staticShapeOnRepaired` / `objectRepaired` pair **[mod-script]**, the same simplification CTF received.

**Added — defensive scoring.** `awardScoreGenDefend` / `testGenDefend` and
`awardScorePlayerFFDefend` / `testPlayerFFDefend` **[mod-script]**. This is the concrete implementation of
the line noted in [39 · Classic 1.5.2](../39-classic-152/README.md): "Added some asset scoring to Siege,
helpful for finding out who is doing what." Base Siege scores only the round outcome; Classic scores
individual defensive contributions — generator defence and force-field defence specifically — so a
defender who never touches the switch still gets credit for the round.

**Added — readiness voting.** `checkMatchStart` / `voteMatchStart` **[mod-script]**. Siege's round
structure means a mid-round join is disruptive in a way CTF's continuous play is not, so Classic adds an
explicit vote to confirm both teams are ready before a round begins — the same instinct behind tournament
mode's spawn-wait countdown (section 31), applied at gametype level rather than server level.

**Added elsewhere.** `RepairGunImage::onRepair`, `ShapeBaseData::onDestroyed`, `Observer::onTrigger`,
`vehicleDestroyed`, `awardScoreTkDestroy` — mostly plumbing in support of the two feature additions above.

## Related

- [23 · Defend and Destroy](../23-defend-and-destroy/README.md) — the `FlipFlop` object's other scoring model
- [22 · Capture the Flag](../22-capture-the-flag/README.md) — the same per-object-to-generic consolidation pattern
- [39 · Classic 1.5.2](../39-classic-152/README.md) — "Added some asset scoring to Siege," implemented here
- [31 · The base ruleset](../31-base-ruleset/README.md#tournament-mode) — the readiness-countdown convention `voteMatchStart` follows
- [Gametypes](../05-gameplay-systems/gametypes.md) — `MissionTypes`, package activation
