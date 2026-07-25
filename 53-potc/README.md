# 53 · Pirates of the Caribbean

A small, self-contained custom gametype — one script, one mission, no dependencies beyond base.

| | |
|---|---|
| Version | 0.4 **[mod-script]** |
| Credits | "Concept by Beau, Coding by Red Shifter" **[mod-script]** |
| Ships as | `POTC_v4.vl2` — `missions/POTC.mis`, `terrains/POTC.spn`, `scripts/POTCGame.cs` |
| Scope | Five files total |

## The rules

`scripts/POTCGame.cs`'s header **[mod-script]**:

```
Fly a havoc above the high seas
Kill those scurvy dogs on the other team
```

Havoc-only air combat over water, in the spirit of the vehicle-only aerial gametypes documented at greater
scale in [36 · tac2](../36-tac2/README.md) — though POTC is a single self-authored gametype file rather
than a maintained mod family. It sets its own `$InvBanList` entries to restrict loadouts to what the
concept needs, and overrides `damageObject` for its own scoring.

At five files, POTC is closer to a weekend project than a maintained mod — worth documenting precisely
because it demonstrates how little a genuinely original gametype requires once
[Gametypes](../05-gameplay-systems/gametypes.md)'s discovery convention is understood: one script named
`scripts/POTCGame.cs`, and the engine finds it unassisted.

## Related

- [36 · tac2](../36-tac2/README.md) — a much larger, longer-maintained take on vehicle-only aerial combat
- [Gametypes](../05-gameplay-systems/gametypes.md) — the `scripts/*Game.cs` discovery convention this mod relies on
- [Turrets and deployables](../03-content-recipes/turrets-and-deployables.md) — `$InvBanList`, used here to restrict loadouts
