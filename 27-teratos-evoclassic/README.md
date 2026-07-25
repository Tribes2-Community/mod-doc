# 27 · teratos' evoClassic

A redistribution of Evolution Admin Mod 1.2.3c, dated **8 June 2014** — ten years after the original —
carrying exactly one change. It is the shortest section in this handbook and one of the most useful,
because the change is a textbook instance of the single nastiest gotcha in TorqueScript.

## The diff

Fingerprinting all 26 files against stock 1.2.3c:

| | |
|---|---:|
| Byte-identical | 25 |
| Modified | **1** — `scripts/evolution/defaultGame.ovl` |
| Added | 0 |
| Removed | 0 |

Both copies of `defaultGame.ovl` are 1604 lines. The file timestamps read `2004-05-13` and `2014-06-08`.
One line differs **[mod-script]**:

```diff
-      $TKLog = formatTimeString("d-M-yy") SPC formatTimeString("[HH:nn]") SPC %client.nameBase @ " (" @ getField(%authInfo, 0) @ ", " @ getField(%authInfo, 1) @ ", " @ %client.guid @ ", " @ %client.getAddress() @ ") TEAMKILLED " @ %victimID.nameBase;
+      $TKLog = formatTimeString("d-M-yy") SPC formatTimeString("[HH:nn]") SPC %killerID.nameBase @ " (" @ getField(%authInfo, 0) @ ", " @ getField(%authInfo, 1) @ ", " @ %killerID.guid @ ", " @ %killerID.getAddress() @ ") TEAMKILLED " @ %victimID.nameBase;
```

Three substitutions of `%client` for `%killerID`. That is the entire release.

## Why it is a bug

Here is the function it lives in **[mod-script]**:

```php
// DefaultGame::testTeamKill(%game, %victimID, %killerID)
// Info: Logs the teamkills. Overrides the original, so i need to use a package
function DefaultGame::testTeamKill(%game, %victimID, %killerID)
{
   %tk = Parent::testTeamKill(%game, %victimID, %killerID);
   if(!%tk)
      return false; // is not a tk

   if($Host::EvoTKLogging)
   {
      // get the TKer info
      %authInfo = %killerID.getAuthInfo();

      // TK info
      $TKLog = … %client.nameBase … %client.guid … %client.getAddress() … " TEAMKILLED " @ %victimID.nameBase;
```

**There is no `%client` in scope.** The parameters are `%game`, `%victimID` and `%killerID`. `%client` is
never assigned anywhere in the function. It is not a misnamed variable pointing at the wrong player — it
is a variable that does not exist.

TorqueScript locals need no declaration, and **reading an unset one yields the empty string with no
warning** — the gotcha already catalogued in
[TorqueScript](../02-engine-model/torquescript.md#gotchas-worth-memorising). So `%client.nameBase`,
`%client.guid` and `%client.getAddress()` are method and field accesses on `""`, and all three produce
nothing.

The log line the original actually wrote:

```
8-6-14 [21:14]  (SomeAuthName, SomeAuthField, , ) TEAMKILLED VictimName
```

The victim is named. The auth fields — taken from `%killerID` and therefore correct — are present. But
the name, GUID and IP of the person who did it are **blank**.

An admin reading `logs/TK/TKLog.txt` sees a record of every teamkill on the server, correctly timestamped,
naming the victim every time and the perpetrator never. The feature appears to work. Its output is
formatted, populated, and useless for the one question it exists to answer.

## Why it survived ten years

Three properties compounding:

**It fails quietly.** No console error, no script warning. An access on `""` is legal TorqueScript.

**The output looks right.** Empty fields inside a formatted line with populated auth fields read as
missing data, not as a code defect — plausibly a player who had not authenticated.

**Nobody reads teamkill logs until they need one.** The feature is consulted during a dispute, weeks
later, by someone who does not have the source open. At that point the log is simply unhelpful, and the
conclusion is "the logs are patchy", not "line 331 references an undeclared local".

The auth fields are what make it convincing. Whoever wrote it had `%killerID` correctly in hand one line
earlier:

```php
%authInfo = %killerID.getAuthInfo();
```

then reached for `%client` — the conventional name for a player connection across the entire Tribes 2
corpus, and the right name in most functions nearby. Muscle memory, in a language that will not tell you.

## What to take from it

**Prefer the parameter names you were given.** If a function signature hands you `%killerID`, using
`%client` inside it is a smell even when it works.

**Test with `!$= ""` before dereferencing anything that came from somewhere else** —
[TorqueScript](../02-engine-model/torquescript.md#gotchas-worth-memorising) gives the idiom. In a logging
path this is cheap:

```php
if(%killerID $= "")
   return %tk;   // nothing useful to log
```

**Log lines are output whose correctness nobody checks.** Diagnostics are the code least likely to be
exercised in testing and most likely to matter later. Read one, once, after writing it.

**A field that is always empty is a bug, not sparse data.** If you are the admin reading these logs,
"this column is never populated" should send you to the source.

## Provenance and status

Distributed as `evoClassic.vl2.zip` from a `Evolution&Pizza` directory on tribes2stats.com — the naming
reflecting Evolution's own descent from Pizza Admin Mod (section 25).

The archive contains only the rebuilt `evoClassic.vl2`. It ships **no readme, no changelog and no version
marker** — the one-line change is discoverable only by diffing. Treat it as Evolution 1.2.3c with a
teamkill-logging fix; there is nothing else in it.

Whether to run it is straightforward: it is strictly better than stock 1.2.3c, and strictly a
1.2.3c-family mod. Everything in [section 26](../26-evolution-operation/README.md) applies unchanged,
including the WON-identity problem that limits the leasing system on a modern patched install. If you are
standing up a server today, [section 30](../30-running-classic-today/README.md) is the relevant page —
the Evolution line is documented here for what it teaches, not as a current recommendation.

## Related

- [25 · Evolution Admin Mod](../25-evolution-admin-mod/README.md) — the `.ovl` architecture this patches
- [26 · Evolution in operation](../26-evolution-operation/README.md) — the logging surface it belongs to
- [TorqueScript](../02-engine-model/torquescript.md#gotchas-worth-memorising) — unset variables yield `""`
- [Debugging](../06-shipping/debugging.md) — finding failures the console does not report
