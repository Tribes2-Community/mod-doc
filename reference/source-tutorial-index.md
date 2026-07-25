# Source tutorial index

This handbook draws on the surviving community modding tutorials, preserved in a `T2ModTutorialDatabase/`
corpus that sits alongside this repository in the authoring workspace — **it is not included here**, and
the paths below are provenance rather than links. They were written in 2002–2003, mostly by players, and
they are the origin of most practical Tribes 2 modding knowledge.

They also contain guesses, errors, and recipes that circulated unverified for twenty years. Where this
handbook and a tutorial disagree, this handbook follows the shipped V12 scripts and says so.

**Read them for the recipes. Verify against the base scripts.**

## The corpus

| Location | Contents |
|---|---|
| `T2ModTutorialDatabase/tutorials/` | 87 text tutorials, plus `quadchain.html` |
| `T2ModTutorialDatabase/badshottuts/` | 26 HTML tutorials by BadShot, plus an index |
| `T2ModTutorialDatabase/Tutorials.html` | Index page from advancedmod.com, with authors, dates, and difficulty |
| `T2ModTutorialDatabase/Laggs Bot Tutorial.txt` | A 38 KB standalone bot-AI tutorial |

Named authors include **Xetrov**, **Drumstix42**, **BadShot**, **Sanguinus**, **Crashed**, **DynaBlade**,
and **Lt Eartworm**. Dates cluster around December 2002 – January 2003.

## By topic, with the handbook page that covers the same ground

### Getting started

| Tutorial | Handbook |
|---|---|
| `getting_started.txt` — Xetrov, Jan 2003 | [Your first mod](../01-getting-started/your-first-mod.md) |
| `getting_started2.txt` — "Lets Code Already" | [Your first mod](../01-getting-started/your-first-mod.md) |
| `coding_knowledge.txt` — Lt Eartworm; projectile types and general notes | [Projectiles](../03-content-recipes/projectiles.md) |
| `typemasks.txt` | [Damage and type masks](../03-content-recipes/damage-and-typemasks.md) |
| `seperate_armor_folder.txt` | [Packaging](../06-shipping/packaging.md) |
| `disable_tr2.txt` | — |

### Weapons and projectiles

