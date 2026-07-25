# 35 · NinjaMod

One of the oldest Tribes 2 mods on record, and the mod section 58 already credits — under its community
nickname — as one of the two combat mods whose deployable abuse inspired Construction's entire genre.

| | |
|---|---|
| Real name | **Ninja-X**, per its own release archives (`Ninja-X v4.1.1.rar`) |
| Lineage | **Base** — 75% of base-unique tokens survive in its compiled `server.cs`; only 6% of Classic-unique tokens do |
| Earliest evidence | `ninjavehicles.cs`, dated 18 October 2001 — days after Tribes 2 shipped |
| Latest evidence | `CTFGame.cs.dso` recompiled 20 October 2003; archived as late as 2009–2010 |
| Scope | 465 files, almost entirely compiled `.cs.dso` — only 5 client HUD/GUI scripts survive as source |

Construction's own README names it directly, without further detail **[mod-script]**:

> "Up to now mods like ninja mod and warped where used to create the wierdest of structures. However
> these mods being combat orientated where limited in their building flexiblity."

This section is that reference, made concrete.

## Confirmed base lineage, by a different method

NinjaMod ships almost no readable source — of roughly 150 top-level scripts, only five client-side files
(`ninjaclientfull.cs`, `ninjaclienttest.cs`, `ninjaoptions.cs`, `ninjareticles.cs`, `ninjavehicles.cs`)
survive uncompiled. Every gametype, player, and server file exists only as `.cs.dso` bytecode.

Compiled TorqueScript still carries its identifiers as strings even with comments and formatting
stripped, so lineage is checkable a different way: build the set of identifiers unique to Classic's
`server.cs` (present in Classic, absent from base) and the set unique to base's `server.cs`, then test
which set's tokens actually appear inside NinjaMod's compiled `server.cs.dso`. The result is decisive —
**57 of 76 base-unique tokens (75%) appear**, against only **13 of 224 Classic-unique tokens (6%)**.
NinjaMod predates Classic's 2002 patches by design as well as by date: its earliest file is from October
2001, days after Tribes 2 itself shipped.

## What it actually adds

Beneath the compilation, NinjaMod is a stealth/gadget combat mod. A dedicated `Beacons/` directory holds
the toolkit: `cloakbeacon`, `fakedeath`, `hackbeacon`, `jammerbeacon`, `shockbeacon`, and more, alongside a
`DuelMOD` subsystem and a vehicle-purchase economy HUD. This is precisely the "combat mod whose deployable
systems were loose enough to be abused for construction" character section 58 attributes to it — a set of
placeable gadgets built for stealth and sabotage play, general enough that players started stacking them
into structures the mod never intended.

## What this handbook cannot verify

With source unavailable for all but five files, claims about NinjaMod's exact mechanics are limited to
what filenames, compiled identifiers, and Construction's own secondhand description support. Treat this
page as confirming NinjaMod's existence, era, and base lineage — not as a full mechanical account of how
its beacons worked in play.

## Related

- [58 · The Construction Mod](../58-construction-mod/README.md) — the mod that names NinjaMod as an ancestor
- [31 · The base ruleset](../31-base-ruleset/README.md) — the baseline NinjaMod's tokens were tested against
- [Packaging](../06-shipping/packaging.md#dso-compilation) — what `.cs.dso` preserves and what it loses
