# 44 · Meltdown 2

The heaviest Classic derivative in this handbook — a mech-combat total conversion, primarily made and
maintained by **Keen**, built directly on top of Classic 1.1's own `defaultGame.cs`.

| | |
|---|---|
| Maintainer | Keen, with contributions credited on the Radiant Age forums **[community]** |
| Lineage | **Classic 1.1** — `defaultGame.cs` is **byte-identical**; `server.cs` differs by 3 lines |
| Distribution | Many archives spanning 2008–2011 (`build 128` through `2.7.7.2435-021711`); one release, `meltdown 2 FINAL V`, extracted here |
| Character | Mech armour classes, energy weapons, six damage types, its own client patch |

## Confirmed: built directly on Classic 1.1, not merely inspired by it

This is the most exact lineage match in this handbook outside the Classic family itself. `defaultGame.cs`
is **byte-for-byte identical to Classic 1.1's**. `server.cs` differs by exactly three lines, and the sole
functional addition is one `exec()` call **[mod-script]**:

```php
exec("scripts/MDInit.cs");
```

`CTFGame.cs` differs by 36 lines from Classic 1.1's, one of which is a direct attribution
**[mod-script]**:

```php
// Package Mod: Keen 12-05-2009
```

Vanilla base's `CTFGame.cs` lacks the whole MPB-teleporter/sentry/tesla scoring block Classic added
(section 43 traces the same block into Revmod2); Meltdown 2 has it, inherited from Classic rather than
reconstructed. Against Classic 1.5.2, there are no exact matches at all — Meltdown 2 forked specifically
from **1.1**, not the later baseline most other Classic derivatives in this handbook target.

`player.cs` is the one file that breaks from Classic entirely — over 3500 lines different from both
Classic and base, which is where the mech/armour-module system actually lives.

## What it adds

The bundled `manual.txt` — a wiki export rather than a traditional readme — documents a genuine
total-conversion combat system layered on that thin Classic core **[community]**:

- Weapon **firing-mode switching**
- Deployable **build and unpack timers**
- A parallel **HP/GeV** stat pair alongside the stock damage model
- **Six damage types**: Energy, Explosive, Kinetic, Plasma, Mitzi, Poison, plus Neutral
- **Status effects**: EMP Shock, Burning, Poisoning
- An **F2 "Mod Hud"** with Vehicle Configuration and "Mech Lab" tabs
- Player, admin, and clan **chat command sets**

A companion `meltdown2clientreadme.txt` describes an optional v2.7.0 client patch adding a vehicle
HP/shield graph, a mech heat graph, and bandwidth/lag optimisations — evidence of continued client-side
investment well past the point most mods in this handbook stopped shipping updates.

The outer archive holds a decade of releases (`M-D T-W v1.0 build 128` in the earliest naming scheme,
through `Meltdown2-2.7.7.2435-021711`), of which the `FINAL V` snapshot examined here represents one late
point in a long, continuously maintained line.

## Related

- [38 · Classic 1.1](../38-classic-1-1/README.md) — the exact version this mod's `defaultGame.cs` is identical to
- [43 · Revmod2](../43-revmod2/README.md) — the same Classic MPB/Tesla scoring block, inherited independently
- [27 · Deathmatch](../27-deathmatch/README.md) — TacoServer's own much later, independent extension of a stock gametype, for contrast in scale
