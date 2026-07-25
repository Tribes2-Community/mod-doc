# 33 · AirKill

A training mod for one specific skill, by **-=[cK]=-Broesmeli** of the Cyberknights clan
(`http://www.cyberknights.ch`).

| | |
|---|---|
| Version | 1.0 **[mod-script]** |
| Lineage | **Base** — 66/176 `.cs` (37.5%) byte-identical to vanilla base; 0% to Classic |
| Ships as | `-mod Airkill` |
| Scope | 313 files: full script set (`weapons/`, `turrets/`, `vehicles/`, `packs/`), five dedicated training scripts |

## What "airkill" means

Not literal aircraft. An **air kill** is Tribes 2 slang for landing a disc hit on an opponent while both
players are airborne — off a ski jump, mid-jet, or skiing a slope — a recognised trick shot the
competitive community prized. The readme's own phrasing confirms the reading **[mod-script]**:

> "I created this MOD for train airkills."

"Train" as a verb, not a noun. The mod exists to practise landing that specific shot, evidenced by five
dedicated files — `Training1.cs` through `Training5.cs`, plus `TrainingGui.cs` — building a purpose-made
practice interface rather than repurposing an existing gametype.

The readme's other line of note is a bot-compatibility warning **[mod-script]**:

> "DON'T PLAY WITH BOTS! They have problems with the INV-Stations!"

## Confirmed base lineage

Fingerprinting all 176 `.cs` files: 66 (37.5%) are byte-identical to vanilla base, none match Classic. Key
files by similarity: `weapons/sniperRifle.cs` at 95.6% (barely touched), `weapons/disc.cs` at 87.7%
(moderate tuning — the disc is the air-kill weapon), `player.cs` and `defaultGame.cs` both around 87%.

## The outlier: a rewritten station system

One file breaks the pattern sharply. `station.cs` is only **28.9% similar to base** — by far the heaviest
edit in the mod, against a background where almost everything else is a light tuning pass. A manual diff
shows roughly 330 new lines appended, defining a custom **Mobile Base Teleporter** datablock and audio
set, and rewiring `StationVehiclePad::gainPower` / `losePower` and the teleport-trigger logic.

This plausibly explains the readme's bot warning: bot pathing expects stock inventory-station behaviour,
and a rewritten teleport/power system is exactly the kind of change that would confuse it without
touching anything a human player would notice as broken.

The rest of the mod's `weapons/`, `turrets/`, `vehicles/` and `packs/` trees largely mirror stock item
names rather than adding new content — the design effort concentrates on the disc and the station system,
consistent with a mod built around one skill rather than a general overhaul.

## Related

- [22 · Capture the Flag](../22-capture-the-flag/README.md) — the disc's home gametype
- [32 · BONES](../32-bones/README.md) — another base-lineage mod that rewrites station/vehicle mechanics
- [Turrets and deployables](../03-content-recipes/turrets-and-deployables.md) — inventory station and vehicle pad datablocks
