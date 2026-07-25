# TorqueScript

Tribes 2's scripting language. It looks like C, and that similarity is a trap — it is dynamically typed,
everything is a string underneath, and several operators behave differently from their C lookalikes.

All examples in this page are taken from the shipped V12 scripts **[script]** unless marked otherwise.

## Variables

| Sigil | Scope | Example |
|---|---|---|
| `%name` | Local to the enclosing function | `%client`, `%obj`, `%amount` |
| `$name` | Global, persists for the process lifetime | `$CurrentMission`, `$Host::BotCount` |
| *(none)* | Not a variable — a bare word is a string literal or an object name | `AudioClosest3d` |

There is no declaration. Assigning to a name creates it. Reading an unset variable yields the empty
string, which compares equal to `""` and to `0`.

`::` inside a global name is **just a naming convention**, not a namespace operator:

```php
$pref::Audio::masterVolume = 0.8;
$Host::TeamName[0] = "Storm";
```

`$pref::` globals get special treatment in one place only: `export("$pref::*", "prefs/ClientPrefs.cs", False)`
writes every matching global out on exit **[script]**.

## Everything is a string

Numbers, object IDs, vectors, and booleans are all stored as strings and converted on demand.

```php
%a = "5";
%b = 5;
if (%a == %b)      // true — numeric comparison
if (%a $= %b)      // true — string comparison, "5" $= "5"
```

The practical consequence is that you must pick the right comparison operator:

| Operator | Compares | Use for |
|---|---|---|
| `==`, `!=`, `<`, `>`, `<=`, `>=` | Numerically | Numbers |
| `$=`, `!$=` | As strings | Strings, object names, datablock names |

Using `==` on strings is a common and silent bug: `"Disc" == "Mortar"` is `0 == 0`, which is **true**.

```php
if (%obj.getDataBlock().className $= Armor)     // correct
if (%data.getName() !$= "TargetingLaser")       // correct
```

## String operators

| Operator | Produces | Example |
|---|---|---|
| `@` | Concatenation, no separator | `"scripts/" @ %type @ ".cs"` |
| `SPC` | Joined with a space | `%first SPC %last` |
| `TAB` | Joined with a tab (`\t`) | Building field-separated records |
| `NL` | Joined with a newline (`\n`) | Multi-line text blocks |

`TAB` and `SPC` are heavily used — 309 and 293 occurrences respectively in the shipped scripts — because
they are how you construct the delimited strings the engine's text functions consume.

```php
%text = "<just:center>Please read the following License Agreement carefully."
      NL "You must accept this agreement in order to play"
      NL "Tribes 2.";
```

## The three-level string data model

This is the single most important idiom in the language. A string is treated as a hierarchy of
delimiters:

| Level | Delimiter | Accessors |
|---|---|---|
| **Word** | space | `getWord`, `getWords`, `setWord`, `getWordCount` |
| **Field** | tab | `getField`, `getFields`, `setField`, `getFieldCount` |
| **Record** | newline | `getRecord`, `getRecords`, `getRecordCount` |

All are zero-indexed. Usage counts in the shipped scripts: `getField` 764, `getWord` 476, `getRecord` 179.

```php
%result = WONLoginResult();          // returns a tab-separated string
%status = getField( %result, 0 );
%code   = getField( %result, 1 );
```

A position like `"-180.737 264.173 73.9045"` is just a three-word string:

```php
%x = getWord(%pos, 0);
%z = getWord(%pos, 2);
```

Transforms are seven words — position (3) then axis-angle rotation (4):

```php
%obj.setTransform("-180.737 264.173 73.9045 0 0 -0.999913 0.0206931");
```

## Arrays

Arrays are syntactic sugar over string concatenation of the name. `$Package[3]` is the global named
`Package3`. Multi-dimensional indices are joined with an underscore internally, so `$a[1,2]` is `a1_2`.

