# 22 · Classic 1.1 — the version in your install

Dated **31 October 2002**, and present in every clean 25034 install as `GameData/Classic/`. If you have
Tribes 2 on disk, you already have this mod. Nothing to download, nothing to verify against a mirror —
which makes it the best possible worked example of a large server-side mod in this handbook.

| | |
|---|---|
| Version | 1.1 (10/31/02) **[mod-script]** |
| Scripts | 67 `.cs` in `GameData/Classic/scripts/` |
| Client pack | `GameData/base/zz_Classic_client_v1.vl2` — 5 `.cs`, 2132 lines |
| Maps | `GameData/base/Classic_maps_v1.vl2` — 24 missions, 329 files |
| Launchers | `Classic_online.bat`, `Classic_LAN.bat`, `Classic_dedicated_server.bat` |
| Docs | `Classic_readme.txt` (44 KB), `Classic_technical.txt` (31 KB) |

## Read the launchers first

The three `.bat` files are the shortest useful lesson in the whole mod. All three are the same except for
one line **[mod-script]**:

```bat
del .\base\scripts\*.dso 1> nul 2>&1
del .\base\scripts\autoexec\*.dso 1> nul 2>&1
del .\base\scripts\packs\*.dso 1> nul 2>&1
del .\base\scripts\turrets\*.dso 1> nul 2>&1
del .\base\scripts\vehicles\*.dso 1> nul 2>&1
del .\base\scripts\weapons\*.dso 1> nul 2>&1

del .\Classic\scripts\*.dso 1> nul 2>&1
... same six lines again for Classic ...

start ispawn.exe 28000 Tribes2.exe -dedicated -mod Classic
```

