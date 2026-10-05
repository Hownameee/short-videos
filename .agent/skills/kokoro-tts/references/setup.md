# Kokoro setup and troubleshooting reference

Load only for environment, provider, or pronunciation troubleshooting. Routine
production uses the shared generator described in the parent SKILL.md.

## Inspect before setup

Before changing dependencies:

1. inspect repository instructions, the active interpreter, and `pyvenv.cfg`;
2. reuse a repository venv such as `.venv-kokoro` when compatible;
3. inspect existing imports and pinned versions;
4. check whether `espeak-ng` is already available;
5. ask before installing system packages or adding a production dependency.

The current demo uses Python 3.12, `kokoro==0.9.4`, `soundfile`, and `numpy`.
Treat that as project evidence, not a universal requirement for every checkout.

Typical isolated setup:

```console
python3.12 -m venv .venv-kokoro
source .venv-kokoro/bin/activate
python -m pip install "kokoro==0.9.4" soundfile numpy
```

Kokoro may download model weights on first use. Plan for network access and cache
space instead of claiming the first run is fully offline.

## Language and voice selection

Match `lang_code` and voice family. Common official codes include:

| Language             | `lang_code` | Example voice                           |
| -------------------- | ----------- | --------------------------------------- |
| American English     | `a`         | `af_heart`                              |
| British English      | `b`         | `bf_emma`                               |
| Spanish              | `e`         | `ef_dora`                               |
| French               | `f`         | `ff_siwis`                              |
| Hindi                | `h`         | inspect the current official voice list |
| Italian              | `i`         | inspect the current official voice list |
| Japanese             | `j`         | `jf_alpha`                              |
| Brazilian Portuguese | `p`         | inspect the current official voice list |
| Mandarin Chinese     | `z`         | `zf_xiaobei`                            |

Vietnamese is not in the current official Kokoro language list. For a Vietnamese
script, run a short pronunciation test before committing. If it is not good
enough, route to a TTS provider with native Vietnamese support; do not disguise
English-language phonetics as native Vietnamese narration.

Consult the current official
[Kokoro README](https://github.com/NVIDIA/kokoro/blob/main/README.md) and
[voice list](https://huggingface.co/hexgrad/Kokoro-82M/blob/main/VOICES.md)
when language, dependency, or voice details may have changed.

