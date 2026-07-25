# Install anatomy — what is actually on disk

Everything Tribes 2 loads lives under `GameData/`. This page is a guided tour, because you cannot
override a file you cannot find.

## Confirming your build

This handbook targets **build 25034** — the patched v1.05 retail binary, released October 2002.

Open the in-game console (see [Debugging](../06-shipping/debugging.md)) and type:

```
echo(getT2VersionNumber());
```

You should see `25034`. **[binary]** The engine's `getT2VersionNumber` handler is a single
`MOV EAX, 0x61CA; RET` — `0x61CA` is `25034` decimal — so this value is a hard constant, not a
computed version. It is the canonical way to tell a patched install from an unpatched one, and it is
what the TribesNEXT community patch gates on.

`Tribes2.exe` carries a `TimeDateStamp` of 2002-10-30, matching the v1.05 patch release window. **[binary]**

## Top-level layout

```
GameData/
├── Tribes2.exe                  the game
├── console_start.cs             the first script the engine executes — loose, editable
├── base/                        the base mod: all vanilla content
├── Classic/                     the Classic mod: an alternate ruleset, ships with the game
├── *.dll / *.asi / *.m3d        runtime libraries (see below)
├── *CardProfiles.cs             GPU detection scripts
├── LowProfile.cs … HighProfile.cs   render quality presets
└── Classic_*.bat                launcher batch files for the Classic mod
```

### `base/` — the base mod

```
GameData/base/
├── base.vl2            engine bootstrap: console_end.cs, effects/
├── scripts.vl2         ★ all gameplay scripts + GUI (334 files)
├── shapes.vl2          .dts models + .dsq animations
├── skins.vl2           player/vehicle skins (the largest archive, ~103 MB)
├── textures.vl2        world and UI textures (~121 MB)
├── interiors.vl2       .dif building interiors
├── missions.vl2        .mis mission files + .nav navigation graphs
├── audio.vl2           sound effects
├── voice.vl2           voice pack clips
├── desert.vl2 · lava.vl2 · lush.vl2 · ice.vl2 · badlands.vl2
│                       per-environment terrain and prop sets
├── TR2final105-client.vl2 · TR2final105-server.vl2 · TR2final093-extras.vl2
│                       the v1.05 / v0.93 patch content
├── Classic_maps_v1.vl2 · zz_Classic_client_v1.vl2
│                       the Classic mod's maps and client scripts
├── music/              streamed music (loose)
├── prefs/              default preferences (loose; user prefs written here)
└── textures/           loose textures referenced directly by name
```

The archive you will spend the most time in is **`scripts.vl2`**. Unpack it and you get:

```
scripts/            gameplay code — the ~200 .cs files this handbook quotes throughout
  weapons/          one file per weapon (blaster.cs, disc.cs, chaingun.cs, …)
  packs/            one file per backpack item
  vehicles/         one file per vehicle
  turrets/          turret barrel definitions
  autoexec/         scripts auto-executed at startup
gui/                136 .gui interface definition files
help/               .hfl help documents for the mission editor
```

### `Classic/` — a complete worked example

`GameData/Classic/scripts/` holds the Classic mod's scripts as **loose `.cs` files** — no archive.
This is the single most valuable thing in your install: an officially shipped, complete mod that you can
read to see how overriding is done in practice. Read it early and often.

### Loose files at the `GameData/` root

| File(s) | Purpose |
|---|---|
| `console_start.cs` | The engine's first script. Parses the command line, loads defaults, drives login, then `exec`s `console_end.cs`. Loose and editable. |
| `*CardProfiles.cs` (`GeForce.cs`, `Radeon.cs`, `Voodoo3.cs`, `TNT.cs`, `Kyro.cs`, `Matrox.cs`, `Permedia3.cs`, …) | Per-GPU detection scripts. The engine probes the hardware and `exec`s the matching profile. |
| `LowProfile.cs`, `MediumProfile.cs`, `HighProfile.cs`, `V2Profile.cs` | Render-quality presets selected by the card profile. |
| `LinuxCardProfiles.cs`, `DRI-*.cs` | Linux GPU profiles. Tribes 2 shipped a Linux client. |
| `Classic_LAN.bat`, `Classic_online.bat`, `Classic_dedicated_server.bat` | Launchers for the Classic mod. Worth reading — see below. |
| `Mss32.dll` + `Mss*.m3d` / `Mss*.asi` / `Mp3dec.asi` / `Reverb3.flt` | Miles Sound System 6.0 audio stack. |
| `OpenGL2D3D.dll`, `GLU2D3D.dll`, `glon32.dr7` | OpenGL-over-Direct3D translation layers for pre-OpenGL-2.0 hardware. |
| `IFC21.dll`, `IFC22.dll` | Immersion TouchSense force-feedback drivers. (The TribesNEXT patch replaces `IFC22.dll` with a proxy — out of scope here.) |
| `T2Res.dll` | Icons, splash bitmaps, localized strings. |
| `TribesLogin.exe` | Separate MFC login helper. |
| `SierraPatch.dll`, `SierraPt.dll`, `SierraUp.exe`, `SierraUp.cfg`, `Su??.dll` | Sierra's autopatch infrastructure. Defunct — the servers are gone. |
| `ispawn.exe` | Process-spawn helper used by `Classic_dedicated_server.bat` (`ispawn.exe 28000 Tribes2.exe …`). |
| `Tribes2.exe.local` | Empty sentinel file. Forces Windows to resolve DLLs from the EXE's own directory first. |
| `kver.pub` | An RSA public key in PGP format. Purpose unconfirmed. **[inferred]** most likely Sierra patch signing. |

