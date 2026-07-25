# 75 · renclient4

A small client-side HUD and audio autoexec for Renegades-branded servers — and, notably, by Classic's own
**z0dd**.

| | |
|---|---|
| Author | ZOD (z0dd) **[mod-script]** — the same author as Classic itself (sections 37–40) |
| Site | `planetrenegades.com` **[mod-script]** |
| Ships as | `renegadesclient4.vl2`, 7 entries |
| Version | 4.0 **[mod-script]** |

The single script it carries, `scripts/autoexec/RenegadesClient.cs`, states its purpose in its own header
**[mod-script]**:

> "Misc functions for use on Renegades modded servers"

It customises `$vehicleReticle` and `$ControlObjectReticle` HUD reticles, and registers a client-side
message callback that plays a bundled voice line
(`audio/voice/Announcer/renegades.wav`) in response to server chat triggers.

Finding z0dd's name here — outside Classic, outside Defend and Destroy, outside the physics work covered
extensively in sections 37–40 — is one more data point for a pattern this handbook keeps confirming: the
same small set of early-2000s Tribes 2 scripters turn up across an unexpectedly wide range of unrelated
projects. See [34 · Triumph](../34-triumph/README.md) and
[52 · botpilot & Werewolf](../52-botpilot/README.md) for two more instances of exactly this.

## Related

- [37 · Classic](../37-classic/README.md) — z0dd's best-known and most extensively documented work
- [34 · Triumph](../34-triumph/README.md) — another mod carrying z0dd-attributed patches
- [76 · Team Gauntlet client](../76-teamgauntlet-client/README.md) — another server-branded client autoexec/HUD bundle
