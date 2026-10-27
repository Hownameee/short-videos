# Mascot tools

Shared mascot tools live here. Project-specific input jobs and audio belong in
`projects/NNN-topic/remote/`; results belong in that project's `output/mascot/`.
Reusable portraits stay in `assets/presenters/`.

- [wan-s2v](wan-s2v/README.md): prepared Wan2.2-S2V FP8/CPU-offload workflow for
  a rented RTX 3090, including pinned dependencies/models, parallel setup and
  result validation. Actual 3090 inference is pending.
- `remote/ssh.py`: install/reuse the existing ckey public key, then run commands
  over verified, multiplexed SSH without forwarding the private key.
- `remote/fetch.py`: resume a result-only transfer and verify it locally.

See the [Wan S2V runbook](wan-s2v/README.md) for SSH bootstrap, launch, progress,
fetch and recovery. Narration and renderer workflows remain independent.
The former LongCat and EchoMimic tools are not included.
