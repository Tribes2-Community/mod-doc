# 59 · Power Edition

The **lightest fork in the family, and the best-behaved**. 82 % of Construction 0.69a survives
byte-identical, **nothing is removed**, and only 20 base files are modified. Everything else is added
alongside.

| | |
|---|---|
| Base | **Construction 0.69a** |
| Scripts | 155 `.cs` — 90 identical to base (82 %), 20 changed, 45 new, **0 removed** |
| Size | 162 files, 3.4 MB |
| Installs as | `GameData/Construction/` |

## Why the zero matters

Compare the fork family:

| Fork | Identical to 0.69a | Removed |
|---|---:|---:|
| **Power Edition** | **82 %** | **0** |
| c2kconstruction | 67 % | 0 |
| MooCon 1.7.0 | 62 % | 3 |
| Metallic 1.4 | 38 % | 16 |
| CCM | 34 % | 18 |
| QuantiumX | 8 % | 10 |

Removing nothing and changing only 20 files means Power Edition's delta against 0.69a is small enough to
**read in an afternoon**. Every other heavy fork in this family is effectively a separate codebase; this
one is a patch you could reason about, and — with care — port forward onto a different base.

That is not an accident of scope. Power Edition adds a great deal of content. It just adds it *beside* the
base rather than *through* it.

## What it added

### A combat weapons pack

The bulk of the fork. 30-plus files in `weapons/` **[mod-script]**:

```
ASMDExtra.cs      MatrixGun.cs        ShockwaveCannon.cs   railgun.cs
bomblauncher.cs   mp5.cs              paintballgun.cs      flame.cs / flamer.cs
FireWorks.cs      FireworksGun.cs     Booster.cs           nerfGun.cs / nerfBallLauncher.cs
```

alongside files named for vanilla weapons — `plasma.cs`, `chaingun.cs`, `mortar.cs`, `sniperRifle.cs`,
`grenadeLauncher.cs`, `missileLauncher.cs`, `blaster.cs`, `disc.cs`, `shockLance.cs`, `ELFGun.cs`,
`targetingLaser.cs`, `flareGrenade.cs`, `grenade.cs`.

Those last ones are the interesting group. Base Construction is a **building** mod — combat is
de-emphasised and several vanilla weapons are pared back. Power Edition puts the shooter back, restoring
and extending the vanilla weapon set on top of the building mod. It is Construction for servers that
wanted both.

Because these are new files rather than edits to Construction's shadowed `weapons.cs`, they are loaded
additively — the pattern recommended throughout this handbook
([Weapons](../03-content-recipes/weapons.md#recipe-a-complete-new-weapon)).

### The `PowerPack/` tree

A self-contained subsystem in its own directory **[mod-script]**:

```
start.cs            chatcommands.cs     inv.cs              foreverzero.cs
stargate.cs         door.cs             fire.cs             ZDS.cs
JetPack.cs          To.cs               weapvehcode.cs      stuf.txt
powerships.cs       vehicle_SkyBuilder.cs
vehicle_aircycle.cs vehicle_airtank.cs  vehicle_sacycle.cs  vehicle_sacycle2.cs
```

Note `start.cs` — a single entry point for the whole pack, which is the right shape for an add-on. And
`vehicle_SkyBuilder.cs`: a flying construction platform, the same idea Metallic reached for with
`vehicle_SkyBase.cs` ([63 · Metallic Construction](../63-metallic-construction/README.md)). Two forks
independently concluded that builders need to work at altitude.

`stargate.cs` is a teleport system distinct from base Construction's 40-frequency teleporters.

## What this fork teaches

Power Edition is the closest thing in this family to the advice this handbook gives elsewhere:

| Practice | Effect |
|---|---|
| Add files; do not edit base files | 82 % of the base still matches, so upstream fixes remain mergeable |
| Remove nothing | No downstream surprises — everything base Construction documented still exists |
| Group your subsystem in its own directory with an entry script | `PowerPack/start.cs` is identifiable and removable |
| New content as new files, not edits to shadowed ones | New weapons never touch `weapons.cs` |

It is worth contrasting with [68 · QuantiumX](../68-quantiumx/README.md), which achieves a comparable
amount of new content while leaving only 8 % of the base intact. Same family, same base, opposite
discipline — and Power Edition is the one you could still do something with.

## For someone working on it

- **Follow the existing pattern.** New weapon → new file in `weapons/`. New subsystem → new directory with
  a `start.cs`.
- **Resist editing the 90 untouched base files.** That number is the fork's main asset.
- The registration checklist in
  [Building systems](../58-construction-mod/building-systems.md#extending-a-construction-fork) applies
  unchanged, and for weapons specifically see
  [Ammo and inventory](../03-content-recipes/ammo-and-inventory.md#the-complete-checklist-for-a-new-item)
  — `max[]`, `$AmmoIncrement`, and `$WeaponsHudData` are all still required.

## Related

- [58 · The Construction Mod](../58-construction-mod/README.md) — the 0.69a base and fork-family table
- [Weapons](../03-content-recipes/weapons.md) — building the weapons this fork is full of
- [68 · QuantiumX](../68-quantiumx/README.md) — the same job done the opposite way
