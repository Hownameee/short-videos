import type { ReactNode } from "react";
import {
  AbsoluteFill,
  Audio,
  Series,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { VideoProps, VideoScene, VoiceScene } from "./video-types";
import { KaraokeCaptions } from "./KaraokeCaptions";
import { BackgroundMusic } from "./BackgroundMusic";

const C = {
  paper: "#F2F4EF",
  ink: "#142B30",
  muted: "#52676A",
  line: "#C7D2CA",
  green: "#006A60",
  lime: "#C7F36A",
  orange: "#A5442B",
  blue: "#2969A2",
};
const ease = (t: number, start: number, length = 0.8) => {
  const x = Math.max(0, Math.min(1, (t - start) / length));
  return x * x * (3 - 2 * x);
};
const cue = (voice: VoiceScene, word: string, fallback: number) =>
  (voice.words?.find(
    (w) => w.text.toLowerCase().replace(/[^a-z]/g, "") === word.toLowerCase(),
  )?.startMs ?? fallback * 1000) / 1000;
const Text = ({
  x = 90,
  y,
  size = 44,
  fill = C.ink,
  children,
  anchor = "start",
  mono = false,
  weight = 600,
}: {
  x?: number;
  y: number;
  size?: number;
  fill?: string;
  children: ReactNode;
  anchor?: "start" | "middle" | "end";
  mono?: boolean;
  weight?: number;
}) => (
  <text
    x={x}
    y={y}
    fontSize={size}
    fill={fill}
    textAnchor={anchor}
    fontWeight={weight}
    fontFamily={mono ? "Menlo, monospace" : "Arial, sans-serif"}
  >
    {children}
  </text>
);
const Line = ({ y }: { y: number }) => (
  <line x1={90} y1={y} x2={900} y2={y} stroke={C.line} strokeWidth={2} />
);
const Node = ({
  x,
  y,
  label,
  sub,
}: {
  x: number;
  y: number;
  label: string;
  sub: string;
}) => (
  <g>
    <rect x={x} y={y} width={340} height={172} rx={6} fill={C.ink} />
    <Text x={x + 30} y={y + 67} fill={C.lime} size={43}>
      {label}
    </Text>
    <Text x={x + 30} y={y + 121} fill="#FFFFFF" size={30}>
      {sub}
    </Text>
  </g>
);

const Hook = ({ t }: { t: number }) => (
  <>
    <Text y={555} size={34} fill={C.muted}>
      WHAT ACTUALLY CHANGES?
    </Text>
    {["Contract", "Bytes", "Streams"].map((label, i) => {
      const p = ease(t, 0.6 + i * 1.05);
      return (
        <g
          key={label}
          transform={`translate(${(1 - p) * 65} 0)`}
          opacity={0.2 + 0.8 * p}
        >
          <Text y={695 + i * 175} size={95} fill={i === 1 ? C.green : C.ink}>
            {label}
          </Text>
          <line
            x1={90}
            x2={90 + p * 470}
            y1={725 + i * 175}
            y2={725 + i * 175}
            stroke={C.line}
            strokeWidth={3}
          />
        </g>
      );
    })}
    <g opacity={ease(t, 0.6)}>
      <rect x={650} y={619} width={220} height={88} rx={5} fill={C.ink} />
      <Text x={760} y={679} size={43} anchor="middle" mono fill={C.lime}>
        {"{ id }"}
      </Text>
    </g>
    <g opacity={ease(t, 1.65)}>
      <path
        d="M760 722 V782 M744 766 L760 782 L776 766"
        fill="none"
        stroke={C.green}
        strokeWidth={4}
      />
      {["08", "2A"].map((byte, i) => (
        <g key={byte}>
          <rect
            x={650 + i * 119}
            y={796}
            width={101}
            height={88}
            rx={5}
            fill={C.lime}
          />
          <Text x={700 + i * 119} y={857} size={43} anchor="middle" mono>
            {byte}
          </Text>
        </g>
      ))}
    </g>
    <g opacity={ease(t, 2.7)}>
      <path
        d="M760 899 V959 M744 943 L760 959 L776 943"
        fill="none"
        stroke={C.green}
        strokeWidth={4}
      />
      <line
        x1={650}
        y1={1015}
        x2={890}
        y2={1015}
        stroke={C.line}
        strokeWidth={5}
      />
      {[0, 1, 2].map((i) => (
        <rect
          key={i}
          x={650 + ((Math.max(0, t - 2.7) * 65 + i * 75) % 190)}
          y={992}
          width={45}
          height={46}
          rx={4}
          fill={[C.green, C.blue, C.orange][i]}
        />
      ))}
    </g>
    <Text y={1230} size={36} fill={C.muted}>
      A system of tradeoffs. Not a speed promise.
    </Text>
  </>
);

const Contract = ({ t, voice }: { t: number; voice: VoiceScene }) => {
  const p = ease(t, cue(voice, "Generate", 4.4));
  return (
    <>
      <Text y={540} size={31} fill={C.green} mono>
        inventory.proto
      </Text>
      <rect x={90} y={575} width={810} height={265} fill="#FFFFFF" rx={6} />
      <Text x={125} y={642} size={39} mono>
        rpc GetItem(ItemRequest)
      </Text>
      <Text x={125} y={704} size={39} mono>
        returns (ItemReply);
      </Text>
      <Text x={125} y={789} size={31} fill={C.muted}>
        Method + request type + response type
      </Text>
      <path
        d={`M495 840 V${840 + 68 * p} M260 976 V908 H730 V976`}
        fill="none"
        stroke={C.green}
        strokeWidth={5}
        opacity={p}
      />
      <g opacity={p} transform={`translate(0 ${30 * (1 - p)})`}>
        <Node x={90} y={976} label="CLIENT" sub="Calls the method" />
        <Node x={560} y={976} label="SERVER" sub="Implements it" />
        <Text x={495} y={1235} size={40} anchor="middle" fill={C.green}>
          Generated from the same schema
        </Text>
      </g>
    </>
  );
};

const Bytes = ({ t, voice }: { t: number; voice: VoiceScene }) => {
  const p = ease(t, cue(voice, "Protocol", 4.5));
  return (
    <>
      <Text y={550} size={32} fill={C.muted}>
        ILLUSTRATIVE MESSAGE: id = 42
      </Text>
      <Text y={635} size={34} fill={C.green}>
        JSON · UTF-8
      </Text>
      <Text y={730} size={79} mono>
        {'{"id":42}'}
      </Text>
      <Text x={895} y={725} size={52} anchor="end">
        9 bytes
      </Text>
      <Line y={787} />
      <g opacity={0.2 + 0.8 * p} transform={`translate(0 ${35 * (1 - p)})`}>
        <Text y={863} size={34} fill={C.green}>
          PROTOBUF · HEX
        </Text>
        {["08", "2A"].map((v, i) => (
          <g key={v}>
            <rect
              x={90 + i * 172}
              y={900}
              width={148}
              height={135}
              fill={i ? C.lime : C.ink}
              rx={6}
            />
            <Text
              x={164 + i * 172}
              y={992}
              anchor="middle"
              size={70}
              mono
              fill={i ? C.ink : "#FFFFFF"}
            >
              {v}
            </Text>
          </g>
        ))}
        <Text x={895} y={990} anchor="end" size={65} fill={C.green}>
          2 bytes
        </Text>
        <Text y={1112} size={39} mono>
          uint32 id = 1;
        </Text>
        <Text y={1193} size={34} fill={C.muted}>
          Message body only. Headers excluded.
        </Text>
        <Text y={1242} size={34} fill={C.muted}>
          Size example ≠ speed benchmark.
        </Text>
      </g>
    </>
  );
};

const Streams = ({ t, voice }: { t: number; voice: VoiceScene }) => {
  const lossAt = cue(voice, "But", 3.5);
  const held = t >= lossAt && t < lossAt + 2.4;
  const clock = t < lossAt ? t : t < lossAt + 2.4 ? lossAt : t - 2.4;
  const reveal = ease(t, lossAt, 0.4);
  return (
    <>
      <Text y={565} size={34} fill={C.muted}>
        HTTP/2 · INTERLEAVED FRAMES
      </Text>
      <Text y={650} size={36}>
        CLIENT
      </Text>
      <Text x={900} y={650} size={36} anchor="end">
        SERVER
      </Text>
      <rect
        x={90}
        y={706}
        width={810}
        height={182}
        rx={91}
        fill="none"
        stroke={held ? C.orange : C.ink}
        strokeWidth={5}
      />
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const pos = (clock * 0.17 + i / 6) % 1;
        return (
          <g key={i} opacity={Math.min(1, pos * 12, (1 - pos) * 12)}>
            <rect
              x={106 + pos * 675}
              y={763}
              width={95}
              height={66}
              rx={5}
              fill={[C.green, C.blue, C.orange][i % 3]}
            />
            <Text
              x={153 + pos * 675}
              y={808}
              size={32}
              anchor="middle"
              fill="#FFFFFF"
            >
              S{(i % 3) + 1}
            </Text>
          </g>
        );
      })}
      <Text
        x={495}
        y={960}
        size={40}
        anchor="middle"
        fill={held ? C.orange : C.green}
      >
        {held
          ? "PACKET LOSS → SHARED WAIT"
          : "Independent streams, shared transport"}
      </Text>
      <g opacity={reveal}>
        <Line y={1030} />
        <Text y={1102} size={40} fill={C.orange}>
          TCP loss can still block streams.
        </Text>
        <Text y={1190} size={40}>
          REST can use HTTP/2 too.
        </Text>
      </g>
    </>
  );
};

