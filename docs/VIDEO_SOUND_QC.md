# Background sound QC

Use for selecting or revising music, ambience, SFX or the mix. Apply the
[production defaults](VIDEO_PRODUCTION_DEFAULTS.md).

## Plan and implement

Record in `PRODUCTION.md` or `production.json.soundIntent`:
intended feeling and audience; hook → explanation → reveal/payoff → ending;
track/source, ducking, and meaningful accent cues. Convert spoken cues to
timestamps after measuring voice. One evolving track is sufficient.

Read the relevant section of [the background guide](../audio-library/BACKGROUND_GUIDE.md)
when selecting assets. Prefer appropriate licensed local music or an original
score with intentional phrasing. Do not equate low sine drones with curiosity or
default to horror/impacts when asked for emotion. Do not claim measured engagement
gains without audience evidence.

Trace the actual file, gain, cue timing and fades into the renderer. Avoid
hardcoded paths, multiplied gains and double fades. Baked fades should use
`fadeInSec: 0`, `fadeOutSec: 0` in the override.
For explicit voice-only output use `audio.music: null`, `audio.sfx: false`;
record the preference in `soundOverride`.

## Measure and review

1. Verify assets are non-silent and retain provenance. Preflight measures source
   integrated LUFS/true peak and rejects signal below -60 LUFS after static gain.
   This only catches gross silence; it does not measure masking or automation.
2. Compare voice and background over the **same speech-active interval**, after
   gain/ducking. Record interval, method and effective levels. Music 12–18 dB
   below voice is a starting point, not an audibility or intelligibility gate.
3. The CLI normalizes to -16 LUFS / -1.5 dBTP, then measures the encoded final.
   Automatic acceptance is -16 ±1.5 LU and true peak ≤ -1 dBTP (encoding tolerance),
   alongside full decode and timeline checks. Do not substitute source-track
   levels for final-mix measurements.
4. Listen to the rendered hook, dense explanation, reveal and ending with
   captions off. Check music is audible, fits the intended arc and leaves speech
   clear. Compare background on/off where useful. Check phone/mono for vanishing
   bass/pads, harsh accents, exposed loops and abrupt cuts.
5. Save `output/qc.json.backgroundSound`: intent/override; asset and final SHA-256;
   cues and review times; voice/background interval levels and method; final LUFS
   and true peak; fixes; separate automated and listening status.
   Refresh evidence when voice, music, mix or final changes.

Fix demonstrated defects before delivery. When listening is unavailable, retain
measured evidence, mark listening `not-performed`, disclose the limitation and
complete the authorized export. Technical success cannot certify emotional fit.
