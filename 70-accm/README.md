# 70 · ACCM

"Advanced Combat Construction Mod" — self-described, by name, as exactly the category this handbook
places it in.

| | |
|---|---|
| Full name | Advanced Combat Construction Mod **[mod-script]** |
| Developers | Eolk, Blnukem, Dark Dragon DX **[mod-script]** |
| Lineage | **CCM** — 46/173 `.cs` (26.6%) byte-identical, closest of any baseline (9.8%/9.8%/2.9% for 0.68a/0.69a/0.70a) |
| Ships as | Versioned archives; `T2-ACCM-develop.zip` analysed here |

## The name is the thesis

ACCM's own README states its category and its lineage in the same sentence **[mod-script]**:

> "Advanced Combat Construction Mod (ACCM) was a Combat Construction Mod (CCM) derivative that aimed to
> enhance the zombie shooting experience... Player vs Zombie... also the Player versus Player experience."

This is the cleanest self-classification anywhere in this handbook's mod survey — a fork naming its own
genre. Fingerprinting agrees: 26.6% of ACCM's `.cs` files are byte-identical to
[64 · CCM](../64-ccm/README.md), the closest of any baseline by a wide margin (under 10% for every plain
Construction version).

## PvE and PvP together, by design

The changelog documents both halves of the "Player vs Zombie... also Player versus Player" claim directly
**[mod-script]**:

> "Chat command '/killzombies'... Now it kills them all." / "Team 6 is now the 'offical zombie team'."

Dedicating an entire team slot to the zombie faction is a clean mechanical solution to running PvE and PvP
in the same match — zombies are simply another team, subject to the same team-scoped systems (damage,
targeting, scoring) as human players, rather than a bolted-on separate mechanic.

`scripts/weapons/` carries a full combat loadout well beyond CCM's own roster: `RocketLauncher.cs`,
`Shotgun.cs`, `superChainGun.cs`, `flamethrower.cs`, `snipergun.cs`, and more — armament clearly aimed at
making zombie-clearing satisfying at scale, consistent with a PvE-focused expansion of CCM's combat
systems rather than a subtle rebalance.

## Related

- [64 · CCM](../64-ccm/README.md) — the fork ACCM explicitly names as its own ancestor
- [69 · Dark Ages RPG Con Mod](../69-dark-ages-rpg-con/README.md) — a second CCM-derived combat expansion, RPG-flavoured instead
- [71 · Total Warefare Mod](../71-total-warefare-mod/README.md) — the same CCM lineage taken furthest
