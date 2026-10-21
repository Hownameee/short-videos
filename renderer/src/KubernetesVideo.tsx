import {
  AbsoluteFill,
  Audio,
  interpolate,
  Sequence,
  Series,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  spring,
} from "remotion";
import type { VideoProps, VideoScene, VoiceScene } from "./video-types";
import { KaraokeCaptions } from "./KaraokeCaptions";
import { BackgroundMusic } from "./BackgroundMusic";

const C = {
  bg: "#081522",
  panel: "#10293B",
  ink: "#F3F7F2",
  muted: "#A0B7BF",
  blue: "#62C8FF",
  green: "#88E5B0",
  orange: "#FFAE66",
};
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const mono = "Menlo, monospace";

const Flow = ({
  points,
  seconds,
  delay = 0,
  color = C.green,
}: {
  points: number[][];
  seconds: number;
  delay?: number;
  color?: string;
}) => {
  const lengths = points
    .slice(1)
    .map((p, i) => Math.hypot(p[0] - points[i][0], p[1] - points[i][1]));
  const total = lengths.reduce((a, b) => a + b, 0);
  return (
    <g>
      {[0, 0.33, 0.66].map((offset, i) => {
        let distance =
          (((((seconds - delay) * 0.55 + offset) % 1) + 1) % 1) * total;
        let segment = 0;
        while (segment < lengths.length - 1 && distance > lengths[segment]) {
          distance -= lengths[segment];
          segment++;
        }
        const t = distance / lengths[segment];
        const x =
          points[segment][0] +
          (points[segment + 1][0] - points[segment][0]) * t;
        const y =
          points[segment][1] +
          (points[segment + 1][1] - points[segment][1]) * t;
        return (
          <g key={i}>
            <circle cx={x} cy={y} r="18" fill={color} opacity="0.13" />
            <circle cx={x} cy={y} r="8" fill={color} />
          </g>
        );
      })}
    </g>
  );
};

