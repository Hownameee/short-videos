import { useMemo } from "react";
import { ThreeCanvas } from "@remotion/three";
import { PerspectiveCamera, Vector3 } from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import {
  AbsoluteFill,
  Audio,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { BackgroundMusic } from "./BackgroundMusic";
import { KaraokeCaptions } from "./KaraokeCaptions";
import type { VideoProps, VoiceScene } from "./video-types";

const mint = "#a8f1c5";
const amber = "#ffad68";
const blue = "#80bfff";
const ease = (t: number) => {
  const v = Math.max(0, Math.min(1, t));
  return v * v * (3 - 2 * v);
};
const cue = (voice: VoiceScene, word: string, last = false) => {
  const matches = voice.words?.filter(
    (w) => w.text.toLowerCase() === word.toLowerCase(),
  );
  const found = last ? matches?.[matches.length - 1] : matches?.[0];
  if (!found)
    throw new Error(`3D study: missing narration cue ${voice.id}/${word}`);
  return found.startMs / 1000;
};

const rounded = new RoundedBoxGeometry(1, 1, 1, 3, 0.08);
type V3 = [number, number, number];
const Block = ({
  position,
  scale,
  color,
  metal = 0.35,
  glow = 0,
}: {
  position: V3;
  scale: V3;
  color: string;
  metal?: number;
  glow?: number;
}) => (
  <mesh
    position={position}
    scale={scale}
    geometry={rounded}
    castShadow
    receiveShadow
    dispose={null}
  >
    <meshStandardMaterial
      color={color}
      metalness={metal}
      roughness={0.3}
      emissive={color}
      emissiveIntensity={glow}
    />
  </mesh>
);

const Pod = ({
  x,
  z,
  y,
  active,
  open,
  disappearing = 0,
  appearing = 1,
}: {
  x: number;
  z: number;
  y: number;
  active: boolean;
  open: number;
  disappearing?: number;
  appearing?: number;
}) => {
  const color = active ? mint : amber;
  return (
    <group
      position={[x, y, z]}
      rotation={[0, disappearing * 0.6, disappearing * 0.3]}
      scale={Math.max(0.001, (1 - disappearing) * appearing)}
    >
      <Block
        position={[0, 0.3, 0]}
        scale={[1.52, 0.28, 1.52]}
        color="#d6ded9"
        metal={0.6}
      />
      <Block
        position={[0, 0.96 + open * 0.3, 0]}
        scale={[0.92, 0.92, 0.92]}
        color={color}
        metal={0.15}
        glow={0.12}
      />
      {[-0.65, 0.65].map((dx) =>
        [-0.65, 0.65].map((dz) => (
          <Block
            key={`${dx}/${dz}`}
            position={[dx, 0.93, dz]}
            scale={[0.13, 1.12, 0.13]}
            color="#e2e5df"
            metal={0.7}
          />
        )),
      )}
      <Block
        position={[0, 1.57 + open, 0]}
        scale={[1.52, 0.23, 1.52]}
        color="#e2e5df"
        metal={0.6}
      />
      <Block
        position={[0, 1.7 + open, 0]}
        scale={[0.72, 0.035, 0.72]}
        color="#182a30"
      />
      {[-0.24, 0, 0.24].map((dx) => (
        <Block
          key={dx}
          position={[dx, 1.73 + open, 0]}
          scale={[0.07, 0.035, 0.44]}
          color={color}
          glow={0.5}
        />
      ))}
      <Block
        position={[0, 0.32, 0.77]}
        scale={[0.55, 0.07, 0.03]}
        color={color}
        glow={0.6}
      />
    </group>
  );
};

const positions: V3[] = [
  [-2.55, 0, 0],
  [0, 0, -0.65],
  [2.55, 0, 0],
];
const titles: Record<string, [string, string, string]> = {
  hook: ["ONE POD", "DISAPPEARS.", "Who brings your app back?"],
  declare: [
    "THREE COPIES.",
    "ONE INTENT.",
    "A container lives inside each Pod.",
  ],
  observe: [
    "DESIRED: 3",
    "ACTUAL: 2",
    "The ReplicaSet controller sees the gap.",
  ],
  replace: ["CREATE. PLACE.", "START.", "A new Pod identity. A new container."],
  service: [
    "PODS CHANGE.",
    "ADDRESS STAYS.",
    "Traffic reaches ready Pods only.",
  ],
  limits: [
    "SELF-HEALING.",
    "WITH LIMITS.",
    "Time. Capacity. Healthy application code.",
  ],
  takeaway: [
    "DECLARE IT.",
    "RECONCILE IT.",
    "The goal stays. The Pods can change.",
  ],
};

export const Kubernetes3DStudy = (props: VideoProps) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const timeline = props.audioTimeline;
  if (!timeline)
    throw new Error(
      "3D study requires the verified combined narration timeline.",
    );
  const index = Math.max(
    0,
    timeline.scenes.findIndex(
      (s) => frame >= s.startFrame && frame < s.endFrame,
    ),
  );
  const beat = timeline.scenes[index];
  const voice = props.voiceManifest.scenes[index];
  const id = beat.id;
  const t = (frame - beat.startFrame) / fps;
  const title = titles[id];
  if (!title || voice.id !== id)
    throw new Error(`Unsupported 3D study scene: ${id}`);
  const deletion =
    id === "hook"
      ? ease((t - cue(voice, "Delete")) / 0.8)
      : id === "observe"
        ? ease((t - cue(voice, "deleted")) / 0.9)
        : 0;
  const replacing = id === "replace";
  const created = replacing ? ease((t - cue(voice, "replacement")) / 0.7) : 1;
  const assigned = replacing ? ease((t - cue(voice, "node")) / 0.85) : 1;
  const started = replacing ? t >= cue(voice, "containers") : true;
  const service = id === "service";
  const joined = service ? t >= cue(voice, "ready", true) : true;
  const serviceShown = service && t >= cue(voice, "Service");
  const broken = id === "limits" && t >= cue(voice, "broken");
  const exploded =
    id === "declare" ? ease((t - cue(voice, "contains")) / 0.8) : 0;
  const missing = deletion > 0.8 || (replacing && created < 0.9);
  const running =
    missing || (replacing && !started) || (service && !joined) || broken
      ? 2
      : 3;
  const statusColor = running === 3 ? mint : amber;
  // Camera movement is sampled from the frame, and holds after the reveal.
  const travel = ease(t / 2);
  const camera = useMemo(() => {
    const c = new PerspectiveCamera(34, width / height, 0.1, 100);
    const close = id === "hook" ? 0.9 + travel * 0.1 : 1;
    c.position.set(
      (service ? 5.5 : 7.8) * close * 1.2,
      (service ? 12.5 : 9) * close * 1.2,
      18.8 * close * 1.2,
    );
    c.lookAt(0.4, 0.35, 0);
    c.updateMatrixWorld();
    return c;
  }, [id, service, travel, width, height]);
  const project = (p: V3) => {
    const v = new Vector3(...p).project(camera);
    return { left: (v.x + 1) * 540, top: (1 - v.y) * 960 };
  };
  const labels = [
    "POD A",
    "POD B",
    replacing || index > 3 ? "POD D · NEW" : "POD C",
  ];
  const process = replacing
    ? ["REPLICASET", "SCHEDULER", "KUBELET"]
    : service
      ? ["STABLE SERVICE", "READY ENDPOINTS"]
      : [];
  const activeStep = replacing
    ? started
      ? 2
      : assigned > 0.9
        ? 1
        : 0
    : joined
      ? 1
      : 0;
  const scale = width / 1080;
  return (
    <AbsoluteFill
      style={{
        background: "#0a1118",
        color: "#edf1e9",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <ThreeCanvas
        width={width}
        height={height}
        camera={camera}
        shadows
        gl={{ antialias: true }}
      >
        <color attach="background" args={["#0a1118"]} />
        <fog attach="fog" args={["#0a1118", 25, 55]} />
        <hemisphereLight args={["#b8d8ff", "#192b34", 1.3]} />
        <directionalLight
          position={[-4, 9, 7]}
          intensity={3.5}
          color="#fff0d5"
          castShadow
          shadow-mapSize={[1024, 1024]}
          shadow-camera-left={-9}
          shadow-camera-right={9}
          shadow-camera-top={9}
          shadow-camera-bottom={-9}
          shadow-bias={-0.001}
        />
        <directionalLight position={[5, 5, -5]} intensity={3} color="#79bfff" />
        <pointLight position={[-5, 3, -2]} intensity={35} color={mint} />
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -0.65, 0]}
          receiveShadow
        >
          <planeGeometry args={[200, 200]} />
          <meshStandardMaterial
            color="#0c1922"
            roughness={0.55}
            metalness={0.25}
          />
        </mesh>
        <Block
          position={[0, -0.37, 0]}
          scale={[8.3, 0.35, 5.6]}
          color="#203944"
          metal={0.65}
        />
        <Block
          position={[0, -0.17, 0]}
          scale={[8.05, 0.07, 5.35]}
          color="#3c5961"
          metal={0.65}
        />
        {positions.map(([x, , z], i) => {
          const third = i === 2;
          const active = !third || (started && joined && !broken);
          const gone = third && deletion > 0.99;
          return (
            <group key={i}>
              <Block
                position={[x, 0.03, z]}
                scale={[2.13, 0.3, 2.25]}
                color="#182d3c"
              />
              <Block
                position={[x, 0.2, z]}
                scale={[1.85, 0.035, 1.96]}
                color={third && (missing || !active) ? amber : blue}
                glow={0.2}
              />
              {!gone && (!third || created > 0) && (
                <Pod
                  x={x}
                  z={z}
                  y={
                    third
                      ? deletion * 2.8 + (replacing ? (1 - assigned) * 2.1 : 0)
                      : 0
                  }
                  active={active}
                  open={exploded}
                  disappearing={third ? deletion : 0}
                  appearing={third ? created : 1}
                />
              )}
              <Block
                position={[x, 0.05, z + 1.14]}
                scale={[0.8, 0.07, 0.04]}
                color={third && missing ? amber : blue}
                glow={0.25}
              />
            </group>
          );
        })}
        {serviceShown && (
          <group>
            <Block
              position={[0, 0.18, 2.1]}
              scale={[6.5, 0.2, 0.45]}
              color={blue}
              glow={0.25}
            />
            {positions.map(
              ([x, , z], i) =>
                (i !== 2 || joined) && (
                  <group key={i}>
                    <Block
                      position={[x, 0.21, (2 + z) / 2]}
                      scale={[0.055, 0.035, 2 - z]}
                      color={mint}
                      glow={0.8}
                    />
                    {[0, 0.5].map((offset) => (
                      <mesh
                        key={offset}
                        position={[
                          x,
                          0.3,
                          2 - ((t * 0.65 + offset) % 1) * (2 - z),
                        ]}
                      >
                        <sphereGeometry args={[0.075, 12, 12]} />
                        <meshBasicMaterial color={mint} />
                      </mesh>
                    ))}
                  </group>
                ),
            )}
          </group>
        )}
      </ThreeCanvas>
      <div
        style={{
          position: "absolute",
          width: 1080,
          height: 1920,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        <div style={{ position: "absolute", left: 90, right: 180, top: 162 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              color: mint,
              fontSize: 23,
              letterSpacing: 4,
              fontWeight: 700,
            }}
          >
            <span style={{ width: 28, height: 3, background: mint }} />{" "}
            KUBERNETES / {String(index + 1).padStart(2, "0")}
          </div>
          <div
            style={{
              marginTop: 34,
              fontSize: id === "service" ? 76 : 86,
              lineHeight: 1.02,
              letterSpacing: -4,
              fontWeight: 800,
            }}
          >
            {title[0]}
            <br />
            <span
              style={{
                color:
                  id === "hook" || id === "observe" || id === "limits"
                    ? amber
                    : mint,
              }}
            >
              {id === "observe" ? `ACTUAL: ${running}` : title[1]}
            </span>
          </div>
          <div
            style={{
              fontSize: 29,
              color: "#a9bcc5",
              marginTop: 24,
              lineHeight: 1.3,
            }}
          >
            {title[2]}
          </div>
          <div
            style={{
              display: "flex",
              gap: 28,
              marginTop: 34,
              fontSize: 24,
              fontFamily: "Menlo, monospace",
            }}
          >
            <span style={{ color: "#9baeb7" }}>
              TARGET <b style={{ color: "#edf1e9" }}>03</b>
            </span>
            <span style={{ color: statusColor }}>
              {id === "service"
                ? "READY"
                : id === "limits"
                  ? "HEALTHY"
                  : "RUNNING"}{" "}
              <b>0{running}</b>
            </span>
          </div>
        </div>
        {positions.map(([x, , z], i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              ...project([x, 0, z + 1.5]),
              transform: "translate(-50%, 0)",
              fontFamily: "Menlo, monospace",
              fontSize: 22,
              letterSpacing: 1,
              color: i === 2 ? statusColor : "#b4c8d2",
              background: "#0a1118cc",
              padding: "9px 12px",
              borderRadius: 6,
            }}
          >
            {i === 2 && missing ? "VACANT" : labels[i]}
          </div>
        ))}
        {exploded > 0.8 && (
          <div
            style={{
              position: "absolute",
              left: 90,
              top: 1185,
              fontSize: 25,
              color: mint,
            }}
          >
            CORE = APPLICATION CONTAINER
            <br />
            <span style={{ color: "#a9bcc5", fontSize: 22 }}>SHELL = POD</span>
          </div>
        )}
        {replacing && (
          <div
            style={{
              position: "absolute",
              left: 90,
              top: 1200,
              fontSize: 24,
              color: "#a9bcc5",
            }}
          >
            BASE = NODE · {assigned > 0.9 ? "ASSIGNED" : "AWAITING ASSIGNMENT"}
          </div>
        )}
        <div style={{ position: "absolute", left: 90, top: 1300, width: 670 }}>
          {process.length > 0 ? (
            <div style={{ display: "flex", gap: 12 }}>
              {process.map((step, i) => (
                <div
                  key={step}
                  style={{
                    borderTop: `3px solid ${i <= activeStep ? mint : "#34414b"}`,
                    paddingTop: 16,
                    flex: 1,
                    fontSize: 19,
                    fontWeight: 700,
                    color: i <= activeStep ? mint : "#82949c",
                  }}
                >
                  {step}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ height: 3, background: "#34414b", width: 670 }}>
              <div
                style={{
                  height: 3,
                  width: `${((index + 1) / 7) * 100}%`,
                  background: mint,
                }}
              />
            </div>
          )}
          {id === "limits" && (
            <div style={{ marginTop: 20, fontSize: 25, color: amber }}>
              Replacement ≠ application-code repair
            </div>
          )}
          {id === "takeaway" && (
            <div style={{ marginTop: 20, fontSize: 25, color: mint }}>
              TRY IT IN A TEST CLUSTER
            </div>
          )}
        </div>
        <div
          style={{
            position: "absolute",
            left: 82,
            top: 1430,
            width: 685,
            minHeight: 145,
            fontSize: 39,
            fontWeight: 600,
            lineHeight: 1.3,
          }}
        >
          <KaraokeCaptions
            captions={voice.captions}
            words={voice.words ?? []}
            timeMs={t * 1000}
            highlight={mint}
          />
        </div>
        <div
          style={{
            position: "absolute",
            left: 90,
            top: 1630,
            color: "#81969f",
            fontSize: 20,
          }}
        >
          SCHEMATIC · kubernetes.io/docs
        </div>
      </div>
      <Audio src={staticFile(`${props.assetRoot}/${timeline.audioFile}`)} />
      <BackgroundMusic video={props.video} assetRoot={props.assetRoot} />
    </AbsoluteFill>
  );
};
