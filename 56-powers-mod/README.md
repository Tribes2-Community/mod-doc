# 56 · Powers Mod

An affinity-class RPG layer bolted onto four stock gametypes at once — "Powers Mod 2.2, Affinity
Uprising."

| | |
|---|---|
| Ships as | Three archives: a git export (`Powers-master.zip`), a LAN-only build, and an online build with precomputed lightmaps |
| Lineage | Custom overrides of `BountyGame.cs`, `CTFGame.cs`, `DnDGame.cs`, `HuntersGame.cs` — a server-side leveling/class mod, not client-only |
| Distinctive feature | A prestige tier — "second affinity classes" unlocked at character level 70+ |

## What "Affinity Uprising" adds

The readme is written as an ongoing dev log rather than a fixed feature list, and its 2.2 entry documents
a full prestige-class expansion **[community]**: six named second-affinity classes, each promoted from an
existing base class at level 70 — **Gladiator** (from Guardian), **Star Sighter** (from Star Lighter),
**Prospector** (from Enforcer), **Annihilator** (from Devastator), **Deep Freezer** (from Cryonium), and
**Phantom Lord** (from Overseer). Every second-affinity class carries named powers on cooldowns, drawing
from a dedicated "Affinity Energy" resource distinct from the stock energy pool. The same entry sketches a
roadmap beyond 2.2: per-class defensive traits, a power-selection and capping system, and a clan system —
some of which surface directly in the shipped scripts (`Core/Clan.cs`).

## Structure

The git export reveals the mod's real architecture: `scripts/Powers/Classes/ClassSelection.cs` and
`PowerStore.cs` drive the class/power system, `Core/Leveling.cs` handles experience and promotion, and
`Core/Clan.cs` implements the clan system the readme's roadmap promised. Rather than building one custom
gametype, Powers Mod overrides four stock ones directly — `BountyGame.cs`, `CTFGame.cs`, `DnDGame.cs`,
`HuntersGame.cs` — layering its class and leveling system onto each so the RPG progression works no matter
which base ruleset a server runs. The separate online-build archive additionally ships `lighting/*.ml`
precomputed lightmaps and its own `prefs/`, consistent with a mod distributed ready-to-host rather than as
a source drop.

## Related

- [57 · IronSphere RPG](../57-ironsphere-rpg/README.md) — a far larger RPG total conversion, for scale comparison
- [25 · Bounty](../25-bounty/README.md), [22 · Capture the Flag](../22-capture-the-flag/README.md) — two of the four stock gametypes this mod overrides rather than replaces
- [54 · Masters mod](../54-mastersmod/README.md) — another custom-class combat mod in this section
