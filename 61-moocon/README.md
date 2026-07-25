# 61 · MooCon

The most professionally run fork in the family. MooCon had a named dev team, a public forum, a versioned
release line running 1.0.0 → Final, a structured changelog, an auto-updater, and an add-on system designed
so *other people's* scripts could plug into it.

Three versions are documented here: **1.7.0**, **1.9.0**, and **Final**.

| | 1.7.0 | 1.9.0 | Final |
|---|---|---|---|
| Base | Construction 0.69a | Construction 0.69a | Construction 0.69a |
| `.cs` files | 125 | 113 | 115 |
| Identical to 0.69a | **62 %** | 21 % | 19 % |
| New / changed / removed | 18 / 39 / 3 | 58 / 32 / 55 | 60 / 34 / 55 |
| Size | 470 files, 7.8 MB | 137 files, 2.9 MB | 139 files, 2.9 MB |
| Installs as | `GameData/Construction/` | `GameData/Construction/` | `GameData/Construction/` |

All three fingerprint to 0.69a. **1.9.0 and Final are 85-of-115 identical to each other** — Final is a
small increment, not a new generation.

> The 1.9.0 extract nests everything one level deeper, under `construction/`. That is an artifact of how
> it was packaged, not a different layout.

## The project, not just the mod

MooCon is the only fork here with visible **project infrastructure** **[mod-script]**:

```
Please report Bugs and Exploits with as much information as possible.
You can report them to: foocumber@absfoocumber.com

Also, feel free to submit ideas to us via the MooCon Forums at:
moocon.foocumber.com

Thanks,
  - The Dev Team.
```

`MooConVersionInfo.txt` is a 315-line changelog covering **1.0.0, 1.0.1, 1.0.2, 1.1.0, 1.2.0, 1.4.0,
1.5.5, 1.6.0, 1.7.0, 1.8.0** in a consistent Added / Removed / Changed format **[mod-script]** — a real
release discipline, and a far better artifact than any other fork in this family produced.

It ends with a two-word epitaph **[mod-script]**:

```
//Moocon's done.
```

### It also names its dependencies honestly

From the 1.8.0 entry **[mod-script]**:

> ```
> - Added in crash protections (Credit: Electricutioner)
> …
> - Forced to rewrite the Swinging Door because of Electricutioner...
> ```

**Electricutioner is the TribesNEXT author** ([07 · Community Patches](../07-community-patches/README.md)).
The second line is a fork having to adapt because the community patch changed behaviour underneath it —
the exact dependency risk documented in
[Modding against a patched install](../07-community-patches/modding-against-a-patched-install.md). Worth
noting that the relationship ran both ways: crash protections flowed in, a door rewrite was forced out.

## 1.7.0 — the light fork

62 % of 0.69a survives untouched. Only 18 new files, and 3 removed. This is a fork that **extended** the
base rather than rewriting it.

New **[mod-script]**:

| Area | Files |
|---|---|
| Core | `Library.cs`, `moocon.cs`, `Games.cs`, `message.cs`, `skies.cs` |
| Tools | `weapons/MergeTool.cs`, `weapons/TexturePie.cs` |
| Building | `packs/stairPack.cs`, `packs/preBuild.cs`, `packs/door.cs`, `packs/waypoint.cs`, `packs/Spawnpointpack.cs` |
| Chat | `customchatcommands.cs` |
| Migration | `Updates/SaveFileConverter.cs` |
| Content | `weapons/fireWorksRifle.cs`, `weapons/mpblauncher.cs`, `do_not_delete/MooConShapes.cs`, `MPM/MpM_baseFile.cs` |

Three of those deserve attention:

**`MergeTool.cs`** — merging saved buildings together. Base Construction can save and load a structure
([Building systems](../58-construction-mod/building-systems.md#saving-and-loading-buildings)); MooCon adds
combining them.

**`preBuild.cs`** — prefabricated structures deployed as a unit. The logical endpoint of a save/load
system: if you can serialise a building, you can ship one as a placeable object.

**`SaveFileConverter.cs`** — migrating saved buildings across formats. Once players have invested hours in
structures, **your save format becomes a compatibility contract**. MooCon is the only fork here that
shipped a converter, and 1.8.0 records `SaveBuilding.cs` being rewritten with the note that
*"savebuildingCentered now works nicely"* **[mod-script]**.

## 1.9.0 — the reorganisation

The identical-file count collapses from 62 % to 21 %, with **55 files removed and 58 added**. That looks
like a rewrite. It is mostly a **reorganisation**: the flat script tree is restructured into categories
**[mod-script]**.

```
packs/decor/          Effectpacks.cs, decorationpack.cs, stairPack.cs
packs/structural/     door.cs, forcefieldpack.cs
packs/power/          switch.cs, tripwire.cs
packs/misc/           telepadpack.cs
packs/baseSupplies/   vehiclepad.cs
weapons/tools/        constructionTool.cs, dragonmissile.cs
vehicles/air/         vehicle_bomber.cs, vehicle_shrike.cs
vehicles/hover/       vehicle_artillery.cs, vehicle_tank.cs
MPM/                  AntiNuketurret.cs
```

A file that moves counts as one removal plus one addition, which is why the diff looks violent. Base
Construction keeps everything in flat `packs/`, `weapons/`, `vehicles/` directories; by 1.9.0 MooCon had
enough content that flat directories stopped scaling.

**The lesson for a large fork:** the mod-path stack does not care about your directory structure — only
the `exec()` paths do
([Mod paths and overrides](../02-engine-model/mod-paths-and-overrides.md)) — so reorganising is cheap
mechanically and expensive socially. It breaks every downstream patch and every wiki instruction that
names a path. Do it once, early, or not at all.

1.9.0 also adds `PhysScripts/` with `Moveables` and `Tools` subdirectories.

## Final — the increment

85 of 113/115 files identical to 1.9.0. The visible addition is `cChatCommands.cs`, alongside two
subsystems shipped as top-level directories **[mod-script]**:

```
Addons/       addonexec.cfg
CashScripts/  Cashconfig.cs  cashCommands.cs  cashfunctions.cs  cashvariables.cs  jobs.cs
```

### The add-on system

From the 1.8.0 changelog **[mod-script]**:

> ```
> - Easy add-on system, used so you can customize your server, makes great for independent
>   scripters who want to give there scripts to other people with less hassle.
>        *Current downloads for add-on's are listed on our forums*
> ```

This is the single most interesting design decision in the fork family. Every other Construction
derivative is a **fork** — to add something, you copy the whole mod. MooCon built an **extension point**:
`Addons/addonexec.cfg` lists scripts to load, so third parties ship a file rather than a fork.

It is the same problem the [support pack](../09-support-pack/README.md) solved for client-side scripts,
solved independently for a server-side mod, and it is the correct answer to the composability cost that
[file shadowing](../58-construction-mod/what-it-changed.md#the-shadowing-strategy) imposes on this family.

### The cash economy

`CashScripts/` — `Cashconfig.cs`, `cashCommands.cs`, `cashfunctions.cs`, `cashvariables.cs`, and
**`jobs.cs`**. A currency system with jobs, on a building sandbox. Several forks in this family drift
toward RPG structure (see [68 · QuantiumX](../68-quantiumx/README.md),
[66 · Ultimate Build 2.0](../66-ultimate-build/README.md)); MooCon's is the most cleanly separated,
sitting outside `scripts/` entirely.

## Things worth stealing

| Practice | Why |
|---|---|
| Structured Added/Removed/Changed changelog per release | 315 lines across 10 releases, still readable twenty years on |
| Named contact and forum in-package | The mod outlived its website; the file did not |
| Save-file converter | Player-built structures are data you owe compatibility to |
| Add-on system | Turns forks into plug-ins |
| Crediting upstream by name | *"(Credit: Electricutioner)"* |
| Recording removals | *"Finally removed the Fireworks Rifle, since it was only meant for v1_5_5"* |

## For someone working on it

- **Target 1.9.0 or Final, not 1.7.0.** The directory reorganisation is the dividing line and everything
  after it assumes the new layout.
- **Use the add-on system** rather than editing `scripts/`. It exists precisely so you do not have to
  fork.
- **`Library.cs` is MooCon's, not Construction's** — check there before adding a helper.
- The extension checklist in
  [Building systems](../58-construction-mod/building-systems.md#extending-a-construction-fork) still
  applies, with paths adjusted for the categorised tree.

## Related

- [58 · The Construction Mod](../58-construction-mod/README.md) — the 0.69a base and fork-family table
- [09 · The Support Pack](../09-support-pack/README.md) — the same composability problem, client side
- [07 · Community Patches](../07-community-patches/README.md) — Electricutioner and the door rewrite
