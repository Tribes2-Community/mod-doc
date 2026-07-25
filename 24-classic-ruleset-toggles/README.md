# 24 · The ruleset toggles

Classic 1.5 shipped a mechanism worth more than most of the gameplay changes around it: **optional
rules**. Nine weapon and vehicle behaviours, plus a gametype, each switchable by a server pref, each
defaulting to off, each announced to the client on connect.

It is the cleanest answer in the Tribes 2 corpus to a problem every mod eventually has — *some of my
users want this change and some do not* — and it is directly stealable.

## The switches

All ten live in `scripts/serverDefaults.cs` and all ten default to `0` **[mod-script]**:

```php
$Host::ClassicLoadTR2Gametype = 0;                    // Option to not load Tr2 gametype
$Host::ClassicLoadPlasmaTurretChanges = 0;            // Plasma turret does less damage and projectile si slower.
$Host::ClassicLoadHavocChanges = 0;                   // Havoc gets a built in sensor jammer with 20 meter radius.
$Host::ClassicLoadSniperChanges = 0;                  // Sniper Rifle uses ammo with 12 shots and energy.
$Host::ClassicLoadMissileChanges = 0;                 // Handheld missile launcher will not lock onto players and can no-lock fire.
$Host::ClassicLoadMortarChanges = 0;                  // Handheld mortar range limited to 450 meters.
$Host::ClassicLoadBlasterChanges = 0;                 // Blaster shoots 6 projectiles ala shotgun.
$Host::ClassicLoadPlayerChanges = 0;                  // Load up new gameplay changes allowing players to be shot while in vehicles.
$Host::ClassicLoadMineChanges = 0;                    // Enable/Disable mine disc.
$Host::ClassicLoadVRamChanges = 0;                    // Vehicles take damage when ramming players.
```

(The typo in the plasma comment is theirs. Quoted as shipped.)

| Toggle | On | Off (default) |
|---|---|---|
| `…TR2Gametype` | Team Rabbit 2 gametype loads | Not loaded |
| `…PlasmaTurretChanges` | Less damage, slower projectile | Stock plasma turret |
| `…HavocChanges` | Havoc carries a 20 m sensor jammer | Stock Havoc |
| `…SniperChanges` | Sniper uses ammo (12) *and* energy | Energy only |
| `…MissileChanges` | No player lock; dumbfire allowed | Locks onto players |
| `…MortarChanges` | Range capped at 450 m | Uncapped |
| `…BlasterChanges` | Six projectiles, shotgun-style | Single projectile |
| `…PlayerChanges` | Players in vehicles can be blastered, sniped, chained | Protected in vehicles |
| `…MineChanges` | Mine discing **disabled** | Mine discing allowed |
| `…VRamChanges` | Vehicles damage players they ram | No ram damage |

Two are worth reading carefully because their polarity is counterintuitive. `MineChanges` on *removes* a
capability, and `PlayerChanges` on *removes* protection. The names describe "load the changes", not "make
the game more permissive" — a naming trap the mod never resolved, and one to avoid in your own prefs.

## Two ways they are applied

The implementation is not uniform, and the difference is the actual lesson.

### Datablock-time — the ternary in the body

`weapons/blaster.cs` **[mod-script]**:

```php
{
   emitterDelay        = -1;
   // z0dd - ZOD, 5/07/04. Less damage shotgun blaster is gameplay changes in affect
   directDamage        = $Host::ClassicLoadBlasterChanges ? 0.05 : 0.15;
   directDamageType    = $DamageType::Blaster;
   ...
   // z0dd - ZOD, 5/07/04. Shotgun blaster no sound when gameplay changes in affect
   sound = $Host::ClassicLoadBlasterChanges ? "" : BlasterProjectileSound;
```

and on the image datablock:

```php
   usesEnergy = true;
   // z0dd - ZOD, 5/07/04. More drain shotgun blaster is gameplay changes in affect
   fireEnergy = $Host::ClassicLoadBlasterChanges ? 8 : 4;
   minEnergy  = $Host::ClassicLoadBlasterChanges ? 8 : 4;
```

The expression is evaluated **once, when the datablock is constructed** — at mission load. From then on
the field holds a literal number. Changing the global afterwards does nothing until datablocks are rebuilt.

That is not a defect; it is the right choice here. Datablock fields are ghosted to clients, so the value
has to be fixed before it is transmitted. It does mean **the pref must be set before the first mission
loads**, which is why these live in `serverPrefs.cs` rather than being votable.

### Call-time — the branch in the method

The same file, same toggle, different mechanism:

```php
function BlasterImage::onFire(%data, %obj, %slot)
{
   if(!$Host::ClassicLoadBlasterChanges)
   {
      Parent::onFire(%data, %obj, %slot);
      return;
   }
   … six-projectile spread …
}
```

Here the global is read **on every shot**. The guard-and-delegate shape is idiomatic: if the option is
off, hand straight back to the parent implementation and return. Nothing about the stock behaviour is
duplicated, so the stock path cannot drift.

### Choosing between them

| | Datablock ternary | Method branch |
|---|---|---|
| Evaluated | Once, at datablock construction | Every call |
| Visible to clients | Yes — ghosted with the datablock | No — server-side only |
| Changeable at runtime | No | Yes |
| Cost | None after load | A global read per invocation |
| Use for | Numbers the client must agree on: damage, energy, sounds | Behaviour: firing patterns, scoring, permissions |

