# 76 · Team Gauntlet client

The client-side half of a gametype whose server logic isn't preserved in this workspace — documented for
what it confirms about client/server mod distribution, not as a complete account of "Team Gauntlet."

| | |
|---|---|
| Ships as | `TeamGauntletClient.vl2`, 4.9 MB, 53 files |
| Contents | `scripts/autoexec/TGClient.cs`, `TGObjHud.cs`; interior prefabs; loading-screen textures |
| What's missing | Any server-side `TeamGauntletGame.cs` gametype logic |

`scripts/autoexec/TGClient.cs` labels itself directly in its own comments as the client-side lobby and
menu code for a gametype named Team Gauntlet **[mod-script]**. `TGObjHud.cs` implements that gametype's
objective HUD, explicitly referencing a `TeamGauntletGame` class it expects the server to provide.
Alongside the scripts, the archive carries several interior prefabs — ruin, bridge, and base structures,
including one named `btf_base1.dif` — and a set of `Load_*.png` loading-screen textures, but no readme.

**No server-side gametype file is present.** This is exactly the shape
[Client/server split](../02-engine-model/client-server-split.md) predicts: a client cannot function
without a server willing to run the matching gametype, and this archive is only the half a player would
need to download — the operative half for someone joining a Team Gauntlet server, and the wrong half for
anyone trying to reconstruct how the gametype actually scores.

## Related

- [Client/server split](../02-engine-model/client-server-split.md) — why a gametype's client and server halves ship separately
- [22 · Capture the Flag](../22-capture-the-flag/README.md) — a gametype documented from complete source, for contrast
- [75 · renclient4](../75-renclient/README.md) — another server-branded client autoexec bundle
