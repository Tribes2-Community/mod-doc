/* ---------------------------------------------------------------------------
   V12 .cs.dso reader, disassembler, and best-effort decompiler.

   Runs unmodified under Node (used to validate this file against a large
   corpus of real .cs.dso files before it ever ships to a reader) and in the
   browser (the tool embedded on the Decompiler page). No network access,
   no dependencies — everything after the header is derived structurally
   from the bytes of the file you feed it.

   Format facts here are confirmed empirically: this parser has been run
   against every real .cs.dso file findable in this project's workspace and
   checked for (a) clean termination exactly at end-of-file and (b) output
   matching known paired .cs source where one exists. See the "V12 Compiler"
   page for the citation-by-corpus methodology.
   --------------------------------------------------------------------------- */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.T2Dso = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  /* opcode # -> [mnemonic, operand kinds]
     kind is a hint only — resolveOperand() always checks the ident table
     first, so a wrong hint here degrades gracefully rather than lying. */
  var OPCODES = [
    ["FUNC_DECL", "funcdecl"],
    ["CREATE_OBJECT", ["ident", "raw", "jump"]],
    ["CREATE_DATABLOCK", []],
    ["NAME_OBJECT", []],
    ["ADD_OBJECT", ["raw"]],
    ["END_OBJECT", ["raw"]],
    ["JMPIFFNOT", ["jump"]],
    ["JMPIFNOT", ["jump"]],
    ["JMPIFF", ["jump"]],
    ["JMPIF", ["jump"]],
    ["JMPIFNOT_NP", ["jump"]],
    ["JMPIF_NP", ["jump"]],
    ["JMP", ["jump"]],
    ["RETURN", []],
    ["CMPEQ", []],
    ["CMPGR", []],
    ["CMPGE", []],
    ["CMPLT", []],
    ["CMPLE", []],
    ["CMPNE", []],
    ["XOR", []],
    ["MOD", []],
    ["BITAND", []],
    ["BITOR", []],
    ["NOT", []],
    ["NOTF", []],
    ["ONESCOMPLEMENT", []],
    ["SHR", []],
    ["SHL", []],
    ["AND", []],
    ["OR", []],
    ["ADD", []],
    ["SUB", []],
    ["MUL", []],
    ["DIV", []],
    ["NEG", []],
    ["SETCURVAR", ["ident"]],
    ["SETCURVAR_CREATE", ["ident"]],
    ["SETCURVAR_ARRAY", []],
    ["SETCURVAR_ARRAY_CREATE", []],
    ["LOADVAR_UINT", []],
    ["LOADVAR_FLT", []],
    ["LOADVAR_STR", []],
    ["SAVEVAR_UINT", []],
    ["SAVEVAR_FLT", []],
    ["SAVEVAR_STR", []],
    ["SETCUROBJECT", []],
    ["SETCUROBJECT_NEW", []],
    ["SETCURFIELD", ["ident"]],
    ["SETCURFIELD_ARRAY", []],
    ["LOADFIELD_UINT", []],
    ["LOADFIELD_FLT", []],
    ["LOADFIELD_STR", []],
    ["SAVEFIELD_UINT", []],
    ["SAVEFIELD_FLT", []],
    ["SAVEFIELD_STR", []],
    ["STR_TO_UINT", []],
    ["STR_TO_FLT", []],
    ["STR_TO_NONE", []],
    ["FLT_TO_UINT", []],
    ["FLT_TO_STR", []],
    ["FLT_TO_NONE", []],
    ["UINT_TO_FLT", []],
    ["UINT_TO_STR", []],
    ["UINT_TO_NONE", []],
    ["LOADIMMED_UINT", ["raw"]],
    ["LOADIMMED_FLT", ["floatidx"]],
    ["TAG_TO_STR", ["stroff"]],
    ["LOADIMMED_STR", ["stroff"]],
    ["LOADIMMED_IDENT", ["ident"]],
    ["CALLFUNC_RESOLVE", ["ident", "ident", "raw"]],
    ["CALLFUNC", ["ident", "raw", "raw"]],
    ["PROCESS_ARGS", []],
    ["ADVANCE_STR", []],
    ["ADVANCE_STR_APPENDCHAR", ["raw"]],
    ["ADVANCE_STR_COMMA", []],
    ["ADVANCE_STR_NUL", []],
    ["REWIND_STR", []],
    ["TERMINATE_REWIND_STR", []],
    ["COMPARE_STR", []],
    ["PUSH", []],
    ["PUSH_FRAME", []],
    ["BREAK", []],
    ["INVALID", []]
  ];

  var OP_BY_NAME = {};
  OPCODES.forEach(function (o, i) { OP_BY_NAME[o[0]] = i; });

  function DsoError(message) { this.message = message; this.name = "DsoError"; }
  DsoError.prototype = Object.create(Error.prototype);

  /* --- Byte-level reader -------------------------------------------------- */
  function Reader(buf) {
    this.view = new DataView(buf);
    this.bytes = new Uint8Array(buf);
    this.pos = 0;
    this.length = buf.byteLength;
  }
  Reader.prototype.u32 = function () {
    if (this.pos + 4 > this.length) throw new DsoError("unexpected end of file reading u32 at " + this.pos);
    var v = this.view.getUint32(this.pos, true);
    this.pos += 4;
    return v;
  };
  Reader.prototype.f64 = function () {
    if (this.pos + 8 > this.length) throw new DsoError("unexpected end of file reading f64 at " + this.pos);
    var v = this.view.getFloat64(this.pos, true);
    this.pos += 8;
    return v;
  };
  Reader.prototype.bytesRaw = function (n) {
    if (this.pos + n > this.length) throw new DsoError("unexpected end of file reading " + n + " bytes at " + this.pos);
    var v = this.bytes.subarray(this.pos, this.pos + n);
    this.pos += n;
    return v;
  };
  /* One packed logical code word: 1 byte if < 0xFF, else 0xFF + u32. */
  Reader.prototype.packedWord = function () {
    if (this.pos + 1 > this.length) throw new DsoError("unexpected end of file reading packed word at " + this.pos);
    var b = this.bytes[this.pos];
    if (b !== 0xFF) { this.pos += 1; return b; }
    this.pos += 1;
    return this.u32();
  };

  function cstr(bytes, offset) {
    /* offset === bytes.length is a valid zero-length string sitting exactly
       at the buffer's end (seen in real files — e.g. an implicit/unnamed
       function parameter); only offset > length is genuinely out of range. */
    if (offset < 0 || offset > bytes.length) return null;
    var end = offset;
    while (end < bytes.length && bytes[end] !== 0) end++;
    return { text: utf8Decode(bytes.subarray(offset, end)), end: end };
  }

  var textDecoder = (typeof TextDecoder !== "undefined") ? new TextDecoder("utf-8") : null;
  function utf8Decode(u8) {
    if (textDecoder) return textDecoder.decode(u8);
    var s = "";
    for (var i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]);
    return s;
  }

  /* --- Stage 1: parse the fixed layout ------------------------------------ */
  function parse(buf) {
    var r = new Reader(buf);
    var out = { errors: [], warnings: [] };

    out.version = r.u32();

    var gsSize = r.u32();
    out.globalStrings = r.bytesRaw(gsSize);

    var gfCount = r.u32();
    out.globalFloats = [];
    for (var i = 0; i < gfCount; i++) out.globalFloats.push(r.f64());

    var fsSize = r.u32();
    out.functionStrings = r.bytesRaw(fsSize);

    var ffCount = r.u32();
    out.functionFloats = [];
    for (var j = 0; j < ffCount; j++) out.functionFloats.push(r.f64());

    var codeSize = r.u32();
    var lineBreakPairCount = r.u32();

    out.words = new Array(codeSize);
    for (var w = 0; w < codeSize; w++) out.words[w] = r.packedWord();

    /* Line-break pairs are raw u32s, NOT byte-packed. */
    out.lineBreaks = [];
    for (var lb = 0; lb < lineBreakPairCount; lb++) {
      out.lineBreaks.push([r.u32(), r.u32()]);
    }

    var identCount = r.u32();
    out.identTable = {}; /* code-word index (ip) -> resolved name */
    out.identEntries = [];
    for (var e = 0; e < identCount; e++) {
      var offset = r.u32();
      var ipCount = r.u32();
      var name = cstr(out.globalStrings, offset);
      var ips = [];
      for (var k = 0; k < ipCount; k++) {
        var ip = r.u32();
        ips.push(ip);
        out.identTable[ip] = name ? name.text : ("<bad-offset:" + offset + ">");
      }
      out.identEntries.push({ offset: offset, name: name ? name.text : null, ips: ips });
    }

    out.trailingBytes = out.length_after_parse = r.length - r.pos;
    out.consumedBytes = r.pos;
    out.totalBytes = r.length;
    if (out.trailingBytes !== 0) {
      out.warnings.push(out.trailingBytes + " unconsumed byte(s) after the ident table");
    }
    return out;
  }

  /* --- Stage 2: disassemble the flat word stream into instructions -------- */
  function disassemble(dso) {
    var words = dso.words;
    var insns = [];
    var ip = 0;
    var funcEndStack = []; // stack of endIp values, innermost last

    while (ip < words.length) {
      var opNum = words[ip];
      var def = OPCODES[opNum];
      if (!def) {
        insns.push({ ip: ip, op: opNum, name: "<invalid:" + opNum + ">", operands: [], len: 1,
          inFunction: funcEndStack.length > 0 });
        ip += 1;
        continue;
      }
      var name = def[0];
      var kinds = def[1];
      var operands = [];
      var len;

      if (kinds === "funcdecl") {
        var fixedKinds = ["ident", "ident", "ident", "raw", "jump", "raw"];
        for (var fi = 0; fi < fixedKinds.length; fi++) {
          operands.push(resolveOperand(dso, ip + 1 + fi, fixedKinds[fi], funcEndStack.length > 0));
        }
        var argc = operands[5].value;
        for (var ai = 0; ai < argc; ai++) {
          operands.push(resolveOperand(dso, ip + 7 + ai, "ident", funcEndStack.length > 0));
        }
        len = 7 + argc;
        var endIp = operands[4].value;
        funcEndStack.push(endIp);
      } else {
        var inFunc = funcEndStack.length > 0;
        for (var oi = 0; oi < kinds.length; oi++) {
          operands.push(resolveOperand(dso, ip + 1 + oi, kinds[oi], inFunc));
        }
        len = 1 + kinds.length;
      }

      insns.push({ ip: ip, op: opNum, name: name, operands: operands, len: len,
        inFunction: funcEndStack.length > 0 });

      ip += len;
      while (funcEndStack.length && ip >= funcEndStack[funcEndStack.length - 1]) funcEndStack.pop();
    }

    if (ip !== words.length) {
      dso.warnings.push("disassembly walk ended at word " + ip + ", expected " + words.length +
        " — a fixed-operand-count assumption is probably wrong for some opcode in this file");
    }
    return insns;
  }

  function resolveOperand(dso, ip, declaredKind, inFunction) {
    if (Object.prototype.hasOwnProperty.call(dso.identTable, ip)) {
      return { ip: ip, kind: "ident", value: dso.identTable[ip], raw: dso.words[ip] };
    }
    var raw = dso.words[ip];
    switch (declaredKind) {
      case "stroff": {
        var table = inFunction ? dso.functionStrings : dso.globalStrings;
        var s = cstr(table, raw);
        return { ip: ip, kind: "string", value: s ? s.text : null, raw: raw,
          scope: inFunction ? "function" : "global" };
      }
      case "floatidx": {
        var ftable = inFunction ? dso.functionFloats : dso.globalFloats;
        return { ip: ip, kind: "float", value: ftable[raw], raw: raw,
          scope: inFunction ? "function" : "global" };
      }
      case "jump":
        return { ip: ip, kind: "jump", value: raw, raw: raw };
      case "ident":
        return { ip: ip, kind: "ident-unresolved", value: null, raw: raw };
      default:
        return { ip: ip, kind: "raw", value: raw, raw: raw };
    }
  }

  /* Torque-style quoting for the reconstruction output — not JS's \u00XX,
     which isn't valid TorqueScript. Tagged (single-quoted) vs plain
     (double-quoted) is a real, recoverable distinction: only TAG_TO_STR
     produces the former, only LOADIMMED_STR the latter. */
  function quoteTorque(str, tagged) {
    var q = tagged ? "'" : '"';
    var out = q;
    for (var i = 0; i < str.length; i++) {
      var ch = str[i], c = str.charCodeAt(i);
      if (ch === "\\") out += "\\\\";
      else if (ch === q) out += "\\" + q;
      else if (c === 0x09) out += "\\t";
      else if (c === 0x0A) out += "\\n";
      else if (c < 0x20 || c === 0x7F) out += "\\x" + c.toString(16).padStart(2, "0");
      else out += ch;
    }
    return out + q;
  }

  /* --- Rendering a plain disassembly listing ------------------------------ */
  function formatOperand(o) {
    switch (o.kind) {
      case "ident": return o.value;
      case "string": return o.value === null ? "<bad string offset " + o.raw + ">" : JSON.stringify(o.value);
      case "float": return (o.value === undefined) ? "<bad float index " + o.raw + ">" : String(o.value);
      case "jump": return "L" + o.value;
      case "ident-unresolved": return String(o.raw);
      default: return String(o.raw);
    }
  }

  function disassemblyText(dso, insns) {
    var lines = [];
    var jumpTargets = {};
    insns.forEach(function (ins) {
      ins.operands.forEach(function (o) { if (o.kind === "jump") jumpTargets[o.value] = true; });
    });
    insns.forEach(function (ins) {
      var label = jumpTargets[ins.ip] ? "L" + ins.ip + ":" : "";
      var operandText = ins.operands.map(formatOperand).join(", ");
      lines.push(
        String(ins.ip).padStart(5, " ") + "  " + label.padEnd(8, " ") + "  " +
        ins.name.padEnd(24, " ") + operandText
      );
    });
    return lines.join("\n");
  }

  /* --- Stage 3: best-effort statement/expression reconstruction ----------- */
  /* This half is heuristic. It is built and validated against real files with
     known .cs pairs, but unlike the disassembly above it can be wrong on
     constructs this project hasn't seen a real example of. Anything it
     can't confidently reconstruct falls back to a disassembly-style comment
     rather than guessing silently. */

  var BIN_INT_OPS = {
    XOR: "^", MOD: "%", BITAND: "&", BITOR: "|", SHR: ">>", SHL: "<<", AND: "&&", OR: "||"
  };
  var BIN_FLT_OPS = { ADD: "+", SUB: "-", MUL: "*", DIV: "/" };
  var CMP_OPS = { CMPEQ: "==", CMPGR: ">", CMPGE: ">=", CMPLT: "<", CMPLE: "<=", CMPNE: "!=" };

  function reconstruct(dso, insns) {
    var out = [];
    var indent = 0;
    function emit(s) { out.push("   ".repeat(indent) + s); }

    var intStack = [];
    var fltStack = [];

    /* STR register model. LOADIMMED_STR/LOADVAR_STR/LOADFIELD_STR/TAG_TO_STR/
       LOADIMMED_IDENT/FLT_TO_STR/UINT_TO_STR each *replace* `current` — they
       do not by themselves grow a concatenation. Only the ADVANCE_STR family
       commits `current` into `segments` and starts a fresh one, which is
       exactly what "starts a new segment" (the opcode table's own wording)
       means. A single frame — {segments, current, args} — covers one nested
       PUSH_FRAME level; PUSH_FRAME opens a frame for a whole call, and each
       PUSH inside it commits one argument without closing the frame — only
       the matching CALLFUNC(_RESOLVE) does that. */
    var strFrames = [{ segments: [], current: null, args: [] }];
    var curField = null, curFieldArrayed = false;
    var curVarName = null;   // SETCURVAR(_CREATE) / SETCURVAR_ARRAY(_CREATE) target, read by LOADVAR_*/SAVEVAR_*
    var curObjExpr = null;   // SETCUROBJECT(_NEW) target, read by fieldExpr() for LOADFIELD_*/SAVEFIELD_*
    var objStack = [];       // saves/restores the above three across nested CREATE_OBJECT/END_OBJECT

    /* Scopes close themselves once the walk reaches their known end ip,
       instead of relying on any one instruction to mark the close — that
       makes nested/sibling functions and if-blocks-without-else close at
       the right place regardless of what's inside them. */
    var scopeStack = []; // {endIp, text, isFunc}

    function closeScopesUpTo(ip) {
      while (scopeStack.length && ip >= scopeStack[scopeStack.length - 1].endIp) {
        var s = scopeStack.pop();
        indent = Math.max(0, indent - 1);
        emit(s.text);
      }
    }

    /* JMPIFNOT_NP/JMPIF_NP (a && b / a || b) don't produce their combined
       value until control reaches their shared jump target — the opcode
       that fires there (almost always the next conditional jump) needs to
       pop the freshly-computed rhs and splice it with the deferred lhs
       before it reads "its own" condition. */
    var pendingShortCircuit = [];
    function resolvePendingShortCircuit(ip) {
      while (pendingShortCircuit.length && pendingShortCircuit[pendingShortCircuit.length - 1].targetIp === ip) {
        var p = pendingShortCircuit.pop();
        var rhs = intStack.pop();
        if (rhs === undefined) rhs = "?";
        intStack.push("(" + p.lhs + " " + p.opText + " " + rhs + ")");
      }
    }

    function strTop() { return strFrames[strFrames.length - 1]; }
    function segText(s) { return s.text; }
    /* Set the single pending value — from LOADIMMED_STR and friends. */
    function setCurrent(text, fromIdent) { strTop().current = { text: text, fromIdent: !!fromIdent }; }
    /* A single-value read (SETCUROBJECT, SETCURFIELD_ARRAY): take just the
       freshest value, leave any unrelated concatenation-in-progress alone. */
    function readCurrentAndClear() {
      var f = strTop();
      var v = f.current ? f.current.text : '""';
      f.current = null;
      return v;
    }
    /* A whole-expression read (SAVEVAR_STR, PUSH, STR_TO_NONE, RETURN, ...):
       join every committed segment plus whatever's still pending, then reset
       the frame for the next statement. */
    function readAllAndClear() {
      var f = strTop();
      var all = f.current ? f.segments.concat([f.current]) : f.segments;
      f.segments = []; f.current = null;
      return all.length ? all.map(segText).join(" @ ") : '""';
    }
    function allSegs() {
      var f = strTop();
      return f.current ? f.segments.concat([f.current]) : f.segments;
    }
    /* ADVANCE_STR-family: commit the pending value (if any) into segments,
       optionally appending a literal of its own, then clear current. */
    function commitAdvance(literal) {
      var f = strTop();
      if (f.current) { f.segments.push(f.current); f.current = null; }
      if (literal !== undefined) f.segments.push({ text: literal, fromIdent: false });
    }
    /* $var[index] / %var[index]: split at the last ident-origin piece —
       everything from there on is base+subscript; anything built earlier
       (e.g. the RHS value of an assignment, evaluated first) is left in
       place, still pending, for whatever reads STR next. */
    function splitArrayExpr() {
      var f = strTop();
      var all = allSegs();
      var idx = -1;
      for (var k = all.length - 1; k >= 0; k--) { if (all[k].fromIdent) { idx = k; break; } }
      var arrSegs, leftover;
      if (idx === -1) { arrSegs = all; leftover = []; }
      else { arrSegs = all.slice(idx); leftover = all.slice(0, idx); }
      f.segments = leftover; f.current = null;
      var parts = arrSegs.map(segText).map(function (p) {
        var m = /^"(\d+)"$/.exec(p); // a bare numeric subscript — [0], not ["0"]
        return m ? m[1] : p;
      });
      if (!parts.length) return '""';
      return parts.length >= 2 ? parts[0] + "[" + parts.slice(1).join(" @ ") + "]" : parts[0];
    }

    var i = 0;
    var lastIdx = insns.length - 1;
    while (i < insns.length) {
      var ins = insns[i];
      closeScopesUpTo(ins.ip);
      resolvePendingShortCircuit(ins.ip);
      switch (ins.name) {
        case "FUNC_DECL": {
          var fname = ins.operands[0].kind === "ident" ? ins.operands[0].value : "<fn>";
          var ns = ins.operands[1].kind === "ident" ? ins.operands[1].value : null;
          var args = ins.operands.slice(6).map(formatOperand);
          emit("function " + (ns ? ns + "::" : "") + fname + "(" + args.join(", ") + ")");
          emit("{");
          indent++;
          scopeStack.push({ endIp: ins.operands[4].value, text: "}", isFunc: true });
          break;
        }
        case "CREATE_OBJECT": {
          /* Like a call: PUSH_FRAME/PUSH(es) collected className, then the
             object name, then any positional construction args, before this
             opcode runs — CREATE_OBJECT's own word-operands are a separate
             ": Parent" inheritance ident and the isDatablock/failJump pair. */
          var ctorFrame = strFrames.pop() || { args: [] };
          var className = ctorFrame.args[0] || "<class>";
          var nameArgs = ctorFrame.args.slice(1);
          var parentOp = ins.operands[0];
          var parentClause = (parentOp.kind === "ident" && parentOp.value) ? " : " + parentOp.value : "";
          emit("new " + className + "(" + nameArgs.join(", ") + ")" + parentClause + " {");
          objStack.push({ curObjExpr: curObjExpr, curField: curField, curFieldArrayed: curFieldArrayed });
          curObjExpr = "%obj";
          indent++;
          break;
        }
        case "ADD_OBJECT":
          break; // object registration — no separate source-level statement
        case "END_OBJECT": {
          indent = Math.max(0, indent - 1);
          emit("};");
          var outer = objStack.pop() || { curObjExpr: null, curField: null, curFieldArrayed: false };
          curObjExpr = outer.curObjExpr; curField = outer.curField; curFieldArrayed = outer.curFieldArrayed;
          break;
        }
        case "SETCURVAR": case "SETCURVAR_CREATE":
          /* Identifier text already carries its own sigil ('%' or '$'). */
          curVarName = ins.operands[0].kind === "ident" ? ins.operands[0].value : "?";
          break;
        case "SETCURVAR_ARRAY": case "SETCURVAR_ARRAY_CREATE":
          curVarName = splitArrayExpr();
          break;
        case "LOADVAR_UINT": case "LOADVAR_FLT":
          intStack.push(curVarName); fltStack.push(curVarName);
          break;
        case "LOADVAR_STR":
          setCurrent(curVarName);
          break;
        case "SAVEVAR_UINT":
          emit(curVarName + " = " + (intStack[intStack.length - 1] || "?") + ";");
          break;
        case "SAVEVAR_FLT":
          emit(curVarName + " = " + (fltStack[fltStack.length - 1] || "?") + ";");
          break;
        case "SAVEVAR_STR":
          emit(curVarName + " = " + readAllAndClear() + ";");
          break;
        case "SETCUROBJECT":
          curObjExpr = readCurrentAndClear();
          break;
        case "SETCUROBJECT_NEW":
          curObjExpr = "%obj";
          break;
        case "SETCURFIELD":
          curField = ins.operands[0].kind === "ident" ? ins.operands[0].value : "?";
          curFieldArrayed = false;
          break;
        case "SETCURFIELD_ARRAY":
          curFieldArrayed = readCurrentAndClear();
          break;
        case "LOADFIELD_UINT": case "LOADFIELD_FLT": {
          var fexpr = fieldExpr();
          intStack.push(fexpr); fltStack.push(fexpr);
          break;
        }
        case "LOADFIELD_STR":
          setCurrent(fieldExpr());
          break;
        case "SAVEFIELD_UINT":
          emit(fieldExpr() + " = " + (intStack[intStack.length - 1] || "?") + ";");
          break;
        case "SAVEFIELD_FLT":
          emit(fieldExpr() + " = " + (fltStack[fltStack.length - 1] || "?") + ";");
          break;
        case "SAVEFIELD_STR":
          emit(fieldExpr() + " = " + readAllAndClear() + ";");
          break;
        case "LOADIMMED_UINT":
          intStack.push(String(ins.operands[0].raw));
          fltStack.push(String(ins.operands[0].raw));
          break;
        case "LOADIMMED_FLT": {
          var fv = formatOperand(ins.operands[0]);
          intStack.push(fv); fltStack.push(fv);
          break;
        }
        case "TAG_TO_STR": {
          var tso = ins.operands[0];
          setCurrent(tso.kind === "string" ? quoteTorque(tso.value || "", true) : formatOperand(tso));
          break;
        }
        case "LOADIMMED_STR": {
          var lso = ins.operands[0];
          setCurrent(lso.kind === "string" ? quoteTorque(lso.value || "", false) : formatOperand(lso));
          break;
        }
        case "LOADIMMED_IDENT":
          setCurrent(formatOperand(ins.operands[0]), true);
          break;
        case "STR_TO_UINT": case "STR_TO_FLT": {
          var sv = readAllAndClear();
          intStack.push(sv); fltStack.push(sv);
          break;
        }
        case "STR_TO_NONE": {
          var stmt = readAllAndClear();
          if (stmt !== '""') emit(stmt + ";");
          break;
        }
        case "FLT_TO_UINT":
          intStack.push(intStack.pop() !== undefined ? fltStack[fltStack.length - 1] : "?");
          break;
        case "FLT_TO_STR":
          setCurrent(fltStack.pop() || "?");
          break;
        case "FLT_TO_NONE":
          fltStack.pop();
          break;
        case "UINT_TO_FLT":
          break;
        case "UINT_TO_STR":
          setCurrent(intStack.pop() || "?");
          break;
        case "UINT_TO_NONE":
          intStack.pop();
          break;
        /* Binary operators compile their RIGHT operand first (pushed
           deeper), LEFT operand second (pushed on top) — confirmed by
           comparing real bytecode order against known source (see the
           Compiler page). So the first pop is the source's LHS, the second
           is its RHS: render lhs-first even though it pops second-to-last. */
        case "ADD": case "SUB": case "MUL": case "DIV": {
          var flhs = fltStack.pop(), frhs = fltStack.pop();
          fltStack.push("(" + flhs + " " + BIN_FLT_OPS[ins.name] + " " + frhs + ")");
          break;
        }
        case "XOR": case "MOD": case "BITAND": case "BITOR": case "AND": case "OR": {
          var ilhs = intStack.pop(), irhs = intStack.pop();
          intStack.push("(" + ilhs + " " + BIN_INT_OPS[ins.name] + " " + irhs + ")");
          break;
        }
        case "SHR": case "SHL": {
          var slhs = intStack.pop(), srhs = intStack.pop();
          intStack.push("(" + slhs + " " + BIN_INT_OPS[ins.name] + " " + srhs + ")");
          break;
        }
        case "CMPEQ": case "CMPGR": case "CMPGE": case "CMPLT": case "CMPLE": case "CMPNE": {
          var clhs = fltStack.pop(), crhs = fltStack.pop();
          intStack.push("(" + clhs + " " + CMP_OPS[ins.name] + " " + crhs + ")");
          break;
        }
        case "COMPARE_STR": {
          /* "Push int result of string compare of the top two SEGMENTS" —
             this reads the current frame's last two built values, not two
             separate PUSH_FRAME frames. Popping frames here (as an earlier
             version of this tool did) silently drains strFrames across a
             file and eventually underflows it. */
          var csAll = allSegs();
          var csLhs = csAll.pop(), csRhs = csAll.pop();
          strTop().segments = csAll; strTop().current = null;
          intStack.push("(" + (csLhs ? csLhs.text : '""') + " $= " + (csRhs ? csRhs.text : '""') + ")");
          break;
        }
        case "NOT":
          intStack.push("!" + (intStack.pop() || "?"));
          break;
        case "NOTF":
          intStack.push("!" + (fltStack.pop() || "?"));
          break;
        case "ONESCOMPLEMENT":
          intStack.push("~" + (intStack.pop() || "?"));
          break;
        case "NEG":
          fltStack.push("-" + (fltStack.pop() || "?"));
          break;
        case "PUSH_FRAME":
          strFrames.push({ segments: [], current: null, args: [] });
          break;
        case "PUSH":
          /* One PUSH_FRAME covers a whole call; each PUSH commits the
             expression built so far as ONE argument and clears it so the
             next argument starts clean — the frame itself doesn't close
             until the matching CALLFUNC(_RESOLVE) below. */
          strTop().args = strTop().args || [];
          strTop().args.push(readAllAndClear());
          break;
        case "ADVANCE_STR":
          commitAdvance();
          break;
        case "ADVANCE_STR_APPENDCHAR": {
          var code = ins.operands[0].raw;
          var lit = code === 0x20 ? "SPC" : code === 0x09 ? "TAB" : code === 0x0A ? "NL" : ("chr(" + code + ")");
          commitAdvance(lit);
          break;
        }
        case "ADVANCE_STR_COMMA":
          commitAdvance("'_'");
          break;
        case "ADVANCE_STR_NUL":
          commitAdvance();
          break;
        case "REWIND_STR": case "TERMINATE_REWIND_STR":
          /* No-op here: splitArrayExpr() finds the array-key segments by
             their LOADIMMED_IDENT origin, so it doesn't need this bracket
             to know where the value ends and the subscript begins. */
          break;
        case "CALLFUNC_RESOLVE": case "CALLFUNC": {
          var fn = ins.operands[0].kind === "ident" ? ins.operands[0].value : "<fn>";
          var nsOp = ins.operands[1];
          var callType = ins.operands[2] ? ins.operands[2].raw : 0;
          var frame = strFrames.pop() || { args: [] };
          var callText;
          if (callType !== 0 && frame.args && frame.args.length) {
            /* Method/parent-call form: compiler pushes the target object as
               the first argument and sets a nonzero callType instead of
               resolving a namespace ident — object.method(rest), not
               method(object, rest). */
            callText = frame.args[0] + "." + fn + "(" + frame.args.slice(1).join(", ") + ")";
          } else {
            var callArgs = (frame.args || []).join(", ");
            callText = (nsOp.kind === "ident" ? nsOp.value + "::" : "") + fn + "(" + callArgs + ")";
          }
          setCurrent(callText);
          break;
        }
        case "JMPIFNOT": case "JMPIFFNOT": {
          var cond = ins.name === "JMPIFNOT" ? (intStack.pop() || "?") : (fltStack.pop() || "?");
          emit("if (" + cond + ") {");
          indent++;
          scopeStack.push({ endIp: ins.operands[0].value, text: "}", isFunc: false });
          break;
        }
        case "JMPIF": case "JMPIFF": {
          var cond2 = ins.name === "JMPIF" ? (intStack.pop() || "?") : (fltStack.pop() || "?");
          emit("if (!(" + cond2 + ")) {");
          indent++;
          scopeStack.push({ endIp: ins.operands[0].value, text: "}", isFunc: false });
          break;
        }
        case "JMPIFNOT_NP":
          pendingShortCircuit.push({ opText: "&&", targetIp: ins.operands[0].value, lhs: intStack.pop() || "?" });
          break;
        case "JMPIF_NP":
          pendingShortCircuit.push({ opText: "||", targetIp: ins.operands[0].value, lhs: intStack.pop() || "?" });
          break;
        case "JMP": {
          var top = scopeStack[scopeStack.length - 1];
          if (top && !top.isFunc && ins.ip + ins.len === top.endIp) {
            /* This JMP's own end-position is exactly where the pending if-block
               closes — the standard "skip the else clause" shape — so this is
               an if/else transition, not a loop edge. */
            scopeStack.pop();
            indent = Math.max(0, indent - 1);
            emit("} else {");
            indent++;
            scopeStack.push({ endIp: ins.operands[0].value, text: "}", isFunc: false });
          } else {
            emit("// unstructured jump to L" + ins.operands[0].value +
              " — likely a loop back-edge (this tool does not reconstruct while/for); see disassembly");
          }
          break;
        }
        case "RETURN": {
          /* The compiler auto-appends a trailing RETURN to every codeblock and
             every function body. An empty one immediately before a function's
             (or the file's) own end is that terminator, not a statement the
             original source wrote — suppress it rather than inventing a
             bare `return;` the author never typed. */
          var enclosingFunc = scopeStack[scopeStack.length - 1];
          var isFuncTerminator = enclosingFunc && enclosingFunc.isFunc && (ins.ip + ins.len === enclosingFunc.endIp);
          var isFileTerminator = (i === lastIdx) && !ins.inFunction;
          var retVal = readAllAndClear();
          if (retVal !== '""') emit("return " + retVal + ";");
          else if (!isFuncTerminator && !isFileTerminator) emit("return;");
          break;
        }
        case "BREAK":
          break;
        default:
          emit("// " + ins.name + " " + ins.operands.map(formatOperand).join(", ") +
            "  [not reconstructed — see disassembly]");
      }
      i++;
    }

    function fieldExpr() {
      var f = curFieldArrayed ? (curField + "[" + curFieldArrayed + "]") : curField;
      /* Inside an object-initializer block, field assignments are written
         bare ("profile = ...;"), not "%obj.profile = ...;" — curObjExpr is
         the SETCUROBJECT_NEW placeholder exactly when that's the case. */
      return curObjExpr === "%obj" ? f : (curObjExpr || "%obj") + "." + f;
    }

    closeScopesUpTo(dso.words.length);
    return out.join("\n");
  }

  function decompile(buf) {
    var dso = parse(buf);
    var insns = disassemble(dso);
    return {
      dso: dso,
      instructions: insns,
      disassembly: disassemblyText(dso, insns),
      reconstruction: reconstruct(dso, insns)
    };
  }

  return {
    OPCODES: OPCODES,
    OP_BY_NAME: OP_BY_NAME,
    DsoError: DsoError,
    parse: parse,
    disassemble: disassemble,
    disassemblyText: disassemblyText,
    reconstruct: reconstruct,
    decompile: decompile
  };
});
