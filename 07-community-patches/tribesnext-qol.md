# TribesNEXT QoL patch

The current TribesNEXT patch — preview build **20250922** at time of writing. This page covers what it
puts on disk, how it gets into the script VM, and everything it overrides that a mod author might collide
with.

## What lands on disk

Beside `Tribes2.exe` in `GameData/`:

| File | Size | Role |
|---|---:|---|
| `IFC22.dll` | 2.0 MB | **The patch itself.** Replaces the vendor Immersion driver. |
| `Mss32.dll` | 462 KB | Proxy routing audio to OpenAL Soft |
| `soft_oal.dll` | 3.4 MB | OpenAL Soft backend |
| `SDL3.dll` | 2.2 MB | Modern window and input |
| `libcurl.dll` | 3.3 MB | HTTPS client |
| `curl-ca-bundle.crt` | 234 KB | CA bundle |
| `discord_game_sdk.dll` | 3.2 MB | Discord Rich Presence |
| `console_client_patches.cs` | 47 KB | The master TorqueScript patch |
| `console_client_discord.cs` | 9.7 KB | Discord hooks |
| `SierraUp.exe` | 6 KB | No-op stub replacing Sierra's dead updater |
| `Mss*.m3d` / `Mp3dec.asi` / `Reverb3.flt` | various | Audio codec shims |
| `base/t2csri.vl2` | 1.3 MB | The patch content archive |

### The IFC22 hijack

Vanilla `IFC22.dll` is the **Immersion Corporation TouchSense runtime** — force-feedback hardware support.
`Tribes2.exe` imports 11 mangled C++ symbols from it (`CImmCompoundEffect`, `CImmDevice`, `CImmProject`)
**[binary]**.

TribesNEXT ships a same-named DLL that:

1. Stubs those 11 exports so the import table resolves and the engine starts.
2. Adds `AmdPowerXpressRequestHighPerformance` and `NvOptimusEnablement` exports, which AMD and NVIDIA
   drivers read to select the discrete GPU on hybrid laptops.
3. Registers around 30 TorqueScript console functions with the engine at `DllMain` time.

| | Vanilla `IFC22.dll` | TribesNEXT `IFC22.dll` |
|---|---|---|
| Origin | Immersion Corporation | TribesNEXT |
| Build | 2000-11-04, MSVC 6.0 | 2025-09-22, VS2022 |
| Size | 192,512 bytes | 2,026,528 bytes |
| Exports | 573 mangled `CImm*` symbols | 20 — 11 stubs plus the GPU hints |
| Real work | Drives `.ifr` force-feedback files | Registers console functions, crypto, HTTPS |

