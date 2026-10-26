# Kubernetes 3D visual study

This is a reviewable alternative to the existing approved 57-second video, not
a replacement production approval or a claim that the final export gate passed.
Use the approved English narration and its predicted word timestamps unchanged.
Keep the existing 1080×1920, 30 fps project format; do not claim 4K60.

## Visual thesis

A missing application replica leaves a visible vacancy. Kubernetes creates a
different Pod, assigns it to a node, starts its container, and only then allows
ready traffic. The miniature is a schematic, not literal hardware or a live demo.

Art direction: dark product photography, ivory machined Pod shells, mint
application cores, amber absence/pending, blue infrastructure. Large editorial
type above a lit miniature; captions below it. Use bevels, contact shadows and
occlusion for depth, not arbitrary orbiting particles. Node bases remain fixed.
Show the application container inside its Pod as an exploded view. The new Pod
has a new identity; a deleted Pod is not repaired or resurrected.

## Shot decisions before implementation

| Beat | Visible claim / spatial purpose | Action and narration cue | Settled proof / 2D support |
| --- | --- | --- | --- |
| Hook | Losing one replica creates a physical vacancy | `Delete`: one shell separates and disappears | Two surviving Pods; desired 3 / actual 2 |
| Declare | A container is inside a Pod, replicas are separate copies | `three`: three copies; `contains`: lift lid to expose core | Three separate replicas; Pod / container labels |
| Observe | Actual count differs from declared target | `deleted`: Pod C leaves; `gap`: highlight empty location | Desired 3 / actual 2; ReplicaSet detects mismatch |
| Replace | Creation, assignment and startup are distinct steps | `replacement`: Pod D appears pending; `node`: moves onto node; `containers`: core starts | New identity, three running Pods; ordered controller → scheduler → kubelet labels |
| Service | Stable entry point routes only to ready destinations | `Service`: show front manifold; final `ready`: connect D | Stable address, surviving routes, then new route |
| Limits | Infrastructure cannot repair application logic | `resources`: capacity constraint; `broken`: amber application core | Explicit limits on screen; avoid depicting universal recovery |
| Takeaway | Reconciliation closes a visible count gap | `desired`: show target; `working`: complete three-copy state | Three replicas and a test-cluster CTA |

Camera: restrained front three-quarter view with a close opening, wide
explanation, closer exploded view, and a settled overhead view for traffic.
Use a continuous world and explicit cuts rather than an unmotivated orbit.
Key: large warm-white source; fill: cool blue; rim: mint. Editorial text and
karaoke remain DOM. Preserve the reserved lower-right presenter rectangle.

Assets: original procedural geometry; no downloaded models or copied studio
artwork. Existing narration and project soundtrack retain their provenance.
Reference research and the repository audit are recorded in
`docs/3D_WORKFLOW_AUDIT.md` at workspace root.

Review hook, replacement and Service frames before a full render. Inspect
consecutive action frames and repeat a frame for determinism. Record actual
checks and listening limitations alongside the study output. A study render is
not the canonical `output/video/final.mp4` and must not mutate `state.json`.
