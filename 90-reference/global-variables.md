# Global variables

`::` inside a global name is a naming convention, not a namespace operator — `$Host::Port` is one
variable whose name happens to contain colons. See
[TorqueScript](../02-engine-model/torquescript.md#variables).

There are around 1355 distinct `$pref::` globals referenced across the shipped scripts **[script]**. This
page covers the families and the ones a modder reads or writes.

## The families

| Prefix | Purpose | Persisted? |
|---|---|---|
| `$pref::` | User preferences — video, audio, input, UI | **Yes** — exported on exit |
| `$Host::` | Server configuration | Via `prefs/serverPrefs.cs` |
| `$DamageType::` | Damage type constants | No — code constants |
| `$TypeMasks::` | Collision and search masks | No — engine constants |
| `$NotDeployableReason::` | Deployment failure codes | No |
| `$Audio::` | Audio driver state | No |
| `$Camera::` | Camera tuning | No |
| `$Collision::` | Collision tuning | No |
| `$AI*` | AI weights and timings | No |
| Bare globals | `$CurrentMission`, `$LaunchMode`, `$Game::argc`, … | No |

## `$pref::` — persisted user preferences

Written out on exit **[script]**:

```php
function onExit()
{
   …
   echo("exporting pref::* to ClientPrefs.cs");
   export("$pref::*", "prefs/ClientPrefs.cs", False);
   BanList::Export("prefs/banlist.cs");
   …
}
```

and also at login **[script]**:

```php
$pref::LastLoginName = $LoginName;
export( "$pref::*", "prefs/ClientPrefs.cs", False );
```

**Anything you name `$pref::MyMod::Something` is persisted for free.** That is the correct place for
user-configurable settings in a client mod — no file handling required.

### The sub-families

| Family | Examples |
|---|---|
| `$pref::Audio::` | `masterVolume`, `effectsVolume`, `musicVolume`, `voiceVolume`, `radioVolume`, `guiVolume`, `activeDriver`, `drivers`, `channels`, `frequency`, `sampleBits`, `environmentEnabled`, `enableVoiceCapture`, `captureGainScale`, `encodingLevel`, `decodingMask`, `musicEnabled`, `voiceChannels`, `forceMaxDistanceUpdate` |
| `$pref::OpenGL::` | `driver`, `gammaCorrection`, `compressionHint`, `anisotropy`, `mipReduction`, `interiorMipReduction`, `skyMipReduction`, `disableEXTCompiledVertexArray` |
| `$pref::Video::` | `fullScreen`, resolution and device settings |
| `$pref::Input::` | `ActiveConfig`, `KeyboardTurnSpeed`, `LinkMouseSensitivity` |
| `$pref::Net::` | `PacketRateToClient`, `LagThreshold`, `DisplayOnMaster`, `CheckEmail`, `DisconnectChat` |
| `$pref::Player::` | `defaultFov`, `zoomSpeed` |
| `$pref::Shell::` | `lastBackground` and menu state |
| `$pref::Lobby::`, `$pref::Forum::`, `$pref::Email::` | Column layouts and window geometry for the built-in community UI |
| `$pref::IRCClient::` | `autoreconnect`, `awaymsg`, `banmsg`, `hostmsg`, `kickmsg`, `showJoin`, `showLeave` |
| `$pref::Interior::` | `TexturedFog` |

Standalone ones worth knowing:

| Global | Meaning |
|---|---|
| `$pref::AcceptedEULA` | EULA accepted |
| `$pref::SkipIntro` | Skip the intro movie |
| `$pref::RememberPassword` | Save the login password |
| `$pref::LastLoginName` | Last account used |
| `$pref::NoClearConsole` | Do not `cls()` on mission load — **useful during development** |
| `$pref::shadows` | Shadow detail level |
| `$pref::useImmersion` | Force feedback enabled |
| `$pref::HudMessageLogSize` | Chat log length |
| `$pref::EnableBadWordFilter` | Profanity filter |
| `$pref::MaxMessageLen` | Chat length cap |

> `$pref::NoClearConsole = true;` in your dev setup stops the console being wiped at every mission load
> **[script]**. Small, and it will save you.

## `$Host::` — server configuration

Defaults in `scripts/serverDefaults.cs` **[script]**, overridden by `prefs/serverPrefs.cs`.

| Global | Default | Meaning |
|---|---|---|
| `$Host::GameName` | `"Tribes 2 Server"` | Server name in the browser |
| `$Host::MaxPlayers` | `64` | Player cap |
| `$Host::Port` | `28000` | Listen port |
| `$Host::Password` | `""` | Join password |
| `$Host::Dedicated` | `0` | Dedicated flag |
| `$Host::BotCount` | `2` | Bots to spawn |
| `$Host::BotsEnabled` | `0` | Bots on/off |
| `$Host::TournamentMode` | `0` | Tournament rules |
| `$Host::Map`, `$Host::MissionType` | | Current map and gametype |
| `$Host::TimeLimit` | | Match length |
| `$Host::TeamDamageOn` | | Friendly fire |
| `$Host::PureServer` | | PURE mode |
| `$Host::AdminPassword`, `$Host::AdminList`, `$Host::SuperAdminList` | | Administration |
| `$Host::BanTime`, `$Host::KickBanTime` | | Ban durations |
| `$Host::NoSmurfs` | | Block duplicate identities |
| `$Host::FloodProtectionEnabled`, `$Host::MaxMessageLen` | | Chat spam control |
| `$Host::VotePassPercent`, `$Host::VoteSpread`, `$Host::VoteTime`, `$Host::allowAdminPlayerVotes` | | Voting |
| `$Host::MinBotDifficulty`, `$Host::MaxBotDifficulty` | | Bot skill range |
| `$Host::PlayerRespawnTimeout` | | Respawn delay |
| `$Host::warmupTime` | | Pre-match warmup |
| `$Host::MapPlayerLimits` | | Per-map player caps |
| `$Host::CRCTextures` | | Texture integrity checking |
| `$Host::BindAddress` | | Network interface |
| `$Host::teamName[n]`, `$Host::teamSkin[n]`, `$Host::holoName[n]` | | Team identity — converted to tagged strings at boot **[script]** |
| `$Host::Siege::Halftime` | | Siege-specific |

## Constant families

| Family | Count in shipped scripts | Documented in |
|---|---:|---|
| `$DamageType::` | 859 references | [Damage and type masks](../03-content-recipes/damage-and-typemasks.md#damage-types) |
| `$TypeMasks::` | 163 references | [Damage and type masks](../03-content-recipes/damage-and-typemasks.md#type-masks) |
| `$NotDeployableReason::` | 39 references | [Turrets and deployables](../03-content-recipes/turrets-and-deployables.md#failure-messages) |
| `$PlayerDeathAnim::` | 21 references | Death animation selection |
| `$Collision::` | 14 references | Collision tuning |
| `$Camera::` | 11 references | `$Camera::movementSpeed` — the editor/observer camera |
| `$AIWeight*`, `$AIMode*`, `$AIClient*` | — | [AI and bots](../05-gameplay-systems/ai-bots.md#the-weight-bands) |

Audio channel constants **[script]**:

```
$EffectAudioType   $VoiceAudioType   $ChatAudioType
$RadioAudioType    $GuiAudioType     $MusicAudioType
```

Image slot constants:

```
$WeaponSlot        $BackpackSlot
```

## Runtime state globals

Read these; write them only if you know what you are doing.

| Global | Holds |
|---|---|
| `$CurrentMission` | Current mission name |
| `$CurrentMissionType` | Current gametype |
| `$MissionName`, `$missionSequence`, `$missionCRC` | Mission identity for ghosting and lighting |
| `$MissionRunning`, `$LoadingMission`, `$MatchStarted`, `$countDownStarted` | Match state |
| `$ServerGroup`, `$instantGroup` | Object grouping — see [Scheduling and events](../02-engine-model/scheduling-and-events.md#instantgroup) |
| `$LaunchMode` | `"Normal"`, `"Offline"`, `"DedicatedServer"`, `"Connect"`, `"Console"`, `"NavBuild"`, `"SpnBuild"`, `"Demo"`, `"HostGame"`, `"TSShow"`, `"SceneLight"`, `"InteriorView"` |
| `$PureServer`, `$SkipLogin`, `$Login`, `$PlayingOnline`, `$fromLauncher` | Boot flags |
| `$Game::argc`, `$Game::argv[n]` | Command line |
| `$platform`, `$platformVersion` | `"windows"` / `"winnt"` etc. |
| `$HostMissionCount`, `$HostMissionName[n]`, `$HostMissionFile[n]`, `$HostTypeCount`, `$HostTypeName[n]`, `$HostTypeDisplayName[n]`, `$HostMission[t,n]`, `$BotEnabled[n]` | Built by `buildMissionList()` — see [Missions](../05-gameplay-systems/missions.md) |
| `$TeamName[n]`, `$TeamSkin[n]`, `$holoName[n]` | Tagged-string team identity |
| `$Package[n]`, `$TotalNumberOfPackages` | The `PackageFix` package stack — see [Packages](../02-engine-model/packages.md) |
| `$Con::prompt` | Console prompt — becomes `"PURE% "` on a pure server |
| `$Con::logBufferEnabled`, `$LogEchoEnabled` | Logging |

## Content registration globals

The arrays your mod must extend:

| Global | Purpose | See |
|---|---|---|
| `$WeaponsHudData[n, key]`, `$WeaponsHudCount` | HUD weapon slots | [HUD](../04-interface/hud.md#weaponshuddata--registering-a-weapon) |
| `$AmmoIncrement[<AmmoName>]` | Ground pickup amount | [Ammo and inventory](../03-content-recipes/ammo-and-inventory.md#pickup-increments) |
| `$TeamDeployableMax[<ItemName>]`, `$TeamDeployedCount[team, item]` | Deployable caps | [Turrets and deployables](../03-content-recipes/turrets-and-deployables.md#team-caps) |
| `$DamageTypeText[n]` | Kill-message text | [Damage and type masks](../03-content-recipes/damage-and-typemasks.md) |
| `$MSGCB[type, n]` | Registered message callbacks | [Text and messaging](../04-interface/text-and-messaging.md#client-side-callbacks) |
| `$MinDeployDistance`, `$MaxDeployDistance` | Deployment range | [Turrets and deployables](../03-content-recipes/turrets-and-deployables.md) |
| `$HandInvThrowTimeout` | Throw cooldown, ms | [Grenades](../03-content-recipes/grenades-and-hand-inventory.md) |
| `$MaxMessageWavLength` | Embedded-WAV cap, ms | [Audio](../03-content-recipes/audio.md#sound-in-chat-messages) |

## Naming your own

Namespace them:

```php
$MyMod::Debug        = false;
$MyMod::Version      = "1.0";
$pref::MyMod::ShowExtraHud = true;      // ← persisted automatically
```

Two reasons: you will not collide with another mod, and `deleteVariables("$MyMod::*")` cleans up in one
call.

## Inspecting at runtime

```php
echo($Host::MaxPlayers);
export("$Host::*", "", false);        // print every $Host:: global to the console
export("$pref::MyMod::*", "", false);
```

`export` with an empty filename prints instead of writing. The quickest way to see what a family actually
contains.

## Under the community patches

Every vanilla global above still exists. The patches add families of their own and clamp a few values.

### Added by the QoL patch

| Global | Purpose |
|---|---|
| `$pref::Engine::FramerateLimit` | Frame cap; applied via `setFramerateLimit` at script end **[patch-script]** |
| `$pref::Video::uiAspect` | Stretch / 16:9 / 16:10 / 4:3 / 5:4 — drives `dashboardHud::onResize` |
| `$pref::Net::downloadAssets` | Asset downloads on connect |
| `$pref::ServerBrowser::InfoWindowExtent` | Server-info window geometry |
| `$pref::enableBadWordFilter` | Chat filter |
| `$Font::Substitute[<name>]` | Font remapping — see below |
| `$OpenGLTextureFilter[0..2]` | `"TRILINEAR"`, `"BILINEAR"`, `"NEAREST"` |
| `$OpenGL::maxMSAA` | Anti-aliasing ceiling, populated by the driver |
| `$DXGISupported` | Whether DXGI interop is available |

```php
$Font::Substitute["Univers"]                = "Saira Regular";
$Font::Substitute["Univers Condensed"]      = "Saira SemiCondensed Medium";
$Font::Substitute["Univers Bold"]           = "U001 Bold";
$Font::Substitute["Univers Condensed Bold"] = "Univers LT 57 Condensed";
$Font::Substitute["Univers italic"]         = "Univers LT 57 Condensed Oblique";
$Font::Substitute["Sui Generis"]            = "SuiGenerisRg-Regular";
```

Every vanilla font name is rerouted to a shipped `.sdft` **[patch-script]**. Your GUI code needs no
change; it renders differently. See [GUI system](../04-interface/gui-system.md#under-the-community-patches).

### Vanilla values the patch overwrites

**[patch-script]**, after the package block:

```php
if ($pref::Net::PacketRateToClient < 32)
   $pref::Net::PacketRateToClient = 32;         // matches V12's 32 Hz tick
if ($pref::Net::PacketSize < 450)
   $pref::Net::PacketSize = 450;
$pref::Net::CheckEmail = false;                 // the Sierra email service is gone
$pref::Audio::drivers = "Miles\tOpenAL";        // both backends offered
$pref::Input::KeyboardEnabled = 0;              // set by initClientPatches()
```

**If you set any of these from your mod, set them after the patch has run** — from a scheduled callback
or a server hook, not at autoexec file scope.

### Per-client dynamic fields added by `t2csri_server`

Set on `GameConnection` objects during authentication **[patch-script]**:

| Field | Meaning |
|---|---|
| `%client.doneAuthenticating` | `1` once the client is fully connected — **the guard to use** |
| `%client.t2csri_serverChallenge` | Challenge state; empty before the handshake starts |
| `%client.t2csri_cert` | Certificate data during the exchange |
| `%client.t2csri_authInfo` | Cached auth record returned by `getAuthInfo` |
| `%client.tterm` | The 15-second expiry schedule handle |
| `%client.tname`, `.trgen`, `.tskin`, `.tvoic`, `.tvopi` | Connection args stashed across the auth phase |

Do not reuse these names on `GameConnection`.

### Added by RC2a

| Global | Purpose |
|---|---|
| `$RubyEnabled` | `1` when the Ruby bridge is live — **the RC2a detection sentinel** |
| `$Host::TN::beat` | Minutes between master-server heartbeats (default 3) |
| `$Host::TN::echo` | Enable master-server echoes (default 1) |
| `$IRCClient::NickName` | Rewritten from the auth info at file scope |

### Added by the support pack

If `base/support.vl2` is installed **[support-script]**:

| Global | Purpose |
|---|---|
| `$AutoloadExecuted` | Guard against double execution — **the support-pack detection sentinel** |
| `$AutoloadEnabled` | `false` when launched with `-noautoload` |
| `$AutoloadIni` | `"prefs/autoload.ini"` |
| `$AutoloadLog` | `"prefs/autoload.log"` |

See [The autoload system](../09-support-pack/autoload-system.md).

### Naming, again

Avoid the `t2csri`, `TN`, and `Autoload` prefixes entirely, on globals as well as functions and packages.
Namespace yours as `$MyMod::…`.

## Related

- [TorqueScript](../02-engine-model/torquescript.md) — variable syntax and array naming
- [Launch options](../01-getting-started/launch-options.md) — the boot flags
- [Hosting and testing](../06-shipping/hosting-and-testing.md) — `$Host::` in practice
- [TribesNEXT QoL patch](../07-community-patches/tribesnext-qol.md#globals-it-sets-at-load) — the patch's globals in context
