#!/usr/bin/env python3
"""Extract only game-facing assets from an APK supplied by its lawful owner/licensee.
This tool deliberately does not decompile or copy Java/Kotlin business code.
Usage: python tools/extract_owned_assets.py /path/to/app.apk ./owned-assets
"""
import os,sys,zipfile
if len(sys.argv)!=3: raise SystemExit('usage: extract_owned_assets.py APP.apk OUT_DIR')
apk,out=sys.argv[1:]; os.makedirs(out,exist_ok=True)
allow_ext={'.png','.webp','.jpg','.jpeg','.mp3','.ogg','.wav','.json','.pag','.ttf','.otf','.lottie'}
with zipfile.ZipFile(apk) as z:
    for info in z.infolist():
        if not info.filename.startswith('assets/'): continue
        ext=os.path.splitext(info.filename)[1].lower()
        if ext not in allow_ext: continue
        target=os.path.join(out,info.filename)
        os.makedirs(os.path.dirname(target),exist_ok=True)
        with z.open(info) as src, open(target,'wb') as dst: dst.write(src.read())
print('done')
