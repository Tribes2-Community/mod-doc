# 13 · Terrain

Three tools shape the landscape: **Terraform** generates it procedurally, the **Terrain Editor** corrects
it by hand, and the **Mission Area Editor** bounds and mirrors it. All three write to the `.ter` file.

## Terraform Editor — the procedural stack

The most capable and least known part of the toolchain.

> *"Heightfield operations are arranged in a **stack**, with some operations using the results of previous
> operations to produce new heightfields. The results of the last operation on the stack can be applied to
> the terrain using the Apply button."* **[script]**

Two panes: the top inspects the selected operation, the bottom shows the stack, with a pull-down between
them for adding operations. **The first entry is always `General` and cannot be deleted.**

### The fourteen operations

| Operation | What it does |
|---|---|
| **fBm Fractal** | Fractional Brownian motion — bumpy hills |
| **Rigid Multifractal** | Ridges and sweeping valleys |
| **Canyon Fractal** | Vertical canyon ridges |
| **Sinus** | Overlapping sine waves at different frequencies — rolling hills |
| **Bitmap** | Imports an existing **256×256** bitmap as a heightfield |
| **Turbulence** | Perturbs another operation on the stack |
| **Smoothing** | Smooths another operation |
| **Smooth Water** | Smooths water |
| **Smooth Ridges/valleys** | Smooths an operation at edge boundaries |
| **Filter** | Filters an operation through a curve |
| **Thermal Erosion** | Erodes using a thermal erosion algorithm |
| **Hydraulic Erosion** | Erodes using a hydraulic erosion algorithm |
| **Blend** | Blends two operations by scale factor and mathematical operator |
| **Terrain File** | Loads an existing terrain file onto the stack |

Three of those deserve emphasis.

**The erosion operators are real erosion simulations.** Thermal erosion models material sliding down
slopes past an angle of repose; hydraulic models material carried by water. Running a fractal and stopping
is what makes terrain look generated; running an erosion pass over it is what makes it look weathered.

**Blend and Turbulence make it a compositor, not a generator.** Because operations consume earlier
results, you can build genuinely layered terrain — Rigid Multifractal for the major ridgelines, blended
with fBm at low weight for surface detail, turbulence to break up the regularity, then hydraulic erosion.
That is a modern heightfield workflow, in a 2001 game, in-engine.

**Bitmap and Terrain File are the import paths.** Bitmap takes a 256×256 image as the heightfield — so any
external terrain tool that can export a greyscale heightmap can feed this. **Terrain File** puts an
existing `.ter` on the stack, which combined with **File ▸ Import Terraform Data…** means you can start
from a shipped map's recipe.

### Reading a shipped recipe

The single most efficient way to learn what produces Tribes-like terrain:

1. **File ▸ Import Terraform Data…** and pick a shipped `.ter`.
2. Open the Terraform Editor and read the stack.
3. Change one operation's parameters and Apply.

The rules live in the `.ter` file itself, so every shipped map carries its own generation recipe.

> **Save before Apply.** The manual warns that *"Not all actions can be undone"* **[script]**, and a
> terraform Apply rewrites the whole heightfield.

**Export Terraform Bitmap…** (File menu, active only in this editor) writes the current map out as a
bitmap — useful for taking a heightfield to an external tool, or for documentation.

## Terrain Editor — manual brush work

Corrections and detail after generation.

> *"Terrain editing is accomplished using the **brush**. The brush is a selection of terrain points or
> squares centered around the mouse cursor."* **[script]**

| Brush property | Options |
|---|---|
| Shape | Circle or square |
| Size | Several, from the Brush menu |
| Falloff | **Hard** — uniform effect across the brush · **Soft** — effect diminishes toward the edges |

Soft-brush falloff is controlled by the filter view in **Terrain Editor Settings**.

### The eleven action modes

From the **Action** menu **[script]**:

| Action | Effect |
|---|---|
| **Select** | Painting with the brush selects grid points |
| **Adjust Selection** | Raises or lowers the selected points as a group |
| **Add Dirt** | Adds material at the brush centre |
| **Excavate** | Removes material at the brush centre |
| **Adjust Height** | Drag the brush selection to raise or lower it |
| **Flatten** | Sets the brush surface to a flat plane |
| **Smooth** | Smooths rough areas within the brush |
| **Set Height** | Sets terrain in the brush to a constant height (value in Terrain Editor Settings) |
| **Set Empty** | Makes the covered squares **holes in the terrain** |
| **Clear Empty** | Makes the covered squares solid again |
| **Paint Material** | Paints the current terrain material — see [14](../14-terrain-texturing/README.md) |

