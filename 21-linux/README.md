# 21 · Linux, and the Loki Software port

Tribes 2 shipped on Linux. Not a community project, not a compatibility shim — a first-party port,
published by **Loki Software, Inc.**, with its own dedicated server binary, its own OpenGL driver
detection, and code written by Sam Lantinga, the creator of SDL, directly inside the shared
`console_start.cs` every platform runs.

| | |
|---|---|
| Publisher | Loki Software, Inc. — the Linux game-porting studio, active 1998–2002 |
| Dedicated server binary | `tribes2d` |
| Client | Sold separately from Loki; not preserved in this workspace |
| Config directory | `~/.loki/tribes2/` |
| This install's evidence | `tribes2d-wincd.run`, dated **27 March 2001**, MD5 `4f8ac9184ad8d141bdd8a83a590848ec` |

## Loki Software

Loki existed to port commercial games to Linux, Tribes 2 among them. The dedicated server package in
this workspace is a Loki `.run` self-extracting installer — `tribes2d-wincd.run`, 6.7 MB, built
27 March 2001 — accompanied by an MD5 checksum and a signature file, and documented in a bundled
`tribes2d-wincd.run.txt` **[binary]**.

That document is explicit about what it does and doesn't include **[community]**:

> "This dedicated server installation requires the Windows CD... The Linux client for Tribes 2 is
> available as a separate product from Loki Software, Inc."

So this is the **dedicated server only** — built from assets read off a Windows retail CD, not a
standalone Linux client install. The full graphical Linux client was Loki's commercial product and is not
part of this workspace; this section documents what can be verified: the dedicated server, and the
Linux-aware code shared by every platform.

### Installing and running it

Per the bundled instructions **[community]**:

```bash
sh tribes2d-wincd.run
```

mounts and reads the Windows CD, verifies the installer's own checksum, and — on first run — creates
`~/.loki/tribes2/` with default configuration, including `~/.loki/tribes2/base/prefs/ServerPrefs.cs`. To
start a server:

```bash
./tribes2d -dedicated Katabatic CTF
```

`-dedicated`, then a map name, then a gametype — the same argument shape as
[Launch options](../01-getting-started/launch-options.md) documents for Windows. Bots are `-bot N`:

```bash
./tribes2d -dedicated -bot 10
```

A bundled `tribes2d-restart.sh` restarts the server on crash and checks for updates first — an
auto-updating supervisor in the same spirit as `ispawn.exe` on Windows (section 01), but self-maintaining
rather than merely restart-on-crash.

## What's Linux-aware in the shared codebase

None of this is exclusive to a separate "Linux build" — it ships in the same `console_start.cs` and the
same loose `GameData/` files every Windows install has, gated by runtime checks.

### `$platform` and the hardware-acceleration guard

`console_start.cs` tests the engine's own platform flag before letting login proceed **[script]**:

```php
// Check for software rendering and bail, if that's what it is...
if ( ($platform $= "Linux") &&
     ((strstr($pref::Video::defaultsRenderer, "Indirect") != -1) ||
      (strstr($pref::Video::defaultsRenderer, "Mesa X11") != -1))  ) {
   LoginMessageBox( "ERROR", "Your 3D renderer (" @ $pref::Video::defaultsRenderer @ ") does not appear to be configured for hardware acceleration.", "OK", "quit();" );
   return;
}
```

