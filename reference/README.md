# Reference

Lookup material. Not meant to be read front to back.

| Page | Contains |
|---|---|
| [Console functions](console-functions.md) | The engine-registered function surface, by category |
| [Datablock classes](datablock-classes.md) | Every declarable datablock type and its validated field ranges |
| [Class hierarchy](class-hierarchy.md) | The engine object tree |
| [File formats](file-formats.md) | Every extension in the install and what it is |
| [Global variables](global-variables.md) | `$pref::`, `$Host::`, and the other well-known globals |
| [Source tutorial index](source-tutorial-index.md) | Map of the community tutorial corpus this handbook draws on |

## How this material was produced

| Page | Method |
|---|---|
| Console functions | String extraction from `Tribes2.exe` — the engine stores each function's usage string in `.rdata` next to its registration site **[binary]** |
| Datablock classes | Census of `datablock` declarations across the 334 files in `base/scripts.vl2`, plus validation-message strings from the binary **[script]** **[binary]** |
| Class hierarchy | Header comments in the shipped scripts, plus RTTI recovery from the binary |
| File formats | Extension survey across all 19 `.vl2` archives and the loose `GameData/` tree |
| Global variables | Extraction from `scripts/clientDefaults.cs` and `scripts/serverDefaults.cs` |
| Tutorial index | Inventory of `T2ModTutorialDatabase/` |

Where a page states a fact without a marker, it is a count or a listing rather than a behavioural claim.

## Under the community patches

Everything catalogued here is **vanilla `Tribes2.exe`**, and neither patch modifies the executable — so
every class, datablock type, field range, file format, and vanilla console function is present and
unchanged on a patched install.

The patches *add*. Each page carries an "Under the community patches" section covering what:

| Page | Additions |
|---|---|
| [Console functions](console-functions.md#under-the-community-patches) | ~30 functions registered by `IFC22.dll`, plus four vanilla functions replaced by no-op stubs |
| [Global variables](global-variables.md#under-the-community-patches) | New `$pref::` families, `$Font::Substitute`, per-client auth fields, and vanilla values the patch overwrites |
| [File formats](file-formats.md#under-the-community-patches) | `.sdft` fonts, RC2a's `.rb`, and `.ifr` going inert |
| [Class hierarchy](class-hierarchy.md#under-the-community-patches) | No new classes — the console surface is the extension mechanism |
| [Datablock classes](datablock-classes.md#under-the-community-patches) | No new types; `EffectProfile` inert on the QoL patch |
| [Source tutorial index](source-tutorial-index.md#the-corpus-predates-every-patch) | What the 2002-era corpus could not have known |
