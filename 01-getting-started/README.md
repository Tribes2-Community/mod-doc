# 01 · Getting Started

Before you write a line of TorqueScript, you need to know what is on disk, what tools open it, and how
to make the engine load your code instead of Sierra's.

| Page | Read it for |
|---|---|
| [Install anatomy](install-anatomy.md) | What every file and folder in `GameData/` does, and how to confirm you are on build 25034 |
| [What you need](what-you-need.md) | The toolchain: archive tools, text editors, and how to unpack `.vl2` |
| [Your first mod](your-first-mod.md) | A complete working mod, from empty folder to visible in-game change |
| [Launch options](launch-options.md) | Every command-line switch `console_start.cs` parses, and what each does |

## The shortest possible summary

1. Tribes 2 lives in `GameData/`. Game content is in `base/`, packed into `.vl2` archives (which are ZIP files).
2. A **mod** is a sibling folder — `GameData/MyMod/` — holding only the files you want to change.
3. You launch it with `Tribes2.exe -mod MyMod`. The engine searches `MyMod/` first and falls back to `base/`.
4. Your `.cs` scripts are compiled to `.cs.dso` on first load. Delete stale `.dso` files when you edit.

Everything else in this handbook is detail on those four sentences.

## A note on patched installs

Your Tribes 2 is almost certainly running a community patch — nothing else has worked since the WON
servers shut down in 2008. The four sentences above hold anyway: **the patches do not change how mods
work.**

What they do change is documented at the end of each affected page under **"Under the community
patches"**, and in full in [07 · Community Patches](../07-community-patches/README.md). The two pages here
with meaningful differences are
[Install anatomy](install-anatomy.md#under-the-community-patches) (different files on disk) and
[Launch options](launch-options.md#under-the-community-patches) (same switches, different destinations).
