# Why Microservices Swapped REST for gRPC

English short video for backend and distributed systems engineers. Vertical 1080×1920, 30 fps, H.264/AAC.
Target: 50–65s. Measured duration: 70.3s.

## Video Overview

- **Hook**: Why do high-scale microservices ditch REST and JSON for gRPC?
- **Pillar 1**: Protocol Buffers binary serialization eliminating JSON text overhead and shrinking payload sizes by 85%.
- **Pillar 2**: HTTP/2 multiplexing eliminating TCP connection exhaustion and head-of-line blocking over a single persistent pipe.
- **Pillar 3**: Four native communication modes (Unary, Server streaming, Client streaming, Bidirectional streaming).
- **Takeaway / Rule of Thumb**: Use gRPC internally for low latency and strict type safety; keep REST on public edge clients for browser compatibility.

## Outputs

- `output/final.mp4`: Final deliverable (1080×1920, 30 fps, H.264 video, AAC stereo audio, -16.05 LUFS).
- `output/preview.mp4`: Lightweight preview copy (540×960).
- `output/contact-sheet.png`: Review contact sheet across 8 timestamps covering all scenes and key transitions.
- `output/automated-qc.json`: Automated QC measurements (decode pass, LUFS, true peak, audio duration).
- `output/qc.json`: Editorial and technical QC record.
- `output/report.json`: Render workflow report and input hashes.
- `render.snapshot.json`: Build environment and runtime fingerprint.
- `src/`: Complete snapshot of shared renderer source at render time.

## Verification Run

1. `npm --prefix renderer run lint`: passed 0 warnings, 0 errors.
2. `node --test tools/*.test.mjs`: all 18 workflow tests passed.
3. `node tools/video-cli.mjs preflight --project projects/003-grpc`: preflight input validation passed.
4. `node tools/video-cli.mjs render --project projects/003-grpc --preview`: rendered and inspected contact sheet.
5. `node tools/video-cli.mjs render --project projects/003-grpc --final`: atomic final render with decode test and audio loudness normalization.
