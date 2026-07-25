# TorqueScript — V12 Decompiler

Every `.cs` file the engine loads is compiled to `.cs.dso` and the compiled form is preferred afterwards
([Packaging](../06-shipping/packaging.md#dso-compilation)). Plenty of mods in this handbook — sections
35, 54, and 55 among them — survive only as `.dso`, with no `.cs` source anywhere in their distribution.
This page is how you read one back.

**A note on evidence, unusual for this handbook.** Every other page cites `Tribes2.exe` disassembly
(**[binary]**) or shipped TorqueScript (**[script]**). This page cites the V12 engine's own archived C++
source instead — the compiler and interpreter that produce and consume `.dso` files, not TorqueScript
running on top of them. That is a new evidence tier, marked **[engine-source]**, and it is stronger than
disassembly: it is the literal code, not a reconstruction from machine instructions. Every opcode and
every field in this page traces to a specific file and line in that source, cross-checked against real
`.cs.dso` files already documented elsewhere in this handbook.

## The file layout

A `.dso` is five sections in a fixed order, no section headers, nothing self-describing beyond sizes and
counts **[engine-source]**:

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

Everything reads through `CodeBlock::read` **[engine-source]** (`external/v12-engine/console/compiler.cc:282-360`).
Two string tables and two float tables exist because a script's *file-scope* code and its *function
bodies* draw from separate pools — which pool is active is decided once per `exec()` call, not per
instruction: called from inside a function, the function tables are live; executing at file scope, the
global tables are live **[engine-source]** (`compiledEval.cc:367-414`, `:926-946`).

### The version field doesn't agree with itself

Every sample `.dso` examined for this page opens with `AE 00 00 00` little-endian at byte 0 — **174**.
The archived source's own compiled-in constant, `ConsoleDSOVersion`, is **33**
**[engine-source]** (`compiler.h:119-121`), checked against the on-disk value at load time in
`consoleFunctions.cc:784-789`. These are not the same number, and this handbook cannot reconcile them —
they most plausibly come from different points in the engine's development history (an earlier archived
source revision than what actually shipped in build 25034). **Treat 174 as the operative fact**, since
every real file on disk carries it; cite 33 only as the source tree's own stale constant, not as what
you'll find in a file.

### The code stream is not a flat array

`u32 codeSize` is a count of **logical** code words, not bytes. On disk, each logical word is packed as
**one byte if its value is under `0xFF`, or `0xFF` followed by a full little-endian `u32`** if not
**[engine-source]** (`compiler.cc:322-330` read, `:428-437` write). Reading the stream as a flat
`u32[codeSize]` array — the natural first guess — misparses almost every real file, since opcodes
themselves are small numbers (0–83) and pack to one byte the overwhelming majority of the time; only
large literal operands and far jump targets are likely to trigger the escape.

## String and float tables: two different reference mechanisms

Operands that point into a table use one of two schemes depending on what they point at, and a decompiler
has to know which is which per opcode **[engine-source]** (`compiledEval.cc:367-414`, `:926-951`):

| Table | Operand is | Example opcode |
|---|---|---|
| Float table | An **index** | `LOADIMMED_FLT` reads `curFloatTable[code[ip]]` |
| String table | A **byte offset** | `LOADIMMED_STR` reads `curStringTable + code[ip]` |

Neither mechanism touches identifiers — variable names, field names, function and namespace names. Those
go through a third, entirely different path.

## The ident table: every identifier is a patch, not a literal

This is the single most important structural fact for reading a `.dso` by hand. At compile time, every
identifier operand — a `%local` or `$global` name, a field name, a function or namespace or package name,
a datablock's parent name in `CREATE_OBJECT` — is written into the code stream as a literal **zero**, and
its real value is recorded separately: `(symbol, instruction-pointer)` pairs collected into a
`CompilerIdentTable` **[engine-source]** (`compiler.cc:655-673`).

That table is what trails the code stream and line-break pairs on disk:

```
u32 identCount
per entry:
   u32 globalStringByteOffset   // always into the GLOBAL string table, even for function-local identifiers
   u32 ipCount
   u32[ipCount] ips             // every code-stream position needing this identifier patched in
```

At load time, for every recorded `ip`: `code[ip] = StringTable->insert(globalStrings + offset)`
**[engine-source]** (`compiler.cc:337-356`). Two consequences worth internalising:

- **Every identifier resolves through the global string table**, regardless of whether the identifier
  itself is function-local. A `%player` inside a deeply nested function body still gets its name from
  `globalStrings`, not `functionStrings` — the function/global table split described above only governs
  string *literals* and float *literals*, not identifiers.
- **Local variable names are fully recoverable, not approximated.** `VarNode::compile` routes `%local`
  names through this exact same mechanism **[engine-source]** (`compiler.cc:1726-1734`) — there is no
  separate, lossier code path for locals. If you assumed V12 strips local names to something like `%argN`
  the way some later engines' release builds do, that assumption is wrong for this engine: the real name
  is sitting in the global string table, addressed by the ident table, every time.
- **String interning is case-insensitive, first-case-wins** (`external/v12-engine/core/stringTable.h:45`,
  `.cc:101-127`, **[engine-source]**) — if two mods reference `%Player` and `%player`, whichever the
  engine interns first fixes the case every later reference displays, regardless of how any individual
  site spelled it.

Two opcodes go further and **rewrite themselves in memory** the first time they run, described in the
opcode table below (67, 70) — but that rewrite is never written back to the file. A `.dso` you read from
disk always shows the pre-resolution form.

## The complete opcode set

All 84 values, 0 through 83. Every row below has a confirmed handler in the interpreter's dispatch switch
**[engine-source]** (`external/v12-engine/console/compiledEval.cc`, line cited per row, cross-referenced
against the enum in `compiler.h:8-111`) — none are guessed. Five are confirmed **dead**: the interpreter
has a working handler, but nothing in the compiler's own code-generation paths ever emits them. If you see
one in a real file, something unusual produced it.

| # | Opcode | Operands | Effect | Cite |
|---|---|---|---|---|
| 0 | `FUNC_DECL` | name, namespace, package (STE); hasBody, endIp, argc:u32; argNames[argc] (STE) | Registers the function; jumps past the body on linear execution | `:438-453` |
| 1 | `CREATE_OBJECT` | parentName (STE); isDatablock, failJump:u32 | Instantiates from the pending class/name/args frame | `:455-544` |
| 2 | `CREATE_DATABLOCK` | — | **Dead** — no-op handler | `:545-546` |
| 3 | `NAME_OBJECT` | — | **Dead** — no-op handler | `:547-548` |
| 4 | `ADD_OBJECT` | root:u8 | Registers the object into its group | `:549-601` |
| 5 | `END_OBJECT` | root:u8 | Closes the object scope | `:602-609` |
| 6 | `JMPIFFNOT` | target | Pop float, jump if false | `:610-617` |
| 7 | `JMPIFNOT` | target | Pop int, jump if false | `:618-625` |
| 8 | `JMPIFF` | target | Pop float, jump if true | `:626-633` |
| 9 | `JMPIF` | target | Pop int, jump if true | `:634-641` |
| 10 | `JMPIFNOT_NP` | target | **Non-popping**; jump if top-of-int-stack false — this *is* `&&` | `:642-650` |
| 11 | `JMPIF_NP` | target | Non-popping; jump if true — this *is* `\|\|` | `:651-659` |
| 12 | `JMP` | target | Unconditional jump | `:660-662` |
| 13 | `RETURN` | — | Ends execution; return value is the current STR working string | `:663-664` |
| 14 | `CMPEQ` | — | Pop 2 floats, push int `==` | `:665-669` |
| 15 | `CMPGR` | — | Pop 2 floats, push int `>` | `:671-675` |
| 16 | `CMPGE` | — | Pop 2 floats, push int `>=` | `:677-681` |
| 17 | `CMPLT` | — | Pop 2 floats, push int `<` | `:683-687` |
| 18 | `CMPLE` | — | Pop 2 floats, push int `<=` | `:689-693` |
| 19 | `CMPNE` | — | Pop 2 floats, push int `!=` | `:695-699` |
| 20 | `XOR` | — | Pop 2 ints, push `^` | `:701-704` |
| 21 | `MOD` | — | Pop 2 ints, push `%` | `:706-709` |
| 22 | `BITAND` | — | Pop 2 ints, push `&` | `:711-714` |
| 23 | `BITOR` | — | Pop 2 ints, push `\|` | `:716-719` |
| 24 | `NOT` | — | `!` in place, int stack | `:721-723` |
| 25 | `NOTF` | — | Pop float, push int `!float` | `:725-729` |
| 26 | `ONESCOMPLEMENT` | — | `~` in place, int stack | `:731-733` |
| 27 | `SHR` | — | Pop 2 ints, push `>>` | `:735-738` |
| 28 | `SHL` | — | Pop 2 ints, push `<<` | `:740-743` |
| 29 | `AND` | — | **Dead** — working int `&&` handler, never emitted (§ below) | `:745-748` |
| 30 | `OR` | — | **Dead** — working int `\|\|` handler, never emitted | `:750-753` |
| 31 | `ADD` | — | Pop 2 floats, push `+` | `:755-758` |
| 32 | `SUB` | — | Pop 2 floats, push `-` | `:760-763` |
| 33 | `MUL` | — | Pop 2 floats, push `*` | `:765-768` |
| 34 | `DIV` | — | Pop 2 floats, push `/` | `:769-772` |
| 35 | `NEG` | — | Unary `-` in place, float stack | `:773-775` |
| 36 | `SETCURVAR` | varName (STE) | Set variable cursor — lookup only, no create | `:777-781` |
| 37 | `SETCURVAR_CREATE` | varName (STE) | Set variable cursor, creating if missing | `:783-787` |
| 38 | `SETCURVAR_ARRAY` | — | Variable name comes from the current STR (array-subscript form) | `:789-792` |
| 39 | `SETCURVAR_ARRAY_CREATE` | — | Same, creating if missing | `:794-797` |
| 40 | `LOADVAR_UINT` | — | Push current variable as int | `:799-802` |
| 41 | `LOADVAR_FLT` | — | Push current variable as float | `:804-807` |
| 42 | `LOADVAR_STR` | — | Push current variable as string | `:809-812` |
| 43 | `SAVEVAR_UINT` | — | Write variable from int stack top — does **not** pop | `:814-816` |
| 44 | `SAVEVAR_FLT` | — | Write from float — no pop | `:818-820` |
| 45 | `SAVEVAR_STR` | — | Write from STR — no pop | `:822-824` |
| 46 | `SETCUROBJECT` | — | Cursor = `Sim::findObject(STR)` | `:826-828` |
| 47 | `SETCUROBJECT_NEW` | — | Cursor = the object just created | `:830-832` |
| 48 | `SETCURFIELD` | fieldName (STE) | Set field cursor, resets the field-array buffer | `:834-838` |
| 49 | `SETCURFIELD_ARRAY` | — | Field-array subscript comes from STR | `:840-842` |
| 50 | `LOADFIELD_UINT` | — | Read current field as int | `:844-850` |
| 51 | `LOADFIELD_FLT` | — | Read current field as float | `:852-858` |
| 52 | `LOADFIELD_STR` | — | Read current field as string | `:860-866` |
| 53 | `SAVEFIELD_UINT` | — | Write field from int — no pop | `:868-872` |
| 54 | `SAVEFIELD_FLT` | — | Write field from float — no pop | `:874-878` |
| 55 | `SAVEFIELD_STR` | — | Write field from string — no pop | `:880-883` |
| 56 | `STR_TO_UINT` | — | Convert STR → int, push | `:885-888` |
| 57 | `STR_TO_FLT` | — | Convert STR → float, push | `:890-893` |
| 58 | `STR_TO_NONE` | — | Discard STR (result used as a statement) | `:894-895` |
| 59 | `FLT_TO_UINT` | — | Pop float, push int (truncate) | `:896-900` |
| 60 | `FLT_TO_STR` | — | Pop float, set STR | `:902-905` |
| 61 | `FLT_TO_NONE` | — | Pop float, discard | `:907-909` |
| 62 | `UINT_TO_FLT` | — | Pop int, push float | `:911-915` |
| 63 | `UINT_TO_STR` | — | Pop int, set STR | `:917-920` |
| 64 | `UINT_TO_NONE` | — | Pop int, discard | `:922-924` |
| 65 | `LOADIMMED_UINT` | value:u32, inline | Push literal int | `:926-929` |
| 66 | `LOADIMMED_FLT` | float table index | Push float from table | `:931-935` |
| 67 | `TAG_TO_STR` | string table offset | **Self-modifies**: rewrites `code[ip-1]` to `LOADIMMED_STR`; tags the string if untagged; falls through | `:936-947` |
| 68 | `LOADIMMED_STR` | string table offset | Push string literal | `:945-947` |
| 69 | `LOADIMMED_IDENT` | STE, ident-patched | Push a bareword's text as a string | `:949-951` |
| 70 | `CALLFUNC_RESOLVE` | fnName, fnNamespace (STE); callType:u32 | Namespace lookup; on success **self-modifies**: `code[ip-1]` → `CALLFUNC`, caches the resolved entry into `code[ip+1]`; falls through. On failure, opcode is left unchanged and a console warning fires | `:953-970` |
| 71 | `CALLFUNC` | fnName (STE); resolved entry or re-resolved; callType:u32 | Full dispatch — script recursion or native callback | `:970-1136` |
| 72 | `PROCESS_ARGS` | — | **Dead** — no-op handler | `:1138-1139` |
| 73 | `ADVANCE_STR` | — | Start a new segment in the STR working buffer — the `@` operator | `:1141-1143` |
| 74 | `ADVANCE_STR_APPENDCHAR` | char literal | Append one literal char — `SPC`=0x20, `TAB`=0x09, `NL`=0x0A | `:1144-1146` |
| 75 | `ADVANCE_STR_COMMA` | — | Appends an **underscore**, not a comma — the name is misleading | `:1148-1150` |
| 76 | `ADVANCE_STR_NUL` | — | Append a NUL byte | `:1152-1154` |
| 77 | `REWIND_STR` | — | Rewind the working buffer — concatenation continuation | `:1156-1158` |
| 78 | `TERMINATE_REWIND_STR` | — | Rewind and terminate | `:1160-1162` |
| 79 | `COMPARE_STR` | — | Push int result of `$=` / `!$=` | `:1164-1166` |
| 80 | `PUSH` | — | Finalize the current STR segment as a call argument | `:1167-1169` |
| 81 | `PUSH_FRAME` | — | Open a new call-argument frame | `:1171-1173` |
| 82 | `BREAK` | — | Debugger breakpoint hook | `:1174-1189` |
| 83 | `INVALID` | — | Falls to the dispatch `default:` — a terminator/poison value | `:1190-1194` |

Two entries deserve a second look if you're writing your own decoder. **75, `ADVANCE_STR_COMMA`**,
appends `'_'`, not the `,` its name implies — trust the handler over the enum name. **67 and 70** are the
only opcodes that ever mutate the in-memory code array after load; a decompiler reading bytes straight off
disk will only ever see their pre-resolution forms (`TAG_TO_STR`, `CALLFUNC_RESOLVE`), never the patched
result — which is what you want, since the patched result depends on runtime namespace state a static
reader has no access to anyway.

### Proving `&&` and `\|\|` are dead code, not missing coverage

Opcodes 29 and 30 have complete, correct handlers — the interpreter can execute them. The compiler simply
never emits them. Short-circuit boolean operators compile to jump sequences instead **[engine-source]**
(`compiler.cc:1513-1522`):

```
a && b  →  <a>;  JMPIFNOT_NP end;  <b>;  end:
a || b  →  <a>;  JMPIF_NP end;  <b>;  end:
```

Both use the **non-popping** conditional jumps (10, 11): if `a` alone determines the result, its value is
left on the stack as the expression's result and `b` is skipped; otherwise `a`'s value is consumed by
falling into `b`, which becomes the result instead. This is the exact mechanism that makes short-circuit
evaluation work, and it is why `JMPIFNOT_NP` / `JMPIF_NP` in real bytecode can be read as `&&` / `||`
directly, with no ambiguity — nothing else in the compiler ever emits them.

## Control-flow reconstruction

TorqueScript's structured control flow becomes flat jumps at compile time; recovering it is standard
control-flow-graph reconstruction, grounded here in the compiler's actual emission patterns rather than
general theory **[engine-source]**:

**If / else** (`compiler.cc:1249-1271`):
```
<test>; JMPIFNOT/JMPIFFNOT elseOrEnd; <ifBlock>; [JMP end; <elseBlock>]
```
An int-typed test emits `JMPIFNOT`; a float-typed test emits `JMPIFFNOT` — which variant appears tells
you the test expression's inferred type.

**While / for** (`compiler.cc:1297-1353`): a leading test with a conditional jump to the loop's exit,
the body, a continue-point, the loop's increment/step expression if any, then a second test jumping back
to the body start. `for` and `while` compile to the identical shape — TorqueScript's `for(init; test;
step)` desugars entirely at the AST stage, so nothing in the bytecode itself distinguishes a `for` loop
from a hand-written `while` with the init hoisted above it and the step placed at the bottom. **This is a
genuine, provable loss**: two different source forms produce byte-identical bytecode, so a decompiler
cannot recover which one was written, only reconstruct one canonical form.

**Ternary** (`compiler.cc:1357-1379`):
```
<test>; JMPIFNOT falseStart; <trueExpr>; JMP end; falseStart: <falseExpr>; end:
```
Structurally identical to if/else with both arms present — the two are only distinguishable because
if/else appears as a statement and ternary appears as an expression feeding into something else
(`SAVEVAR_*`, a call argument, and so on).

**Short-circuit `&&` / `||`** — covered above; the non-popping jumps (10, 11) are unambiguous.

The general recipe: walk the code stream once to record every jump target, build a control-flow graph
from those targets, then pattern-match the standard shapes above against the graph. **[inferred]** — this
last step, matching recovered CFG shapes back to source constructs, is ordinary decompiler methodology
rather than something specific to this engine; the shapes themselves, above, are what's specific and
confirmed.

## Worked example

`TR2Game.cs.dso`, from `c2kconstruction`'s copy of Team Rabbit 2 (section 30), is 81 bytes and pairs with
a `TR2Game.cs` in the same distribution whose only statement, after comment-stripping, is
`exec("scripts/TR2Physics.cs");` — small enough to walk by hand, and independently checkable against real
source **[engine-source]**:

```
Offset  Bytes                                          Field                          Value
0x00    AE 00 00 00                                     version                        174
0x04    1B 00 00 00                                     globalStringTableSize (bytes)  27
0x08    65 78 65 63 00                                  globalStrings[0..4]            "exec\0"
0x0D    73 63 72 69 70 74 73 2F 54 52 32 50 68           globalStrings[5..26]           "scripts/TR2Physics.cs\0"
        79 73 69 63 73 2E 63 73 00