**Consequence for modders: force feedback does nothing on a patched install.** `EffectProfile` datablocks
still parse and are still referenced by `AudioProfile.effect`, but the effects never play. Declaring them
remains harmless — see [Audio](../03-content-recipes/audio.md#force-feedback--effectprofile).

`Mss32.dll` is separately replaced, for audio, and is unrelated to the IFC22 hijack.

## How the patch reaches the script VM

`console_client_patches.cs` is a **loose file at the `GameData/` root**. It is not inside any archive and
not on the mod path stack — the same position as `console_start.cs`.

`IFC22.dll` contains the literal string `console_client_patches.cs`, alongside `console_client_discord.cs`
and embedded TorqueScript fragments it evaluates directly **[binary]**:

```
exec("t2csri/serverGlue.cs");exec("console_end.cs");function dedCheckLoginDone(){$LoginName = "";$LoginPassword = "";}
exec("t2csri/serverList.cs");
```

So the DLL injects script into the boot chain itself, rather than relying on a file in
`scripts/autoexec/`. **[inferred]** — the strings are decisive that IFC22 carries and evaluates script;
the exact call site inside the DLL has not been traced.

Two things follow, and both matter:

- **A mod cannot shadow or intercept `console_client_patches.cs`.** It is off the mod path stack.
- **The patch's own script runs regardless of `-mod`.** Your mod and the patch always coexist.

Note also that the embedded fragment **redefines `dedCheckLoginDone`** — the vanilla WON polling function
from `console_start.cs` — to a stub that simply clears the login globals. That is how a dedicated server
gets past a login step whose servers no longer exist.

## The version gate

`console_client_patches.cs` opens with **[patch-script]**:

```php
if (isPackage(console_client_patches) || getT2VersionNumber() != 25034) return;

package console_client_patches
{
   …
};

activatePackage(console_client_patches);
```

Two guards:

- **Double-load protection** — if the package already exists, bail.
- **Build lock** — the patch binds specifically to build 25034 and silently does nothing on any other
  binary. No error, no message.

This is worth copying for your own mod; see
[Packaging](../06-shipping/packaging.md#versioning-against-build-25034).

## `base/t2csri.vl2`

A standard PKZIP archive dropped into `base/`, so it joins the normal mount:

```
fonts/Sui Generis.sdft
fonts/Univers.sdft
fonts/Univers Bold.sdft
fonts/Univers Condensed.sdft
fonts/Univers Condensed Bold.sdft
fonts/Univers italic.sdft
loginScreens.cs                 (+ .dso)
t2csri/authconnect.cs           (+ .dso)   auth-server lookup
t2csri/authinterface.cs         (+ .dso)   login UI bindings
t2csri/clientSide.cs            (+ .dso)   client auth handshake
t2csri/clientSideClans.cs       (+ .dso)
t2csri/glue.cs                  (+ .dso)   client-side loader
t2csri/ipv4.cs                  (+ .dso)
t2csri/loginDialogs.gui         (+ .dso)   replacement login UI
t2csri/serverglue.cs            (+ .dso)   server-side loader
t2csri/serverList.cs            (+ .dso)   server browser
t2csri/serverSide.cs            (+ .dso)   server auth handshake
t2csri/serverSideClans.cs       (+ .dso)
textures/tn_logo.png
t2csri_eula.txt
```

**It ships no `scripts/autoexec/` entries.** The mod entry point documented in
[Your first mod](../01-getting-started/your-first-mod.md) is untouched by this patch. (RC2a is different —
see [RC2a](rc2a.md).)

Alphabetically `t2csri.vl2` sorts between `shapes.vl2` and `textures.vl2`, so under the reverse-alpha
archive scan it outranks `base.vl2` and `scripts.vl2` but is outranked by `textures.vl2`, `voice.vl2`, and
`zz_Classic_client_v1.vl2`. It declares no paths that collide with vanilla content, so the ordering is
academic — but it is worth knowing if you ship an archive of your own. See
[Mod paths and overrides](../02-engine-model/mod-paths-and-overrides.md).

## The packages

Three packages may be active on a patched install where vanilla has one.

| Package | Where | Scope | Activated |
|---|---|---|---|
| `PackageFix` | `console_start.cs` | Vanilla — fixes package deactivation ordering | Always, first |
| `console_client_patches` | Loose root file | Client-side QoL: UI, audio, video, input, chat | Always, at boot |
| `t2csri_server` | `t2csri/serverSide.cs` | Server-side auth | `if ($PlayingOnline && !isActivePackage(t2csri_server))` **[patch-script]** |

Plus the vanilla gametype packages, activated and deactivated per mission as normal.

```php
listPackages();
```

is the way to see the live stack. See [Packages](../02-engine-model/packages.md).

## Everything `console_client_patches` overrides

The complete list, from the package block **[patch-script]**. If your mod packages any of these, read
[Modding against a patched install](modding-against-a-patched-install.md) first.

### Server lifecycle

```php
function CreateServer(%mission, %missionType)
{
   Parent::CreateServer(%mission, %missionType);
   if (!isActivePackage(t2csri_server))
      exec("t2csri/serverGlue.cs");
}
```

**This is the one most likely to collide with a mod**, because `CreateServer` is also the natural place
for a mod to load its own datablock files. The patch calls `Parent::` first, so package ordering resolves
it — but see [the collision guidance](modding-against-a-patched-install.md#creating-server-content).

`t2csri/serverglue.cs` then loads the server auth stack **[patch-script]**:

```php
if (isObject(ServerGroup))
{
   // load the torque script components
   exec("t2csri/serverSide.cs");
   exec("t2csri/serverSideClans.cs");
   exec("t2csri/bans.cs");
   exec("t2csri/ipv4.cs");

   // get the global IP for sanity testing purposes
   schedule(32, 0, ipv4_getInetAddress);
}
```

### Client and connection

| Override | Effect |
|---|---|
| `allocClientTarget` | Forces `%skinTag = $teamSkin[%client.team]` for SinglePlayer and AI so training-team skins are honoured |
| `ghostAlwaysObjectReceived` | Updates the loading progress bar and forces a repaint |
| `ClientReceivedDataBlock(idx, total)` | Same, for datablock transmission |
| `GameConnection::onEarlyCommand` | Pre-connection command handling |
| `sceneLightingComplete` | Cancels the loading-GUI poll schedule |

### UI and video

| Override | Effect |
|---|---|
| `Canvas::setContent` | Disables vsync while `LoadingGui` or `DebriefGui` is active |
| `dashboardHud::onResize` | Repositions the HUD per `$pref::Video::uiAspect`, with special cases at 480 and 600 height |
| `MessageHud::open` | Extends to the full canvas extent |
| `GuiMessageVectorCtrl::onAdd` | Message log setup |
| `ServerInfoDlg::onWake` | Restores window geometry from `$pref::ServerBrowser::InfoWindowExtent`, clamped to the UI aspect |
| `OptionsDlg::applyGraphicChanges`, `OptionsDlg::saveSettings` | Extended video settings |
| `OP_FullScreenTgl::onAdd` | **Rebuilds the entire Video options panel** — anti-aliasing, framerate limit, render scale, FOV, UI scale, UI aspect |
| `LaunchToolbarMenu::add` | Injects a TRAINING entry when offline |
| `LaunchTabView::addLaunchTab` | Deactivates the dead EMAIL / BROWSER / CHAT tabs |
| `GGIntroGui::onSleep` | Intro handling |
| `isTextureFlushRequired`, `onMissingTexture`, `onUpdateRenderTargets` | Texture and render-target management |

The rebuilt Video panel offers framerate limits of
`60/90/120/144/165/240/288/360/480/500/640/720/1000`, a render scale of 5–200 %, FOV 45–120°, a UI scale
slider, and a UI aspect selector (Stretch / 16:9 / 16:10 / 4:3 / 5:4) **[patch-script]**.

The DXGI interop toggle has a 15-second confirmation timer that auto-reverts if you do not confirm —
a sensible pattern for any risky graphics option.

### Audio

| Override | Effect |
|---|---|
| `audioUpdateProvider`, `audioIsEnvironmentProvider` | Driver and EAX capability detection |
| `getRandomTrack` | Enumerates `music/*.mp3` |
| `MP3Audio::playTrack` | Plays MP3 via `alxPlayMusic`, or FLAC when the OpenAL provider is active and a FLAC file exists |

`$pref::Audio::drivers = "Miles\tOpenAL"` — both are offered **[patch-script]**.

### Input

| Override | Effect |
|---|---|
| `JoystickConfigDlg::onWake` | Enumerates axes via `getJoystickAxes(0)` and builds a tab per axis |
| `joyYaw`, `joyPitch` | Maps joystick axes to mouse rate |
| `joystickFire`, `joystickJet` | Trigger bindings |
| `RemapInputCtrl::onInputEvent` | Rebinds the console key during remapping |
| `clientCmdSetDefaultVehicleKeys`, `clientCmdSetPilotVehicleKeys` | Vehicle key sets |

### Chat

| Override | Effect |
|---|---|
| `MessageVector::pushBackLine`, `MessageVector::validateTag` | Filters `<t2server:>` and `<tribe:>` tags out of inbound chat |
| `clientCmdChatMessage` | Applies `filterString()` when `$pref::enableBadWordFilter` is set |
| `IRCClient::connect` | Only connects when `JoinChatDlg` is awake |

### Login

`StartLoginProcess` is overridden to delete the vanilla `LoginDlg` and `CreateAccountDlg` and `exec`
`loginScreens.cs` — the TribesNEXT login UI — then position the TN branding **[patch-script]**.

### Mission editor

`EPainter::setup`, `EPainter::onAdd`, and `EPainterChangeMat` extend the terrain painter from six material
slots (0–5) to eight (0–7) **[patch-script]**.

## Client-side defaults it changes

`initClientPatches()`, scheduled 32 ms after `GM_WarriorPane::onAdd` **[patch-script]**:

| Change | Value |
|---|---|
| `$pref::Input::KeyboardEnabled` | `0` |
| `navHud` opacity | 0.5 → 0.75 |
| `reticleHud` opacity | 0.5 → 0.85 |
| Joystick binds | "Fire Weapon" → `joystickFire`; "Jet Pack" → `joystickJet` |
| `IPEntry.maxLength` | 60 (vanilla was shorter) |
| Deleted controls | `OP_CheckEmailTgl`, `OP_ChatDisconnectTgl` — the dead Sierra services |
| Added control | `OP_EnableDepotTgl` — asset downloads, per `$pref::Net::downloadAssets` |

## Globals it sets at load

After the package block **[patch-script]**:

```php
$Font::Substitute["Univers"]                = "Saira Regular";
$Font::Substitute["Univers Condensed"]      = "Saira SemiCondensed Medium";
$Font::Substitute["Univers Bold"]           = "U001 Bold";
$Font::Substitute["Univers Condensed Bold"] = "Univers LT 57 Condensed";
$Font::Substitute["Univers italic"]         = "Univers LT 57 Condensed Oblique";
$Font::Substitute["Sui Generis"]            = "SuiGenerisRg-Regular";

$OpenGLTextureFilter[0] = "TRILINEAR";
$OpenGLTextureFilter[1] = "BILINEAR";
$OpenGLTextureFilter[2] = "NEAREST";

if ($pref::Net::PacketRateToClient < 32)
   $pref::Net::PacketRateToClient = 32;
if ($pref::Net::PacketSize < 450)
   $pref::Net::PacketSize = 450;
$pref::Net::CheckEmail = false;

addMaterialMapping("terrain/default", "color: 0.46 0.36 0.26 0.4 0.0", "sound: 0");
setFramerateLimit($pref::Engine::FramerateLimit);
```

Three of these are worth noting:

- **`$Font::Substitute`** reroutes every vanilla font name to a shipped `.sdft`. A `.gui` asking for
  `fontType = "Univers Condensed"` transparently gets `Saira SemiCondensed Medium`. Your GUI code needs no
  change; it just renders differently. See [GUI system](../04-interface/gui-system.md).
- **`$pref::Net::PacketRateToClient` is clamped to ≥ 32**, matching V12's 32 Hz tick rate.
- **`addMaterialMapping("terrain/default", …)`** supplies a fallback for unmapped terrain materials —
  relevant if you ship custom terrain.

## New console functions

Registered by `IFC22.dll` at `DllMain` **[binary]**. See
[Console functions](../reference/console-functions.md#under-the-community-patches) for the full list;
in summary:

| Group | Functions |
|---|---|
| Video | `setRenderScale`/`getRenderScale`, `setUIScale`/`getUIScale`, `setUIAspect`, `setVerticalSync`, `setFramerateLimit`, `setOpenGLAntiAliasing`, `setOpenGLTextureFilter`, `setDXGIInteropEnable` |
| Audio | `alxGetContexti`, `alxGetContextstr`, `alxIsExtensionPresent`, `alxEnableEnvironmental` |
| Input | `enableJoystick`, `getJoystickAxes`, `enableKeyboardTranslation`, `getMouseAdjustAmount` |
| Network | `enableIPv6`, `enableAssetDownloads` |
| Rendering | `enableHybridTerrain` |
| Crypto | `sha1sum` and the `t2csri_*` family |
| Class | `HTTPObject` with HTTPS support |

Plus no-op stubs for the vanilla WON entry points (`WONInit`, `WONServerLogin`) so vanilla scripts that
call them do not error.

## What it does not change

Worth stating explicitly:

- No changes to datablock semantics, the mod path stack, or `setModPaths`.
- No changes to gameplay content — weapons, armors, vehicles, damage are all vanilla.
- No anti-tamper check on `Tribes2.exe`. The patch coexists with community mods by design.
- The `scripts/autoexec/` mod entry point is untouched.

## Related

- [RC2a](rc2a.md) — the predecessor, with different collision surfaces
- [Modding against a patched install](modding-against-a-patched-install.md) — the practical consequences
- [Packages](../02-engine-model/packages.md) — the mechanism the patch is built on
- [Boot sequence](../02-engine-model/boot-sequence.md) — where the patch inserts itself
