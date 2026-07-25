# Debugging

Tribes 2 gives you a console, a tracer, an object inspector, a remote debugger, and journaling. That is
more tooling than most games of its era, and more than most modders ever use.

## The console

| Way in | How |
|---|---|
| In-game console | Tilde (`~`) by default |
| Windows console window | `enableWinConsole(true);` **[binary]**, or launch `-dedicated` which enables it automatically **[script]** |
| Console-only mode | `Tribes2.exe -con` — `$LaunchMode = "Console"`, no canvas **[script]** |

Anything you type is evaluated as TorqueScript. This is the primary debugging tool.

```
echo(getT2VersionNumber());
echo(getModPaths());
listPackages();
DiscProjectile.damageRadius = 20;
exec("scripts/weapons/burstDisc.cs");
```

## Logging

| Call | Effect |
|---|---|
| `echo(text)` | Normal output |
| `warn(text)` | Warning |
| `error(text)` | Error — shown in red |
| `setLogMode(mode)` | Write the console to `console.log` **[binary]** |
| `cls()` | Clear the console **[binary]** |
| `setEchoFileLoads(true)` | Log every file the engine loads **[script]** |

`setLogMode` values, as used by the shipped scripts: `1` overwrites, `2` appends. `-prepbuild` calls
`setLogMode(1)` **[script]**.

```php
setLogMode(2);            // append to console.log
setEchoFileLoads(true);   // log every file load — invaluable for mod path problems
```

`setEchoFileLoads` is the fastest way to answer "is it loading my file or the base one?" It prints the
resolved path of every `exec` and asset load.

Gate your own diagnostics behind a flag, as the shipped code does **[script]**:

```php
function logEcho(%msg)
{
   if($LogEchoEnabled)
      echo("LOG: " @ %msg);
}
```

```php
function myModLog(%msg)
{
   if ($MyMod::Debug)
      echo("MyMod: " @ %msg);
}
```

Ship with the flag off and you can ask a user to turn it on rather than sending them a debug build.

## `dump()` — the object inspector

The single most useful call in the language:

```php
%obj.dump();
```

Prints every field, every method, and the class hierarchy for that object. Run it on a datablock to see
which fields the engine actually knows about versus which ones you invented — that instantly resolves the
`catagory` versus `category` class of bug.

```
DiscProjectile.dump();
LightMaleHumanArmor.dump();
Game.dump();
```

`dumpInfo2File` also exists in the binary **[binary]**, though the shipped scripts do not call it.

## `trace()` — call tracing

```php
trace(1);     // on
…
trace(0);     // off
```

**[binary]** — the signature is `trace(bool)`. Every function entry and exit is printed with arguments.
It is extremely verbose; the shipped scripts wrap it tightly around the region of interest **[script]**:

```php
trace(1);
… the thing you are debugging …
trace(0);
```

Combine with `setLogMode(2)` so you can read the output afterwards rather than watching it scroll past.

## The remote debugger

Tribes 2 ships a real script debugger with breakpoints and watches. `console_end.cs` loads it on demand
**[script]**:

```php
function Debugger()
{
   if(!$DebuggerLoaded)
   {
      loadGui("debuggerGui");
      loadGui("DebuggerBreakConditionDlg");
      loadGui("DebuggerConnectDlg");
      loadGui("DebuggerEditWatchDlg");
      loadGui("DebuggerWatchDlg");
      loadGui("DebuggerFindDlg");
      exec("scripts/debuggerGui.cs");
      …
   }
}
```

Type `Debugger();` in the console to open it.

The debug listener is enabled with `dbgSetParameters(port, pass)` **[binary]**, and a second instance of
the game connects to it. This is genuinely useful for a complex gametype and almost entirely unknown.

## Telnet console

```php
telnetSetParameters(port, consolePass, listenPass);
```

**[binary]** — or from the command line **[script]**:

```bash
Tribes2.exe -dedicated -mod MyMod -telnetParams 28001 mypass mylistenpass
```

Then telnet in and you have a live console on a running dedicated server. This is how you debug a server
that is in use.