```php
$Package[$TotalNumberOfPackages] = %this;
$WeaponsHudData[0, bitmapName] = "gui/hud_blaster";
$AmmoIncrement[DiscAmmo] = 5;
```

Two consequences:

- **There is no array length.** The universal idiom is to iterate until you hit an empty entry:

  ```cs
  $index = 0;
  while ($Host::TeamSkin[$index] !$= "")
  {
     $TeamSkin[$index] = addTaggedString($Host::TeamSkin[$index]);
     $index++;
  }
  ```

- **Indices can be strings.** `$AmmoIncrement[DiscAmmo]` is an associative lookup keyed on a datablock
  name. This is used constantly.

## Control flow

C-shaped, with two additions:

```php
if (%a) { } else if (%b) { } else { }

for (%i = 0; %i < %count; %i++) { }

while (%file !$= "") { }

switch (%numericValue)          // numeric switch
{
   case 0:  $ShellBackground = "gui/bg_Hammers.png";
   case 1:  $ShellBackground = "gui/bg_BloodEagle.png";
   default: $ShellBackground = "gui/bg_Bioderm.png";
}

switch$ (%stringValue)          // string switch — note the $
{
   case "LoadJournal":  loadJournal($JournalFile);
   case "SaveJournal":  saveJournal($JournalFile);
   case "PlayJournal":  playJournal($JournalFile);
}
```

**`case` does not fall through** — no `break` needed. `case` accepts alternatives with `or`:

```php
case "WS_AuthServ_BadCDKey" or "WS_DBProxyServ_InvalidCDKey":
   %msg = "Account Creation Failed - Invalid CD Key.";
```

The ternary operator works as expected:

```php
%val = $_Camera::movementSpeed $= "" ? 40 : $_Camera::movementSpeed;
```

There is **no `do…while`** — the shipped scripts contain none, and the construct is not supported.

## Functions

```php
function functionName(%arg1, %arg2)
{
   return %arg1 + %arg2;
}
```

Arguments are positional and optional — a caller may pass fewer than declared, and the missing ones are
empty strings. That is why the shipped signatures are so long:

```php
function messageClient(%client, %msgType, %msgString, %a1, %a2, %a3, %a4, %a5,
                       %a6, %a7, %a8, %a9, %a10, %a11, %a12, %a13)
```

### Namespaced functions

A function named `Class::method` is dispatched when you call `.method()` on an object whose class,
superclass, or datablock class matches:

```php
function Weapon::onUse(%data, %obj) { … }
function WeaponImage::onMount(%this, %obj, %slot) { … }
function DefaultGame::missionLoadDone(%game) { … }
```

The first parameter is the receiver. Its conventional name varies by context — `%this`, `%obj`, `%data`,
`%game`, `%client` — and carries no meaning to the engine. See
[SimObjects and namespaces](simobject-and-namespaces.md).

### Indirect calls

```php
call(%func, %msgType, %msgString, %a1, %a2);   // call by name, with args
eval("someCode();");                            // compile and run a string
```

`call` is used by the message callback system to dispatch to handlers registered by name **[script]**.
`eval` is used sparingly — GUI button `command` fields are effectively `eval`'d strings.

## Tagged strings

Single-quoted strings are **tagged strings** — the engine interns them and transmits an integer tag over
the network instead of the text.

```php
commandToServer( 'MessageSent', %text );
commandToClient( %client, 'CenterPrint', %message, %time, %lines );
```

You will also see the explicit API:

```php
$TeamName[$index] = addTaggedString($Host::TeamName[$index]);
%message = detag( %msgString );
```

**Rule of thumb:** single quotes for anything crossing the network as an identifier; double quotes for
everything else. Getting this wrong produces messages that arrive as numbers.

## Objects

### Creating

```php
new Item()
{
   dataBlock = %data.thrownItem;
   sourceObject = %obj;
};

new SimGroup (MissionCleanup);

new ScriptObject(Game) {
   class = $CurrentMissionType @ "Game";
   superClass = DefaultGame;
};
```

