# 35 · Capture and Hold

At 466 lines, the smallest objective gametype in `base/scripts.vl2` — and, like Bounty, untouched by
Classic.

## The rules

`scripts/CnHGame.cs`'s header **[script]**:

```
Teams try to capture marked objectives
Capturing player gets a point 12 seconds after a capture
Hold objectives in order to score
A team scores 2 points per second it holds an objective
Turrets and inventory stations convert when their switch is taken
```

Two timers govern it, both set to the same value **[script]**:

```php
%game.TIME_REQ_PLYR_CAP_BONUS = 12 * 1000;  //player must hold a switch 12 seconds to get a point for capturing it
%game.TIME_REQ_TEAM_CAP_BONUS = 12 * 1000;  //time after touching it takes for team to get a point
```

Touching a switch does not score by itself — the capture has to hold for twelve seconds before either the
capturing player or their team is credited. That window exists to stop a drive-by touch from scoring
against a switch that is immediately retaken; a capture only counts once it has survived contest for a
meaningful stretch.

Once secured, an objective pays its owning team 2 points per second for as long as they hold it — a
continuous rate, the same scoring shape Defend and Destroy uses for its switches (section 32). Multiple
held objectives stack: five objectives held simultaneously pay 10 points per second, which is why matches
tend to snowball once one team establishes map control.

## Turrets and stations convert

The distinguishing mechanic, and the one the rules text states plainly: capturing a switch **converts**
any turret or inventory station attached to it. It does not merely disable the loser's defences — it
hands them to the new owner, functioning. A team that captures aggressively inherits its opponent's
emplacements rather than facing them.

This makes Capture and Hold territorial in a way none of the other base gametypes are. CTF and Siege fight
over a fixed target; Bounty and Deathmatch have no map objectives at all. Capture and Hold's objectives
are the map — every switch you take is infrastructure you gain and your opponent loses in the same
motion.

## Related

- [32 · Defend and Destroy](../32-defend-and-destroy/README.md) — the same continuous per-second hold-scoring shape
- [34 · Bounty](../34-bounty/README.md) — the other gametype Classic leaves entirely unmodified
- [Turrets and deployables](../03-content-recipes/turrets-and-deployables.md) — the objects being converted
- [Gametypes](../05-gameplay-systems/gametypes.md) — `MissionTypes`, package activation