"Indirect" and "Mesa X11" are what XFree86's software OpenGL fallback reports when the DRI (Direct
Rendering Infrastructure) hardware path isn't working — a common failure mode on 2001-era Linux graphics
stacks. Rather than let a player limp along at software-rendering framerates and conclude the game is
broken, the engine detects the specific failure signature and refuses outright, with a diagnostic message
naming the actual renderer string. `$platform` is a real, explicit engine global on both sides — the same
file also branches on `$platform $= "windows"` elsewhere (lowercase, unlike `"Linux"`'s capital L) **[script]**,
confirming this is genuine cross-platform detection built into the one shared `console_start.cs`, not a
Linux-only script variant.

### The GNU-style argument aliases, and who wrote them

`console_start.cs`'s command-line parsing loop carries an attribution most of this codebase lacks
**[script]**:

```php
// Go through the command line for setting overrides
// Added mostly for the Linux client (Sam Lantinga)
for($i = 1; $i < $Game::argc ; $i++)
{
   ...
   if($arg $= "--nosound" || $arg $= "-s")
      $noloadAudio = 1;
   else if($arg $= "--fullscreen" || $arg $= "-f")
      $pref::Video::fullScreen = 1;
   else if($arg $= "--windowed" || $arg $= "-w")
      $pref::Video::fullScreen = 0;
   else if($arg $= "--gllibrary" ...)
      $pref::OpenGL::driver = $nextArg;
```

**Sam Lantinga** is the creator of SDL (Simple DirectMedia Layer) and was a Loki Software engineer.
Double-dash long options (`--fullscreen`, `--windowed`, `--nosound`, `--gllibrary <lib>`) are the Unix
command-line convention, layered on top of Tribes 2's native single-dash switches
([Launch options](../01-getting-started/launch-options.md)) specifically so Linux users and launch
scripts could use familiar syntax. `--gllibrary` in particular — pointing the engine at a specific OpenGL
shared library by path — is a distinctly Linux-shaped need; Windows' driver model has no equivalent
concept exposed at the command line.

There is a pleasing loop here worth naming: twenty-some years after Lantinga wrote this, the modern
TribesNEXT QoL patch rewrote the *Windows* client's platform layer on top of **SDL3** — Lantinga's own
library, come back around to the platform it wasn't originally written for. See
[07 · Community Patches](../07-community-patches/tribesnext-qol.md).

### GPU detection: `LinuxCardProfiles.cs`

Loose in `GameData/`, alongside the Windows `*CardProfiles.cs` files, sits a parallel detection table for
Linux graphics drivers **[script]**:

```php
addCardProfile("VA Linux Systems, Inc.", "Voodoo3", true, true, true, true, true, false, true,  true, true, true,  false, true, "DRI-Voodoo3");
addCardProfile("VA Linux Systems, Inc.", "Rage128",  true, true, true, true, true, false, true,  true, true, false, false, false, "DRI-Rage128");
addCardProfile("VA Linux Systems, Inc.", "Radeon",   true, true, true, false, false, false, true, false, true, false, false, false, "DRI-Radeon");
addCardProfile("VA Linux Systems, Inc.", "G400",     true, true, false, false, true, false, true,  true, true, false, false, false, "DRI-Matrox");
```

**`"VA Linux Systems, Inc."`** is the OpenGL vendor string XFree86's open-source DRI/Mesa drivers reported
on Linux in this era, regardless of who actually manufactured the card — VA Linux Systems built and sold
Linux workstations and later founded SourceForge, and their name ended up baked into the driver stack the
whole ecosystem shared. Every profile in this file matches on that one vendor string and distinguishes by
*renderer* name (`Voodoo3`, `Rage128`, `Radeon`, `G400`, `G450`) instead — the opposite of the Windows
table, which matches real hardware vendor strings (`3dfx Interactive`, `ATI Technologies`, and so on)
directly. Five companion files carry the actual per-card settings: `DRI-Voodoo3.cs`, `DRI-Voodoo5.cs`,
`DRI-Rage128.cs`, `DRI-Radeon.cs`, `DRI-Matrox.cs` — each a plain list of `$pref::` assignments (detail
level, mip reduction, shadow quality) tuned for that card's DRI driver quirks, the same shape as the
Windows quality presets documented in
[Install anatomy](../01-getting-started/install-anatomy.md#the-boot-chain).

## Community mods on Linux

Loki's port wasn't the end of Linux support — some community mods shipped their own Linux builds. TAC2
("Team Aerial Combat 2 — The Ground Assault") is the clearest evidence in this workspace: alongside its
Windows releases, dedicated `tac2-040-042-linux.zip` and `tac2-040-043-linux.zip` archives shipped
Linux-targeted script bundles. Its own readme documents a real path difference between platforms
**[community]**:

> "Win32: Delete the tribes2/gamedata/tac directory. Linux: Delete the tribes2/tac directory."

No `gamedata` layer on the Linux install path — mods sat one directory shallower than their Windows
equivalents. If you are documenting or troubleshooting a Linux server running a community mod, do not
assume the Windows path structure translates directly.

The Evolution Admin Mod's own install instructions independently confirm the same shape for Classic:
`~/.loki/tribes2/classic` on Linux, against `GameData/classic` on Windows (section 26) — two unrelated
mod teams documenting the identical platform difference.

## What this handbook cannot confirm

The full graphical Linux client, its installer, and any Linux-specific rendering or input code beyond
what's shared in `console_start.cs` are not present in this workspace — Loki sold the client separately,
and nothing here traces its internals. Treat every claim above as scoped to the **dedicated server** and
to the **Linux-aware branches of the shared codebase**, not to a complete picture of the Loki client.

## Related

- [Launch options](../01-getting-started/launch-options.md) — the native single-dash switches these GNU-style aliases sit alongside
- [Install anatomy](../01-getting-started/install-anatomy.md) — the boot chain and per-card quality presets
- [Hosting and testing](../06-shipping/hosting-and-testing.md) — dedicated server operation on Windows, for comparison
- [07 · Community Patches](../07-community-patches/tribesnext-qol.md) — SDL3 in the modern Windows client
- [46 · Evolution in operation](../46-evolution-operation/README.md) — the matching Linux path convention for Classic
