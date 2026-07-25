# Packaging

## Mod folder layout

Mirror the base game. It costs nothing and makes your mod legible to anyone who knows Tribes 2.

```
GameData/MyMod/
├── scripts/
│   ├── autoexec/
│   │   └── mymod.cs           entry point — packages + exec of everything else
│   ├── weapons/
│   ├── packs/
│   ├── vehicles/
│   ├── turrets/
│   └── MyModGame.cs           gametype, auto-discovered
├── gui/                       .gui files
├── shapes/                    .dts models
├── textures/                  textures
├── audio/                     .wav files
├── missions/                  .mis files
├── terrains/                  .ter, .nav, .spn
├── interiors/                 .dif
└── MyMod_readme.txt
```

Everything resolves through the mod path stack, so a file at `MyMod/shapes/foo.dts` is found by any code
asking for `shapes/foo.dts`. See
[Mod paths and overrides](../02-engine-model/mod-paths-and-overrides.md).

The `Classic/` mod that ships with the game is the reference — read `GameData/Classic/` before designing
your own layout.

## What to ship

| Content | Client needs it? | Notes |
|---|---|---|
| Gameplay scripts, datablock tuning | **No** | Datablocks are transmitted at mission start |
| New `.dts` shapes, `.dsq` animations | **Yes** | The datablock names a file the client must have |
| New textures | **Yes** | |
| New `.wav` audio | **Yes** | Missing audio is silent, not an error |
| New `.gui` and client scripts | **Yes** | Client-side by definition |
| New missions, terrain, nav graphs | **Yes** | Clients load their own copy of the mission |

**A pure gameplay mod — new weapon tuning, new gametype rules, new damage numbers — is server-side only.**
That is why so many Tribes 2 mods were server-side: players join and it just works.

The moment you add one new model, every client needs a download.

## `.dso` compilation

The engine compiles `.cs` to `.cs.dso` on first load and prefers the compiled form afterwards
**[binary]** — the relevant strings are `%s.dso`, `Compiling %s...`, and `Loading compiled script %s.`

Batch compile everything with the `-prepbuild` launch mode **[script]**:

```php
function prepBuild()
{
   // this compiles all the scripts and guis
   for(%file = findFirstFile("*.cs"); %file !$= ""; %file = findNextFile("*.cs"))
      compile(%file);
   for(%file = findFirstFile("*.gui"); %file !$= ""; %file = findNextFile("*.gui"))
      compile(%file);
}
```

```bash
Tribes2.exe -prepbuild -mod MyMod
```

### Three shipping choices

| You ship | Result |
|---|---|
| **`.cs` only** | Users can read and learn from your code. Compiled on first run. **Recommended.** |
| **`.dso` only** | Source is obscured. The 2002 tutorials note this as the reason to do it **[community]**. |
| **Both** | The `.dso` wins; a stale one silently shadows the `.cs` you shipped. **Do not do this.** |

The `getting_started.txt` tutorial puts the case for shipping source well **[community]**:

> "It is also useful for you to distribute your mod, if you dont want to show everyone your code. I
> understand that, so maybe you can post some tutorials here to give some of your knowledge back to the
> community ;)"

Twenty-plus years on, every mod that shipped source is still learnable from and every mod that did not is
a black box. Ship the `.cs`.

