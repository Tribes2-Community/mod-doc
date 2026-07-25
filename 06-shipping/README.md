# 06 · Shipping

Getting your mod out of your development folder and onto other people's machines, and finding out why it
does not work when it does not work.

| Page | Read it for |
|---|---|
| [Packaging](packaging.md) | Mod folder layout, building a `.vl2`, `.dso` compilation, what to distribute |
| [Hosting and testing](hosting-and-testing.md) | LAN, listen, and dedicated servers; PURE mode; a fast test loop |
| [Debugging](debugging.md) | The console, `trace`, `dump`, the telnet debugger, and the errors you will actually hit |

## The short version

- **A mod is a folder.** `GameData/MyMod/` with `scripts/` inside it. Zip it and that is your distribution.
- **Server-side mods need no client download** — datablocks are transmitted at mission start. New *art*
  and new *GUI* do need one.
- **Delete `.dso` files** before distributing, or ship only `.dso` files if you want to obscure your
  source. Never ship a mix of stale ones.
- **`-mod` disables PURE**, so every modded server is a non-PURE server. That is normal.

## Before you release

| Check | Why |
|---|---|
| Fresh install test | Your dev folder has leftovers; a clean install does not |
| `.dso` files cleaned | Stale compiled scripts are the number one support question |
| Console clean on load | Errors on startup mean something did not register |
| Dedicated server test | Half of all mod bugs only appear without a canvas |
| Bots tested | New content is invisible to bots unless you told the AI about it |
| A second client connects | Datablock transmission, ghosting, **and the patch's authentication phase** only show with a real remote client |
| README with the launch command | Users will not guess `-nologin -mod MyMod` |

## Under the community patches

Your users are on a patched install, so ship and test for one.

| | |
|---|---|
| **Test loop** | Unchanged. `-nologin -mod MyMod` works the same. |
| **The one new must-do test** | Connect a **real remote client**. `local` connections skip the patch's authentication phase entirely, so a whole class of server-mod bug is invisible on one machine. See [Hosting and testing](hosting-and-testing.md#under-the-community-patches). |
| **Never ship patch files** | `IFC22.dll`, `t2csri.vl2`, `console_client_patches.cs` — not yours to redistribute, and versions move independently. |
| **Never shadow patch paths** | `t2csri/*` and `base/loginScreens.cs` are claimed. Shadowing them breaks authentication. |
| **Say what you tested against** | "TribesNEXT preview 20250922" in the readme saves everyone time. |
| **New failure modes** | Listed in [Debugging](debugging.md#under-the-community-patches). |
