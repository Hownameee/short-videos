# RAG remake: evidence and limits

Verified 2026-10-06. The user requested a complete remake. This source-checked
revision supersedes overstatements in the historical discovery files; the topic
remains retrieval-augmented generation.

## Supported explanations

- Retrieval supplies external passages to a generator. The original RAG work
  combines a retriever and a generative model; it reports improved factuality in
  studied settings, not guaranteed correctness.
  [Lewis et al., 2020](https://arxiv.org/abs/2005.11401).
- A common application pipeline prepares/searches document passages, augments
  the prompt with relevant results, then generates an answer. Vector embeddings
  are one retrieval technique; keyword and hybrid search are also possible.
  [Microsoft RAG overview](https://learn.microsoft.com/en-us/azure/search/retrieval-augmented-generation-overview).
- Relevant results can carry source metadata for citations. A citation enables
  checking; it is not proof that the answer follows the cited passage.
- Retrieval may miss evidence, indexed content may become stale, and generated
  answers can be inaccurate even with retrieved context. Maintain the index and
  evaluate both retrieval and answers. Missing sufficient evidence should lead
  to an explicit insufficient-evidence response; this is an application policy,
  not an automatic property of RAG.
  [Microsoft Foundry RAG concepts](https://learn.microsoft.com/en-us/azure/ai-foundry/concepts/retrieval-augmented-generation).

## Fictional example

The policy in the animation is invented for teaching: `ops-policy.md`, section 2,
states **Application logs are retained for 30 days.** An unsupported answer of
90 days demonstrates the mismatch. Neither number is a recommendation for real
log retention. The policy document, query, retrieved passage, prompt and answer
use the same 30-day fact throughout the video. A follow-up deletion-exceptions
question has no evidence in the displayed passages; the example system declines
to invent an answer.

Removed claims that RAG eliminates hallucinations, always cites accurately,
always answers only from documents, updates automatically/instantly, or is
universally better than fine-tuning. No unmeasured accuracy percentages.
