# Hybrid content-alignment contract

Use this contract after script approval and before implementing 3D scenes. It
prevents a technically impressive world from becoming interchangeable visual
decoration.

## Required scene logic

For every scene, answer in domain language:

1. What exact claim does the narration make?
2. What must become visible for a viewer to understand that claim?
3. Does depth reveal causality, space, scale, layers, or transformation? If not,
   use 2D.
4. Which object persists, what changes it, and what final state proves the beat?
5. Which narrated words trigger action, reveal, and settle?
6. Which labels or evidence must stay in the stable DOM layer?

Store the result in `projects/NNN-topic/visual-map.json` only after a renderer
and preflight consume that artifact. The following is a proposed schema:

```json
{
  "schemaVersion": 1,
  "scriptVersion": "sha256:approved-script",
  "approval": { "status": "approved", "approvedAt": "ISO-8601" },
  "scenes": [
    {
      "id": "scene-id",
      "mode": "hybrid",
      "narrationClaim": "One factual or explanatory claim.",
      "visualClaim": "What must visibly happen.",
      "why3d": "Why depth improves this explanation.",
      "heroObject": "Persistent domain object.",
      "action": "Cause-and-effect transformation.",
      "cueWords": {
        "action": "narrated-word",
        "reveal": "narrated-word",
        "settle": "narrated-word"
      },
      "processSteps": ["INPUT", "TRANSFORMATION", "RESULT"],
      "finalState": "Visible proof at the end of the beat.",
      "domSupport": ["source, value, status, or limitation"],
      "proofFrames": ["representative state to inspect"]
    }
  ]
}
```

Use `why3d` and `heroObject` for `3d` and `hybrid` modes. Keep `processSteps`
between two and four short labels so they remain legible on a phone.

## Review gate

Prototype the hook, hardest explanatory beat, and payoff before the full video.
For each representative frame or animatic segment, review:

- semantic match: the object and transformation express the narrated claim;
- causal clarity: input, change, and result are distinguishable;
- domain specificity: the visual would not fit an unrelated topic unchanged;
- caption independence: the main relationship survives without captions;
- economy: removing decorative objects makes the claim clearer, not emptier.

Fail the gate when viewers need the narration to reinterpret unrelated shapes,
when camera motion is the only action, or when labels have to explain what the
3D objects should already communicate.
