# 12 · World Editor

Object placement and manipulation. Three linked windows over one 3D view.

| Window | Screen position | Role |
|---|---|---|
| **World Editor** | Full screen | Select and manipulate objects in the 3D world |
| **World Editor Inspector** | Tree upper right, properties lower right | Read and edit object properties |
| **World Editor Creator** | Tree upper right, creator tree lower left | Create new mission objects |

All three share the **tree** in the upper-right quadrant, which is the `.mis` object hierarchy.

## Mouse and keyboard

The complete reference, from the manual **[script]**:

| Input | Effect |
|---|---|
| Click an unselected object | Deselects everything, selects that object |
| Click empty space and drag | Box-select — selects everything inside the box |
| **Shift**-click an object | Toggles that object in the selection |
| Drag a selected object | Moves the selection — horizontally, or stuck to terrain, per the **Planar Movement** checkbox |
| **Ctrl**-click and drag | Moves the selection **vertically** |
| **Alt**-click and drag | **Rotates** the selection about the vertical axis |
| **Alt-Ctrl**-click and drag | **Scales** the selection by a face of its bounding box |

With gizmos enabled in World Editor Settings:

| Input | Effect |
|---|---|
| Drag a gizmo axis | Move along that axis |
| **Alt**-drag a gizmo axis | Rotate on that axis |
| **Alt-Ctrl**-drag a gizmo axis | Scale along that axis |

The modifier scheme is consistent: **plain = translate, Alt = rotate, Alt-Ctrl = scale**, with Ctrl
promoting translation to the vertical axis. Learn those four and the editor is largely in hand.

**Planar Movement** is the setting people trip over. Off, a dragged object sticks to the terrain surface —
right for props and spawn points. On, it moves in a horizontal plane — right for anything that must sit at
a specific altitude.

## The tree, and the Instant Group

The tree shows the `.mis` hierarchy. Selecting in the tree selects in the 3D view.

One special concept **[script]**:

> *"There is a special group selection call the Instant Group. This group is where objects that are pasted
> are placed, as well as where objects created from the World Editor Creator are placed. In the World
> Editor tree view the instant group is displayed with a grey hilight. To change the current instant
> group, **Alt-click on a group in the tree view**."*