> **Ship a cleaner.** Construction 0.68a and 0.69a shipped **three separate** stale-`.dso` batch files —
> `Constructs-DSO-Remover-2.1.bat`, `Constructs-DSO-deleter-1.2.bat`, `JTLdelDSO.bat` — written by
> different people and all included **[mod-script]**. If your mod ships loose `.cs`, ship one deleter with
> it. See [The Construction Mod](../58-construction-mod/what-it-changed.md#the-dso-problem-at-scale).

### Cleaning `.dso` before packaging

Whatever you choose, be deliberate. Sierra's `Classic_LAN.bat` deletes them all before every run
**[script]**:

```bat
del .\MyMod\scripts\*.dso 1> nul 2>&1
del .\MyMod\scripts\autoexec\*.dso 1> nul 2>&1
del .\MyMod\scripts\weapons\*.dso 1> nul 2>&1
del .\MyMod\scripts\packs\*.dso 1> nul 2>&1
del .\MyMod\scripts\vehicles\*.dso 1> nul 2>&1
del .\MyMod\scripts\turrets\*.dso 1> nul 2>&1
```

```powershell
Get-ChildItem -Path .\MyMod -Filter *.dso -Recurse | Remove-Item
```

## Building a `.vl2`

A `.vl2` is a **standard PKZIP archive** with a renamed extension **[binary]**. Vanilla archives use the
*Stored* method — no compression — which is why `scripts.vl2` is 4.7 MB of mostly text.

```bash
cd MyMod
zip -0 -r ../MyMod.vl2 scripts gui shapes textures audio
```

```powershell
Compress-Archive -Path .\MyMod\scripts, .\MyMod\gui -DestinationPath .\MyMod.zip
Rename-Item .\MyMod.zip .\MyMod.vl2
```

`-0` selects Stored, matching the vanilla convention. Deflate also works — TribesNEXT's `t2csri.vl2` uses
Deflate for `.cs` and Stored for `.cs.dso` **[binary]** — so compression is a size/load-time trade-off,
not a compatibility one.

### Paths inside the archive

Paths are relative to the mod directory, with forward slashes:

```
scripts/autoexec/mymod.cs
scripts/weapons/burstDisc.cs
gui/MyModDialog.gui
shapes/my_gun.dts
```

**Not** `MyMod/scripts/...` — the mod directory is the archive's root.

### Where the archive goes

| Placement | Effect |
|---|---|
| `GameData/MyMod/MyMod.vl2` | Normal — mounted when `-mod MyMod` is used |
| `GameData/base/zz_MyMod.vl2` | Applies to *every* game, no `-mod` needed. The `zz_` prefix sorts last so it outranks `base.vl2`. |

The second is how `zz_Classic_client_v1.vl2` works **[script]**. It is powerful and it is also how you
break someone's install — use it only for genuinely global changes, and name it distinctively.

> **Loose files beat archives** within a mod directory. A leftover loose `.cs` in your dev folder will
> shadow the archived version and you will chase a phantom bug. Clean the folder before testing your
> archive.

## Distribution

The 2002-era convention, still the sanest **[community]**:

```
MyMod-1.0.zip
└── GameData/
    └── MyMod/
        ├── scripts/…
        ├── MyMod_readme.txt
        └── MyMod.bat
```

Users extract into their Tribes 2 directory and run the `.bat`.

### Ship a launcher

```bat
@echo off
REM #######################################################
REM MyMod v1.0 — LAN / offline loader
REM This batch file MUST be run from the GameData directory
REM #######################################################

del .\MyMod\scripts\*.dso 1> nul 2>&1
del .\MyMod\scripts\autoexec\*.dso 1> nul 2>&1
del .\MyMod\scripts\weapons\*.dso 1> nul 2>&1

start Tribes2.exe -nologin -mod MyMod
cls
exit
```

and a dedicated-server variant:

```bat
@echo off
start ispawn.exe 28000 Tribes2.exe -dedicated -mod MyMod
cls
exit
```

`ispawn.exe` is Sierra's process-spawn helper, used by `Classic_dedicated_server.bat` **[script]**.

Put `-mod MyMod` **last** on the command line — the argument parser's `-mod` branch advances the index by
two on top of the loop's own increment, so the token after your mod name may be skipped **[script]**. See
[Launch options](../01-getting-started/launch-options.md#-mod-advances-the-argument-index-by-two).

### Write a real readme

Include, at minimum:

- The exact launch command.
- Whether clients need to install anything, or only the server.
- Which gametypes and maps it adds or changes.
- Which base files it shadows, if any — this is what tells another modder whether your mod is compatible
  with theirs.
- A version number, and what changed.

`GameData/Classic/Classic_readme.txt` and `Classic_technical.txt` are the shipped examples.

## Compatibility with other mods

| Your technique | Compatible with other mods? |
|---|---|
| Package overrides calling `Parent::` | **Yes** — that is the whole point |
| New datablocks with distinct names | Yes |
| Appending to `$WeaponsHudData` at `$WeaponsHudCount` | Yes |
| Shadowing a base `.cs` file | **No** — only one mod can win |
| Writing a fixed index into `$WeaponsHudData` | No |
| Renumbering `$DamageType::` constants | No — and it breaks the engine |
| `base/zz_*.vl2` | Depends — conflicts with any other archive touching the same paths |

Document what you shadow. A modder who can read your readme and see "shadows `scripts/player.cs`" knows
immediately whether your mod can coexist with theirs.

## Versioning against build 25034

Guard anything version-sensitive:

```php
if (getT2VersionNumber() != 25034)
{
   error("MyMod requires Tribes 2 build 25034 (patch v1.05).");
   return;
}
```

This is exactly what the TribesNEXT community patch does **[script]**, and it turns a baffling crash into
a clear message. **[binary]** — `getT2VersionNumber` is a hard constant, so the check is reliable.

## Under the community patches

### Asset downloads may deliver your art

The QoL patch adds `enableAssetDownloads(bool)`, driven by `$pref::Net::downloadAssets`
**[patch-script]**, letting a server ship missing files to joining clients.

This softens the "client needs it" column in the table above. A mod adding a new `.dts` may reach players
without a separate client install.

**Do not rely on it as your only delivery path.** It is a user-toggleable preference — some clients will
have it off — and the exact delivery scope has not been verified here. Ship a client package as well and
treat downloads as a convenience for people who skipped it.

### Never ship patch files

Do not bundle `IFC22.dll`, `Mss32.dll`, `t2csri.vl2`, `console_client_patches.cs`, or any other patch
artifact with your mod. Three reasons, any one sufficient:

- Users install the patch themselves and versions move independently of yours.
- You would be shipping someone else's binary as though it were yours.
- The licences are not yours to redistribute — RC2a's Ruby components are GPL-3-or-later, and the patch
  scripts carry a 2008 T2CSRI copyright.

Link to TribesNEXT in your readme instead.

### Never shadow patch paths

The patch archive claims `t2csri/*` and `base/loginScreens.cs`. A mod shipping either shadows the patch
through the normal mount stack and breaks authentication. Also avoid the `t2csri_` prefix on function and
package names.

On RC2a, additionally avoid `scripts/autoexec/t2csri_*.cs` — see
[RC2a](../07-community-patches/rc2a.md#the-collision-that-matters).

### Fonts and layout

If you ship `.gui` files, be aware the QoL patch substitutes every vanilla font for a `.sdft`
**[patch-script]**. A layout tuned against vanilla `.gft` metrics shifts. Test on a patched install before
release; see [GUI system](../04-interface/gui-system.md#under-the-community-patches).

### Support-pack dependencies

If your mod `#include`s support-pack modules, **your users must install `support.vl2` too**. Say so in the
readme, name the modules, and pin versions where behaviour matters:

```
Requires: support.vl2  (support/callback.cs, support/flag_tracker.cs 0.0.3+)
```

Do not bundle `support.vl2` — link to it, as with the patches. And do not ship files at any path it
claims: `autoload.cs`, `support/*`, `scripts/autoexec/autoload_launcher.cs`, `prefs/autoload.*`. See
[09 · The Support Pack](../09-support-pack/README.md).

For a **server-side** mod, take no support-pack dependency at all — it is client-side infrastructure and
the install requirement buys you nothing.

### State what you tested against

Put it in the readme:

```
Tested on: Tribes 2 build 25034 + TribesNEXT preview 20250922
Server-side only — clients need no installation.
Shadows: nothing. Packages: MyMod (overrides CreateServer, Weapon::onUse).
```

Those four lines answer almost every question another modder or a server operator will have.

### The version gate still applies

`getT2VersionNumber()` returns `25034` on a patched install exactly as on vanilla — the patch *requires*
it and refuses to load otherwise **[patch-script]**. The guard recommended below works on both.

## Related

- [Mod paths and overrides](../02-engine-model/mod-paths-and-overrides.md) — how your files get found
- [Hosting and testing](hosting-and-testing.md) — testing before release
- [Launch options](../01-getting-started/launch-options.md) — `-prepbuild` and the rest
- [File formats](../reference/file-formats.md) — `.vl2` and `.dso`
- [Modding against a patched install](../07-community-patches/modding-against-a-patched-install.md#distribution-notes) — distribution guidance
