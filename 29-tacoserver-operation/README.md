# 29 · TacoServer in operation

The feature set, the preference surface, and how to run it.

## Population-scaled rules

TacoServer's most distinctive design idea, and the one worth stealing: **rules that switch themselves on
and off according to how many people are playing.**

Five prefs in `prefs/serverPrefs.cs` are thresholds rather than switches **[mod-script]**:

```php
$Host::AntiPackPlayerCount = 6;
$Host::EnableTurretPlayerCount = 10;
$Host::MinFlagRecordPlayerCount = 6;
$Host::NoBaseRapePlayerCount = 14;
$Host::ClassicAutoPWPlayerCount = 30;
```

| Threshold | Below it | At or above it |
|---|---|---|
| `AntiPackPlayerCount` = 6 | Packs unrestricted | Pack restrictions apply |
| `EnableTurretPlayerCount` = 10 | Base turrets off | Base turrets active |
| `MinFlagRecordPlayerCount` = 6 | Flag records not tracked | Records count |
| `NoBaseRapePlayerCount` = 14 | Base attacks allowed | Base-rape protection on |
| `ClassicAutoPWPlayerCount` = 30 | Open | Server auto-passwords itself |

The problem this solves is specific to public servers and genuinely hard. A Tribes 2 CTF map is built for
sixteen-plus players. At four players the same map with the same rules is unplayable — base turrets kill
the only two attackers, one player can shut down the enemy base unopposed, and nothing recovers. But a
server that is empty at 03:00 and full at 20:00 cannot be configured for both.

So the ruleset becomes a function of population. Turrets do not exist until there are enough people to
deal with them. Base-rape protection engages only when there are enough defenders for it to be a
meaningful restriction rather than an annoyance. The server tunes itself across the day.

**This generalises directly.** Any multiplayer system with variable population has rules that are correct
at one scale and wrong at another; expressing the threshold as configuration, rather than picking one
scale, is nearly free. The only real cost is that players see behaviour change mid-session, which is why
`$Host::EnableTurretPlayerCount` has a companion notification pref (`EnableNoBaseRapeNotify`,
`EnableTeamBalanceNotify`) — the same "tell the client what ruleset it is in" discipline as section 24.

The auto-password threshold is the inverse trick: at 30 players the server locks itself, reserving the
remaining slots for people who know the password. A capacity-management policy expressed as one integer.

## The preference surface

`prefs/serverPrefs.cs` ships **197 lines** and roughly 180 `$Host::` variables **[mod-script]** — about
double Evolution's 89, and unlike Evolution's it is shipped pre-populated and meant to be edited directly.

The naming carries the lineage plainly:

| Prefix | Origin | Examples |
|---|---|---|
| `$Host::Classic*` | Classic 1.5.2 and earlier | `ClassicAntiTurtleTime`, `ClassicLoadBlasterChanges`, `ClassicBadWordFilter`, `ClassicUseHighPerformanceCounter` |
| `$Host::Allow*` | Base Tribes 2 | `AllowAdminBan`, `AllowPlayerVoteTimeLimit` |
| Unprefixed | TacoServer's own | `AntiPackEnable`, `NoBaseRapeEnabled`, `EnableAutobalance`, `PUGPassword`, `LCTFProMode` |
| `$Host::Evo*` | **None** | — |

All ten `$Host::ClassicLoad*` toggles from section 24 are present and shipped in the prefs file, which is
the strongest single confirmation that the 1.5.2 ruleset is intact underneath.

Notable groups:

**Pickup games.** `PUGPassword`, `PUGautoPassword`, `PUGpasswordAlwaysOn`, plus tournament-mode team
locking. TacoServer is explicitly built for semi-open PUGs as well as open public play, and the password
machinery is how one server serves both.

**Anti-grief.** `TKMax`, `TKWarn1`, `TKWarn2` drive the escalating teamkill warnings from `TKwarn.cs`
(section 28); `NoSmurfs`, `GuidCheck`, `ClassicViralBanning`, `ClassicWhitelist`, `FloodProtectionEnabled`
cover identity and spam.

**Observer management.** `KickObserverTimeout`, `KickObserverStartOnJoin` — idle observers occupy slots,
so they are timed out.

**Presentation.** Roughly twenty `LoadScreen*` prefs for lines, colours, MOTD and logo. Server identity is
configuration, not code — a good instinct for anything intended to be run by other people.

