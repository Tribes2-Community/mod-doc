# GUI system

A `.gui` file is TorqueScript. It is not a markup language — it is a nested chain of `new` statements that
the engine executes, exactly like any other script. That means everything you know about
[SimObjects](../02-engine-model/simobject-and-namespaces.md) applies.

## Anatomy of a `.gui` file

From `gui/PlayGui.gui` **[script]**:

```php
//--- OBJECT WRITE BEGIN ---
new GameTSCtrl(PlayGui) {
   profile = "GuiContentProfile";
   horizSizing = "right";
   vertSizing = "bottom";
   position = "0 0";
   extent = "640 480";
   minExtent = "8 8";
   visible = "1";
   hideCursor = "1";
   helpTag = "0";
   beaconBaseTextureName = "gui/beacon_base";
   beaconTargetTextureName = "gui/crosshairs";
   …

   new HudScoreCtrl(objectiveHud) {
      profile = "HudScoreProfile";
      horizSizing = "right";
      vertSizing = "top";
      position = "8 437";
      extent = "245 37";
      …

      new GuiTextCtrl() {
         profile = "GuiTextObjGreenLeftProfile";
         position = "4 3";
         extent = "65 16";
         …
      };
   };
};
```

The `//--- OBJECT WRITE BEGIN ---` marker means the file was written by the in-game GUI editor. Anything
you hand-edit in such a file is lost the next time someone saves it from the editor.

### Fields every control has

| Field | Meaning |
|---|---|
| `profile` | A `GuiControlProfile` — fonts, colours, bitmaps, sounds |
| `position` | `"x y"` relative to the parent, in 640×480 space |
| `extent` | `"width height"` |
| `minExtent` | Minimum size when resized |
| `horizSizing` / `vertSizing` | Resize behaviour — `"right"`, `"left"`, `"center"`, `"width"`, `"relative"`; and `"top"`, `"bottom"`, `"height"` |
| `visible` | Shown or hidden |
| `command` | TorqueScript to run on activation |
| `altCommand` | Secondary activation — Enter in a text field |
| `accelerator` | Keyboard shortcut, e.g. `"escape"`, `"return"` |
| `variable` | A global to bind the control's value to |
| `helpTag` | Context-help index |
| `text` | Displayed text, where applicable |

**The coordinate system is a fixed 640×480 virtual space.** The engine scales it to the real resolution.
`horizSizing` / `vertSizing` control how children move and stretch when a parent resizes.

### Value binding

```php
new ShellTextEditCtrl(LoginEditBox) {
   variable = "$LoginName";
   altCommand = "LoginProcess();";
   maxLength = "16";
   password = "0";
};

new ShellToggleButton() {
   variable = "$pref::RememberPassword";
   text = "REMEMBER PASSWORD";
};
```

`variable` two-way binds the control to a global. This is how the options screen works — every toggle and
slider is bound to a `$pref::` global and the values persist automatically via
`export("$pref::*", "prefs/ClientPrefs.cs", False)` **[script]**.

## Control types

The 136 shipped `.gui` files use these, by frequency **[script]**:

| Control | Count | Purpose |
|---|---|---|
| `GuiTextCtrl` | 629 | Single-line text |
| `GuiButtonCtrl` | 222 | Button |
| `ShellFieldCtrl` | 141 | Tribes-styled field background |
| `GuiMLTextCtrl` | 124 | Multi-line formatted text — supports markup tags |
| `GuiTextEditSliderCtrl` | 78 | Numeric entry with slider |
| `GuiScrollContentCtrl` | 72 | Scroll viewport content |
| `GuiTextEditCtrl` | 61 | Text entry |
| `ShellTextEditCtrl` | 55 | Tribes-styled text entry |
| `ShellPaneCtrl` | 54 | Titled dialog frame |
| `GuiCheckBoxCtrl` | 51 | Checkbox |
| `GuiScrollCtrl` / `ShellScrollCtrl` | 42 / 40 | Scrolling container |
| `ShellSliderCtrl` / `GuiSliderCtrl` | 35 / 18 | Slider |
| `GuiWindowCtrl` | 32 | Draggable window |
| `GuiPopUpMenuCtrl` | 26 | Dropdown |
| `GuiFrameSetCtrl` | 21 | Splitter layout |
| `GuiTextListCtrl` | 20 | List of rows |
| `GuiChunkedBitmapCtrl` | 20 | Tiled background bitmap |
| `GuiRadioCtrl` | 17 | Radio button |
| `GuiFilterCtrl` | 16 | Curve editor |
| `GuiBitmapCtrl` | 16 | Single bitmap |
| `GuiConsoleVariableCtrl` | 12 | Live display of a global |
| `GuiProgressCtrl` | 7 | Progress bar |
| `GameTSCtrl` | 6 | **The 3D view** |
| `GuiMessageVectorCtrl` | 5 | Chat/message log |

