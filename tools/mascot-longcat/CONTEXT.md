# LongCat operator context

Use [README.md](README.md) for commands and [runtime-lock.json](runtime-lock.json)
for pinned source/model/runtime inputs. This is shared tool context; no project
job, narration, rental endpoint or generated video is bundled.

Prepare a new job from an existing project's complete narration and presenter.
Validate its paths, checksums and duration before starting an authorized rental.
Obtain connection details for the current rental; historical endpoints or keys
are not authorization. Paid execution, remote setup and publishing require their
own authorization. Do not inherit project-specific quality or sampling overrides.

The launcher keeps a full-audio invocation alive across disconnects. Native
model windows are internal to that invocation, not independent jobs. Inspect
logs and exit status before retrying. Retrieve output and diagnostic checksums
before releasing an authorized rental. Preserve reusable fixes in
[REMOTE_FIXES.md](REMOTE_FIXES.md); do not retain credentials in logs or docs.

Model generation does not prove lip-sync, matting, sound or composite quality.
Record measured checks separately from actual playback/listening review.
