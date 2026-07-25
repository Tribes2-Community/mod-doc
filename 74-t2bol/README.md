# 74 · T2Bol client content

A pure asset pack — no readme, no scripts, identity recoverable only from its own archive name and
contents.

| | |
|---|---|
| Ships as | `T2BolClientSideContent.zip`, 31 MB, 89 files |
| Contents | 1 interior, 5 music tracks, a handful of shapes, ~45 textures for a "mines" interior set, character skins |
| Scripts or GUI | None present |

No readme accompanies this archive, so "T2Bol" is this handbook's best inference from the archive's own
filename — the contents give no further identifying text.

The asset breakdown: one interior (`.dif`); five music tracks including `bioderm.mp3` and `starwolf.mp3`;
a handful of shapes (a money bag, billboards, an ammo model); a roughly 45-texture set under
`textures/Kmines/` — stone, wood, and metal materials sized for a "mines" interior; and a `textures/skins/`
set of character reskins — Beagle, Chameleon, Gecko, and Snake bioderm variants, plus matching billboards.
A small `texticons/` set rounds it out.

With no `scripts/` or `gui/` directory anywhere in the archive, this is unambiguously a **content pack**
rather than a mod with any behaviour of its own — assets meant to be dropped into an existing mod or
mission rather than run on their own. The music track names (`bioderm.mp3`, `starwolf.mp3`) suggest it
was built to accompany specific factions or missions, though which ones is not recoverable from the
archive alone.

## Related

- [Audio](../03-content-recipes/audio.md) — the `AudioProfile`/`AudioDescription` system this pack's music would hook into
- [Armors](../03-content-recipes/armors.md) — the skin/shape binding this pack's character reskins depend on
- [72 · droc mod](../72-droc-mod/README.md) — another pure-asset client pack, smaller in scope
