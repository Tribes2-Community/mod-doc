# Ammo and inventory

A weapon nobody can obtain is not a weapon. This page covers the inventory system: how counts are stored,
where limits come from, and every place you must register a new item for it to be reachable in play.

## The data model

`scripts/inventory.cs` documents it in its header comment **[script]**:

```
// Item Datablocks
//    image = Name of mounted image datablock
//    onUse(%this,%object)

// Item Image Datablocks
//    item = Name of item inventory datablock

// ShapeBase Datablocks
//    max[Item] = Maximum amount that can be caried

// ShapeBase Objects
//    inv[Item] = Count of item in inventory
```

So:

| Where | What | Example |
|---|---|---|
| On the **armor datablock** (`PlayerData`) | `max[<ItemName>]` — the carry limit | `max[DiscAmmo] = 15;` |
| On the **player object** | `inv[<ItemName>]` — the current count | Read via `getInventory()` |
| On the **ItemData** | `image` — what mounts when used | `image = DiscImage;` |
| On the **ShapeBaseImageData** | `item` — the reverse link | `item = Disc;` |

## The inventory API

| Call | Effect |
|---|---|
| `%obj.getInventory(%data)` | Current count |
| `%obj.setInventory(%data, %count)` | Set count outright |
| `%obj.incInventory(%data, %n)` | Add |
| `%obj.decInventory(%data, %n)` | Remove |
| `%obj.clearInventory()` | Empty everything |
| `%obj.maxInventory(%data)` | Effective limit for this object |
| `%obj.use(%data)` | Use the item — mounts a weapon, activates a pack |
| `%obj.throw(%data)` | Drop it |

Every one of these fires the `<className>::onInventory` callback, which is where the HUD gets updated
**[script]**:

```php
function Ammo::onInventory(%this,%obj,%amount)
{
   // Loop through and make sure the images using this ammo have
   // their ammo states set.
   for (%i = 0; %i < 8; %i++) {
      %image = %obj.getMountedImage(%i);
      if (%image > 0)
      {
         if (isObject(%image.ammo) && %image.ammo.getId() == %this.getId())
            %obj.setImageAmmo(%i,%amount != 0);
      }
   }
   ItemData::onInventory(%this,%obj,%amount);
   // Uh, don't update the hud ammo counters if this is a corpse...that's bad.
   if ( %obj.getClassname() $= "Player" && %obj.getState() !$= "Dead" )
   {
      %obj.client.setWeaponsHudAmmo(%this.getName(), %amount);
      if(%obj.getMountedImage($WeaponSlot).ammo $= %this.getName())
         %obj.client.setAmmoHudCount(%amount);
   }
}
```

`setImageAmmo(%slot, bool)` is what drives the image state machine's `stateTransitionOnAmmo` /
`stateTransitionOnNoAmmo`. It happens automatically as long as your image declares `ammo = <YourAmmoData>`.

## Carry limits

Limits live on the armor. From `LightMaleHumanArmor` **[script]**:

```php
   max[RepairKit]           = 1;
   max[Mine]                = 3;
   max[Grenade]             = 5;
   max[Blaster]             = 1;
   max[Plasma]              = 1;
   max[PlasmaAmmo]          = 20;
   max[Disc]                = 1;
   max[DiscAmmo]            = 15;
   max[SniperRifle]         = 1;
   max[GrenadeLauncher]     = 1;
   max[GrenadeLauncherAmmo] = 10;
   max[Mortar]              = 0;     // ← 0 means "light armor cannot carry this"
   max[MortarAmmo]          = 0;
   max[MissileLauncher]     = 0;
   max[MissileLauncherAmmo] = 0;
   max[Chaingun]            = 1;
   max[ChaingunAmmo]        = 100;
   max[RepairGun]           = 1;
   max[CloakingPack]        = 1;
   max[SensorJammerPack]    = 1;
   max[EnergyPack]          = 1;
   max[RepairPack]          = 1;
   max[ShieldPack]          = 1;
   max[AmmoPack]            = 1;
   max[SatchelCharge]       = 1;
   max[MortarBarrelPack]    = 0;
   max[MissileBarrelPack]   = 0;
   max[AABarrelPack]        = 0;
   max[PlasmaBarrelPack]    = 0;
   max[ELFBarrelPack]       = 0;
```

**`max[X] = 0` is how armor restrictions are implemented.** There is no separate "allowed weapons" list —
a light armor cannot carry a mortar because its limit is zero. To restrict a new item by armor class, set
`max[YourItem]` appropriately on each of the nine `PlayerData` blocks.

An item with **no `max[]` entry at all** defaults to zero and is uncarryable. This is the single most
common reason a new weapon "doesn't work".

### The ammo pack exception

`Player::maxInventory` adds the ammo pack's bonus on top **[script]**:

```php
function Player::maxInventory(%this,%data)
{
   %max = ShapeBase::maxInventory(%this,%data);
   if (%this.getInventory(AmmoPack))
      %max += AmmoPack.max[%data.getName()];
   return %max;
}
```

So `AmmoPack.max[DiscAmmo]` is an *increment*, not a replacement. If you want your new ammo to benefit
from the ammo pack, add an entry to the `AmmoPack` datablock too.

## Pickup increments

`$AmmoIncrement[<AmmoName>]` sets how much a ground pickup gives **[script]**, in `scripts/weapons.cs`:

```php
$AmmoIncrement[PlasmaAmmo]          = 10;
$AmmoIncrement[ChaingunAmmo]        = 25;
$AmmoIncrement[DiscAmmo]            = 5;
$AmmoIncrement[GrenadeLauncherAmmo] = 5;
$AmmoIncrement[MortarAmmo]          = 5;
$AmmoIncrement[MissileLauncherAmmo] = 2;
$AmmoIncrement[Mine]                = 3;
$AmmoIncrement[Grenade]             = 5;
$AmmoIncrement[FlashGrenade]        = 5;
$AmmoIncrement[FlareGrenade]        = 5;
$AmmoIncrement[ConcussionGrenade]   = 5;
$AmmoIncrement[RepairKit]           = 1;

// -------------------------------------------------------------------
// z0dd - ZOD, 4/17/02. Addition. Ammo pickup fix, these were missing.
$AmmoIncrement[CameraGrenade]       = 2;
$AmmoIncrement[Beacon]              = 1;
```

Note the z0dd fix: two items shipped without increments and therefore could not be picked up. Yours will
behave the same way if you forget.

## Inventory station loadouts

`scripts/stationSetInv.cs` defines what the "default loadout" button gives, **per armor** **[script]**:

```php
function LightMaleHumanArmor::stationSetInv(%data, %player)
{
   %saveImage = %player.getMountedImage($WeaponSlot);

   %player.clearInventory();
   %player.client.setWeaponsHudClearAll();

   %player.setInventory(RepairKit,1);
   %player.setInventory(Mine,3);
   %player.setInventory(Grenade,6);
   %player.setInventory(Blaster,1);
   %player.setInventory(Plasma,1);
   %player.setInventory(Disc,1);
   %player.setInventory(Chaingun, 1);
   %player.setInventory(GrenadeLauncher, 1);
   %player.setInventory(GrenadeLauncherAmmo, 25);
   %player.setInventory(PlasmaAmmo,20);
   %player.setInventory(ChaingunAmmo, 100);
   %player.setInventory(DiscAmmo, 20);

   %player.use(%saveImage.Item);
}
```

Notice the shape: save the current weapon, clear, clear the HUD, refill, re-equip. There is one of these
per armor datablock. Override the one(s) you care about in a package:

```php
package MyMod
{
   function LightMaleHumanArmor::stationSetInv(%data, %player)
   {
      Parent::stationSetInv(%data, %player);
      %player.setInventory(BurstDisc, 1);
      %player.setInventory(BurstDiscAmmo, 20);
   }
};
```

The loadout amounts here exceed the `max[]` limits (`DiscAmmo` 20 vs `max[DiscAmmo] = 15`). The engine
clamps to the limit, so over-specifying is harmless and is what Sierra did.

## The complete checklist for a new item

Miss any one of these and the item is unreachable in some way:

| # | Step | Where |
|---|---|---|
| 1 | Declare the `ItemData` with a `className` | Your content file |
| 2 | Declare the `ShapeBaseImageData` with `item =` back-reference | Your content file |
| 3 | Add `max[YourItem]` to every armor that may carry it | `PlayerData` blocks, via package override |
| 4 | Add `$AmmoIncrement[YourAmmo]` if it is ammo | Your content file |
| 5 | Add it to `<Armor>::stationSetInv` if it should be in the default loadout | Package override |
| 6 | Add it to the inventory station's buy list | See below |
| 7 | Add `$WeaponsHudData[n, …]` entries if it is a weapon | See [HUD](../04-interface/hud.md) |
| 8 | Add `AmmoPack.max[YourAmmo]` if the ammo pack should boost it | Package override |

## The station buy list

The inventory station's selectable items come from the `catagory` field on your `ItemData` — `"Spawn Items"`,
`"Ammo"`, `"Packs"` — combined with the armor's `max[]` limits. An item with `max[] = 0` for the selected
armor does not appear.

> Spelling again: the field is **`catagory`**, misspelled in the engine's field table. `category` creates
> a dynamic field the station code never reads, and your item silently vanishes from the list. This
> catches everyone once.

## Weapon slots and cycling

| Global | Meaning |
|---|---|
| `$WeaponSlot` | The image slot a weapon mounts to |
| `$BackpackSlot` | The image slot a pack mounts to |

Client commands for selection **[script]**:

```php
function serverCmdSelectWeaponSlot( %client, %data ) { %client.getControlObject().selectWeaponSlot( %data ); }
function serverCmdCycleWeapon( %client, %data )      { %client.getControlObject().cycleWeapon( %data ); }
function serverCmdUse(%client,%data)                 { %client.getControlObject().use(%data); }
function serverCmdThrow(%client,%data)               { %client.getControlObject().throw(%data); }
function serverCmdThrowWeapon(%client,%data)         { %client.getControlObject().throwWeapon(); }
function serverCmdThrowPack(%client,%data)           { %client.getControlObject().throwPack(); }
```

Weapon *count* is tracked separately from inventory, for the HUD **[script]**:

```php
function Weapon::incCatagory(%data, %obj)
{
   // Don't count the targeting laser as a weapon slot:
   if ( %data.getName() !$= "TargetingLaser" )
      %obj.weaponCount++;
}
```

If your item is a weapon that should not occupy a visible slot, override `incCatagory`/`decCatagory` the
same way.

## Use restrictions

`Player::use` gates what can be used while mounted in a vehicle **[script]**:

```php
// Can't use some items when piloting or your a weapon operator
if ( %this.isPilot() || %this.isWeaponOperator() )
   if ( %data.getName() !$= "RepairKit" )
      return false;

return ShapeBase::use( %this, %data );
```

Override `Player::use` in a package for custom restrictions — this is the hook the community
"restrict pack usage" tutorials target **[community]**.

## Related

- [Weapons](weapons.md) — the item/image/projectile chain
- [Packs](packs.md) — `className = Pack` items
- [Armors](armors.md) — where `max[]` limits live
- [HUD](../04-interface/hud.md) — `$WeaponsHudData` registration

> **On a patched install:** nothing on this page changes. Neither TribesNEXT patch touches gameplay
> content — see [03 · Content Recipes](README.md#under-the-community-patches).
