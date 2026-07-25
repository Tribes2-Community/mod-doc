# 67 · Atomic Construction

The one fork in this handbook's Construction family that branches from **0.68a**, not 0.69a or 0.70a —
maintained by **JackTL**, from a lineage the credits trace back to "v50a."

| | |
|---|---|
| Version string | `$ModVersion = "v1.11 Atomic Edition"; $ModCredits = "Atomic Modding Staff";` **[mod-script]** |
| Lineage | Closest to **0.68a** (35.8% byte-identical) — every other fork in this handbook is closest to 0.69a or 0.70a |
| Against the table's fixed 0.69a baseline | 24/95 `.cs` (25.3%) identical, 69 changed, 2 new, 17 removed |
| Latest changelog entry | "0.67 Alpha" |

## The readme you've already read

Atomic Construction's `readme.txt` opens with the identical "BASIC IDEA" passage quoted in
[58 · The Construction Mod](../58-construction-mod/README.md) — "We just like to build stuff... mods like
ninja mod and warped where used to create the wierdest of structures" — carried forward verbatim rather
than rewritten. That inheritance is the readme's own admission of lineage as much as any fingerprint: this
text travelled from the original mod into a derivative without a single word changed.

## Credits

`Credits.txt` **[mod-script]**:

> "**JackTL** — For: Maintaining mod from v50a. **Construct** — For: providing main idea... **Lucid** — For:
> Helping me with the code, providing me with a great decontruct gun... **DynaBlade** — For: His Awesome
> function librarys."

DynaBlade's function library credit matters beyond this one fork: [64 · CCM](../64-ccm/README.md)
independently credits a `saveBuilding.cs` file to "a joint effort of DynaBlade and JackTL" — the same two
names, in a completely different Construction-family fork. JackTL's own maintenance trail runs through at
least three forks documented in this handbook: Atomic Construction,
[62 · Spirit Construction](../62-spirit-construction/README.md) (Construction Tool registration), and —
most strikingly — [Classic Construction](#classic-construction-a-footnote-not-a-fork), which turns out not
to be a fork of anything at all.

## What actually changed

The version history's most recent entry, "0.67 Alpha," documents build-currency and turret work rather
than the deep architectural changes seen in forks like QuantiumX or MooCon's later versions
**[mod-script]**:

- "Construction Mod updated to Tribes 2 v0.25034.0.0"
- Added a Missile Rack Turret pack, requiring power, with "dumbfire" and "seeking" fire modes (seeking
  drains more energy)
- Added "only transmit" and "only receive" modes to the Telepad
- Force-field damage handling fixed for team-damage-off servers
- The Construction Tool now reports an object's owner when reading its power state

Two new files, `firework.cs` and `GameGui.cs`, are purely cosmetic and interface additions — consistent
with 59 of 95 shared-named files carrying small header and branding edits rather than the wholesale
rewrites seen further down this handbook's fork-deviation spectrum. No scoring or gametype file is among
the changes: Atomic Construction, like Spirit Construction, stays peaceful.

## Classic Construction: a footnote, not a fork

A second JackTL-credited folder in this workspace, "Classic Construction," shares Atomic's exact readme
and credits files — but fingerprinting shows it is **100% byte-identical to Construction 0.70a**, with
zero changed, new, or removed files. Its `Version-history.txt` is content-identical to 0.70a's own. The
"Classic" in the name has nothing to do with the Classic mod (no `$Classic::` reference exists anywhere in
its scripts) and nothing to do with a real fork — it is an unmodified re-release of 0.70a under a
different label, not separate content this handbook documents on its own page.

## Related

- [58 · The Construction Mod](../58-construction-mod/README.md) — the readme text this fork carries forward unchanged
- [64 · CCM](../64-ccm/README.md) — DynaBlade and JackTL's other credited joint work
- [62 · Spirit Construction](../62-spirit-construction/README.md) — a lighter-touch peaceful fork, also touching Construction Tool registration
