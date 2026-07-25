# Your first mod

A complete, working mod in about ten minutes. It changes something visible in-game, uses the correct
override mechanism, and does not require you to copy a single line of Sierra's code.

## Goal

Make the spinfusor's blast radius larger, and print a message when the server starts. Small changes, but
they exercise the whole pipeline: mod folder, entry script, package override, datablock modification,
launch, verify.

## Step 1 — Create the mod folder

Beside `base/` and `Classic/`, create:

```
GameData/
└── MyMod/
    └── scripts/
        └── autoexec/
```

That is the entire required structure. A mod holds only the files it changes; everything else falls
through to `base/`.

## Step 2 — Write the entry script

The engine automatically executes every `.cs` file it finds in `scripts/autoexec/` **[script]**. From
`console_end.cs`:

```php
//exec any user created .cs files found in scripts/autoexec (order is that returned by the OS)
function loadCustomScripts()
{
   %path = "scripts/autoexec/*.cs";
   for( %file = findFirstFile( %path ); %file !$= ""; %file = findNextFile( %path ) )
       exec( %file );
}
loadCustomScripts();
```

This is your mod's front door. Create `GameData/MyMod/scripts/autoexec/mymod.cs`:

```php
//------------------------------------------------------------------------------
// MyMod — entry point
//------------------------------------------------------------------------------

echo("MyMod: autoexec loaded");

package MyMod
{
   // Runs on the server once a mission has finished loading.
   function DefaultGame::missionLoadDone(%game)
   {
      Parent::missionLoadDone(%game);

      echo("MyMod: mission loaded, applying tweaks");

      // Widen the spinfusor's blast radius.
      DiscProjectile.damageRadius = 12.0;
   }
};

activatePackage(MyMod);
```

Three things are happening:

1. **`package MyMod { … }`** declares an override group. Nothing inside takes effect until it is activated.
2. **`Parent::missionLoadDone(%game)`** calls the version of the function that existed before your package
   was activated — Sierra's, in `scripts/defaultGame.cs:1439` **[script]**. Always call `Parent::` unless
   you deliberately want to replace the original.
3. **`activatePackage(MyMod)`** switches the override on.

`DefaultGame::missionLoadDone` is a good first hook because it runs on the server after every datablock
file has been executed and the mission is in place — so everything you might want to modify exists.
[Gametypes](../05-gameplay-systems/gametypes.md) lists the rest of the `DefaultGame::` callback surface.

`Classic/scripts/autoexec/minivstationx.cs` uses exactly this shape **[script]** — a `package` block
wrapping one overridden function, `Parent::` called first, `activatePackage()` at the bottom of the file.
You are following a pattern the shipped game uses.

## Step 3 — Launch it

```bash
Tribes2.exe -nologin -mod MyMod
```

`-nologin` skips the (long dead) WON login and drops you straight into offline mode.
`-mod MyMod` puts `MyMod/` on the mod path stack ahead of `base/`. **[binary]**

Start a LAN game from the menu. In the console (see step 5) you should see:

```
MyMod: autoexec loaded
MyMod: mission loaded, applying tweaks
```

Fire a spinfusor at a wall and stand a little further away than usual. You should still take damage.

## Step 4 — Delete stale `.dso` files after every edit

The engine compiles each `.cs` to a `.cs.dso` and prefers the compiled form on later loads **[binary]**.
When your edit appears to do nothing, this is almost always why.

Sierra's own launcher does this before every run **[script]**:

```bat
del .\base\scripts\*.dso 1> nul 2>&1
del .\base\scripts\autoexec\*.dso 1> nul 2>&1
del .\Classic\scripts\*.dso 1> nul 2>&1
del .\Classic\scripts\autoexec\*.dso 1> nul 2>&1
```

Write your own launcher batch file and do the same for `MyMod/`:

```bat
@echo off
del .\MyMod\scripts\*.dso 1> nul 2>&1
del .\MyMod\scripts\autoexec\*.dso 1> nul 2>&1
del .\MyMod\scripts\weapons\*.dso 1> nul 2>&1
start Tribes2.exe -nologin -mod MyMod
```

Get in the habit now. It costs nothing and saves hours.

## Step 5 — See the console

You need the console to develop. Two ways in:

- **In-game console** — the tilde key (`~`) by default.
- **Windows console window** — `enableWinConsole(true);`, or launch with `-dedicated`, which turns it on
  automatically **[script]**.

Log everything to a file by putting this at the top of your entry script:

```php
setLogMode(2);   // 2 = append to console.log
```