const Streaming = ({ t, voice }: { t: number; voice: VoiceScene }) => {
  const p = ease(t, cue(voice, "or", 2.3));
  const packets = p > 0.5 ? 3 : 1;
  return (
    <>
      <Node x={90} y={550} label="CLIENT" sub="Send + receive" />
      <Node x={560} y={550} label="SERVER" sub="Send + receive" />
      {[0, 1].map((direction) => (
        <g key={direction}>
          <path
            d={
              direction
                ? "M825 955 H165 L189 931 M165 955 L189 979"
                : "M165 823 H825 L801 799 M825 823 L801 847"
            }
            stroke={direction ? C.blue : C.green}
            strokeWidth={5}
            fill="none"
          />
          {Array.from({ length: packets }, (_, i) => {
            const progress = (t * 0.25 + i / 3) % 1;
            const x = direction ? 795 - progress * 585 : 180 + progress * 585;
            return (
              <rect
                key={i}
                x={x}
                y={direction ? 932 : 800}
                width={53}
                height={46}
                rx={4}
                fill={direction ? C.blue : C.green}
              />
            );
          })}
        </g>
      ))}
      <Text x={495} y={1080} size={51} anchor="middle" fill={C.green}>
        {p > 0.5 ? "Messages in both directions" : "One request, one response"}
      </Text>
      <g opacity={p}>
        <Text y={1180} size={35} fill={C.muted}>
          UNARY · CLIENT · SERVER
        </Text>
        <Text y={1238} size={35} fill={C.green}>
          BIDIRECTIONAL STREAMING
        </Text>
      </g>
    </>
  );
};

