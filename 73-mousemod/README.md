# 73 · mousemod

A client mouse-configuration mod that quietly bundles a full third-party admin console — two mods
travelling under one name.

| | |
|---|---|
| Ships as | Versioned by patch revision — "mousemod-v24834" is the most current per its own readme |
| Install | `tribes2/gamedata/MouseMod/`, plus a `t2start.bat` copied to `tribes2/gamedata/` |
| Bundled admin tool | Tricon2, the same suite covered independently in [60 · c2kconstruction](../60-c2k-construction/README.md) |

## What the name promises

The readme's install instructions frame this as a client input mod, versioned to track the game's own
patch numbering **[community]**:

> "Make a MouseMod folder in your tribes2/gamedata/ directory... unzip the mousemod.zip to
> tribes2/gamedata/mousemod (mousemod versions are named after Patch revisions. Most current is
> mousemod-v24834)."

`gui/MouseConfigDlg.gui` is the mod's actual namesake content — a client-side mouse-configuration dialog.

## What's actually bundled

The archive itself — 388 files — is far larger than a mouse-configuration dialog needs. Alongside the GUI
work, it ships a **complete Tricon2 admin package**: `Tricon2Server.vl2`, `scripts/TriconConfig.cs`, and a
full `scripts/tricon2/menuitems/` set covering ban, blow-up, disable-move, fair-teams, no-rape, and
practice-mode admin commands, plus its own `prefs/ServerPrefs.cs` and `prefs/ClientPrefs.cs`.

The install instructions confirm this is intentional, not incidental — a second password is configured
alongside the admin password **[community]**:

> "change the admin password in tribes2/gamedata/mousemod/prefs/serverprefs.cs" ... and the Tricon
> password in `mousemod/scripts/triconconfig.cs`.

So "mousemod" is really two mods sharing a distribution: a genuine client-side input utility, and a
server-side administration suite riding along with it. Whether that bundling was a deliberate convenience
or simply how one server's install tree got packaged and redistributed isn't recoverable from the archive
alone — but the Tricon2 component is functionally identical to what
[60 · c2kconstruction](../60-c2k-construction/README.md) and
[66 · Ultimate Build 2.0](../66-ultimate-build/README.md) bundle independently, in the Construction family.

## Related

- [60 · c2kconstruction](../60-c2k-construction/README.md) — the same Tricon2 suite, bundled with a Construction fork instead
- [66 · Ultimate Build 2.0](../66-ultimate-build/README.md) — a third independent Tricon2 bundling
- [72 · droc mod](../72-droc-mod/README.md) — a client mod with no server-side component at all, for contrast
