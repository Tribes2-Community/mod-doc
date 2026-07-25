# 23 · Classic 1.5.2 — the baseline ruleset

Released **15 May 2004**, and still the floor every modern Tribes 2 server builds on. TacoServer's
install instructions in 2026 begin "Update to Classic 1.5.2" **[mod-script]**; twenty-two years after
release it remains the reference ruleset.

Source: `classic_v152.zip`, which contains `classic_files_v152.zip` — the actual payload — plus a
thirteen-line install note.

| | |
|---|---|
| Version | 1.5.2 (5/15/04) **[mod-script]** |
| Scripts | 72 `.cs` (1.1 had 67) |
| Ships | `classic/` tree, `base/zz_classic_client_v1.vl2`, three `.bat` launchers |
| Install | Unzip into the Tribes 2 directory, overwriting |

## It is genuinely the same mod

Fingerprinting every `.cs` in 1.5.2 against the 1.1 tree shipped in the retail install:

| | Count |
|---|---:|
| Byte-identical to 1.1 | 10 |
| Modified | 56 |
| Removed since 1.1 | 1 — `autoexec/minivstationx.cs` |
| New in 1.5.2 | 6 |

Ten files survive eighteen months and four releases untouched — `deathMessages.cs`, `message.cs`,
`aiPracticeCtf.cs`, three turret barrels, two vehicles, `ELFGun.cs` and `grenadeLauncher.cs`. The mod's
authorship is continuous: z0dd's signature still marks the new work, dated `5/07/04`.

The six new files:

| File | What it is |
|---|---|
| `SCtFGame.cs`, `aiSCtF.cs` | **Spawn CTF** — new gametype in 1.4 |
| `forceField.cs` | Force-field handling, extracted for repeated bug-fixing |
| `camera.cs` | Camera control, split out of the observer work |
| `weapons/blaster.cs` | Needed once the blaster became toggleable (section 24) |
| `weapons/sniperRifle.cs` | Same — ammo-based sniper became a server option |

Two of the six exist **only because 1.5 made those weapons configurable**. A datablock that used to be a
constant now has to be a file, because it has to branch. That is the structural cost of the toggle system
and it is worth anticipating in your own mod.

## The four releases that made it

| Version | Date | Character |
|---|---|---|
| 1.2 | 02 Jan 2003 | Server tuning — packet rate and size, dual-CPU stutter fix, TR2 opt-out |
| 1.3 | 03 Jan 2003 | A single vote-list bug |
| 1.4 | 20 Jul 2003 | The big one — Spawn CTF, anti-turtling, admin punishments, word filter, exploit sweep |
| 1.4.1 | 11 Aug 2003 | Spawn CTF hardening, autopassword fix, clan-tag throttle |
| 1.5 | 07 May 2004 | The toggle system, exploit fixes from the community, random/cycle mission types |
| 1.5.1 | 13 May 2004 | Force fields, Siege tournament mode, vehicle respawn |
| 1.5.2 | 15 May 2004 | Three fixes |

1.5, 1.5.1 and 1.5.2 land inside nine days, which tells you 1.5 shipped with problems. That is normal and
the changelog is honest about it — the value here is that the *final* state, 1.5.2, is what stabilised.

### 1.4 — the ruleset gets opinionated

The 1.4 changelog is where Classic stops being a tuning pass and starts being a competitive platform
**[mod-script]**:

- **Anti-turtling** — flags auto-return to the stand after `$Host::ClassicAntiTurtleTime` (default 5
  minutes), *disabled in Tournament Mode*. A public-play fix explicitly excluded from competitive play.
- **Admin punishments** — mute, freeze, boot-to-rear, explode.
- **Server-side bad-word filtering.**
- **Console access for SuperAdmins**, gated behind `$Host::ClassicAllowConsoleAccess`.
- **Client clan-tag switching without reconnecting.**
- **Armour limiting** and vote entries for it.

The design instinct visible throughout: a rule that helps public servers is added, then *turned off for
tournaments*. Classic maintains two audiences in one codebase, and the split is expressed as
configuration rather than as a fork. Section 24 is where that becomes systematic.

### The 25034 interaction

1.4 contains the only changelog entry in this handbook that names the engine build directly
**[mod-script]**:

> "Cloak Pack energy drain reduced, and now matches the Sensor Jammer Pack. This was changed to improve
> the pack slightly due to a bug introduced in version 25034 that allows cloakers to be detected by
> cameras."