const Pod = ({
  x,
  y,
  label,
  state = "ready",
  opacity = 1,
  enterAt = 0,
}: {
  x: number;
  y: number;
  label: string;
  state?: "ready" | "missing" | "starting";
  opacity?: number;
  enterAt?: number;
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const elapsed = frame / fps - enterAt;
  const arrival = spring({
    frame: frame - enterAt * fps,
    fps,
    config: { damping: 13, stiffness: 110, mass: 0.7 },
  });
  const breath = (Math.sin((frame / fps) * 4) + 1) / 2;
  const color =
    state === "missing" ? C.orange : state === "starting" ? C.blue : C.green;
  return (
    <g
      opacity={elapsed < 0 ? 0 : opacity}
      transform={`translate(${x + 101} ${y + 92 + (1 - arrival) * 80}) scale(${0.6 + arrival * 0.4}) translate(${-x - 101} ${-y - 92})`}
    >
      <rect
        x={x - 7}
        y={y - 7}
        width={216}
        height={198}
        rx={28}
        fill="none"
        stroke={color}
        strokeWidth={2}
        opacity={0.08 + breath * 0.2}
      />
      <rect
        x={x}
        y={y}
        width={202}
        height={184}
        rx={22}
        fill={state === "missing" ? "none" : C.panel}
        stroke={color}
        strokeWidth={3}
        strokeDasharray={state === "missing" ? "10 10" : undefined}
      />
      {state === "missing" ? (
        <path
          d={`M ${x + 84} ${y + 44} l 34 34 m -34 0 l 34 -34`}
          stroke={color}
          strokeWidth={5}
        />
      ) : (
        <g transform={`translate(0 ${Math.sin((frame / fps) * 2.6 + x) * 4})`}>
          <path
            d={`M ${x + 76} ${y + 42} l 25 -14 l 25 14 v 30 l -25 14 l -25 -14 Z M ${x + 76} ${y + 42} l 25 15 l 25 -15 M ${x + 101} ${y + 57} v 29`}
            fill="none"
            stroke={color}
            strokeWidth={3}
          />
        </g>
      )}
      <text
        x={x + 101}
        y={y + 125}
        fill={C.ink}
        textAnchor="middle"
        fontSize={31}
        fontWeight={700}
      >
        {label}
      </text>
      <text
        x={x + 101}
        y={y + 160}
        fill={color}
        textAnchor="middle"
        fontSize={24}
      >
        {state === "missing"
          ? "DELETED"
          : state === "starting"
            ? "STARTING"
            : "READY"}
      </text>
      <circle
        cx={x + 177}
        cy={y + 23}
        r={5 + breath * 2}
        fill={color}
        opacity={0.5 + breath * 0.5}
      />
      {state === "starting" && (
        <g transform={`rotate(${(frame / fps) * 210} ${x + 101} ${y + 56})`}>
          <circle
            cx={x + 101}
            cy={y + 56}
            r={39}
            fill="none"
            stroke={C.blue}
            strokeWidth={4}
            strokeDasharray="48 197"
          />
        </g>
      )}
    </g>
  );
};

const Cluster = ({ mode, seconds }: { mode: string; seconds: number }) => {
  const deletionAt = mode === "hook" ? 0.8 : 1.1;
  const burst = interpolate(
    seconds,
    [deletionAt, deletionAt + 0.85],
    [0, 1],
    clamp,
  );
  const draw = interpolate(seconds, [0, 0.8], [0, 1], clamp);
  const scan = (seconds * 0.45) % 1;
  const missing =
    mode === "hook"
      ? seconds > 0.8
      : mode === "observe"
        ? seconds > 1.1
        : mode === "replace" && seconds < 2;
  const starting = mode === "replace" && seconds >= 2 && seconds < 6;
  const isNew = mode === "replace" && seconds >= 2;
  const count = missing ? 2 : 3;
  return (
    <svg width="810" height="640" viewBox="0 0 810 640">
      <text x="0" y="42" fill={C.muted} fontSize="25" letterSpacing="3">
        DEPLOYMENT / WEB APP
      </text>
      <rect x="0" y="77" width="810" height="120" rx="20" fill={C.panel} />
      <text x="32" y="127" fill={C.muted} fontSize="27">
        DESIRED
      </text>
      <text x="32" y="174" fill={C.blue} fontSize="42" fontFamily={mono}>
        replicas: 3
      </text>
      <line
        x1="416"
        y1="105"
        x2="416"
        y2="167"
        stroke="#2B4658"
        strokeWidth="2"
      />
      <text x="461" y="127" fill={C.muted} fontSize="27">
        EXISTING PODS
      </text>
      <text
        x="461"
        y="175"
        fill={missing ? C.orange : C.green}
        fontSize="45"
        fontFamily={mono}
      >
        {count} / 3
      </text>
      <path
        d="M 120 290 V 246 H 690 V 290 M 405 197 V 290"
        fill="none"
        stroke="#36556A"
        strokeWidth="3"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - draw}
      />
      <path
        d="M 120 290 V 246 H 690 V 290 M 405 197 V 290"
        fill="none"
        stroke={missing ? C.orange : C.blue}
        strokeWidth="5"
        strokeDasharray="24 86"
        strokeDashoffset={-seconds * 130}
      />
      {mode !== "declare" && (
        <g opacity={0.6}>
          <rect
            x={16 + scan * 760}
            y={282}
            width="5"
            height="207"
            fill={missing ? C.orange : C.blue}
          />
          <rect
            x={Math.max(15, 16 + scan * 760 - 55)}
            y={282}
            width={Math.min(55, scan * 760)}
            height="207"
            fill={missing ? C.orange : C.blue}
            opacity="0.08"
          />
        </g>
      )}
      <Pod
        x={19}
        y={291}
        label="Pod A"
        enterAt={mode === "declare" ? 0.25 : 0}
      />
      <Pod
        x={304}
        y={291}
        label={isNew ? "Pod D" : "Pod B"}
        state={missing ? "missing" : starting ? "starting" : "ready"}
        enterAt={isNew ? 2 : mode === "declare" ? 0.7 : 0}
      />
      <Pod
        x={589}
        y={291}
        label="Pod C"
        enterAt={mode === "declare" ? 1.15 : 0}
      />
      {(mode === "hook" || mode === "observe") &&
        seconds >= deletionAt &&
        burst < 1 && (
          <g>
            <circle
              cx="405"
              cy="383"
              r={40 + burst * 175}
              fill="none"
              stroke={C.orange}
              strokeWidth={6 * (1 - burst)}
              opacity={1 - burst}
            />
            {Array.from({ length: 10 }, (_, i) => {
              const a = (i * Math.PI) / 5;
              return (
                <rect
                  key={i}
                  x={405 + Math.cos(a) * burst * 180 - 7}
                  y={383 + Math.sin(a) * burst * 140 - 7}
                  width="14"
                  height="14"
                  fill={C.orange}
                  opacity={1 - burst}
                  transform={`rotate(${burst * 150} ${405 + Math.cos(a) * burst * 180} ${383 + Math.sin(a) * burst * 140})`}
                />
              );
            })}
          </g>
        )}
      <text
        x="405"
        y="550"
        textAnchor="middle"
        fill={missing ? C.orange : C.green}
        fontSize="34"
        fontWeight="700"
      >
        {missing
          ? "One replica is missing"
          : starting
            ? "New identity. New container."
            : isNew
              ? "Desired replica count restored"
              : "Three copies of your application"}
      </text>
      {mode === "replace" ? (
        <g>
          <path d="M 112 602 H 696" stroke="#36556A" strokeWidth="3" />
          {["Controller", "Scheduler", "Kubelet"].map((label, i) => {
            const on = seconds >= [0, 2.15, 4.1][i];
            return (
              <g key={label}>
                <rect
                  x={i * 275 + 3}
                  y="577"
                  width="255"
                  height="50"
                  rx="15"
                  fill={C.panel}
                  stroke={on ? C.blue : "#36556A"}
                  strokeWidth="2"
                />
                <text
                  x={i * 275 + 130}
                  y="610"
                  textAnchor="middle"
                  fontSize="24"
                  fill={on ? C.ink : C.muted}
                >
                  {label}
                </text>
                <rect
                  x={i * 275 + 12}
                  y="634"
                  width={interpolate(
                    seconds,
                    [[0, 2.15, 4.1][i], [2, 4.1, 6][i]],
                    [0, 235],
                    clamp,
                  )}
                  height="4"
                  fill={C.blue}
                />
              </g>
            );
          })}
        </g>
      ) : (
        <text x="405" y="603" textAnchor="middle" fill={C.muted} fontSize="24">
          Simplified illustration · timing varies
        </text>
      )}
    </svg>
  );
};

