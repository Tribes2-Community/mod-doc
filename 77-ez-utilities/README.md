# 77 · EzRotation & EzVoteOptions

Two minimal client autoexec utilities, closing out this handbook's mod survey at its smallest scale.

| | |
|---|---|
| `EzRotation.vl2` | 6 KB, 3 entries — `scripts/autoexec/EzRotation.cs` (19 KB) |
| `EzVoteOptions.vl2` | 3.8 KB, 3 entries — `scripts/autoexec/EzVoteOptions.cs` (16 KB) |
| Readme | None in either archive |

Both ship as a single autoexec script inside a minimal `.vl2` wrapper — no assets, no gui files, no
readme. Their names describe their function plainly enough that this handbook treats them as
self-documenting: **EzRotation** displays the server's map rotation to the client, and
**EzVoteOptions** extends the client's vote menu with additional options. Both are the kind of small,
single-purpose client-side quality-of-life script that [09 · The Support Pack](../09-support-pack/README.md)
later formalised into a proper autoload/module system — these predate that convention, each a standalone
autoexec drop-in rather than a managed module.

## Related

- [09 · The Support Pack](../09-support-pack/README.md) — the module system this pattern of small autoexec utilities eventually grew into
- [02 · Engine Model](../02-engine-model/README.md) — `scripts/autoexec/`, the convention both scripts rely on
- [51 · Small utilities](../51-small-utilities/README.md) — the equally minimal server-side counterpart to this page
