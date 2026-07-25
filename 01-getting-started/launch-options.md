# Launch options

Every command-line switch below is parsed by `console_start.cs` **[script]** — the loose script at the
`GameData/` root that the engine executes first. Because it is a plain text file you can read, this list
is exhaustive rather than folklore.

## The switches you will actually use

| Switch | Effect |
|---|---|
| `-mod <path>` | `setModPaths(<path>)`. Puts your mod on the search stack. **Also sets `$PureServer = false`.** |
| `-nologin` | `$SkipLogin = true`; launch mode becomes `Offline` (unless already `DedicatedServer`). The standard way to start a modded client today. |
| `-dedicated` | Launch mode `DedicatedServer`. Enables the Windows console, sets `$Host::Dedicated`, and calls `CreateServer()` immediately. |
| `-connect <address>` | Launch mode `Connect`; `$JoinGameAddress` set. Skips the menus. |
| `-mission <name> <type>` | Preselects map and gametype, validated by `validateMissionAndType()`. |
| `-bot <count>` | Sets `$CmdLineBotCount`, which becomes `$Host::BotCount`. |

## The complete list

Parsed in the argument loop of `console_start.cs`:

| Switch | Args | What it sets |
|---|---|---|
| `-mod` | path | `setModPaths(path)`; `$PureServer = false` |
| `-dedicated` | — | `$LaunchMode = "DedicatedServer"` |
| `-nonpure` | — | `$PureServer = false` |
| `-clientprefs` | file | `$clientprefs` (default `prefs/clientPrefs.cs`) |
| `-serverprefs` | file | `$serverprefs` (default `prefs/serverPrefs.cs`) |
| `-host` | — | `$LaunchMode = "HostGame"` |
| `-mission` | map type | `$mission`, `$missionType` |
| `-telnetParams` | port pass listenpass | `telnetSetParameters(...)` — the remote console |
| `-connect` | address | `$LaunchMode = "Connect"`, `$JoinGameAddress` |
| `-password` | pass | `$JoinGamePassword` |
| `-jload` / `-jsave` / `-jplay` | file | Journal record/playback; each sets `$PureServer = false` |
| `-navBuild` | map type | `$LaunchMode = "NavBuild"` — regenerate AI navigation graphs |
| `-spnBuild` | map type | `$LaunchMode = "SpnBuild"` — regenerate terrain spawn data |
| `-demo` | — | `$LaunchMode = "Demo"` |
| `-login` | name pass | Non-interactive WON login; `$PureServer = false` |
| `-show` | — | `$LaunchMode = "TSShow"` — the shape viewer |
| `-con` | — | `$LaunchMode = "Console"` — console only, no canvas |
| `-light` | map | `$LaunchMode = "SceneLight"` — precompute lighting |
| `-prepbuild` | — | Compiles every `.cs` and `.gui` to `.dso`, enables logging; `$PureServer = false` |
| `-quit` | — | Exits immediately |
| `-nologin` | — | `$SkipLogin = true`; `$LaunchMode = "Offline"` |
| `-online` | — | `$fromLauncher = true` (the online listen-server path) |
| *`<file>.dif`* | — | `$LaunchMode = "InteriorView"` — view an interior file directly |

A second, later loop handles a few Linux-porting aliases **[script]**:

| Switch | Alias | Effect |
|---|---|---|
| `--nosound` | `-s` | `$noloadAudio = 1` |
| `--fullscreen` | `-f` | `$pref::Video::fullScreen = 1` |
| `--windowed` | `-w` | `$pref::Video::fullScreen = 0` |
| `--gllibrary <lib>` | `-g` | `$pref::OpenGL::driver` |

## Things worth knowing about these

### `-mod` disables PURE

```php
else if ( $arg $= "-mod" && $hasNextArg )
{
   setModPaths( $nextArg );
   $i += 2;
   $PureServer = false;
}
```

PURE mode is the server-side asset-integrity check: a PURE server requires every executed script to come
from a hash-validated `.vl2`. Loose mod scripts cannot satisfy it, so `-mod` turns it off. You do not need
to pass `-nonpure` as well. See [Hosting and testing](../06-shipping/hosting-and-testing.md).