| Tutorial | Handbook |
|---|---|
| `any_ammo_based.txt` — adding ammo-based weapons | [Weapons](../03-content-recipes/weapons.md) |
| `any_energy_based.txt` — adding energy-based weapons | [Weapons](../03-content-recipes/weapons.md) |
| `multi_projectile_tutorial.txt`, `TutorialMultiProjectile.html` — BadShot, "Hard" | [Weapons](../03-content-recipes/weapons.md#what-happens-on-fire) |
| `TutorialSecondaryProjectile.html` | [Weapons](../03-content-recipes/weapons.md) |
| `gravity_for_projectiles.txt` | [Projectiles](../03-content-recipes/projectiles.md#energyprojectiledata--blaster) |
| `weapon_recharge.txt` | [Weapons](../03-content-recipes/weapons.md#the-state-machine) |
| `weapon_hold_position.txt` | [Armors](../03-content-recipes/armors.md#animation-binding) |
| `weapon_particle_effect.txt` | [Effects](../03-content-recipes/particles-explosions-effects.md) |
| `weaponpack.txt`, `TutorialWarpGun.html`, `warp_gun.txt` | [Weapons](../03-content-recipes/weapons.md) |
| `shotgun.txt`, `minigun.txt`, `mine_launcher.txt`, `nuke_launcher.txt` | [Weapons](../03-content-recipes/weapons.md) |
| `seeking_disc_launcher.txt`, `hellfire.txt`, `hackgun.txt` | [Projectiles](../03-content-recipes/projectiles.md#seekerprojectiledata--missile-launcher) |
| `flakgun.txt`, `TutorialFlakGun.html` | [Weapons](../03-content-recipes/weapons.md) |
| `charging_plasma_cannon.txt`, `TutorialChargingPlasmaCannon.html` | [Weapons](../03-content-recipes/weapons.md#the-state-machine) |
| `heavy_chaingun_barrel.txt`, `quadchain.html` | [Weapons](../03-content-recipes/weapons.md) |
| `repaigun-repair_rifle_tut.txt`, `TutorialRepairGun.html` | [Packs](../03-content-recipes/packs.md#activated-pack--the-repair-pack) |
| `sniper_pack_tut.txt`, `discpack.txt`, `beamswordpack.txt`, `godhammerpack.txt` | [Weapons](../03-content-recipes/weapons.md), [Packs](../03-content-recipes/packs.md) |
| `TutorialImpulse.html`, `TutorialGrenadeFountain.html` | [Damage](../03-content-recipes/damage-and-typemasks.md#impulse) |
| `TutorialArtillery.html` | [Projectiles](../03-content-recipes/projectiles.md#grenadeprojectiledata--grenade-launcher) |
| `shoot_after_death.txt` | — |

### Packs

| Tutorial | Handbook |
|---|---|
| `anti-energy_pack.txt`, `cheetah_pack.txt`, `flamepack.txt`, `hover_pack.txt`, `lava_shield_pack.txt`, `telepadpack.txt`, `environmental_pack.txt` | [Packs](../03-content-recipes/packs.md) |
| `TutorialHoverPack.html`, `TutorialEnvironmentPack.html` | [Packs](../03-content-recipes/packs.md) |
| `cloaking_device.txt`, `TutorialMassCloak.html`, `shrike_player_cloak.txt` | [Packs](../03-content-recipes/packs.md) |
| `restrict_pack_usage.txt` | [Ammo and inventory](../03-content-recipes/ammo-and-inventory.md#use-restrictions) |
| `grappling_hook.txt`, `forcefield_hammer.txt`, `TutorialForceField.html` | [Packs](../03-content-recipes/packs.md) |

### Armors

| Tutorial | Handbook |
|---|---|
| `adding_armors.txt` — Drumstix42, Dec 2002 | [Armors](../03-content-recipes/armors.md) |
| `admin_armor.txt`, `creator_armor.txt` | [Armors](../03-content-recipes/armors.md) |
| `exploding_bodies.txt`, `explosion&blood_effects.txt` | [Effects](../03-content-recipes/particles-explosions-effects.md) |

### Vehicles

| Tutorial | Handbook |
|---|---|
| `adding_vehicles.txt` — Drumstix42, Dec 2002 | [Vehicles](../03-content-recipes/vehicles.md) |
| `creator_vehicle.txt`, `sparrow_flyer.txt` | [Vehicles](../03-content-recipes/vehicles.md) |
| `vehicle_boost_rockets.txt`, `TutorialBoosterRocket.html` — BadShot | [Vehicles](../03-content-recipes/vehicles.md#the-flight-feel-dials) |
| `vehicle_ejection_seats.txt`, `TutorialEjectionSeats.html` — BadShot | [Vehicles](../03-content-recipes/vehicles.md#mount-points) |
| `vehicle_debris.txt` — BadShot | [Effects](../03-content-recipes/particles-explosions-effects.md#debrisdata--fragments) |
| `vehicle_required_armor.txt` | [Vehicles](../03-content-recipes/vehicles.md) |
| `vehicle_weapon_locking.txt` — DynaBlade | [Projectiles](../03-content-recipes/projectiles.md#seekerprojectiledata--missile-launcher) |
| `vehicle_hud.txt` — Crashed, Dec 2002 | [HUD](../04-interface/hud.md#vehicle-hud) |
| `vehiclehud_page_cycling.txt` — BadShot | [HUD](../04-interface/hud.md#vehicle-hud) |
| `TutorialVehiclePadCycle.html` | [Vehicles](../03-content-recipes/vehicles.md) |

### Deployables and turrets

| Tutorial | Handbook |
|---|---|
| `adding_deployables.txt` — Drumstix42, Dec 2002 | [Turrets and deployables](../03-content-recipes/turrets-and-deployables.md) |
| `deployables_list.txt` | [Turrets and deployables](../03-content-recipes/turrets-and-deployables.md#the-shipped-deployables) |
| `deployable_base_turret.txt`, `deployable_disc_turret.txt`, `deployable_flare_turret.txt`, `deployable_laser_turret.txt` | [Turrets and deployables](../03-content-recipes/turrets-and-deployables.md#turrets) |
| `deployable_bunker.txt`, `TutorialBunker.html`, `deployable_platform.txt` | [Turrets and deployables](../03-content-recipes/turrets-and-deployables.md#deployables) |
| `blastwall.txt`, `blastwall_addition.txt`, `TutorialBlastWall.html` | [Turrets and deployables](../03-content-recipes/turrets-and-deployables.md) |
| `undeploying_tut.txt`, `TutorialUndeploying.html` | [Turrets and deployables](../03-content-recipes/turrets-and-deployables.md) |
| `shield_generator.txt` | [Turrets and deployables](../03-content-recipes/turrets-and-deployables.md) |
| `jumpad_tut.txt`, `TutorialJumpad.html` | [Missions](../05-gameplay-systems/missions.md) |
| `spy_satellite.txt`, `TutorialSpySatellite.html` | [Turrets and deployables](../03-content-recipes/turrets-and-deployables.md) |

### Grenades, mines, beacons

| Tutorial | Handbook |
|---|---|
| `cloaking_mine.txt`, `mag_air_mine.txt`, `TutorialMine.html` | [Grenades and hand inventory](../03-content-recipes/grenades-and-hand-inventory.md#mines--a-thrown-item-with-deployment-logic) |
| `beacon_modes.txt` — Sanguinus, "Intermediate" | [Grenades and hand inventory](../03-content-recipes/grenades-and-hand-inventory.md) |
| `beacon_on_laser.txt`, `armor_specific_beacons.txt` | [Projectiles](../03-content-recipes/projectiles.md#targetprojectiledata--targeting-laser) |
| `beacons_with_deployables.txt`, `TutorialBeaconDeployables.html` | [Turrets and deployables](../03-content-recipes/turrets-and-deployables.md) |
| `shield-regen_beacon.txt` | [Turrets and deployables](../03-content-recipes/turrets-and-deployables.md) |

### Interface

| Tutorial | Handbook |
|---|---|
| `basic_colors.txt`, `game_text_color.txt` | [Text and messaging](../04-interface/text-and-messaging.md#colour-codes) |
| `bottom_printing.txt` | [Text and messaging](../04-interface/text-and-messaging.md#centre-and-bottom-print) |
| `join_message.txt` | [Text and messaging](../04-interface/text-and-messaging.md#the-message-system) |
| `load_screen.txt`, `multi_load_screen.txt` | [GUI system](../04-interface/gui-system.md) |
| `TutorialRetFix.html` — reticle fix | [HUD](../04-interface/hud.md#reticles) |
| `spawn_favs.txt`, `TutorialSpawningFavorites.html` | [Ammo and inventory](../03-content-recipes/ammo-and-inventory.md#inventory-station-loadouts) |

### Effects

| Tutorial | Handbook |
|---|---|
| `jet_particle.txt` | [Effects](../03-content-recipes/particles-explosions-effects.md), [Armors](../03-content-recipes/armors.md#sounds-and-effects) |

### Reference

| Tutorial | Handbook |
|---|---|
| `ReferenceSimGroups.html` — BadShot | [SimObjects and namespaces](../02-engine-model/simobject-and-namespaces.md#groups-and-sets) |
| `Laggs Bot Tutorial.txt` | [AI and bots](../05-gameplay-systems/ai-bots.md) |

## Where the corpus is wrong, or was honest about not knowing

Worth reading as a lesson in evidence quality.

**Admitted gaps.** `coding_knowledge.txt` on the ELF gun **[community]**:

> "restorativeFactor / dragFactor / endFactor / randForceFactor / randForceTime — i don't know what these
> do."

Still unresolved. The names and `numControlPoints` imply a spring/damper chain along the beam, but the
engine code has not been traced. This handbook says so rather than guessing — see
[Projectiles](../03-content-recipes/projectiles.md#elfprojectiledata--elf-gun).

**Also honest:** the same file on `TracerProjectile` — *"not really sure. my guess is that its similar to
a linear projectile"* — and on `FlareProjectile` — *"I'm going to research this one."* Both are documented
here from the shipped datablocks instead.

**Mod path order.** Some community documentation gives the default stack as `base;Classic`
**[community]**. The binary appends `;base` to whatever `-mod` supplies **[binary]**, so `-mod Classic`
gives `Classic;base` — Classic first. The order matters because first hit wins. See
[Mod paths and overrides](../02-engine-model/mod-paths-and-overrides.md#base-is-always-the-tail).

**Toolchain.** `getting_started.txt` recommends WinZip and Tribal IDE **[community]**. Both are long
obsolete; any modern archive tool and text editor is better. The *advice underneath* — unpack
`scripts.vl2`, keep it where you can read it, make a mod folder, use `-mod` — is still exactly right.

**Comments in the shipped code are not always right either.** `$HandInvThrowTimeout = 0.8 * 1000;` is
commented *"1/2 second between throwing grenades or mines"* **[script]**. It is 800 ms. Trust code over
comments, from any source.

## Reading them today

They assume Tribes 2 as it stood in 2002 and often paste large code blocks without saying which file they
came from. To use one:

1. Identify the datablocks it declares and find the shipped originals in `base/scripts.vl2`.
2. Check the field names against the real datablock — several tutorials carry typos that were silently
   creating dynamic fields.
3. Prefer a **package override** to the copy-and-edit-the-base-file approach most of them describe. The
   mechanism existed in 2002 and was underused; see [Packages](../02-engine-model/packages.md).
4. Check whether the recipe needs registration steps the tutorial omits — `max[]` entries,
   `$AmmoIncrement`, `$WeaponsHudData`. Several tutorials produce content that loads but cannot be
   obtained.

## The corpus predates every patch

Worth stating plainly: **the tutorials were written in 2002–2003, five to six years before RC2a and more
than twenty before the current patch.** Nothing in them accounts for either.

Where that matters:

| Tutorial assumption | Reality on a patched install |
|---|---|
| WON login and the Sierra master server exist | Both dead since 2008; TribesNEXT replaces them |
| `scripts/autoexec/` is yours alone | True on the QoL patch; **RC2a ships three files there** |
| Fonts render as vanilla Univers | The QoL patch substitutes every font for a `.sdft` |
| The UI is effectively 640×480 | Render scale, UI scale, and UI aspect are user-controlled |
| Force feedback works | Dead on the QoL patch; still works on RC2a |
| `GameConnection::onConnect` fires once | Fires twice per remote client, via the auth phase |
| Audio is Miles | Miles or OpenAL Soft, user-selectable |

**None of this affects the content recipes**, which is the bulk of the corpus. A weapon, armor, vehicle,
pack, or deployable tutorial from 2003 produces something that works on a patched install today, subject
to the same registration steps those tutorials already tended to omit.

The tutorials that need the most care on a modern install are the UI ones — `load_screen.txt`,
`multi_load_screen.txt`, `vehicle_hud.txt`, `TutorialRetFix.html` — because that is where the patches
changed most. See [07 · Community Patches](../07-community-patches/README.md).

## The same people built the mods

The corpus and the flagship mods were not separate communities. **BadShot** — author of 26 tutorials here —
and **DynaBlade** — author of the vehicle-locking tutorial and the "Function Librarys" — are both thanked
by name in the [Construction mod](../40-construction-mod/README.md)'s `Credits.txt` **[mod-script]**, with
DynaBlade co-credited on its 841-line building-persistence system.

The techniques written down in these tutorials are the ones their authors were using to build the largest
server-side mod on the platform. Read them as working notes from a live project, not as an archive.

## Related

- [Handbook front door](../README.md) — evidence markers and scope
- [03 · Content Recipes](../03-content-recipes/README.md) — the same recipes, verified
- [07 · Community Patches](../07-community-patches/README.md) — what changed since these were written
- [40 · The Construction Mod](../40-construction-mod/README.md) — where these techniques ended up
