# Scheduling and events

TorqueScript is single-threaded and non-blocking. There is no sleep, no wait, no loop-until. Anything that
happens later happens because you scheduled it, or because the engine called you back.

## `schedule` — deferred calls

Two forms, both used heavily in the shipped scripts **[script]**.

### Global form

```php
schedule(<delayMS>, <objectID>, <functionName>, <arg1>, <arg2>, …);
```

```php
schedule(1000, 0, dedCheckLoginDone);
schedule(0, ServerGroup, loadMissionStage1, %missionName, %missionType, %firstMission);
schedule(15000, ServerGroup, loadMissionStage2);
schedule(3000, ServerGroup, CycleMissions);
schedule( 1000, 0, "checkVehicleCamping", 1 );
```

The second argument is the **owning object**. Pass `0` for no owner. If you pass an object, deleting that
object cancels the schedule — which is exactly why the mission loader owns its schedules with
`ServerGroup`: tearing down `ServerGroup` at mission change cancels any pending mission-load steps.

### Method form

```php
<object>.schedule(<delayMS>, <methodName>, <arg1>, …);
```

```php
%client.schedule(500, "nextObjective", %client);
%game.schedule(3000, flagReturn, %obj);
%game.schedule(5000, forceRespawn, %clVictim);
StartupGui.schedule( 1000, checkLoginDone, %editAcct );
LoginEditBox.schedule( %time, makeFirstResponder, 1 );
```

Calls a method on that object after the delay. The object is implicitly the owner — deleting it cancels
the schedule. This is the form you should reach for by default: it is self-cancelling.

The function name may be quoted or bare; both appear in the shipped scripts and behave identically.

## `cancel` — stopping a schedule

`schedule` returns a handle. Store it, cancel it later.

```php
%client.waypointSchedule = %game.schedule(%game.waypointFrequency, "showTargetWaypoint", %client);
…
cancel(%client.waypointSchedule);
```

`scripts/BountyGame.cs` is the model here **[script]** — every repeating schedule is stored on the client
object and cancelled when the player dies, leaves, or the objective changes:

```php
cancel(%client.waypointSchedule);
cancel(%client.awaitingTargetThread);
cancel(%client.forceRespawnThread);
```

**Store every repeating schedule handle on an object.** A repeating schedule you cannot cancel runs until
the process exits, and each mission restart adds another one.

## Repeating work

There is no timer object. You reschedule from inside the handler:

```php
function myModTick()
{
   … do the work …
   $myModTickHandle = schedule(1000, 0, myModTick);
}
```

The shipped code does this constantly:

```php
function updateSubmitButton()
{
   if ( !CreateAccountDlg.open )
      return;                              // ← exit condition, no reschedule
   …
   schedule( 1000, 0, updateSubmitButton );
}
```

```php
function StartupGui::checkLoginDone( %this, %editAcct, %emailCheck )
{
   %result = WONLoginResult();
   %status = getField( %result, 0 );

   if ( %status $= "Waiting" )
      %this.loginSchedule = %this.schedule( 1000, checkLoginDone, %editAcct, %emailCheck );
   else
      …                                    // ← done, stop rescheduling
}
```

Two things to copy from these: the exit condition comes **first**, and the handle is stored on the object.

## Time

| Call | Returns |
|---|---|
| `getSimTime()` | Milliseconds of simulation time. Used 132 times in the shipped scripts — this is the standard clock. |
| `getRealTime()` | Wall-clock milliseconds |

Simulation time is what you want for gameplay timing. The classic cooldown idiom **[script]**:

```php
$HandInvThrowTimeout = 0.8 * 1000; // 1/2 second between throwing grenades or mines

function HandInventory::onUse(%data, %obj)
{
   %tossTimeout = getSimTime() - %obj.lastThrowTime[%data];
   if(%tossTimeout < $HandInvThrowTimeout)
      return;
   …
   %obj.lastThrowTime[%data] = getSimTime();
}
```

Note `%obj.lastThrowTime[%data]` — a per-object, per-datablock timestamp using array syntax on a dynamic
field. Copy this pattern for any per-player cooldown.

> The comment says half a second; the value is 800 ms. Sierra's comment is wrong, not the code. Trust the
> code.

## Callbacks

Most of your mod runs as callbacks, not scheduled work. The engine and the shipped scripts call named
functions when things happen; you supply or override them.

| Family | Called when | Defined in |
|---|---|---|
| `<className>::onAdd`, `::onRemove` | Object created / destroyed | Various |
| `<className>::onCollision(%data, %obj, %col)` | Physical contact | `item.cs`, `pack.cs` |
| `<className>::onUse(%data, %obj)` | Player uses the item | `weapons.cs`, `pack.cs` |
| `<className>::onInventory(%data, %obj, %amount)` | Inventory count changes | `weapons.cs`, `pack.cs`, `item.cs` |
| `<className>::onMount` / `::onUnmount(%this, %obj, %slot)` | Image mounted to a slot | `weapons.cs` |
| `<className>::onPickup(%this, %obj, %shape, %amount)` | Item picked up | `weapons.cs` |
| `<className>::damageObject(…)` | Damage applied | `damageTypes.cs` |
| `DefaultGame::*` | Game lifecycle — see [Gametypes](../05-gameplay-systems/gametypes.md) | `defaultGame.cs` |
| `GuiControl::onWake` / `::onSleep` | GUI shown / hidden | GUI scripts |
| `clientCmd*` | Server sent a command | Client scripts |
| Message callbacks | Server sent a message | Registered via `addMessageCallback` |

