# 38 · Rabbit

The ancestor gametype behind sections 37 and 39's flag-passing modes, at 739 lines — untouched by
Classic. Where Hunters and Team Hunters score by returning flags, and Team Rabbit 2 scores by throwing
them, base Rabbit is older and simpler than both: one flag, one carrier, hunted by everyone.

## The rules

`scripts/RabbitGame.cs`'s header comment names it plainly **[script]**:

```
// Team Rabbit script
```

```
Grab the flag
Run like crazy
EVERYONE tries to kill the person with the flag (the Rabbit)
The longer the Rabbit keeps the flag, the more points he scores
```

Despite the header comment's name, this is **not** a team-passing game. There is no throw mechanic in
scope here, no bonus matrix, no roles. One player carries the flag; every other player, regardless of
side, is hunting them. Points accrue to the carrier for time held, not for anything done with it.

## A team system built for one purpose

The gametype declares only one real team, but tracks two pseudo-team IDs purely to distinguish the
carrier from everyone else **[script]**:

```php
function RabbitGame::setUpTeams(%game)
{
   %game.numTeams = 1;
   ...
   $teamDamage = 0;
}

$RabbitTeam = 2;
$NonRabbitTeam = 1;
```

`numTeams = 1` and `teamDamage = 0` — friendly fire is off among the hunters, because mechanically they
are all on the same side. `$RabbitTeam` and `$NonRabbitTeam` exist only so the engine's existing
team-membership machinery (target triangles, team-scoped messaging) can be reused to mark whoever is
currently carrying the flag, without writing a parallel targeting system from scratch. Becoming the Rabbit
means switching pseudo-teams, not joining a side.

Scoring ticks on a fixed interval **[script]**:

```php
%game.teamBonusValue = 1;
%game.teamBonusTime = 15 * 1000; //15 seconds
```

One point every fifteen seconds the flag is held — a slow, steady accrual that rewards survival over
burst plays, in contrast to both of its descendants.

## Where the family goes from here

A TribalWar community strategy guide to Team Rabbit 2 (Yogi, covered in full in section 39) sketches a
short lineage: it credits this "Rabbit game type" to Dynamix developer Eric "RatedZ" Lanz, describes an
intermediate mod called "Team Rabbit" that put a passing-based "twist" on it, and presents Team Rabbit 2
as Codality's fuller evolution of that twist **[community]**.

That account is community history, not a claim this handbook can verify against source code —
`RabbitGame.cs` carries no attribution comment of its own, and the intermediate "Team Rabbit" mod is not
part of this install. What the code *does* independently confirm is the mechanical shape the account
implies: a solo-carrier keep-away game (this file) that a later, unrelated team-based mod
("Team Rabbit," the "new twist," not shipped with 25034 and not covered here) turned into the
flag-*passing* game that Team Rabbit 2 then took to its fullest extent — the jackpot, the roles, the
ten-dimensional bonus matrix covered next.

## Related

- [37 · Hunters & Team Hunters](../37-hunters/README.md) — the other flag-scoring family, return-based rather than hold-based
- [39 · Team Rabbit 2](../39-team-rabbit-2/README.md) — the full evolution: passing, roles, and a scored bonus matrix
- [Gametypes](../05-gameplay-systems/gametypes.md) — `MissionTypes`, package activation