See [Debugging](../06-shipping/debugging.md) for the rest.

## Step 6 — Add a real content file

`scripts/autoexec/` is for entry points and small tweaks. Real content goes in its own file that your
entry script `exec`s.

Create `GameData/MyMod/scripts/weapons/bigDisc.cs`:

```php
//------------------------------------------------------------------------------
// MyMod — a second spinfusor variant
//------------------------------------------------------------------------------

datablock LinearProjectileData(BigDiscProjectile) : DiscProjectile
{
   indirectDamage   = 0.75;
   damageRadius     = 15.0;
   kickBackStrength = 3000;
   dryVelocity      = 70;
};
```

Note the `: DiscProjectile` — datablock inheritance. You get every field of `DiscProjectile` and override
only the four you name. See [Datablocks](../02-engine-model/datablocks.md).

Then load it from your entry script:

```php
exec("scripts/weapons/bigDisc.cs");
```

Because the path is *relative*, the engine resolves it through the mod path stack: it finds
`MyMod/scripts/weapons/bigDisc.cs` because `MyMod/` is searched first. Had you not shipped that file, the
same call would have fallen through to `base/`.

> **Timing caveat.** `scripts/autoexec/*.cs` runs at line 25 of `console_end.cs`. The server's datablock
> files are not executed until `CreateServer()` runs, much later **[script]**. So `DiscProjectile` does not
> exist yet at autoexec time — which is exactly why the tweak in step 2 lives inside `missionLoadDone`
> rather than at file scope. Declaring your *own* datablocks that inherit from base ones has the same
> constraint: `exec` them from a server-side hook, not from the top of your autoexec file.
>
> Package *declaration* is not subject to this. `Classic/scripts/autoexec/minivstationx.cs` declares and
> activates a package at autoexec time whose `Parent::` target lives in `scripts/station.cs`, executed far
> later **[script]** — overrides bind by name, not by definition order. See
> [Boot sequence](../02-engine-model/boot-sequence.md) and [Packages](../02-engine-model/packages.md).

## Two ways to override, and when to use each

| Approach | How | Use when |
|---|---|---|
| **Package override** | `package X { function Foo() { Parent::Foo(); … } }` | Almost always. Composable with other mods, survives base-game changes, self-documenting. |
| **File shadowing** | Ship `MyMod/scripts/server.cs` to replace `base`'s | You are rewriting a file wholesale. This is how the `Classic` mod works — it ships its own `server.cs`, `player.cs`, `weapons.cs`, and so on. **[script]** |

File shadowing is legitimate — Sierra shipped a mod that uses it — but it makes your mod incompatible
with any other mod that shadows the same file, and it pins you to one version of the base code. Prefer
packages, and shadow only when you are genuinely replacing a whole subsystem.

## Under the community patches

This whole walkthrough works unchanged on a patched install. Two notes:

**On the QoL patch**, `scripts/autoexec/` is entirely yours — the patch ships no files there, using a
loose `console_client_patches.cs` executed by `IFC22.dll` instead **[binary]**. Your package activates
after the patch's, so it sits outermost in the stack and your `Parent::` calls chain through the patch's
overrides to vanilla.

**On RC2a**, the patch *does* ship three files in `scripts/autoexec/` — `t2csri_IRCfix.cs`,
`t2csri_list.cs`, `t2csri_serv.cs` — inside `base/T2csri.vl2` **[patch-script]**. They and your entry
script are executed in whatever order the OS returns.

**If the [support pack](../09-support-pack/README.md) is installed**, it adds a fourth:
`scripts/autoexec/autoload_launcher.cs` **[support-script]**.

Avoid the `t2csri_` and `autoload_` prefixes, and if your setup work
depends on any of them having loaded, defer it:

```php
schedule(0, 0, myModDeferredSetup);
```

RC2a's own `t2csri_serv.cs` uses exactly that idiom **[patch-script]**.

Neither patch touches `DefaultGame::missionLoadDone`, `DiscProjectile`, or anything else this walkthrough
uses. See [Modding against a patched install](../07-community-patches/modding-against-a-patched-install.md).

## What to read next

- [Mod paths and overrides](../02-engine-model/mod-paths-and-overrides.md) — why `-mod MyMod` finds your files
- [Packages](../02-engine-model/packages.md) — the override mechanism in full
- [Datablocks](../02-engine-model/datablocks.md) — what you were actually modifying in step 2
- [Weapons](../03-content-recipes/weapons.md) — build a complete new weapon
- [07 · Community Patches](../07-community-patches/README.md) — what your users are actually running