0x23    00 00 00 00                                     globalFloatCount               0
0x27    00 00 00 00                                     functionStringTableSize        0
0x2B    00 00 00 00                                     functionFloatCount             0
0x2F    0A 00 00 00                                     codeSize (logical words)       10
0x33    00 00 00 00                                     lineBreakPairCount             0
```

The code stream runs from `0x37` to `0x40` — ten bytes for ten logical words, since every value here is
under `0xFF` and none trigger the escape path (worth flagging: this sample never exercises the
`0xFF`-prefixed long form, so it doesn't demonstrate that path — only confirms the common case):

| Offset | Byte | Op # | Opcode | Operand |
|---|---|---|---|---|
| 0x37 | 0x51 | 81 | `PUSH_FRAME` | — |
| 0x38 | 0x44 | 68 | `LOADIMMED_STR` | 0x05 → `globalStrings + 5` = `"scripts/TR2Physics.cs"` |
| 0x3A | 0x50 | 80 | `PUSH` | — |
| 0x3B | 0x46 | 70 | `CALLFUNC_RESOLVE` | fnName=0 (patched, below), fnNamespace=0, callType=0 |
| 0x3F | 0x3A | 58 | `STR_TO_NONE` | — |
| 0x40 | 0x0D | 13 | `RETURN` | — |

And the ident table, immediately following at `0x41`:

```
0x41    01 00 00 00     identCount = 1
0x45    00 00 00 00     entry[0].globalStringByteOffset = 0    → "exec"
0x49    01 00 00 00     entry[0].ipCount = 1
0x4D    05 00 00 00     entry[0].ips[0] = 5                    → patches code word 5 (byte 0x3C)
```

File length is 81 bytes; the table ends at `0x51` — exactly matching, which is itself a useful sanity
check when you're reading a file by hand.

**Reading it as a decompiler would:** open a call frame (81); load the string literal at offset 5,
`"scripts/TR2Physics.cs"` (68); finalize it as an argument (80); resolve and call a function whose name —
invisible in the raw bytes at `0x3C`, but patched by the ident table to `"exec"` — is called with
`callType=0`, a plain function call (70); discard the call's return value, meaning it's used as a
statement rather than feeding an expression (58); end of file-scope execution (13). That reads back
directly as:

```php
exec("scripts/TR2Physics.cs");
```

matching the real source exactly.

## What survives, and what doesn't

**Recoverable:**

- Every string and numeric literal, verbatim.
- Every identifier — variable names (local and global alike), field names, function and namespace
  names — via the ident table. This is a stronger guarantee than most compiled formats offer, and it is
  the reason a hand-written V12 decompiler can produce output that reads like the author's own code rather
  than a generic renaming.
- The full control-flow shape: every `if`/`else`, loop, ternary, and short-circuit boolean, from the jump
  patterns above.
- Function and namespace structure, argument names, package membership.

**Not recoverable, confirmed:**

- **Comments.** `//` is TorqueScript's only comment form ([TorqueScript](torquescript.md#comments)).
  **[inferred]** — no opcode above stores or references arbitrary free text, and every field in the file
  layout is accounted for by literals, identifiers, or structure, so there is no mechanism by which
  comment text could survive into a `.dso` even though this handbook has not traced the lexer itself to
  confirm comments are discarded before compilation begins.
- **Whether a loop was written as `for` or `while`.** Both compile to the identical bytecode shape; only
  one canonical form can be reconstructed.
- **Explicit vs. implicit type conversions.** `%x = %y;` where `%y` is a string that happens to look
  numeric, versus an explicit cast, can compile to the same `*_TO_*` opcode sequence — the distinction is
  provably erased, not merely hard to recover.
- **Original formatting and whitespace**, as with any compiled format.

## Related

- [Packaging](../06-shipping/packaging.md#dso-compilation) — when and why `.dso` files are generated, and the staleness trap
- [File formats](../reference/file-formats.md) — `.dso` in context with the rest of the shipped formats
- [TorqueScript](torquescript.md) — the language this bytecode implements; read this first if you haven't
- [Debugging](../06-shipping/debugging.md) — `setEchoFileLoads`, and diagnosing stale-`.dso` symptoms
- [35 · NinjaMod](../35-ninja-mod/README.md), [54 · Masters mod](../54-mastersmod/README.md), [55 · GibMatch](../55-gibmatch/README.md) — mods documented in this handbook from `.dso`-only distributions
