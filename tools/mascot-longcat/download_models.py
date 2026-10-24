"""Download only the pinned files required by LongCat Avatar 1.5 INT8."""

from __future__ import annotations

import argparse
from concurrent.futures import ThreadPoolExecutor
import hashlib
import json
from pathlib import Path

TOOLS = Path(__file__).resolve().parent


def complete(path: Path, expected: dict, checksum: bool = False) -> bool:
    if not path.is_file() or path.stat().st_size != expected["size"]:
        return False
    if checksum and expected.get("sha256"):
        digest = hashlib.sha256()
        with path.open("rb") as source:
            for block in iter(lambda: source.read(8 * 1024 * 1024), b""):
                digest.update(block)
        return digest.hexdigest() == expected["sha256"]
    return True


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--weights", type=Path, default=TOOLS / ".runtime/talker/weights")
    parser.add_argument("--verify-only", action="store_true")
    parser.add_argument("--sha256", action="store_true", help="Also read and hash LFS weights (slower)")
    parser.add_argument("--workers", type=int, default=4)
    args = parser.parse_args()
    if not 1 <= args.workers <= 16:
        parser.error("--workers must be between 1 and 16")
    lock_path = TOOLS / "runtime-lock.json"
    lock = json.loads(lock_path.read_text())
    tasks = [(model, item) for model in lock["models"] for item in model["files"]]
    missing = [(model, item) for model, item in tasks if not complete(
        args.weights / model["directory"] / item["path"], item, args.sha256
    )]
    if args.verify_only and missing:
        parser.error("missing or invalid weights: " + ", ".join(
            model["directory"] + "/" + item["path"] for model, item in missing
        ))
    if missing:
        from huggingface_hub import hf_hub_download

        total = sum(item["size"] for _, item in missing)
        print(f"Downloading {len(missing)} pinned files ({total / 1024**3:.2f} GiB)", flush=True)

        def download(task: tuple[dict, dict]) -> None:
            model, item = task
            directory = args.weights / model["directory"]
            target = directory / item["path"]
            print(f"Download: {model['directory']}/{item['path']}", flush=True)
            hf_hub_download(
                repo_id=model["repo"], revision=model["revision"], filename=item["path"],
                local_dir=directory, force_download=target.exists(),
            )
            if not complete(target, item, args.sha256):
                raise RuntimeError(f"Downloaded file failed validation: {target}")
            print(f"Ready: {model['directory']}/{item['path']}", flush=True)

        with ThreadPoolExecutor(max_workers=args.workers) as pool:
            list(pool.map(download, missing))
    args.weights.mkdir(parents=True, exist_ok=True)
    record = {
        "lockSha256": hashlib.sha256(lock_path.read_bytes()).hexdigest(),
        "files": len(tasks),
        "bytes": sum(item["size"] for _, item in tasks),
        "validation": "size-and-lfs-sha256" if args.sha256 else "exact-pinned-file-sizes",
        "repositories": [{"repo": m["repo"], "revision": m["revision"]} for m in lock["models"]],
    }
    if not args.verify_only:
        temporary = args.weights / "download-report.partial.json"
        temporary.write_text(json.dumps(record, indent=2) + "\n")
        temporary.replace(args.weights / "download-report.json")
    print(json.dumps(record), flush=True)


if __name__ == "__main__":
    main()
