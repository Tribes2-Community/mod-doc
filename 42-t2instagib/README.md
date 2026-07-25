# 42 · T2 Instagib

An extreme weapon and armour strip-down, by **FastEd** — and the one page in this section where the
handbook's usual standard of reading the actual code cannot be fully met. Documented here anyway, with
the gap stated plainly, because what survives is still evidence.

| | |
|---|---|
| Version | 1.0d **[community]** |
| Author | FastEd, with credits to the_force, advancedmod.com, and the t2cc **[community]** |
| Lineage | **Classic** — confirmed via `$Host::Classic*` preference variables absent from base |
| What's present in this workspace | Server preferences and a launcher shortcut only |
| What's missing | The weapon, armour, and AI scripts the readme describes |

## The lineage claim, and what confirms it

The readme states its foundation directly **[community]**:

> "This mod was written from a foundation of Classic scripts (z0dd - ZOD) not base."

That claim is independently checkable even without the missing scripts. `T2Instagib/prefs/ServerPrefs.cs`
uses a run of `$Host::Classic*` variables — `$Host::ClassicAutoPWEnabled`, `$Host::ClassicFairTeams`,
`$Host::ClassicMaxTelepads`, `$Host::ClassicTelnet`, `$Host::ClassicRandomMissions` — none of which exist
in vanilla base **[mod-script]**. A server preferences file that assumes these variables exist can only
be meant to run on a Classic-family server. The readme's lineage claim holds.

## What the readme describes

The readme goes into considerable mechanical detail — quoted here as **[community]**, since none of it is
independently verifiable against source that isn't present:

- Disc damage removed entirely, kept only as a disc-jump impulse (ammo capacity reduced to 4–8)
- Usable weapons narrowed to Elf, EMP Shocklance, Disc (jump-only), EMP Laser Rifle, and a new Instagib
  Rocket
- Grenades and mines removed outright
- Cloak and Shield packs removed
- Medium and Heavy armour removed — **Light armour only**
- Unmounted-vehicle invulnerability removed, except for the MPB
- An admin toggle, `$Host::AutoTurretOff`, for turret auto-tracking
- A new one-shot-kill **Instagib Rocket** — roughly triple a Classic disc's velocity, no splash damage
- A suicide-bomb grenade-slot weapon: 25 m kill radius, a −10 score penalty
- An **EMP Shocklance** that drains power for ten seconds and stacks
- An **EMP Laser** that disarms flag carriers, usable only at full energy

If accurate, this is one of the most aggressive rules-reduction mods in this handbook — removing two of
three armour classes and most of the weapon roster is a far larger gameplay change than its Classic-side
file footprint would suggest.

## What's actually in this workspace

The captured folder contains five items: `Modprefs.cs` (one line — `$Host::AutoTurretOff = 1;`),
`prefs/ServerPrefs.cs` (server configuration only: map rotation, team names, `$Host::GameName = "T2
Instagib Server"`), the readme itself, and two `.lnk` launcher shortcuts whose embedded target paths point
at `Dynamix\Tribes2\GameData\ispawn.exe`.

**There is no `scripts/` directory here overriding weapons, armours, or damage types.** The readme itself
implies why, referring to "the t2instagib folder" as something separate from this preferences package —
this capture appears to be the server-preferences and launcher delta meant to sit on top of a
separately-distributed, already-modified Classic install, not a self-contained mod archive.

Every weapon and armour change listed above is marked **[community]** rather than **[mod-script]**
precisely because of this gap. If you are running T2 Instagib or maintaining this handbook and locate the
actual weapon/armour scripts, this page should be revised to cite them directly.

## Related

- [37 · Classic](../37-classic/README.md) — the ruleset this mod strips down
- [40 · The ruleset toggles](../40-classic-ruleset-toggles/README.md) — the `$Host::Classic*` naming convention that confirms lineage here
- [41 · Overdrive](../41-overdrive/README.md) — a Classic derivative documented from complete source, for contrast
