# Text and messaging

Four ways to put text in front of a player, each with a different lifetime and destination.

| Mechanism | Where it appears | Lifetime |
|---|---|---|
| `messageClient` / `messageTeam` / `messageAll` | The chat log | Scrolls away |
| `centerPrint` | Large, centre screen | Timed |
| `bottomPrint` | Above the HUD | Timed |
| `echo` / `error` / `warn` | The console | Permanent in the log |

## The message system

Server side **[script]**:

```php
function messageClient(%client, %msgType, %msgString, %a1, %a2, … , %a13)
function messageTeam(%team, %msgType, %msgString, %a1, %a2, … , %a13)
function messageAll(%msgType, %msgString, %a1, %a2, … , %a13)
```

| Argument | Purpose |
|---|---|
| `%client` / `%team` | Recipient |
| `%msgType` | A **tagged string** identifying the message type. `""` for plain chat. |
| `%msgString` | The text, with `%1`–`%13` substitution slots |
| `%a1`–`%a13` | Substitution values |

Real uses **[script]**:

```php
messageClient(%obj.client, 'MsgRepairPackOn', '\c2Repair pack activated.');

messageClient(%plyr.client, 'MsgTeamDeploySuccess', "");

messageClient(%targetObject.client, 'msgTeamConcussionGrenade',
              '\c1You were hit by %1\'s concussion grenade.',
              getTaggedString(%sourceObject.client.name));
```

Three conventions to copy:

1. **The type is single-quoted** — it is a tagged string that crosses the network as an integer.
2. **`%1` slots rather than string concatenation.** This keeps the format string interned and cheap, and
   is essential for anything localisable.
3. **A message with an empty body still carries a type.** `messageClient(%client, 'MsgTeamDeploySuccess', "")`
   sends no text at all — the *type* is the payload, and the client reacts to it. This is a genuine RPC
   channel disguised as chat.

### Client-side callbacks

Register a handler for a message type **[script]**:

```php
function addMessageCallback(%msgType, %func)
{
   for(%i = 0; (%afunc = $MSGCB[%msgType, %i]) !$= ""; %i++)
   {
      // only add each callback once
      if(%afunc $= %func)
         return;
   }
   $MSGCB[%msgType, %i] = %func;
}
```

and the dispatcher **[script]**:

```php
function clientCmdServerMessage(%msgType, %msgString, %a1, … , %a10)
{
   %tag = getWord(%msgType, 0);
   for(%i = 0; (%func = $MSGCB["", %i]) !$= ""; %i++)
      call(%func, %msgType, %msgString, %a1, … , %a10);      // ← "" sees everything

   if(%tag !$= "")
      for(%i = 0; (%func = $MSGCB[%tag, %i]) !$= ""; %i++)
         call(%func, %msgType, %msgString, %a1, … , %a10);
}
```

So:

```php
addMessageCallback('MsgClientJoin', myModOnClientJoin);   // one type
addMessageCallback("", myModSeeEverything);              // all messages
```

`scripts/message.cs` is loaded at line 16 of `console_end.cs`, deliberately before the autoexec loop, with
the comment *"message.cs is loaded so autoexec can add new message callbacks"* **[script]**. Register
yours from your autoexec script.

This is the cleanest client-side extension point in the game: **a client mod can react to server events
without the server knowing it exists.**

## Colour codes

`\c<n>` sets the colour of the rest of the line. Usage across the shipped scripts **[script]**:

| Code | Uses | Convention in the shipped scripts |
|---|---|---|
| `\c0` | 457 | Default / plain |
| `\c1` | 92 | Warnings, being hit |
| `\c2` | 222 | Success, positive status |
| `\c3` | 24 | Emphasis |
| `\c4` | 8 | Rare |
| `\c5` | 21 | Rare |
| `\c6` | 7 | Rare |
| `\c7` | 7 | Rare |
| `\c8` | 6 | Rare |
| `\c9` | 10 | Rare |

The actual RGB values come from the client's message HUD profile, so codes are *semantic*, not literal
colours — which means they respect the player's settings. Use `\c2` for good news and `\c1` for bad, as
the shipped code does, and your messages will look native.

