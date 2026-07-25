# 69 · Dark Ages RPG Con Mod

A monster-pack shooter with an RPG world map, built directly on CCM — the lightest touch in this
section.

| | |
|---|---|
| Author | Lord Sega, per the credits sign-off **[mod-script]** |
| Lineage | **CCM** — 75/164 `.cs` (45.7%) byte-identical, closest of any baseline (22.0%/18.3%/11.0% for 0.69a/0.68a/0.70a) |
| Ships as | `DARPGCon V.86.rar` |
| Scope | 21 top-level items, 164 `.cs` files |

## Credits confirm the CCM lineage before the fingerprint does

`Construction/Credits.txt`, inside the archive **[mod-script]**:

> "$The Con Crew$ JackTL, Mostlikely, Construct {They created con...} $CCM Crew$ Dondelium_X, CCM Crew
> {For a good mod to make DARPGCon.}"

Both Construction's original team and CCM's own crew are credited by name before any code is read.
Fingerprinting bears it out precisely: 45.7% of this mod's `.cs` files are byte-identical to
[64 · CCM](../64-ccm/README.md), against 22.0% or less for any of the three plain Construction baselines —
this is a CCM fork, not a Construction fork that happens to resemble CCM.

## CCM's zombie pack, reused by name

The mod's own readme confirms it directly borrows CCM's monster system rather than building a new one
**[mod-script]**:

> "/monsterpack - Gives you the monster pack, works just like zomb pack in ccm."

## What it adds: a world map and admin spellcasting

Beyond CCM's inherited combat and building base, Dark Ages RPG Con Mod layers an RPG framing on top —
`Buildings/Admin/Everworld3.cs` and `DARPGWorldMap.cs` implement a persistent world map, considerably
smaller in scope than [57 · IronSphere RPG](../57-ironsphere-rpg/README.md) but built on the same
underlying idea of a world rather than a rotation of independent missions.

A bundled document, `How to be a host sorcerer.txt`, documents an admin "spellcasting" command set
**[mod-script]**:

```php
JTLMeteorStorm(CLIENTID);
zap(CLIENTID.player);
```

alongside a one-hit "Strict Murder" kill command — administration framed as magic, in keeping with the
mod's dark-fantasy theme, rather than as a conventional admin panel.

## Related

- [64 · CCM](../64-ccm/README.md) — the fork this mod is built on, credited by name in its own files
- [70 · ACCM](../70-accm/README.md) — a second, independent CCM-derived combat expansion
- [57 · IronSphere RPG](../57-ironsphere-rpg/README.md) — a far larger persistent-world RPG, for scale