Twelve `del` lines before the game is allowed to start. **Every shipped Classic launcher deletes every
compiled script in both the base and the mod before every single run** — because a stale `.dso` silently
shadowing an edited `.cs` is the defining failure mode of Tribes 2 modding. See
[Packaging](../06-shipping/packaging.md#dso-compilation).

Note also what the deletion list tells you: the mod's own subdirectories are enumerated by hand. There is
no recursion, so a script in a directory the authors did not anticipate never gets its `.dso` cleared.
Keep your scripts inside the conventional category directories.

The three variants differ only in the launch line:

| Launcher | Line | Effect |
|---|---|---|
| `Classic_online.bat` | `Tribes2.exe -online -mod Classic` | Listen server, authenticated |
| `Classic_LAN.bat` | `Tribes2.exe -nologin -mod Classic` | No authentication |
| `Classic_dedicated_server.bat` | `ispawn.exe 28000 Tribes2.exe -dedicated -mod Classic` | Dedicated, wrapped in the respawner |

`ispawn.exe` is Sierra's supervisor — it restarts the process if it dies, with the port as its first
argument. See [Launch options](../01-getting-started/launch-options.md).

## The physics change

One line, in `scripts/server.cs` **[mod-script]**:

```php
$Classic::gravSetting = -26.9; // z0dd - ZOD, 9/13/02. Classic Gravity setting
$Classic::cameraSpeed = 50;
$Camera::movementSpeed = $Classic::cameraSpeed; // z0dd - ZOD, 9/13/02. Classic camera speed.
```

Applied per-mission rather than once at startup **[mod-script]**:

```php
if(getGravity() !$= $Classic::gravSetting)
   setGravity($Classic::gravSetting);
```

The guard matters. Gravity is a *mission* property — a `.mis` can set its own, and loading one resets it.
Classic therefore re-asserts its value on every mission load rather than trusting a startup assignment.
**If you change a mission-scoped engine setting, re-apply it per mission**; setting it once in your mod's
top-level script will work until the first map change and then quietly stop.

The retail value it overrides is `$DefaultGravity = -20` **[script]**, and Classic keeps a copy of that
too, so it can restore it:

```php
$DefaultGravity = getGravity();
...
setGravity($DefaultGravity);
```

## What it changed

`Classic_readme.txt` section 3.1 is an itemised list running to several hundred lines, and
`Classic_technical.txt` maps each change to the file implementing it — a genuinely exemplary piece of mod
documentation. The shape of it:

| Area | Character of the changes |
|---|---|
| **Physics** | "Completely new physics model" — the gravity change and its knock-ons |
| **Admin** | Admin HUD, warnings, private messages, SAD rework, auto-password, mission rotation, telnet alerts |
| **Flags** | Drop vector follows the corpse, added mass, pickup radius 3 m → 3.5 m, 1-second re-pickup delay |
| **Weapons** | Disc spread removed, tighter chaingun, shocklance range 16 m and rear-hit bonus, mine discing enabled |
| **Vehicles** | Stronger thrusters across the board, MPB teleporter, bombing reticle, grav bike nose chaingun |
| **Turrets** | Faster wake/unfold, mortar targeting radius 160 m → 400 m, missile barrels no longer controllable |
| **Packs** | Cloak fully invisible with lower drain, satchel 8/10 s → 6/10 s and radius 20 → 25 |
| **Gametype** | Defend and Destroy (DnD) returns from Tribes 1 |

Several are worth studying as *design* rather than tuning:

**Removing randomness.** "Disc spread removed" and "Flags now follow the movement vector of the dropping
corpse instead of a random vector" are the same decision applied twice. Competitive play wants outcomes
attributable to the player, so Classic strips stochastic elements from the two most contested
interactions in the game.

**Fixing the engine's approximations.** "Players no longer pass through flags when moving fast" and the
pickup-radius increase both work around discrete collision sampling at Classic's higher speeds. Raising
gravity made players faster, which made tunnelling worse, which required a bigger capture radius. A
physics constant changed at the top of the mod produced a collision fix at the bottom of it — the kind of
cascade worth expecting in your own work.

**Closing exploits by removing the affordance.** Missile barrels "can no longer be controlled, which
prevents long range missile fire on enemy targets that can't be distracted by flares." The exploit was
not patched; the capability was deleted.

## The client pack

`zz_Classic_client_v1.vl2` sits in `base/`, not in `Classic/`, and the `zz_` prefix is deliberate — it
sorts last in the mod path so it wins over the base archives. See
[Mod paths and overrides](../02-engine-model/mod-paths-and-overrides.md).

| Script | Lines | Purpose |
|---|---|---|
| `practiceHud.cs` | 887 | CTF practice-mode interface |
| `modHud.cs` | 551 | Generic mod HUD, usable by *other* server-side mods |
| `clientOverloads.cs` | 393 | Client-side function overrides |
| `adminHud.cs` | 282 | The admin control panel |
| `classicPropMap.cs` | 19 | Property map registration |

`modHud.cs` is the interesting one. Classic's readme describes it as "a Mod HUD, so server side mods can
have some client-side support" **[mod-script]** — a generic client surface any server-side mod can drive,
solving the problem that server-side mods cannot ship client code to players who have not installed
anything. The readme points at `setCameraSpeed()` in `clientOverloads.cs` as the worked example of a
server telling a client which mod it is running.

This is the period-correct answer to a real constraint, and it is why so much Classic-family
functionality is expressed as chat commands and HUD messages rather than proper interfaces. See
[Client/server split](../02-engine-model/client-server-split.md).

## Practice mode and DnD

Two additions that shipped as part of 1.1 and survive into every descendant:

**CTF Practice** (`PracticeCTFGame.cs`, `practice.cs`, `aiPracticeCtf.cs`) — a training mode with
admin-loadable deployable sets, projectile-camera observation, and map reset. It carries 117 z0dd
comments, the densest file in the mod.

**Defend and Destroy** (DnD) — the Tribes 1 gametype restored. Teams score per objective destroyed
(vehicle stations, sensors, solar panels, generators, base turrets) plus per switch held. The readme
notes it "isn't limited to just Classic mod" and instructs mappers to use the `"DnD"` string
**[mod-script]** — so it is a reusable gametype, not a Classic-internal one. See
[Gametypes](../05-gameplay-systems/gametypes.md).

## The 24 maps

`Classic_maps_v1.vl2` ships 24 missions, and the readme carries a matrix of which gametypes each supports
across Bounty, CnH, CTF, DnD, DM and TeamHunters **[mod-script]**. Two things are clear from it without
counting columns: **CTF is supported by nearly every map**, and **Ramparts is the only one supporting
five of the six**. The rarer types are supported by a handful of maps each.

If you are authoring a Classic map, CTF and DnD are where the players are — see
[16 · Shipping a map](../16-shipping-a-map/README.md).

## Under the community patches

Classic 1.1 predates both patches by roughly two decades and neither modifies it. Two interactions worth
knowing:

**CRC checking is off by default** in 1.1 — the readme lists "CRC checking is now off by default, instead
of on" as a 1.1 change **[mod-script]**. That is what makes client-side script differences tolerable, and
it is why the TribesNEXT QoL patch's replacement fonts and GUI changes do not conflict with a Classic
server. See [Modding a patched install](../07-community-patches/modding-against-a-patched-install.md).

**`ispawn.exe` and authentication.** `Classic_dedicated_server.bat` calls `ispawn.exe` with
`Tribes2.exe -dedicated`, expecting WON authentication that no longer exists. Under either community
patch you will be using the patch's own launcher or `-nologin`. See
[07 · Community Patches](../07-community-patches/README.md).

## Related

- [21 · Classic](../21-classic/README.md) — why Classic exists, and the lineage
- [23 · Classic 1.5.2](../23-classic-152/README.md) — where 1.1 went next
- [Launch options](../01-getting-started/launch-options.md) — `-mod`, `-dedicated`, `ispawn.exe`
- [Packaging](../06-shipping/packaging.md) — why the launchers delete `.dso` files
- [Gametypes](../05-gameplay-systems/gametypes.md) — adding a gametype the way DnD does
