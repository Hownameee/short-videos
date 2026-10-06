# RAG Research Summary

## What is RAG?
Retrieval-Augmented Generation (RAG) is a technique that grounds LLM responses in external, real-time knowledge rather than relying on static training data. It retrieves relevant documents at query time and injects them as context into the LLM prompt.

## Core Pipeline
1. **Offline ingestion**: Documents are chunked → embedded as vectors → stored in a vector database
2. **Online retrieval**: User query is embedded → similarity search finds top-k chunks → chunks are injected into the prompt → LLM generates a grounded answer

## Why RAG Reduces Hallucinations
- Shifts the model from "recalling" (fabrication-prone) to "reasoning over provided evidence"
- Constrains the model to answer using only retrieved, verifiable source documents
- Enables transparent source citation for auditable AI responses

## RAG vs Fine-Tuning
- Fine-tuning requires expensive retraining; RAG updates instantly by adding documents
- Fine-tuning can increase hallucinations when learning new facts; RAG grounds every response
- Fine-tuning excels at style/format adaptation; RAG excels at factual accuracy
- Best practice: combine both (fine-tune for behavior, RAG for knowledge)

## Sources
- IBM: What is RAG? (ibm.com)
- Databricks: RAG Overview (databricks.com)
- BigData Boutique: RAG Architecture Guide (bigdataboutique.com)
- Towards AI: RAG in 2025 (towardsai.net)
