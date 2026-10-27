# Keycloak login journey

Direction A selected by the user. The user explicitly delegated all further work and requested the delivered video. Script decisions and production proceeded under that authorization.

## Visual system

Original vector diagrams in a dark navy environment. Cyan identifies the browser/identity interaction, amber the authorization code, and green validated access. Text labels accompany every color. Stable endpoints and traveling packets show redirects versus token requests. All visual elements use a 1080×1920 design coordinate system scaled uniformly to native 2160×3840 at 60 fps.

The modeled architecture is a public browser client using authorization code with S256 PKCE. The conceptual interface uses reserved example domains. No credentials, live account, or deployed Keycloak environment is used. The API scene shows local signed-token validation and a separate permission check. ID tokens stay with the app; access tokens travel to the API. OAuth and OpenID Connect are distinguished in the two-token scene.

## Narration and timing

Kokoro af_heart, American English, speed 1.02, 24 kHz. Word timings are provider-predicted, retained in the voice manifest. Spoken normalization: Key cloak, pixie, A P I, I D token. Scene-local animation cues follow these measured word positions. Each scene has a 0.8-second ending pause; total timeline is 60.4667 seconds.

## Sound

Original project-generated electronic instrumental score from tools/score.py: 104 BPM, four-chord progression, sparse plucked melody, soft kick and hi-hat. Hook curiosity, thinner explanation bed, resolution lift, 1.6-second final fade. Narration-aware gain reduction, section arc, and fades are baked into the music asset, so the renderer applies unit gain and no extra fades. Identical voice-active interval measurements put music RMS 16 dB below narration. This is measured mix evidence, not a listening claim.

## Sources and boundaries

See research.md and research.json. Additional validation reference: RFC 9068 section 4, https://www.rfc-editor.org/rfc/rfc9068#section-4 (accessed 2026-10-26), corroborates issuer, audience, signature, expiry and authorization checks. This reference is supporting production review evidence; the video does not claim that every Keycloak token implements the RFC 9068 profile.

The short omits state, nonce, refresh, discovery, error flows and full validation configuration; it is a flow explainer rather than a deployment tutorial. No third-party visual or music assets were downloaded. Technical export checks cannot certify pronunciation, emotional fit, or listening intelligibility. Record unperformed listening explicitly.

## Rebuild

Use Node 24.21.0, as selected by the repository documentation.

```sh
.venv-kokoro/bin/python tools/audio-kokoro/generate_audio.py --project projects/001-keycloak
.venv-kokoro/bin/python tools/audio-kokoro/assemble_voice.py --project projects/001-keycloak --pause 0.8
.venv-kokoro/bin/python projects/001-keycloak/tools/score.py
renderer/node_modules/.bin/tsc -p projects/001-keycloak/tsconfig.json
npm run video -- preflight --project projects/001-keycloak
npm run video -- render --project projects/001-keycloak --preview
npm run video -- render --project projects/001-keycloak --final
```

Guidance used: short-video-workflow, short-video-discovery, short-video-script, short-video-production, short-video-visual-design, kokoro-tts, remotion-best-practices and devops_env_setup. Editorial review evidence is retained under output/docs/.
