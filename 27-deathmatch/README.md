# 27 · Deathmatch

At 374 lines, the smallest gametype in `base/scripts.vl2` — a fifth the size of `SinglePlayerGame.cs`, a
tenth the size of `defaultGame.cs`. Untouched by Classic. Nearly everything about a Tribes 2 match — the
armours, the vehicles, the packs, the mission itself — is generic across gametypes; Deathmatch is close to
the minimum code needed to turn all of that into a scored contest.

## The rules

`scripts/DMGame.cs`'s header, in full **[script]**:

```
There aren't many rules...
Kill
Don't get killed
Points are scored for each kill you make and subtracted each time you die
```

The scoring, correspondingly minimal **[script]**:

```php
%game.SCORE_PER_KILL = 1;
%game.SCORE_PER_DEATH = -1;
%game.SCORE_PER_SUICIDE = -1;
```

## Score is efficiency, not a running tally

The one design choice worth noting: a client's displayed `score` is not simply `kills − deaths`. It is
computed from an `efficiency` value **[script]**:

```php
%killValue = %client.kills * %game.SCORE_PER_KILL;
%deathValue = %client.deaths * %game.SCORE_PER_DEATH;
%suicideValue = %client.suicides * %game.SCORE_PER_SUICIDE;
...
%client.score = mFloatLength(%client.efficiency, 1);
```

`mFloatLength(value, 1)` rounds to one decimal place, and the value being rounded is an efficiency ratio
rather than a raw point sum. The practical effect: Deathmatch's scoreboard reads as a rate, not a count —
closer to a K/D-style leaderboard than to CTF's or Defend and Destroy's additive scoring. Two players with
very different kill counts can show similar scores if their ratios match, which is a different competitive
signal than "who has the most points."

## A modern descendant, verified

TacoServer (section 48) ships its own `DMGame.cs` — 970 lines against base's 374, roughly two and a half
times the size **[mod-script]**. It keeps the same three base constants (`SCORE_PER_KILL = 1`,
`SCORE_PER_DEATH = -1`, `SCORE_PER_SUICIDE = -1`) and the `efficiency`-based score, then adds a fixed win
condition ("First to 25 points wins," stated in its own rules header) and two bonus categories not present
in base:

```php
%game.SCORE_PER_MIDAIR = 0.25;         //Added Chocotaco. From sctf
%game.SCORE_PER_BONUS = 1;             //taking out a kill streak
%game.SCORE_PER_KILLSTREAKBONUS = 0.5; //bonus for those who get a kill while waypointed
```

The `// From sctf` comment is a direct, self-documented borrowing — a mid-air kill bonus lifted from
Classic's Spawn CTF (section 22) into a Deathmatch context nearly twenty years later. It is a small
instance of the same pattern that runs through this whole handbook: a scoring idea that proves out in one
gametype gets carried into another by whoever is maintaining the next codebase.

## Related

- [31 · The base ruleset](../31-base-ruleset/README.md) — the constants and conventions every gametype extends
- [22 · Capture the Flag](../22-capture-the-flag/README.md) — Spawn CTF, the origin of TacoServer's midair bonus
- [48 · TacoServer](../48-tacoserver/README.md) — the modern codebase this page's descendant lives in
- [Gametypes](../05-gameplay-systems/gametypes.md) — `MissionTypes`, package activation