```php
'\c2Repair pack activated.'
'\c2Surface is too steep to place this item on.%1'
'\c1You were hit by %1\'s concussion grenade.'
```

Note `\'` to escape an apostrophe inside a single-quoted tagged string.

## Embedded sounds

`~w` followed by a path plays a WAV alongside the text **[script]**:

```php
%errorSnd = '~wfx/misc/misc.error.wav';
```

The handler splits the message at the marker, plays the sound if it is under
`$MaxMessageWavLength` (5200 ms), and prints the remaining text. See [Audio](../03-content-recipes/audio.md#sound-in-chat-messages).

## Centre and bottom print

`scripts/centerPrint.cs` **[script]**:

```php
$CenterPrintSizes[1] = 20;
$CenterPrintSizes[2] = 36;
$CenterPrintSizes[3] = 56;

function centerPrint( %client, %message, %time, %lines )
{
   if( %lines $= "" || ((%lines > 3) || (%lines < 1)) )
      %lines = 1;

   commandToClient( %client, 'CenterPrint', %message, %time, %lines );
}

function bottomPrint( %client, %message, %time, %lines )
{
   if( %lines $= "" || ((%lines > 3) || (%lines < 1)) )
      %lines = 1;

   commandToClient( %client, 'BottomPrint', %message, %time, %lines );
}
```

| Function | Recipients |
|---|---|
| `centerPrint(%client, %message, %time, %lines)` | One client |
| `bottomPrint(%client, %message, %time, %lines)` | One client |
| `centerPrintAll(%message, %time, %lines)` | Everyone |
| `bottomPrintAll(%message, %time, %lines)` | Everyone |
| `clearCenterPrint(%client)` / `clearBottomPrint(%client)` | Clear |
| `ClearCenterPrintAll()` / `ClearBottomPrintAll()` | Clear for everyone |

| Argument | Meaning |
|---|---|
| `%time` | Seconds to display. The client-side signature comments say so explicitly **[script]**: `function clientCmdCenterPrint( %message, %time, %lines ) // time is specified in seconds` |
| `%lines` | `1`, `2`, or `3` — selects the text size from `$CenterPrintSizes`. **1 is largest.** Anything outside the range is clamped to `1`. |

The `All` variants skip AI clients **[script]**:

```php
%count = ClientGroup.getCount();
for (%i = 0; %i < %count; %i++)
{
   %cl = ClientGroup.getObject(%i);
   if( !%cl.isAIControlled() )
      commandToClient( %cl, 'centerPrint', %message, %time, %lines );
}
```

Copy that `isAIControlled()` guard in any broadcast loop you write — sending client commands to bots is
wasted work and can produce console errors.

`loadMission` clears both at every mission change **[script]**:

```php
ClearCenterPrintAll();
ClearBottomPrintAll();
```

## Tagged strings

Player names and other repeated strings travel as integer tags. Convert at the boundaries:

| Call | Direction |
|---|---|
| `addTaggedString(%text)` | Text → tag |
| `getTaggedString(%tag)` | Tag → text |
| `detag(%tagged)` | Strip the tag wrapper from a received string |

```php
$TeamName[$index] = addTaggedString($Host::TeamName[$index]);

messageClient(%targetObject.client, 'msgTeamConcussionGrenade',
              '\c1You were hit by %1\'s concussion grenade.',
              getTaggedString(%sourceObject.client.name));

%message = detag( %msgString );
```

**`%client.name` is a tag, not text.** Passing it directly into a message body prints a number. Wrap it in
`getTaggedString()`. This is the most common messaging bug in new mods.

## Chat

Client → server **[script]**:

```php
commandToServer( 'MessageSent', %text );
```

Server handlers **[script]**:

```php
function serverCmdMessageSent(%client, %text)      { … }
function serverCmdTeamMessageSent(%client, %text)  { … }
```

These are the hooks for chat commands. A package override that inspects `%text` for a prefix and handles
it, otherwise calling `Parent::`, is the standard way to add server chat commands:

```php
package MyMod
{
   function serverCmdMessageSent(%client, %text)
   {
      %msg = detag(%text);
      if (getSubStr(%msg, 0, 1) $= "!")
      {
         myModHandleCommand(%client, %msg);
         return;
      }
      Parent::serverCmdMessageSent(%client, %text);
   }
};
```

> **Validate.** `serverCmd` functions are callable by any client with any arguments. Check what `%client`
> is allowed to do before acting. See
> [Client/server split](../02-engine-model/client-server-split.md#function-name-conventions).

Spam control is already present — `message.cs` has a `$SPAM_MESSAGE` path with a wait timer **[script]**.

## Console output

| Call | Use |
|---|---|
| `echo(%text)` | Normal output |
| `warn(%text)` | Warning |
| `error(%text)` | Error — shows in red |

Used liberally by the shipped code for both diagnostics and, in a few places, deliberate logging:

```php
echo("LOADING MISSION: " @ %missionName);
echo("GOT DATA BLOCKS DONE FOR: " @ %client);
error( "Failed to open the EULA file!" );
```

There is also a gated logger **[script]**:

```php
function logEcho(%msg)
{
   if($LogEchoEnabled)
      echo("LOG: " @ %msg);
}
```

Worth copying the pattern — a `$MyMod::Debug` flag gating your own `echo` calls means you can ship with
diagnostics in place and off by default.

See [Debugging](../06-shipping/debugging.md).

## The message HUD

`addMessageHudLine(%message)` appends to the chat log; `GuiMessageVectorCtrl` renders it. The default
handler **[script]**:

```php
function defaultMessageCallback(%msgType, %msgString, %a1, … , %a10)
{
   if ( %msgString $= "" )
      return;

   %message = detag( %msgString );
   …
   addMessageHudLine( %message );
}
```

Note the early return on an empty body — this is what makes type-only messages (the RPC channel described
above) print nothing.

## Under the community patches

`messageClient` / `messageTeam` / `messageAll`, the `$MSGCB` callback system, colour codes, tagged
strings, `centerPrint` / `bottomPrint`, and the `~w` sound marker are all **unchanged**.

Two filters are inserted on the inbound client path.

### Chat tags are filtered

`MessageVector::pushBackLine` and `MessageVector::validateTag` are overridden to strip `<t2server:>` and
`<tribe:>` tags out of incoming chat **[patch-script]** — a guard against messages that would otherwise
inject clickable link markup into other players' chat logs.

**If your mod sends custom markup in chat text, expect it to be filtered.** Send structured data as a
*message type* with arguments instead:

```php
messageClient(%client, 'MyModEvent', "", %arg1, %arg2);
```

That is the RPC-shaped use of the message system described above, and it passes through untouched.

### A bad-word filter runs on inbound messages

`clientCmdChatMessage` is overridden to apply `filterString()` when `$pref::enableBadWordFilter` is set
**[patch-script]**. Client-side and user-toggleable. Vanilla `containsBadWords()` / `addBadWord()` still
exist.

### IRC

`IRCClient::connect` is overridden so a connection only fires when `JoinChatDlg` is awake
**[patch-script]**. RC2a additionally packages `GetIRCServerList`, `IRCClient::notify`, and
`IRCClient::away`, and rewrites `$IRCClient::NickName` from the auth info at file scope **[patch-script]**.

The in-game IRC client is largely vestigial on both patches; the QoL patch deactivates the EMAIL, BROWSER,
and CHAT launch tabs entirely.

### Message callbacks still register from autoexec

`scripts/message.cs` is still executed at line 16 of `console_end.cs`, before the autoexec glob
**[script]**, so `addMessageCallback()` from your entry script works exactly as documented above. Neither
patch touches this.

## Related

- [Client/server split](../02-engine-model/client-server-split.md) — the transport under all of this
- [HUD](hud.md) — the HUD elements messages interact with
- [Audio](../03-content-recipes/audio.md) — the `~w` sound marker
- [GUI system](gui-system.md) — `GuiMLTextCtrl` markup, which is a separate tag syntax
- [TribesNEXT QoL patch](../07-community-patches/tribesnext-qol.md#chat) — the chat overrides