## Journaling

Record and replay an entire session deterministically **[script]**:

```bash
Tribes2.exe -jsave mysession.jrn -mod MyMod
```

```bash
Tribes2.exe -jload mysession.jrn -mod MyMod
```

`-jplay` replays. All three set `$PureServer = false`. Journaling captures the input event stream, so a
reproducible crash can be captured once and replayed as often as you like.

## Reading the shipped code's diagnostics

Sierra and z0dd left diagnostics in place, commented out. When debugging a subsystem, uncomment them:

```php
//error("GC:SWHI name="@%name@",ammoAmount="@%ammoAmount@",addItem="@%addItem);
//error("  ----- player has " @ %ammoInv SPC $WeaponsHudData[%i, ammoDataName]);
//error("SWHI:Setting weapon "@%name@" ("@%i@") ammo to " @ %ammoInv);
//error( "damage: " @ %amount @ " at distance: " @ %dist @ " radius: " @ %radius );
```

The HUD and radius-damage diagnostics in particular are already written for you.

Note that `error()` is used as a logging channel, not only for faults **[script]**:

```php
error("team " @ %i @ " objectives load...");
```

so red text in the console is not automatically a problem.

## The errors you will actually hit

### "My change did nothing"

**Stale `.dso`.** In that order of likelihood, every time.

```bat
del .\MyMod\scripts\*.dso 1> nul 2>&1
del .\MyMod\scripts\autoexec\*.dso 1> nul 2>&1
```

If that is not it: `setEchoFileLoads(true)` and confirm your file is the one being loaded.

### `Unable to find object: 'Foo' attempting to find object on datablock field`

