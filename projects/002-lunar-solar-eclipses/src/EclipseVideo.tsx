import {
  AbsoluteFill,
  Audio,
  interpolate,
  interpolateColors,
  Series,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { KaraokeCaptions } from "./KaraokeCaptions";
import type { VideoProps, VideoScene, VoiceScene } from "./video-types";

const P = {
  bg: "#050813",
  text: "#F5F3EB",
  muted: "#A3ADC3",
  gold: "#FFCF7B",
  blue: "#99B7FF",
  red: "#DD7851",
};
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = (s: number, a: number, b: number) =>
  interpolate(s, [a, b], [0, 1], clamp);

const Planet = ({
  x,
  y,
  r,
  kind,
  red = 0,
  prefix,
}: {
  x: number;
  y: number;
  r: number;
  kind: "sun" | "earth" | "moon";
  red?: number;
  prefix: string;
}) => {
  const id = `${prefix}-${kind}-${x}-${r}`;
  return (
    <g transform={`translate(${x} ${y}) scale(${r / 100})`}>
      <defs>
        <radialGradient id={id} cx="30%" cy="27%" r="78%">
          <stop
            offset="0"
            stopColor={
              kind === "sun"
                ? "#FFF7CF"
                : kind === "earth"
                  ? "#75D6FF"
                  : interpolateColors(red, [0, 1], ["#E4E5E7", "#F4A56D"])
            }
          />
          <stop
            offset="0.56"
            stopColor={
              kind === "sun"
                ? "#FFC65B"
                : kind === "earth"
                  ? "#206FB7"
                  : interpolateColors(red, [0, 1], ["#9EABC2", "#A9462C"])
            }
          />
          <stop
            offset="1"
            stopColor={
              kind === "sun"
                ? "#E87932"
                : kind === "earth"
                  ? "#061428"
                  : interpolateColors(red, [0, 1], ["#3B4459", "#2A1115"])
            }
          />
        </radialGradient>
        <clipPath id={`${id}-clip`}>
          <circle r="100" />
        </clipPath>
      </defs>
      {kind === "sun" &&
        [1.08, 1.2, 1.4].map((k, i) => (
          <circle key={k} r={100 * k} fill={P.gold} opacity={0.1 - i * 0.025} />
        ))}
      {kind === "earth" && (
        <circle
          r="104"
          fill="none"
          stroke="#78C8FF"
          strokeWidth="3"
          opacity="0.6"
        />
      )}
      <circle r="100" fill={`url(#${id})`} />
      <g clipPath={`url(#${id}-clip)`}>
        {kind === "earth" ? (
          <>
            <path
              d="M -85 -45 L -48 -74 -15 -55 -9 -29 -37 -9 -20 18 -44 23 -66 -12 Z M -13 8 L 18 11 40 33 20 54 11 83 -9 56 -24 32 Z M 41 -78 L 89 -44 113 -5 77 9 59 -16 27 -26 18 -54 Z"
              fill="#65B7A6"
              opacity="0.75"
            />
            <path
              d="M -94 -20 Q -10 -58 61 -30 M -48 51 Q 10 28 94 43"
              fill="none"
              stroke="#E4F5FF"
              strokeWidth="9"
              opacity="0.4"
            />
          </>
        ) : kind === "moon" ? (
          <>
            {[
              [-38, -26, 23],
              [24, -48, 15],
              [37, 20, 27],
              [-18, 48, 12],
              [-68, 25, 14],
              [2, -4, 10],
            ].map(([cx, cy, cr], i) => (
              <g key={i}>
                <circle cx={cx} cy={cy} r={cr} fill="#1A1722" opacity="0.19" />
                <path
                  d={`M ${cx - cr * 0.7} ${cy} Q ${cx} ${cy - cr} ${cx + cr * 0.7} ${cy}`}
                  fill="none"
                  stroke="#FFF5DD"
                  strokeWidth="2"
                  opacity="0.22"
                />
              </g>
            ))}
          </>
        ) : null}
      </g>
    </g>
  );
};

const Label = ({
  x,
  y,
  text,
  color = P.muted,
  size = 28,
}: {
  x: number;
  y: number;
  text: string;
  color?: string;
  size?: number;
}) => (
  <text
    x={x}
    y={y}
    textAnchor="middle"
    fill={color}
    fontSize={size}
    fontFamily="Arial, sans-serif"
    letterSpacing="2"
  >
    {text}
  </text>
);

const Transit = ({
  seconds,
  x = 405,
  y = 350,
  r = 175,
  prefix,
  alignAt = 3,
}: {
  seconds: number;
  x?: number;
  y?: number;
  r?: number;
  prefix: string;
  alignAt?: number;
}) => {
  const move = interpolate(seconds, [0, alignAt], [r * 2.5, 0], clamp);
  const corona = interpolate(move, [0, 5], [1, 0], clamp);
  return (
    <g>
      <defs>
        <radialGradient id={`${prefix}-corona`}>
          <stop offset="0.55" stopColor="#FFFFFF" stopOpacity="0" />
          <stop offset="0.68" stopColor="#FFF1D0" stopOpacity="0.8" />
          <stop offset="1" stopColor="#B5C9FF" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g opacity={corona}>
        <circle cx={x} cy={y} r={r * 1.65} fill={`url(#${prefix}-corona)`} />
        {Array.from({ length: 24 }, (_, i) => {
          const a = (i * Math.PI) / 12;
          const reach = r * (1.18 + 0.18 * Math.sin(i * 4 + seconds * 0.5));
          return (
            <path
              key={i}
              d={`M ${x + Math.cos(a) * r} ${y + Math.sin(a) * r} Q ${x + Math.cos(a + 0.03) * reach} ${y + Math.sin(a + 0.03) * reach} ${x + Math.cos(a) * reach * 1.13} ${y + Math.sin(a) * reach * 1.13}`}
              stroke="#FFEFD0"
              strokeWidth={i % 3 === 0 ? 3 : 1.5}
              opacity="0.45"
              fill="none"
            />
          );
        })}
      </g>
      <g opacity={1 - corona}>
        <Planet x={x} y={y} r={r} kind="sun" prefix={prefix} />
      </g>
      <circle cx={x + move} cy={y} r={r + 4} fill={P.bg} />
      <circle
        cx={x}
        cy={y}
        r={r + 5}
        fill="none"
        stroke="#F6E7CE"
        strokeWidth="2"
        opacity={corona * 0.8}
      />
    </g>
  );
};

const Alignment = ({
  lunar,
  seconds,
  duration,
  prefix,
}: {
  lunar: boolean;
  seconds: number;
  duration: number;
  prefix: string;
}) => {
  const inPlace = ease(seconds, 0.5, duration * 0.64);
  const moonY = interpolate(inPlace, [0, 1], [155, 390]);
  const shadow = ease(seconds, duration * 0.4, duration * 0.75);
  const moonX = lunar ? 708 : 463;
  const shadowY = 390 + ((moonY - 390) * (795 - 100)) / (463 - 100);
  return (
    <svg width="810" height="830" viewBox="0 0 810 830">
      <Label
        x={405}
        y={50}
        text={lunar ? "SUN → EARTH → MOON" : "SUN → MOON → EARTH"}
        color={lunar ? P.blue : P.gold}
        size={32}
      />
      <path
        d="M 95 390 H 780"
        stroke="#8B93AC"
        strokeWidth="2"
        strokeDasharray="8 13"
        opacity="0.3"
      />
      {[310, 390, 470].map((y, i) => (
        <g key={y} opacity="0.5">
          <path
            d={`M 185 ${y} H 790`}
            stroke={P.gold}
            strokeWidth="1"
            strokeDasharray="18 65"
            strokeDashoffset={-seconds * 85 - i * 13}
          />
        </g>
      ))}
      <Planet x={100} y={390} r={92} kind="sun" prefix={prefix} />
      {lunar ? (
        <>
          <path
            d="M 405 296 L 820 258 L 820 522 L 405 484 Z"
            fill="#546182"
            opacity={0.22 * shadow}
          />
          <path
            d="M 405 312 L 830 335 L 830 445 L 405 468 Z"
            fill="#02030A"
            opacity={0.96 * shadow}
          />
          <Planet x={405} y={390} r={78} kind="earth" prefix={prefix} />
          <Planet
            x={moonX}
            y={moonY}
            r={37}
            kind="moon"
            red={ease(inPlace, 0.65, 1)}
            prefix={prefix}
          />
        </>
      ) : (
        <>
          <Planet x={720} y={390} r={73} kind="earth" prefix={prefix} />
          <path
            d={`M 463 ${moonY - 45} L 795 ${shadowY} L 463 ${moonY + 45} Z`}
            fill="#02030A"
            opacity={0.93 * shadow}
          />
          <path
            d={`M 463 ${moonY - 45} L 790 ${shadowY - 99} L 790 ${shadowY + 99} L 463 ${moonY + 45} Z`}
            fill="#293045"
            opacity={0.23 * shadow}
          />
          <Planet x={moonX} y={moonY} r={45} kind="moon" prefix={prefix} />
          <ellipse
            cx={653}
            cy={390}
            rx={8}
            ry={20}
            fill="#02030A"
            opacity={ease(inPlace, 0.95, 1)}
          />
        </>
      )}
      <Label x={100} y={550} text="SUN" color={P.gold} />
      <Label
        x={lunar ? 405 : 463}
        y={550}
        text={lunar ? "EARTH" : "MOON"}
        color={lunar ? P.blue : P.muted}
      />
      <Label
        x={lunar ? 708 : 720}
        y={550}
        text={lunar ? "MOON" : "EARTH"}
        color={lunar ? P.muted : P.blue}
      />
      <g opacity={shadow}>
        <path
          d={lunar ? "M 578 390 L 578 615 H 650" : "M 592 391 L 592 615 H 650"}
          fill="none"
          stroke={lunar ? P.blue : P.gold}
          strokeWidth="2"
        />
        <Label
          x={405}
          y={690}
          text={lunar ? "EARTH'S SHADOW" : "MOON'S SHADOW"}
          color={lunar ? P.blue : P.gold}
          size={40}
        />
      </g>
      <Label
        x={405}
        y={782}
        text="SIZES, DISTANCES & TIMING NOT TO SCALE"
        size={19}
      />
    </svg>
  );
};

const RedMoon = ({
  seconds,
  duration,
  prefix,
}: {
  seconds: number;
  duration: number;
  prefix: string;
}) => {
  const bend = ease(seconds, 0.6, duration * 0.55);
  const redden = ease(seconds, duration * 0.32, duration * 0.85);
  return (
    <svg width="810" height="830" viewBox="0 0 810 830">
      <Label
        x={405}
        y={45}
        text="TOTAL LUNAR ECLIPSE"
        color={P.red}
        size={30}
      />
      <path d="M 210 300 L 780 330 L 780 530 L 210 560 Z" fill="#010209" />
      <circle
        cx={210}
        cy={430}
        r={96}
        fill="none"
        stroke="#78B5FF"
        strokeWidth="8"
        opacity="0.45"
      />
      {[-1, 1].map((sign) => (
        <g key={sign} opacity={bend}>
          <path
            d={`M 0 ${430 + sign * 125} L 130 ${430 + sign * 112} Q 245 ${430 + sign * 98} 330 ${430 + sign * 66} L 632 430`}
            fill="none"
            stroke={P.red}
            strokeWidth="4"
            pathLength="1"
            strokeDasharray="1"
            strokeDashoffset={1 - bend}
          />
          <path
            d={`M 0 ${430 + sign * 125} L 130 ${430 + sign * 112} Q 245 ${430 + sign * 98} 330 ${430 + sign * 66} L 632 430`}
            fill="none"
            stroke="#FFDFAC"
            strokeWidth="6"
            strokeDasharray="8 105"
            strokeDashoffset={-seconds * 85}
          />
          <path
            d={`M 145 ${430 + sign * 111} Q 190 ${430 + sign * 185} 265 ${430 + sign * 210}`}
            fill="none"
            stroke={P.blue}
            strokeWidth="2"
            strokeDasharray="5 10"
            opacity="0.6"
          />
        </g>
      ))}
      <Planet x={210} y={430} r={82} kind="earth" prefix={prefix} />
      <Planet
        x={633}
        y={430}
        r={130}
        kind="moon"
        red={redden}
        prefix={prefix}
      />
      <Label x={210} y={590} text="EARTH" color={P.blue} />
      <Label x={633} y={620} text="COPPER MOON" color={P.red} size={29} />
      <Label
        x={405}
        y={730}
        text="FILTERED LIGHT. A RED GLOW."
        color={P.red}
        size={31}
      />
      <Label x={405} y={792} text="SCHEMATIC · NOT TO SCALE" size={19} />
    </svg>
  );
};

const Tilt = ({
  seconds,
  duration,
  prefix,
}: {
  seconds: number;
  duration: number;
  prefix: string;
}) => {
  const angle = interpolate(seconds, [0, duration], [-1.1, 0.13], clamp);
  const dx = 305 * Math.cos(angle),
    dy = 95 * Math.sin(angle),
    a = (-18 * Math.PI) / 180;
  const x = 405 + dx * Math.cos(a) - dy * Math.sin(a),
    y = 395 + dx * Math.sin(a) + dy * Math.cos(a);
  return (
    <svg width="810" height="830" viewBox="0 0 810 830">
      <Label
        x={405}
        y={60}
        text="ALIGNMENT IS EVERYTHING"
        color={P.blue}
        size={28}
      />
      <path d="M 475 349 L 810 364 L 810 426 L 475 441 Z" fill="#181F35" />
      <path
        d="M 30 395 H 800"
        stroke="#66718A"
        strokeWidth="2"
        strokeDasharray="10 12"
      />
      <ellipse
        cx="405"
        cy="395"
        rx="305"
        ry="95"
        transform="rotate(-18 405 395)"
        fill="none"
        stroke={P.blue}
        strokeWidth="3"
        strokeDasharray="7 9"
        strokeDashoffset={-seconds * 20}
      />
      <Planet x={405} y={395} r={71} kind="earth" prefix={prefix} />
      <Planet x={x} y={y} r={29} kind="moon" prefix={prefix} />
      <path
        d="M 520 394 A 115 115 0 0 0 514 360"
        fill="none"
        stroke={P.gold}
        strokeWidth="3"
      />
      <Label x={585} y={350} text="~5°" color={P.gold} size={51} />
      <Label
        x={405}
        y={580}
        text="THE SHADOWS USUALLY MISS"
        color={P.blue}
        size={35}
      />
      <Label x={405} y={655} text="Moon's orbital plane is tilted" size={29} />
      <Label
        x={405}
        y={700}
        text="relative to Earth's orbital plane."
        size={29}
      />
      <Label x={405} y={792} text="TILT EXAGGERATED · NOT TO SCALE" size={19} />
    </svg>
  );
};

const Recap = ({ seconds, prefix }: { seconds: number; prefix: string }) => (
  <svg width="810" height="830" viewBox="0 0 810 830">
    {[false, true].map((lunar, i) => {
      const y = 170 + i * 280;
      const reveal = ease(seconds, i * 2, i * 2 + 0.8);
      return (
        <g
          key={i}
          opacity={reveal}
          transform={`translate(${(1 - reveal) * 60} 0)`}
        >
          <Label
            x={405}
            y={y - 80}
            text={lunar ? "LUNAR" : "SOLAR"}
            color={lunar ? P.blue : P.gold}
            size={36}
          />
          <Planet x={112} y={y} r={42} kind="sun" prefix={`${prefix}-${i}`} />
          <Planet
            x={375}
            y={y}
            r={lunar ? 40 : 23}
            kind={lunar ? "earth" : "moon"}
            prefix={`${prefix}-${i}`}
          />
          <path
            d={`M 425 ${y} H 660`}
            stroke={lunar ? P.blue : P.gold}
            strokeWidth="3"
            strokeDasharray="13 17"
            strokeDashoffset={-seconds * 65}
          />
          <Planet
            x={697}
            y={y}
            r={lunar ? 27 : 44}
            kind={lunar ? "moon" : "earth"}
            red={lunar ? 1 : 0}
            prefix={`${prefix}-${i}`}
          />
          <Label
            x={405}
            y={y + 97}
            text={
              lunar ? "Earth's shadow on the Moon" : "Moon's shadow on Earth"
            }
            size={32}
          />
        </g>
      );
    })}
    <g opacity={ease(seconds, 4.7, 5.3)}>
      <path d="M 35 615 H 775" stroke="#394059" />
      <Label
        x={405}
        y={685}
        text="SOLAR VIEWING: ECLIPSE GLASSES"
        color={P.gold}
        size={28}
      />
      <Label
        x={405}
        y={732}
        text="ISO 12312-2 · Never ordinary sunglasses"
        size={25}
      />
      <Label x={405} y={792} text="SCHEMATIC · NOT TO SCALE" size={19} />
    </g>
  </svg>
);

const Scene = ({
  scene,
  voice,
  index,
}: {
  scene: VideoScene;
  voice: VoiceScene;
  index: number;
}) => {
  const frame = useCurrentFrame(),
    { fps } = useVideoConfig(),
    seconds = frame / fps;
  const entrance = spring({
    frame,
    fps,
    config: { damping: 22, stiffness: 95 },
  });
  const prefix = `eclipse-${scene.id}`;
  const color = ["lunar", "tilt"].includes(scene.id)
    ? P.blue
    : scene.id === "red"
      ? P.red
      : P.gold;
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: 90,
          top: 160,
          width: 810,
          display: "flex",
          justifyContent: "space-between",
          color: P.muted,
          fontSize: 23,
          letterSpacing: 4,
        }}
      >
        <span>SHADOWS IN SPACE</span>
        <span>{String(index + 1).padStart(2, "0")} / 07</span>
      </div>
      <div
        style={{
          position: "absolute",
          left: 90,
          top: 260,
          width: 815,
          translate: `0px ${(1 - entrance) * 55}px`,
          opacity: 0.4 + entrance * 0.6,
        }}
      >
        <div
          style={{
            fontSize: scene.id === "hook" ? 78 : scene.id === "recap" ? 75 : 76,
            fontWeight: 750,
            lineHeight: 1.08,
            letterSpacing: -2,
          }}
        >
          {scene.onScreenText[0]}
        </div>
        <div
          style={{
            fontSize: scene.id === "hook" ? 61 : scene.id === "recap" ? 51 : 49,
            color,
            marginTop: 22,
            lineHeight: 1.13,
            fontWeight: 500,
          }}
        >
          {scene.onScreenText[1]}
        </div>
        <div
          style={{
            marginTop: 35,
            height: 3,
            width: interpolate(frame, [0, 36], [0, 145], clamp),
            backgroundColor: color,
          }}
        />
      </div>
      <div
        style={{
          position: "absolute",
          left: 90,
          top: 555,
          width: 810,
          translate: `0px ${(1 - entrance) * 55}px`,
        }}
      >
        {scene.id === "hook" ? (
          <svg width="810" height="830" viewBox="0 0 810 830">
            <Label x={125} y={35} text="SOLAR" color={P.gold} />
            <Transit
              seconds={seconds}
              x={405}
              y={220}
              r={130}
              prefix={prefix}
              alignAt={2.4}
            />
            <path d="M 55 429 H 755" stroke="#2B324A" />
            <Label x={125} y={490} text="LUNAR" color={P.blue} />
            <Planet
              x={405}
              y={656}
              r={130}
              kind="moon"
              red={ease(seconds, 1, 3.5)}
              prefix={prefix}
            />
          </svg>
        ) : scene.id === "solar" || scene.id === "lunar" ? (
          <Alignment
            lunar={scene.id === "lunar"}
            seconds={seconds}
            duration={voice.durationSec}
            prefix={prefix}
          />
        ) : scene.id === "totality" ? (
          <svg width="810" height="830" viewBox="0 0 810 830">
            <Label x={405} y={50} text="THE VIEW FROM EARTH" color={P.gold} />
            <Transit seconds={seconds} prefix={prefix} alignAt={3.4} />
            <g opacity={ease(seconds, 3.3, 4.2)}>
              <path
                d="M 523 194 L 641 114 H 748"
                fill="none"
                stroke={P.gold}
                strokeWidth="2"
              />
              <Label x={681} y={95} text="CORONA" color={P.gold} size={27} />
              <Label
                x={405}
                y={668}
                text="TOTAL SOLAR ECLIPSE"
                color={P.gold}
                size={34}
              />
            </g>
            <Label
              x={405}
              y={782}
              text="ILLUSTRATION · NOT A LIVE VIEW"
              size={19}
            />
          </svg>
        ) : scene.id === "red" ? (
          <RedMoon
            seconds={seconds}
            duration={voice.durationSec}
            prefix={prefix}
          />
        ) : scene.id === "tilt" ? (
          <Tilt
            seconds={seconds}
            duration={voice.durationSec}
            prefix={prefix}
          />
        ) : (
          <Recap seconds={seconds} prefix={prefix} />
        )}
      </div>
      <div
        style={{
          position: "absolute",
          left: 80,
          top: 1460,
          width: 830,
          height: 155,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          fontSize: 45,
          lineHeight: 1.18,
          fontWeight: 650,
        }}
      >
        <KaraokeCaptions
          captions={voice.captions}
          words={voice.words || []}
          timeMs={seconds * 1000}
          highlight={color}
          activeTextColor={P.bg}
          textColor={P.text}
          pendingColor="#BCC4D5"
        />
      </div>
      <div
        style={{
          position: "absolute",
          left: 90,
          top: 1700,
          fontSize: 19,
          letterSpacing: 2,
          color: P.muted,
        }}
      >
        SCIENCE: NASA · ORIGINAL ANIMATION
      </div>
    </AbsoluteFill>
  );
};

