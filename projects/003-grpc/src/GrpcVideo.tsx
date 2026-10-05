import {
  AbsoluteFill,
  Audio,
  interpolate,
  Series,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { VideoProps, VideoScene, VoiceScene } from "./video-types";
import { KaraokeCaptions } from "./KaraokeCaptions";
import { BackgroundMusic } from "./BackgroundMusic";

const C = {
  bg: "#070B14",
  panel: "#0F172A",
  panelBorder: "#1E293B",
  text: "#F8FAFC",
  muted: "#94A3B8",
  blue: "#2496ED",
  cyan: "#00E5BD",
  purple: "#8B5CF6",
  red: "#F43F5E",
  amber: "#F59E0B",
  emerald: "#10B981",
};

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const mono = "JetBrains Mono, Menlo, monospace";

// Scene 1: Hook - Split Comparison
const HookScene = ({ seconds }: { seconds: number }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const intro = spring({ frame, fps, config: { damping: 14, stiffness: 100 } });
  const pulse = (Math.sin(seconds * 4) + 1) / 2;

  return (
    <g transform={`translate(0 ${(1 - intro) * 40})`} opacity={intro}>
      {/* Background comparison glow */}
      <rect x="90" y="270" width="430" height="760" rx="20" fill={C.panel} stroke="#331A24" strokeWidth="2" />
      <rect x="560" y="270" width="430" height="760" rx="20" fill={C.panel} stroke="#13364D" strokeWidth="2" />

      {/* REST side */}
      <g transform="translate(120 310)">
        <rect x="0" y="0" width="130" height="40" rx="8" fill="#F43F5E22" stroke={C.red} strokeWidth="2" />
        <text x="65" y="26" fill={C.red} fontSize="20" fontWeight="bold" textAnchor="middle" fontFamily={mono}>
          REST / JSON
        </text>
        <text x="0" y="80" fill={C.muted} fontSize="22" fontWeight="600">
          Transport: HTTP/1.1
        </text>

        {/* Queued Connections Graphic */}
        <g transform="translate(0 110)">
          <text x="0" y="24" fill="#E2E8F0" fontSize="18" fontFamily={mono}>
            Multiple TCP Sockets
          </text>
          {[0, 1, 2].map((i) => (
            <g key={i} transform={`translate(0 ${40 + i * 50})`}>
              <rect x="0" y="0" width="370" height="38" rx="8" fill="#1E1622" stroke="#4C1D24" strokeWidth="1.5" />
              <circle cx="24" cy="19" r="7" fill={C.red} />
              <text x="44" y="25" fill="#FDA4AF" fontSize="16" fontFamily={mono}>
                {i === 0 ? "Conn 1: Blocked" : i === 1 ? "Conn 2: Handshake" : "Conn 3: Inactive"}
              </text>
              <rect x="290" y="8" width="65" height="22" rx="4" fill="#F43F5E33" />
              <text x="322" y="24" fill={C.red} fontSize="14" fontWeight="bold" textAnchor="middle" fontFamily={mono}>
                WAIT
              </text>
            </g>
          ))}
        </g>

        {/* Latency Meter */}
        <g transform="translate(0 340)">
          <rect x="0" y="0" width="370" height="110" rx="12" fill="#1C131D" stroke="#5C1D2E" strokeWidth="1.5" />
          <text x="20" y="38" fill={C.muted} fontSize="18">
            Avg Internal Latency
          </text>
          <text x="20" y="85" fill={C.red} fontSize="44" fontWeight="800" fontFamily={mono}>
            ~142 ms
          </text>
        </g>

        {/* Payload overhead badge */}
        <g transform="translate(0 480)">
          <rect x="0" y="0" width="370" height="70" rx="12" fill="#201518" />
          <text x="20" y="42" fill="#FECDD3" fontSize="18">
            ⚠️ Heavy Text Keys & Headers
          </text>
        </g>
      </g>

      {/* VS Badge */}
      <circle cx="540" cy="650" r="44" fill="#0A0F1D" stroke="#334155" strokeWidth="3" />
      <text x="540" y="660" fill="#F8FAFC" fontSize="26" fontWeight="900" textAnchor="middle" fontFamily={mono}>
        VS
      </text>

      {/* gRPC side */}
      <g transform="translate(590 310)">
        <rect x="0" y="0" width="130" height="40" rx="8" fill="#2496ED22" stroke={C.blue} strokeWidth="2" />
        <text x="65" y="26" fill={C.blue} fontSize="20" fontWeight="bold" textAnchor="middle" fontFamily={mono}>
          gRPC
        </text>
        <text x="0" y="80" fill={C.muted} fontSize="22" fontWeight="600">
          Transport: HTTP/2
        </text>

        {/* Multiplexed Pipe Graphic */}
        <g transform="translate(0 110)">
          <text x="0" y="24" fill="#E2E8F0" fontSize="18" fontFamily={mono}>
            1 Persistent TCP Pipe
          </text>
          <rect x="0" y="40" width="370" height="138" rx="12" fill="#0E2439" stroke={C.blue} strokeWidth="2" />
          {/* Animated Multiplexed Stream Packets */}
          {[0, 1, 2].map((i) => {
            const offset = (seconds * 0.9 + i * 0.33) % 1;
            const xPos = 20 + offset * 300;
            const yPos = 65 + i * 36;
            return (
              <g key={i}>
                <line x1="20" y1={yPos} x2="350" y2={yPos} stroke="#1E3A5F" strokeWidth="2" strokeDasharray="4 4" />
                <rect x={xPos - 25} y={yPos - 12} width="50" height="24" rx="6" fill={i === 0 ? C.blue : i === 1 ? C.cyan : C.purple} />
                <text x={xPos} y={yPos + 5} fill="#050B14" fontSize="12" fontWeight="bold" textAnchor="middle" fontFamily={mono}>
                  S{i + 1}
                </text>
              </g>
            );
          })}
        </g>

        {/* Latency Meter */}
        <g transform="translate(0 340)">
          <rect x="0" y="0" width="370" height="110" rx="12" fill="#0C2538" stroke="#1D4E75" strokeWidth="1.5" />
          <text x="20" y="38" fill={C.cyan} fontSize="18" fontWeight="600">
            Avg Internal Latency
          </text>
          <text x="20" y="85" fill={C.cyan} fontSize="44" fontWeight="800" fontFamily={mono}>
            ~14 ms
          </text>
        </g>

        {/* Performance advantage badge */}
        <g transform="translate(0 480)">
          <rect x="0" y="0" width="370" height="70" rx="12" fill="#0D3042" stroke={C.cyan} strokeWidth="1.5" opacity={0.8 + pulse * 0.2} />
          <text x="20" y="42" fill="#A7F3D0" fontSize="20" fontWeight="bold">
            ⚡ Up to 10x Throughput
          </text>
        </g>
      </g>
    </g>
  );
};

// Scene 2: REST Bottleneck - JSON string overhead and TCP queue
const RestBottleneckScene = ({ seconds }: { seconds: number }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const intro = spring({ frame, fps, config: { damping: 14, stiffness: 100 } });
  const highlightPulse = (Math.sin(seconds * 5) + 1) / 2;

  return (
    <g transform={`translate(0 ${(1 - intro) * 40})`} opacity={intro}>
      {/* Code Editor Window */}
      <rect x="90" y="270" width="900" height="470" rx="16" fill={C.panel} stroke={C.panelBorder} strokeWidth="2" />
      {/* Editor Header */}
      <rect x="90" y="270" width="900" height="54" rx="16" fill="#162238" />
      <circle cx="125" cy="297" r="7" fill="#EF4444" />
      <circle cx="149" cy="297" r="7" fill="#F59E0B" />
      <circle cx="173" cy="297" r="7" fill="#10B981" />
      <text x="210" y="303" fill={C.muted} fontSize="18" fontFamily={mono}>
        payload.json (Overhead: ~78% Strings)
      </text>

      {/* JSON Payload Display */}
      <g transform="translate(130 370)" fontFamily={mono} fontSize="26">
        <text x="0" y="0" fill={C.muted}>{"{"}</text>
        
        {/* Line 1 with highlighted key */}
        <g transform="translate(35 45)">
          <rect x="-6" y="-26" width="240" height="36" rx="6" fill="#EF444433" stroke={C.red} strokeWidth="1.5" strokeOpacity={0.6 + highlightPulse * 0.4} />
          <text x="0" y="0" fill="#FCA5A5">"transaction_id"</text>
          <text x="245" y="0" fill={C.muted}>: </text>
          <text x="270" y="0" fill="#93C5FD">"tx_98412904",</text>
        </g>

        {/* Line 2 with highlighted key */}
        <g transform="translate(35 95)">
          <rect x="-6" y="-26" width="225" height="36" rx="6" fill="#EF444433" stroke={C.red} strokeWidth="1.5" strokeOpacity={0.6 + highlightPulse * 0.4} />
          <text x="0" y="0" fill="#FCA5A5">"customer_name"</text>
          <text x="230" y="0" fill={C.muted}>: </text>
          <text x="255" y="0" fill="#93C5FD">"Alexander Doe",</text>
        </g>

        {/* Line 3 with highlighted key */}
        <g transform="translate(35 145)">
          <rect x="-6" y="-26" width="245" height="36" rx="6" fill="#EF444433" stroke={C.red} strokeWidth="1.5" strokeOpacity={0.6 + highlightPulse * 0.4} />
          <text x="0" y="0" fill="#FCA5A5">"account_balance"</text>
          <text x="250" y="0" fill={C.muted}>: </text>
          <text x="275" y="0" fill="#FCD34D">18450.75,</text>
        </g>

        {/* Line 4 with highlighted key */}
        <g transform="translate(35 195)">
          <rect x="-6" y="-26" width="180" height="36" rx="6" fill="#EF444433" stroke={C.red} strokeWidth="1.5" strokeOpacity={0.6 + highlightPulse * 0.4} />
          <text x="0" y="0" fill="#FCA5A5">"is_verified"</text>
          <text x="185" y="0" fill={C.muted}>: </text>
          <text x="210" y="0" fill="#6EE7B7">true</text>
        </g>

        <text x="0" y="245" fill={C.muted}>{"}"}</text>
      </g>

      {/* Callout box for String Redundancy */}
      <g transform="translate(90 770)">
        <rect x="0" y="0" width="900" height="120" rx="16" fill="#1A1523" stroke="#551F2F" strokeWidth="2" />
        <circle cx="50" cy="60" r="22" fill="#F43F5E33" />
        <text x="50" y="68" fill={C.red} fontSize="26" fontWeight="bold" textAnchor="middle">!</text>
        <text x="90" y="48" fill="#F8FAFC" fontSize="22" fontWeight="bold">
          Repeated Field Names Wasting CPU
        </text>
        <text x="90" y="82" fill={C.muted} fontSize="19">
          Every microservice call repeatedly encodes, sends, and parses raw text strings.
        </text>
      </g>

      {/* TCP Connection Exhaustion */}
      <g transform="translate(90 920)">
        <rect x="0" y="0" width="900" height="140" rx="16" fill={C.panel} stroke={C.panelBorder} strokeWidth="2" />
        <text x="35" y="42" fill="#F1F5F9" fontSize="22" fontWeight="bold">
          HTTP/1.1 Connection Exhaustion
        </text>
        <g transform="translate(35 65)">
          {["TCP 3-Way Handshake", "TLS Negotiation", "Request / Response", "Connection Close"].map((step, i) => (
            <g key={i} transform={`translate(${i * 210} 0)`}>
              <rect x="0" y="0" width="195" height="44" rx="8" fill="#1C2438" stroke="#334155" strokeWidth="1" />
              <text x="15" y="28" fill="#CBD5E1" fontSize="14" fontFamily={mono}>
                {step}
              </text>
            </g>
          ))}
        </g>
      </g>
    </g>
  );
};

// Scene 3: Protocol Buffers - Schema and Binary Compression
const ProtobufScene = ({ seconds }: { seconds: number }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const intro = spring({ frame, fps, config: { damping: 14, stiffness: 100 } });
  const meterProgress = interpolate(seconds, [1, 4], [0, 0.85], clamp);

  return (
    <g transform={`translate(0 ${(1 - intro) * 40})`} opacity={intro}>
      {/* Schema Card */}
      <g transform="translate(90 270)">
        <rect x="0" y="0" width="430" height="520" rx="16" fill={C.panel} stroke="#1E3A5F" strokeWidth="2" />
        <rect x="0" y="0" width="430" height="50" rx="16" fill="#162B44" />
        <text x="25" y="32" fill={C.blue} fontSize="20" fontWeight="bold" fontFamily={mono}>
          transaction.proto
        </text>

        <g transform="translate(25 90)" fontFamily={mono} fontSize="20">
          <text x="0" y="0" fill="#93C5FD">message</text>
          <text x="85" y="0" fill="#F8FAFC"> Transaction {"{"}</text>
          
          <g transform="translate(25 40)">
            <text x="0" y="0" fill={C.cyan}>int64</text>
            <text x="70" y="0" fill="#E2E8F0"> id</text>
            <text x="120" y="0" fill={C.amber}> = 1;</text>
          </g>

          <g transform="translate(25 80)">
            <text x="0" y="0" fill={C.cyan}>string</text>
            <text x="70" y="0" fill="#E2E8F0"> name</text>
            <text x="135" y="0" fill={C.amber}> = 2;</text>
          </g>

          <g transform="translate(25 120)">
            <text x="0" y="0" fill={C.cyan}>double</text>
            <text x="70" y="0" fill="#E2E8F0"> balance</text>
            <text x="165" y="0" fill={C.amber}> = 3;</text>
          </g>

          <g transform="translate(25 160)">
            <text x="0" y="0" fill={C.cyan}>bool</text>
            <text x="70" y="0" fill="#E2E8F0"> verified</text>
            <text x="175" y="0" fill={C.amber}> = 4;</text>
          </g>

          <text x="0" y="210" fill="#F8FAFC">{"}"}</text>
        </g>

        <g transform="translate(25 360)">
          <rect x="0" y="0" width="380" height="120" rx="10" fill="#0C1E33" stroke={C.blue} strokeWidth="1.5" />
          <text x="20" y="35" fill={C.blue} fontSize="17" fontWeight="bold">
            Strict Field Tags (Numbers)
          </text>
          <text x="20" y="65" fill={C.muted} fontSize="16">
            Field names are never transmitted.
          </text>
          <text x="20" y="92" fill="#6EE7B7" fontSize="16" fontWeight="600">
            Only field IDs (1, 2, 3...) + values.
          </text>
        </g>
      </g>

      {/* Binary Output Card */}
      <g transform="translate(560 270)">
        <rect x="0" y="0" width="430" height="520" rx="16" fill={C.panel} stroke="#134E48" strokeWidth="2" />
        <rect x="0" y="0" width="430" height="50" rx="16" fill="#0E3935" />
        <text x="25" y="32" fill={C.cyan} fontSize="20" fontWeight="bold" fontFamily={mono}>
          Binary Stream (Wire Format)
        </text>

        {/* Compact Hex dump visual */}
        <g transform="translate(25 90)">
          <rect x="0" y="0" width="380" height="230" rx="10" fill="#051B17" stroke="#115E59" strokeWidth="1" />
          <g transform="translate(20 40)" fontFamily={mono} fontSize="22" fill={C.cyan}>
            <text x="0" y="0">08 A4 80 04 12 09</text>
            <text x="0" y="45">41 6C 65 78 61 6E</text>
            <text x="0" y="90">64 65 72 19 00 00</text>
            <text x="0" y="135">00 00 E0 09 D2 20</text>
          </g>
          <rect x="20" y="190" width="340" height="26" rx="4" fill="#042F2E" />
          <text x="190" y="208" fill="#5EEAD4" fontSize="14" fontWeight="bold" textAnchor="middle" fontFamily={mono}>
            TOTAL WIRE SIZE: 28 BYTES
          </text>
        </g>

        {/* Size comparison pill */}
        <g transform="translate(25 360)">
          <rect x="0" y="0" width="380" height="120" rx="10" fill="#0A2C2A" stroke={C.cyan} strokeWidth="1.5" />
          <text x="20" y="35" fill="#5EEAD4" fontSize="18" fontWeight="bold">
            JSON vs Protobuf Size:
          </text>
          <text x="20" y="70" fill={C.red} fontSize="20" fontFamily={mono}>
            JSON: 184 bytes
          </text>
          <text x="20" y="98" fill={C.cyan} fontSize="22" fontWeight="bold" fontFamily={mono}>
            Protobuf: 28 bytes (-85%)
          </text>
        </g>
      </g>

      {/* Bottom Meter: 10x Serialization Speed */}
      <g transform="translate(90 820)">
        <rect x="0" y="0" width="900" height="220" rx="16" fill={C.panel} stroke={C.panelBorder} strokeWidth="2" />
        <text x="40" y="45" fill="#F8FAFC" fontSize="24" fontWeight="bold">
          Serialization & Deserialization Speed
        </text>
        <text x="40" y="78" fill={C.muted} fontSize="18">
          Binary decoding bypasses string parsers and object reflection.
        </text>

        {/* Progress Bar Container */}
        <g transform="translate(40 115)">
          <rect x="0" y="0" width="820" height="36" rx="8" fill="#1E293B" />
          <rect x="0" y="0" width={820 * meterProgress} height="36" rx="8" fill={C.cyan} />
          <text x="20" y="24" fill="#0F172A" fontSize="16" fontWeight="bold" fontFamily={mono}>
            Up to 10x Faster Throughput
          </text>
        </g>
        <text x="40" y="190" fill="#A7F3D0" fontSize="20" fontWeight="bold">
          ⚡ Microseconds parsing instead of milliseconds
        </text>
      </g>
    </g>
  );
};

// Scene 4: HTTP/2 Multiplexing - Single Socket with Concurrent Streams
const Http2MultiplexScene = ({ seconds }: { seconds: number }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const intro = spring({ frame, fps, config: { damping: 14, stiffness: 100 } });

  // Stream packets moving along the central pipe
  const streams = [
    { id: 1, name: "Stream #1 (Auth)", color: C.blue, speed: 0.8, y: 55 },
    { id: 2, name: "Stream #2 (Payment)", color: C.cyan, speed: 1.1, y: 110 },
    { id: 3, name: "Stream #3 (Inventory)", color: C.purple, speed: 0.95, y: 165 },
    { id: 4, name: "Stream #4 (Analytics)", color: C.emerald, speed: 1.25, y: 220 },
  ];

  return (
    <g transform={`translate(0 ${(1 - intro) * 40})`} opacity={intro}>
      {/* Node A (Client Service) */}
      <g transform="translate(90 300)">
        <rect x="0" y="0" width="220" height="340" rx="16" fill={C.panel} stroke={C.blue} strokeWidth="2" />
        <rect x="0" y="0" width="220" height="50" rx="16" fill="#162D4A" />
        <text x="110" y="32" fill={C.blue} fontSize="18" fontWeight="bold" textAnchor="middle" fontFamily={mono}>
          Service A (Go)
        </text>
        <circle cx="110" cy="120" r="38" fill="#1E3A5F" stroke={C.blue} strokeWidth="2" />
        <text x="110" y="128" fill="#93C5FD" fontSize="28" fontWeight="bold" textAnchor="middle">
          ⚡
        </text>
        <text x="110" y="190" fill="#E2E8F0" fontSize="18" fontWeight="600" textAnchor="middle">
          Client Node
        </text>
        <text x="110" y="220" fill={C.muted} fontSize="14" textAnchor="middle">
          Single Socket Open
        </text>
        <rect x="25" y="260" width="170" height="40" rx="8" fill="#0C2538" stroke={C.blue} strokeWidth="1" />
        <text x="110" y="285" fill={C.cyan} fontSize="15" fontWeight="bold" textAnchor="middle" fontFamily={mono}>
          HTTP/2 TCP Conn
        </text>
      </g>

      {/* Node B (Backend Service) */}
      <g transform="translate(770 300)">
        <rect x="0" y="0" width="220" height="340" rx="16" fill={C.panel} stroke={C.cyan} strokeWidth="2" />
        <rect x="0" y="0" width="220" height="50" rx="16" fill="#103A34" />
        <text x="110" y="32" fill={C.cyan} fontSize="18" fontWeight="bold" textAnchor="middle" fontFamily={mono}>
          Service B (Java)
        </text>
        <circle cx="110" cy="120" r="38" fill="#0F3830" stroke={C.cyan} strokeWidth="2" />
        <text x="110" y="128" fill="#5EEAD4" fontSize="28" fontWeight="bold" textAnchor="middle">
          ⚙️
        </text>
        <text x="110" y="190" fill="#E2E8F0" fontSize="18" fontWeight="600" textAnchor="middle">
          Server Node
        </text>
        <text x="110" y="220" fill={C.muted} fontSize="14" textAnchor="middle">
          Worker Pool Ready
        </text>
        <rect x="25" y="260" width="170" height="40" rx="8" fill="#0A2C2A" stroke={C.cyan} strokeWidth="1" />
        <text x="110" y="285" fill="#5EEAD4" fontSize="15" fontWeight="bold" textAnchor="middle" fontFamily={mono}>
          Active Listener
        </text>
      </g>

      {/* Central Multiplexed Tunnel */}
      <g transform="translate(320 330)">
        {/* Pipe background container */}
        <rect x="0" y="0" width="440" height="280" rx="20" fill="#081524" stroke="#1E3E62" strokeWidth="2.5" />
        <text x="220" y="32" fill="#93C5FD" fontSize="16" fontWeight="bold" textAnchor="middle" fontFamily={mono}>
          SHARED TCP PIPE (MULTIPLEXED)
        </text>

        {/* Animated packet streams inside the single socket */}
        {streams.map((stream, idx) => {
          const progress = (seconds * stream.speed + idx * 0.25) % 1;
          const xPos = 20 + progress * 330;
          return (
            <g key={stream.id} transform={`translate(0 ${stream.y})`}>
              <line x1="20" y1="0" x2="420" y2="0" stroke="#13273E" strokeWidth="1.5" strokeDasharray="6 6" />
              {/* Packet Frame */}
              <rect x={xPos} y="-16" width="68" height="32" rx="6" fill={stream.color} opacity="0.9" />
              <text x={xPos + 34} y="5" fill="#0A0F1D" fontSize="13" fontWeight="900" textAnchor="middle" fontFamily={mono}>
                DATA #{stream.id}
              </text>
            </g>
          );
        })}
      </g>

      {/* Key Advantages Callout Grid */}
      <g transform="translate(90 680)">
        <rect x="0" y="0" width="900" height="360" rx="16" fill={C.panel} stroke={C.panelBorder} strokeWidth="2" />
        
        <text x="40" y="45" fill="#F8FAFC" fontSize="24" fontWeight="bold">
          Why HTTP/2 Multiplexing Wins:
        </text>

        {/* Feature 1 */}
        <g transform="translate(40 75)">
          <rect x="0" y="0" width="390" height="110" rx="12" fill="#0F2438" stroke="#1D4E75" strokeWidth="1" />
          <text x="25" y="38" fill={C.blue} fontSize="20" fontWeight="bold">
            Zero Head-of-Line Blocking
          </text>
          <text x="25" y="70" fill={C.muted} fontSize="16">
            A slow response does not block other requests in the pipe.
          </text>
        </g>

        {/* Feature 2 */}
        <g transform="translate(470 75)">
          <rect x="0" y="0" width="390" height="110" rx="12" fill="#0B2D29" stroke="#115E59" strokeWidth="1" />
          <text x="25" y="38" fill={C.cyan} fontSize="20" fontWeight="bold">
            1 Long-Lived Socket
          </text>
          <text x="25" y="70" fill={C.muted} fontSize="16">
            Eliminates constant TCP 3-way handshakes and TLS overhead.
          </text>
        </g>

        {/* Feature 3 */}
        <g transform="translate(40 210)">
          <rect x="0" y="0" width="390" height="110" rx="12" fill="#1C1833" stroke="#4C1D95" strokeWidth="1" />
          <text x="25" y="38" fill={C.purple} fontSize="20" fontWeight="bold">
            HPACK Header Compression
          </text>
          <text x="25" y="70" fill={C.muted} fontSize="16">
            Compresses redundant metadata across all requests.
          </text>
        </g>

        {/* Feature 4 */}
        <g transform="translate(470 210)">
          <rect x="0" y="0" width="390" height="110" rx="12" fill="#162D24" stroke="#047857" strokeWidth="1" />
          <text x="25" y="38" fill={C.emerald} fontSize="20" fontWeight="bold">
            Binary Framing Layer
          </text>
          <text x="25" y="70" fill={C.muted} fontSize="16">
            Messages split into small frames for instant reassembly.
          </text>
        </g>
      </g>
    </g>
  );
};

// Scene 5: Native Streaming - 4 Communication Modes
const StreamingScene = ({ seconds }: { seconds: number }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const intro = spring({ frame, fps, config: { damping: 14, stiffness: 100 } });

  const modes = [
    {
      title: "1. Unary RPC",
      desc: "1 Request  ➔  1 Response (Standard API)",
      active: true,
      color: C.blue,
      icon: "⇄",
    },
    {
      title: "2. Server Streaming",
      desc: "1 Request  ➔  Continuous Stream of Data",
      active: true,
      color: C.cyan,
      icon: "⇶",
    },
    {
      title: "3. Client Streaming",
      desc: "Continuous Stream of Data  ➔  1 Response",
      active: true,
      color: C.purple,
      icon: "⇇",
    },
    {
      title: "4. Bidirectional Streaming",
      desc: "Two-way live streams simultaneously",
      active: true,
      color: C.emerald,
      icon: "⇆",
    },
  ];

  return (
    <g transform={`translate(0 ${(1 - intro) * 40})`} opacity={intro}>
      {/* Container Card */}
      <rect x="90" y="270" width="900" height="770" rx="16" fill={C.panel} stroke={C.panelBorder} strokeWidth="2" />

      {/* Header Banner */}
      <g transform="translate(130 320)">
        <text x="0" y="0" fill="#F8FAFC" fontSize="28" fontWeight="bold">
          4 Native gRPC Communication Modes
        </text>
        <text x="0" y="35" fill={C.muted} fontSize="18">
          REST requires clumsy WebSockets or polling; gRPC supports streaming natively.
        </text>
      </g>

      {/* 4 Mode Cards */}
      <g transform="translate(130 390)">
        {modes.map((mode, i) => {
          const streamOffset = (seconds * 1.2 + i * 0.25) % 1;
          return (
            <g key={i} transform={`translate(0 ${i * 145})`}>
              <rect
                x="0"
                y="0"
                width="820"
                height="125"
                rx="14"
                fill="#0A1220"
                stroke={mode.color}
                strokeWidth="1.8"
              />
              {/* Mode Icon */}
              <circle cx="55" cy="62" r="32" fill={`${mode.color}22`} />
              <text x="55" y="72" fill={mode.color} fontSize="28" fontWeight="bold" textAnchor="middle">
                {mode.icon}
              </text>

              {/* Title & Desc */}
              <text x="110" y="48" fill="#F8FAFC" fontSize="22" fontWeight="bold">
                {mode.title}
              </text>
              <text x="110" y="85" fill={C.muted} fontSize="18" fontFamily={mono}>
                {mode.desc}
              </text>

              {/* Dynamic Animated Pulse along the mode */}
              <circle cx={680 + streamOffset * 80} cy="62" r="8" fill={mode.color} />
              <circle cx={680 + streamOffset * 80} cy="62" r="16" fill={`${mode.color}33`} />
            </g>
          );
        })}
      </g>

      {/* Use Cases pill */}
      <g transform="translate(130 990)">
        <text x="0" y="0" fill="#6EE7B7" fontSize="18" fontWeight="bold">
          ✓ Ideal for: Real-time telemetry, chat, payment streaming, and AI token feeds.
        </text>
      </g>
    </g>
  );
};

// Scene 6: Architecture Rule - Ingress vs Internal Mesh
const TakeawayScene = ({ seconds }: { seconds: number }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const intro = spring({ frame, fps, config: { damping: 14, stiffness: 100 } });
  const pulse = (Math.sin(seconds * 4) + 1) / 2;

  return (
    <g transform={`translate(0 ${(1 - intro) * 40})`} opacity={intro}>
      {/* Architecture Layout Canvas */}
      <rect x="90" y="270" width="900" height="770" rx="16" fill={C.panel} stroke={C.panelBorder} strokeWidth="2" />

      {/* Top Layer: Public Clients */}
      <g transform="translate(130 310)">
        <rect x="0" y="0" width="820" height="90" rx="12" fill="#172238" stroke="#334155" strokeWidth="1.5" />
        <text x="40" y="42" fill="#E2E8F0" fontSize="20" fontWeight="bold">
          PUBLIC EDGE CLIENTS (Browsers & Mobile Apps)
        </text>
        <text x="40" y="70" fill={C.muted} fontSize="16">
          Standard HTTP JSON / GraphQL (Easily cached, browser native)
        </text>
        <rect x="680" y="25" width="100" height="40" rx="8" fill="#F43F5E33" stroke={C.red} strokeWidth="1" />
        <text x="730" y="50" fill={C.red} fontSize="16" fontWeight="bold" textAnchor="middle" fontFamily={mono}>
          REST
        </text>
      </g>

      {/* Downward Arrow to Gateway */}
      <g transform="translate(540 410)">
        <line x1="0" y1="0" x2="0" y2="40" stroke={C.red} strokeWidth="3" strokeDasharray="4 4" />
        <polygon points="-6,35 6,35 0,46" fill={C.red} />
      </g>

      {/* Middle Layer: API Gateway */}
      <g transform="translate(290 460)">
        <rect x="0" y="0" width="500" height="80" rx="12" fill="#1E293B" stroke={C.amber} strokeWidth="2" />
        <text x="250" y="42" fill="#FCD34D" fontSize="22" fontWeight="bold" textAnchor="middle">
          API GATEWAY / REVERSE PROXY
        </text>
        <text x="250" y="66" fill={C.muted} fontSize="15" textAnchor="middle">
          Translates external REST to internal gRPC
        </text>
      </g>

      {/* Downward Flow to Internal Mesh */}
      <g transform="translate(540 550)">
        <line x1="0" y1="0" x2="0" y2="40" stroke={C.cyan} strokeWidth="3" />
        <polygon points="-6,35 6,35 0,46" fill={C.cyan} />
        <text x="15" y="26" fill={C.cyan} fontSize="14" fontWeight="bold" fontFamily={mono}>
          gRPC WIRE
        </text>
      </g>

      {/* Bottom Layer: Internal Microservices Mesh */}
      <g transform="translate(130 600)">
        <rect x="0" y="0" width="820" height="260" rx="14" fill="#091B2E" stroke={C.blue} strokeWidth="2" />
        <rect x="0" y="0" width="820" height="45" rx="14" fill="#132E4D" />
        <text x="30" y="30" fill={C.cyan} fontSize="18" fontWeight="bold" fontFamily={mono}>
          INTERNAL PRIVATE MESH (EAST-WEST TRAFFIC)
        </text>

        {/* 4 Internal Service Nodes */}
        {[
          { name: "Auth Service", lang: "Go" },
          { name: "Order Service", lang: "Java" },
          { name: "Payment Service", lang: "Rust" },
          { name: "Inventory", lang: "Node.js" },
        ].map((svc, i) => (
          <g key={i} transform={`translate(${30 + (i % 2) * 390} ${65 + Math.floor(i / 2) * 85})`}>
            <rect x="0" y="0" width="370" height="70" rx="10" fill="#0C253D" stroke={C.cyan} strokeWidth="1.2" />
            <circle cx="28" cy="35" r="10" fill={C.cyan} />
            <text x="50" y="34" fill="#F8FAFC" fontSize="18" fontWeight="bold">
              {svc.name}
            </text>
            <text x="50" y="55" fill={C.muted} fontSize="14" fontFamily={mono}>
              Language: {svc.lang} • Type-safe gRPC
            </text>
            <rect x="290" y="20" width="65" height="30" rx="6" fill="#00E5BD33" />
            <text x="322" y="40" fill={C.cyan} fontSize="13" fontWeight="bold" textAnchor="middle" fontFamily={mono}>
              gRPC
            </text>
          </g>
        ))}
      </g>

      {/* The Rule of Thumb Banner */}
      <g transform="translate(130 880)">
        <rect
          x="0"
          y="0"
          width="820"
          height="130"
          rx="14"
          fill="#0B2F2A"
          stroke={C.cyan}
          strokeWidth="2"
          opacity={0.9 + pulse * 0.1}
        />
        <text x="40" y="42" fill="#5EEAD4" fontSize="22" fontWeight="900">
          THE GOLDEN ARCHITECTURE RULE:
        </text>
        <text x="40" y="78" fill="#F8FAFC" fontSize="22" fontWeight="600">
          gRPC on the Inside for speed & type safety.
        </text>
        <text x="40" y="108" fill={C.muted} fontSize="18">
          REST on the Outside for browser compatibility.
        </text>
      </g>
    </g>
  );
};

// Scene Router
const GrpcScene = ({
  video,
  scene,
  voice,
  index,
  assetRoot,
}: {
  video: VideoProps["video"];
  scene: VideoScene;
  voice: VoiceScene;
  index: number;
  assetRoot: string;
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const seconds = frame / fps;

  return (
    <AbsoluteFill>
      <Audio src={staticFile(`${assetRoot}/voice/${voice.file}`)} />

      {/* Top Header & Topic Banner */}
      <div
        style={{
          position: "absolute",
          left: 90,
          top: 140,
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <div
          style={{
            backgroundColor: `${C.blue}25`,
            border: `1.5px solid ${C.blue}`,
            color: C.cyan,
            fontFamily: mono,
            fontSize: 18,
            fontWeight: 800,
            padding: "6px 14px",
            borderRadius: 8,
            letterSpacing: 1.5,
          }}
        >
          BACKEND ARCHITECTURE
        </div>
        <div
          style={{
            color: C.muted,
            fontFamily: mono,
            fontSize: 18,
            letterSpacing: 1,
          }}
        >
          SCENE 0{index + 1} / 0{video.scenes.length}
        </div>
      </div>

      {/* Scene Title */}
      <div
        style={{
          position: "absolute",
          left: 90,
          top: 195,
          width: 900,
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: 40,
            fontWeight: 900,
            color: C.text,
            letterSpacing: "-0.5px",
          }}
        >
          {scene.onScreenText[0] || scene.purpose}
        </h1>
      </div>

      {/* Main Interactive Diagram Visual */}
      <svg
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 1080,
          height: 1920,
        }}
      >
        {scene.id === "hook" && <HookScene seconds={seconds} />}
        {scene.id === "rest-bottleneck" && <RestBottleneckScene seconds={seconds} />}
        {scene.id === "protobuf" && <ProtobufScene seconds={seconds} />}
        {scene.id === "http2-multiplex" && <Http2MultiplexScene seconds={seconds} />}
        {scene.id === "streaming" && <StreamingScene seconds={seconds} />}
        {scene.id === "takeaway" && <TakeawayScene seconds={seconds} />}
      </svg>

      {/* Karaoke Captions Box */}
      <div
        style={{
          position: "absolute",
          left: 90,
          top: 1335,
          width: 810,
          minHeight: 220,
        }}
      >
        <KaraokeCaptions
          mode={video.captions?.mode}
          captions={voice.captions}
          words={voice.words || []}
          timeMs={seconds * 1000}
        />
      </div>

      {/* Source Citation Footer */}
      <div
        style={{
          position: "absolute",
          left: 90,
          top: 1665,
          width: 810,
          color: C.muted,
          fontFamily: mono,
          fontSize: 18,
          letterSpacing: 1,
        }}
      >
        SOURCE: GRPC.IO / PROTOBUF.DEV / RFC 7540
      </div>
    </AbsoluteFill>
  );
};

export const GrpcVideo = ({
  video,
  voiceManifest,
  assetRoot,
}: VideoProps) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  return (
    <AbsoluteFill
      style={{
        backgroundColor: C.bg,
        color: C.text,
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      {/* Brand Accent Left Border */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 12,
          height: "100%",
          background: `linear-gradient(180deg, ${C.blue} 0%, ${C.cyan} 100%)`,
        }}
      />

      {/* Progress Bar at bottom */}
      <div
        style={{
          position: "absolute",
          left: 90,
          top: 1610,
          height: 5,
          width: 810,
          backgroundColor: "#1E293B",
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${(frame / durationInFrames) * 100}%`,
            background: `linear-gradient(90deg, ${C.blue} 0%, ${C.cyan} 100%)`,
          }}
        />
      </div>

      <BackgroundMusic video={video} assetRoot={assetRoot} />

      <Series>
        {video.scenes.map((scene, index) => {
          const voice = voiceManifest.scenes[index];
          if (!voice) return null;
          return (
            <Series.Sequence
              key={scene.id}
              durationInFrames={Math.ceil((voice.durationSec + 0.45) * fps)}
              premountFor={fps}
            >
              <GrpcScene
                video={video}
                scene={scene}
                voice={voice}
                index={index}
                assetRoot={assetRoot}
              />
            </Series.Sequence>
          );
        })}
      </Series>
    </AbsoluteFill>
  );
};
