# 43 · Revmod2

A Classic-lineage gametype layer carrying an almost entirely rewritten class system, by a modder using
the handle **Lexor** (`www.lexor.tk`), active 2002–2004.

| | |
|---|---|
| Author | Lexor **[mod-script]** |
| Lineage | **Classic** — `CTFGame.cs` carries Classic-only `MPBTSTATION`/Tesla scoring, absent from base entirely |
| Distribution | Two near-identical copies in this workspace — see below |
| Distinctive feature | Eight custom player classes replacing the stock armour system |

Two folders, `Revmod 2` and `revmod2`, differ by exactly one file: `Revmod 2` additionally bundles a
`revmod2_server.zip` the other copy lacks. Every `.cs` and `.cs.dso` file is otherwise byte-identical
between them — one release, packaged twice.

## The gametype layer is Classic's, confirmed by a scoring system base doesn't have

`scripts/CTFGame.cs` declares `SCORE_PER_DESTROY_DEP_SENSOR`, `SCORE_PER_REPAIR_MPBTSTATION`,
`SCORE_PER_DESTROY_TESLA`, and `SCORE_PER_DESTROY_SENTRY` **[mod-script]** — the exact scoring-variable
family Classic introduced for its MPB Teleporter station and Tesla coil objects. Vanilla base's
`CTFGame.cs` has **zero** occurrences of `MPBTSTATION` scoring anywhere. A comment even preserves the
attribution it inherited **[mod-script]**:

```php
// z0dd - ZOD, 4/24/02. MPB Teleporter
```

matching Classic 1.1's own `CTFGame.cs` almost verbatim, with only a changed point value. Revmod2's
gametype scoring is Classic's, carried forward with light edits — its own revision comments date active
work to 2002–2004 (`"was 25 but people cplained Lexor 1-26-2004"`, `"RevMod2 Lexor 09-02-2004"`).

## The player layer is not Classic's at all

Where the gametype scoring is a light Classic edit, the player/class system is close to a ground-up
rewrite. `scripts/classes/` replaces the stock three-armour model with eight named classes — `brawler`,
`gearhead`, `golem`, `juggie`, `lite`, `marksman`, `medic`, `spy` — each with an `_fow` variant. Token
analysis of the compiled `player.cs.dso` and `deployables.cs.dso` returns poor matches against both base
and Classic (0–4%), which is exactly what a genuine rewrite looks like rather than an edit of either.

A `TR2Game.cs` stub is present too, but disabled at the source: its `DisplayName` comment reads `"TR2 is
disabled"` — likely inherited tooling from the same shared item-naming library that turns up inside
NinjaMod's file family, rather than evidence of any working Team Rabbit 2 integration here.

## Related

- [22 · Capture the Flag](../22-capture-the-flag/README.md) — the MPB Teleporter and Tesla scoring this mod inherited from Classic
- [30 · Team Rabbit 2](../30-team-rabbit-2/README.md) — the disabled `TR2Game.cs` stub's likely origin
- [52 · botpilot & Werewolf](../52-botpilot/README.md) — a separate mod crediting Lexor for absorbed contributions
