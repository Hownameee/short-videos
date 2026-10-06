# Your AI is Lying — RAG Fixes It

English narration, titles and captions. Vertical 1080x1920, 30 fps. Target 50–65 seconds. Audience: software engineers and AI practitioners. Tone: clear, technical, energetic.

Promise: Show how RAG grounds every LLM response in real, retrievable evidence — eliminating hallucinations by shifting from "recalling" to "reasoning over documents."

## hook

Your AI just made up a fact. It sounded perfect. It was completely wrong. In sixty seconds, I will show you the architecture that fixes this.

Visual: A confident LLM response with a "verified" badge that shatters, revealing fabricated text underneath.
Sources: hallucination-reduction

## hallucination-problem

Here is the problem. Large language models generate text from patterns in training data. When they hit a gap, they do not say "I do not know." They fill it with something that sounds right. This is called a hallucination.

Visual: An LLM brain icon generating text; question marks and warning symbols appear as gaps in knowledge light up.
Sources: hallucination-reduction, rag-definition

## rag-solution

RAG fixes this. Retrieval-Augmented Generation connects your LLM to real documents. Instead of guessing, the model searches your actual data first, then generates an answer based only on what it found.

Visual: The LLM connects to a document database via a retrieval arrow; documents flow into the prompt window.
Pronunciation: RAG -> rag (single syllable, rhymes with "bag")
Sources: rag-definition, hallucination-reduction

## pipeline

Here is how it works. First, your documents are split into chunks and converted into vector embeddings. These vectors are stored in a database. When a user asks a question, the query gets embedded too. A similarity search finds the most relevant chunks. Those chunks are injected into the prompt alongside the question. The LLM reads the evidence, then answers.

Visual: Animated end-to-end pipeline: documents → chunks → embeddings → vector database → query embedding → similarity search → prompt augmentation → grounded response.
Sources: chunking-embedding-pipeline, vector-similarity-search

## grounded-answer

Now every answer is grounded. The model cites its sources. You can verify every claim. And when your data changes, the model knows immediately — no retraining required.

Visual: A response panel with inline source citations highlighting back to original documents; a "last updated: now" timestamp pulses.
Sources: source-citation, rag-vs-finetuning

## takeaway

That is RAG. Your LLM stops guessing and starts reading. What will you build with it?

Visual: Clean architecture diagram showing the complete RAG loop with a call-to-action prompt.
Sources: rag-definition

---
Estimated total duration: ~58 seconds.
Audio: af_heart voice, curious-tech music at 0.12 gain. Curious tension at the hook, space for the pipeline walkthrough, confident lift at the grounded-answer reveal, settled at takeaway.
Captions: word-highlight karaoke.
