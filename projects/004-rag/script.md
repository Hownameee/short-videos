# RAG: Follow the Evidence

English; developers and AI practitioners; approximately 60 seconds; 2160x3840 at 60 fps.

Hook: a confident 90-day answer conflicts with a 30-day example policy.
Promise: follow the same evidence through the complete RAG flow.
Payoff: a sourced answer plus an honest insufficient-evidence branch.
Takeaway / CTA: keep the index current and check the answer against its source.

| Beat | Exact narration | Motion, cue, settle and sources |
| --- | --- | --- |
| hook | How long do we keep logs? An AI might say ninety days. But our example policy says thirty. That gap is where RAG can help. | Cross out the unsupported 90-day answer and reveal the policy fragment with 30 days. Cue: But. Settle: Unsupported 90 contrasts with fictional policy 30. Sources: rag-paper. |
| hallucination-problem | First, prepare the documents. Split them into passages and index them for search. Embeddings are one way to match meaning. | One document separates into three passages; the retention passage stays amber and joins a search index. Cue: Split. Settle: Passages indexed for search; embeddings are one option. Sources: azure-rag. |
| rag-solution | Now ask the question. Retrieve the relevant policy passage. The search result is evidence for the model, not the final answer. | The question searches three passages and selects the retention excerpt with its source ID. Cue: Retrieve. Settle: Relevant passage plus source metadata, not yet an answer. Sources: azure-rag. |
| pipeline | Put the question and that passage into the prompt. The model writes an answer: thirty days, with a link back to the source. | Question and policy fragment move together into a prompt, then a cited 30-day answer appears. Cue: model. Settle: Answer and source passage connected by the same reference. Sources: foundry-rag. |
| grounded-answer | That does not guarantee truth. Search can miss, documents can be outdated, and models can misread them. Missing evidence should trigger a clear refusal. | A question about exceptions takes a no-evidence branch to an explicit insufficient-evidence answer. Cue: Missing. Settle: No unsupported exception invented; stop and say evidence is missing. Sources: foundry-rag. |
| takeaway | RAG means retrieval augmented generation. Retrieve, then answer with evidence. Keep the index current, and check whether the answer really matches its source. | Trace the amber passage through search and generation, then link answer back to its source for checking. Cue: check. Settle: A citation must support the answer; maintain the searchable index. Sources: rag-paper, foundry-rag. |

The policy, the two numbers and the follow-up question are fictional teaching examples. They are not real log-retention advice. The old discovery claims are historical; [revision-research.md](revision-research.md) is the current fact-check supplement.

Original 96 BPM restrained pluck/pad/bass score: curious opening, sparse indexing and search, brighter answer reveal, space around limitations, settled ending. Word-interval ducking, measured active-speech balance and baked fades. English Kokoro af_heart at normal speed. RAG is pronounced as the word rag. Captions use provider-predicted word timings.

The user explicitly requested this complete remake and delegated production choices.