**This is `$instantGroup` exposed as UI.** The same global that governs where script-created objects land
at runtime ([Scheduling and events](../02-engine-model/scheduling-and-events.md#instantgroup)) is what the
editor is setting when you alt-click a group.

That is worth internalising, because it is how you keep a `.mis` organised. Shipped missions nest by
purpose **[script]**:

```
MissionGroup
├── MissionArea, Sun, TerrainBlock, NavigationGraph, Sky
├── RandomOrganics
│   └── (vegetation clusters)
└── Teams
    ├── Team1
    │   ├── spawnspheres
    │   └── base0
    └── Team2
```

**Alt-click `base0` before creating a generator** and it lands in the right group. Create it with
`MissionGroup` as the instant group and you get a flat, unmaintainable mission that gametype code may not
find.

The World Menu's **Add Selection to Instant Group** moves an existing selection in after the fact.

## World menu

| Item | Effect |
|---|---|
| **Lock Selection** / **Unlock Selection** | Prevents manipulation from the 3D view |
| **Hide Selection** / **Show Selection** | Reduces clutter while editing |
| **Delete Selection** | Deletes |
| **Camera To Selection** | Moves the camera to the selection |
| **Reset Transforms** | Resets rotation and scale |
| **Drop Selection** | Re-drops the selection per the current drop rule |
| **Add Selection to Instant Group** | Moves the selection into the instant group |

Lock is more useful than it sounds. Terrain and large interiors are easy to grab by accident when
box-selecting; locking them once at the start of a session saves a great deal of undo — which, per the
manual, is *"not all actions can be undone"*.

`locked = "true"` is a dynamic field written into the `.mis` **[script]** — visible on `MissionArea`,
`Sun`, `TerrainBlock` and `NavigationGraph` in the shipped missions, which is exactly what you would
expect: Sierra locked the things you should not be dragging.

## Drop rules

Where new objects appear. Seven options **[script]**:

| Rule | New objects appear |
|---|---|
| **Drop at Origin** | At the world origin |
| **Drop at Camera** | At the camera |
| **Drop at Camera w/Rot** | At the camera, with the camera's orientation |
| **Drop below Camera** | Below the camera |
| **Drop at Screen Center** | Where the view direction hits an object |
| **Drop at Centroid** | At the centre of the current selection |
| **Drop to Ground** | At terrain ground level |

**Drop at Screen Center** is the working default for most placement — point at where you want the thing
and create it. **Drop to Ground** is right for spawn spheres and props. **Drop at Camera w/Rot** is the
one to reach for when orientation matters as much as position, such as vehicle pads and station fronts.

## The Inspector

> *"When an object is selected in Inspector mode, that object's properties will be displayed in the lower
> right quadrant of the screen. Once properties are edited, clicking the **apply** button will set those
> properties into the object."* **[script]**

Two things to note.

**Edits are not live — you must click Apply.** Losing a field edit by selecting away first is the single
most common editor frustration.

**Dynamic fields can be added here.** The manual is explicit **[script]**:

> *"Dynamic properties can be assigned to objects with the **Dynamic Fields Add** button. Dynamic fields
> are accessable through the scripting language and are used to add game-specific properties to mission
> objects."*

This is the bridge between mapping and modding. A dynamic field added in the Inspector is readable as
`%obj.yourField` from script ([SimObjects and namespaces](../02-engine-model/simobject-and-namespaces.md#fields)),
persists into the `.mis` at a deeper indent than static fields, and is how a gametype reads per-map
configuration. `MissionGroup`'s own `CTF_scoreLimit` and `CTF_timeLimit` are exactly this
([Missions](../05-gameplay-systems/missions.md#missiongroups-own-fields-carry-gametype-settings)).

**If you are writing a gametype, this is how you let mappers configure it** — read
`MissionGroup.<Type>_<setting>` and document the field names.

Inspector script hooks are in `scripts/EditorGui.cs` **[script]**:

```php
Inspector.inspect(%obj);
InspectorNameEdit.setValue(%obj.getName());
```

## The Creator

> *"The World Editor Creator displays a tree view in the lower left corner of the screen. This tree
> contains all objects that can be created in a mission."* **[script]**

The tree is populated from the registered class list and the loaded datablocks — which is why a mod that
adds `StaticShapeData` blocks makes them placeable in the editor with no extra work. Construction's
building pieces, for instance, appear here alongside the stock objects.

New objects land in the **instant group**, at the position given by the current **drop rule**.

## Working with the console alongside

The editor cannot do everything. Some things are simply faster typed:

```php
// what am I actually looking at
nameToID(team1flag).dump();

// bulk-set a field the Inspector would need many clicks for
for (%i = 0; %i < MissionGroup.getCount(); %i++)
   echo(MissionGroup.getObject(%i).getName() SPC MissionGroup.getObject(%i).getClassName());

// exact placement
nameToID(team1vehiclestation).setTransform("-180.737 264.173 73.9045 0 0 -0.999913 0.0206931");
```

That last idiom — `nameToID(...)` then `setTransform(...)` — is precisely what the Classic mod's
`minivstationx.cs` does to reposition stations on specific maps **[script]**. Exact transforms are easier
to set from the console than by dragging.

## Related

- [11 · The Mission Editor](../11-mission-editor/README.md) — the shell, menus and movement
- [13 · Terrain](../13-terrain/README.md) — the other half of the editor
- [16 · Shipping a map](../16-shipping-a-map/README.md) — object naming conventions gametypes rely on
- [Missions](../05-gameplay-systems/missions.md) — the `.mis` structure this produces