A retail patch changed cloak/camera interaction, and the mod compensated with an energy buff rather than
trying to restore the old behaviour — which it could not do, because the change was in the engine. **When
the binary changes under you, rebalance around it.** See [Install anatomy](../01-getting-started/install-anatomy.md)
for what 25034 is.

### 1.5 — community exploit fixes land upstream

The 1.5 list credits individual community members by name for security work **[mod-script]**:

| Credited | Contribution |
|---|---|
| ilys | Team-join exploits, MPB terrain passage, rapid-fire shocklance, forcefield animation abuse, standing-pilot bug |
| Tracer DX / ilys | NULL-voice server-crash exploit |
| Founder | Off-centre projectile drift |
| Lag_Alot | AI code, vehicle respawn |
| Aureole | CSV connection logging ("AurLogging") |

That `ilys` cluster reappears in Evolution as the **AntiLou** fix set (section 25) and in TacoServer as
`autoexec/AntiLouExploitFixes.cs` (section 28). The same body of security work propagates through all
three codebases across twenty years — tracing it is the clearest single thread in the Classic lineage.

## Gameplay state at 1.5.2

Beyond 1.1's baseline, the defaults a player meets on a stock 1.5.2 server:

| Change | Detail |
|---|---|
| Station trigger speed | ~77 kph → ~125 kph (1.2) |
| Heavy jet vector | 30% forward / 70% up → **60/40** (1.2) |
| Mine damage to heavy | ×0.8 → ×0.7 (1.2) |
| Mine damage to MPB | ×3.25 → ×2.85 (1.2) |
| Anti-turtle return | 5 minutes, non-tournament (1.4) |
| Spawn/team switch wait | 20 s → 15 s (1.4) |
| Unmanned turret kill | 3 → 5 points (1.4) |
| Flight ceiling | Minimum 350 m enforced on every mission (1.4) |
| Havoc forward thrust | 71 → 80 (1.5) |
| Target beacons | Restored — the 1.1 marker-only change reverted (1.4) |
| Team Rabbit 2 | **Disabled by default**, `$Host::ClassicLoadTR2Gametype` (1.4) |

The heavy-armour jet change is the most consequential for play: reweighting from 30/70 to 60/40 turns the
heavy from a hoverer into something that can actually traverse, which is what made heavy offence viable
in competitive Classic.

The flight-ceiling floor is a good defensive-programming example — rather than trusting every mission to
declare a sane ceiling, 1.4 clamps it: "If flight ceiling is below minimum, it is set to minimum"
**[mod-script]**. Missions are third-party data; validate them.

## Running it

Install order matters, and the community convention is unforgiving:

1. Start from a clean 25034 install.
2. Delete the old `Classic` folder entirely — do not merge.
3. Extract 1.5.2 into `GameData`.
4. Run once to generate `Classic/prefs/serverPrefs.cs`.
5. Edit that file; **not** `serverDefaults.cs`.
6. Launch with `Classic_dedicated_server.bat`.

Step 5 is the one people get wrong. `scripts/serverDefaults.cs` is the mod's shipped defaults and is
overwritten on every upgrade; `prefs/serverPrefs.cs` is yours and persists. This is the vanilla
prefs/defaults split, documented in
[Hosting and testing](../06-shipping/hosting-and-testing.md).

## Under the community patches

1.5.2 predates TribesNEXT and RC2a. It runs unmodified under both, and every codebase in sections 25–30
assumes it as the substrate. The only practical adjustments:

- **Authentication** — `Classic_dedicated_server.bat` expects WON. Use the patch's launcher, or
  `-nologin` for LAN.
- **`$Host::ClassicAllowConsoleAccess`** grants SuperAdmins arbitrary console execution. On a
  patched, internet-reachable server that is a remote code execution surface. Leave it at `0` unless you
  control every SuperAdmin account. See
  [Modding a patched install](../07-community-patches/modding-against-a-patched-install.md).

## Related

- [24 · The ruleset toggles](../24-classic-ruleset-toggles/README.md) — the `$Host::ClassicLoad*` system 1.5 introduced
- [22 · Classic 1.1](../22-classic-1-1/README.md) — what 1.5.2 descends from
- [25 · Evolution Admin Mod](../25-evolution-admin-mod/README.md) — the admin layer built for 1.4.1–1.5.1
- [28 · TacoServer](../28-tacoserver/README.md) — the modern overlay on 1.5.2
- [Gametypes](../05-gameplay-systems/gametypes.md) — how Spawn CTF plugs in