export const EclipseVideo = ({
  video,
  voiceManifest,
  assetRoot,
}: VideoProps) => {
  const frame = useCurrentFrame(),
    { fps, durationInFrames } = useVideoConfig();
  return (
    <AbsoluteFill
      style={{
        backgroundColor: P.bg,
        color: P.text,
        fontFamily: "Arial, sans-serif",
        backgroundImage:
          "radial-gradient(ellipse at 50% 45%, #17223E 0%, #080D1D 44%, #050813 77%)",
      }}
    >
      <svg
        width="1080"
        height="1920"
        style={{ position: "absolute", inset: 0 }}
      >
        {Array.from({ length: 72 }, (_, i) => (
          <circle
            key={i}
            cx={(i * 173 + 49) % 1080}
            cy={(i * 317 + 81) % 1920}
            r={i % 7 === 0 ? 1.8 : 0.85}
            fill="#D4E0FF"
            opacity={0.1 + ((i * 19) % 10) * 0.028}
          />
        ))}
      </svg>
      {video.audio?.music && (
        <Audio
          src={staticFile(`${assetRoot}/${video.audio.music.file}`)}
          volume={video.audio.music.volume}
        />
      )}
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
              <Audio src={staticFile(`${assetRoot}/voice/${voice.file}`)} />
              <Scene scene={scene} voice={voice} index={index} />
            </Series.Sequence>
          );
        })}
      </Series>
      <div
        style={{
          position: "absolute",
          left: 90,
          top: 1650,
          width: 810,
          height: 3,
          background: "#232B40",
        }}
      >
        <div
          style={{
            width: `${(frame / durationInFrames) * 100}%`,
            height: "100%",
            background: P.gold,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
