# Hosting and testing

## The three server modes

| Mode | Command | Use for |
|---|---|---|
| **Offline / LAN** | `Tribes2.exe -nologin -mod MyMod` | Day-to-day development. Fastest loop. |
| **Listen** | `Tribes2.exe -online -mod MyMod` | Testing with real clients while playing |
| **Dedicated** | `ispawn.exe 28000 Tribes2.exe -dedicated -mod MyMod` | Release testing — no canvas, console only |

All three are what Sierra shipped as `Classic_LAN.bat`, `Classic_online.bat`, and
`Classic_dedicated_server.bat` **[script]**.

**Test on a dedicated server before you release.** A large class of bugs — client-side code accidentally
running server-side, GUI calls in server paths, anything touching `Canvas` — only appears when there is no
canvas at all. `console_end.cs` takes a completely different branch for `$LaunchMode $= "DedicatedServer"`
**[script]**:

```php
if($LaunchMode $= "DedicatedServer")
{
   enableWinConsole(true);
   $Host::Dedicated = true;
   $HostGameType = "Online";
   $ServerName = $Host::GameName;
   setNetPort($Host::Port);
   CreateServer($Host::Map, $Host::MissionType);
   return;                     // ← never reaches the GUI loading below
}
```

Note the `return` — the entire client-side GUI block below it is skipped. If your mod `exec`s a client
script from a server hook, it fails here and nowhere else.

## Server settings

`scripts/serverDefaults.cs` **[script]**:

```php
$Host::GameName   = "Tribes 2 Server";
$Host::MaxPlayers = 64;
$Host::Port       = 28000;
$Host::Password   = "";
$Host::Dedicated  = 0;
$Host::BotCount   = 2;
$Host::BotsEnabled = 0;
$Host::TournamentMode = 0;
```

Override them in `prefs/serverPrefs.cs`, or from your mod's entry script. `console_start.cs` loads
defaults then prefs **[script]**:

```php
exec("scripts/serverDefaults.cs", true);
exec($serverprefs, true, true);      // prefs/serverPrefs.cs
```

so a pref always wins over a default. Use `-serverprefs <file>` to point at an alternate prefs file —
handy for running several test configurations from one install.

## PURE mode

PURE is the server-side asset-integrity check: every executed script must come from a hash-validated
`.vl2`.

`console_start.cs` **[script]**:

```php
$PureServer = true;                 // the default

// …in the argument loop:
else if ( $arg $= "-mod" && $hasNextArg )
{
   setModPaths( $nextArg );
   $i += 2;
   $PureServer = false;             // ← -mod turns PURE off for you
}

// …later:
if ($LaunchMode $= "DedicatedServer" && $PureServer)
{
   if (setPureServer(1))
      $Con::prompt = "PURE% ";
}
```

The engine's error strings spell out the checks **[binary]**:

```
Error: Unable to host a PURE server - file %s found not in a pure volume.
Error: Unable to host a PURE server - file %s has no data.
Error: Unable to host a PURE server - filePath for %s does not match.
Error: Unable to host a PURE server - unable to open file %s.
Error: Unable to host a PURE server - unable to open file console_start.cs.
Unable to host a PURE server - hash value does not match.
Executing non-PURE script %s.
PURE server has been verified.
```

**Practical facts:**

- A modded server is a non-PURE server. This is normal and expected.
- `-mod` already sets `$PureServer = false`; you do not need `-nonpure` as well.
- `-jload`, `-jsave`, `-jplay`, `-login`, and `-prepbuild` also clear it **[script]**.
- If your console prompt shows `PURE% ` you are running a pure server, which means your mod is *not*
  loading.

## The fast development loop

```bat
@echo off
del .\MyMod\scripts\*.dso 1> nul 2>&1
del .\MyMod\scripts\autoexec\*.dso 1> nul 2>&1
del .\MyMod\scripts\weapons\*.dso 1> nul 2>&1
start Tribes2.exe -nologin -mod MyMod -mission Slapdash CTF
```

Add `-mission <map> <type>` to skip the menus entirely — `validateMissionAndType()` checks the pair and
`console_end.cs` goes straight there **[script]**.

Then, inside the game, you rarely need to restart. Re-exec a single file from the console:

```
exec("scripts/weapons/burstDisc.cs");
```

Datablock redeclaration takes effect immediately for most tuning fields. Structural changes — state
machines, shape files — still need a mission restart, which is much faster than a full restart:

```
loadMission("Slapdash", "CTF");
```

## Testing checklist

| Test | Catches |
|---|---|
| Launch on a **clean install** | Dependencies on leftovers in your dev folder |
| Console **clean at load** | Datablocks that failed to register, missing files |
| **Dedicated** server run | Client code in server paths |
| A **second client** connects | Datablock transmission failures, missing client assets |
| **Bots enabled** (`-bot 4`) | New content the AI does not know about |
| **Mission cycle** — play through to a map change | State that leaks across missions, uncancelled schedules |
| **Respawn** several times | HUD elements that vanish, per-player state not reset |
| Pick up and drop your **pack ten times** | Asymmetric `onMount`/`onUnmount` bonuses |
| Play a **different gametype** | Package scoping errors |

