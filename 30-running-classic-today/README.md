# 30 · Running Classic today

Sections 21–29 are archaeology. This one is the practical summary: what to install in 2026, what to build
on, and what the twenty-year lineage actually leaves you.

## Choosing a codebase

| Codebase | Status | Use it for |
|---|---|---|
| **Classic 1.1** | Shipped in your 25034 install | Reading. It is the reference worked example, not a server you should run |
| **Classic 1.5.2** | The baseline ruleset | The **required substrate** for everything below, and a viable server on its own |
| **Evolution 1.2.3c** | Superseded | Study — the `.ovl` architecture and the leasing model |
| **teratos' evoClassic** | Superseded | Strictly better than stock Evolution if you run Evolution at all |
| **TacoServer** | **Actively maintained** | Running a public server or a PUG in 2026 |

If you want a server people will join: **Classic 1.5.2 plus TacoServer.** That is what the community
runs, it is maintained, and it is open source. Nothing else on this list is a live recommendation.

If you want to *understand* the codebase, read in lineage order — 1.1 for the ruleset, 1.5.2 for the
toggle system, Evolution for the override architecture, TacoServer for how it was all resolved.

## The install, end to end

```
1. Clean Tribes 2, patched to 25034
2. A community patch — TribesNEXT QoL, or RC2a          [section 07]
3. Delete any existing GameData/Classic directory
4. Extract Classic 1.5.2 into GameData                  [section 23]
5. Copy TacoServer's Classic/ over it, overwriting      [section 29]
6. Run once to generate Classic/prefs/serverPrefs.cs
7. Edit serverPrefs.cs
8. Launch
```

Steps 3–5 are ordered and unforgiving. Step 3 exists because a stale partial install contributes files
invisibly; step 5 must follow step 4 or TacoServer is silently reverted to 1.5.2.

**Authentication is the one thing none of these mods handle.** Every shipped `.bat` launcher expects WON,
which has not existed since 2003. Your community patch replaces it, and you launch through the patch's
mechanism rather than the mod's. See [07 · Community Patches](../07-community-patches/README.md).

## Settings worth a second look

Two defaults inherited from 2004 deserve a decision rather than acceptance.

**`$Host::ClassicAllowConsoleAccess`** grants SuperAdmins arbitrary TorqueScript execution through the
admin HUD (section 23). On an internet-reachable server that is remote code execution delegated to anyone
holding the SuperAdmin password. Leave it `0` unless you control every account with that password.

**`$Host::ClassicTelnet`** and its companions expose a telnet console. Classic 1.1 added a global chat
announcement whenever a telnet connection is established **[mod-script]** — a 2002 intrusion-detection
measure, and a fair signal of how that surface was regarded even then. Plaintext, on the public internet,
in 2026: bind it to localhost or leave it off.

Neither is a defect in the mods. Both are 2004 assumptions about who could reach your server.

## If you are building on Classic

The lineage leaves four patterns worth carrying forward, and two worth avoiding.

**Take: one package per feature, one feature per file, in `scripts/autoexec/`.** TacoServer's structure
(section 28). No build step, no manifest, no cache; deleting a file removes a feature cleanly. Order with
filename prefixes. This is the settled answer and twenty years of the alternative are documented in
section 25.

**Take: only overrides need packages.** New functions and globals load fine as plain scripts. Both
Evolution and TacoServer split their trees on exactly this line, independently.

**Take: optional rules as prefs, announced to the client.** Section 24. Keep the count small, default them
to stock, and derive the announcement from the same list that drives the behaviour — the drift in Classic
1.5.1 shows what hand-maintained parallel lists cost.

**Take: thresholds instead of settings, where population varies.** Section 29. A rule that is right at
sixteen players and wrong at four should be a number, not a decision.

**Avoid: generating script at boot.** Section 25's `evoPackage.cs`. If you must, regenerate
unconditionally — V12 has no timestamp function to be clever with, only `getFileCRC()` **[binary]**.

**Avoid: shadowing files you only partly change.** Classic shadows sixty-odd base scripts, which is why
no two admin mods compose and why Evolution had to invent an override architecture in the first place.
Packages exist; use them. See [Packages](../02-engine-model/packages.md).

## What the lineage teaches

Three threads run the whole length of it.

**A ruleset can outlive its authors and its tooling.** z0dd's gravity constant from 2002 is unchanged in
the code running today, and 589 of his comments are still in the current repository. The 2004 balance is
treated as settled by a codebase actively developed in 2026 — the ruleset became infrastructure, and what
kept moving was everything around it.

**Silent failure is the dominant defect mode.** Section 27's teamkill log ran wrong for a decade because
TorqueScript reads an undeclared local as `""` without complaint. Section 28's mission-type guard almost
certainly never fires, for a precedence reason that reads correctly in English. Section 25's generated
package will not regenerate, and says nothing. None of these produce an error. In a language with no
declarations, no types and no warnings, **the things that go wrong are the things that do not announce
themselves** — which is why [Debugging](../06-shipping/debugging.md) is the section to read before you
write.

**Architecture is what survives feature parity.** Evolution and TacoServer do broadly similar things for
an admin. Evolution's approach — one generated package, a stale cache, errors reported against machine
output — made it hard to modify, and it stopped moving in 2004. TacoServer's — a file per feature, no
build step — is still being extended twenty-two years later. The features were never the difference.

## Related

- [21 · Classic](../21-classic/README.md) — the lineage overview
- [23 · Classic 1.5.2](../23-classic-152/README.md) — the required base
- [29 · TacoServer in operation](../29-tacoserver-operation/README.md) — the recommended codebase
- [07 · Community Patches](../07-community-patches/README.md) — authentication on a modern install
- [Hosting and testing](../06-shipping/hosting-and-testing.md) — dedicated server operation
- [06 · Shipping](../06-shipping/README.md) — packaging your own work
