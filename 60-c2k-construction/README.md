# 60 · c2kconstruction

The largest package in the family — 744 files, 13 MB — and the only one that ships **more compiled
bytecode than source**. It is Construction 0.69a plus a large vehicle roster plus the full **Tricon 2**
administration suite, distributed as a server operator's complete drop-in.

| | |
|---|---|
| Base | **Construction 0.69a** |
| Scripts | 219 `.cs` — 74 identical to base (67 %), 36 changed, 109 new, **0 removed** |
| Size | **744 files, 13 MB** — the largest here |
| `.dso` : `.cs` | **520 : 218** |
| Installs as | `GameData/Construction/` |

## Additive, like Power Edition — but much bigger

67 % of 0.69a survives byte-identical and **nothing is removed**. Only 36 base files are modified. On the
discipline axis, c2kconstruction sits with [59 · Power Edition](../59-power-edition/README.md) rather than
with QuantiumX or MooCon 1.9 — it grew by addition.

The difference is scale: 109 new `.cs` files against Power Edition's 45, plus a bundled third-party suite
and enough art to reach 13 MB.

## It ships mostly `.dso`

520 compiled `.cs.dso` files against 218 `.cs` sources **[mod-script]**. Many scripts ship **both**, and
some ship only bytecode — `tricon2/defaultConfig.cs.dso` has no `.cs` beside it, and `.dso`-only files
appear at the top of the script directory (`BountyGame.cs.dso`, `CTFGame.cs.dso`, `ChatGui.cs.dso`, and
others).

This is the source-hiding distribution option described in
[Packaging](../06-shipping/packaging.md#three-shipping-choices), used at scale. It has two consequences
you will meet immediately:

- **Shipping both `.cs` and `.dso` is the configuration this handbook warns against.** The engine prefers
  the compiled form **[binary]**, so an edit to a `.cs` does nothing until the matching `.dso` is deleted.
  On a package this size that is a real hazard — and it is why the family ships DSO-deleter batch files
  ([What it changed](../58-construction-mod/what-it-changed.md#the-dso-problem-at-scale)).
- **`.dso`-only files cannot be modified.** There is no source. They can be replaced wholesale or
  decompiled, and nothing else.

If you fork this, **delete every `.dso` first** and confirm the mod still loads. Whatever breaks was
`.dso`-only.

## Tricon 2

c2kconstruction ships Tricon 2 **unpacked**, as `scripts/tricon2/` **[mod-script]**:

```
tricon2/
├── Tricon 2 Quick Start.txt
├── Tricon2_v300_manual.pdf
├── base/
├── menuitems/
├── defaultConfig.cs.dso        ← no source
├── tempdata.cs  / tempdata.cs.dso
└── tempdata2.cs / tempdata2.cs.dso
```

plus `TriconPackageGame.cs` at the script root, which opens **[mod-script]**:

```php
package Tricon2 {
//MissionDropReady
//{NQP!}Qing
//www.tricon2.com
```

So Tricon 2 is by **{NQP!}Qing**, distributed from `tricon2.com`, versioned to v3.00, and — unlike almost
everything else in this family — implemented as a **package** rather than by file shadowing. That is the
correct choice for an add-on that must coexist with a host mod, and it is why the same suite could be
bundled into [66 · Ultimate Build 2.0](../66-ultimate-build/README.md) as `.vl2` archives without
conflict.

It is a telnet-driven remote administration suite: separate GUI client, telnet passwords with full and
read-only tiers, and in-game admin authentication by typing the password as a chat message. Setup detail
is in [66 · Ultimate Build 2.0](../66-ultimate-build/README.md#tricon-2).

`TriconPackageGame.cs` matching `scripts/*Game.cs` means it is picked up by the vanilla gametype
auto-discovery glob ([Gametypes](../05-gameplay-systems/gametypes.md)) — using the gametype loader as a
general "load my package" hook. Neat, and slightly cheeky.

## The TracerDX content

A second bundled body of work **[mod-script]**:

```
autoexec/TracerDXChat.cs      TracerDXNullSounds.cs
TDXNullMale1.cs               TDXNullMale3.cs        TDXMenuMale3.cs
```

`TDX*` files named for player-model and sound overrides, plus a chat script in `autoexec/`. Note that
`scripts/autoexec/` placement — the same directory used by the
[support pack](../09-support-pack/README.md) and [RC2a](../07-community-patches/rc2a.md), and by your own
mod's entry script. On this install that directory has multiple occupants loaded in OS-determined order
([Boot sequence](../02-engine-model/boot-sequence.md)).

## The vehicle roster

The largest in the family **[mod-script]**:

```
vehicle_eagle.cs        vehicle_condor.cs       vehicle_crusader.cs
vehicle_tender.cs       vehicle_support.cs      VEHICLEB.CS
vehicle_admingunship.cs vehicle_adminfighter.cs vehicle_admintank.cs
vehicle_spec_fx.cs      servervehiclehudB.cs
```

The `admin*` group is the notable one — vehicles restricted to administrators, which fits a package built
around an administration suite. `VEHICLEB.CS` in shouting caps is a reminder that the mod path stack is
case-insensitive on Windows and nobody normalised the filename.

## What it is, in one line

A server operator's complete package: Construction, a large content roster, remote administration, and
model/sound overrides, pre-compiled and ready to drop in.

## For someone working on it

- **Delete every `.dso` before you start.** Otherwise your source edits are inert, and you will not know
  which files are `.dso`-only until you do.
- **Tricon 2 is a package and separable.** Leave it alone; it is somebody else's project with its own
  manual and versioning.
- **67 % of the base is intact** — section 58's description of baseline Construction is more reliable here
  than for most forks in this family. Verify the 36 changed files.
- **Watch `scripts/autoexec/`.** It already has an occupant; add yours with a distinct name and defer
  order-sensitive work ([Your first mod](../01-getting-started/your-first-mod.md#under-the-community-patches)).

## Related

- [58 · The Construction Mod](../58-construction-mod/README.md) — the 0.69a base and fork-family table
- [66 · Ultimate Build 2.0](../66-ultimate-build/README.md) — the other Tricon 2 host
- [Packaging](../06-shipping/packaging.md#dso-compilation) — why shipping both `.cs` and `.dso` hurts
- [Boot sequence](../02-engine-model/boot-sequence.md) — the crowded autoexec directory
