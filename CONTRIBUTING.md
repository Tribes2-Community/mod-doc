# Contributing

This handbook documents Tribes 2 as it actually is. The bar for a claim is
**evidence**, not recollection.

## The evidence rule

Every non-obvious statement carries a marker:

| Marker | Means |
|---|---|
| `**[binary]**` | Confirmed by disassembly or string analysis of `Tribes2.exe` or a patch DLL |
| `**[script]**` | Confirmed by reading the shipped V12 `.cs` in `base/scripts.vl2` — cite file and line |
| `**[patch-script]**` | Confirmed by reading a community patch's own shipped `.cs` |
| `**[support-script]**` | Confirmed by reading the community support pack's own shipped `.cs` |
| `**[mod-script]**` | Confirmed by reading a documented community mod's own files |
| `**[bones]**` | From NecroBones' Tribes 2 Mapping Tutorial — attributed community practice |
| `**[community]**` | From the 2002–2003 tutorial corpus; widely relied on, not independently confirmed |
| `**[inferred]**` | Reasoned from the above; plausible but unverified |

If you cannot mark it, either verify it or write it as plainly signposted
inference. **Do not present a guess as a fact** — the corpus this handbook
replaces is full of them, which is the reason it exists.

Where a source's own comment contradicts its code, follow the code and say so.
Sierra's comments are wrong in several documented places; so are the mods'.

## Style

- **British English**, sentence case for prose, `Title Case` only for proper nouns.
- Lines wrapped at roughly 100 characters.
- Prefer a table to a bulleted list when there are more than three parallel items.
- Quote real code. Elide with `…` rather than paraphrasing.
- Every page ends with a `## Related` section of cross-links.

## Code blocks

**TorqueScript is fenced as `php`, deliberately.** PHP's highlighter renders
`$globals` correctly and keeps the C-family keywords; a C# highlighter mangles
both sigils. Neither handles `%locals`. Please do not "correct" these to `cs`.

Other fences use their real language: `bash`, `bat`, `powershell`, `ini`,
`mermaid`. Untagged fences are plain output, file listings or directory trees.

## Adding a page

1. Put it in the right numbered section directory.
2. Start with a single `# H1` — the site derives the page title from it.
3. Add it to `_data/nav.yml` so it appears in the sidebar.
4. Link it from the section `README.md` and from the root `README.md` table.
5. Cross-link it from related pages.

Sections are numbered so material can be inserted without renumbering:
`01`–`08` are instruction, `40`–`48` are mod studies, `90` is reference, and
`09`–`39` are deliberately free.

## Checks before you open a PR

```bash
bundle exec jekyll build --strict_front_matter
```

and verify that every relative link still resolves:

```bash
python - <<'EOF'
import os, re
bad = 0
for root, _, files in os.walk('.'):
    if any(p in root for p in ('_site', '.git', 'vendor')): continue
    for f in files:
        if not f.endswith('.md'): continue
        p = os.path.join(root, f)
        s = open(p, encoding='utf-8').read()
        if s.count('```') % 2: print('unbalanced fences:', p); bad += 1
        for m in re.finditer(r'\]\(([^)]+)\)', s):
            t = m.group(1)
            if t.startswith(('http', '#', 'mailto')): continue
            path = t.split('#')[0]
            if path and not os.path.exists(os.path.normpath(os.path.join(root, path))):
                print('broken link:', p, '->', t); bad += 1
print('problems:', bad)
EOF
```

## Scope

In scope: vanilla Tribes 2 build 25034, the community patches, and documented
community mods.

Out of scope: Torque Game Engine / Torque 3D differences, engine C++
modification, reimplementation projects, and the patches' authentication and
cryptography — those belong to their authors.

**No game assets.** This repository ships documentation only. Quote code as
evidence; do not vendor archives, binaries, models, textures or audio.

## Third-party images

`assets/img/necrobones/` mirrors screenshots and map images from NecroBones'
mapping tutorial, because community Tribes 2 hosting has repeatedly proven
fragile and the material is worth preserving. Every page using them attributes
the author and links the original.

If you add third-party images, follow the same rules: attribute on the page,
link the source, keep them in a clearly-named subdirectory, and be prepared to
remove them at the author's request.