### What the Classic launcher batch files teach you

`Classic_LAN.bat` **[script]**:

```bat
del .\base\scripts\*.dso 1> nul 2>&1
del .\base\scripts\autoexec\*.dso 1> nul 2>&1
del .\base\scripts\packs\*.dso 1> nul 2>&1
del .\base\scripts\turrets\*.dso 1> nul 2>&1
del .\base\scripts\vehicles\*.dso 1> nul 2>&1
del .\base\scripts\weapons\*.dso 1> nul 2>&1
REM …same six lines again for .\Classic\scripts\…

start Tribes2.exe -nologin -mod Classic
```

Two lessons, both important:

1. **Sierra themselves deleted every `.dso` before launching a mod.** Compiled script caches shadowing
   edited source is the single most common cause of "my change did nothing". Adopt this habit.
2. `-nologin -mod Classic` is the canonical LAN/offline mod launch. `-online` replaces `-nologin` for a
   listen server; `ispawn.exe 28000 Tribes2.exe -dedicated -mod Classic` for a dedicated server.

## Under the community patches

Everything above describes a clean vanilla install. Yours is almost certainly patched. See
[section 07](../07-community-patches/README.md) for the full picture; the disk-level differences are:

### Files replaced

| File | Vanilla | Patched |
|---|---|---|
| `IFC22.dll` | Immersion TouchSense runtime, 192 KB, 2000 | **The patch itself** — 2.0 MB, 2025, mbedTLS + console-function registration **[binary]** |
| `Mss32.dll` | Miles Sound System 6.0 | Proxy routing audio to OpenAL Soft |
| `SierraUp.exe` | Sierra autopatcher | 6 KB no-op stub |

The `IFC22.dll` replacement is a **proxy-DLL hijack**: TribesNEXT ships a same-named DLL that stubs the 11
`CImm*` exports `Tribes2.exe` imports, so the import table resolves and the engine starts, then does all
its real work registering console functions at `DllMain` **[binary]**. Force feedback is dead as a result.

### Files added (QoL preview)

```
GameData/
├── console_client_patches.cs     47 KB — the master TorqueScript patch
├── console_client_discord.cs     9.7 KB
├── SDL3.dll                      window and input
├── soft_oal.dll                  OpenAL Soft
├── libcurl.dll + curl-ca-bundle.crt
├── discord_game_sdk.dll
└── base/
    └── t2csri.vl2                1.3 MB — patch scripts, .sdft fonts, login UI
```

RC2a instead ships `t2dll.dll`, `rubyintersect.dll`, `msvcrt-ruby190.dll`, and a 496 KB
`base/T2csri.vl2` — see [RC2a](../07-community-patches/rc2a.md).

### And possibly a script library

Independently of the patches, many installs carry `base/support.vl2` (392 KB) — the community script
library and module system. It adds `base/autoload.cs`, a `support/` module tree, a hook in
`scripts/autoexec/`, and writes `prefs/autoload.ini` and `prefs/autoload.log` at runtime
**[support-script]**. See [09 · The Support Pack](../09-support-pack/README.md).

### What does not change

`getT2VersionNumber()` still returns `25034` — the patch *requires* it and refuses to load otherwise
**[patch-script]**. `console_start.cs`, `base/`, `Classic/`, every `.vl2`, and the whole mod path
mechanism are untouched.

## Where files are looked up

A script asking for `shapes/weapon_disc.dts` does not give a full path. The engine resolves the bare
relative path against the **mod path stack**, checking loose files before archives and taking the first
hit. That mechanism is the subject of
[Mod paths and overrides](../02-engine-model/mod-paths-and-overrides.md) — read it next.

## Related

- [What you need](what-you-need.md) — tools for opening the archives described here
- [Mod paths and overrides](../02-engine-model/mod-paths-and-overrides.md) — how lookups resolve
- [File formats](../90-reference/file-formats.md) — what each extension actually is
- [07 · Community Patches](../07-community-patches/README.md) — what the patches change
