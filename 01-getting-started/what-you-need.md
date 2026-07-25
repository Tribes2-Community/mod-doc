# What you need

Tribes 2 modding needs very little tooling. Scripts are plain text; archives are ZIP files; the engine
compiles for you at load time. There is no build system and no SDK to install.

## The essentials

| Need | Options |
|---|---|
| **Archive tool** | 7-Zip, WinRAR, or anything that reads ZIP. `.vl2` is a renamed ZIP. **[binary]** |
| **Text editor** | Anything. Syntax highlighting for C-family languages works well enough for TorqueScript. |
| **A legitimate Tribes 2 install** | Patched to v1.05 (build 25034). See [Install anatomy](install-anatomy.md#confirming-your-build). |
| **A copy of the base scripts** | Unpacked from `base/scripts.vl2`, kept somewhere you can grep. Non-negotiable. |

The 2002-era tutorials recommend WinZip and *Tribal IDE* **[community]**. Tribal IDE was a
TorqueScript-aware editor of the period; it is long unmaintained and hard to find. Any modern editor is a
better choice today.

## Unpacking `.vl2`

`.vl2` is **standard PKZIP**. Magic bytes at offset 0 are `50 4B 03 04`. **[binary]** Vanilla archives use
the *Stored* method (no compression) — files are laid down byte-for-byte, which is why `scripts.vl2` is
4.7 MB of mostly-text.

Rename to `.zip` and open it, or point a tool at it directly:

```bash
unzip -o base/scripts.vl2 -d ./scripts_unpacked
```

```powershell
Expand-Archive -Path .\base\scripts.vl2 -DestinationPath .\scripts_unpacked
```

> `Expand-Archive` may refuse a `.vl2` extension. Copy it to `scripts.zip` first.

Do this for `scripts.vl2` at minimum. Most modders keep an unpacked reference tree permanently, separate
from the game install, purely for reading and searching.

## Set up a searchable reference tree

This is the highest-value thing you can do before writing any code. You will be answering questions like
"what field controls jet energy drain?" and "which file defines `$DamageType::Disc`?" constantly, and the
answer is always in the shipped scripts.

```
reference/
├── scripts/          from base/scripts.vl2
├── gui/              from base/scripts.vl2
└── Classic/          copied from GameData/Classic/scripts/
```

Then grep it:

```bash
grep -rn "jetEnergyDrain" reference/
```

```powershell
Select-String -Path .\reference\ -Pattern "jetEnergyDrain" -Recurse
```

## Optional: model and texture tools

You only need these if you are making new art rather than new behaviour. Most mods — including most of
the classic community mods — reuse the shipped `.dts` shapes and change only script.

| Format | Notes |
|---|---|
| `.dts` (shapes) | Dynamix Three Space. Period tooling was a 3ds Max exporter. Modern viewers exist but authoring is difficult. Reusing shipped shapes is the pragmatic path. |
| `.dsq` (animations) | Sequence data, bound to a shape via `TSShapeConstructor` — see [Armors](../03-content-recipes/armors.md). |
| `.dif` (interiors) | Built by Dynamix's `Torque Constructor` lineage of tools. |
| `.png` / `.jpg` / `.bmp` | Ordinary images. Textures are straightforward to replace. |
| `.bm8` | 8-bit paletted Tribes 2 bitmap, used for low-end systems. Rarely worth authoring. |

See [File formats](../90-reference/file-formats.md) for the full catalog.

## Under the community patches

Your install is almost certainly patched, which changes two things about the reference tree.

**Unpack the patch archive too.** `base/t2csri.vl2` (QoL) or `base/T2csri.vl2` (RC2a) holds the patch's
own scripts. Keeping them beside your vanilla reference means a grep for a function name tells you whether
vanilla, the patch, or both define it — which is exactly what you need when an override is not behaving.

```
reference/
├── scripts/          from base/scripts.vl2
├── gui/              from base/scripts.vl2
├── Classic/          from GameData/Classic/scripts/
├── t2csri/           from base/t2csri.vl2
└── console_client_patches.cs    copied from the GameData root (QoL only)
```

`console_client_patches.cs` is 47 KB of TorqueScript and the single best worked example of large-scale
package overriding in existence. Read it.

**Fonts differ.** The QoL patch replaces the vanilla `.gft` bitmap fonts with `.sdft` and reroutes every
font name through `$Font::Substitute` **[patch-script]**. If you are doing UI work, your layout will
render in Saira and U001, not Univers. See [GUI system](../04-interface/gui-system.md).

## If you are writing client-side scripts

Add the community **support pack** to your reference tree as well — `base/support.vl2`, if installed. It
is a script library and module system that much of the surviving client-side community corpus depends on,
and its 36 modules are self-documenting in their header comments. See
[09 · The Support Pack](../09-support-pack/README.md).

Server-side gameplay mods do not need it.

## What you do *not* need

- **A compiler.** The engine compiles `.cs` to `.cs.dso` itself at load time. **[binary]**
- **The engine source.** You cannot rebuild `Tribes2.exe`. All modding is script-side and data-side.
- **A copy of Torque.** Tribes 2's V12 engine is the ancestor of Torque, not the same thing. Torque
  documentation is a useful analogy and an unreliable reference — field names and behaviour diverge.

## Related

- [Your first mod](your-first-mod.md) — put the tools to use
- [File formats](../90-reference/file-formats.md) — extension catalog
- [Debugging](../06-shipping/debugging.md) — the console and logging