The parenthesised name is optional. Fields inside the braces are set on the new object; **any name works**,
including ones the C++ class has never heard of — see dynamic fields below.

### Declaring datablocks

```php
datablock ItemData(Disc)
{
   className = Weapon;
   shapeFile = "weapon_disc.dts";
   image = DiscImage;
   mass = 1;
};

datablock PlayerData(LightFemaleHumanArmor) : LightMaleHumanArmor
{
   shapeFile = "light_female.dts";
};
```

The `: Parent` form copies every field from the parent first. See [Datablocks](datablocks.md).

### Dynamic fields

Any field you assign to an object exists from then on, whether or not the engine knows about it:

```php
%thrownItem.sourceObject = %obj;
%thrownItem.team = %obj.team;
%obj.lastThrowTime[%data] = getSimTime();
%obj.thrownChargeId = 0;
```

Note `%obj.lastThrowTime[%data]` — **array syntax works on object fields too**. This is how most per-object
bookkeeping is done in Tribes 2 mods.

Reading a field that was never set returns `""`. There is no error, which cuts both ways: typos are silent.

## Vector helpers

Vectors are three-word strings, manipulated through console functions:

```php
%eye = %obj.getEyeVector();
%vec = vectorScale(%eye, (%throwStren * 20.0));
%dot = vectorDot("0 0 1", %eye);
%vec = vectorAdd(%vec, vectorScale("0 0 4", 1 - %dot));
%vec = vectorAdd(%vec, vectorScale(%obj.getVelocity(), 0.4));
```

Also available: `vectorSub`, `vectorNormalize`, `vectorLen`, `vectorDist`, `vectorCross`.
See [Console functions](../reference/console-functions.md).

## Comments

```php
// line comment
```

`//` only. **`/* … */` block comments are not supported.** **[inferred]** — across the ~200 shipped `.cs`
files there is not a single block comment; every `/*` in the corpus is a glob pattern inside a string
literal such as `findFirstFile("interiors/*.dif")`. Sierra's own scripters comment out large regions with
runs of `//`, which is what you should do too.

## Gotchas worth memorising

| Trap | What happens | Fix |
|---|---|---|
| `==` on strings | Both sides numify to `0`, comparison is true | Use `$=` |
| Missing semicolon after `};` on a `datablock`/`new`/`package` block | Parse error, often reported on a later line | Always `};` |
| `/* */` comments | Not supported | Use `//` |
| Typo'd field name | Silently creates a new dynamic field | Grep the base scripts for the real spelling |
| Reading an unset variable | Empty string, no warning | Test with `!$= ""` |
| Reusing a global as a loop counter | `$i` is process-global; nested use clobbers it | Use `%i` |
| Single vs double quotes on network calls | Message arrives as a raw number | `'tag'` for identifiers |

## Under the community patches

**The language is unchanged.** Neither patch modifies `Tribes2.exe`, so the compiler, the syntax, the type
model, and the operator set are exactly as described above. Every idiom on this page works identically.

What the patches add is *vocabulary*, not grammar: around 30 new console functions registered by
`IFC22.dll` **[binary]**, and — on RC2a only — a `rubyExec` / `rubyEval` bridge into an embedded Ruby
interpreter **[patch-script]**. Both are ordinary function calls. See
[Console functions](../reference/console-functions.md#under-the-community-patches).

The one thing worth internalising: **a call to a function that does not exist produces a console error but
does not halt the script.** So calling a patch-only function on a vanilla install is noisy rather than
fatal — but guard anyway if you support both.

## Related

- [SimObjects and namespaces](simobject-and-namespaces.md) — how `Class::method` dispatch resolves
- [Datablocks](datablocks.md) — the `datablock` declaration in depth
- [Packages](packages.md) — `package` and `Parent::`
- [Console functions](../reference/console-functions.md) — the built-in function surface
