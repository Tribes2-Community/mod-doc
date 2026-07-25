# 38 · Classic 1.1 — the version in your install

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

## The physics change: gravity

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

## The physics change: skiing, friction and momentum

The readme's "Completely new physics model" line (section 29, player armour changes) is not just
gravity. Fingerprinting every movement-related `PlayerData` field against base (section 31) turns up a
second, larger, and until now undocumented change: **Classic strips out the horizontal speed governor
that limits skiing in base, for every armour weight, and adds real ground-friction removal on top of it.**

`scripts/player.cs`, light armour, base vs Classic **[script]** / **[mod-script]**:

| Field | Base | Classic | |
|---|---:|---:|---|
| `runSurfaceAngle` | 70 | 70 | Unchanged — the ski-trigger slope is identical |
| `noFrictionOnSki` | *(unset)* | `true` | **New** — ground friction actively removed while skiing |
| `horizMaxSpeed` | 68 | **500** | The horizontal ceiling, effectively removed |
| `horizResistSpeed` | 33 | 48.74 | Resistance now begins later |
| `horizResistFactor` | 0.35 | **0** | Resistance strength zeroed — no active braking above the threshold |
| `drag` / `maxdrag` | 0.275 / 0.4 | 0.134 / 0.3 | Roughly halved — velocity bleeds off far more slowly |
| `jetForce` coefficient | 26.21 | 37.28 | +42% thrust-to-weight |
| `upMaxSpeed` | 80 | 52 | Lower, and — see below — now uniform |

The same shape repeats for medium and heavy, with one addition: **`upMaxSpeed` converges to a single
value, 52, across all three weights**, where base varied it by class (80 / 70 / 60). Full comparison,
all three armours **[mod-script]**:

| | Light (base → Classic) | Medium (base → Classic) | Heavy (base → Classic) |
|---|---|---|---|
| `horizMaxSpeed` | 68 → 500 | 60 → 500 | 52 → 500 |
| `horizResistFactor` | 0.35 → 0 | 0.32 → 0 | 0.29 → 0 |
| `jetForce` coefficient | 26.21 → 37.28 | 25.22 → 33.79 | 22.47 → 29.58 |
| `upMaxSpeed` | 80 → 52 | 70 → 52 | 60 → 52 |
| `upResistSpeed` | 25 → 20.89 | 30 → 20.89 | 35 → 20.89 |

Read together, this is a coherent, deliberate redesign rather than a handful of unrelated tweaks:

**The ski-trigger angle never moves.** `runSurfaceAngle = 70` is identical in every armour, base and
Classic alike. Classic did not make skiing easier to *start* — it changed everything about what happens
once you are.

**The horizontal speed cap is not lowered or raised — it is effectively deleted.** `horizMaxSpeed = 500`
is far beyond anything a player can reach through normal acceleration; combined with
`horizResistFactor = 0`, there is no active mechanism left decelerating a skiing player back toward a
target speed. Base's governor — a hard ceiling plus a resistance force that kicks in below it — is fully
disarmed, for all three weights, not just light armour.

**`noFrictionOnSki` is new, not merely retuned.** No base armour sets it. Classic sets it to `true` on
all nine `PlayerData` blocks (light, medium and heavy, each inherited by the female and Bioderm variants —
section 31). Whatever ground friction base leaves in place while skiing, Classic actively switches off.

**Reduced drag makes the removed cap matter.** Halving `drag`/`maxdrag` means whatever speed a player
builds — now unconstrained by `horizMaxSpeed` — decays far more slowly afterward. The three changes
compound: friction removed at the point of contact, the speed ceiling removed above it, and the ambient
decay that would otherwise erode the result cut roughly in half.

**Vertical speed moves the opposite direction, and gets standardised.** `upMaxSpeed` drops from a
per-weight value to a flat 52 for every armour, and `upResistSpeed` converges similarly to 20.89. Where
horizontal movement is deliberately unbounded, vertical movement is capped lower than base *and* made
uniform across weight classes — reading naturally as a check against pogo-jet spam height rather than
against horizontal ski speed.

**Jet force rose independently.** +42% thrust-to-weight for light armour, +34% medium, +32% heavy — on
top of everything above, not instead of it. A skiing player who taps a jet gets more from it than in base,
compounding rather than replacing the horizontal changes.

None of this is stated anywhere in Classic's own documentation — the readme's changelog is silent on
every field in this table, unlike the gravity change and the suicide-penalty change (section 23), which
both carry explanatory comments. The numbers speak for themselves: this is the "faster and more exciting"
claim from section 37's opening quote, made specific and falsifiable rather than left as marketing copy.

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
(vehicle stations, sensors, solar panels, generators, base turrets) plus per switch held.

It is **not in the Classic mod tree at all.** `DnDGame.cs` ships in `base/scripts.vl2`, and its header
reads **[script]**:

```
//  <> Defend and Destroy <>
//
//  Version: 1.1.25026
//  Date: October 23, 2002
//  By: ZOD
```

Same author as Classic, same week, carrying four of his `z0dd` signatures — but delivered **into Sierra's
own base archive** by the retail patch rather than into the mod. That is the clearest single piece of
evidence for section 37's claim that Sierra absorbed Classic-team work into the shipped product: a
community-authored gametype living in `base/scripts.vl2` with the author's name on it.

It also explains the readme's otherwise odd remark that DnD "isn't limited to just Classic mod"
**[mod-script]**, and why mappers are told to use the `"DnD"` string — it is a base gametype available to
any mod. See [Gametypes](../05-gameplay-systems/gametypes.md) and
[31 · The base ruleset](../31-base-ruleset/README.md).

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

- [37 · Classic](../37-classic/README.md) — why Classic exists, and the lineage
- [39 · Classic 1.5.2](../39-classic-152/README.md) — where 1.1 went next, and confirmation this physics model never changed
- [31 · The base ruleset](../31-base-ruleset/README.md#skiing-friction-and-momentum) — the base values this page's table compares against
- [Armors](../03-content-recipes/armors.md#the-skiing-and-momentum-fields) — what each movement field means
- [Launch options](../01-getting-started/launch-options.md) — `-mod`, `-dedicated`, `ispawn.exe`
- [Packaging](../06-shipping/packaging.md) — why the launchers delete `.dso` files
- [Gametypes](../05-gameplay-systems/gametypes.md) — adding a gametype the way DnD does