The `Shell*` family are Tribes 2's styled versions of the generic `Gui*` controls. Use them for anything
that should look like the rest of the game.

## `GuiControlProfile` — shared styling

Profiles are declared with `new`, not `datablock`, and shared by name **[script]**:

```php
new GuiControlProfile (ShellButtonProfile)
{
   fontType = "Univers Condensed";
   fontSize = 16;
   fontColor = "8 19 6";
   fontColorHL = "25 68 56";       // highlighted
   fontColorNA = "5 5 5";          // not active
   fontColorSEL = "25 68 56";      // selected
   fixedExtent = true;
   justify = "center";
   bitmap = "gui/shll_button";
   textOffset = "0 10";
   soundButtonDown = sButtonDown;
   soundButtonOver = sButtonOver;
   tab = true;
   canKeyFocus = true;
};
```

| Field | Meaning |
|---|---|
| `fontType`, `fontSize` | Font family and size |
| `fontColor`, `fontColorHL`, `fontColorNA`, `fontColorSEL` | Normal / highlight / disabled / selected |
| `fillColor`, `fillColorHL` | Background |
| `opaque` | Draw the background at all |
| `bitmap` | Nine-slice bitmap base name |
| `bitmapBase` | Base name for a family of bitmaps |
| `textOffset` | Text position within the control |
| `justify` | `"left"`, `"center"`, `"right"` |
| `autoSizeWidth`, `autoSizeHeight` | Size to content |
| `fixedExtent` | Ignore requested extent |
| `soundButtonDown`, `soundButtonOver` | `AudioProfile`s |
| `tab`, `canKeyFocus` | Keyboard navigation |
| `cursorColor` | Text cursor |

Profiles live in `gui/guiProfiles.gui`, loaded early from `console_end.cs` **[script]**, plus a handful
declared inline in `console_start.cs` for the pre-boot login screens.

**Declare a profile rather than styling controls individually.** It is how everything shipped is done and
it makes a mod's UI look coherent.

## The Canvas

| Call | Purpose | Uses **[script]** |
|---|---|---|
| `Canvas.pushDialog(%gui)` | Show a dialog on top | 91 |
| `Canvas.popDialog(%gui)` | Hide it | 92 |
| `Canvas.setContent(%gui)` | Replace the base content | 29 |
| `Canvas.getContent()` | Current content | 8 |
| `Canvas.repaint()` | Force a redraw | 17 |
| `Canvas.setCursor(%cursor)` | Cursor bitmap | 7 |
| `Canvas.showCursor()` / `.cursorOn()` / `.cursorOff()` | Cursor visibility | |
| `Canvas.reset()` | Reset | |

The pattern for a dialog is always the same:

```php
Canvas.pushDialog( MyDialog );
…
Canvas.popDialog( MyDialog );
```

## Lifecycle callbacks

```php
function CreateAccountDlg::onWake( %this )
{
   %this.open = true;
   CreateAccountSubmitBtn.setActive( false );
   schedule( 0, 0, updateSubmitButton );
}

function CreateAccountDlg::onSleep( %this )
{
   %this.open = false;
}
```

| Callback | When |
|---|---|
| `onWake(%this)` | The control became visible — populate it here |
| `onSleep(%this)` | It became hidden — cancel schedules here |
| `onAction(%this)` | A button or toggle was activated |
| `onSelect(%this, %id, %text)` | A list row was selected |

`onWake` / `onSleep` are the GUI equivalent of mount/unmount. Anything you start in `onWake` should be
stopped in `onSleep`, especially schedules — see
[Scheduling and events](../02-engine-model/scheduling-and-events.md).