const ServiceDiagram = ({ seconds }: { seconds: number }) => {
  const ready = seconds > 6.2;
  return (
    <svg width="810" height="660" viewBox="0 0 810 660">
      <text x="405" y="40" textAnchor="middle" fill={C.muted} fontSize="30">
        CLIENT
      </text>
      <path d="M 405 70 V 153" stroke={C.blue} strokeWidth="4" />
      <Flow
        points={[
          [405, 70],
          [405, 153],
        ]}
        seconds={seconds}
        color={C.blue}
      />
      <rect
        x="164"
        y="153"
        width="482"
        height="126"
        rx="23"
        fill={C.panel}
        stroke={C.blue}
        strokeWidth="3"
      />
      <text
        x="405"
        y="205"
        textAnchor="middle"
        fill={C.ink}
        fontSize="40"
        fontWeight="700"
      >
        Service
      </text>
      <text
        x="405"
        y="249"
        textAnchor="middle"
        fill={C.blue}
        fontSize="27"
        fontFamily={mono}
      >
        web.default.svc
      </text>
      <path
        d="M 405 279 V 328 H 120 V 413 M 405 328 H 690 V 413"
        stroke={C.green}
        strokeWidth="3"
        fill="none"
      />
      <path
        d="M 405 328 V 413"
        stroke={ready ? C.green : "#36556A"}
        strokeWidth="3"
        strokeDasharray={ready ? undefined : "8 8"}
      />
      <Flow
        points={[
          [405, 279],
          [405, 328],
          [120, 328],
          [120, 413],
        ]}
        seconds={seconds}
      />
      <Flow
        points={[
          [405, 279],
          [405, 328],
          [690, 328],
          [690, 413],
        ]}
        seconds={seconds}
        delay={0.3}
      />
      {ready && (
        <Flow
          points={[
            [405, 279],
            [405, 413],
          ]}
          seconds={seconds}
          delay={6.2}
        />
      )}
      <Pod x={19} y={414} label="Pod A" />
      <Pod x={304} y={414} label="Pod D" state={ready ? "ready" : "starting"} />
      <Pod x={589} y={414} label="Pod C" />
      <text
        x="405"
        y="648"
        textAnchor="middle"
        fill={ready ? C.green : C.muted}
        fontSize="28"
      >
        {ready ? "Ready → receives traffic" : "Not ready → no traffic"}
      </text>
    </svg>
  );
};

