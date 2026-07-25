# 46 · TCCM

The sibling of [43 · CCM](../43-ccm/README.md) — **78 % identical to it** — and the one fork in this family
that installs under its own name rather than overwriting `Construction/`.

| | |
|---|---|
| Base | **Construction 0.69a** |
| Scripts | 169 `.cs` — 35 identical to base (32 %), 57 changed, 77 new, 18 removed |
| Relationship to CCM | **130 of 166/169 files byte-identical (78 %)** |
| Size | 178 files, 3.7 MB |
| Installs as | **`GameData/TCCM/`** — the exception in this family |

## The install-name exception

Every other Construction derivative documented in sections 41–48 installs as `GameData/Construction/`.
They are alternatives, not companions: installing one replaces another, and QuantiumX's own instructions
open with *"Delete all of your existing Construction folder"* **[mod-script]**.

TCCM ships its own launchers **[mod-script]**:

```
TCCM Online Server.lnk
Dedicated TCCM Server.lnk
```

so it lives at `GameData/TCCM/` and runs as `-mod TCCM`.

**This is the better practice, and it costs nothing.** The mod path stack resolves
`<modname>;base` regardless of the name ([Mod paths and overrides](../02-engine-model/mod-paths-and-overrides.md)),
so a distinct directory means:

- Several Construction variants coexist on one install.
- A server operator can switch between them by changing one launcher argument.
- Players' saved buildings, prefs, and configs do not collide.

The only reason to install as `Construction/` is that a fork inherited the base's launchers and never
changed them. TCCM changed them.

## Relationship to CCM

Byte-level comparison of the two script trees **[mod-script]**:

| File | Present in |
|---|---|
| `Buildingstuff.cs` | TCCM only |
| `TCCM.cs` | TCCM only |
| `neededfunctions.cs` | TCCM only |
| `vehicles/vehicle_transTruck.cs` | TCCM only |
| `vehicles/vehicle_CGTank.cs` | CCM only |

Plus divergent map sets:

| | Maps |
|---|---|
| CCM | `Beach`, `BeachStorm`, `CityArena`, `ConFortWarsV2005` (+ night), `ConstructionFortWarsV2004` (+ night) |
| TCCM | `TCCMBattlegrounds1`, `TCCMBattlegrounds2` |

Everything else — the combat gametypes, the vehicle roster, the rank system, the AI files — is shared.
See [43 · CCM](../43-ccm/README.md#what-it-added) for that inventory rather than duplicating it here.

**Which came first is not determinable from the files alone.** The 78 % overlap plus a handful of
exclusive files on each side is consistent with a rename-and-diverge, a fork, or two branches of one
project. Directory timestamps in the review set reflect extraction, not authorship. What is clear is that
they are the same codebase at two points, and that TCCM added `TCCM.cs` and `neededfunctions.cs` as
identity and helper files.

## TCCM-only additions

| File | Apparent role |
|---|---|
| `TCCM.cs` | Mod identity / entry — the naming convention several forks use for a top-level file |
| `Buildingstuff.cs` | Building helpers |
| `neededfunctions.cs` | Shared function library |
| `vehicles/vehicle_transTruck.cs` | Transport truck |

`neededfunctions.cs` is a recurring shape in this family — MooCon has `Library.cs`, Metallic has
`Other/misc.cs`, base Construction has `functions.cs` / `hfunctions.cs` / `libraries.cs`. Every fork of
any size grows a helper module, and none of them share one.

## What it is, in one line

Combat/construction hybrid — build a fort, then fight over it — packaged with the discipline to sit
alongside other mods instead of replacing them.

## For someone working on it

- **Keep the separate install name.** If you fork TCCM, keep `-mod` pointing at your own directory. It is
  the cheapest good decision available.
- **Check CCM before writing anything.** At 78 % overlap, a fix or feature there very likely applies here
  with little change — and vice versa. These two are the only pair in the family where cross-porting is
  realistic.
- **Combat behaviour lives in the gametypes.** `ArenaGame.cs` and `CTFGame.cs`, via the
  `package <Type>Game` convention ([Gametypes](../05-gameplay-systems/gametypes.md#the-package-convention)).
- **New content needs `aiInventory.cs` entries** or bots ignore it
  ([AI and bots](../05-gameplay-systems/ai-bots.md)).

## Related

- [43 · CCM](../43-ccm/README.md) — the sibling, and the full feature inventory
- [40 · The Construction Mod](../40-construction-mod/README.md) — the 0.69a base
- [Mod paths and overrides](../02-engine-model/mod-paths-and-overrides.md) — why the install name matters