## Common control operations

```php
%ctrl.setText("hello");           %ctrl.getValue();
%ctrl.setValue(%v);               %ctrl.getText();
%ctrl.setVisible(%bool);          %ctrl.setActive(%bool);
%ctrl.resize(%x, %y, %w, %h);     %ctrl.makeFirstResponder(true);
%ctrl.getExtent();                %ctrl.getPosition();
```

Real examples **[script]**:

```php
LoginMessageBoxFrame.setTitle( %title );
LoginMessageBoxText.setText( "<just:center>" @ %message );
LoginMessageBoxButton.setValue( %buttonText );

FetchPasswordRdo.resize( 29, 144, 240, 30 );
FetchLoginNamePane.setVisible( true );
FetchEmailAddress.makeFirstResponder( true );
```

## `GuiMLTextCtrl` markup

Multi-line text controls accept inline formatting tags:

| Tag | Effect |
|---|---|
| `<just:center>`, `<just:left>`, `<just:right>` | Justification |
| `<font:Univers:16>` | Font and size |
| `<color:RRGGBB>` | Colour |
| `<tab:5 10 15>` | Tab stops |
| `<a:href>text</a>` | Link |
| `<bitmap:path>` | Inline image |
| `<lmargin:n>`, `<rmargin:n>` | Margins |
| `<spush>` / `<spop>` | Save and restore style |

```php
EULAInstructions.setText( "<just:center>Please read the following License Agreement carefully."
      NL "You must accept this agreement in order to play"
      NL "Tribes 2." );

%text = "<tab:5 10 15>" @ %line;
```

The same markup drives `.hfl` help files in `scripts.vl2`'s `help/` directory.

## Loading a GUI

`console_end.cs` defines the helper **[script]**:

```php
function loadGui(%gui)
{
   exec("gui/" @ %gui @ ".gui");
}
```

so a mod loads its own GUI the same way:

```php
loadGui("MyModDialog");        // execs gui/MyModDialog.gui through the mod path stack
exec("scripts/MyModDialog.cs");
```

Both resolve through the mod path stack, so `MyMod/gui/MyModDialog.gui` is found first. See
[Mod paths and overrides](../02-engine-model/mod-paths-and-overrides.md).

## Modifying a stock GUI

Three options, worst to best:

| Approach | Consequence |
|---|---|
| Shadow the `.gui` file | You own a full copy of a machine-generated layout, and it breaks on any change |
| Shadow the `.cs` partner | Better — behaviour only — but still a whole-file copy |
| **Manipulate controls at runtime from a package** | Composable and small |

The third looks like this:

```php
package MyMod
{
   function LobbyGui::onWake(%this)
   {
      Parent::onWake(%this);

      if (!isObject(MyModExtraButton))
      {
         %btn = new ShellBitmapButton(MyModExtraButton)
         {
            profile   = "ShellButtonProfile";
            position  = "20 400";
            extent    = "140 38";
            minExtent = "32 38";
            visible   = "1";
            command   = "MyModOpenPanel();";
            text      = "MY MOD";
         };
         %this.add(%btn);
      }
   }
};
activatePackage(MyMod);
```

Guard with `isObject` — `onWake` fires every time the GUI is shown.

## The GUI editor

Tribes 2 ships its own visual editor. `console_end.cs` loads it **[script]**:

```php
loadGui("GuiEditorGui");
loadGui("consoleDlg");
loadGui("InspectDlg");
```

It is reachable from the in-game console. It writes the `//--- OBJECT WRITE BEGIN ---` files you have been
reading, and it is the fastest way to lay out a new dialog — build it in the editor, save it into your
mod, then write the behaviour by hand in a `.cs` partner.

Also loaded: the `TSShow*` shape-viewer dialogs and the `Debugger*` dialogs — see
[Debugging](../06-shipping/debugging.md).

## Under the community patches

If you are writing a UI mod, this section is not optional reading. The GUI layer is where the QoL patch
changes the most.

### Fonts are substituted wholesale

The patch ships six `.sdft` fonts in `t2csri.vl2` and reroutes every vanilla font name to them
**[patch-script]**:

