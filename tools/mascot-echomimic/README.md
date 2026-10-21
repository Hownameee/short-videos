# Shared EchoMimic presenter generator

Use this Apple Silicon MLX setup to animate a portrait from speech audio. It
uses one repository-wide `.venv-mascot` environment and local model weights
copied from the pinned experiment in `research/mascot/echomimic/`. The source
port is [`guilhermesilveira/echomimic-v3-mlx`](https://github.com/guilhermesilveira/echomimic-v3-mlx)
at commit `5e2595f1735f4a5e66ed27ac10326ac2e5b39e9b`.

## Set up once

From the repository root on Apple Silicon macOS, with the existing research
checkout and weights in place:

```bash
bash tools/mascot-echomimic/setup.sh
.venv-mascot/bin/python -m echomimic_mlx.cli --help
```

The setup creates `.venv-mascot` from the tested Python 3.11 environment and
uses APFS copy-on-write clones for its installed packages, source package, and
approximately 19 GB of weights. It does not contact the network. Clones
initially share disk blocks, but later edits to either copy can consume more
space. The shared environment imports the local source copy in this directory;
the research checkout is needed for setup, not for later generation.

Put presenter portraits in `tools/mascot-echomimic/assets/` or pass any existing image path.
The current project 001 presenter is `tools/mascot-echomimic/assets/presenter.png`.
The script accepts any existing
image and audio file. EchoMimic converts input to RGB, center crops it, and
exports H.264 MP4 without transparency. The shared `presenter.png` is RGBA
with black RGB values in its clear pixels; use `integrate.py` to composite it
over an opaque background before generation. Keep the face away from the edges.

## Generate

Replace the example paths with files that exist. The default is **384×672**,
25 fps, 17 frames (0.68 seconds), eight inference steps.

```bash
.venv-mascot/bin/python tools/mascot-echomimic/generate.py \
  --image path/to/opaque-portrait.png \
  --audio path/to/speech.wav \
  --output tools/mascot-echomimic/output/presenter-sample.mp4
```

For a longer clip, set `--frames` to `1 + 4N` and provide audio at least as
long as the intended duration. For example, `--frames 125` targets five
seconds. The upstream FFmpeg mux uses the shorter of video and audio, so
shorter audio truncates the MP4. Use `--prompt`, `--steps`, and `--seed` to
control generation. `--dry-run` validates paths and prints the command without
running inference. The generator refuses to overwrite an existing MP4.
It writes a JSON generation report beside the MP4.

The released Flash implementation uses the image and audio, but its text
conditioning path is limited; a prompt cannot reliably direct new motion or
change the portrait. The requested 384×672 setting completed a local technical
smoke test on 2026-10-21 using an existing research portrait and audio. It took
102.6 seconds for 17 frames; `ffprobe` reported H.264 at 384×672, 25 fps,
0.68 seconds, and an AAC audio stream. This verifies that the resolution runs,
not the visual quality or lip sync of a future presenter image. The older
experiment also verified 512×512 at 17 and 125 frames; see its
[research notes](../../research/mascot/echomimic/README.md).

If setup reports a missing research environment or model, restore the pinned
research experiment first. If generation fails on Metal inside a sandbox, run
the same command in a normal macOS Terminal. `ffprobe -v error -show_entries
stream=width,height,nb_frames -of default=noprint_wrappers=1 OUTPUT.mp4`
checks the encoded dimensions and frame count.

## Add the presenter to an existing project video

Run `setup-matanyone2.sh` once after `setup.sh`. It restores the preserved
MatAnyone2 source snapshot, installs seven pinned packages into the same
`.venv-mascot`, downloads and checks the model checkpoint, and places a link
where the upstream inference script expects it.

```bash
bash tools/mascot-echomimic/setup-matanyone2.sh

# Three-second demo of the same full-WAV flow:
.venv-mascot/bin/python tools/mascot-echomimic/full_audio.py \
  --project projects/001-kubernetes-self-healing --seconds 3

# Full duration later (the first chunk is reused):
.venv-mascot/bin/python tools/mascot-echomimic/full_audio.py \
  --project projects/001-kubernetes-self-healing
```

`full_audio.py` reads `output/voice/full.wav`, the presenter PNG and a prompt, then
generates the talking video in 25 fps chunks. It prepares the first-frame mask,
runs MatAnyone2 on each chunk, joins the color and alpha videos, and overlays
the transparent presenter on the existing `output/video/final.mp4`. Only the
`--seconds` limit differs between the demo and full run; `--prompt`, `--presenter`,
`--steps`, and `--chunk-seconds` are optional controls. The cache under
`.cache/mascot/full-wav/` lets a full run reuse finished demo chunks when the
inputs and settings match. A changed input or setting in an existing chunk
requires clearing that chunk's cache or using the original settings.
The presenter PNG must be 384×672 for this flow. Chunk boundaries can produce
small motion jumps; inspect the full render before publishing.

Outputs are `output/mascot/mascot.mp4` (with the full WAV or its demo excerpt),
`output/mascot/mascot-transparent-bg.webm` (VP9 alpha), and
`output/video/final-mascot.mp4`. The composite keeps the original final video's
audio, including narration and music. A demo uses the first three seconds of
both input media and replaces these same three output filenames; the full run
later replaces them with full-duration results. See
`output/docs/mascot-integration.json` for measured dimensions, duration and
placement. The mascot is placed at the lower right of project 001 to avoid
the central karaoke caption.

The earlier scene-WAV workflow remains available when scene-by-scene generation
is needed:

```bash
# All scene WAVs over the existing final video:
.venv-mascot/bin/python tools/mascot-echomimic/integrate.py \
  --project projects/001-kubernetes-self-healing
```

The integration script prepares the opaque portrait and a first-frame seed
mask, pads copies of each scene WAV to a valid EchoMimic frame count, generates
25 fps clips, runs MatAnyone2 per scene, joins the original RGB frames with
the model's `pha/` masks at **25 fps**, and overlays the alpha clips on the
existing video with FFmpeg. It keeps the original video's audio, including
voice and music; the generated clips' audio is never mixed in. Scene starts
follow the same `ceil((voice.durationSec + 0.45) × video FPS)` rule as Remotion.

Intermediate files are under `projects/NNN-topic/.cache/mascot/RUN_NAME/`.
The composite is `output/video/final-with-mascot.mp4`, and its JSON report is
`output/docs/mascot-RUN_NAME-integration.json`. The original
`output/video/final.mp4` stays intact. Run `--stage generate`, `--stage matte`,
or `--stage compose` to resume one phase. Existing clips with the expected
frame count are reused. Use a new
`--run-name` when changing the portrait, audio, prompt, steps, or pilot length.
Position is adjustable with `--width-fraction`, `--x-fraction`, and
`--y-fraction` relative to the base video's dimensions. The default
places a quarter-width presenter in the upper right (`0.25`, `0.72`,
`0.21`) to keep the RAG project's central diagram labels and captions clear.
The default `--bottom-feather 40` softens the horizontal crop at the portrait's
lower edge.

The MatAnyone2 snapshot uses S-Lab License 1.0, whose ordinary grant is for
non-commercial use. Check rights before commercial publication; the local
integration is a research render.