The mission-cycle and respawn tests catch the two most common classes of mod bug: state on the `Game`
object (deleted every mission) and HUD controls not rebuilt on `clientCmdResetHud`. See
[Scheduling and events](../02-engine-model/scheduling-and-events.md#the-mission-teardown-sequence) and
[HUD](../04-interface/hud.md#adding-your-own-hud-element).

## Testing with a second client

You need two machines, or one machine plus a virtual machine — Tribes 2 does not run two instances
cleanly. Connect with:

```bash
Tribes2.exe -nologin -mod MyMod -connect 192.168.1.50:28000
```

`-connect <address>` sets `$LaunchMode = "Connect"` and skips the menus **[script]**. Add
`-password <pass>` if the server has one.

**This test is not optional if you added any new asset.** Datablock transmission, ghosting, and
client-side asset resolution cannot be exercised from a single offline session.

## The mission cycle

`CycleMissions` rotates maps. It is scheduled on `ServerGroup`, so it is cancelled by mission teardown
**[script]**:

```php
schedule(3000, ServerGroup, CycleMissions);
```

Test through at least one cycle. `loadMissionStage1` deletes `MissionGroup`, `MissionCleanup`, the
gametype packages, the `Game` object, and `$ServerGroup` **[script]** — anything of yours living in those
goes with them.

## Server administration

`scripts/admin.cs` provides the admin command surface, and `prefs/banlist.cs` is `exec`'d by
`CreateServer()` **[script]**. `BanList::Export("prefs/banlist.cs")` writes it back on exit **[script]**.

Voting is in `scripts/defaultGame.cs` — `serverCmdStartNewVote`, `serverCmdSetPlayerVote` **[script]**.
Adding a vote type is a matter of extending those.

## Under the community patches

### PURE is effectively gone

TribesNEXT's own scripts are loose files outside any hash-validated volume, so a patched install cannot
host a PURE server regardless of what you do. `-mod` already cleared `$PureServer` anyway. Treat
non-PURE as the only mode that exists in practice.

### The pre-authentication phase changes what "a client connects" means

Covered in full in
[Client/server split](../02-engine-model/client-server-split.md#under-the-community-patches). For testing
purposes, the critical fact is:

> **`local` connections skip authentication entirely.** Offline play and the listen-server host
> authenticate immediately. **The auth phase only exercises with a real remote client.**

So the single-machine test loop above will never surface an auth-phase bug. If your mod touches
`GameConnection::onConnect`, `onDrop`, `getAuthInfo`, or iterates `ClientGroup`, you must test with a
second machine.

Specifically worth testing:

| Test | Catches |
|---|---|
| One remote client connecting | `onConnect` firing twice; state set on the wrong pass |
| Two clients connecting simultaneously | State keyed to the wrong client during authentication |
| A client that stalls mid-auth | Cleanup on the 15-second `t2csri_expireClient` path |
| A client dropping during auth | `onDrop` suppression — your cleanup may never run |

### Server registration

A patched server announces to TribesNEXT rather than the dead WON master. `t2csri/serverglue.cs` loads the
server stack and schedules `ipv4_getInetAddress` for a sanity check on the public address
**[patch-script]**. Server registration and the auth protocol are the patch authors' domain — see the
TribesNEXT documentation, not this handbook.

For **local** mod testing none of it matters: `-nologin -mod MyMod` on a LAN never touches the auth
servers.

### Dedicated servers

`IFC22.dll` carries an embedded stub replacing vanilla's `dedCheckLoginDone` **[binary]**, which is how a
dedicated server gets past a login step whose servers no longer exist. Dedicated testing works as
described above.

### Testing checklist additions

On top of the vanilla checklist:

| Test | Catches |
|---|---|
| `listPackages()` at boot | Your package present, and sitting after `console_client_patches` |
| A **real remote client** | Everything in the auth phase |
| Non-4:3 aspect, windowed and fullscreen | HUD and GUI positioning under UI scaling |
| `$pref::Net::downloadAssets` off | Whether your assets actually reach clients |
| On RC2a, if you support it | The `scripts/autoexec/` ordering collision |

## Related

- [Packaging](packaging.md) — what to ship once it works
- [Debugging](debugging.md) — when it does not
- [Launch options](../01-getting-started/launch-options.md) — the full switch list
- [Mod paths and overrides](../02-engine-model/mod-paths-and-overrides.md) — PURE and the mount stack
- [Modding against a patched install](../07-community-patches/modding-against-a-patched-install.md#testing-checklist-for-a-patched-install) — the patched test loop
