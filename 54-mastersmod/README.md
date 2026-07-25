# 54 · Masters mod

A deliberately closed-source combat mod by **SirElim** (`MastersMod.com`) — and the clearest example in
this handbook of a mod whose own author intended it not to be read.

| | |
|---|---|
| Author | SirElim **[community]** |
| Distribution | 209 of 210 script files ship as compiled `.cs.dso`; only one header stub survives as source |
| Lineage | Undetermined — cannot be fingerprinted; filenames closely mirror vanilla base's own script set |
| Notable | Reuses Team Rabbit 2's own bonus-matrix and role-system code |

## The license explains the distribution choice

`Masters license.txt` states its intent without hedging **[community]**:

> "I have personally put a LOT of hard work into this mod and care to keep the making of it mostly secret.
> I do not give anyone any right to copy/modify/change in any way this mod."

That secrecy is enforced structurally, not just legally: of 210 files in `Masters/scripts/`, only
`MastersTDMGame.cs` remains plain text — and even that file is a fourteen-line stub carrying just the
`DisplayName` and rules comment. The actual logic, for every gametype and every system, ships only as
compiled bytecode. This handbook's usual method — fingerprint the `.cs` against known baselines — does
not work here; there is essentially nothing to fingerprint.

## What the compiled strings reveal

Bytecode still carries identifiers and string literals even with all comments and structure stripped, so
some of what Masters mod does is recoverable without the source.

**Three gametypes**, beyond the headline Team Deathmatch: `ArenaGame`, `DuelGame`, plus Masters-specific
`MastersArenaGame` and `MastersDuelGame` variants (`aiMastersDuel` confirms bot support for the duel mode).

**Custom player classes** beyond the stock armours: `elite.cs`, `engineer.cs`, `sniper.cs`, `warrior.cs`,
sitting alongside `bioderm_heavy/light/medium.cs` reskins.

**Team Rabbit 2's bonus system, reused wholesale.** String extraction from `TR2Prefixes.cs.dso`,
`TR2Qualifiers.cs.dso`, and `TR2Nouns.cs.dso` recovers the same procedural phrase generator documented in
full in [30 · Team Rabbit 2](../30-team-rabbit-2/README.md) — prefixes ("Angled," "Twisted," "Deranged"),
animal nouns ("Shark's," "Llama's," "Wolf's"), qualifiers ("Sharp," "Blazing," "Elite"), assembled into
kill-bonus announcements. `TR2Roles.cs.dso` carries the matching Offense/Defense/**Goalie** role-assignment
system (`$TR2::role`, `resetPlayerRoles`, `assignOuterMostRole`), role-specific loadouts, and TR2's own
weapon set (`TR2chaingun`, `TR2disc`, `TR2mortar`). This is the second mod this handbook has found reusing
TR2's bonus-matrix machinery outside Team Rabbit 2 itself — direct evidence that TR2's design was admired
and lifted by other mod authors, not merely played.

A separate client-side installer, `Mastersclientside1.5.exe`, is referenced by the install documentation
as delivering admin functions (`MakeMapsList`, `CheckMapRotations`) via a `MastersClientSide.cs` dropped
into **vanilla base**'s own `scripts/autoexec/` — meaning the mod expects a base install underneath it,
which is consistent with, though not proof of, base lineage for the parts this handbook cannot read.

## What this handbook cannot verify

Every claim above comes from filenames, license text, and bytecode-surviving strings, not from reading
executable logic. Masters mod's actual scoring, balance, and gametype mechanics are not independently
verifiable from this workspace, and the license under which it was distributed makes that gap permanent by
design.

## Related

- [30 · Team Rabbit 2](../30-team-rabbit-2/README.md) — the bonus-matrix system reused here
- [56 · Powers Mod](../56-powers-mod/README.md) — another custom-class combat mod, with full source available
- [TorqueScript — V12 Decompiler](../02-engine-model/torquescript-decompiler.md) — the format standing between "mostly secret" and readable
- [Packaging](../06-shipping/packaging.md#dso-compilation) — what compiling to `.dso` does and does not hide
