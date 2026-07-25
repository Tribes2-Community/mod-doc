# 32 · Defend and Destroy

The Tribes 1 gametype restored, and the strongest evidence in this handbook that Sierra absorbed Classic's
work directly into the retail product — see [08 · The base ruleset](../08-base-ruleset/README.md#the-dnd-anomaly)
and [22 · Classic 1.1](../22-classic-1-1/README.md) for the full provenance story. This page covers the
mechanics; those cover who wrote it and how it ended up in `base/scripts.vl2`.

## The rules

`scripts/DnDGame.cs`'s header, verbatim **[script]**:

```
Destroy objectives and hold switches.
Teams score 1 point for each switch held, and each Large Turret, Sensor, Generator, and Vehicle Station destroyed.
The map ends when one team destroys all the enemy objectives and holds all switches, or the timelimit expires.
```

Two win conditions, not one: destroy every enemy objective and hold every switch, *or* have the higher
score when time runs out. A match can therefore end early on a clean sweep, which no other base gametype
does — CTF and Siege both run to the clock or a score cap, never to "nothing left to attack."

## The scoring table

DnD has by far the most granular scoring of any base gametype — 39 separately named constants, set once
near the top of the file and referenced by name everywhere else **[script]**:

| Category | Values |
|---|---|
| Combat | Kill `+5`, headshot `+1`, turret kill `+5`, auto-turret kill `+1`, teamkill `−5`, death `0`, suicide `0` |
| Destroying a building | Generator `+10`, vehicle station `+8`, solar panel `+8`, turret `+6`, sensor `+4`, everything deployable `+1` to `+3` |
| Destroying a vehicle | MPB `+12`, tank `+8`, bomber `+8`, Shrike `+5`, Wildcat `+5`, Transport `+5`, plus `+2` per passenger aboard |
| Defending | `+5` for repelling an attack on an objective |
| Repairing | Generator `+8`, solar `+6`, turret `+4`, everything else `+1` to `+4` |
| Teamkilling equipment | `−10` |

The naming convention — `SCORE_PER_DESTROY_GEN`, `SCORE_PER_REPAIR_SENSOR`, `SCORE_PER_DESTROY_MPB` — is
worth copying directly if you are building a scoring system with this many categories. Every award site in
the file reads a name, not a number, so retuning DnD's balance is a one-line change per category rather
than a hunt through the file for a literal that might appear in five places.

**The MPB is the single highest-value kill in the base game** — `+12`, ahead of every other vehicle and
every building. Consistent with section 08's framing of the MPB as a serious mobile asset, and with the
"deployable, high-value objective" that other gametypes and mods (Construction's power-frequency systems,
section 40) treat mobile infrastructure as.

### The suicide line, and where it goes next

```php
%game.SCORE_PER_SUICIDE = 0; // z0dd - ZOD, 8/19/02. No penalty for suicide! Was -10
```

That comment is not incidental. Classic 1.1's changelog lists, almost verbatim, "Committing suicide no
longer incurs a -10 penalty to a players score" (section 22). Both files are z0dd's, dated the same
autumn — the DnD scoring decision and the Classic-wide rule change are the same design instinct applied
in two places, and this is the line where you can watch it happen. Removing a suicide penalty matters
specifically for an objective gametype: a player who needs to reset position to defend a switch should
not be taxed for the tool that gets them there fastest.

## Objectives and switches, mechanically

DnD tracks two distinct kinds of target, scored differently:

**Objectives** are the buildings themselves — generators, sensors, turrets, vehicle stations — destroyed
once, scored once, gone for the rest of the match.

**Switches** are held, not destroyed, and pay out continuously while your team controls them (`+1` per
switch per scoring interval, per the rules text). This is a different reward shape from every objective
score above it: destruction is a one-time event, holding is a rate. A team that captures switches early
and successfully defends them accumulates score for the rest of the match without further action, which
is precisely the "hold and defend" playstyle DnD's Tribes 1 ancestor was built around.

## Related

- [08 · The base ruleset](../08-base-ruleset/README.md#the-dnd-anomaly) — the provenance evidence: shipped in base, authored by Classic's z0dd
- [22 · Classic 1.1](../22-classic-1-1/README.md) — the suicide-penalty change this page's comment explains
- [31 · Capture the Flag](../31-capture-the-flag/README.md) — the per-object scoring style DnD shares with base CTF
- [Gametypes](../05-gameplay-systems/gametypes.md) — `MissionTypes`, package activation
- [40 · The Construction Mod](../40-construction-mod/README.md) — another system built around defensible infrastructure