**Use both, for the same toggle, as Classic does.** The numbers go in the datablock; the behaviour goes
in the method. Trying to force behaviour into datablock fields produces unreadable datablocks, and trying
to force damage numbers into methods desynchronises the client.

## Tell the client what ruleset it joined

This is the part most mods skip, and it is the part players actually notice. On connect, the server
messages each client the state of every toggle **[mod-script]**:

```php
messageClient( %client, 'MsgClassic', 'Classic \c2Sniper Mod: \c3%1.', ($Host::ClassicLoadSniperChanges ? 'Enabled' : 'Disabled') );
messageClient( %client, 'MsgClassic', 'Classic \c2Missile Mod: \c3%1.', ($Host::ClassicLoadMissileChanges ? 'Enabled' : 'Disabled') );
messageClient( %client, 'MsgClassic', 'Classic \c2Mortar Mod: \c3%1.', ($Host::ClassicLoadMortarChanges ? 'Enabled' : 'Disabled') );
messageClient( %client, 'MsgClassic', 'Classic \c2Blaster Mod: \c3%1.', ($Host::ClassicLoadBlasterChanges ? 'Enabled' : 'Disabled') );
… and five more …
```

Nine near-identical lines. Repetitive, and correct: a player joining a server whose blaster is a shotgun
needs to be told, because nothing in the interface reveals it. A server-side mod cannot change the client
UI, so the chat log is the only channel available — see
[Client/server split](../02-engine-model/client-server-split.md) and
[Text and messaging](../04-interface/text-and-messaging.md).

1.5.1's changelog records the failure mode: "Added missing messages that told client what gameplay
changes were in affect on the server. 1.5 was missing Mine and Havoc messages" **[mod-script]**. Two
toggles shipped silently for six days. **If your announcement list is maintained by hand, it will drift
from your toggle list.** Derive it — walk the names, or keep a table both sides read.

## Stealing this

The pattern generalises to any mod that wants optional rules:

```php
// 1. Declare in your defaults file, off by default.
$Host::MyModLoadFooChanges = 0;

// 2. Numbers the client must agree on — resolve at datablock time.
datablock ProjectileData(FooProjectile)
{
   directDamage = $Host::MyModLoadFooChanges ? 0.05 : 0.15;
};

// 3. Behaviour — branch at call time, delegating when off.
function FooImage::onFire(%data, %obj, %slot)
{
   if(!$Host::MyModLoadFooChanges)
   {
      Parent::onFire(%data, %obj, %slot);
      return;
   }
   // changed behaviour only
}

// 4. Announce on connect, from a list you maintain in one place.
$MyMod::ToggleNames = "Foo" TAB "Bar" TAB "Baz";
for(%i = 0; %i < getFieldCount($MyMod::ToggleNames); %i++)
{
   %name = getField($MyMod::ToggleNames, %i);
   messageClient(%client, 'MsgMyMod', '\c2%1 Mod: \c3%2.', %name,
                 ($Host::MyModLoad[%name] ? 'Enabled' : 'Disabled'));
}
```

Step 4 is the improvement on Classic, and it needs the right V12 idiom.

**There is no `getVariable()` in V12.** The string does not appear anywhere in `Tribes2.exe`
**[binary]**, nor in any shipped script — it is a later-Torque addition, and reaching for it is a common
way to write code that looks plausible and does not run.

What V12 *does* give you is **global arrays with a runtime subscript**. `$Foo[%bar]` resolves `%bar` at
execution time, and the shipped scripts lean on it constantly — `$TeamName[%team]`, `$flagStatus[%flag.team]`,
`$teamScore[%i]`, `$InventoryHudData[%i, itemDataName]` **[script]**. So declare the toggles as an array
keyed by name rather than as separately-named globals:

```php
$Host::MyModLoad["Foo"] = 0;
$Host::MyModLoad["Bar"] = 0;
```

and one list then drives the announcement, any vote menu, and the datablock ternaries alike. Adding a
toggle becomes a one-line change in one place, and the 1.5.1 failure — two toggles shipping with no
announcement — becomes structurally impossible.

The trade-off is that these no longer read as `$Host::ClassicLoadBlasterChanges` in a prefs file, which
matters if admins edit prefs by hand. If you need the flat names for that, keep them and drive the
announcement from a parallel array of *labels* instead; you still get one list, just not one variable.

See [TorqueScript](../02-engine-model/torquescript.md) for the array-global semantics, and
[Console functions](../reference/console-functions.md) for what actually exists in V12.

### Where it does not reach

Toggles cost you a combinatorial test surface. Ten independent booleans is 1024 configurations, and
nobody tested 1024 configurations. In practice servers ran a handful of known-good combinations, and the
1.5.x patch sequence is partly the cost of that.

Keep the count small, keep the defaults meaning "stock", and **document the combinations you actually
run** — which is exactly what TacoServer does when it ships a curated `serverPrefs.cs` (section 29)
rather than exposing everything.

## Related

- [23 · Classic 1.5.2](../23-classic-152/README.md) — the release that introduced these
- [Datablocks](../02-engine-model/datablocks.md) — why datablock fields resolve once
- [Packages](../02-engine-model/packages.md) — `Parent::` and the guard-and-delegate shape
- [Client/server split](../02-engine-model/client-server-split.md) — why announcement is necessary
- [29 · TacoServer in operation](../29-tacoserver-operation/README.md) — the modern successor to this idea
