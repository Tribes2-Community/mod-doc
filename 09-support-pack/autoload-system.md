# The autoload system

TorqueScript has `exec()` and nothing else. No dependency declaration, no version constraint, no load
order, no way to disable one script without deleting it. The autoload system adds all four, entirely in
script, by parsing metadata out of comments.

## The boot hook

`scripts/autoexec/autoload_launcher.cs` — 47 bytes, the whole file **[support-script]**:

```php
if( !$AutoloadExecuted ) exec("autoload.cs");
```

It lands in the directory `console_end.cs` globs for user scripts **[script]**, so it runs at the same
point your mod's entry script does. `autoload.cs` sits at the archive root, so it resolves as
`base/autoload.cs` through the normal mount stack.

`autoload.cs` sets its own guard immediately **[support-script]**:

```php
$AutoloadEnabled = true;
$AutoloadIni = "prefs/autoload.ini";
$AutoloadLog = "prefs/autoload.log";

// set a flag to prevent autoexec.cs or autoload_loader.cs from running again
$AutoloadExecuted = true;
```

Work that must happen later than autoexec time is deferred into a package named `LoadLater`
**[support-script]**.

## The directive header

Metadata is written as ordinary `//` comments at the top of a `.cs` file. From
`support/flag_tracker.cs` **[support-script]**:

```php
// #name = Flag Tracking Support
// #version = 0.0.3
// #date = January 30, 2003
// #category = Support
// #author = Paul Tousignant
// #warrior = UberGuy (FT)
// #email = uberguy@tribalwar.com
// #web = http://scripts.tribalwar.com/uberguy
// #description = Provides information about flag status, events and carrier kills.
// #status = Beta
// #include = support/team_tracker.cs 0.0.4
// #include = support/events 1.0.3
// #include = support/kill_callbacks.cs
```

The compiler sees comments. `autoload.cs` opens the file with a `FileObject` and reads them as data.

### Parsing rules

Deliberately loose **[support-script]**:

```php
function script::get_directive(%this, %text)
{
    return getSubStr(firstWord(strchr(%text, "#")), 1, 10000);
}

function script::get_args(%this, %text)
{
    return trim(getSubStr(strchr(%text, "="), 1, 10000));
}
```

- The directive is the first word after the **first `#`** anywhere on the line.
- The argument is everything after the **first `=`**, trimmed.
- So `// #version = 1.0` and `//#version=1.0` and `   // # version` all parse.
- Leading blank lines are skipped, then parsing stops at **the first line that is not a directive**.

That last rule matters: **put your whole header block at the very top, with no blank-line-then-comment
gaps in the middle**, or everything after the break is ignored.

### The directives

| Directive | Effect |
|---|---|
| `#autoload` | **Load this file automatically.** Without it the file is only loaded if listed in `autoload.ini`. |
| `#include = <file> [minVersion]` | Declare a dependency, optionally with a minimum version. Repeatable. |
| `#name` | Display name in the script browser |
| `#version` | Parsed into version / revision / subrevision for comparison |
| `#date` | Parsed into year / month / day |
| `#author` | Real name |
| `#warrior` | In-game player name |
| `#credit` / `#credits` | Additional credit, repeatable — the plural is accepted because *"lots of people make this typo"* **[support-script]** |
| `#email` | Repeatable; duplicates are dropped |
| `#web` | Repeatable; duplicates are dropped |
| `#description` | One-line summary |
| `#status` | Free text — `Release`, `Beta`, etc. |
| `#category` | Grouping in the script browser |
| `#hide` | Hide from the script browser |

`#include = SELF` is a special form the parser recognises **[support-script]**; it marks a
self-dependency used by the loader's ordering pass.

Version comparison is delegated to a `versionCompare()` helper, so `#include = support/events 1.0.3` means
*at least* 1.0.3.

## The autoload scan

`autoload::get_autoload(%filename)` decides whether a file opts in **[support-script]**:

```php
%fh = new FileObject();
if(!%fh.openForRead(%filename)) { … return false; }

// skip whitespace
while( (%line $= "") && (!%fh.isEOF()) )
    %line = trim(%fh.readLine());

%fh.close();
%fh.delete();

if( !stricmp(firstWord(strchr(%line, "#")), "#autoload") )
    return true; // #autoload found

return false;
```

**Only the first non-blank line is checked.** `#autoload` must be the *first* directive in the header, not
merely present somewhere in it. This is the single most common reason a script "won't autoload".

## `prefs/autoload.ini`

Load order and per-script enable/disable. The loader generates it with a self-documenting header
**[support-script]**:

```ini
; Autoload (Script Manager / Preprocessor) initializations file
;
; Use this file to modify the load order of the scripts you have installed.
;
; You can deactivate a script (so it will not load) by placing a ';' at the
; beginning of the line that script is on.
;
; A script will also fail if:
;
; - it doesn't exist
; - its requirements aren't met
; - it generates a syntax error
;
; Note: a script's requirements are determined by the #include directives in
;       its autoload header.
;
; For information on the status of each script, please see the autoload.log
; file after running and/or exiting Tribes 2.
;
; Note: You can add a script to this list and it will be loaded even if it has
;       no #autoload directive in its header, provided all of its requirements
;       (if it has any) are met.
```

Two behaviours worth extracting from that:

- **Listing a file in the ini loads it even without `#autoload`** — the escape hatch for scripts you did
  not write.
- **A `;` prefix disables a line**, so the ini doubles as an enable/disable switchboard.

Only `.cs` and `.gui` filenames are accepted; anything else is rejected **[support-script]**.

## Failure handling and the log

`prefs/autoload.log` records the outcome per script. The loader has a dedicated logger for each state
**[support-script]**:

| Logger | Meaning |
|---|---|
| `logAutoloadStarted` | Run began |
| `logExecuted` | Script loaded |
| `logReexecuted` | Script loaded again |
| `logDeactivated` | Disabled in the ini |
| `logDoesNotExist` | Filename in the ini has no file |
| `logCannotReadAutoloadIni` / `logCannotWriteAutoloadIni` | Ini I/O failure |

**When a support-pack-dependent script silently does nothing, read `prefs/autoload.log` first.** It will
name the failure. That is a better first move than the console.

Failure causes, per the generated ini header: file missing, requirements not met, or a syntax error in the
script.

## Command-line switches

Added by the pack, parsed in `DispatchLaunchMode()` **[support-script]**:

| Switch | Effect |
|---|---|
| `-noautoload` | `$AutoloadEnabled = false` — skip the whole system |
| `-skipnewautoload` | Skip the scan for other autoloading `.cs` files (added 2003-12-19) |

Both are useful for isolating whether a bug is yours or the library's. They are *not* vanilla switches —
they do nothing on an install without the pack. See
[Launch options](../01-getting-started/launch-options.md).

## The `script` class

`autoload.cs` defines a `script` object wrapping `FileObject` with line-oriented editing
**[support-script]**:

| Method | Purpose |
|---|---|
| `newScript(%filename, %isfile)` | Constructor |
| `openForRead` / `openForWrite` / `close` / `isEOF` | File handling |
| `readLine` / `writeLine` / `appendLine` | Line I/O |
| `insertLine(%text, %n)` / `replaceLine(%text, %n)` | Line editing |
| `findInFile(%text, %n)` | Search |
| `replaceInFile(%search, %replace, %n)` | Single replace |
| `replaceLinesInFile(%search, %replace, %start, %end)` | Ranged replace |
| `getLen()` | Line count |
| `getHeader()` | Parse the directive block |
| `getAutoload()` / `requirementsMet()` / `requires(%file)` | Dependency queries |
| `isAuthoredBy(%author)` / `hasEmailAddress(%e)` / `hasWebAddress(%w)` | Metadata queries |
| `versionCompare(%text)` | Version test |

This is a genuinely useful general-purpose file toolkit, independent of the autoload system. If you need
to read or rewrite text from TorqueScript — including the
[`save()` round-trip for object field enumeration](../02-engine-model/simobject-and-namespaces.md) — it is
already written.

## Writing a script that autoloads

```php
// #autoload
// #name = My HUD Extension
// #version = 1.0.0
// #date = July 24, 2026
// #category = HUD
// #author = Your Name
// #warrior = YourTag
// #description = Adds a thing to the HUD.
// #status = Release
// #include = support/callback.cs
// #include = support/events.cs 1.0.4

callback.add(onPlayGuiWake, myModOnPlayGuiWake);

function myModOnPlayGuiWake()
{
   …
}
```

Checklist:

| | |
|---|---|
| `#autoload` is the **first** directive | Only the first non-blank line is tested |
| No blank lines inside the header block | Parsing stops at the first non-directive line |
| Every dependency has an `#include` | Otherwise load order is undefined |
| Version pins where behaviour matters | `#include = support/events.cs 1.0.4` |
| Check `prefs/autoload.log` after first run | It names the failure if there is one |

## What this costs you

Taking a support-pack dependency means **your users must install `support.vl2` too**. For a client-side
utility that is the normal expectation and the library is worth it. For a server-side gameplay mod it is
an unnecessary barrier — see [Scope](README.md#scope-client-side).

## Related

- [Callbacks and events](callbacks-and-events.md) — what the loaded modules give you
- [Library reference](library-reference.md) — the full module list
- [Boot sequence](../02-engine-model/boot-sequence.md) — where the launcher runs
- [Missions](../05-gameplay-systems/missions.md) — vanilla's own metadata-in-comments convention