### `-mod` advances the argument index by two

The `-mod` branch does `$i += 2` where the loop already increments `$i` — so it consumes three slots for a
two-token switch. Put `-mod <path>` **last** on your command line, or accept that the argument immediately
after your mod name may be skipped. **[script]** This is a genuine quirk of the shipped parser, not a
documented behaviour; the shipped `Classic_*.bat` files all place `-mod Classic` last.

### `-prepbuild` is the batch compiler

```php
function prepBuild()
{
   for(%file = findFirstFile("*.cs"); %file !$= ""; %file = findNextFile("*.cs"))
      compile(%file);
   for(%file = findFirstFile("*.gui"); %file !$= ""; %file = findNextFile("*.gui"))
      compile(%file);
}
```

Useful when shipping a mod as compiled `.dso` only. See [Packaging](../06-shipping/packaging.md).

### The three launch scripts Sierra shipped

| File | Command |
|---|---|
| `Classic_LAN.bat` | `Tribes2.exe -nologin -mod Classic` |
| `Classic_online.bat` | `Tribes2.exe -online -mod Classic` |
| `Classic_dedicated_server.bat` | `ispawn.exe 28000 Tribes2.exe -dedicated -mod Classic` |

All three delete every `.dso` under both `base/scripts/` and `Classic/scripts/` first. Copy that pattern
for your own mod — see [Your first mod, step 4](your-first-mod.md#step-4--delete-stale-dso-files-after-every-edit).

## Preference files, not switches

Most tuning is *not* a command-line switch. `console_start.cs` loads, in order **[script]**:

```php
exec("scripts/clientDefaults.cs", true);
exec("scripts/serverDefaults.cs", true);
exec($clientprefs, true, true);      // prefs/clientPrefs.cs
exec($serverprefs, true, true);      // prefs/serverPrefs.cs
```

then `autoexec.cs` twice — once before defaults for command-line overrides, once after for video/window
settings. Anything you want configurable belongs in a pref variable, not a switch. See
[Global variables](../90-reference/global-variables.md).

## Under the community patches

The argument parser is vanilla `console_start.cs` and is **not modified** by either patch — every switch
above works unchanged. What changes is what some of them lead to.

| Switch | Difference on a patched install |
|---|---|
| `-nologin` | Still the standard modding launch. Skips login entirely, so the TribesNEXT auth stack stays idle. |
| `-login <name> <pass>` | Drives **TribesNEXT** account login, not WON. The vanilla WON entry points are replaced with no-op stubs so the vanilla scripts that call them do not error **[binary]**. |
| `-dedicated` | `IFC22.dll` carries an embedded script fragment redefining `dedCheckLoginDone` to a stub that just clears the login globals **[binary]** — that is how a dedicated server gets past a login step whose servers no longer exist. |
| `-mod` | Unchanged. Still sets `$PureServer = false`. |
| `-online` | Routes to the TribesNEXT server list rather than the dead WON master. |

The patch's own script is **not** reached through any command-line switch — `console_client_patches.cs` is
a loose root file executed by the DLL, outside the mod path stack. See
[TribesNEXT QoL patch](../07-community-patches/tribesnext-qol.md#how-the-patch-reaches-the-script-vm).

### Switches added by the support pack

The community [support pack](../09-support-pack/README.md) parses two of its own in
`DispatchLaunchMode()` **[support-script]**. They are script-side additions and do nothing on an install
without the pack:

| Switch | Effect |
|---|---|
| `-noautoload` | `$AutoloadEnabled = false` — skip the autoload system entirely |
| `-skipnewautoload` | Skip the scan for other autoloading `.cs` files |

Both are useful for isolating whether a bug is yours or the library's.

## Related

- [Boot sequence](../02-engine-model/boot-sequence.md) — what happens after argument parsing
- [Hosting and testing](../06-shipping/hosting-and-testing.md) — dedicated servers and PURE mode
- [Debugging](../06-shipping/debugging.md) — `-con`, telnet, and logging
- [07 · Community Patches](../07-community-patches/README.md) — patched-install behaviour
