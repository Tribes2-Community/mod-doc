# 41 · Metallic Construction 1.4 Beta

A Construction fork that pushed hardest on **building features** — warp gates, transport pads, manned and
automated turrets, new vehicles — while beginning to pull RPG structure into a sandbox builder.

| | |
|---|---|
| Base | **Construction 0.69a** |
| Scripts | 153 `.cs` — 42 identical to base (38 %), 52 changed, 59 new, 16 removed |
| Size | 165 files, 3.3 MB |
| Installs as | `GameData/Construction/` |
| Own version line | 1.3.5 → 1.3.8 → 1.4 Beta |

## Lineage

Metallic states its base explicitly. Its inherited `Version-history.txt` carries Construction's history
with a line inserted at the top **[mod-script]**:

```
**********************0.70 Alpha**********************
Community release.


***Metallic based off 0.69, switch to Readme.txt for Metallic info. ***
```

That is a clean piece of fork hygiene worth copying: **the inherited changelog says where the fork
diverged and where its own history lives**, so a reader is never confused about which project a given
entry belongs to. Most of the forks in sections 42–48 do not do this.

Fingerprinting confirms it — 42 of 0.69a's `.cs` files survive byte-identical, more than for 0.68a (34) or
0.70a (29).

## What it added

`Readme.txt` is Metallic's own changelog, running 1.3.5 → 1.4 **[mod-script]**. New files by area:

### An `Other/` helper tree

Metallic introduces a directory the base does not have **[mod-script]**:

```
Other/chatcommands.cs        Other/misc.cs
Other/ObjectiveFunctions.cs  Other/warpgatefuncitons.cs
Other/rpgCC.cs
```

Splitting helpers out of the shadowed base files is a sensible fork practice — it keeps *your* code
identifiable against a 27-file shadowed surface. Note `rpgCC.cs`: RPG chat commands, the first sign of the
role-play direction several of these forks took.

### Warp gates and transport pads

```
packs/warpGate.cs      Other/warpgatefuncitons.cs
packs/transpad.cs      packs/transpadmod.cs
```

Construction 0.69a already had teleporters with 40 frequencies
([Building systems](../40-construction-mod/building-systems.md#the-core-idea-deployables-as-building-material)).
Metallic adds a second, distinct movement system alongside them.

### Turret variety

```
turrets/mturret.cs          manned turret — "new manned turret" (v1.3.5) [mod-script]
turrets/repairturret.cs     automated repair
packs/projoturret.cs        projector turret
```

### Vehicles

```
vehicles/vehicle_betsy.cs
vehicles/vehicle_SkyBase.cs
vehicles/vehicle_Scorpion.cs
```

`vehicle_SkyBase.cs` is the interesting one for a *building* mod — a flying platform is construction
infrastructure, not transport.

### Other additions

| File | Purpose |
|---|---|
| `commanderMap.cs` | Restores the command map, which base Construction does not ship |
| `weapons/GraveLauncher.cs` | New weapon |
| `message.cs` | Message-system override — added by nearly every fork in this family |
| `do_not_delete/Dfunctions.cs` | Inherited from base |

## Its own changelog, read closely

Metallic's `Readme.txt` is unusually candid **[mod-script]**:

> ```
> **********************Metallic v1.3.8*******************
> -Bug fixes
>
> -Objective pack currently not working (can't remove it with the tool either)
>
> -Some vocabulary fixed
> ```

*"can't remove it with the tool either"* is the `$ReverseDeployItem` registration gap described in
[Building systems](../40-construction-mod/building-systems.md#the-construction-tool) — a deployable added
without its reverse-deploy entry cannot be removed by the Construction Tool. The author shipped it knowing
it was broken and documented the symptom precisely. It is the single most common Construction-fork bug and
here it is in the wild.

Later entries show the feature direction **[mod-script]**:

> ```
> -test door can now swap skin like normal pads
> -vehicle switch added: same as a switch but will be toggled by vehicle
> -new decorations: all vehicle shapes and some others
> -decorations whit target can now scale
> -decorations whit targets now have power modes
> -new funcitons to change the owner of peices
> ```

Three themes: **decoration as a first-class concern** (vehicle shapes repurposed as scenery), **power
modes extended to decorative objects**, and **ownership transfer** — the last being a direct response to
the GUID-ownership system 0.68a introduced. On a persistent build server, "I built this but want to hand
it over" is a real need that the base mod did not serve.

## What it removed

16 base `.cs` files are gone. Combined with 52 changed, Metallic is a **moderate-to-heavy fork** — it
reworked a substantial part of the base rather than layering on top. Merging Metallic features into
another fork would be manual work.

## For someone working on it

The extension checklist from
[Building systems](../40-construction-mod/building-systems.md#extending-a-construction-fork) applies
unchanged. Metallic-specific notes:

- **Put new helpers in `Other/`.** The convention already exists; use it rather than growing shadowed
  files.
- **Check `$ReverseDeployItem` first** when a piece will not deconstruct — the objective pack shipped
  broken for exactly this reason.
- **`Readme.txt` is Metallic's changelog; `Version-history.txt` is Construction's.** Do not mix them.

## Related

- [40 · The Construction Mod](../40-construction-mod/README.md) — the 0.69a base and the fork-family table
- [Building systems](../40-construction-mod/building-systems.md) — the mechanics Metallic extends
- [Turrets and deployables](../03-content-recipes/turrets-and-deployables.md) — the vanilla framework underneath
