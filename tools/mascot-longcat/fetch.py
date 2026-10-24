"""Retrieve the remote mascot and diagnostics, verifying hashes before promotion."""

from __future__ import annotations

import argparse
import json
import re
import shlex
import subprocess
import tempfile
from pathlib import Path

from job import ROOT, bundle_name, load_job, sha256, verify_video


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--host", required=True, help="Current rental SSH destination, e.g. root@gpu.example")
    parser.add_argument("--port", type=int, default=22)
    parser.add_argument("--identity", type=Path, help="Local private key, never uploaded")
    parser.add_argument("--remote-root", required=True, help="Absolute checkout path on rental")
    parser.add_argument("--project", type=Path, required=True)
    parser.add_argument("--job", type=Path, help="Defaults to the project's remote/longcat/job.json")
    parser.add_argument("--context-only", action="store_true", help="Collect setup logs and source diffs after a failure")
    args = parser.parse_args()
    if not re.fullmatch(r"[A-Za-z0-9_][A-Za-z0-9_.@:-]*", args.host) or not 1 <= args.port <= 65535:
        parser.error("Invalid SSH destination or port")
    if not args.remote_root.startswith("/") or "\n" in args.remote_root:
        parser.error("remote-root must be an absolute path")
    project = args.project.resolve()
    if not project.is_relative_to(ROOT / "projects"):
        parser.error("Project must be inside this repository's projects directory")
    docs = project / "output/docs"
    docs.mkdir(parents=True, exist_ok=True)
    job_path = (args.job or project / "remote/longcat/job.json").resolve()
    name = bundle_name(job_path, project)
    relative = project.relative_to(ROOT).as_posix()
    with tempfile.TemporaryDirectory(prefix="longcat-ssh-") as temporary:
        ssh = ["ssh", "-p", str(args.port), "-o", "BatchMode=yes", "-o", "ConnectTimeout=3",
               "-o", "ServerAliveInterval=10", "-o", "ServerAliveCountMax=3",
               "-o", "ControlMaster=auto", "-o", "ControlPersist=60",
               "-o", f"ControlPath={temporary}/connection"]
        if args.identity:
            ssh += ["-i", str(args.identity.expanduser().resolve())]

        def download(command: list[str], target: Path) -> None:
            with target.open("wb") as output:
                subprocess.run([*ssh, args.host, shlex.join(command)], stdout=output, check=True)

        try:
            if args.context_only:
                # Keep remote diagnostics archived; do not execute or extract their contents.
                target = docs / f"{name}-setup-context.tar.gz"
                partial = target.with_suffix(".partial")
                download(["tar", "-czf", "-", "-C", args.remote_root,
                          "tools/mascot-longcat/.runtime/logs"], partial)
                partial.replace(target)
                for label, suffix in (("workspace", ""), ("talker", "/tools/mascot-longcat/.runtime/talker"),
                                      ("longcat", "/tools/mascot-longcat/.runtime/talker/vendor/LongCat-Video")):
                    result = subprocess.run([
                        *ssh, args.host, shlex.join(["git", "-C", args.remote_root + suffix,
                                                    "diff", "HEAD", "--binary"]),
                    ], capture_output=True)
                    if result.returncode == 255:
                        raise RuntimeError("SSH failed while retrieving source changes")
                    (docs / f"{name}-remote-{label}.patch").write_bytes(result.stdout)
                    if result.returncode:
                        (docs / f"{name}-remote-{label}-error.txt").write_bytes(result.stderr)
                for source, target_name in (
                    (f"output/docs/{name}-run.json", f"{name}-run.json"),
                    (f"output/docs/{name}-context.tar.gz", f"{name}-context.tar.gz"),
                    (f".cache/{name}/render.log", f"{name}-render.log"),
                    (f".cache/{name}/gpu.csv", f"{name}-gpu.csv"),
                ):
                    remote = f"{args.remote_root}/{relative}/{source}"
                    exists = subprocess.run([*ssh, args.host, shlex.join(["test", "-f", remote])])
                    if exists.returncode == 0:
                        download(["cat", "--", remote], docs / target_name)
                    elif exists.returncode != 1:
                        raise RuntimeError("SSH failed while locating diagnostic files")
                print(f"Saved failure context: {target}")
                return
            job, _, _ = load_job(job_path)
            report_stage = Path(temporary) / "run.json"
            download(["cat", "--", f"{args.remote_root}/{relative}/output/docs/{name}-run.json"], report_stage)
            report = json.loads(report_stage.read_text())
            if report.get("status") != "complete" or report.get("jobSha256") != sha256(job_path):
                parser.error("Remote run is incomplete or uses a different job; use --context-only for diagnostics")
            destination = project / f"output/mascot/mascot-{name}.mp4"
            destination.parent.mkdir(parents=True, exist_ok=True)
            partial = destination.with_name(f"mascot-{name}.download.mp4")
            download(["cat", "--", f"{args.remote_root}/{relative}/output/mascot/mascot-{name}.mp4"], partial)
            if sha256(partial) != report["output"]["sha256"]:
                raise ValueError("Downloaded video SHA-256 differs from remote result")
            verify_video(partial, job["audioSeconds"])
            subprocess.run(["ffmpeg", "-v", "error", "-xerror", "-i", str(partial), "-f", "null", "-"], check=True)
            partial.replace(destination)
            (docs / f"{name}-run.json").write_text(report_stage.read_text())
            context = docs / f"{name}-context.tar.gz"
            download(["cat", "--", f"{args.remote_root}/{relative}/output/docs/{name}-context.tar.gz"],
                     context.with_suffix(".partial"))
            if sha256(context.with_suffix(".partial")) != report.get("contextSha256"):
                raise ValueError("Downloaded context SHA-256 differs from remote report")
            context.with_suffix(".partial").replace(context)
            print(f"Retrieved and verified: {destination}")
            print(f"Context: {context}. Record any remote fixes in tools/mascot-longcat/REMOTE_FIXES.md.")
        finally:
            subprocess.run([*ssh, "-O", "exit", args.host], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


if __name__ == "__main__":
    main()