```php
$Font::Substitute["Univers"]                = "Saira Regular";
$Font::Substitute["Univers Condensed"]      = "Saira SemiCondensed Medium";
$Font::Substitute["Univers Bold"]           = "U001 Bold";
$Font::Substitute["Univers Condensed Bold"] = "Univers LT 57 Condensed";
$Font::Substitute["Univers italic"]         = "Univers LT 57 Condensed Oblique";
$Font::Substitute["Sui Generis"]            = "SuiGenerisRg-Regular";
```

**Your `.gui` and `GuiControlProfile` code needs no change** — a profile asking for
`fontType = "Univers Condensed"` transparently gets Saira. But the metrics differ, so:

- A layout tuned to the pixel against vanilla `.gft` fonts **will shift**.
- Use `autoSizeWidth` / `autoSizeHeight` where you can, and leave slack where you cannot.
- Test on a patched install. This is the single most common source of "my dialog looks wrong for other
  people".

RC2a keeps the vanilla `.gft` fonts, so a layout can look correct on one patch and wrong on the other.

### The 640×480 assumption is now user-scaled

The virtual coordinate space is still 640×480, but three user-controlled scalars sit on top
**[patch-script]**:

| Control | Range | Console functions |
|---|---|---|
| Render scale | 5–200 % | `setRenderScale` / `getRenderScale` |
| UI scale | slider | `setUIScale` / `getUIScale(0\|1\|2)` |
| UI aspect | Stretch / 16:9 / 16:10 / 4:3 / 5:4 | `setUIAspect` |

Anything positioned by absolute coordinate against an assumed canvas extent should **read the extent**
instead. `ServerInfoDlg::onWake` is the shipped example — it restores window geometry from a preference
and then clamps it to the UI-aspect resolution **[patch-script]**.

### The Video options panel is rebuilt

`OP_FullScreenTgl::onAdd` is overridden to reconstruct the entire panel **[patch-script]**, adding
anti-aliasing (driven by `$OpenGL::maxMSAA`), a framerate limit dropdown
(`60/90/120/144/165/240/288/360/480/500/640/720/1000`), render scale, FOV (45–120°), UI scale, and UI
aspect.

**If your mod adds controls to the Video panel, they will be destroyed and rebuilt.** Hook the same
function and add yours after `Parent::`, or use a different panel.

The DXGI interop toggle there is worth studying: it has a 15-second confirmation timer that auto-reverts
if the user does not confirm. A good pattern for any risky graphics option.

### Other overridden GUI functions

`Canvas::setContent` (disables vsync during `LoadingGui` / `DebriefGui`), `MessageHud::open` (extends to
canvas extent), `GuiMessageVectorCtrl::onAdd`, `OptionsDlg::applyGraphicChanges`,
`OptionsDlg::saveSettings`, `LaunchToolbarMenu::add` (injects a TRAINING entry offline),
`LaunchTabView::addLaunchTab` (deactivates the dead EMAIL / BROWSER / CHAT tabs), `GGIntroGui::onSleep`,
and `StartLoginProcess` — which **deletes the vanilla `LoginDlg` and `CreateAccountDlg`** and loads the
TribesNEXT login UI from `loginScreens.cs` + `t2csri/loginDialogs.gui` **[patch-script]**.

A mod that expects `LoginDlg` to exist will not find it.

### The terrain painter gains two slots

`EPainter::setup` / `EPainter::onAdd` / `EPainterChangeMat` extend the mission editor's terrain painter
from six material slots (0–5) to eight (0–7) **[patch-script]**.

### What does not change

`.gui` file syntax, control classes, `GuiControlProfile` fields, the Canvas dialog stack, `onWake` /
`onSleep`, `GuiMLTextCtrl` markup, and `loadGui()` are all vanilla.

## Related

- [HUD](hud.md) — the in-game overlay, which is a GUI too
- [Text and messaging](text-and-messaging.md) — colour codes and the message system
- [Client/server split](../02-engine-model/client-server-split.md) — GUI is client-only
- [Boot sequence](../02-engine-model/boot-sequence.md) — when the GUI files load
- [TribesNEXT QoL patch](../07-community-patches/tribesnext-qol.md#ui-and-video) — the full override list
