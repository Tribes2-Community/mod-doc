# 17 · Bones' Mapping Tutorial — Getting started

Sections 17–20 follow **NecroBones' Tribes 2 Mapping Tutorial**, the community counterpart to Sierra's
manual in [11](../11-mission-editor/README.md)–[14](../14-terrain-texturing/README.md).

Where the manual describes *what the buttons do*, this describes *what actually happens when you use
them* — including crashes, workarounds, and the design judgement the manual has no opinion on.

> **Source and attribution.** `http://tribes.necrobones.com/tribes2/tutorial.html`, by **NecroBones**
> ("Bones"), ~7,600 words across 16 sections, with a `.doc` version alongside. Screenshots and map images
> in these pages are mirrored from that site with attribution — see
> [Attribution](#attribution-and-provenance) below.
>
> Material from it is marked **[bones]**.

## What this tutorial is, in its author's words

> *"Generally I feel that these tutorials can do nothing more than give you a starting point with the
> editor, but can't teach you mapping. You can learn the editor by reading, but only by playing and by
> experimenting can you learn to be a good mapper. This is because it takes creativity, and a good vision
> of how tribes gameplay works."* **[bones]**

He is also blunt about Sierra's own documentation — the Dynamix tutorial is *"a good launching point, but
is very to-the-point, and has some innacuracies, oddly enough"* **[bones]**. That is worth holding in mind
while reading [11](../11-mission-editor/README.md)–[14](../14-terrain-texturing/README.md): the manual is
authoritative about the interface and less reliable about behaviour.

### Declared scope

| | |
|---|---|
| **Covers** | Server-side maps, CTF as the worked example |
| **Does not cover** | Terrain editing, bot support |

Both omissions are deliberate, and the first is the tutorial's central strategic idea.

## The server-side map

This is the most consequential thing in the tutorial and it changes the distribution calculus in
[16 · Shipping a map](../16-shipping-a-map/README.md).

> *"This tutorial covers ONLY server-side maps… This means that maps you make using my methods will not
> require the players to have copies in order to play on them. **Only the server needs a copy.**"*
> **[bones]**

The technique: **reuse a stock terrain and change only the `.mis`.** Because terrain, textures and
interiors are already on every client, and the mission object tree is transmitted as part of normal
mission start, a map built this way needs no client download at all.

The cost is that you cannot have custom terrain **[bones]**:

> *"server-side maps can't have custom terrain, at least for now. It's unclear as to whether Dynamix will
> ever include a mechanism for custom terrains to automatically transfer to players, since the terrain
> files are so large."*

| | Server-side map | Client-side map |
|---|---|---|
| Terrain | Stock only | Custom `.ter` |
| Client install | **None** | Required |
| Reach | Anyone can join | Only players who installed it |
| Covered by | This tutorial | [13](../13-terrain/README.md)–[14](../14-terrain-texturing/README.md) |

**For a server operator wanting to add maps to a live server, server-side is almost always the right
choice.** The reach difference is decisive.

### The save-dialog trap

The technique depends on one checkbox discipline **[bones]**:

> *"When saving, remember to **UNCHECK all but the first one**, which is the mission file. If you allow it
> to save terrain, heightfields, etc, it'll become a client-side map."*

Save with terrain checked once and your server-side map quietly becomes a client-side map. Nothing warns
you; players simply cannot join properly.

## Starting a map

The workflow, which is a *copy-and-strip* rather than File ▸ New **[bones]**:

1. Pick an existing map whose terrain you like.
2. Open `base/missions.vl2`, extract that map's `.mis` to `base/missions/` — creating the directory if it
   does not exist.
3. Rename it.
4. Open it in a text editor. Fix `DisplayName=` if present, and set `MissionTypes=` to your gametype —
   `CTF` for the worked example.
5. Save, run the game, and empty out the object tree
   ([18 · The editor windows](../18-bones-editor-windows/README.md#the-tree)).

This is why the header comments matter so much: you inherit another map's headers and **must** change
them ([16 · Shipping a map](../16-shipping-a-map/README.md#the-headers-the-editor-does-not-write)).

Note the reminder that `.mis` files *"can be opened in wordpad or notepad, and VL2 archives can be opened
using winzip"* **[bones]** — the `.vl2`-is-a-zip fact from
[File formats](../reference/file-formats.md), stated in 2002.

## Before you start: three setup steps

### Bind camera rotation

> *"by default there are no keys assigned to pitching and rotating the camera. I'd suggest assigning the
> **arrow keys** for this."* **[bones]**

`S D F E` sideslip works in the editor as in game, but pitch and rotate are unbound out of the box. This
is the first thing that makes the editor feel broken and the fix takes thirty seconds.

`TAB` toggles the mouse cursor off for free-look and back again **[bones]** — the alternative to bound
keys, and better for fast work.

### Raise the resolution

> *"I'd recommend setting the screen resolution higher than you normally play at. I've found **1280x1024**
> to be comfortable for editing. It allows you to see more on the menus, as well as more details in the
> world-view… and since you don't have players running around doing things, it's not as slow."* **[bones]**

The editor packs four panels around a 3D view. At play resolution the panels dominate.

### Save constantly

> *"You'll want to save very often, since the editor is **prone to crashes** and some other glitches."*
> **[bones]**

Consistent with the manual's own admission that *"Not all actions can be undone"* **[script]**.

## The interior-placement crash, and the workaround

The most valuable single item in the tutorial, and entirely absent from Sierra's manual **[bones]**:

> *"With the current version, chances are you'll get a **UE** every time you attempt to place a building
> ('interior'). Not everyone has this problem. If you don't have the problem, the Interiors will be placed
> and appear **entirely black** until you hit the 'relight' button."*

The workaround:

1. Set the **DROP** drop-down to **"to ground"**.
2. Turn your view so you are **looking straight up at the sky**.
3. Select your interior — it is placed, but outside your view.
4. Click **Relight**.
5. Turn around and look at your new interior.
6. Switch **Drop** back to "Camera center" or whatever you prefer.

The crash is a placement-time issue tied to what is in view, so placing while looking at empty sky avoids
it. He notes it affects *"a current version of the game… instead of the CD version"* **[bones]**, so it is
a patch-era regression — meaning it likely still affects build 25034, which is what everyone runs.

Interiors rendering **black until Relight** is normal and not a fault: they have no lighting data until
the scene is relit ([15 · Lighting](../15-lighting-nav-spawn/README.md#lighting)).

## `F11` or `Alt-E`?

Sierra's manual says *"Press the F11 key while in the game to toggle the Mission Editor on and off"*
**[script]**. NecroBones writes *"After hitting Alt-E, you'll see the editor interface pop up"*
**[bones]**.

Both appear to open the editor. The discrepancy is unresolved here — it may be a version difference, a
rebinding, or two bindings for the same action. **[inferred]** Try `F11` first; if nothing happens, try
`Alt-E`, and check your control bindings.

## The left-hand panel

> *"On the left there are really only two things you need to mess with: **Camera Speed** … and the **Save**
> button."* **[bones]**

Camera speed high for crossing terrain, low for working inside a base. It is `$Camera::movementSpeed`
([11 · The Mission Editor](../11-mission-editor/README.md#camera-menu)).

Of the right-hand panels, three matter — **Tree**, **Inspector**, **Creator** — and the fourth (mission
area) can be turned off, since *"it just deals with the mission area and the like, which can also be dealt
with manually"* **[bones]**.

## Attribution and provenance

The tutorial and its images are **NecroBones' work**, mirrored here because community Tribes 2 hosting has
proven fragile and this material is worth preserving. Every page in sections 17–20 attributes it, links
the original, and marks derived statements **[bones]**.

Images are stored under `assets/img/necrobones/` at their original resolution. If the author would prefer
they not be mirrored, that is his call and they will be removed — the link to the original stands either
way.

Nothing here is presented as this handbook's own research.

## Related

- [18 · The editor windows](../18-bones-editor-windows/README.md) — Tree, Inspector, Creator
- [11 · The Mission Editor](../11-mission-editor/README.md) — Sierra's account of the same interface
- [16 · Shipping a map](../16-shipping-a-map/README.md) — where the server-side technique changes the maths
