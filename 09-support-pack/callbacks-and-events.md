# Callbacks and events

The reason the support pack exists. `callback.cs` solves a real limitation of the package system; the
modules built on it turn raw engine events into a usable client-side event API.

## The problem packages do not solve

Five client scripts all want to know when the play GUI opens. With packages, each writes:

```php
package ScriptA { function PlayGui::onWake(%this) { Parent::onWake(%this); … } };
package ScriptB { function PlayGui::onWake(%this) { Parent::onWake(%this); … } };
…
```

That works right up until it doesn't:

| Failure | Consequence |
|---|---|
| One author omits `Parent::` | Everything below them in the chain stops running, silently |
| Order is activation order | Which is autoexec glob order, which is OS-determined |
| No enumeration | You cannot ask what is listening |
| No removal | `deactivatePackage` unwinds the stack above it — see [Packages](../02-engine-model/packages.md) |

For a server-side gameplay mod that is acceptable: there is usually one authority. For client-side
utilities, where a user might install a dozen from different authors, it falls apart.

## `callback.cs` — the registry

One package override registers a trigger; every interested script attaches a listener
**[support-script]**:

```php
callback.add(foo, bar);

//   -> attaches function bar() to a trigger named "foo"

callback.add(foo, "echo(\"hello world\");");

//   -> would echo hello world whenever foo is triggered

callback.trigger(foo, 500, Jeff, 23);

//   -> fires the trigger named "foo" and passes (500, Jeff, 23) as
//      arguments to all the functions that are attached to it
```

A listener can be a **function name or a code string** — the code-string form is a convenience, and it is
`eval`-shaped, so prefer named functions in anything performance-sensitive.

### The API

| Call | Purpose |
|---|---|
| `callback.add(%trigger, %function)` | Attach a listener |
| `callback.delete(%trigger, %function)` | Detach one listener |
| `callback.trigger(%trigger, %p0 … %p14)` | Fire — up to **15 arguments** |
| `callback.triggerUntil(%test, %trigger, %p0 …)` | Fire until a listener's return matches `%test` |
| `callback.count(%trigger)` | Listeners on a trigger |
| `callback.count()` | Number of active triggers |
| `callback.returned(%trigger, %test)` | Did any listener return `%test`? |
| `callback.countMatchingReturns(%test)` | How many returned `%test` |
| `callback.preserveOrder(%trigger, %enable)` | Toggle order preservation |
| `callback.isOrdered(%trigger)` | Query it |
| `callback.destruct()` | Destroy the object and all its callbacks |

### The `preserveOrder` trade-off

Documented candidly in the source **[support-script]**. With functions A, B, C, D, E attached to `FOO`,
deleting B gives:

| Mode | Result | Cost |
|---|---|---|
| `preserveOrder` **off** (default) | `A, E, C, D` — last entry backfills the hole | Fast |
| `preserveOrder` **on** | `A, C, D, E` — remaining entries shift left | Slower |

> *"This preserves the order (duh :) but is slower, so it's usually best not to enable preserveOrder mode
> unless you have to."* **[support-script]**

Leave it off unless your listeners genuinely depend on relative order.

### Muting

`triggerUntil` is how the pack implements cancellable events **[support-script]**:

```php
callback.triggerUntil(5, foo, "%1 $= mute;", %bar);

//   -> fires the trigger named "foo" ... stopping as soon as one of the
//      functions returns the string "mute"
```

A listener returning `mute` suppresses the remaining listeners **and** the underlying action. Several
`events.cs` callbacks are documented as *"Can be muted"*.

### Private callback objects

`callback` is a default `ScriptObject`; you can make your own **[support-script]**:

```php
%object_id = new ScriptObject(my_cb) { class=callback; };
```

Useful for a mod with many internal events that should not share a namespace with everything else on the
machine. This is the `class = <namespace>` dispatch documented in
[SimObjects and namespaces](../02-engine-model/simobject-and-namespaces.md), used well.

## `events.cs` — named game events

Wraps the raw engine callbacks into triggers. The module's own list **[support-script]**:

| Trigger | Fires when |
|---|---|
| `onPlayGuiWake` | Play GUI opens |
| `onLoadingGuiWake` | Loading GUI opens |
| `onGameGuiWake` | Join screen opens |
| `onChatGuiWake` | IRC GUI opens |
| `onDebriefGuiWake` | Map summary opens |
| `onScriptBrowserGuiWake` | Support script browser opens |
| `onSetFoV(%fov)` | Field of view changed |
| `onToggleZoom(%val)` | Zoom toggled |
| `onAmmoHudSetVisible(%val)` | Ammo display toggled |
| `onCmdDisplayHuds` | Server asked the client to display HUDs |
| `onCmdToggleHuds(%val)` | Server showed/hid play HUDs |
| `onCmdWeaponsHudBitmap(%slot, %name, %bitmap)` | Server sent a weapon HUD bitmap |
| `onCmdSetWeaponsHudActive` | Server selected a weapon in the weapon HUD |
| `onCmdSetInventoryHud(%slot, %amount, %addItem)` | Server sent an inventory HUD update |
| `onCmdVehicleMount` | Player entered a vehicle |
| `preLoadDemoSettings` / `postLoadDemoSettings` | Around demo playback settings load |
| `onQuit` | Game about to exit — **mutable** |
| `onPreConnect` | Just before a server connection is processed |
| `onPreLocalConnect` | Just before a listen-server connection |
| `onDisconnectedCleanup` | Leaving a server |
| `onUse(%item)` | Player issued `use()` — **mutable** |
| `onThrow(%item)` | Player issued `throw()` — **mutable** |
| `onUseKit` | Player used a repair kit — **mutable** |

Map these against the vanilla originals in [HUD](../04-interface/hud.md) and
[Client/server split](../02-engine-model/client-server-split.md) — `onCmdSetInventoryHud` is
`clientCmdSetInventoryHudItem`, and so on. The pack is giving you a multi-listener front end to the same
`clientCmd` surface.

## The trackers

Modules that maintain game state so you do not have to reconstruct it from message traffic.

### `team_tracker.cs`

Team rosters and player identity. Provides `baseName()` and `baseTags()` to split a display name from its
clan tags — including **suffix** tags, fixed in April 2003 after a bug that only handled prefixes
**[support-script]**.

Uses `stripMLControlChars()` rather than `strToPlayerName()` to clean names, because the latter *"is too
aggressive. It removes some legal characters and truncates long name+tag combinations"* **[support-script]**.
A useful warning if you are doing your own name handling — see
[Text and messaging](../04-interface/text-and-messaging.md).

### `flag_tracker.cs`

CTF flag state, built on `team_tracker`, `events`, and `kill_callbacks` **[support-script]**:

| Trigger | Meaning |
|---|---|
| `onCTFGrab` | Flag taken from stand |
| `onCTFCap` | Flag captured |
| `onCTFDrop` | Flag dropped by carrier |
| `onCTFPicked` | Flag taken from field |
| `onCTFReturn` | Flag returned |

Each passes a single `%flagRef` — a stateful object with `stateCurrent`, `statePrevious`, `actorCurrent`
and related fields. CTF only.

### `kill_callbacks.cs`

Kill and death events. Counts **only `msgTeamKill` messages** as team kills — a March 2003 correction,
because the previous approach compared team IDs and *"this is wrong for DM and Duel"* **[support-script]**.

### `loadout.cs`

Inventory and weapon state. Provides `WeaponChange` and `WeaponReceived`; the latter passes the weapon
slot as a second parameter **[support-script]**.

### Others

`vehicle_callbacks.cs`, `mission_callbacks.cs`, `key_callbacks.cs`, `weapon_list.cs`, `stat_support.cs`,
`player_support.cs` — see [Library reference](library-reference.md).

## Using it

```php
// #autoload
// #name = Cap Announcer
// #version = 1.0.0
// #author = Your Name
// #include = support/callback.cs
// #include = support/flag_tracker.cs

callback.add(onCTFCap, myModOnCap);

function myModOnCap(%flagRef)
{
   echo("cap by " @ %flagRef.actorCurrent);
}
```

No package, no `Parent::` chain, no collision with any other script listening to the same event.

## Should your mod use this?

| Situation | Answer |
|---|---|
| Client-side utility — HUD, tracker, bind manager | **Yes.** It is the established foundation and most surviving community scripts assume it. |
| Server-side gameplay mod | **No.** You would be adding an install requirement for infrastructure you do not need. Use packages. |
| You need many independent listeners on one client event | Yes — this is exactly the gap it fills. |
| You need cancellable events | Yes — `triggerUntil` with `mute`. |

## Related

- [The autoload system](autoload-system.md) — how these modules get loaded
- [Library reference](library-reference.md) — the full module inventory
- [Packages](../02-engine-model/packages.md) — the mechanism this works around
- [HUD](../04-interface/hud.md) — the vanilla `clientCmd` surface underneath
