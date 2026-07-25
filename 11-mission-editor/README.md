# 11 · The Mission Editor

`F11` toggles it, on the currently loaded mission **[script]**. Everything below is from the shipped
manual in `base/scripts.vl2`'s `help/` directory unless marked otherwise.

## The eight tools

Selected from the **Window** menu **[script]**:

| Tool | Purpose | Documented in |
|---|---|---|
| **World Editor** | Full-screen object movement and selection | [12](../12-world-editor/README.md) |
| **World Editor Inspector** | Inspect and edit object properties | [12](../12-world-editor/README.md#the-inspector) |
| **World Editor Creator** | Create new mission objects | [12](../12-world-editor/README.md#the-creator) |
| **Mission Area Editor** | Adjust mission bounds; mirror terrain | [13](../13-terrain/README.md#mission-area-editor) |
| **Terrain Editor** | Manually adjust the heightfield and square properties | [13](../13-terrain/README.md#terrain-editor--manual-brush-work) |
| **Terrain Terraform Editor** | Procedurally generate the heightfield from fractal operations | [13](../13-terrain/README.md#terraform-editor--the-procedural-stack) |
| **Terrain Texture Editor** | Procedurally place terrain textures by rule | [14](../14-terrain-texturing/README.md#texture-editor--placement-by-rule) |
| **Terrain Texture Painter** | Manually paint terrain textures | [14](../14-terrain-texturing/README.md#texture-painter--manual-work) |

The split runs **objects vs terrain**, and within terrain, **procedural vs manual**. The intended order is
procedural first, manual second — generate a heightfield with Terraform, correct it with the Terrain
Editor; place textures by rule, then touch them up with the Painter.

## Movement

> *"The normal movement keys can be used to control both the player and the camera. The right mouse button
> is used to rotate the camera or adjust the player's view."* **[script]**

You are editing as either the **player** or a free **camera**, and switch between them from the Camera
menu. The distinction matters: the player collides with the world, the camera does not, and several
object-drop rules are relative to the camera specifically.

## File menu

| Item | Effect |
|---|---|
| **New Mission…** | Creates an empty mission with a default terrain and sky |
| **Open Mission…** | Opens an existing mission for editing |
| **Save Mission** | Writes the current mission to disk |
| **Save Mission As…** | Writes it under a new name |
| **Import Terraform Data…** | Imports terraform *rules* from an existing terrain file |
| **Import Texture Data…** | Imports terrain texture *rules* from an existing terrain file |
| **Export Terraform Bitmap…** | Terraform Editor only — exports the current terraform map to a bitmap |

The two **Import** items are the most useful and least known. Terraform and texture rules are stored in the
`.ter` file, so you can lift an entire generation recipe off a shipped map and re-run it — the fastest way
to learn what produces Tribes-like terrain is to import `Slapdash`'s rules and read the stack.

**Save Mission is what writes the `.mis`.** The output is `SimObject::save()`, which is why every shipped
`.mis` and `.gui` carries the `//--- OBJECT WRITE BEGIN ---` marker
([SimObjects and namespaces](../02-engine-model/simobject-and-namespaces.md)). It also means **anything
you hand-edit into a `.mis` outside the marked block survives, and anything inside it does not** — the
editor rewrites that region wholesale. Put your `// MissionTypes = ` and `// DisplayName = ` headers
*above* it.

## Edit menu

| Item | Effect |
|---|---|
| **Undo** / **Redo** | *"Undoes the last action in terrain or world editing. **Not all actions can be undone**"* |
| **Cut** / **Copy** / **Paste** | Clipboard for world-editor selections |
| **Select All** / **Select None** | Selection in world and terrain editors |
| **Relight Scene** | Recomputes mission static lighting — see [15](../15-lighting-nav-spawn/README.md) |
| **World Editor Settings…** | Planar movement, gizmos, drop behaviour |
| **Terrain Editor Settings…** | Brush falloff filter, Set Height value |

Take the undo caveat seriously. It is the manual's own wording, and terrain operations in particular are
not reliably reversible. **Save before any terraform Apply.**

## Camera menu

| Item | Effect |
|---|---|
| **Drop Camera At Player** | Moves the camera to the player and switches to camera mode |
| **Drop Player At Camera** | Moves the player to the camera and switches to player mode |
| **Toggle Camera** | Switches between player and camera movement |
| **Slowest … Fastest** | Camera speed |

These are exposed to script as client commands **[script]**:

```php
commandToServer('dropCameraAtPlayer');
commandToServer('DropPlayerAtCamera');
commandToServer('ToggleCamera');
```

Camera speed is `$Camera::movementSpeed`, default `40`. The Construction mod raises it to `80` for its
scaled-up TR2 missions and restores the default afterwards **[mod-script]** — a reminder that a mod can
retune the editor for its own content:

```php
if( %missionType $= "TR2" )
{
    $_Camera::movementSpeed = $Camera::movementSpeed;
    $Camera::movementSpeed = 80;
}
else
{
    %val = $_Camera::movementSpeed $= "" ? 40 : $_Camera::movementSpeed;
    $Camera::movementSpeed = %val;
}
```

## The console is part of the toolchain

The editor and the console are complementary. Anything the editor cannot express, script can — and the
object you are editing is an ordinary `SimObject`:

```php
$Camera::movementSpeed = 120;
MissionGroup.getCount();
nameToID(team1flag).dump();
MissionGroup.save("missions/MyMap.mis");
```

`MissionGroup.save()` is exactly what **Save Mission** calls. `dump()` on a selected object shows every
field the Inspector can edit and several it cannot
([SimObjects and namespaces](../02-engine-model/simobject-and-namespaces.md#useful-introspection)).

## Under the community patches

The QoL patch extends the **terrain painter** from six material slots to eight, via
`EPainter::setup`, `EPainter::onAdd` and `EPainterChangeMat` **[patch-script]**.

That matters for portability: **a map painted using slots 6 or 7 will not paint correctly in an unpatched
editor**, and Sierra's own guidance is to keep to four or fewer textures in any one area anyway
([14 · Terrain texturing](../14-terrain-texturing/README.md#the-four-texture-rule)).

Nothing else in the editor is modified by either patch.

## Related

- [12 · World Editor](../12-world-editor/README.md) — the object tools in detail
- [13 · Terrain](../13-terrain/README.md) — heightfield generation and editing
- [10 · Mapping](../10-mapping/README.md) — the file set and full workflow
- [Missions](../05-gameplay-systems/missions.md) — the `.mis` format the editor writes
