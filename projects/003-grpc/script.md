# Why Microservices Swapped REST for gRPC

English narration, titles and captions. Vertical 1080x1920, 30 fps. Target 50–65 seconds. Audience: backend engineers and software developers. User delegated all decisions.

Promise: Explain the two architectural advantages that make gRPC up to ten times faster than REST for internal microservices: Protocol Buffers binary serialization and HTTP/2 multiplexing.

## hook

Why do high-scale microservices ditch REST and JSON for gRPC? Here is the architecture secret in sixty seconds.

Visual: Split-screen comparison between REST HTTP/1.1 and gRPC HTTP/2 with latency counter.
Sources: grpc-intro

## rest-bottleneck

With REST, services exchange bloated text strings. Every single request parses redundant field keys in JSON, while opening heavy new TCP handshakes.

Visual: Heavy JSON payload highlighted with string overhead and connection queue.
Sources: protobuf-binary, http2-multiplexing

## protobuf

gRPC replaces JSON with Protocol Buffers. Instead of sending raw text, you define a strict schema that compiles into compact binary. Payloads shrink dramatically and serialize up to ten times faster.

Visual: Protocol Buffer schema compilation into tiny binary byte blocks with 10x throughput meter.
Sources: protobuf-binary

## http2-multiplex

Next is the transport: HTTP/2. Instead of waiting in line, gRPC multiplexes hundreds of concurrent requests over one persistent TCP connection with zero head-of-line blocking.

Visual: A single persistent network pipe multiplexing concurrent color-coded request streams.
Pronunciation: HTTP/2 -> HTTP two
Sources: http2-multiplexing

## streaming

And unlike REST, you get streaming natively. Client streaming, server streaming, and full bidirectional streams keep data flowing in real time.

Visual: Interactive matrix showing real-time two-way data streaming between microservices.
Sources: streaming-patterns

## takeaway

The rule of thumb: use gRPC internally between backend microservices, and keep REST for public web clients. What does your team build with?

Visual: System architecture boundary showing Public REST Edge vs Internal gRPC Mesh.
Sources: east-west-tradeoff

---
Estimated total duration: ~54 seconds.
Audio: af_heart voice, technical-pulse music at 0.12 gain.
Captions: word-highlight karaoke.