const Limits = ({ seconds }: { seconds: number }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>
    {[
      ["01", "Time to recover", "Scheduling + startup + readiness"],
      ["02", "Room to run", "Available cluster resources"],
      ["03", "Working code", "Application bugs still need a fix"],
    ].map(([n, title, detail], i) => (
      <div
        key={n}
        style={{
          borderTop: "2px solid #2B4658",
          paddingTop: 28,
          translate: `${interpolate(seconds, [i * 1.2, i * 1.2 + 0.65], [140, 0], clamp)}px 0px`,
          opacity: interpolate(
            seconds,
            [i * 1.2, i * 1.2 + 0.4],
            [0.25, 1],
            clamp,
          ),
        }}
      >
        <div
          style={{
            fontFamily: mono,
            fontSize: 25,
            color: C.orange,
            marginBottom: 14,
          }}
        >
          {n}
        </div>
        <div style={{ fontSize: 49, fontWeight: 700, marginBottom: 14 }}>
          {title}
        </div>
        <div style={{ fontSize: 29, color: C.muted }}>{detail}</div>
        <div
          style={{
            marginTop: 20,
            height: 5,
            width: "100%",
            backgroundColor: "#20384A",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${interpolate(seconds, [i * 1.2, i * 1.2 + 1.1], [0, 100], clamp)}%`,
              backgroundColor: C.orange,
            }}
          />
        </div>
      </div>
    ))}
  </div>
);

const Recap = ({ seconds }: { seconds: number }) => (
  <div>
    <div
      style={{
        display: "flex",
        gap: 32,
        alignItems: "baseline",
        fontFamily: mono,
        marginBottom: 40,
      }}
    >
      <span
        style={{
          fontSize: 156,
          color: C.orange,
          opacity: interpolate(seconds, [0, 1], [0.2, 1], clamp),
          translate: `0 ${interpolate(seconds, [0, 0.6], [60, 0], clamp)}px`,
        }}
      >
        2
      </span>
      <span
        style={{
          fontSize: 75,
          color: C.muted,
          translate: `${Math.sin(seconds * 4) * 12}px 0px`,
        }}
      >
        →
      </span>
      <span
        style={{
          fontSize: 156,
          color: C.green,
          scale: interpolate(
            seconds,
            [0, 0.5, 0.9, 1.1],
            [0, 0, 1.18, 1],
            clamp,
          ),
        }}
      >
        3
      </span>
      <span style={{ fontSize: 31, color: C.muted }}>replicas</span>
    </div>
    <div style={{ fontSize: 49, fontWeight: 700, lineHeight: 1.5 }}>
      {["Observe.", "Compare.", "Reconcile."].map((word, i) => (
        <div
          key={word}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
            color: Math.floor(seconds * 1.1) % 3 === i ? C.green : C.muted,
          }}
        >
          <span
            style={{
              display: "inline-block",
              height: 12,
              width: 12,
              borderRadius: "50%",
              backgroundColor:
                Math.floor(seconds * 1.1) % 3 === i ? C.green : "#36556A",
              scale: Math.floor(seconds * 1.1) % 3 === i ? 1.5 : 1,
            }}
          />
          {word}
        </div>
      ))}
    </div>
    <div
      style={{
        marginTop: 38,
        borderTop: "2px solid #2B4658",
        paddingTop: 30,
        opacity: interpolate(seconds, [3.7, 4.2], [0, 1], clamp),
      }}
    >
      <div
        style={{
          fontSize: 25,
          color: C.blue,
          letterSpacing: 3,
          marginBottom: 18,
        }}
      >
        TRY IT IN A TEST CLUSTER
      </div>
      <div style={{ fontSize: 34, lineHeight: 1.5 }}>
        Set 3 replicas.
        <br />
        Delete 1 Pod. Watch it return.
      </div>
    </div>
  </div>
);

const Scene = ({
  scene,
  voice,
  index,
  assetRoot,
  video,
  useCombinedVoice,
}: {
  scene: VideoScene;
  voice: VoiceScene;
  index: number;
  assetRoot: string;
  video: VideoProps["video"];
  useCombinedVoice: boolean;
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const seconds = frame / fps;
  const title = scene.onScreenText;
  const entrance = spring({
    frame,
    fps,
    config: { damping: 19, stiffness: 100 },
  });
  return (
    <AbsoluteFill>
      {video.audio !== null && !useCombinedVoice && <Audio src={staticFile(`${assetRoot}/voice/${voice.file}`)} />}
      {video.audio !== null && video.audio?.sfx !== false && scene.id === "replace" && (
        <Sequence
          from={Math.round(6 * fps)}
          durationInFrames={fps}
          premountFor={fps}
        >
          <Audio
            src={staticFile(`${assetRoot}/assets/sfx/success-chime.wav`)}
            volume={0.16}
          />
        </Sequence>
      )}
      <div
        style={{
          position: "absolute",
          left: 90,
          top: 169,
          width: 810,
          translate: `${(1 - entrance) * 100}px 0px`,
          opacity: interpolate(seconds, [0, 8 / 30], [0.25, 1], clamp),
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 24,
            fontFamily: mono,
            letterSpacing: 2,
            color: C.muted,
          }}
        >
          <span>KUBERNETES / EXPLAINED</span>
          <span style={{ color: C.blue }}>0{index + 1} / 07</span>
        </div>
        <div
          style={{
            marginTop: 70,
            fontSize: index === 1 || index === 6 ? 76 : 84,
            lineHeight: 1.09,
            fontWeight: 800,
            letterSpacing: -3,
            translate: `0px ${interpolate(seconds, [0, 20 / 30], [40, 0], clamp)}px`,
          }}
        >
          <div>{title[0]}</div>
          <div
            style={{
              color: scene.id === "limits" ? C.orange : C.blue,
              marginTop: 12,
              fontSize: index === 1 ? 64 : undefined,
            }}
          >
            {title[1]}
          </div>
          <div
            style={{
              height: 5,
              backgroundColor: C.blue,
              marginTop: 26,
              width: interpolate(seconds, [8 / 30, 35 / 30], [0, 180], clamp),
            }}
          />
        </div>
        <div
          style={{
            marginTop: 38,
            fontFamily: mono,
            fontSize: 24,
            color: C.muted,
            letterSpacing: 2,
          }}
        >
          {
            [
              "THE FAILURE",
              "01 / DECLARE",
              "02 / OBSERVE",
              "03 / RECONCILE",
              "ROUTE TO READY PODS",
              "THE LIMITS",
              "THE TAKEAWAY",
            ][index]
          }
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 90,
          top: 650,
          width: 810,
          opacity: interpolate(seconds, [0, 12 / 30], [0.6, 1], clamp),
          translate: `0px ${(1 - entrance) * 110}px`,
          scale: 0.94 + entrance * 0.06,
          transformOrigin: "center center",
        }}
      >
        {["hook", "declare", "observe", "replace"].includes(scene.id) ? (
          <Cluster mode={scene.id} seconds={seconds} />
        ) : scene.id === "service" ? (
          <ServiceDiagram seconds={seconds} />
        ) : scene.id === "limits" ? (
          <Limits seconds={seconds} />
        ) : (
          <Recap seconds={seconds} />
        )}
      </div>
      <div
        style={{
          position: "absolute",
          left: 90,
          top: 1435,
          width: 810,
          height: 155,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          fontSize: 46,
          fontWeight: 600,
          lineHeight: 1.23,
          color: C.ink,
        }}
      >
        <KaraokeCaptions
          mode={video.captions?.mode}
          captions={voice.captions}
          words={voice.words || []}
          timeMs={seconds * 1000}
        />
      </div>
      <div
        style={{
          position: "absolute",
          left: 90,
          top: 1665,
          width: 810,
          color: C.muted,
          fontFamily: mono,
          fontSize: 20,
          letterSpacing: 1,
        }}
      >
        SOURCE: KUBERNETES.IO /{" "}
        {scene.id === "service" ? "SERVICE" : "DEPLOYMENTS + SELF-HEALING"}
      </div>
    </AbsoluteFill>
  );
};

export const KubernetesVideo = ({
  video,
  voiceManifest,
  assetRoot,
  audioTimeline,
}: VideoProps) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  return (
    <AbsoluteFill
      style={{
        backgroundColor: C.bg,
        color: C.ink,
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 12,
          height: "100%",
          backgroundColor: C.blue,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 90,
          top: 1605,
          height: 4,
          width: 810,
          backgroundColor: "#20384A",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${(frame / durationInFrames) * 100}%`,
            backgroundColor: C.blue,
          }}
        />
      </div>
      <BackgroundMusic video={video} assetRoot={assetRoot} />
      {video.audio !== null && audioTimeline && (
        <Audio src={staticFile(`${assetRoot}/${audioTimeline.audioFile}`)} />
      )}
      <Series>
        {video.scenes.map((scene, index) => {
          const voice = voiceManifest.scenes[index];
          if (!voice) return null;
          return (
            <Series.Sequence
              key={scene.id}
              durationInFrames={audioTimeline?.scenes[index]
                ? audioTimeline.scenes[index].voiceFrames + audioTimeline.scenes[index].pauseFrames
                : Math.ceil((voice.durationSec + 0.45) * fps)}
              premountFor={fps}
            >
              <Scene
                video={video}
                scene={scene}
                voice={voice}
                index={index}
                assetRoot={assetRoot}
                useCombinedVoice={Boolean(audioTimeline)}
              />
            </Series.Sequence>
          );
        })}
      </Series>
    </AbsoluteFill>
  );
};
