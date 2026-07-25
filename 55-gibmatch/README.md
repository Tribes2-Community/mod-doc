# 55 · GibMatch

A standalone combat mod with its own gametype family, by **Gibbz** (lead, modelling) and **supaGu**
(coding).

| | |
|---|---|
| Version | Beta 1.1 (docs), with a later standalone `GibMatch13.exe` installer present but not run |
| Ships as | `-mod gibmatch` — `docs/Read Me.txt`: `run with -online -mod gibmatch` |
| Lineage | Undetermined — scripts ship as `.cs.dso`, source not available |
| Scope | 285 files: `audio`, `docs`, `gui`, `scripts`, `shapes`, `textures`, plus a bundled `NighFall.vl2` |

## The mechanic that names it

The readme explains the mod's premise directly **[community]**:

> "gibamatch is a bonus awarded to a player at random, after he/she frags a player"

A "gib" bonus, granted stochastically on a kill — the specific hook `GibMatchGame.cs` is presumably built
around, though the file itself ships only as compiled `scripts/GibMatchGame.cs.dso`, not source.

## Its own gametype family

`scripts/` carries four distinct compiled gametypes rather than one: `GibMatchGame.cs.dso`,
`gmTEAMGame.cs.dso`, `gmCTFGame.cs.dso`, and `InstaGibGame.cs.dso` — a base mode, a team variant, a CTF
variant, and an instagib variant, alongside `admin.cs.dso` and `damageTypes.cs.dso`. This is a fuller
gametype family than most single-purpose mods in this section attempt, though — as with
[54 · Masters mod](../54-mastersmod/README.md) — the compiled-only distribution means the mechanics behind
each variant cannot be read directly.

The Beta 1.1 changelog documents an instant-hit railgun among its headline changes, alongside new models,
code, textures and sounds credited to the two-person team.

## What this handbook cannot verify

As with Masters mod, GibMatch's actual scoring and gib-bonus logic live only in `.dso` bytecode in this
capture. What's confirmed here is structural: the mod's scope (four gametypes, a full asset pipeline, a
multi-year installer history from Beta 1.1 through a 2010-dated `GibMatch13.exe`) and its stated central
mechanic, not the mechanic's implementation.

## Related

- [54 · Masters mod](../54-mastersmod/README.md) — another compiled-only combat mod in this section
- [30 · Team Rabbit 2](../30-team-rabbit-2/README.md) — a fully-documented example of a randomised bonus system, for comparison
- [Gametypes](../05-gameplay-systems/gametypes.md) — the `scripts/*Game.cs` convention GibMatch's four modes follow
- [TorqueScript — V12 Compiler](../02-engine-model/torquescript-compiler.md) — the format GibMatch's `.dso` gametypes are written in
