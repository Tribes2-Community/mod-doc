# 32 · BONES

A balance-preserving tweak mod for base Tribes 2, by **NecroBones (Ed T. Toton III)** — the same person
already covered at length in [17 · Getting started](../17-bones-getting-started/README.md) for the
Tribes 2 Mapping Tutorial. That tutorial is community documentation; this is his own combat mod, a
separate project, sharing only the author.

| | |
|---|---|
| Version | 1.03 **[mod-script]** |
| Author | NecroBones / Ed T. Toton III |
| Ships as | `bonesmod.vl2`, installed to `GameData/BONES/` |
| Variant | `bonesref.vl2` — referee system only, everything else untouched |
| Lineage | **Base** — 91/91 `CTFGame.cs` functions match base exactly; 63/74 match Classic |
| Scope | 97 files: full script set, six original missions, custom packs, two original gametypes |

## Philosophy, stated plainly

The readme opens with an explicit design position, contrasting itself with mods that add content for its
own sake **[mod-script]**:

> "I'm not a mod junkie, and in fact I really dislike many mods. It seems that a lot of mods are made by
> people who just want to make as many cool toys as a possible and show no regard towards preserving the
> game balance or the original intent of the game designers."

The stated model is *Insomniax*, a similarly restrained Tribes 1 mod — "BONES mod as 'Insomniax light' for
Tribes 2." The readme is candid about the list of changes looking large despite that: "I know the change
list below looks enormous, but it's not a total conversion, just a tweak."

The changes group into four stated categories **[mod-script]**:

- **Bug fixes** — vehicles no longer leave a ghost after destruction; the MPB's barrel can be changed post-deploy.
- **Extended concepts** — an optional deployable base turret per team; more turret barrel customisation options.
- **Closed holes** — higher deployable-turret limits so multiple bases can be defended at once; a railgun
  giving heavy armour a real anti-sniper answer.
- **Admin tools** — a referee mode with its own equipment, plus Kill/Smack/Warn buttons as graduated
  punishments short of a kick.

## Confirmed base lineage

`scripts/ctfgame.cs` ships all 91 of base `CTFGame.cs`'s functions unchanged in name, plus its own
additions — full overlap. Against Classic's `CTFGame.cs`, only 63 of 74 functions match. BONES is built on
retail base, not on Classic, and the readme's own requirements line confirms the target: "Tribes 2,
running CTF (Specifically 2-Team gametypes ONLY... but should work with Siege and CNH)" — no mention of
Classic at all.

## The referee back door — disclosed, not hidden

The readme's most unusual section is a voluntary disclosure most mods of this era never made **[mod-script]**:

> "This mod contains a 'back door' that will allow me (NecroBones) to become a referee on any server
> running this mod... Because T2 has an authentication system, this will not allow anyone other than me
> to become a referee without being an admin on the server. This will NOT give me any admin priveledges
> on your server."

He goes on to place the access precisely — "somewhere between the two referee versions... the SA version
of the referee armor, but without the ability to take flags or claim switches, or turn others into
referees" — and asks server operators to leave it in place so he can use it for testing, while
acknowledging he has no way to stop anyone from removing it. Whatever one makes of shipping a hardcoded
personal-access hook at all, documenting it this explicitly — mechanism, scope, and justification, in the
same readme every player reads — is the opposite of how most backdoors in this era's mod corpus behaved.

## Two original gametypes

Beyond CTF/Siege/CnH tuning, BONES ships two vehicle-only gametypes not derived from any base or Classic
file **[mod-script]**:

**Aerial Dogfight** — `scripts/dogfightgame.cs`:
```
Shoot down as many enemy aircraft as possible.
10 points per vehicle shot down, 20 for a gunship.
Double points for shooting down a flagbearer.
Flagbearers earn double points for shooting others down.
```

**Artillery Combat** — `scripts/artillerygame.cs`, the same design applied to tanks instead of aircraft.

Both share a "flagbearer" mechanic — carrying the flag doubles points both earned and denied — layered
onto a vehicle-only elimination format neither base nor Classic ships. Six original missions accompany
them (`Archipelago-DF.mis`, `DeathBirdsFly-DF.mis`, `DiscoInferno.mis`, `LongReach.mis`,
`TheValleyofDeath.mis`, `arcticdogfight.mis`).

## New packs

`scripts/packs/` adds eight packs with no base or Classic equivalent: `ammopack`, `camopack`,
`chainbarrelpack`, `flakbarrelpack`, `ionbarrelpack`, `suicidepack`, `torpedobarrelpack`, `treepack` —
consistent with the "more turret customising" and "closed holes" categories from the readme, and with the
Dogfight/Artillery gametypes' need for anti-vehicle ordnance (flak, ion, torpedo barrels).

## BONESREF: the referee system alone

`bonesref.vl2` installs to `GameData/BonesRef/` and reuses every word of the same readme, with one line
doing the disambiguating work: "BONESREF is -just- the referee system, and leaves everything else
unchanged." The readme warns it "will generate a lot of console errors" from scripts reaching for objects
the full BONES mod would have loaded — a known, accepted rough edge in the stripped-down variant, not a
defect to chase.

## A later community patch: Kry's BONES mod 1.03k1

A separate, smaller archive — `Kry 1.03k1 BONES mod.zip`, 92 KB — documents itself as "based on BONES
1.03, version 1 of Kry's mod," installed by unzipping BONES normally and then unzipping Kry's files over
it **[community]**. Its own readme lists a different set of tuning choices: default spawn reduced to
light armour with a targeting laser only, a physics change the readme itself describes as making "the
game now feels super-floaty," revised vehicle purchase limits, and vehicles that kill their pilot
instantly on destruction rather than leaving a survivable wreck. It ships its own `defaultgame.cs`,
`player.cs`, and a `vehicles/` tree (`VEHICLE.CS`, `vehicle_support.cs`, `servervehiclehud.cs`) — a real
patch layer, not a cosmetic add-on, from a second author extending the first's design rather than
replacing it.

## Related

- [17 · Getting started](../17-bones-getting-started/README.md) — NecroBones' mapping tutorial, a separate project by the same author
- [31 · The base ruleset](../31-base-ruleset/README.md) — the CTF/Siege/CnH baseline BONES tunes
- [22 · Capture the Flag](../22-capture-the-flag/README.md) — the file BONES's lineage was fingerprinted against
