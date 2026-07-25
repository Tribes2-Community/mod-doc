# 48 · TacoServer

The codebase most public Tribes 2 servers run today. Maintained by **ChocoTaco1** at
[github.com/ChocoTaco1/TacoServer](https://github.com/ChocoTaco1/TacoServer), openly developed, still
receiving commits in 2026, and the presumptive basis — directly or as a fork — for the 25th anniversary
tournament.

It is also the best-documented case in this handbook of a mod **inheriting from one ancestor while
absorbing features from another**, and then deliberately severing the second.

| | |
|---|---|
| Repository | `ChocoTaco1/TacoServer`, branch `Stable` **[mod-script]** |
| Latest commit surveyed | 14 Jun 2026, "Merge branch 'Dev' into Stable" |
| Contents | 58 `.cs` — 55 scripts, 3 prefs |
| Base | **Classic 1.5.2**, required separately |
| Strategy | Overlay — replace some files, add per-feature packages |
| Licence | Open source; see the repository |

## It is an overlay, not a mod

The README is unambiguous **[mod-script]**:

> - Meant to be installed on top of Classic 1.5.2
> - If a file isnt on this github it is unmodified in Classic 1.5.2

This is the single most important fact about TacoServer and it explains its file count. Fingerprinting
against Classic 1.5.2:

| | Count |
|---|---:|
| Files 1.5.2 has that TacoServer does not ship | 47 |
| Files present in both, modified | 23 |
| Files present in both, byte-identical | 2 |
| Files new in TacoServer | 30 |

Those 47 absences are not deletions. `turret.cs`, `station.cs`, `deployables.cs`, all seven turret
barrels, most weapons and most vehicles are simply **left alone** — they stay on disk from the 1.5.2
install underneath. Install TacoServer without 1.5.2 present and you get a broken tree, because the
engine's mod path will fall through to `base/` for everything TacoServer does not ship, silently
discarding every Classic rule in those files.

This is the mod path stack used as a versioning tool. See
[Mod paths and overrides](../02-engine-model/mod-paths-and-overrides.md).

## The lineage, evidenced

The received account — and the one this handbook was asked to document — is that ChocoTaco's Classic
codebase started from Evolution Admin Mod 1.2.3c plus its improvements, and later deviated into his own
administration source. The repository bears that out precisely, and the evidence divides cleanly.

### Classic 1.5.2 is the base, not Evolution

| Signal | Finding |
|---|---|
| z0dd's authorship signature | **589 occurrences** still present **[mod-script]** |
| `$Host::ClassicLoad*` toggles | **All ten** survive intact (section 40) |
| `.ovl` files | **None** |
| `evoSupport.cs`, `evoPackage.cs`, `createEvolutionPackage()` | **None** |
| README prerequisite | "Update to Classic 1.5.2" |

Evolution's entire architecture — the generated package, the `.ovl` split, the 89 `$Host::Evo*` prefs —
is gone. Classic 1.5.2's is entirely intact.

### Evolution's features were ported, with attribution

What remains of Evolution is source-level inheritance in individual features, marked by the authors:

| Location | Evidence |
|---|---|
| `autoexec/NoBaseRape.cs:4` | `// From Evolution MOD` |
| `autoexec/TKwarn.cs` | `// From Evo`, on a `DefaultGame::testTeamKill` override |
| `DMGame.cs:944`, `LCTFGame.cs:2699` | `// For voting to work properly - evo admin.ovl` |
| `autoexec/zCheckVer.cs:149,158` | Comments citing `defaultgame.ovl` and `admin.ovl` by name |
| `autoexec/AntiLouExploitFixes.cs` | The **AntiLou** fix set — Ilys' work, packaged by Evolution 1.2.3 **[mod-script]** |
| `autoexec/ObserveFlag.cs:289` | Commented-out `$Host::EvoFullServerPWEnabled`, `%pizzaOptMask` |

That last line is a small archaeological gem: `%pizzaOptMask` is a bitmask named for **Pizza Admin Mod**,
Evolution's own ancestor (section 45). A variable name has survived three codebases and twenty-two years.

`AntiLouExploitFixes.cs` is the thread from section 39 completing its journey: exploit fixes credited to
**ilys** in Classic 1.5's changelog, bundled by Evolution 1.2.3 as *AntiLou*, and carried into TacoServer
under that name.

### The severance was deliberate and dated

Git history names it. The earliest commit reachable in the surveyed history is, verbatim:

```
2021-07-17  Merge branch 'NoEvo'
```

`NoEvo` was not a one-off cleanup. It was a maintained branch, merged repeatedly:

| Date | |
|---|---|
| 2021-07-17 | Merge branch 'NoEvo' |
| 2021-08-16 | Merge branch 'NoEvo' |
| 2021-08-29 | Merge branch 'NoEvo' |
| 2021-09-14 | Merge branch 'NoEvo' |
| 2021-11-23 | Merge branch 'NoEvo' |
| 2022-01-11 | Merge branch 'NoEvo' |
| 2022-02-17 | Merge branch 'NoEvo' |
| 2022-04-05 | Merge branch 'NoEvo' |
| 2025-01-11 | Remove EvoStats |

Nine months of merges to remove a dependency, and a final Evolution component — the stats system — not
removed until **January 2025**. Some Evolution compatibility is *still* present as display options:
`$dtStats::evoStyleDebrief` selects an Evolution-style end-of-match screen, and degrades if an
`EvoStats.cs` is found **[mod-script]**:

```php
$dtStats::evoStyleDebrief = isFile("scripts/autoexec/EvoStats.cs") == 0 ? $dtStats::evoStyleDebrief : 0;
```

So the accurate summary is: **TacoServer's code descends from Classic 1.5.2; its feature set descends
from Evolution; and disentangling the two took from 2021 to 2025.** The user-facing behaviour Evolution
established outlived Evolution's code by four years.

## The architecture that replaced `.ovl`

Evolution's problem was that packages cannot span files, so it generated one giant package (section 45).
TacoServer solves the same problem the other way: **one package per feature, one feature per file, all in
`scripts/autoexec/`.**

`autoexec/TKwarn.cs` opens **[mod-script]**:

```php
//exec("scripts/autoexec/TKwarn.cs");

package TKwarn
{

// From Evo
function DefaultGame::testTeamKill(%game, %victimID, %killerID, %damageType)
{
   …
}
```

Twenty-one of the twenty-five autoexec files declare their own package. The base engine's autoexec sweep
executes everything in `scripts/autoexec/` at startup ([Boot sequence](../02-engine-model/boot-sequence.md)),
so each file registers and activates itself with no central manifest.

Compared to Evolution this is strictly better on every axis that matters:

| | Evolution `.ovl` | TacoServer `autoexec` |
|---|---|---|
| Packages | One, generated | ~21, hand-written |
| Build step | Yes — writes a file at boot | None |
| Stale-cache trap | Yes, notorious | None |
| Individually disableable | No | **Yes** — delete or rename one file |
| Error line numbers | Point into generated code | Point at real source |
| Load order control | `findFirstFile` order | Filename prefix — `z`, `zz` |

The `z`, `zz` and `z_dt` prefixes are the load-order mechanism: `zzDiscordBot.cs` loads after
`zCheckVer.cs` loads after `AntiPack.cs`, because the autoexec sweep is alphabetical. The same trick as
`zz_Classic_client_v1.vl2` (section 38), applied to script load order rather than archive precedence.

**This is the pattern to copy.** It needs no generation step, no cache, and no manifest; a feature is a
file, and removing the file removes the feature.

Four files declare no package — `EnableLogs.cs`, `MemPatches.cs`, `multipleMapRotation.cs`,
`spawnDir.cs`. Those define new functions and globals rather than overriding existing ones, which is
exactly the split Evolution drew between its `.cs` helpers and its `.ovl` overrides. The distinction is
real and both codebases found it independently: **only overrides need packages.**

## The teamkill log, twenty-two years on

Sections 45–47 traced a single logging line. TacoServer's treatment of the same function closes the arc.

Evolution logged inline inside the override, referencing an undeclared `%client` (section 47). TacoServer
overrides the same function but **extracts the logging into a separate function taking exactly what it
needs** **[mod-script]**:

```php
// in TKwarn.cs, inside package TKwarn
   teamkillLog(%victimID, %killerID, %damageType);
```

```php
// in EnableLogs.cs
function teamkillLog(%victimID, %killerID, %damageType)
{
   …
   $teamkillLog = formatTimeString("M-d") SPC formatTimeString("[hh:nn:a]") SPC %s
      @ %killerID.nameBase @ "(" @ %killerID.guid @ ")[" @ %type @ "][" @ %ktk @ " tk] teamkilled"
      SPC %victimID.nameBase @ "[" @ %vtk @ " tk]. #P[" @ $HostGamePlayerCount @ "] CM[" @ $CurrentMission @ "]";
   $teamkillLog = stripChars($teamkillLog, "\c0\c1\c2\c3\c4\c5\c6\c7\c8\c9\x10\x11\co\cp");
   export("$teamkillLog", %logpath, true);
   logEcho($teamkillLog);
}
```

The 2004 bug is now structurally impossible. `teamkillLog`'s parameters are precisely the two players and
the damage type; there is no ambient `%client` to reach for. It also gained running teamkill counts for
both players, the damage type, player count and current mission — and `stripChars` to remove colour
control codes before writing, so the log is greppable.

**The fix was not "use the right variable"; it was "give the function only what it needs".** That is the
general lesson, and it is why the same defect cannot recur here.

### One live defect in the same file

While reading it: `EnableLogs.cs:161` guards the function with

```php
   if(!$CurrentMissionType $= "CTF" && !$CurrentMissionType $= "SCTF")
      return;
```

In TorqueScript, unary `!` binds tighter than the string comparison `$=`, so this parses as
`(!$CurrentMissionType) $= "CTF"`. `$CurrentMissionType` holds a non-numeric string such as `"CTF"`,
whose numeric value is `0`, so `!$CurrentMissionType` is `1` — and `"1" $= "CTF"` is false. Both operands
are false, the `&&` is false, and **the guard never fires** **[inferred]**.

The intended form is almost certainly:

```php
   if($CurrentMissionType !$= "CTF" && $CurrentMissionType !$= "SCTF")
      return;
```

The effect is benign — teamkills are logged on every mission type rather than only CTF and Spawn CTF, so
the log is broader than intended, not missing entries. It is marked **[inferred]** because the reasoning
is from operator precedence and not from an executed test; if you are running TacoServer, a non-CTF map
and a glance at `logs/` settles it in a minute. The pattern is the same family as section 47's: a
condition that reads correctly in English and does nothing in TorqueScript, failing silently.

## Scale

| File | Lines | |
|---|---:|---|
| `autoexec/z_dtStats.cs` | 20,558 | The statistics system — 1.9 MB, by far the largest script in this handbook |
| `autoexec/VoteMenu.cs` | 1,924 | Vote system rework |
| `defaultGame.cs` | — | 152 KB |
| `server.cs` | — | 114 KB |
| `LCTFGame.cs` | 104 KB | LakRabbit CTF |
| `LakRabbitGame.cs` | 93 KB | |

`z_dtStats.cs` deserves its own note: a 20,000-line single-file stats engine, in a language with no
modules, that tracks per-player statistics across a match and renders them in-game. It is the largest
single artefact the Tribes 2 modding community produced and it lives in an autoexec directory.

## Related

- [49 · TacoServer in operation](../49-tacoserver-operation/README.md) — the feature set and running it
- [39 · Classic 1.5.2](../39-classic-152/README.md) — the required base
- [45 · Evolution Admin Mod](../45-evolution-admin-mod/README.md) — the architecture it discarded
- [47 · teratos' evoClassic](../47-teratos-evoclassic/README.md) — the bug this design eliminates
- [Boot sequence](../02-engine-model/boot-sequence.md) — how `scripts/autoexec/` is swept
- [Packages](../02-engine-model/packages.md) — one package per feature
