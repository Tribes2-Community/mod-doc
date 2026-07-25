# 66 · Ultimate Build 2.0

A Construction fork organised around a **`serverScripts/` subtree**, an RP money system, and — unusually
for this family — a bundled third-party server-administration package shipped as `.vl2` archives.

| | |
|---|---|
| Base | **Construction 0.69a** |
| Scripts | 149 `.cs` — 30 identical to base (27 %), 69 changed, 50 new, 11 removed |
| Size | 162 files, 3.5 MB |
| Installs as | `GameData/Construction/` |
| Bundles | `Tricon2Server.vl2` (94.7 KB), `Tricon2ServerExpansion.vl2` (18.1 KB) |

## The `serverScripts/` tree

Ultimate Build's distinguishing structural choice — a whole parallel tree for its own content
**[mod-script]**:

```
serverScripts/
├── exec.cs              entry point
├── chatcommands.cs
├── packs/
├── scripting/
│   └── RPMoneySettings.cs
├── vehicles/
│   ├── vehicle_bomber.cs      vehicle_Bomber1.cs
│   ├── vehicle_Saucer.cs      vehicle_WARPscout.cs
└── weapons/
    ├── Nukegun.cs             plasmacannon.cs      FireworksGun.cs
    ├── flakgun.cs             PaintballGun.cs      railgun.cs
    ├── quadchain.cs           photonmissle.cs
```

The `exec.cs` entry point is the right shape — one file to load the subtree, so the whole addition is
identifiable and removable. Compare [Power Edition](../59-power-edition/README.md)'s `PowerPack/start.cs`;
both forks independently arrived at "put my stuff in its own directory behind one entry script", which is
the pattern this handbook recommends for any sizeable addition.

Where Ultimate Build differs from Power Edition is that it also **changed 69 base files** — so the tidy
subtree sits on top of a substantially reworked base, and only 27 % of 0.69a survives intact.

Note `quadchain.cs`: the quad-barrel chaingun from the 2003 community tutorial corpus
(`quadchain.html`, [tutorial index](../reference/source-tutorial-index.md)) shipping in a production
mod.

## Tricon 2

Ultimate Build ships two `.vl2` archives that are not Construction content at all **[mod-script]**:

```
Tricon2Server.vl2            94,686 bytes
Tricon2ServerExpansion.vl2   18,096 bytes
```

**Tricon 2 is a third-party remote server-administration suite** — telnet-driven, with its own GUI client,
prefs file, and in-game admin authentication. Its quick-start, shipped inside
[c2kconstruction](../60-c2k-construction/README.md), documents the setup **[mod-script]**:

```
Set $Tricon::Telnet::PasswordFull to your main telnet password.
Set $Tricon::Telnet::PasswordRead to your read-only telnet password.
Set $Tricon::Telnet::Port = to the telnet port you want. (Don't set it to your 28000 game port)
Set $Tricon::ClientPassword to your in-game admin password.
…
Join your server.
Type a text chat message (global or team) that contains nothing but your in-game admin password
```

Two things worth noting for a modder:

- **It uses the engine's telnet console** (`telnetSetParameters` — see
  [Console functions](../reference/console-functions.md#debugging)), the same facility documented in
  [Debugging](../06-shipping/debugging.md#telnet-console). A mod cannot open a new socket type, so remote
  administration on this engine means telnet.
- **Authentication is a chat message containing only the password.** That is a workable pattern given the
  available surface, and a reminder that anything typed in chat reaches the server through
  `serverCmdMessageSent` ([Text and messaging](../04-interface/text-and-messaging.md#chat)) — so a mod
  must be careful never to echo or log such a message.

Shipping Tricon 2 as `.vl2` archives rather than loose scripts also means it drops into `base/` and is
mounted through the normal archive scan
([Mod paths and overrides](../02-engine-model/mod-paths-and-overrides.md)) — independent of the mod
directory, and therefore usable with any mod.

Tricon 2 also appears, unpacked, inside
[60 · c2kconstruction](../60-c2k-construction/README.md#tricon-2). Two independent forks bundling the same
admin suite says something about how badly server operators wanted remote administration.

## The RP money system

`serverScripts/scripting/RPMoneySettings.cs` **[mod-script]** — the fourth independent currency or
progression system in this family, alongside [MooCon](../61-moocon/README.md)'s `CashScripts/` with
`jobs.cs`, [QuantiumX](../68-quantiumx/README.md)'s `rpgFunctions.cs`, and [CCM](../64-ccm/README.md)'s
`RankStuff.cs`.

None of them share code. Four teams, same base mod, same conclusion — that a persistent building server
needs an economy — and four incompatible implementations. That is the composability cost of file
shadowing ([What it changed](../58-construction-mod/what-it-changed.md#the-shadowing-strategy)) stated as
plainly as it can be.

## Other content

```
vehicles/B17Bomber.cs      vehicles/vehicle_bak.cs      weapons/mortar.cs
textures/                  additional texture assets
```

`B17Bomber` and `Saucer` mark the direction: recognisable real-world and science-fiction craft rather than
Tribes-universe vehicles.

## For someone working on it

- **Put new content in `serverScripts/`** behind `exec.cs`. The convention exists; the fork's tidiest
  aspect is that subtree.
- **Tricon 2 is separate from the mod.** It lives in `base/` as `.vl2` and is administered through its own
  prefs. Do not fold it into the mod directory.
- **Check `RPMoneySettings.cs` before adding anything economic** — the system is already there.
- **69 changed base files** means section 58's description of baseline behaviour needs verifying against
  this tree before you rely on it.

## Related

- [58 · The Construction Mod](../58-construction-mod/README.md) — the 0.69a base and fork-family table
- [60 · c2kconstruction](../60-c2k-construction/README.md) — the other Tricon 2 host
- [59 · Power Edition](../59-power-edition/README.md) — the same subtree discipline, applied throughout
- [Debugging](../06-shipping/debugging.md) — the telnet facility Tricon 2 uses