To hook one, override it in a package. See [Packages](packages.md).

## Object lifetime and cleanup

Scheduling and lifetime are entangled: a schedule owned by a deleted object is cancelled, and an object
in a deleted group is deleted.

### `$instantGroup`

Newly created objects are automatically added to whatever group `$instantGroup` names. `loadMissionStage2`
sets it to `MissionCleanup` after the `.mis` file executes **[script]**:

```php
$instantGroup = ServerGroup;
…
exec(%file);                      // the mission file
$instantGroup = MissionCleanup;   // everything after this cleans up at mission end
```

So objects your mod creates during a mission are cleaned up for you. Do not change `$instantGroup` unless
you intend to; restore it if you do.

### Explicit is better

```php
%thrownItem = new Item()
{
   dataBlock = %data.thrownItem;
   sourceObject = %obj;
};
MissionCleanup.add(%thrownItem);
```

`HandInventory::onUse` adds explicitly even though `$instantGroup` would have handled it **[script]**.
Follow that lead — it survives someone else changing `$instantGroup`.

### Deletion cancels

```php
if(%obj.thrownChargeId > 0)
{
   %obj.thrownChargeId.delete();
   %obj.thrownChargeId = 0;
}
```

Delete, then null the reference. Any schedules owned by the deleted object are cancelled as a side effect.

## The mission teardown sequence

Worth knowing because it is when your state gets destroyed **[script]** — `loadMissionStage1`:

```php
Game.endMission();
$lastMissionTeamCount = Game.numTeams;

MissionGroup.delete();
MissionCleanup.delete();
Game.deactivatePackages();
Game.delete();
$ServerGroup.delete();
$ServerGroup = new SimGroup(ServerGroup);
```

Everything mission-scoped goes: the mission objects, the runtime objects, the gametype packages, the
`Game` object itself, and the server group with all its pending schedules.

**State that must survive a mission change belongs in a global (`$MyMod::…`) or on a `GameConnection`
object in `ClientGroup`**, not on `Game` and not in `MissionCleanup`.

## Common mistakes

| Mistake | Symptom | Fix |
|---|---|---|
| Repeating schedule with no exit condition | Handler count grows every mission; eventual slowdown | Check state at the top and return without rescheduling |
| Not storing the schedule handle | Cannot cancel; duplicates accumulate | Store on an object, `cancel()` it |
| Owner `0` on a mission-scoped schedule | Fires after the mission ended, into deleted objects | Own it with `ServerGroup`, `MissionCleanup`, or the relevant object |
| State on the `Game` object | Silently lost at mission change | Use a global or the client object |
| Assuming `schedule(0, …)` runs immediately | It runs on the *next* tick | That is usually what you want — it is how `loadMission` yields |
| Using `getRealTime()` for gameplay | Diverges from simulation | `getSimTime()` |

## Under the community patches

`schedule`, `cancel`, ownership, `getSimTime`, `$instantGroup`, and the mission teardown sequence are all
**unchanged**.

Two patch-side uses are worth knowing because they demonstrate the idioms above and because you may
encounter them.

**The auth-phase timeout.** `t2csri_server` schedules a 15-second expiry per connecting client and cancels
it on success **[patch-script]**:

```php
%client.tterm = schedule(15000, 0, t2csri_expireClient, %client);
…
if (isEventPending(%client.tterm))
   cancel(%client.tterm);
```

Note `isEventPending()` before `cancel()` — a guard the vanilla scripts mostly skip, and a good habit.
Note also the handle stored on the client object, exactly as recommended above.

**The zero-delay defer.** RC2a's autoexec script uses `schedule(0, 0, …)` to push work past the end of the
autoexec glob **[patch-script]**:

```php
schedule(0, 0, exec, "t2csri/serverglue.cs");
```

This is the standard fix when your entry script must run after files whose load order you do not control —
which on RC2a includes the patch's own. See [RC2a](../07-community-patches/rc2a.md#the-collision-that-matters).

**One caution.** On a patched server, `ClientGroup` can contain clients that are still authenticating. A
repeating schedule that iterates clients should guard on `%client.doneAuthenticating` — see
[Client/server split](client-server-split.md#under-the-community-patches).

## Related

- [SimObjects and namespaces](simobject-and-namespaces.md) — groups and object lifetime
- [Packages](packages.md) — how to hook the callbacks listed here
- [Boot sequence](boot-sequence.md) — the mission load and teardown chain in full
- [Gametypes](../05-gameplay-systems/gametypes.md) — the `DefaultGame::` callback surface
