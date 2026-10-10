# gRPC remake

The user requested a complete quality remake on 2026-10-06. Existing editorial
and production delegation applies. The topic remains gRPC; the current edition
replaces unsupported speed claims with a contract, an exact encoding example,
HTTP/2 streams, streaming RPCs, and a qualified choice of protocol.
See [revision research](revision-research.md) for primary-source corrections.
Original discovery files are historical; the current script and revision research
supersede the first edition's performance claims. The previous final, voice,
source archive, configuration and QC were copied under
`output/archive-before-remake-20261006-223150/` before editing.

## Visual system

2160x3840, 60 fps. Original vector art and text rendered at native resolution;
1080x1920 authoring coordinates scale uniformly by the shared composition.
Pale paper, dark teal type, deep green explanations, lime highlights, rust for
transport limitations. Arial display/body and Menlo for the actual code/bytes.
No fabricated benchmark gauges or latency numbers. Main headings approximately
80-90 design pixels; captions 46; key labels 34-44. Essential content stays inside
x=90..900 and y=150..1510; source footer is secondary at y=1580.

Six beats: three-part promise; schema generating two bindings; JSON `{"id":42}`
(nine UTF-8 bytes) versus Protobuf `08 2A` (two message bytes); interleaved frames
pausing together at simulated packet loss; request/reply becoming bidirectional
messages; contracts/streaming/client constraints feeding a workload decision.
Motion follows scene-local seconds and measured word cues. Packet animation is
conceptual, not a packet-capture trace or performance simulation.

## Voice and music

All narration was regenerated with cached Kokoro af_heart, English, speed 1,
24 kHz. Provider-predicted word timestamps drive the shared karaoke component.
No word timing estimated from sentence duration. Scene tails add 0.45 seconds
and round up at the configured frame rate.

`compose_music.py` adapts the workspace's original procedural music technique
with a D-minor four-chord sequence at 108 BPM. Pluck/bass phrasing starts curious,
gets sparse during detailed explanations, lifts at streaming and resolves at the
end. Word intervals duck the score; overall active-speech RMS is 15 dB below
narration after all baked automation and renderer unity gain. Fades are baked in,
so renderer fades are zero. No third-party recordings or samples. Source and
checksum records are in `assets/sources.json`; actual measurements are in
`output/mix-measurements.json`. Listening, pronunciation by ear and physical
phone playback are not available in this session; those checks remain
`not-performed`, independently of signal and frame checks.

## Reproduce

Load the documented Node 24.21.0 environment, then from the workspace root:

```bash
HF_HUB_OFFLINE=1 .venv-kokoro/bin/python tools/kokoro/generate_audio.py --project projects/003-grpc
.venv-kokoro/bin/python projects/003-grpc/compose_music.py
npm run video -- preflight --project projects/003-grpc
npm run video -- render --project projects/003-grpc --preview
.venv-kokoro/bin/python projects/003-grpc/inspect_preview.py
# Review frames and resolve defects before the final render.
npm run video -- render --project projects/003-grpc --final
```

The shared CLI normalizes audio and checks full decode, duration, H.264/AAC,
dimensions/fps, loudness and true peak. `output/qc.json` records editorial evidence;
`output/automated-qc.json` contains the CLI measurements. Source snapshots change
only after a successful final. The sandbox on this host requires approved
Chromium execution outside the sandbox.

Guidance applied: short-video workflow, script, production, visual design,
Kokoro, Remotion creation/markup/layout, sound QC, production defaults and runtime
setup. Local Remotion Studio was launched for the editing session.

## Delivered remake

`output/grpc-remade-4k60.mp4` matches the canonical final: 2160x3840, 60 fps,
3,635 frames, 60.6 seconds, H.264/AAC, 10,068,978 bytes. Full decode passed.
Encoded mix measured -16.12 LUFS and -1.49 dBTP. SHA-256:
`61912355c4b132c152aeec636839c392679f99517cd5c40c074211dc18af2493`.
Renderer ESLint/TypeScript and project preflight passed. Rendered contact sheet,
motion sequences, successive word highlights, safe-area overlay and a native
4K final frame were reviewed. Listening limitations above still apply.
