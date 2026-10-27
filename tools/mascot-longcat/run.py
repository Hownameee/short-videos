"""Run one full-audio LongCat job on the rental; save video and return context."""

from __future__ import annotations

import argparse
import datetime
import fcntl
import json
import os
import subprocess
import sys
import tarfile
import time
from pathlib import Path

from job import ROOT, RUNTIME, TOOLS, bundle_name, load_job, sha256, verify_video, write_json


def capture_context(project: Path, cache: Path, name: str) -> str:
    context = cache / "context"
    context.mkdir(exist_ok=True)
    for label, repository in (("workspace", ROOT), ("talker", RUNTIME / "talker"),
                              ("longcat", RUNTIME / "talker/vendor/LongCat-Video")):
        for suffix, command in (("revision.txt", ["rev-parse", "HEAD"]),
                                ("status.txt", ["status", "--short"]),
                                ("patch", ["diff", "HEAD", "--binary"])):
            result = subprocess.run(["git", "-C", str(repository), *command],
                                    capture_output=True, text=True)
            (context / f"{label}.{suffix}").write_text(result.stdout or result.stderr)
    target = project / f"output/docs/{name}-context.tar.gz"
    with tarfile.open(target.with_suffix(".partial"), "w:gz") as archive:
        archive.add(context, arcname="source-context")
        for filename in ("render.log", "gpu.csv"):
            if (cache / filename).is_file():
                archive.add(cache / filename, arcname=filename)
        if (RUNTIME / "logs").is_dir():
            archive.add(RUNTIME / "logs", arcname="setup-logs")
        archive.add(TOOLS / "runtime-lock.json", arcname="runtime-lock.json")
    target.with_suffix(".partial").replace(target)
    return sha256(target)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--job", type=Path, required=True)
    parser.add_argument("--dry-run", action="store_true", help="Check inputs and print the full command without a GPU")
    args = parser.parse_args()
    job, assets, project = load_job(args.job)
    name = bundle_name(args.job, project)
    python = RUNTIME / "talker/.venv/bin/python"
    talker = RUNTIME / "talker/talker.py"
    destination = project / f"output/mascot/mascot-{name}.mp4"
    partial = destination.with_name(f"mascot-{name}.partial.mp4")
    command = [str(python), "-u", str(talker), "mp4", str(assets["image"]), str(assets["audio"]),
               "--resolution", "480p", "--no-vocal-sep", "--keep-workdir",
               "--prompt", assets["prompt"].read_text().strip(), "-o", str(partial)]
    if args.dry_run:
        print(json.dumps({"audioSeconds": job["audioSeconds"], "command": command,
                          "environment": {"TALKER_LOWVRAM": "1", "TALKER_VRAM_RESERVE_GB": "9.5"},
                          "output": str(destination), "inferenceInvocations": 1}, indent=2))
        return
    if sys.platform != "linux" or not python.is_file() or not talker.is_file():
        parser.error("Run setup.sh on the Linux GPU host first")
    if not (RUNTIME / "ready.json").is_file():
        parser.error("Missing successful setup report; rerun setup.sh")
    ready = json.loads((RUNTIME / "ready.json").read_text())
    if ready.get("lockSha256") != sha256(TOOLS / "runtime-lock.json"):
        parser.error("Runtime lock changed since setup; rerun setup.sh")
    cache = project / ".cache" / name
    cache.mkdir(parents=True, exist_ok=True)
    # Both Talker and its upstream write shared files; serialize generation per runtime.
    lock = (RUNTIME / "generation.lock").open("w")
    try:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except BlockingIOError:
        parser.error("A LongCat generation is already active on this runtime")
    report_path = project / f"output/docs/{name}-run.json"
    job_hash = sha256(args.job.resolve())
    if destination.exists():
        previous = json.loads(report_path.read_text()) if report_path.is_file() else {}
        if (previous.get("status") == "complete" and previous.get("jobSha256") == job_hash
                and previous.get("output", {}).get("sha256") == sha256(destination)):
            print(f"Already complete and checksum verified: {destination}")
            return
        parser.error("Existing LongCat output belongs to another run; archive it before replacing")
    destination.parent.mkdir(parents=True, exist_ok=True)
    (cache / "work").mkdir(exist_ok=True)
    env = dict(os.environ, TALKER_LOWVRAM="1", TALKER_VRAM_RESERVE_GB="9.5",
               PYTHONUNBUFFERED="1", TOKENIZERS_PARALLELISM="false",
               PYTORCH_CUDA_ALLOC_CONF="expandable_segments:True", TMPDIR=str(cache / "work"))
    env["PATH"] = str(python.parent) + os.pathsep + env["PATH"]
    report = {"status": "running", "jobSha256": job_hash, "job": job,
              "startedAt": datetime.datetime.now(datetime.timezone.utc).isoformat(),
              "command": command, "inferenceInvocations": 1,
              "runtimeLockSha256": sha256(TOOLS / "runtime-lock.json")}
    write_json(report_path, report)
    started = time.monotonic()
    monitor = None
    try:
        with (cache / "render.log").open("w") as log, (cache / "gpu.csv").open("w") as metrics:
            monitor = subprocess.Popen([
                "nvidia-smi", "--query-gpu=timestamp,name,utilization.gpu,memory.used,memory.total,power.draw,temperature.gpu",
                "--format=csv", "--loop=30",
            ], stdout=metrics, stderr=subprocess.STDOUT)
            print(f"Starting full {job['audioSeconds']:.3f}s WAV; progress: {cache / 'render.log'}", flush=True)
            subprocess.run(command, cwd=talker.parent, env=env, stdout=log, stderr=subprocess.STDOUT, check=True)
        report["output"] = verify_video(partial, job["audioSeconds"])
        report["output"]["path"] = destination.relative_to(ROOT).as_posix()
        partial.replace(destination)
        report["status"] = "complete"
    except BaseException as error:
        report["status"] = "failed"
        report["error"] = str(error)
        raise
    finally:
        if monitor is not None:
            monitor.terminate()
            try:
                monitor.wait(timeout=5)
            except subprocess.TimeoutExpired:
                monitor.kill()
                monitor.wait()
        report["elapsedSeconds"] = round(time.monotonic() - started, 3)
        write_json(report_path, report)
        report["contextSha256"] = capture_context(project, cache, name)
        write_json(report_path, report)
    print(f"Ready: {destination}", flush=True)


if __name__ == "__main__":
    main()