**Gametype variants.** `LakRabbit*` (six prefs), `LCTFProMode`, `LCTFOneMine`, `DMSLOnlyMode` (shocklance-only
deathmatch), `Siege`. Each variant is prefs on a shared codebase rather than a fork.

## What it adds over stock Classic

From the repository's own feature list **[mod-script]**, the substantive additions:

| Area | |
|---|---|
| Teams | Autobalancing, balance notifications, tournament-mode team locking |
| Population scaling | Pack restrictions, base-rape protection, turret activation |
| Voting | Reworked vote system, cooldowns, reminders, restrictions, late-time voting |
| Stats | Full player statistics viewable in-game (`z_dtStats.cs`) |
| Integration | **Discord bot connectivity** (`zzDiscordBot.cs`) |
| Gametypes | Deathmatch, LCTF, LakRabbit improvements, Siege support |
| Moderation | Improved bans, persistent gagging, AFK timeouts, observer kicking |
| Fixes | Flag throw and collision, item-toss duplication, anti-spew lag protection, crash fixes |
| Consistency | Unified water viscosity (global preset 3) |

The gameplay changes over stock Classic are deliberately few, and the README shows most of them
struck through — reverted after testing **[mod-script]**. What survives:

- Blaster buffed against heavy armour (non-tournament only)
- Max FOV 120 → 138, for widescreen
- Configurable item respawn time
- Unified water viscosity

Everything else — shield nerfs, cloak sound range, sensor jammer buffs, mortar reload rework, spawn
fade-in — was tried and rolled back. **A modern Classic server is conservative about the ruleset and
aggressive about everything else**: administration, anti-grief, statistics, integration. The 2004 balance
is treated as settled.

The FOV change is the one that gives away the era. Classic was tuned on 4:3 CRTs; a 138° cap exists
because players are on ultrawide monitors now.

## Installing it

From the README **[mod-script]**:

**Prerequisite:** Classic 1.5.2 — `https://tribes2stats.com/files/mods/`

1. Delete the old `Classic` folder. (The README notes `tribes2gsi.exe` ships with 1.0.0 — old installs
   carry cruft.)
2. Extract Classic 1.5.2 into `GameData`.
3. Copy this repository's `Classic` folder over it, overwriting.
4. Run once to generate `serverPrefs.cs`.
5. Edit `Classic/prefs/serverPrefs.cs`.
6. Launch with `Classic_dedicated_server.bat`.

Step 3 is the overlay from section 28 — order matters, and reversing steps 2 and 3 silently reverts
TacoServer to 1.5.2.

Step 1 matters more than it looks. Because TacoServer ships only 55 of Classic's scripts, a *partial*
old install underneath contributes whatever files it has. Deleting the directory outright is the only way
to know what you are running.

### The `.dso` problem, still

`Classic_dedicated_server.bat` comes from Classic 1.5.2 and deletes `.dso` files from the directories
1.5.2 knew about (section 22). TacoServer adds no new script directories — everything lives in
`scripts/` and `scripts/autoexec/`, both covered — so the shipped cleanup is adequate here. That is a
happy accident of the flat autoexec design rather than a fix, and it is worth confirming if you add
directories of your own.

## Development model

| | |
|---|---|
| Branches | `Stable` (default) and `Dev` |
| Flow | Work on `Dev`, merge to `Stable` |
| Activity | Commits through June 2026 |

If you are running a server, track `Stable`. If you are contributing or forking for a tournament, `Dev` is
where work lands first.

Because it is a git repository rather than a zip, TacoServer is the first Classic-family codebase you can
meaningfully fork, diff and send changes back to. Everything before it was distributed as archives, which
is precisely why the lineage in section 28 had to be reconstructed by fingerprinting rather than read
from history.

## Related

- [28 · TacoServer](../28-tacoserver/README.md) — lineage and architecture
- [30 · Running Classic today](../30-running-classic-today/README.md) — choosing between these codebases
- [24 · The ruleset toggles](../24-classic-ruleset-toggles/README.md) — the `ClassicLoad*` prefs it inherits
- [Hosting and testing](../06-shipping/hosting-and-testing.md) — dedicated server operation
- [Debugging](../06-shipping/debugging.md) — reading logs and the console
