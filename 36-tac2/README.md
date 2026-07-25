# 36 · tac2 — Team Aerial Combat 2

Not "tactics" — **Team Aerial Combat 2, subtitled "The Ground Assault"** — a vehicle-only aerial combat
conversion maintained long enough to ship its own Linux builds (section 21).

| | |
|---|---|
| Full name | Team Aerial Combat 2 — The Ground Assault **[mod-script]** |
| Lineage | **Base** — `defaultGame.cs` 75.5% similar to base, 68.5%/62.8% to Classic 1.1/1.5.2 |
| Version span | v0.40 through v0.92, per bundled installers and patch archives |
| Linux builds | `tac2-040-042-linux.zip`, `tac2-040-043-linux.zip` — see [21 · Linux](../21-linux/README.md) |
| Scope | 1379 files at its latest snapshot (`tac2 updated 02-20-10`), 196 mission files |

## Lineage and maintenance history

`defaultGame.cs` opens with a maintenance credit, repeated with dated entries throughout **[mod-script]**:

```
//Major overhaul and update 19-03-03 SaNTa
```

Similarity scoring places `defaultGame.cs` closest to vanilla base (75.5%) rather than either Classic
release (68.5% for 1.1, 62.8% for 1.5.2) — a **base-lineage mod, heavily rewritten** ("major overhaul" is
an accurate self-description, not marketing). The two folders present in this workspace —
`tac 2` and `tac2 updated 02-20-10` — are the same release at two snapshots; the later one adds two extra
map-update directories the earlier copy lacks. Installer archives spanning `TAC2Setup.zip` through
`tac2-040.exe` document the version range from 0.40 to 0.92.

## Five vehicle-only gametypes, one running joke

TAC2 does not extend the stock gametypes — it replaces the entire roster with five custom, vehicle-only
modes, each a thin `exec()` stub pointing at its real implementation: `TAC_CTFGame.cs` → `TAC_CTF.cs`,
`TAC_TDMGame.cs` → `TAC_TDM.cs`, `TAC_CnHGame.cs` → `TAC_CnH.cs`, `TAC_ChaserGame.cs` → `TAC_Chaser.cs`,
`TAC_RetrievalGame.cs` → `TAC_Retrieval.cs`. These stubs bear essentially no textual resemblance to base's
`CTFGame.cs`/`DMGame.cs` — they are wrappers around wholly original files, not modified copies.

Every mode shares the same ground rule, restated across the rules text **[mod-script]**:

> "Dont touch the ground...it hurts."

Ground contact is lethal or near-lethal by design; play happens entirely airborne. Team Deathmatch scores
kills only from manned vehicles and drains a point per second if no vehicle is airborne — the rule
enforced mechanically, not just by convention. Chaser requires destroying the enemy's Wildcat; Retrieval
has players escort an MPB carrying an "Artifact" to a Retrieval Station, shepherded by a custom "Jericho"
vehicle.

196 mission files ship, many suffixed "(Pure TAC)" or "(PureTAC)" to distinguish TAC-purpose-built maps
from adapted stock ones, with duplicate near-identical filenames suggesting iterative revision rather than
one-shot authorship.

## Related

- [21 · Linux](../21-linux/README.md) — TAC2's own Linux patch archives, and the platform path difference they document
- [24 · Siege](../24-siege/README.md), [26 · Capture and Hold](../26-capture-and-hold/README.md) — the stock gametypes TAC2 declines to extend, building original ones instead
- [31 · The base ruleset](../31-base-ruleset/README.md) — the baseline TAC2's `defaultGame.cs` was fingerprinted against