A datablock referenced something that did not exist yet. **Declaration order.** Move the referenced block
earlier in the file, or the whole file earlier in the `exec` chain. See
[Datablocks](../02-engine-model/datablocks.md#declaration-order-matters).

### "My package override isn't running"

```php
listPackages();
```

**[script]** — `PackageFix` in `console_start.cs` provides this. If your package is not listed,
`activatePackage()` never ran or ran before the package block was parsed. If you see
`ActivatePackage called for a currently active package!` your autoexec is executing twice.

### "My weapon works but isn't on the HUD"

`$WeaponsHudCount` was not incremented. See [HUD](../04-interface/hud.md#weaponshuddata--registering-a-weapon).

### "My item can't be picked up or bought"

`max[YourItem]` is missing from the armors, or `catagory` is spelled `category`. See
[Ammo and inventory](../03-content-recipes/ammo-and-inventory.md#the-complete-checklist-for-a-new-item).

### "My gametype doesn't appear in the menu"

No mission declares it. `buildMissionList()` builds the type list *from the missions* **[script]** — a
gametype with no `// MissionTypes = ` mentioning it is invisible. See
[Missions](../05-gameplay-systems/missions.md#the-header-comments).

### "Console errors about a corpse or a dead player"

Missing guard. The shipped pattern **[script]**:

```php
if ( %obj.getClassname() $= "Player" && %obj.getState() !$= "Dead" )
   %obj.client.setWeaponsHudAmmo(…);
```

### "It works offline but not on a dedicated server"

Client code in a server path. `console_end.cs` returns early for dedicated servers **[script]** — nothing
after the `$LaunchMode $= "DedicatedServer"` branch runs. Guard with `isObject(Canvas)`.

### Parse errors pointing at the wrong line

A missing `;` after a `};` block closing a `datablock`, `new`, or `package`. The parser reports where it
noticed, not where the mistake is. Check the block *above* the reported line.

### Silent nothing

A typo in a field name creates a dynamic field with no error. `%obj.dump()` shows you what actually got
set.

## A diagnostic starting point

Put this in your entry script during development:

```php
$MyMod::Debug = true;

function myModDiag()
{
   echo("--- MyMod diagnostics ---");
   echo("version:   " @ getT2VersionNumber());
   echo("mod paths: " @ getModPaths());
   echo("mission:   " @ $CurrentMission @ " (" @ $CurrentMissionType @ ")");
   echo("pure:      " @ isPureServer());
   listPackages();
   echo("-------------------------");
}
```

then type `myModDiag();` in the console. Ninety per cent of "it doesn't work" reports are answered by
those five lines.

## Under the community patches

All the tools above work unchanged. The failure modes gain a few entries.

### `listPackages()` output is no longer nearly empty

Expect `PackageFix`, `console_client_patches`, possibly `t2csri_server`, the current gametype package, and
yours. **Your package should appear after `console_client_patches`** — that is the ordering that makes
your `Parent::` chain reach the patch's overrides and then vanilla's.

### New failure modes

| Symptom | Cause |
|---|---|
| **"The patch isn't loading at all"** | `getT2VersionNumber() != 25034`. The patch returns silently with no message **[patch-script]**. Check the build first. |
| **"My override works offline but not against a real client"** | Almost always the pre-authentication phase. `local` connections skip it. See [Client/server split](../02-engine-model/client-server-split.md#under-the-community-patches). |
| **"`onConnect` runs twice"** | It is meant to. Guard on `%client.doneAuthenticating`. |
| **"My cleanup never runs when a client leaves"** | `onDrop` is suppressed for clients that never finished authenticating **[patch-script]**. |
| **"`getAuthInfo` clan fields are empty"** | Deliberate — the patch's own comment says clan support is not implemented **[patch-script]**. |
| **"`addGameType()` does nothing"** | Stubbed by `t2csri_server` **[patch-script]**. Harmless; discovery goes through the mission scan. |
| **"My dialog layout is wrong"** | `$Font::Substitute` — the patch replaces every vanilla font **[patch-script]**. Test on a patched install. |
| **"My Video-panel control disappeared"** | `OP_FullScreenTgl::onAdd` rebuilds that panel **[patch-script]**. |
| **"Force feedback does nothing"** | `IFC22.dll` stubs the Immersion exports **[binary]**. Expected on the QoL patch; RC2a still works. |
| **"My chat markup is stripped"** | `MessageVector::validateTag` filters `<t2server:>` and `<tribe:>` **[patch-script]**. |
| **"My autoexec script runs before the patch"** *(RC2a only)* | OS-determined glob order. Defer with `schedule(0, 0, …)`. |
| **"A support-pack script silently didn't load"** | Read `prefs/autoload.log` — it names the cause (missing file, unmet `#include`, syntax error). Also check `#autoload` is the **first** directive; only the first non-blank line is tested **[support-script]**. See [The autoload system](../09-support-pack/autoload-system.md). |

### Detecting which environment you are in

```php
function myModDetectPatch()
{
   if (isPackage(console_client_patches))
      return "QoL";
   if ($RubyEnabled)                      // set by RC2a's glue.cs
      return "RC2a";
   return "vanilla";
}
```

Worth adding to the diagnostic function below.

### An extended diagnostic

```php
function myModDiag()
{
   echo("--- MyMod diagnostics ---");
   echo("version:   " @ getT2VersionNumber());
   echo("patch:     " @ myModDetectPatch());
   echo("mod paths: " @ getModPaths());
   echo("mission:   " @ $CurrentMission @ " (" @ $CurrentMissionType @ ")");
   echo("pure:      " @ isPureServer());
   echo("clients:   " @ ClientGroup.getCount());
   listPackages();
   echo("-------------------------");
}
```

### Reading the patch's own code

`console_client_patches.cs` sits loose at the `GameData/` root — 47 KB of readable TorqueScript. When an
override is behaving strangely, read the patch's version of the function directly. It is the best
available worked example of large-scale package overriding, and it is right there on disk.

## Related

- [Hosting and testing](hosting-and-testing.md) — the test loop these tools support
- [Packages](../02-engine-model/packages.md) — `listPackages()` and the activation bug
- [Boot sequence](../02-engine-model/boot-sequence.md) — what should have loaded when
- [Launch options](../01-getting-started/launch-options.md) — `-con`, `-telnetParams`, journaling
- [07 · Community Patches](../07-community-patches/README.md) — what is layered on top
