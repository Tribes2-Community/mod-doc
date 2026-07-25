# 68 · QuantiumX

The most heavily rewritten fork in the family. **Only 9 of Construction 0.69a's `.cs` files survive
byte-identical — 8 %.** Ninety-one base files were modified, ninety-nine added. QuantiumX is a Construction
fork in ancestry and effectively a separate codebase in practice.

| | |
|---|---|
| Base | **Construction 0.69a** (by fingerprint; only 8 % intact) |
| Scripts | 199 `.cs` — 9 identical to base, 91 changed, 99 new, 10 removed |
| Size | 214 files, 4.3 MB |
| Installs as | `GameData/Construction/` — replaces it entirely |

Its `Q&A.txt` is unambiguous about that last point **[mod-script]**:

> ```
> 1. Delete all of your existing Construction folder....
> ```

## The chat-command interface

QuantiumX's defining trait is that **manipulation moved from packs to chat commands**. Its own release
notes read like a CLI changelog **[mod-script]**:

> ```
> Virtually any object can be /objectscale'ed
>
> /objectscale has a 'get' scale command to get scales ie: /objectscale get
>
> /objectscale has a single 'get' scale command, put an X in which side you would like to leave alone
>   ie: /objectscale x x x
>
> /objectrotate taken out, useless and never used
>
> Virually any object can be named
>
> New swinging doors, swings on power or manually swing with /swing
> ```

Base Construction manipulates pieces through deployable modes and the beacon key
([Building systems](../58-construction-mod/building-systems.md#beacon-key-mode-switching)) — an approach
forced by having no spare input. QuantiumX sidesteps the input limit entirely by routing commands through
**chat**, which is unlimited, self-documenting, and scriptable.

That is a genuinely good idea on this engine. Chat arrives via `serverCmdMessageSent`
([Text and messaging](../04-interface/text-and-messaging.md#chat)), so a mod can intercept a prefix and
parse arbitrary arguments without touching the input system at all. The `/objectscale x x x` form — `x`
meaning "leave this axis alone" — is the kind of ergonomics you only get with a text interface.

Note also `/objectrotate taken out, useless and never used`. Removing a shipped feature because telemetry
of a sort said nobody used it is unusual discipline for this family.

## What it added

99 new files. Representative **[mod-script]**:

| Area | Files |
|---|---|
| Systems | `rpgFunctions.cs`, `LobbyGui.cs`, `message.cs` |
| Vehicles | `vehicle_f191.cs`, `vehicle_airbase.cs`, `vehicle_qcf.cs`, `vehicle_ICBMlauncher.cs`, `vehicle_spec_fx.cs` |
| Weapons | `deathray.cs`, `IonTargeter.cs`, `SSN.cs`, `lazerTag.cs`, `fireworksgun.cs`, `mortar.cs` |
| Building | `packs/doorPack.cs`, `packs/doorpack2.cs` |
| Odd | `putback/quanstar.cs`, `putback/fhData.cs` |

Three things stand out.

**`rpgFunctions.cs`** — the RPG drift visible across this family, here as a named subsystem.
[MooCon](../61-moocon/README.md) has a cash-and-jobs economy,
[Ultimate Build](../66-ultimate-build/README.md) has `RPMoneySettings.cs`, CCM has `RankStuff.cs` and
`RPchaingun.cs`. Four independent forks reached for persistent player progression on top of a building
sandbox.

**`LobbyGui.cs`** — a shadowed *client-side* GUI file. Most forks here are purely server-side; touching
the lobby means QuantiumX changes what the client sees before connecting, which raises the install
burden. See [Client/server split](../02-engine-model/client-server-split.md).

**`putback/`** — a directory whose name suggests staging or restoration. Abandoned or transitional
directories left in the tree are normal in this family; base Construction ships a disabled
`truPhysics.cs` the same way ([What it changed](../58-construction-mod/what-it-changed.md#new-subsystems)).

### An environment pack

From the release notes **[mod-script]**:

> ```
> New Envi. pack (Environment Pack): creates bushes/shrubs and various nature objects and effects
> including meteor storms, lightning, rain and snow.
> ```

Base Construction has `JTLmeteorStorm.cs` and `hazard.cs` as *server-controlled hazard events*. QuantiumX
turns weather into a **placeable deployable** — the builder decides it snows here. That is a coherent
extension of the mod's thesis: if building is the game, environment is building material.

### Rotating pads

> ```
> New rotating pads, rotates to which ever degree its set. Note: Continuous makes it keep rotating with
> power on… Note #2: objects on rotating pad will rotate with pad, keep in mind many pieces
> ```
> **[mod-script]**

Moving structures with mounted children. The truncated second note is the interesting part — carrying
attached pieces through a rotation is exactly where a deployable system built on static shapes starts to
strain.

## The cost of 8 %

QuantiumX demonstrates what happens when a fork rewrites rather than extends:

- **Nothing merges.** A fix in another Construction fork cannot be applied here without manual porting.
- **The base documentation stops applying.** Section 58 describes 0.69a; with 91 of its files modified,
  much of that description is no longer safely true of QuantiumX.
- **`Readme.txt` is stale.** It is still base Construction's verbatim — *"We just like to build stuff…"*,
  the Ninja Mod and Warped paragraph, the original deployable list **[mod-script]** — despite the scripts
  being 92 % different. The living documentation is `QuantiumReadMe.txt`, `Q&A.txt`, and
  `Version-history.txt`.

Compare [59 · Power Edition](../59-power-edition/README.md): comparable new content volume, 82 % of the
base left intact, and a delta you can still read.

## For someone working on it

- **Read `QuantiumReadMe.txt` and `Q&A.txt`, not `Readme.txt`.** The last is inherited and wrong.
- **Chat commands are the interface.** Extend that pattern rather than adding beacon-key modes; hook
  `serverCmdMessageSent` and validate the caller
  ([Client/server split](../02-engine-model/client-server-split.md#function-name-conventions)).
- **Verify against QuantiumX's own files, not section 58.** With 8 % of the base intact, assume nothing
  documented for baseline Construction still holds until you have checked it here.
- The vanilla framework pages in [02](../02-engine-model/README.md)–[05](../05-gameplay-systems/README.md)
  *do* still apply — those describe the engine, which no mod can change.

## Related

- [58 · The Construction Mod](../58-construction-mod/README.md) — the 0.69a base and fork-family table
- [59 · Power Edition](../59-power-edition/README.md) — the disciplined counterexample
- [Text and messaging](../04-interface/text-and-messaging.md) — the chat channel QuantiumX builds on
