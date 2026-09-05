#!/usr/bin/env python3
from pathlib import Path
import zipfile, sys

if len(sys.argv) < 3:
    print('usage: extract_apk_assets.py <source.apk> <output_dir> [prefix ...]')
    raise SystemExit(2)
apk=Path(sys.argv[1]); out=Path(sys.argv[2]); prefixes=sys.argv[3:] or ['assets/','res/']
out.mkdir(parents=True, exist_ok=True)
with zipfile.ZipFile(apk) as z:
    selected=[n for n in z.namelist() if any(n.startswith(p) for p in prefixes)]
    for n in selected: z.extract(n,out)
print(f'extracted {len(selected)} entries to {out}')
