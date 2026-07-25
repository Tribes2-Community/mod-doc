# 52 · botpilot & Werewolf

An AI-piloting addon and the heavier community fork built from it — two related pieces, not one mod, and
neither one a ruleset in the sense the rest of this section covers.

## Werewolf: the original release

**Piloting AI**, by **Josef "Werewolf" Jahn** (`www.playspoon.com`), version 2.0, 2001.

The readme is explicit about its own foundation **[community]**:

> "based on code in 'AiDebug.cs' by Dynamix"

Credits: Josef Jahn (main programmer and idea), Nathan Vegdal (navigation code), with a vehicle-team fix
from `{USB}Spiderman` and `{USB}|Hypn0tik|` — integrated into the "`{USB}` Mayhem Mod" community. Version
history runs 1.3 through 2.0, adding vehicle auto-buying, passenger auto-boarding, and missile use against
enemy vehicles. Its own behaviour notes are precise about scope **[community]**:

> "The bots are programmed to use nearby unused vehicles in order to reach far-away objectives... They
> will ONLY mount Bombers/Transports/Tanks as PILOT if at least ONE passenger is already inside... In this
> version, they DO NOT use the on-board weapons."

Two archived copies in this workspace are the same v2.0 release repackaged, one bundling an extra
random-soundtrack addon.

## botpilot: absorbed, rewritten, and re-credited

The `botpilot/` folder is not another copy of Werewolf's release — it is a **separate, heavier
aggregation** that starts from Werewolf's code and substantially rewrites it.

`botpilot/scripts/aiPilot.cs` opens with Werewolf's original header intact, naming him and 2001 — but a
line-level diff against Werewolf's own `aiPilot.cs` shows only **27.7% similarity**, despite nearly equal
length (1007 vs 1013 lines). The credit survived; the body did not. `station.cs` and `vehicle.cs` are
moderately closer, at 70.4% and 75.8%.

This folder sits on an **autoload plugin framework** (`prefs/autoload.ini`, `prefs/autoload.log`) and
pulls in work from a different mod lineage entirely: `scripts/addons/RevStringMatch.cs` is headed
**[mod-script]**:

> "Modified for server-side by Lexor for RevMod2, RevMod2 Lexor 12-14-2003"

— the same Lexor credited in [43 · Revmod2](../43-revmod2/README.md). Separately,
`scripts/autoexec/aiPilotShrike.cs` credits **"Lagg-Alot" (`JPerricone@nyc.rr.com`)**, thanking ZOD, and
`scripts/defaultGame.cs` itself carries a `z0dd - ZOD, 5/19/03` comment — the identical attribution style
found in [34 · Triumph](../34-triumph/README.md)'s `defaultGame.cs`. Three otherwise-unrelated mods in
this handbook (Triumph, Revmod2, botpilot) turn out to share code or credit from the same handful of
community contributors.

Beyond piloting, `botpilot` adds bot behaviours for CTF play, tank operation, and MPB deployment
(`scripts/autoexec/aiCTF.cs`, `aiDeployVehicle.cs`, `aiTank.cs`, `aiVehicle.cs`, `mpb.cs`). Its
`autoload.ini` references several plugins not actually present in this capture (an ECM menu, a
"reverse sniper" addon, recording and bind-manager support scripts) — evidence of a larger installation
this folder is only a partial snapshot of.

## Related

- [34 · Triumph](../34-triumph/README.md) — the same Lagg_Alot AI credit, in a different mod
- [43 · Revmod2](../43-revmod2/README.md) — Lexor's other credited work, absorbed here
- [51 · Small utilities](../51-small-utilities/README.md) — more Lagg's Default AI, packaged per-map instead
- [09 · The Support Pack](../09-support-pack/README.md) — the autoload-plugin idea, developed independently and more fully
