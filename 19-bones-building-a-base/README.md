# 19 · Bones' Mapping Tutorial — Building a base

Power, objectives, vehicle pads, spawns and observer drops. Continuing from
[18 · The editor windows](../18-bones-editor-windows/README.md).

Material marked **[bones]** is from NecroBones' tutorial at
`http://tribes.necrobones.com/tribes2/tutorial.html`.

## Power systems

**This is the most valuable section in the tutorial** and there is nothing equivalent in Sierra's manual.

> *"There are **two** ways that power can be provided to a base and its systems:*
>
> - *SimGroup — The simgroup that it's in can have a **dynamic field** called **"providespower"**. If this
>   variable exists and is non-zero in value, **all objects in that group will always be powered with no
>   way to destroy the power source**.*
> - *Generators — Any generator or solar-panel will power all objects **within the same simgroup**."*
>
> **[bones]**

So power is **scoped by SimGroup membership**, not by distance. That is the opposite of the
frequency-and-radius model Construction uses for deployables
([Reusable mechanisms](../58-construction-mod/reusable-mechanisms.md#9-frequency-and-radius-linking)) —
authored maps group things structurally, runtime-placed things must find each other spatially.

It matches the vanilla implementation, which walks the group tree **[script]**:

```php
function SimGroup::powerInit(%this, %powerCount)
function SimGroup::updatePowerCount(%this, %value)
function GameBase::powerCheck(%this, %powerCount)
```

and `DefaultGame::missionLoadDone` seeds it **[script]**:

```php
MissionGroup.clearPower();
MissionGroup.powerInit(0);
```

### Power flows downward

> *"Any generator or simgroup that provides power also provides power to simgroups **under** the one the
> power is coming from."* **[bones]**

Hierarchy is the wiring. A generator in `base0` powers everything in `base0` and everything in any group
nested inside it. This is why the group structure in
[16 · Shipping a map](../16-shipping-a-map/README.md#object-naming-conventions) matters beyond tidiness —
**it is functional**.

### Making generators destroyable

> *"If you want the base to have destroyable generators, then click on the simgroups (**including the team
> simgroup**) and make sure they do not have a "providespower" line, and if they do, **delete the line by
> clicking on the little square next to the variable's name**."* **[bones]**

A `providespower` field inherited from the map you copied will make your base indestructible and you will
not understand why. Check the team group as well as the base group.

That little square beside a dynamic field's name is how you *remove* a dynamic field in the Inspector —
useful well beyond power.

### Design possibilities

> *"You can do all sorts of interesting things with power systems… For instance, in **Sarcophagus**, I made
> a little bunker behind each base that has its own power system. However, **it also takes a feed from the
> main base**, so as long as either generator is up, it stays powered. It's a place you can fall back to,
> or hide in during a flag-standoff."* **[bones]**

Redundant power as level design. Because power propagates down the hierarchy and a group can be powered by
more than one source, you can build objectives whose difficulty depends on how many generators the
attackers have taken.

## Placing a base

> *"choose a relatively flat spot… Use the creator to place a building, rotate it into position, and set
> its altitude so **all edges of the bottom of it are in the ground**."* **[bones]**

### Terrain inside buildings

The recurring problem, with three stated fixes **[bones]**:

1. Let the terrain be inside.
2. Cut a hole in the terrain — **Set Empty** in the Terrain Editor
   ([13 · Terrain](../13-terrain/README.md#the-eleven-action-modes)).
3. Reposition the building high enough that no terrain extends inside, while still looking grounded.

And the checkbox that reveals the problem:

> *"select it in the tree, look at it in the inspector, and **CHECK the box that says something like
> "AllowTerrainInside"**… The terrain will still be invisible inside the building **until you restart the
> mission**, but if it does extend inside the building, **people will be able to walk on it and get
> blocked by it, even if they can't see it**."* **[bones]**

That is the failure mode: invisible collision inside a building. Restart the mission to see it, then walk
every interior — the check is listed again in
[20 · Finishing touches](../20-bones-environment-finishing/README.md#the-terrain-inside-buildings-check).

### Naming objects

Small, non-obvious, and it affects what players read on their HUD **[bones]**:

> *"Don't forget to assign names to them with the "**name**" field in the inspector, since all of them will
> display these names. For instance, if you want your generator to be labelled "Main Generator", then set
> the "name" variable to be "**Main**". The word "Generator" is **automatically appended**, as is "station"
> and "sensor" and "turret"."*

**Set `name = "Main"`, not `name = "Main Generator"`** — the object type is appended for you. Get this
wrong and players see "Main Generator Generator".

Note this is the *display* name and is distinct from the structural naming convention
(`Team1generatorLarge1`) that gametype script uses with `nameToID()`
([16 · Shipping a map](../16-shipping-a-map/README.md#object-naming-conventions)).

## Objectives — flags

> *"choose a spot where the flag won't be **so secure** that no one can get to it, but not **so exposed**
> that it never stays on the stand either."* **[bones]**

The mechanics:

| Step | Detail |
|---|---|
| Place a **flagstand** | Under **Statics** → **objectives** |
| Choose the type | **Interior** and **Exterior** stands differ only in size and appearance |
| Place the **flag** on top of it | |
| Put both in the **team's SimGroup** | |
| Waypoint | *"The flag will automatically create a waypoint that both teams can see"* |

Typically one flag per team, though *"you can have more if you want, which makes for some rather weird
gameplay"* **[bones]**.

### The design opinion

Worth quoting because it is a real position about what maps are for **[bones]**:

> *"Some people like "**ski-capping**", but I personally loathe it. I prefer to make my maps around
> **teamwork**, requiring players to get organized and work in groups. So I like **forcefields with distant
> power sources**, **enclosed rooms with multiple entrances**, and **ledges that are too high to ski
> through**."*

Each of those is a concrete technique:

- **Force fields with distant power sources** turns a defended room into a two-part objective — and uses
  the power hierarchy above.
- **Multiple entrances** prevents a single chokepoint stalemate.
- **Ledges too high to ski through** denies the fast solo cap without removing skiing.

Disagree with the taste if you like; the point is that flag placement plus power topology *is* the
gameplay.

## Vehicle pads

Five quirks, all worth knowing before you place one **[bones]**:

| Quirk | Consequence |
|---|---|
| **Pads have no under-side** | Elevated pads let you see and shoot up through them — put something underneath |
| **Pads are transparent to vehicles** | Hover vehicles rest on the surface *under* the pad, so put something flat there, not too far below, or vehicles get stuck |
| **Roof placement is problematic** | *"invisible vertical barriers at both ends of the pad sticking downward that you couldn't shoot through"* |
| **No vehicle station needed** | *"The pad will automatically create one when the mission loads"* |
| **Height is fiddly** | Too high → the glitches above; too low → *"it disappears from view when you're some distance away, depending on the video card"* |

The station point is the one that saves work: **place the pad, not a pad and a station.**

## Spawnspheres

> *"Spawnspheres are wonderful in concept, and can make things much easier than placing individual
> spawnpoints like you had to do in T1. **They do have problems though.**"* **[bones]**

Place one or more per team. They govern spawning at mission start and on every death.

| Field | Effect |
|---|---|
| **weight** | Relative likelihood versus the team's other spheres — *"If one has twice the weight, you're twice as likely to spawn there"* |
| **indoor weight** / **outdoor weight** | Likelihood of spawning indoors versus outdoors within the sphere |

> *"The defaults work very well if you are just using one sphere centered on a single base, but there are
> occasions when you need more control."* **[bones]**

### The spawn graph must be built

> *"Once you've placed the spheres, you need to **build the spawn graph**. This can be done in the editor,
> but I don't trust the graphical version as much, and you need to exit out of the game and restart anyway
> before you can test the changes, so I recommend saving and exiting when you've placed your spheres."*
> **[bones]**

This is what `-spnBuild` is for
([15 · Lighting, navigation & spawn data](../15-lighting-nav-spawn/README.md#spawn-data)):

```bash
Tribes2.exe -spnBuild <MissionName> <MissionType>
```

**Placing spheres is not enough — the graph is a separate build step, and changes are not testable until
you restart.**

## Observer drops

Short and prescriptive **[bones]**:

> *"add observer cameras. The cameras are under the "**Objects**" menu in the creator… place them in
> locations where you expect there to be action, such as the **flagrooms, the main bases, capturable
> objectives**… The cameras look in the direction of the **green axis**, so when you create one, just lift
> it to a good altitude and rotate it so the green line points where you want it to look."*
>
> *"I'd say **no less than 3**, but usually **no more than half a dozen** or so."*

The green-axis detail is the practical bit — orientation is visible in the gizmo, so aim the green line
and the camera looks there.

These go in the dedicated observer SimGroup that
[18 · The Tree](../18-bones-editor-windows/README.md#the-groups-that-must-exist) lists as required.

## Related

- [20 · Environment and finishing](../20-bones-environment-finishing/README.md) — sky, fog, load screens, final checks
- [13 · Terrain](../13-terrain/README.md) — Set Empty for terrain holes
- [16 · Shipping a map](../16-shipping-a-map/README.md) — naming conventions and per-map gametype fields
- [Reusable mechanisms](../58-construction-mod/reusable-mechanisms.md#9-frequency-and-radius-linking) — the runtime alternative to group-scoped power
