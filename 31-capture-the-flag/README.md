# 31 · Capture the Flag

The flagship gametype, at 2014 lines the largest multiplayer gametype in `base/scripts.vl2`
**[script]**, and one of only two gametypes Classic ships its own copy of.

## The base rules

Sierra's own summary, quoted from `scripts/CTFGame.cs`'s header comment **[script]**:

```
Prevent enemy from capturing your flag
Score one point for grabbing the enemy's flag
To capture, your flag must be at its stand
Score 100 points each time enemy flag is captured
```

The 100-point capture value is a named constant, not a literal scattered through the file **[script]**:

```php
%game.SCORE_PER_TEAM_FLAG_CAP = 100;
```

used both to award the score and to derive the mission's default score limit:

```php
%scoreLimit = 5 * %game.SCORE_PER_TEAM_FLAG_CAP;
```

Five captures to win, by default — a mission's own `MissionGroup.CTF_scoreLimit` field overrides the
multiplier when set **[script]**. That field is a general convention, not CTF-specific: Team Rabbit 2's
own missions carry a `CTF_scoreLimit` field too (section 39), reused for an unrelated gametype's win
condition rather than invented fresh.

The base flag object also owns the "must be at its stand" rule, and the surrounding building datablocks
— generator, sensors, solar panels, turrets, vehicle stations — each have their own destroy and repair
scoring functions: `awardScoreGenDestroy`, `awardScoreSensorRepair`, `awardScoreTurretDestroy`, and
roughly twenty more of the same shape **[script]**. Base CTF scores essentially everything that happens
to a base, not only the flag.

## What Classic changed

Classic ships its own `CTFGame.cs` — 1947 lines against base's 2014 — and the difference is not a
rewrite, it is refactor plus feature addition, and the two are separable by function name.

**Removed by consolidation.** Roughly twenty-five separately-named per-object scoring functions —
`awardScoreDepInvRepair`, `awardScoreDepSensorDestroy`, `awardScoreDepStationDestroy`,
`awardScoreGenDestroy`, `awardScoreGenRepair`, `awardScoreSensorRepair`, `awardScoreSentryRepair`,
`awardScoreSolarRepair`, `awardScoreStationRepair`, `awardScoreVStationRepair` and their siblings —
collapse into one generic `CTFGame::awardScoreStaticShapeDestroy` **[mod-script]**. Where base has a
bespoke function per building type, Classic has one function keyed on the object. This is the change
Classic's own 1.4 changelog refers to as "Optimized code in various files" (section 23) — visible here as
an actual architectural simplification, not just tuning.

**Added.** Five functions that do not exist in base at all **[mod-script]**:

| Function | What it is |
|---|---|
| `CTFGame::antiTurtle`, `sendAntiTurtleTimeList`, `voteAntiTurtleTime` | The anti-turtling feature — flags auto-return after `$Host::ClassicAntiTurtleTime` minutes, disabled in tournament mode. See [23 · Classic 1.5.2](../23-classic-152/README.md) |
| `CTFGame::evalVote`, `sendGameVoteMenu` | Extended in-game voting |
| `CTFGame::startFlagCollisionSearch`, `updateFlagTransform` | The flag-passing-through-objects fix |
| `Flag::onLeaveLiquid` | Water-surface interaction |

### The credited fix

`updateFlagTransform` carries its author inline **[mod-script]**:

```php
//----------------------------------------------------------------------------------------
// z0dd - ZOD, 8/4/02: KineticPoet's flag updater code
function CTFGame::updateFlagTransform(%game, %flag)
{
   %flag.setTransform(%flag.getTransform());
   %game.updateFlagThread[%flag] = %game.schedule(100, "updateFlagTransform", %flag);
}
//----------------------------------------------------------------------------------------

function CTFGame::playerDroppedFlag(%game, %player)
{
   ...
   %game.updateFlagTransform(%flag); // z0dd - ZOD, 8/4/02, Call to KineticPoet's flag updater
```

Classic's own readme credits the same person by name, in the flag-changes section (section 22): *"Added
code to give players a more accurate representation of where a dropped flagged is... Thanks for this goes
to KineticPoet and the Team Rabbit 2 team for a single flag solution"* **[mod-script]**. KineticPoet is
credited in `TR2Game.cs`'s own header as Team Rabbit 2's "Designer, Lead Programmer, Maps" (section 39) —
so this is a fix that travelled from one gametype's development team into another's shipped code, and
both sides of the credit are independently verifiable in the code itself. It is the same kind of
cross-project thread as z0dd's Defend and Destroy, running the other direction.

The mechanism: re-asserting the flag's transform on a 100ms schedule keeps its physics representation
synchronised with its visual position while it lies on the ground, which is what stops players skiing
through a dropped flag without registering a pickup.

## Spawn CTF: a second CTF, with no economy

Classic 1.4 adds `SCtFGame.cs` — 1985 lines, not a modification of `CTFGame.cs` but a sibling gametype
with its own package, `SCtFGame`. Its rules block is identical to CTF's **[mod-script]** — same objective,
same scoring — so the difference is entirely in what happens at spawn.

Every base and Classic gametype equips players through inventory stations: walk up, buy a loadout, walk
back into the fight. Spawn CTF removes the shopping trip. Its `equip` function sets every player straight
to a server-wide armour class and buys their favourites automatically **[mod-script]**:

```php
function SCtFGame::equip(%game, %player)
{
   for(%i = 0; %i < $InventoryHudCount; %i++)
      %player.client.setInventoryHudItem($InventoryHudData[%i, itemDataName], 0, 1);

   %player.client.clearBackpackIcon();
   if(!%player.client.isAIControlled())
   {
      %player.setArmor($Sctf::Armor);
      buyDeployableFavorites(%player.client);
      %player.setEnergyLevel(%player.getDataBlock().maxEnergy);
      %player.selectWeaponSlot( 0 );
   }
   ...
```

`$Sctf::Armor` is set by a vote, admin-forceable **[mod-script]**:

```php
function SCtFGame::VoteArmorClass(%game, %admin, %newLimit)
{
   if ( %admin )
   {
      messageAll('MsgAdminForce', '\c3%1\c2 set the armor class to %2.~wfx/misc/diagnostic_on.wav', $AdminCl.name, %newLimit);
      $Sctf::Armor = %newLimit;
      ...
```

So a Spawn CTF server runs a single, chosen armour class for everyone — typically medium, sometimes
light — and every player is fully equipped the instant they spawn. This is the shape of pub-friendly
"pickup and play" CTF that dominates open servers today: no inventory economy, no time lost shopping, no
armour-class asymmetry to reason about. It is the direct ancestor of the loadout conventions TacoServer's
own gametypes (`LCTFGame.cs`, section 28) assume as normal.

## Under the community patches

Neither patch touches CTF scoring or mechanics. TribesNEXT's and RC2a's changes are authentication,
presentation and platform layers (section 07); a CTF or Spawn CTF match plays identically once connected.

## Related

- [08 · The base ruleset](../08-base-ruleset/README.md) — `defaultGame.cs` and the package convention CTF follows
- [23 · Classic 1.5.2](../23-classic-152/README.md) — the anti-turtling feature this page's code implements
- [39 · Team Rabbit 2](../39-team-rabbit-2/README.md) — KineticPoet's other credited contribution
- [Gametypes](../05-gameplay-systems/gametypes.md) — `MissionTypes`, package activation
- [28 · TacoServer](../28-tacoserver/README.md) — `LCTFGame.cs`, a modern descendant
