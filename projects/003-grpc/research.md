# gRPC: Microservices, Protobuf & HTTP/2

Verified against official gRPC, Protocol Buffers, and RFC 7540 documentation on 2026-10-05.

- gRPC is an open-source, high-performance RPC framework created by Google and hosted by the Cloud Native Computing Foundation (CNCF).
- It uses Protocol Buffers (Protobuf) as its default Interface Definition Language (IDL) and binary serialization format, generating strongly typed client/server stubs in multiple languages.
- Protobuf serializes data into compact binary payloads, eliminating the parsing overhead and verbosity of textual JSON.
- gRPC uses HTTP/2 as its underlying transport, enabling multiplexed streams over a single long-lived TCP connection, header compression via HPACK, and native bidirectional streaming.
- gRPC supports four interaction models: Unary RPC (request/response), Server streaming, Client streaming, and Bidirectional streaming.
- Architecture tradeoff: gRPC excels at low-latency internal microservice communication ("East-West" traffic); REST/JSON remains common for public edge clients ("North-South" traffic) due to browser ergonomics and caching.

## References
- [gRPC Introduction](https://grpc.io/docs/what-is-grpc/introduction/)
- [gRPC Core Concepts](https://grpc.io/docs/what-is-grpc/core-concepts/)
- [Protocol Buffers Overview](https://protobuf.dev/overview/)
- [RFC 7540: Hypertext Transfer Protocol Version 2 (HTTP/2)](https://datatracker.ietf.org/doc/html/rfc7540)
