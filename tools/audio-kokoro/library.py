#!/usr/bin/env python3
"""Browse and cache the repository's curated audio catalog (standard library only)."""
import argparse
import fcntl
import hashlib
import html
import json
import os
from pathlib import Path
import subprocess
import tempfile
from datetime import datetime, timezone
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parents[2]
LIBRARY = ROOT / "audio-library"
CATALOG = LIBRARY / "catalog.json"


def local_path(entry):
    path = (LIBRARY / entry["localPath"]).resolve()
    if not path.is_relative_to((LIBRARY / "files").resolve()):
        raise ValueError("Catalog path must be inside audio-library/files")
    return path


def checksum(path):
    return "sha256:" + hashlib.sha256(path.read_bytes()).hexdigest()


def fetch(entry):
    path = local_path(entry)
    if path.exists():
        if not entry.get("checksum") or checksum(path) != entry["checksum"]:
            raise ValueError(f"Unverified or modified cache: {path}; inspect before replacing")
        print(f"Cached: {entry['id']}")
        return
    url = entry.get("downloadUrl")
    if not url or not url.startswith("https://incompetech.com/music/royalty-free/mp3-royaltyfree/"):
        raise ValueError("Only curated official Incompetech download URLs are supported")
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(dir=path.parent, suffix=".mp3", delete=False) as temp:
        temporary = Path(temp.name)
    try:
        with urlopen(url, timeout=45) as response, temporary.open("wb") as output:
            if not response.url.startswith("https://incompetech.com/"):
                raise ValueError("Unexpected download redirect")
            size = 0
            while chunk := response.read(64 * 1024):
                size += len(chunk)
                if size > 50 * 1024 * 1024:
                    raise ValueError("Audio exceeds 50 MiB limit")
                output.write(chunk)
        metadata = json.loads(subprocess.check_output([
            "ffprobe", "-v", "error", "-show_format", "-show_streams", "-of", "json", str(temporary)
        ], text=True))
        streams = [stream for stream in metadata["streams"] if stream["codec_type"] == "audio"]
        if not streams or float(metadata["format"]["duration"]) <= 0:
            raise ValueError("Download is not playable audio")
        entry.update(checksum=checksum(temporary), downloadedAt=datetime.now(timezone.utc).isoformat(),
                     durationSec=float(metadata["format"]["duration"]), bytes=size,
                     sampleRate=int(streams[0]["sample_rate"]), channels=streams[0]["channels"])
        os.replace(temporary, path)
        print(f"Downloaded: {entry['id']} ({entry['durationSec']:.1f}s)")
    finally:
        temporary.unlink(missing_ok=True)


def build_index(entries):
    cards = []
    for entry in entries:
        esc = lambda value: html.escape(str(value), quote=True)
        player = (f'<audio controls preload="none" src="{esc(entry["localPath"])}"></audio>'
                  if local_path(entry).exists() else "<p>Chưa tải / chưa tạo sample.</p>")
        cards.append(f'''<article data-search="{esc(' '.join([entry['title'], entry['kind'], *entry['tags']]).lower())}">
<small>{esc(entry['kind'])} · {esc(entry['id'])}</small><h2>{esc(entry['title'])}</h2>
<p>{esc(entry['suggestedUse'])}</p><p class="tags">{esc(', '.join(entry['tags']))}</p>{player}
<p>{esc(entry.get('caution', ''))}</p><a href="{esc(entry['sourcePage'])}">Nguồn / chi tiết</a>
<details><summary>License / credit / file</summary><p>{esc(entry['license'])}</p>
<pre>{esc(entry.get('attribution', ''))}</pre><code>{esc(entry['localPath'])}</code></details></article>''')
    page = '''<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Shared Audio Library</title><style>body{font:16px system-ui;background:#101724;color:#e5edf8;max-width:1100px;margin:40px auto;padding:20px}h1{font-size:36px}input{width:100%;box-sizing:border-box;padding:16px;font:inherit;border-radius:12px}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(290px,1fr));gap:18px;margin-top:24px}article{background:#1c283a;border:1px solid #33465f;padding:22px;border-radius:16px}article[hidden]{display:none}audio{width:100%}a,.tags{color:#9ecaff}small{color:#aabbd1}pre{white-space:pre-wrap;overflow-wrap:anywhere}code{overflow-wrap:anywhere}p{line-height:1.5}</style>
<h1>Audio Library</h1><p>Nghe từng file riêng để chọn. Tag là gợi ý biên tập; chưa phải đánh giá chất lượng bằng nghe thử.</p>
<input aria-label="Search" id="search" placeholder="Lọc: tech, kids, comedy, american, british…"><main>''' + "\n".join(cards) + '''</main>
<script>const players=[...document.querySelectorAll('audio')];players.forEach(a=>a.addEventListener('play',()=>players.forEach(b=>{if(b!==a)b.pause()})));document.querySelector('#search').addEventListener('input',e=>{const q=e.target.value.toLowerCase().trim();document.querySelectorAll('article').forEach(a=>a.hidden=!a.dataset.search.includes(q))});</script></html>'''
    (LIBRARY / "listen.html").write_text(page, encoding="utf-8")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("action", choices=["list", "fetch", "index"])
    parser.add_argument("ids", nargs="*")
    parser.add_argument("--tag")
    args = parser.parse_args()
    catalog = json.loads(CATALOG.read_text())
    entries = catalog["entries"]
    by_id = {entry["id"]: entry for entry in entries}
    unknown = set(args.ids) - by_id.keys()
    if unknown:
        parser.error("Unknown IDs: " + ", ".join(sorted(unknown)))
    selected = [by_id[item] for item in args.ids] if args.ids else entries
    if args.tag:
        selected = [entry for entry in selected if args.tag in entry["tags"]]
    if args.action == "fetch":
        if not args.ids:
            parser.error("fetch requires explicit track IDs")
        for entry in selected:
            fetch(entry)
            temporary = CATALOG.with_suffix(".tmp")
            temporary.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + "\n")
            os.replace(temporary, CATALOG)
    elif args.action == "list":
        for entry in selected:
            print(f"{entry['id']:28} {'saved' if local_path(entry).exists() else 'missing':7} {entry['title']} | {', '.join(entry['tags'])}")
    build_index(entries)


if __name__ == "__main__":
    with (LIBRARY / ".catalog.lock").open("a") as lock:
        try:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            raise SystemExit("Another audio-library command is running; retry after it finishes")
        main()
