# gRPC remake: factual corrections

Verified 2026-10-06. This revision supplements the original discovery record;
the historical research/direction files describe the superseded first edition.
The user requested a complete remake, preserving the gRPC topic.

- **Contract and generated code:** define service methods and message types in a
  `.proto` schema; generate client/server bindings. Protocol Buffers are the
  default, not the only possible serialization format.
  [gRPC core concepts](https://grpc.io/docs/what-is-grpc/core-concepts/).
- **Concrete encoding example:** with `uint32 id = 1`, id 42 encodes to hex
  `08 2A`: field tag `(1 << 3) | 0`, then varint 42. Minified UTF-8 JSON
  `{"id":42}` is nine bytes; this Protobuf message is two. This compares message
  bodies only, excluding framing and headers, and is not a latency benchmark.
  [Protocol Buffers encoding](https://protobuf.dev/programming-guides/encoding/).
- **Multiplexing:** HTTP/2 interleaves independent streams over a connection.
  TCP packet loss can still delay all streams. REST APIs can also use HTTP/2;
  REST does not require a new TCP handshake per request.
  [RFC 9113](https://www.rfc-editor.org/rfc/rfc9113.html), sections 1 and 5.
- **Streaming:** unary, server-streaming, client-streaming and bidirectional RPC
  methods are supported. The two directions of a bidirectional call can operate
  independently. [gRPC core concepts](https://grpc.io/docs/what-is-grpc/core-concepts/).
- **Choice:** contracts and streaming can make gRPC useful between services.
  Browser support has different constraints; gRPC-Web is available. “gRPC inside,
  REST outside” is not a universal architecture rule. Measure the actual workload.
  [gRPC-Web](https://github.com/grpc/grpc-web).

Removed unsupported 10x claims, fabricated latency measurements, repeated-
handshake generalization, zero-blocking claim, and universal architecture rule.
