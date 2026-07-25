# 14 · Terrain texturing

Two tools: one places materials **by rule**, the other **by hand**. Use them in that order.

## Texture Editor — placement by rule

> *"The Terrain Texture Editor is used to algorithmically place terrain textures based on the heightfield
> at the bottom of the terraformer heightfield stack."* **[script]**

Note what it keys off: **the heightfield at the bottom of the terraform stack**, not the final applied
terrain. Texture rules are evaluated against the generated base, which is why importing terraform rules
and texture rules together (File ▸ Import Terraform Data… and Import Texture Data…) reproduces a coherent
result.

Three interface elements down the right side **[script]**:

| Element | Purpose |
|---|---|
| Operation inspector pane | Parameters of the selected placement operation |
| Material list | The textures in use |
| Placement operation list | The rules that place them |

### Adding materials

> *"terrain materials (textures) are added with the **Add Material** button. This will look for any texture
> (`.png` or `.jpg`) in a subdirectory of any directory named **"terrains"**."* **[script]**

So the discovery path is `**/terrains/<subdir>/*.png|jpg` — which resolves through the mod path stack like
everything else ([Mod paths and overrides](../02-engine-model/mod-paths-and-overrides.md)). A mod shipping
`MyMod/textures/terrains/mymats/rock.png` makes that material available in the editor with no
registration.

### The four placement rules

| Rule | Places the texture… |
|---|---|
| **Place by Fractal** | Randomly across the terrain, driven by a Brownian-motion fractal |
| **Place by Height** | Through an elevation filter |
| **Place by Slope** | Through a slope filter |
| **Place by Water Level** | Relative to the water level parameter in the Terraform Editor |

These four compose into everything conventional terrain texturing needs:

- **Slope** distinguishes cliff faces from ground — the single highest-value rule, because a rock texture
  on anything steep and grass on anything flat immediately reads as natural.
- **Height** gives you snowlines and lowland.
- **Water Level** handles shoreline transitions, and takes its parameter from Terraform, so shore
  texturing follows the water you generated.
- **Fractal** breaks up the regularity the other three produce.

**Apply** commits the operation list to the terrain file.

## Texture Painter — manual work

> *"Users can select up to **six** different textures in the boxes in the upper right corner of the screen.
> Selecting a texture will place a black box around it. The terrain brush can then be used to paint the
> texture on the terrain."* **[script]**

The brush is the same one as the Terrain Editor — shape, size and hard/soft falloff all carry over
([13 · Terrain](../13-terrain/README.md#terrain-editor--manual-brush-work)). Painting is also reachable
from the Terrain Editor itself via the **Paint Material** action mode.

## The four-texture rule

The manual's own warning, and the most important practical constraint in this section **[script]**:

> *"Terrains with more than four textures may exhibit **rendering irregularities** if all those textures
> are used in the same area of a map. In general it is wise to use **four or fewer** textures on any
> individual terrain map."*

So there are three numbers in play and they are not the same:

| Limit | Value | Source |
|---|---|---|
| Painter slots | **6** | Texture Painter UI **[script]** |
| `makeTestTerrain` material arguments | **8** | Console function signature **[binary]** |
| **Safe simultaneous textures in one area** | **4** | The manual's guidance **[script]** |

Design to four. You may define more across a map, but keep any given region to four or fewer, and the
rendering stays clean.

> **Under the QoL patch**, the painter is extended from six slots to eight via `EPainter::setup`,
> `EPainter::onAdd` and `EPainterChangeMat` **[patch-script]**. Two consequences: a map painted with slots
> 6–7 will not paint correctly in an unpatched editor, and the four-in-one-area guidance is a *rendering*
> constraint that more slots do not remove.

## `.dml` — the material list

Materials are grouped into `.dml` (DyMaterial List) files — 89 ship in the vanilla archives
([File formats](../90-reference/file-formats.md)). `makeTestTerrain` takes up to eight of them
**[binary]**:

```
makeTestTerrain(fileName, {dml1, dml2, ...dml8} );
```

and `echoTerrainTextures()` dumps the current set to the console — the quickest way to see what a shipped
map actually uses.

## Detail texture

Separate from the material set, and set on the `TerrainBlock` in the `.mis` **[script]**:

```php
detailTexture = "details/lushdet2";
```

The detail texture is a high-frequency overlay applied at close range, independent of which material is
underneath. It is what stops terrain looking flat and blurry underfoot. Shipped maps use the per-environment
detail textures — `lushdet2`, and equivalents for desert, ice, lava and badlands.

## Custom terrain materials in a mod

If your mod ships terrain textures:

| Step | Where |
|---|---|
| Put `.png`/`.jpg` under a `terrains/` subdirectory | `MyMod/textures/terrains/mymats/` |
| Group them in a `.dml` if you want a set | Same directory |
| **Clients need the files** | Textures are referenced by name, not transmitted ([Datablocks](../02-engine-model/datablocks.md#datablocks-are-transmitted-to-clients)) |

The QoL patch registers a fallback so an unmapped material renders as a flat colour rather than failing
**[patch-script]**:

```php
addMaterialMapping("terrain/default", "color: 0.46 0.36 0.26 0.4 0.0", "sound: 0");
```

Useful as a safety net; not a substitute for shipping the texture.

Note the `"sound:"` parameter — terrain materials carry a **sound type**, which is what selects footstep
audio ([Armors](../03-content-recipes/armors.md#sounds-and-effects) — `LFootSoftSound`, `LFootHardSound`,
`LFootSnowSound` and the rest). Get the material sound wrong and players walk on snow that sounds like
metal.

## Related

- [13 · Terrain](../13-terrain/README.md) — the heightfield these materials sit on
- [15 · Lighting, navigation & spawn data](../15-lighting-nav-spawn/README.md) — regenerate after texture changes
- [File formats](../90-reference/file-formats.md) — `.dml`, `.png`, `.jpg`, `.bm8`
- [Armors](../03-content-recipes/armors.md) — footstep sounds keyed off material sound type
