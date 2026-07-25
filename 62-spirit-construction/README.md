# 62 · Spirit Construction

A light 0.69a-based fork carrying a small novelty-toy pack from two credited contributors — no scoring or
gametype file touched, keeping it firmly on the peaceful side of the Construction family.

| | |
|---|---|
| Version string | `$ModVersion = "RythCon";` **[mod-script]** |
| Lineage | **140 `.cs`, 57 identical to 0.69a (41%)** — the second-lightest touch in the whole fork family after Power Edition |
| Files touched vs 0.69a | 10 registration-glue files only: `chatCommands.cs`, `ConstructionGame.cs`, `inventory.cs`, `inventoryHud.cs`, `pack.cs`, `player.cs`, `server.cs`, `vehicles/vehicle.cs`, `weapons/constructionTool.cs`, `weapons.cs` |
| Ships no readme | Identity comes entirely from `scripts/Spirit/exec.cs` and internal comments |

## No readme, no scoring changes

Spirit Construction ships no credits file and no readme — its identity is recoverable only from
`scripts/server.cs`'s version string and `scripts/Spirit/exec.cs`, which loads two separate author
subtrees. Of the ten files it touches relative to 0.69a, every one is a registration or glue file — none
of them a scoring, gametype, or combat-relevant script. That is the strongest possible evidence for a
peaceful fork: it would be trivial to add a weapon without touching scoring at all, but *this* fork
doesn't even try to.

## Two authors, two subtrees

`Spirit/exec.cs` loads work credited to two separate contributors, each in their own namespaced
directory:

**`Spirit/DDDX/`** — **Dark Dragon DX**, the same developer credited on
[70 · ACCM](../70-accm/README.md) — contributes `SpiritBlackHole.cs` and `SpiritGraplingTool.cs`, plus a
login/chat subsystem (`Login.cs`, `ConsoleStuff.cs`, `chat/Chat.cs`) and a waypoint pack.

**`Spirit/Synoryth/`** — a second author, contributing weather and sky scripting (`weatherScript.cs`,
`skyFunc.cs`), a chat-command help system with its own reference document (`Bible.cs`, `Chat/Help.cs`,
`Chat/chatCommands.cs`), a Flak Gun, missile-tail and "Spirit Nuke" particle effects, a shield system, and
a custom shielded bomber variant (`vehicles/vehicle_sbomber.cs`).

Both subtrees add weapons — a grappling hook, a black-hole gun, a flak gun, a "nuke" — that sound
combat-flavoured by name, but none of the ten files touched relative to baseline include scoring or
kill-tracking logic. These read as building-adjacent novelty tools (a grappling hook is a mobility aid; a
black hole is more plausibly a demolition or terrain-clearing tool in a building context) rather than a
genuine reintroduction of PvP — the meaningful line this handbook draws between sections 59–68 and
sections 69–71.

## Related

- [58 · The Construction Mod](../58-construction-mod/README.md) — the Construction Tool and `do_not_delete` convention this fork inherits unmodified
- [70 · ACCM](../70-accm/README.md) — Dark Dragon DX's other credited work, explicitly combat-focused
- [67 · Atomic Construction](../67-atomic-construction/README.md) — a heavier-touch peaceful fork, for contrast
