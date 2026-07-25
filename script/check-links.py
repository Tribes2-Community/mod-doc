#!/usr/bin/env python3
"""Verify the handbook is self-contained.

Run from the repository root:

    python script/check-links.py

Checks every Markdown, HTML, SCSS, CSS and JS file for references that would
break once the site is served by Jekyll:

  escape     a relative link resolving OUTSIDE the repository. These pass a
             naive os.path.exists() check when a sibling directory happens to
             exist in the authoring workspace, and 404 the moment the site is
             served -- the site root is this folder, not its parent.
  missing    a relative link to something that is not in the repository
  absolute   a root-absolute path, which ignores site.baseurl and therefore
             breaks on GitHub Pages (use {{ site.baseurl }} in templates)
  localhost  a hardcoded development URL

Exits non-zero if anything is found, so it can gate a commit or CI run.
"""

import os
import re
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), os.pardir))
SKIP_DIRS = {'_site', '.git', 'vendor', '.jekyll-cache', 'node_modules', 'script'}
CHECK_EXT = ('.md', '.html', '.scss', '.css', '.js')

PATTERNS = (
    ('markdown', re.compile(r'!?\[[^\]]*\]\(([^)\s]+)')),
    ('attribute', re.compile(r'(?:src|href)\s*=\s*["\']([^"\']+)["\']')),
    ('css-url', re.compile(r'url\(\s*["\']?([^)"\']+)')),
)

EXTERNAL = ('http://', 'https://', 'mailto:', 'data:', '//', '#')


def find_problems():
    problems = {'escape': [], 'missing': [], 'absolute': [], 'localhost': []}

    for dirpath, dirnames, filenames in os.walk(ROOT):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for name in sorted(filenames):
            if not name.endswith(CHECK_EXT):
                continue
            path = os.path.join(dirpath, name)
            rel = os.path.relpath(path, ROOT).replace(os.sep, '/')
            try:
                text = open(path, encoding='utf-8').read()
            except (OSError, UnicodeDecodeError):
                continue

            for _kind, pattern in PATTERNS:
                for match in pattern.finditer(text):
                    target = match.group(1).strip()
                    line = text.count('\n', 0, match.start()) + 1
                    entry = (rel, line, target)
                    lowered = target.lower()

                    if 'localhost' in lowered or '127.0.0.1' in lowered:
                        problems['localhost'].append(entry)
                        continue
                    if lowered.startswith(EXTERNAL):
                        continue
                    # Liquid expressions are resolved by the build, not here.
                    if target.startswith(('{{', '{%')):
                        continue
                    if target.startswith('/'):
                        problems['absolute'].append(entry)
                        continue

                    bare = target.split('#')[0].split('?')[0]
                    if not bare:
                        continue

                    dest = os.path.abspath(os.path.join(dirpath, bare))
                    try:
                        inside = os.path.commonpath([dest, ROOT]) == ROOT
                    except ValueError:      # different drive on Windows
                        inside = False

                    if not inside:
                        problems['escape'].append(entry)
                    elif not os.path.exists(dest):
                        problems['missing'].append(entry)

    return problems


LABELS = {
    'escape': 'Links escaping the repository (404 when served)',
    'missing': 'Links to files not in the repository',
    'absolute': 'Root-absolute paths (ignore site.baseurl)',
    'localhost': 'Hardcoded localhost URLs',
}


def main():
    problems = find_problems()
    total = sum(len(v) for v in problems.values())

    for key in ('escape', 'missing', 'absolute', 'localhost'):
        rows = problems[key]
        if not rows:
            continue
        print(f'\n{LABELS[key]}: {len(rows)}')
        for rel, line, target in rows:
            print(f'  {rel}:{line}  ->  {target}')

    if total:
        print(f'\n{total} problem(s) found.')
        return 1

    print('Self-contained: no escaping, missing, absolute or localhost references.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
