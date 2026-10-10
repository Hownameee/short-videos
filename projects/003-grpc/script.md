# gRPC: The Contract, the Bytes, the Streams

English; backend developers; approximately 60 seconds; vertical 2160x3840 at 60 fps.

Hook: gRPC is not a magic speed switch.
Promise: follow the contract, bytes, and streams.
Payoff: a concrete encoding example and a balanced protocol choice.
Takeaway / CTA: check clients and benchmark the actual workload.

| Beat | Exact narration | Visual action / cue / settle |
| --- | --- | --- |
| hook | gRPC is not a magic speed switch. Its real advantage is how services agree, exchange data, and stream. | Three terms assemble into a connected system. Cue: how services agree. Settle: Contract, bytes, streams become the promise. Sources: grpc-core. |
| rest-bottleneck | Start with a contract. A proto file defines methods and message types. Generate clients and server code from the same schema. | A shared schema branches into client and server bindings. Cue: Generate clients. Settle: Two implementations share one typed interface. Sources: grpc-core. |
| protobuf | Then encode the message. In this tiny example, JSON takes nine bytes. Protocol Buffers takes two. That is the message body, not a speed benchmark. | The literal JSON id 42 becomes the correct two-byte Protobuf encoding. Cue: Protocol Buffers takes two. Settle: Nine UTF-8 bytes versus two binary bytes; body only. Sources: protobuf-encoding. |
| http2-multiplex | HTTP/2 interleaves streams over one connection. But packet loss can still stall them at the TCP layer. REST can use HTTP/2 as well. | Numbered colored frames interleave, pause together at loss, then resume. Cue: packet loss. Settle: HTTP/2 multiplexes; TCP loss can still block. Sources: rfc9113. |
| streaming | Calls can return one reply, or stream messages from either side. In a bidirectional call, both sides can keep sending independently. | A single exchange becomes repeated messages in both directions. Cue: both sides. Settle: Two independent directions plus all four method labels. Sources: grpc-core. |
| takeaway | Choose gRPC when shared contracts and streaming fit your services. Check browser requirements, and benchmark your workload. The right protocol is a tradeoff. | Contracts and streaming connect to an explicit workload decision. Cue: benchmark your workload. Settle: Evaluate contracts, streaming, clients, measurements. Sources: grpc-core, grpc-web. |

Original restrained electronic pluck and bass score: curious hook, sparse contract/byte explanation, interleaved motif for transport, brighter streaming reveal, resolved ending. Word-interval ducking; 15 dB below narration as a measured starting point. No arbitrary SFX.

Kokoro af_heart, normal speed; spell gRPC and transport acronyms through the pronunciation map. Shared word-highlight captions with measured provider timestamps. Sources and correction rationale: [revision-research.md](revision-research.md). The old discovery files remain historical; this source-verified revision supersedes their performance claims.

The user requested regeneration and delegated production decisions; no new script-approval decision is pending.
