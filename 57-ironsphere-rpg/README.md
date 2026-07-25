# 57 · IronSphere RPG (DarkRealmsRPG)

The most heavily transformed mod in this handbook — a 1240-file total-conversion RPG that no longer
resembles a Tribes 2 combat game in any respect except the engine underneath it.

| | |
|---|---|
| Real product name | **DarkRealmsRPG** — revealed by its own uninstaller, `PROG_NAME=DarkRealmsRPG` **[mod-script]** |
| Ships as | `IronSphere`, in `gamedata/IS/` |
| Creator | JeremyIrons (original creator); Trident_RX (head coder, later creator) **[mod-script]** |
| Scope | 1240 files: 67 audio, 20 gui, 106 interior prefabs, 2 missions, 24 music tracks, 15 particle sets, 62 scripts, 135 shapes, 791 textures |
| Site | `http://TribesRpg.ServeGame.com` **[mod-script]** |

## Two names for one project

The mod presents itself as "IronSphere" in its own in-game text, but its Windows uninstaller —
`un_DarkrealmsInstall_34048.txt` — reveals the product registered under a different name entirely
**[mod-script]**:

```
PROG_NAME=DarkRealmsRPG
```

with launcher scripts named `Tribes2RPG_Online.bat`, `Tribes2RPG_dedicated_server.bat`, and
`Tribes2RPG_Offline.bat`. IronSphere is the mod's public identity; DarkRealmsRPG is what it called itself
at install time — the kind of discrepancy only a leftover uninstaller log would expose.

## Credits

`gamedata/IS/IS.txt` opens with unusual warmth for a mod readme **[mod-script]**:

> "Welcome and thank you for playing our Tribes2 IronSphere Total Conversion Modification!"

Credits: Goodie, Gul'Dar, HiVoltage, **JeremyIrons** (original creator), Lone Predator, Scourage (coder),
SoulSlayer, **Trident_RX** (head coder and creator), Toaster (documentation), Twister, **Fina** (head
mapper), Sirsteven (lead tester), and Jardin De Cecile (music score) — a large, role-differentiated team,
consistent with the scope of what shipped.

## What "total conversion" means here, concretely

`gamedata/IS/scripts/` — 62 files — names the systems directly through its own file naming: character
**classes** (`rpgclasses.cs`) and **races** (`rpgraces.cs`); **leveling, stats, health and mana**
(`rpgstats.cs`, `rpghp.cs`, `rpgmana.cs`); **skills** with their own GUI (`rpgskills.cs`,
`rpgSkillGui.cs`); **inventory and items** (`rpginventory.cs`, `rpgitems.cs`); an **economy** with shops
and trade (`rpgeconomy.cs`, `rpgshopscreen.cs`, `RPGtradeScreen.gui`); **guilds** with their own management
and registration interfaces (`rpgguilds.cs`, `GuildManagementGUI.cs`, `GuildRegister.cs`); player
**housing** (`rpghouse.cs`); **quests** (`rpgquest.cs`); **parties** (`rpgparty.cs`); a **jail** system
(`rpgjail.cs`); **mining** and **smithing** crafting loops (`rpgmining.cs`, `rpgsmithing.cs`); **spells**
(`rpgspells.cs`); PvP **zones** (`rpgzones.cs`); a day/night **time-of-day** system (`rpgTime.cs`); an
in-game **admin GUI** (`RPGadminScreen.gui`); and custom AI (`aiRPG.cs`, `aiHunters.cs`).

That is a full MMO-lite feature set — character progression, crafting, an economy, guilds, housing, and
PvP zones — none of which exists in any form in base Tribes 2 or in any other mod this handbook covers.

## The asset investment matches the script scope

**106 interior prefabs** — towns (one named "Keldrin"), player-class homes, defensive strongholds, mines,
and a boss location named "Minotaur's Lair." **791 textures**, over three times any other mod surveyed in
this handbook. **24 original music tracks**, credited to Jardin De Cecile as a full score rather than a
handful of loops. A single dedicated `T2RPG_Worldmap.mis` mission anchors the whole persistent world,
rather than a rotation of independent maps — the structural signature of a persistent-world RPG rather
than a match-based shooter.

## What this handbook can and cannot verify

The scope above is confirmed structurally — file names, credits, and asset counts are all directly
readable. The actual balance and mechanics of the class/skill/economy systems are not analysed here in
the depth this handbook gives combat mods elsewhere; a project of this size would need its own multi-page
treatment to do that justice, and this section's purpose is placing it correctly on the deviation
spectrum, not exhausting it. It sits at the extreme end deliberately: everything else in sections 32–56
is still recognisably Tribes 2 under new rules. This is not.

## Related

- [56 · Powers Mod](../56-powers-mod/README.md) — a much smaller RPG-class layer, for scale comparison
- [58 · The Construction Mod](../58-construction-mod/README.md) — the other total conversion in this handbook, building rather than levelling
- [05 · Gameplay Systems](../05-gameplay-systems/README.md) — the base AI/gametype conventions this mod builds far beyond
