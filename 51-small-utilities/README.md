# 51 · Small utilities

Two pieces of content too small and too mod-agnostic to belong anywhere else — the least-deviated end of
this section's spectrum, since neither one is a ruleset in itself.

## Randomizer!

A self-contained loadout randomiser designed to sit on top of whatever mod is already running.

| | |
|---|---|
| Ships as | `randomizer_v3.vl2`, drop into `base/` |
| Requires | Nothing specific — its own version history notes "Tested using Classic Mod — GOOD" |

Its readme states the whole idea in one line **[community]**:

> "Spawns everyone on the server with random armor, weapons, packs, grenades, and mines!"

Configuration is an admin toggle plus an ammo-station restriction option, with minimal bot support. It is
the smallest, most surgical mod encountered anywhere in this handbook's mod survey — one file, one job,
explicitly built to layer onto an existing server rather than replace its ruleset.

## Best Tribes 2 bots — Lagg's Default AI, per map

Not a mod at all in the gametype sense — ten directly-readable `.vl2` archives, each pairing a specific
map with a tuned copy of **Lagg's Default** bot AI: `arcticexposure`, `aztectemple`, `coldasice`,
`coldfront`, `drakmord`, `fumarole`, `nonavee`, `noquarter`, `omannru`, `raptor`, `stranglehold`.

The folder's own readme undersells what it actually contains **[community]**:

> "you can find the scripts in these files, the latest AI version (version 3) is in aztectemple."

Despite the "open it and read the tut" framing, each `.vl2` is a directly-openable archive with the actual
AI scripts inside — no extraction tutorial needed. `aztectemple.vl2` carries `LaggsDefault3_ai*.cs` files
including a ~281 KB `aiObjectives.cs` and objective/pilot/bombing-run logic; `drakmord.vl2` pairs the same
AI family with map-specific navigation data (`Drakmord.nav`/`.spn`). This is bot AI tuned per-map, not a
gameplay mod — the same "Lagg_Alot" credited independently in [34 · Triumph](../34-triumph/README.md) and
[52 · botpilot & Werewolf](../52-botpilot/README.md).

## Related

- [34 · Triumph](../34-triumph/README.md) — Lagg_Alot's bot AI, credited independently
- [52 · botpilot & Werewolf](../52-botpilot/README.md) — a heavier AI-piloting fork in the same community lineage
- [AI and bots](../05-gameplay-systems/ai-bots.md) — the task system this AI family is built on
