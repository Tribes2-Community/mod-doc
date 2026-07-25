# 34 · Bounty

An assigned-target elimination gametype, untouched by Classic — no Classic-side file exists for it, so it
runs exactly as `base/scripts.vl2` ships it under any mod, patched or not.

## The rules

`scripts/BountyGame.cs`'s header, plus the developer's own clarifying note immediately beneath it
**[script]**:

```
Eliminate Targets in order assigned; eliminate Pursuer(s) without penalty
Killing a Bystander who was a former Target returns him to your Target pool
Killing 3 or more Targets in a row without dying earns a bonus
Killing all Targets first earns a bonus
Red = Target, Green = Bystander
```

```
Spec Note:
  All opponents have green triangles.
  Once you select your target, that player's triangle appears red (for you).
  If someone who has you as a target (a Pursuer) damages you, his triangle disappears altogether (for you).
  Once your target is eliminated, he respawns with a green triangle.
  If your Pursuer kills you, he has a green triangle again when you respawn (unless he becomes your target).
```

The colour coding is **per-player, not global** — your target's triangle is red only on your own screen.
Everyone in the match is simultaneously someone else's target, someone else's pursuer, and a bystander to
everyone not currently hunting or being hunted by them. There is no shared "wanted" state to observe;
each client renders its own view of who matters to it.

## Scoring

Set once, near the top of the file, in the same named-constant style as Defend and Destroy **[script]**:

```php
%game.SCORE_PER_TARGETKILL = 1;
%game.SCORE_PER_BYSTANDERKILL = -1;
%game.SCORE_PER_SUICIDE = -1;
%game.SCORE_PER_DEATH = 0;
%game.SCORE_PER_COMPLETION_BONUS = 5;
%game.SIZE_STREAK_TO_AWARD = 3;  //award bonus for a winning streak this big or better
%game.WARN_AT_NUM_OBJREM = 2;    //display warning when player has only this many or less objectives left
%game.MAX_CHEATDEATHS_ALLOWED = 1;
```

Killing your assigned target scores; killing anyone else — a bystander to you — costs a point. Three or
more target kills in a row without dying triggers a streak bonus, and clearing every assigned target
first earns a flat `+5`. Deaths are free; only suicide is penalised.

**`MAX_CHEATDEATHS_ALLOWED = 1`** is a small anti-abuse detail worth noting on its own: the comment
identifies `CTRL+K` and leaving the mission area as the "cheat death" methods it is capping, meaning
Bounty specifically defends against a player ducking a pursuer by suiciding repeatedly rather than fighting.
Exceed the limit and the player is "labeled a cheater" — the file does not implement a punishment beyond
that label, leaving enforcement to an admin watching for it.

## No static defence

Bounty bans an entire category of items outright, at the top of the file **[script]**:

```php
$InvBanList[Bounty, "TurretOutdoorDeployable"] = 1;
$InvBanList[Bounty, "TurretIndoorDeployable"] = 1;
$InvBanList[Bounty, "ElfBarrelPack"] = 1;
$InvBanList[Bounty, "MortarBarrelPack"] = 1;
$InvBanList[Bounty, "PlasmaBarrelPack"] = 1;
$InvBanList[Bounty, "AABarrelPack"] = 1;
$InvBanList[Bounty, "MissileBarrelPack"] = 1;
$InvBanList[Bounty, "Mine"] = 1;
```

Every deployable turret and barrel pack, plus mines. Bounty is built around player-versus-player hunting,
and static defence would let a target camp behind emplacements rather than being found — banning the
category is a cleaner fix than trying to balance around it. `$InvBanList` is a general mechanism, keyed by
gametype name; any gametype can populate it. See
[Turrets and deployables](../03-content-recipes/turrets-and-deployables.md).

## Related

- [32 · Defend and Destroy](../32-defend-and-destroy/README.md) — the same named-constant scoring convention
- [39 · Team Rabbit 2](../39-team-rabbit-2/README.md) — another gametype with per-player, non-global state (roles, not colours)
- [Turrets and deployables](../03-content-recipes/turrets-and-deployables.md) — `$InvBanList` and gametype-scoped bans
- [Gametypes](../05-gameplay-systems/gametypes.md) — `MissionTypes`, package activation