**Set Empty is the one to know about.** It punches holes in the heightfield, which is how you build
terrain that a player can pass *through* rather than over — cave mouths, sunken bases, anything where an
interior needs to breach the ground plane. Those holes are stored per-square in the `.ter` and appear in
the `.mis` as the `emptySquares` field on `TerrainBlock` **[script]**:

```php
new TerrainBlock(Terrain) {
   detailTexture = "details/lushdet2";
   terrainFile = "Slapdash.ter";
   squareSize = "8";
   emptySquares = "94579 99875";
      visibleDistance = "1200";
      hazeDistance = "250";
};
```

**Select / Adjust Selection is the precision path.** Rather than dragging heights freehand, select a
region with the brush then move the whole selection as a unit — the right way to level a base footprint.

### The `TerrainBlock` fields you will set

| Field | Meaning |
|---|---|
| `terrainFile` | The `.ter` this block renders |
| `squareSize` | Metres per terrain square — `8` in shipped maps |
| `detailTexture` | Close-range detail overlay |
| `emptySquares` | Indices of holes punched with Set Empty |
| `visibleDistance` | Draw distance |
| `hazeDistance` | Where distance haze begins |

`visibleDistance` and `hazeDistance` are performance and atmosphere in one pair. Shipped maps use
`1200` / `250` **[script]**.

## Mission Area Editor

Bounds, centring and mirroring.

> *"The Mission Area Editor displays an overhead height map in the upper right corner of the screen, with
> markers for mission objects, a box for the mission area and a pair of lines denoting the current field
> of view. Clicking anywhere on the display will move the current view object (either camera or player) to
> that location."* **[script]**

That click-to-teleport is the fastest way to navigate a large map while editing — better than flying.

| Control | Effect |
|---|---|
| **Edit Area** checkbox | Shows 8 resize knobs on the mission-area box, draggable |
| **Center** | Repositions the terrain data so it is centred at 0,0 within the mission area |
| **Mirror** | Enters mirror mode |
| **← →** (in mirror mode) | Cycles the mirror plane through **8 angles** — 2 axis-aligned, 2 diagonal splits |
| **Apply** | Mirrors the terrain across the chosen plane |

**Mirroring is how you make a fair competitive map.** Two-team symmetry matters in CTF, and mirroring the
terrain across a plane guarantees it. Note it mirrors *terrain*, not objects — you still place and mirror
the bases yourself.

### `MissionArea` in the `.mis`

```php
new MissionArea(MissionArea) {
   area = "-848 -864 1264 1472";
   flightCeiling = "240";
   flightCeilingRange = "20";
      locked = "true";
};
```

| Field | Meaning |
|---|---|
| `area` | Bounds as `x y width height` |
| `flightCeiling` | Altitude ceiling for aircraft |
| `flightCeilingRange` | Fade band below the ceiling |

Leaving the play area open is a real design failure: `$DamageType::OutOfBounds` exists
([Damage and type masks](../03-content-recipes/damage-and-typemasks.md#damage-types)) and gametypes call
`testOOBDeath` **[script]**, so the boundary is enforced — but only where you have defined it.

## Terrain from script

A small console surface exists **[binary]**:

```
getTerrainHeight(pos);
makeTestTerrain(fileName, {dml1, dml2, ...dml8} );
echoTerrainTextures();
```

`getTerrainHeight` is the useful one for a mod — Construction's deployables use raycasts rather than this,
but for anything that needs ground level at a coordinate it is the direct route.

Note `makeTestTerrain` takes **up to eight `.dml`s** — the same eight-material ceiling the painter works
against ([14](../14-terrain-texturing/README.md)).

## Related

- [14 · Terrain texturing](../14-terrain-texturing/README.md) — materials on top of this geometry
- [12 · World Editor](../12-world-editor/README.md) — placing objects on it
- [15 · Lighting, navigation & spawn data](../15-lighting-nav-spawn/README.md) — what to regenerate after terrain changes
- [File formats](../reference/file-formats.md) — `.ter`, `.dml`
