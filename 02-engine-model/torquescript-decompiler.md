# TorqueScript — V12 Decompiler

Plenty of mods in this handbook — sections 35, 54, and 55 among them — survive only as `.dso`, with no `.cs`
source anywhere in their distribution. This page is how you read one back: `.cs.dso` → `.cs`. For the
format itself — header layout, the byte-packed code stream, the full opcode set, and everything the
compiler does to produce a `.dso` — see [TorqueScript — V12 Compiler](torquescript-compiler.md), which this
page assumes.

## Try it

Pick a real `.cs.dso` file and this runs entirely in your browser — nothing is uploaded anywhere. It's the
same parser documented on the Compiler page, tested there against 2,589 real files with zero parse
failures; what you get is a full disassembly listing (always structurally exact) plus a best-effort
reconstruction into readable TorqueScript (accurate on everything this handbook has verified against real
paired source — see "What survives, and what doesn't" below for where it has to guess).

<div class="dso-tool" markdown="0">
  <style>
    .dso-tool { border: 1px solid rgba(0,255,0,0.22); border-left: 3px solid #00ff00;
      background: #071a22; padding: 1rem 1.15rem; margin: 1.5rem 0; }
    .dso-tool .dso-row { display: flex; flex-wrap: wrap; align-items: center; gap: 0.75rem; }
    .dso-tool input[type=file] { color: #a9d7fa; font-family: inherit; }
    .dso-tool .dso-status { color: #3cb4b4; font-size: 0.92rem; margin-top: 0.6rem; min-height: 1.3em; }
    .dso-tool .dso-status.dso-error { color: #ffc209; }
    .dso-tool .dso-output { margin-top: 1rem; }
    .dso-tool .dso-output h4 { margin: 0 0 0.4rem; color: #06f5d7; font-size: 0.95rem; }
    .dso-tool details { margin-top: 1rem; }
    .dso-tool summary { cursor: pointer; color: #3cb4b4; }
    .dso-tool pre { max-height: 32rem; overflow-y: auto; }
  </style>
  <div class="dso-row">
    <label for="dso-file-input"><strong>Choose a <code>.cs.dso</code> file</strong></label>
    <input type="file" id="dso-file-input" accept=".dso">
  </div>
  <div class="dso-status" id="dso-tool-status">No file chosen yet.</div>
  <div class="dso-output" id="dso-tool-output" hidden>
    <h4>Reconstructed source (best-effort)</h4>
    <pre><code id="dso-reconstruction"></code></pre>
    <details>
      <summary>Full disassembly (always structurally exact)</summary>
      <pre><code id="dso-disassembly"></code></pre>
    </details>
  </div>
</div>
<script src="{{ '/assets/js/dso-decompiler.js' | relative_url }}"></script>
<script>
(function () {
  "use strict";
  var input = document.getElementById("dso-file-input");
  var status = document.getElementById("dso-tool-status");
  var output = document.getElementById("dso-tool-output");
  var reconEl = document.getElementById("dso-reconstruction");
  var disasmEl = document.getElementById("dso-disassembly");
  if (!input || !window.T2Dso) return;

  input.addEventListener("change", function () {
    var file = input.files && input.files[0];
    output.hidden = true;
    status.classList.remove("dso-error");
    if (!file) { status.textContent = "No file chosen yet."; return; }
    status.textContent = "Reading " + file.name + "…";

    var reader = new FileReader();
    reader.onerror = function () {
      status.classList.add("dso-error");
      status.textContent = "Could not read " + file.name + ".";
    };
    reader.onload = function () {
      try {
        var result = window.T2Dso.decompile(reader.result);
        var warnings = result.dso.warnings;
        status.textContent = file.name + " — " + result.instructions.length + " instruction(s), " +
          result.dso.version + " version field" +
          (warnings.length ? " — " + warnings.join("; ") : " — parsed cleanly");
        reconEl.textContent = result.reconstruction || "(no code — file compiles to an empty codeblock)";
        disasmEl.textContent = result.disassembly;
        output.hidden = false;
      } catch (e) {
        status.classList.add("dso-error");
        status.textContent = "Could not parse " + file.name + ": " + e.message;
      }
    };
    reader.readAsArrayBuffer(file);
  });
})();
</script>

## What survives, and what doesn't

**Recoverable:**

- Every string and numeric literal, verbatim.
- **Whether a string literal was tagged (`'single-quoted'`) or plain (`"double-quoted"`)** — these compile
  to different opcodes (`TAG_TO_STR` vs `LOADIMMED_STR`), so the distinction survives even though nothing
  else about a string's original formatting does.
- Every identifier — variable names (local and global alike), field names, function and namespace names —
  via the ident table, though see the Compiler page's note on case: the exact spelling recovered may not
  match a specific source occurrence, even though the identifier itself is exact.
- The full control-flow shape: every `if`/`else`, loop, ternary, and short-circuit boolean, from the jump
  patterns documented on the Compiler page.
- Function and namespace structure, argument names, package membership.
- Object construction: class, name, and inheritance parent for every `new` block.

**Not recoverable, confirmed:**

- **Comments.** `//` is TorqueScript's only comment form ([TorqueScript](torquescript.md#comments)).
  **[inferred]** — no opcode stores or references arbitrary free text, and every field in the file layout is
  accounted for by literals, identifiers, or structure, so there is no mechanism by which comment text could
  survive into a `.dso`.
- **`true`/`false` versus the literal `1`/`0`.** Both compile to the identical literal-push opcode — a
  decompiled `%x = 1;` may have been written as `%x = true;` in the original. Confirmed directly: a real
  file's `delClPieces(%c, true)` decompiles as `delClPieces(%c, "1")`, with no trace of which form the
  author used.
- **Escape shorthand for control characters**, such as the chat-colour escape `\c2`. It compiles down to a
  single raw control byte in the string table — a decompiler sees only that byte, not the two-character
  source shorthand that produced it. Confirmed against a real file: source `"\c2Deleted all"` decompiles as
  a string containing a single `0x04` control byte, not the `\c2` spelling.
- **Whether a loop was written as `for` or `while`.** Both compile to the identical bytecode shape; only one
  canonical form can be reconstructed.
- **Explicit vs. implicit type conversions.** `%x = %y;` where `%y` is a string that happens to look
  numeric, versus an explicit cast, can compile to the same `*_TO_*` opcode sequence — the distinction is
  provably erased, not merely hard to recover.
- **Original formatting and whitespace**, as with any compiled format.

**Not attempted, honestly:** the reconstruction tool above does not turn loop back-edges into `while`/`for`
syntax — it leaves an unstructured-jump comment pointing at the disassembly instead of guessing at a loop
shape it can't fully validate yet. Everything else on this page's "recoverable" list, the tool does
reconstruct.

## Worked example

`TR2Game.cs.dso`, from `c2kconstruction`'s copy of Team Rabbit 2 (section 30), is 81 bytes and pairs with a
`TR2Game.cs` in the same distribution whose only statement, after comment-stripping, is
`exec("scripts/TR2Physics.cs");` — small enough to walk by hand, and independently checkable against real
source **[dso-verified]**:

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
under `0xFF` and none trigger the escape path:

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

File length is 81 bytes; the table ends at `0x51` — exactly matching, which is itself a useful sanity check
when you're reading a file by hand, and exactly what the tool above checks for every file it's handed.

**Reading it as a decompiler would:** open a call frame (81); load the string literal at offset 5,
`"scripts/TR2Physics.cs"` (68); finalize it as an argument (80); resolve and call a function whose name —
invisible in the raw bytes at `0x3C`, but patched by the ident table to `"exec"` — is called with
`callType=0`, a plain function call (70); discard the call's return value, meaning it's used as a statement
rather than feeding an expression (58); end of file-scope execution (13). That reads back directly as:

```php
exec("scripts/TR2Physics.cs");
```

matching the real source exactly, and matching what the tool above prints if you feed it this same file.

## Related

- [TorqueScript — V12 Compiler](torquescript-compiler.md) — the format and compilation shapes this page assumes
- [Packaging](../06-shipping/packaging.md#dso-compilation) — when and why `.dso` files are generated, and the staleness trap
- [File formats](../reference/file-formats.md) — `.dso` in context with the rest of the shipped formats
- [TorqueScript](torquescript.md) — the language this bytecode implements; read this first if you haven't
- [Debugging](../06-shipping/debugging.md) — `setEchoFileLoads`, and diagnosing stale-`.dso` symptoms
- [35 · NinjaMod](../35-ninja-mod/README.md), [54 · Masters mod](../54-mastersmod/README.md), [55 · GibMatch](../55-gibmatch/README.md) — mods documented in this handbook from `.dso`-only distributions
