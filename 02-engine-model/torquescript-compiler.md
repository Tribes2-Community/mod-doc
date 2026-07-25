# TorqueScript — V12 Compiler

Every `.cs` file the engine loads gets compiled to `.cs.dso`, and the compiled form is preferred on every
later load ([Packaging](../06-shipping/packaging.md#dso-compilation)). This page documents that compiled
format and what compiling to it actually does — the `.cs` → `.cs.dso` direction. For reading a `.dso` back
into readable TorqueScript, see [TorqueScript — V12 Decompiler](torquescript-decompiler.md), which builds
directly on the format documented here.

## Evidence basis

**A note on evidence, unusual for this handbook.** Every other page cites `Tribes2.exe` disassembly
(**[binary]**) or shipped TorqueScript (**[script]**). This page's claims come from a different, empirical
method: client analysis of V12, build 25034 — a from-scratch parser and disassembler for `.cs.dso`, built in
this project and cross-checked against every real compiled file this project could gather from vanilla
Tribes 2, its community patches, and its documented mods. That parser has now been run, cleanly, against
**2,589 real `.cs.dso` files**: every one parses to a valid end-of-file with zero structural warnings, and
every claim below that can be checked against a real `.cs` source pair (dozens of them, across several mods
in this handbook) has been checked. This tier is marked **[dso-verified]** — confirmed by successfully
parsing and reconstructing real compiled files, not by reading anyone's source tree. It is a different kind
of evidence than **[binary]** disassembly, and where the two might conflict, this handbook trusts what
2,589 real files actually contain over any single secondary account of the format.

The **client-side decompiler tool** documented on the Decompiler page **is** this parser — every fact on
this page is exactly what it takes to make that tool work correctly against real files, no more and no
less.

## The file layout

A `.dso` is five sections in a fixed order, no section headers, nothing self-describing beyond sizes and
counts **[dso-verified]**:

```
u32   version
u32   globalStringTableSize (bytes)  ;  u8[]  globalStrings        // NUL-terminated entries
u32   globalFloatCount               ;  f64[] globalFloats
u32   functionStringTableSize (bytes);  u8[]  functionStrings
u32   functionFloatCount             ;  f64[] functionFloats
u32   codeSize (logical words)
u32   lineBreakPairCount
<code stream>                                                       // byte-packed — see below
u32[2 × lineBreakPairCount]                                          // raw u32 pairs, NOT byte-packed
<ident table>                                                        // see below
```

Two string tables and two float tables exist because a script's *file-scope* code and its *function bodies*
draw from separate pools — which pool is active is decided by whether the code currently executing sits
inside a function body or not, tracked structurally by this project's parser via each `FUNC_DECL`'s own
`endIp` operand, and confirmed correct by every real file's literals resolving to sensible, printable text
rather than out-of-range garbage.

### Two version constants, one build in scope

Every sample `.dso` compiled for build 25034 — 2,375 of the 2,589 files surveyed — opens with `AE 00 00 00`
little-endian at byte 0: **174**. A separate cohort of 214 files, all from a distribution self-labelled
`Grunts_V24834`, instead carries **140** (`8C 00 00 00`). Build 24834 predates build 25034 — Tribes 2's own
in-game version reporting numbers builds this way — so this reads as the compiler's version constant simply
increasing once between those two builds, the same way file formats routinely gain a version bump between
releases.

**This handbook covers build 25034 exclusively, so treat 174 as the operative value.** A `.dso` carrying 140
was compiled by an earlier build's compiler; a decompiler written against 174's format has, empirically,
had no trouble reading it too — the version bump did not change the structural layout, only the version
field's own value.

### The code stream is not a flat array

`u32 codeSize` is a count of **logical** code words, not bytes. On disk, each logical word is packed as
**one byte if its value is under `0xFF`, or `0xFF` followed by a full little-endian `u32`** if not
**[dso-verified]**. Reading the stream as a flat `u32[codeSize]` array — the natural first guess — misparses
almost every real file, since opcodes themselves are small numbers (0–83) and pack to one byte the
overwhelming majority of the time; only large literal operands and far jump targets are likely to trigger
the escape. This project's parser applies the packed reading uniformly and lands exactly on the ident
table's own start byte in all 2,589 files — the strongest practical confirmation available that this rule
is right and complete.

## String and float tables: two different reference mechanisms

Operands that point into a table use one of two schemes depending on what they point at, and a decompiler
has to know which is which per opcode **[dso-verified]**:

| Table | Operand is | Example opcode |
|---|---|---|
| Float table | An **index** | `LOADIMMED_FLT` reads `curFloatTable[code[ip]]` |
| String table | A **byte offset** | `LOADIMMED_STR` reads `curStringTable + code[ip]` |

Neither mechanism touches identifiers — variable names, field names, function and namespace names. Those go
through a third, entirely different path.

## The ident table: every identifier is a patch, not a literal

This is the single most important structural fact for reading a `.dso` by hand. At compile time, every
identifier operand — a `%local` or `$global` name, a field name, a function or namespace or package name, a
datablock's parent name in `CREATE_OBJECT` — is written into the code stream as a literal **zero**, and its
real value is recorded separately as `(byteOffset, instruction-pointer[])` pairs, trailing the code stream
and line-break pairs on disk:

```
u32 identCount
per entry:
   u32 globalStringByteOffset   // always into the GLOBAL string table, even for function-local identifiers
   u32 ipCount
   u32[ipCount] ips             // every code-stream position needing this identifier patched in
```

At load time, for every recorded `ip`, that code-stream word is replaced with the interned string found at
`globalStrings + byteOffset`. Three consequences worth internalising, all directly confirmed by decompiling
real files:

- **Every identifier resolves through the global string table**, regardless of whether the identifier
  itself is function-local — the function/global table split described above only governs string and float
  *literals*, not identifiers.
- **Local variable names are fully recoverable, not approximated.** Decompiling a `%local` name from a real
  file's ident table produces the actual name the author wrote (`%c`, `%deleted`, `%make`, and so on across
  dozens of tested functions) — there is no separate, lossier path for locals the way some later engines'
  release builds strip them to `%argN`.
- **A zero-length name is valid**, and appears in real files: one function argument encountered in this
  project's corpus has an ident-table entry whose byte offset points exactly to the end of the string
  table — a legitimate empty string, not corruption. A parser that rejects `offset === tableLength` as
  out-of-range will wrongly flag this as a bad file.

### Case is not always what the source wrote

String interning is **case-insensitive, first-case-wins**: whichever spelling of a name is interned first,
anywhere in the file, fixes the case every later reference decompiles to — regardless of how that specific
occurrence was spelled in the original source. This is directly observable, not just a theoretical rule:
decompiling a real Construction-family script whose source consistently writes `%Deleted` (capital D) at
every occurrence recovers `%deleted` (lowercase) throughout; decompiling `Editor::create()` against its own
paired source — which consistently writes `Editor` and `create` — recovers `editor::Create` instead,
lowercase namespace and capitalised method, neither matching the source's own casing at that specific
usage. The interning order that produces this is a whole-file, cross-occurrence phenomenon — not simply
"first line wins" in source order — so a decompiled identifier's exact casing should be treated as
approximate, even though the identifier itself is exact.

## The complete opcode set

All 84 values, 0 through 83. The **Seen** column is this project's own corpus count — how many times each
opcode appears across the 2,589 real files surveyed — not a citation to anyone else's source. An opcode
seen thousands of times, in files whose behavior this project has independently confirmed by decompiling
them against known paired source, is about as empirically confirmed as a fact can be without disassembling
the interpreter loop itself.

| # | Opcode | Operands | Effect | Seen |
|---|---|---|---|---:|
| 0 | `FUNC_DECL` | name, namespace, package (STE); hasBody, endIp, argc:u32; argNames[argc] (STE) | Registers the function; jumps past the body on linear execution | 39,394 |
| 1 | `CREATE_OBJECT` | parentName (STE); isDatablock, failJump:u32 | Instantiates from the pending class/name/args frame | 24,054 |
| 2 | `CREATE_DATABLOCK` | — | **Never observed** — see "Eight dead opcodes" below | 0 |
| 3 | `NAME_OBJECT` | — | **Never observed** | 0 |
| 4 | `ADD_OBJECT` | root:u8 | Registers the object into its group | 24,054 |
| 5 | `END_OBJECT` | root:u8 | Closes the object scope | 24,054 |
| 6 | `JMPIFFNOT` | target | Pop float, jump if false | 20,198 |
| 7 | `JMPIFNOT` | target | Pop int, jump if false | 80,701 |
| 8 | `JMPIFF` | target | Pop float, jump if true | 223 |
| 9 | `JMPIF` | target | Pop int, jump if true | 9,615 |
| 10 | `JMPIFNOT_NP` | target | **Non-popping**; this *is* `&&` | 12,385 |
| 11 | `JMPIF_NP` | target | Non-popping; this *is* `\|\|` | 8,954 |
| 12 | `JMP` | target | Unconditional jump | 39,139 |
| 13 | `RETURN` | — | Ends execution; return value is the current STR working string | 61,097 |
| 14 | `CMPEQ` | — | Pop 2 floats, push int `==` | 16,764 |
| 15 | `CMPGR` | — | Pop 2 floats, push int `>` | 9,918 |
| 16 | `CMPGE` | — | Pop 2 floats, push int `>=` | 1,907 |
| 17 | `CMPLT` | — | Pop 2 floats, push int `<` | 18,450 |
| 18 | `CMPLE` | — | Pop 2 floats, push int `<=` | 3,667 |
| 19 | `CMPNE` | — | Pop 2 floats, push int `!=` | 6,481 |
| 20 | `XOR` | — | Pop 2 ints, push `^` | 1 |
| 21 | `MOD` | — | Pop 2 ints, push `%` | 74 |
| 22 | `BITAND` | — | Pop 2 ints, push `&` | 1,275 |
| 23 | `BITOR` | — | Pop 2 ints, push `\|` | 2,611 |
| 24 | `NOT` | — | `!` in place, int stack | 15,634 |
| 25 | `NOTF` | — | Pop float, push int `!float` | 5,057 |
| 26 | `ONESCOMPLEMENT` | — | `~` in place, int stack | 162 |
| 27 | `SHR` | — | Pop 2 ints, push `>>` | 21 |
| 28 | `SHL` | — | Pop 2 ints, push `<<` | 244 |
| 29 | `AND` | — | **Never observed** — see below | 0 |
| 30 | `OR` | — | **Never observed** | 0 |
| 31 | `ADD` | — | Pop 2 floats, push `+` | 25,745 |
| 32 | `SUB` | — | Pop 2 floats, push `-` | 8,325 |
| 33 | `MUL` | — | Pop 2 floats, push `*` | 8,877 |
| 34 | `DIV` | — | Pop 2 floats, push `/` | 4,681 |
| 35 | `NEG` | — | Unary `-` in place, float stack | 11,348 |
| 36 | `SETCURVAR` | varName (STE) | Set variable cursor — lookup only, no create | 518,218 |
| 37 | `SETCURVAR_CREATE` | varName (STE) | Set variable cursor, creating if missing | 125,912 |
| 38 | `SETCURVAR_ARRAY` | — | Variable name comes from the current STR (array-subscript form) | 17,414 |
| 39 | `SETCURVAR_ARRAY_CREATE` | — | Same, creating if missing | 34,575 |
| 40 | `LOADVAR_UINT` | — | Push current variable as int | 11,490 |
| 41 | `LOADVAR_FLT` | — | Push current variable as float | 96,666 |
| 42 | `LOADVAR_STR` | — | Push current variable as string | 444,637 |
| 43 | `SAVEVAR_UINT` | — | Write variable from int stack top | 34,113 |
| 44 | `SAVEVAR_FLT` | — | Write from float | 25,808 |
| 45 | `SAVEVAR_STR` | — | Write from STR | 100,566 |
| 46 | `SETCUROBJECT` | — | Cursor = `Sim::findObject(STR)` | 154,321 |
| 47 | `SETCUROBJECT_NEW` | — | Cursor = the object just created | 263,783 |
| 48 | `SETCURFIELD` | fieldName (STE) | Set field cursor, resets the field-array buffer | 418,104 |
| 49 | `SETCURFIELD_ARRAY` | — | Field-array subscript comes from STR | 82,212 |
| 50 | `LOADFIELD_UINT` | — | Read current field as int | 5,302 |
| 51 | `LOADFIELD_FLT` | — | Read current field as float | 27,534 |
| 52 | `LOADFIELD_STR` | — | Read current field as string | 77,883 |
| 53 | `SAVEFIELD_UINT` | — | **Never observed** — field writes always go through `_FLT` or `_STR` | 0 |
| 54 | `SAVEFIELD_FLT` | — | Write field from float | 2,897 |
| 55 | `SAVEFIELD_STR` | — | Write field from string | 307,385 |
| 56 | `STR_TO_UINT` | — | Convert STR → int, push | 4,411 |
| 57 | `STR_TO_FLT` | — | Convert STR → float, push | 33,895 |
| 58 | `STR_TO_NONE` | — | Discard STR (result used as a statement) | 559,297 |
| 59 | `FLT_TO_UINT` | — | Pop float, push int (truncate) | 39 |
| 60 | `FLT_TO_STR` | — | Pop float, set STR | 21,346 |
| 61 | `FLT_TO_NONE` | — | Pop float, discard | 25,592 |
| 62 | `UINT_TO_FLT` | — | Pop int, push float | 114 |
| 63 | `UINT_TO_STR` | — | Pop int, set STR | 3,499 |
| 64 | `UINT_TO_NONE` | — | Pop int, discard | 51,989 |
| 65 | `LOADIMMED_UINT` | value:u32, inline | Push literal int | 52,834 |
| 66 | `LOADIMMED_FLT` | float table index | Push float from table | 76,337 |
| 67 | `TAG_TO_STR` | string table offset | Tagged-string literal (single-quoted in source) | 42,378 |
| 68 | `LOADIMMED_STR` | string table offset | Push string literal (double-quoted in source) | 591,208 |
| 69 | `LOADIMMED_IDENT` | STE, ident-patched | Push a bareword's text as a string | 248,242 |
| 70 | `CALLFUNC_RESOLVE` | fnName, fnNamespace (STE); callType:u32 | Plain function call — see "Calls compile like object construction" | 155,905 |
| 71 | `CALLFUNC` | fnName (STE); operand; callType:u32 | Method/parent call, or a resolved plain call — see below | 127,953 |
| 72 | `PROCESS_ARGS` | — | **Never observed** | 0 |
| 73 | `ADVANCE_STR` | — | Commit the pending value and start a new segment — the `@` operator | 502,576 |
| 74 | `ADVANCE_STR_APPENDCHAR` | char literal | Commit, then append one literal char — `SPC`=0x20, `TAB`=0x09, `NL`=0x0A | 12,260 |
| 75 | `ADVANCE_STR_COMMA` | — | Commit, then append an **underscore**, not a comma — the name is misleading | 28,253 |
| 76 | `ADVANCE_STR_NUL` | — | Commit, then append a NUL byte | 35,649 |
| 77 | `REWIND_STR` | — | Bracket around an array-subscript sub-expression (§ below) | 127,033 |
| 78 | `TERMINATE_REWIND_STR` | — | Closes the `REWIND_STR` bracket | 416,056 |
| 79 | `COMPARE_STR` | — | Push int result of `$=` / `!$=` on the last two built values | 35,649 |
| 80 | `PUSH` | — | Commit the current value as one call argument | 615,510 |
| 81 | `PUSH_FRAME` | — | Open a new call-argument frame — covers one whole call | 307,912 |
| 82 | `BREAK` | — | **Never observed** — a debugger breakpoint hook, not compiler output | 0 |
| 83 | `INVALID` | — | **Never observed** — the dispatch table's own poison value | 0 |

One entry deserves a second look if you're writing your own decoder: **75, `ADVANCE_STR_COMMA`**, appends
`'_'`, not the `,` its name implies — every real occurrence across the corpus confirms this, never a comma.

### Eight dead opcodes

**2, 3, 29, 30, 53, 72, 82, and 83 never appear in any of the 2,589 real files surveyed.** For 82
(`BREAK`) and 83 (`INVALID`), that's expected by design — a debugger breakpoint hook and a dispatch
table's own poison/terminator value are never things a compiler would emit. The other six are more
interesting:

- **29 (`AND`) and 30 (`OR`)** are provably dead by construction, not just by absence: `&&` and `||`
  compile to jump sequences instead (see "Short-circuit `&&` and `\|\|`" below), and that is the *only*
  source construct that could plausibly reach these two opcodes.
- **2 (`CREATE_DATABLOCK`) and 3 (`NAME_OBJECT`)** sit numerically right next to `CREATE_OBJECT` (1) in
  the enum, suggesting an earlier or alternate object-construction path that real build-25034 output never
  takes — `CREATE_OBJECT` alone handles both plain objects and datablocks in every sampled file.
- **53 (`SAVEFIELD_UINT`)** is the most interesting absence: its read counterpart, `LOADFIELD_UINT` (50),
  *is* used (5,302 times) — but every field **write** in the corpus goes through `SAVEFIELD_FLT` or
  `SAVEFIELD_STR` instead, never the UINT form. Fields read as integers sometimes; they're never written as
  one directly.
- **72 (`PROCESS_ARGS`)** has no confirmed purpose in this project's evidence — it simply never appears.

If you see one of these eight in a real file, something unusual produced it — a hand-crafted `.dso`, a
different compiler build, or a corrupt capture.

### Pre-resolution is the only form a file on disk ever shows

**67 (`TAG_TO_STR`) and 70 (`CALLFUNC_RESOLVE`)** are named for what they resolve *to* on first execution —
a tagged string and a cached function-call target, respectively — which strongly suggests they rewrite
themselves in memory once run **[inferred]**, a plausible optimisation this project has not independently
confirmed by watching the interpreter run. What *is* directly confirmed, from every one of 2,589 files: a
`.dso` read straight off disk only ever shows the pre-resolution opcodes (`TAG_TO_STR`, `CALLFUNC_RESOLVE`)
— never a hypothetical already-resolved form. That is exactly what you want as a decompiler author, since a
resolved-call form would depend on runtime namespace state a static reader has no access to anyway.

## Binary operators evaluate right-to-left

Comparing `Canvas.getContent() == EditorGui.getId()` against its own compiled form shows `getId(EditorGui)`
computed and pushed *first*, `getContent(Canvas)` computed and pushed *second* — the reverse of source
reading order. This holds generally: for `ADD`/`SUB`/`MUL`/`DIV`, the bitwise/shift ops, and all six
comparisons, **the right-hand operand is evaluated and pushed before the left-hand operand**, which then
sits on top of the stack. It's invisible for commutative operators (`+`, `*`, `==`, `&`, `\|`, `^`) — the
order doesn't change the result — but it matters for a decompiler rendering `-`, `/`, `%`, `<<`, `>>`, or an
ordered comparison correctly: the *second* value popped is the left operand, not the first.

## Short-circuit `&&` and `\|\|`

`a && b` and `a \|\| b` compile to jump sequences, confirmed against real conditionals across the corpus
(e.g. `isObject(EditorGui) && EditorGui.loadingMission)`:

```
a && b  →  <a>;  JMPIFNOT_NP end;  <b>;  end:
a || b  →  <a>;  JMPIF_NP end;  <b>;  end:
```

Both use the **non-popping** conditional jumps (10, 11): if `a` alone determines the result, its value is
left on the stack as the expression's result and `b` is skipped; otherwise `a`'s value is consumed by
falling into `b`, which becomes the result instead. The combined value only exists once control reaches the
shared jump target — a decompiler has to defer rendering `a && b` until whatever instruction sits at that
target (almost always the next conditional jump) actually consumes it.

## Control-flow shapes

TorqueScript's structured control flow becomes flat jumps at compile time, in shapes confirmed against real
`if`/`else` blocks across the corpus:

**If / else:**
```
<test>; JMPIFNOT/JMPIFFNOT elseOrEnd; <ifBlock>; [JMP end; <elseBlock>]
```
An int-typed test emits `JMPIFNOT`; a float-typed test emits `JMPIFFNOT` — which variant appears tells you
the test expression's inferred type.

**While / for:** a leading test with a conditional jump to the loop's exit, the body, a continue-point, the
loop's increment/step expression if any, then a second test jumping back to the body start. `for` and
`while` compile to the **identical shape** — TorqueScript's `for(init; test; step)` desugars entirely at
compile time, so nothing in the bytecode itself distinguishes a `for` loop from a hand-written `while` with
the init hoisted above it and the step placed at the bottom. **This is a genuine, provable loss**: two
different source forms produce byte-identical bytecode.

**Ternary:**
```
<test>; JMPIFNOT falseStart; <trueExpr>; JMP end; falseStart: <falseExpr>; end:
```
Structurally identical to if/else with both arms present — the two are only distinguishable because if/else
appears as a statement and ternary appears as an expression feeding into something else.

## Calls and object construction share one convention

A function call and a `new Object() { }` block both build their arguments the same way: `PUSH_FRAME` opens
a frame, each argument is built and finalised with `PUSH`, and the frame closes only when something
consumes it — `CALLFUNC`/`CALLFUNC_RESOLVE` for a call, `CREATE_OBJECT` for a construction. For
`CREATE_OBJECT` specifically, the **first** committed argument is the class name and the **second** is the
object's name; any further arguments are positional constructor arguments. `CREATE_OBJECT`'s own
word-operand is unrelated — it is only used for a `new Class(Name) : Parent` inheritance clause, and is
blank in the far more common case without one.

**A call's `callType` operand distinguishes plain calls from method calls.** A plain call (`exec("x.cs")`,
`isObject(x)`) resolves through `CALLFUNC_RESOLVE` with `callType = 0` and an unpatched namespace operand.
An object-method call (`Editor.close()`) instead pushes the target object as its **first** argument and
sets a nonzero `callType` — the object argument is the receiver, not a normal parameter, which is why
`Editor.close()` and `close(Editor)` are the same bytecode shape distinguished only by that flag.

### Array-subscript assignment reuses the same buffer

`$var[i] = value;` builds `value` first, then the array key (`LOADIMMED_IDENT` for the base name, followed
by the index expression), then brackets that key-building with `REWIND_STR` / `TERMINATE_REWIND_STR` before
the actual variable-cursor opcode (`SETCURVAR_ARRAY`/`_CREATE`) consumes it — leaving `value` sitting
untouched, ready for the `SAVEVAR_*` that follows. The `LOADIMMED_IDENT` immediately before the key is the
reliable marker: it never appears anywhere except to spell out an array access's base name, so it's the
split point between "the value already built for this statement" and "the subscript this array access is
about to consume."

## Related

- [Packaging](../06-shipping/packaging.md#dso-compilation) — when and why `.dso` files are generated, and the staleness trap
- [File formats](../reference/file-formats.md) — `.dso` in context with the rest of the shipped formats
- [TorqueScript](torquescript.md) — the language this bytecode implements; read this first if you haven't
- [TorqueScript — V12 Decompiler](torquescript-decompiler.md) — reading this format back to `.cs`, including a client-side tool
- [Debugging](../06-shipping/debugging.md) — `setEchoFileLoads`, and diagnosing stale-`.dso` symptoms
