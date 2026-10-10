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
  bg: "#131D2B",
  panel: "#233044",
  paper: "#F7F2E8",
  ink: "#172331",
  muted: "#A9B8C9",
  line: "#465368",
  purple: "#C3AFFA",
  amber: "#F7C76A",
  red: "#F49B88",
};
const ease = (t: number, at: number, length = 0.8) => {
  const p = Math.max(0, Math.min(1, (t - at) / length));
  return p * p * (3 - 2 * p);
};
const cue = (voice: VoiceScene, word: string, fallback: number) =>
  (voice.words?.find(
    (w) => w.text.toLowerCase().replace(/[^a-z]/g, "") === word.toLowerCase(),
  )?.startMs ?? fallback * 1000) / 1000;
const Text = ({
  x = 90,
  y,
  size = 42,
  fill = C.paper,
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
const Rule = ({ y }: { y: number }) => (
  <line x1={90} y1={y} x2={900} y2={y} stroke={C.line} strokeWidth={2} />
);
const Evidence = ({ y, compact = false }: { y: number; compact?: boolean }) => (
  <g>
    <rect
      x={90}
      y={y}
      width={810}
      height={compact ? 192 : 267}
      fill={C.paper}
      rx={5}
    />
    <rect x={90} y={y} width={10} height={compact ? 192 : 267} fill={C.amber} />
    <Text x={125} y={y + 49} size={30} fill="#57452F" mono>
      ops-policy.md · §2
    </Text>
    <Text x={125} y={y + 105} size={37} fill={C.ink}>
      Application logs are retained for
    </Text>
    <Text
      x={125}
      y={y + (compact ? 165 : 214)}
      size={compact ? 55 : 89}
      fill={C.ink}
    >
      30 days.
    </Text>
  </g>
);

const Hook = ({ t, voice }: { t: number; voice: VoiceScene }) => {
  const p = ease(t, cue(voice, "But", 5));
  return (
    <>
      <Text y={552} size={39} fill={C.muted}>
        How long do we keep logs?
      </Text>
      <Text y={633} size={30} fill={C.red}>
        UNSUPPORTED ANSWER
      </Text>
      <Text y={782} size={135} fill={C.red}>
        90 days.
      </Text>
      <path
        d={`M90 726 L${90 + 590 * p} ${726 - 30 * p}`}
        stroke={C.paper}
        strokeWidth={7}
      />
      <g opacity={p} transform={`translate(0 ${45 * (1 - p)})`}>
        <Evidence y={857} />
      </g>
      <Text y={1235} size={35} fill={C.muted}>
        Fictional example. The source matters.
      </Text>
    </>
  );
};

const Prepare = ({ t, voice }: { t: number; voice: VoiceScene }) => {
  const split = ease(t, cue(voice, "Split", 2));
  const index = ease(t, cue(voice, "index", 4));
  const embedding = ease(t, cue(voice, "Embeddings", 6));
  return (
    <>
      <Text y={555} size={30} fill={C.muted} mono>
        ops-policy.md → passages
      </Text>
      {["01   Scope", "02   Retention: 30 days", "03   Access controls"].map(
        (line, i) => (
          <g key={line}>
            <rect
              x={90 + (1 - split) * i * 15}
              y={617 + i * (85 + 61 * split)}
              width={810 - (1 - split) * i * 30}
              height={120}
              rx={5}
              fill={i === 1 ? C.amber : C.paper}
            />
            <Text
              x={125}
              y={690 + i * (85 + 61 * split)}
              size={43}
              fill={C.ink}
            >
              {line}
            </Text>
          </g>
        ),
      )}
      <g opacity={index}>
        <path
          d="M495 1058 V1100 M479 1084 L495 1100 L511 1084"
          fill="none"
          stroke={C.amber}
          strokeWidth={4}
        />
        <rect
          x={90}
          y={1124}
          width={810}
          height={122}
          rx={5}
          fill={C.panel}
          stroke={C.purple}
          strokeWidth={2}
        />
        <Text x={125} y={1176} size={38} fill={C.purple}>
          SEARCH INDEX
        </Text>
        <Text x={125} y={1221} size={30} fill={C.muted}>
          {embedding > 0.5
            ? "Embeddings can match meaning."
            : "Store passages with source links."}
        </Text>
        {[0, 1, 2].map((i) => (
          <rect
            key={i}
            x={785 + i * 25}
            y={1190 - embedding * (i + 1) * 15}
            width={13}
            height={20 + embedding * (i + 1) * 15}
            fill={C.amber}
          />
        ))}
      </g>
    </>
  );
};

const Retrieve = ({ t, voice }: { t: number; voice: VoiceScene }) => {
  const p = ease(t, cue(voice, "Retrieve", 1.8), 1);
  return (
    <>
      <rect
        x={90}
        y={535}
        width={810}
        height={130}
        rx={5}
        fill={C.panel}
        stroke={C.purple}
        strokeWidth={2}
      />
      <Text x={125} y={583} size={28} fill={C.purple}>
        QUESTION
      </Text>
      <Text x={125} y={636} size={42}>
        How long do we keep logs?
      </Text>
      <g opacity={1 - p}>
        {[
          ["01", "Scope"],
          ["03", "Access controls"],
        ].map(([id, label], i) => (
          <g key={id}>
            <rect
              x={90}
              y={770 + i * 338}
              width={810}
              height={122}
              rx={5}
              fill={C.panel}
            />
            <Text x={125} y={846 + i * 338} size={41} fill={C.muted}>
              {id} {label}
            </Text>
          </g>
        ))}
      </g>
      <g transform={`translate(0 ${-(p * 143)})`}>
        <rect
          x={90}
          y={940}
          width={810}
          height={122 + p * 118}
          rx={5}
          fill={C.amber}
        />
        <Text x={125} y={995} size={31} fill={C.ink} mono>
          02 · ops-policy.md · §2
        </Text>
        <Text x={125} y={1050} size={47} fill={C.ink}>
          Retention: 30 days
        </Text>
        <g opacity={p}>
          <Text x={125} y={1120} size={35} fill={C.ink}>
            Application logs, per the policy.
          </Text>
        </g>
      </g>
      <path d={`M495 685 V${685 + p * 80}`} stroke={C.purple} strokeWidth={4} />
      <g opacity={p}>
        <Text y={1160} size={44} fill={C.amber}>
          Retrieved evidence + source link
        </Text>
        <Text y={1230} size={37} fill={C.muted}>
          The answer comes next.
        </Text>
      </g>
    </>
  );
};

const Generate = ({ t, voice }: { t: number; voice: VoiceScene }) => {
  const merge = ease(t, cue(voice, "prompt", 3));
  const answer = ease(t, cue(voice, "answer", 5), 0.7);
  const cite = ease(t, cue(voice, "link", 7));
  return (
    <>
      <g opacity={merge}>
        <rect
          x={90}
          y={550}
          width={810}
          height={427}
          rx={8}
          stroke={C.purple}
          strokeWidth={3}
          fill="none"
        />
        <Text x={125} y={603} size={31} fill={C.purple}>
          AUGMENTED PROMPT
        </Text>
      </g>
      <g transform={`translate(0 ${merge * 100})`}>
        <rect x={90} y={540} width={810} height={103} fill={C.panel} rx={5} />
        <Text x={125} y={606} size={43}>
          How long do we keep logs?
        </Text>
      </g>
      <g transform={`translate(0 ${merge * 50})`}>
        <Evidence y={701} compact />
      </g>
      <path
        d={`M495 987 V${987 + answer * 70}`}
        stroke={C.purple}
        strokeWidth={4}
      />
      <g opacity={answer} transform={`translate(0 ${25 * (1 - answer)})`}>
        <Text y={1092} size={29} fill={C.purple}>
          MODEL ANSWER
        </Text>
        <Text y={1190} size={84}>
          30 days.<tspan fill={C.amber}> [1]</tspan>
        </Text>
        <Text y={1250} size={30} fill={C.amber} mono>
          [1] ops-policy.md · §2
        </Text>
      </g>
      <path
        d="M825 1230 H881 V838 H850"
        stroke={C.amber}
        strokeWidth={4}
        fill="none"
        opacity={cite}
      />
    </>
  );
};

const Limits = ({ t, voice }: { t: number; voice: VoiceScene }) => {
  const changeAt = cue(voice, "Missing", 7.2);
  const leave = ease(t, changeAt, 0.25);
  const stop = ease(t, changeAt + 0.3, 0.5);
  return (
    <>
      <g opacity={1 - leave}>
        {[
          "Search misses evidence.",
          "Documents become stale.",
          "Models misread passages.",
        ].map((label, i) => {
          const reveal = ease(t, 0.7 + i * 1.3);
          return (
            <g key={label} opacity={0.3 + 0.7 * reveal}>
              <circle cx={108} cy={617 + i * 165} r={13} fill={C.red} />
              <Text x={150} y={631 + i * 165} size={48}>
                {label}
              </Text>
              <line
                x1={150}
                x2={900}
                y1={679 + i * 165}
                y2={679 + i * 165}
                stroke={C.line}
                strokeWidth={2}
              />
            </g>
          );
        })}
      </g>
      <g opacity={stop} transform={`translate(0 ${40 * (1 - stop)})`}>
        <Text y={557} size={30} fill={C.purple}>
          FOLLOW-UP QUESTION
        </Text>
        <Text y={633} size={54}>
          Any deletion exceptions?
        </Text>
        <path
          d="M495 675 V755 M479 739 L495 755 L511 739"
          stroke={C.red}
          strokeWidth={4}
          fill="none"
        />
        <rect
          x={90}
          y={790}
          width={810}
          height={107}
          rx={5}
          fill={C.panel}
          stroke={C.red}
          strokeWidth={2}
        />
        <Text x={495} y={857} size={44} anchor="middle" fill={C.red}>
          NO SUPPORTING PASSAGE
        </Text>
        <path
          d="M495 914 V985 M479 969 L495 985 L511 969"
          stroke={C.red}
          strokeWidth={4}
          fill="none"
        />
        <Text y={1080} size={60}>
          “Not enough evidence
        </Text>
        <Text y={1154} size={60}>
          to answer that.”
        </Text>
      </g>
      <Text y={1245} size={35} fill={C.muted}>
        Build this behavior. Test it.
      </Text>
    </>
  );
};

const Takeaway = ({ t, voice }: { t: number; voice: VoiceScene }) => {
  const check = ease(t, cue(voice, "check", 6));
  const flow = ease(t, cue(voice, "Retrieve", 3), 2.5);
  return (
    <>
      <Text y={535} size={32} fill={C.muted}>
        RETRIEVAL AUGMENTED GENERATION
      </Text>
      {[
        ["SOURCE", "30 days"],
        ["RETRIEVE", "Relevant passage"],
        ["GENERATE", "30 days [1]"],
      ].map(([label, value], i) => (
        <g key={label}>
          <rect
            x={90}
            y={597 + i * 169}
            width={810}
            height={121}
            rx={5}
            fill={i === 0 ? C.paper : C.panel}
          />
          <Text
            x={125}
            y={643 + i * 169}
            size={29}
            fill={i === 0 ? C.ink : C.purple}
          >
            {label}
          </Text>
          <Text
            x={125}
            y={695 + i * 169}
            size={43}
            fill={i === 0 ? C.ink : C.paper}
          >
            {value}
          </Text>
          {i < 2 && (
            <path
              d={`M495 ${728 + i * 169} V${750 + i * 169}`}
              stroke={C.amber}
              strokeWidth={4}
            />
          )}
        </g>
      ))}
      <rect
        x={816}
        y={640 + flow * 338}
        width={43}
        height={35}
        rx={4}
        fill={C.amber}
      />
      <path
        d={`M865 1010 H885 V${1010 - check * 370} H865`}
        stroke={C.amber}
        strokeWidth={4}
        fill="none"
        opacity={check}
      />
      <Text y={1168} size={43} fill={C.amber}>
        Does the source support the answer?
      </Text>
      <Text y={1240} size={36} fill={C.muted}>
        Keep the searchable index current.
      </Text>
    </>
  );
};

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
  const visuals = {
    hook: Hook,
    "hallucination-problem": Prepare,
    "rag-solution": Retrieve,
    pipeline: Generate,
    "grounded-answer": Limits,
    takeaway: Takeaway,
  };
  const Visual = visuals[scene.id as keyof typeof visuals];
  if (!Visual) throw new Error(`Unknown RAG scene: ${scene.id}`);
  return (
    <AbsoluteFill>
      <Audio src={staticFile(`${assetRoot}/voice/${voice.file}`)} />
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        <Text y={177} size={27} fill={C.muted}>
          AI SYSTEMS / RAG
        </Text>
        <Text x={900} y={177} size={27} fill={C.muted} anchor="end">
          0{index + 1} / 06
        </Text>
        <Rule y={215} />
        <Text y={335} size={scene.id === "pipeline" ? 78 : 83} weight={700}>
          {scene.onScreenText[0]}
        </Text>
        <Text y={435} size={76} weight={700} fill={C.purple}>
          {scene.onScreenText[1]}
        </Text>
        <Visual t={t} voice={voice} />
        <Rule y={1313} />
        <Text y={1580} size={23} fill={C.muted}>
          ILLUSTRATIVE POLICY · SOURCES: LEWIS ET AL. / MICROSOFT
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
        }}
      >
        <KaraokeCaptions
          mode={video.captions?.mode}
          captions={voice.captions}
          words={voice.words ?? []}
          timeMs={t * 1000}
          highlight={C.amber}
          textColor={C.paper}
          activeTextColor={C.ink}
          pendingColor={C.muted}
        />
      </div>
    </AbsoluteFill>
  );
};

export const RagVideo = ({ video, voiceManifest, assetRoot }: VideoProps) => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill
      style={{
        backgroundColor: C.bg,
        color: C.paper,
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