const Takeaway = ({ t, voice }: { t: number; voice: VoiceScene }) => (
  <>
    {[
      ["Shared contracts", "Do both sides share a schema?"],
      ["Streaming", "Do messages flow over time?"],
      ["Real workload", "Measure latency, CPU, and size."],
    ].map(([title, sub], i) => {
      const p = ease(t, i === 2 ? cue(voice, "benchmark", 5) : i * 1.1, 0.6);
      return (
        <g
          key={title}
          opacity={0.25 + 0.75 * p}
          transform={`translate(0 ${22 * (1 - p)})`}
        >
          <Text y={590 + i * 190} size={57} fill={i === 2 ? C.green : C.ink}>
            {title}
          </Text>
          <Text y={650 + i * 190} size={35} fill={C.muted}>
            {sub}
          </Text>
          <Line y={696 + i * 190} />
        </g>
      );
    })}
    <Text y={1192} size={40} fill={C.green}>
      Check your browser requirements.
    </Text>
    <Text y={1251} size={32} fill={C.muted}>
      gRPC-Web exists; support differs.
    </Text>
  </>
);

const Scene = ({
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
  const t = frame / fps;
  const components = {
    hook: Hook,
    "rest-bottleneck": Contract,
    protobuf: Bytes,
    "http2-multiplex": Streams,
    streaming: Streaming,
    takeaway: Takeaway,
  };
  const Visual = components[scene.id as keyof typeof components];
  if (!Visual) throw new Error(`Unknown gRPC scene: ${scene.id}`);
  return (
    <AbsoluteFill>
      <Audio src={staticFile(`${assetRoot}/voice/${voice.file}`)} />
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        <Text y={177} size={27} fill={C.muted}>
          SYSTEMS / gRPC
        </Text>
        <Text x={900} y={177} size={27} anchor="end" fill={C.muted}>
          0{index + 1} / 06
        </Text>
        <Line y={215} />
        <Text y={335} size={89} weight={700}>
          {scene.onScreenText[0]}
        </Text>
        <Text y={437} size={78} weight={700} fill={C.green}>
          {scene.onScreenText[1]}
        </Text>
        <Visual t={t} voice={voice} />
        <Line y={1313} />
        <Text y={1580} size={23} fill={C.muted}>
          GRPC.IO · PROTOBUF.DEV · RFC 9113
        </Text>
      </svg>
      <div
        style={{
          position: "absolute",
          left: 90,
          top: 1360,
          width: 810,
          minHeight: 150,
          fontSize: 46,
          lineHeight: 1.22,
          fontWeight: 600,
          textAlign: "left",
        }}
      >
        <KaraokeCaptions
          mode={video.captions?.mode}
          captions={voice.captions}
          words={voice.words ?? []}
          timeMs={t * 1000}
          highlight={C.lime}
          textColor={C.ink}
          activeTextColor={C.ink}
          pendingColor={C.muted}
        />
      </div>
    </AbsoluteFill>
  );
};

export const GrpcVideo = ({ video, voiceManifest, assetRoot }: VideoProps) => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill
      style={{
        backgroundColor: C.paper,
        color: C.ink,
        fontFamily: "Arial, sans-serif",
      }}
    >
      <BackgroundMusic video={video} assetRoot={assetRoot} />
      <Series>
        {video.scenes.map((scene, index) => {
          const voice = voiceManifest.scenes[index];
          if (!voice || voice.id !== scene.id)
            throw new Error(`Missing matching voice for ${scene.id}`);
          return (
            <Series.Sequence
              key={scene.id}
              name={scene.id}
              durationInFrames={Math.ceil((voice.durationSec + 0.45) * fps)}
              premountFor={fps}
            >
              <Scene
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
