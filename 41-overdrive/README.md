# 41 · Overdrive

The lightest touch in the Classic derivatives — one new ability, layered on an unmodified Classic 1.5.2
install, by a modder using the handle **Defender**.

| | |
|---|---|
| Author | Defender (`jackhemphill66@aol.com`) **[community]** |
| Lineage | **Classic 1.5.2** — 37/112 `.cs` (33.0%) byte-identical; 5/112 (4.5%) to Classic 1.1; 1/112 to base |
| Ships as | `Classic-T2O/`, following Classic's own install instructions |
| Site | `www.tribalcombat.com/tribes2-ultimate/` |

## Confirmed Classic 1.5.2 lineage

The mod's own `Info.txt` states its foundation plainly **[community]**:

> "Here is my latest test mod for tribes2-ultimate, its built on the classic mod. Its a faster mod, and
> has new cool weapon effects, new weapons, and more."

Fingerprinting confirms it precisely: of 112 `.cs` files, 37 (33.0%) are byte-identical to Classic 1.5.2,
against 4.5% to Classic 1.1 and under 1% to base. The distribution archive even carries Classic's own
unmodified `classic_readme.txt` and `classic_technical.txt` — version 1.5.2, verbatim — bundled alongside
the mod's own files. The nested folder is literally named `Classic-T2O/`.

## The one new mechanic

`scripts/playerOverdrive.cs` is the only substantial addition. It defines an energy-gated special ability
**[mod-script]**:

```php
function ActivateOverdrive(%player)
{
   if (%player.getEnergyLevel() < 40)
      return;
   ...
}
```

Activating costs a flat energy threshold and triggers a small `RadiusExplosion` tagged with a dedicated
`$DamageType::Overdrive`, plus its own sound and particle datablocks (`OverDriveSoundEffect`,
`OverDriveSound`). It reads as an energy-burst mobility or area-denial tool bolted onto the existing
armour classes, rather than a new class of its own.

Beyond that one mechanic, the mod adds new weapon and effect content without touching the underlying
ruleset: `weapons/heavyGatlingLaser.cs`, `weapons/particleRifle.cs`, `weapons/sniperRifleHD.cs`,
`shoulderWeapons/ShoulderPlasmaPack.cs`, and matching muzzle/impact particle effects.

## Related

- [39 · Classic 1.5.2](../39-classic-152/README.md) — the exact, unmodified base this mod carries forward
- [40 · The ruleset toggles](../40-classic-ruleset-toggles/README.md) — the toggle pattern this ability could have used instead of a flat addition
- [44 · Meltdown 2](../44-meltdown/README.md) — the heaviest Classic derivative, for contrast
