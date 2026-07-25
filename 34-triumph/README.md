# 34 · Triumph

A weapon and vehicle overhaul built on the Bounty gametype, maintained across thirteen releases from 2003
to 2009 by **REDmosquito & P!nkP?nther**.

| | |
|---|---|
| Version | 2.3, 15 June 2009 **[mod-script]** |
| Lineage | **Base** — 39/149 `.cs` (26.2%) byte-identical to vanilla base; 0% to either Classic build |
| First released | 2003, as v1.0 |
| Bots | "Triumph Bots 1.1," by P!nkP?nther, based on Lagg_Alot's Bot-AI (Community Pack 5404) |

## Credits and lineage

The credits file is candid about the mod's age and its debts **[mod-script]**:

> "Triumph version 2.3, 6/15/2009... This mod was first released as version 1.0 in 2003, 13 versions
> later..."

Thanks list Drumstix42 (advancedmod.com), Laggalot, Lt. Earthworm, Badshot, The_Force, Razer, SirElim,
and — notably — **ZOD and z0dd**, Classic's own author, credited by name in this base-lineage mod's own
credits. `defaultGame.cs` carries z0dd-attributed patches at two separate points in the file, dated to his
active period. This is the same small, cross-pollinating early-2000s scripting community this handbook
keeps meeting from different directions — z0dd's fixes travelled into mods well outside Classic itself.

Fingerprinting confirms the base lineage the credits imply: 39 of 149 `.cs` files are byte-identical to
vanilla base, none match either Classic build. Similarity on key files: `BountyGame.cs` at 96.5% (light
touch-ups only), `defaultGame.cs` at 89.3%, `player.cs` at only 70.6% — heavily rewritten to carry the
mod's large custom weapon and armour roster.

## Scope

Triumph ships the full stock gametype roster (CTF, DM, DnD, Hunters, Rabbit, Siege, CnH) alongside Bounty,
but its actual content is roughly thirty custom weapons layered on top: Dual Blaster, ELF Cannon, EMP
Launcher and EMP Grenade, Light Saber / BeamSword, Gatling Gun, HeadHunter, Heavy Grenade Launcher, RPG,
Mortar Storm, Widow Maker, Tactical Nuke, Green Lantern, and an Anti-Air Gun — with matching turrets and
deployable packs (Bunker, Anti-Turret, Deep Cover, a spy satellite).

The bot AI is its own credited sub-project: "Triumph Bots 1.1," dated 16 January 2005, explicitly built on
**Lagg_Alot's Bot-AI scripts** from a community pack — the same Lagg_Alot/Lagg-Alot credited in section 52
for the shrike-piloting addon absorbed into `botpilot`. Triumph's bots use bunkers and telepads, choose
weapons contextually, and — a distinctive touch — arm heavy armour bots with Tactical Nukes.

## Related

- [25 · Bounty](../25-bounty/README.md) — the gametype Triumph is built around
- [52 · botpilot & Werewolf](../52-botpilot/README.md) — the same Lagg_Alot AI lineage, absorbed differently
- [31 · The base ruleset](../31-base-ruleset/README.md) — the armour/weapon baseline this mod extends
