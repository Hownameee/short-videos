import type { ReactNode } from "react";
import {
  AbsoluteFill,
  Audio,
  interpolate,
  Series,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { BackgroundMusic } from "./BackgroundMusic";
import { KaraokeCaptions } from "./KaraokeCaptions";
import type { VideoProps, VideoScene, VoiceScene } from "./video-types";

const C = {
  paper: "#F4F0E7",
  ink: "#182C2B",
  teal: "#007C70",
  pale: "#D5E9DD",
  orange: "#C65D35",
  lightOrange: "#EED7C7",
  muted: "#64736C",
  line: "#C8CABE",
};
const ramp = (t: number, from: number, to: number) =>
  interpolate(t, [from, to], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
const dollars = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
const Text = ({
  x = 90,
  y,
  size = 40,
  color = C.ink,
  children,
  serif = false,
  anchor = "start",
  weight = 600,
}: {
  x?: number;
  y: number;
  size?: number;
  color?: string;
  children: ReactNode;
  serif?: boolean;
  anchor?: "start" | "middle" | "end";
  weight?: number;
}) => (
  <text
    x={x}
    y={y}
    fill={color}
    fontSize={size}
    fontFamily={serif ? "Georgia, serif" : "Arial, sans-serif"}
    fontWeight={weight}
    textAnchor={anchor}
  >
    {children}
  </text>
);

const Basket = ({
  x,
  y,
  scale = 1,
  color = C.teal,
}: {
  x: number;
  y: number;
  scale?: number;
  color?: string;
}) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <rect
      x="70"
      y="-65"
      width="68"
      height="110"
      rx="12"
      fill={C.lightOrange}
      stroke={color}
      strokeWidth="5"
      transform="rotate(-12 104 0)"
    />
    <path
      d="M170 42 L174 -92 L224 -92 L238 42 Z"
      fill={C.pale}
      stroke={color}
      strokeWidth="5"
    />
    <path
      d="M174 -92 L189 -116 L216 -116 L224 -92"
      fill="none"
      stroke={color}
      strokeWidth="5"
    />
    <circle cx="274" cy="-6" r="37" fill={C.orange} />
    <path
      d="M274 -42 Q280 -64 299 -61"
      fill="none"
      stroke={color}
      strokeWidth="7"
    />
    <path
      d="M30 20 L350 20 L316 170 L67 170 Z"
      fill={C.paper}
      stroke={color}
      strokeWidth="9"
      strokeLinejoin="round"
    />
    <path
      d="M100 25 L142 -50 M280 25 L238 -50"
      fill="none"
      stroke={color}
      strokeWidth="10"
      strokeLinecap="round"
    />
    {[105, 163, 220, 278].map((a) => (
      <path
        key={a}
        d={`M${a} 65 L${a} 130`}
        stroke={color}
        strokeWidth="8"
        strokeLinecap="round"
      />
    ))}
  </g>
);

const Hook = ({ t }: { t: number }) => {
  const up = ramp(t, 0.3, 1.2);
  const down = ramp(t, 1.7, 2.6);
  return (
    <>
      <Text y={345} size={110} serif>
        A raise.
      </Text>
      <Text y={460} size={90} serif>
        Less buying
      </Text>
      <Text y={565} size={90} serif>
        power?
      </Text>
      <line
        x1="90"
        y1="1110"
        x2="900"
        y2="1110"
        stroke={C.line}
        strokeWidth="3"
      />
      <rect
        x="160"
        y={1050 - 270 * up}
        width="255"
        height={60 + 270 * up}
        rx="6"
        fill={C.teal}
      />
      <path
        d={`M240 ${1010 - 270 * up} L288 ${950 - 270 * up} L336 ${1010 - 270 * up}`}
        fill="none"
        stroke={C.teal}
        strokeWidth="12"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect
        x="565"
        y={780 + 180 * down}
        width="255"
        height={330 - 180 * down}
        rx="6"
        fill={C.orange}
      />
      <path
        d={`M642 ${695 + 180 * down} L690 ${755 + 180 * down} L738 ${695 + 180 * down}`}
        fill="none"
        stroke={C.orange}
        strokeWidth="12"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={down}
      />
      <Text x={288} y={1170} size={36} anchor="middle" color={C.teal}>
        PAYCHECK
      </Text>
      <Text x={692} y={1170} size={32} anchor="middle" color={C.orange}>
        BUYING POWER
      </Text>
    </>
  );
};

const Nominal = ({ t }: { t: number }) => {
  const rise = ramp(t, 6.7, 7.8);
  return (
    <>
      <Text y={325} size={82} serif>
        Nominal income
      </Text>
      <Text y={395} size={40} color={C.muted}>
        The money you earn.
      </Text>
      <g transform={`translate(0 ${20 * (1 - ramp(t, 0, 0.5))})`}>
        <path
          d="M120 510 H870 V1100 L840 1080 L810 1100 L780 1080 L750 1100 L720 1080 L690 1100 L660 1080 L630 1100 L600 1080 L570 1100 L540 1080 L510 1100 L480 1080 L450 1100 L420 1080 L390 1100 L360 1080 L330 1100 L300 1080 L270 1100 L240 1080 L210 1100 L180 1080 L150 1100 L120 1080 Z"
          fill="#FFFCF5"
          stroke={C.line}
          strokeWidth="2"
        />
        <Text x={170} y={590} size={28} color={C.muted}>
          MONTHLY PAY / HYPOTHETICAL EXAMPLE
        </Text>
        <line
          x1="170"
          y1="635"
          x2="820"
          y2="635"
          stroke={C.line}
          strokeWidth="2"
        />
        <Text x={170} y={709} size={33} color={C.muted}>
          Last year
        </Text>
        <Text x={820} y={709} size={48} anchor="end">
          $3,000
        </Text>
        <Text x={170} y={797} size={33} color={C.teal}>
          This year
        </Text>
        <Text x={165} y={951} size={142} color={C.teal}>
          {dollars(3000 + 150 * rise)}
        </Text>
        <Text x={170} y={1031} size={42} color={C.teal}>
          {t > 8.6 ? "+5% nominal income" : "per month"}
        </Text>
      </g>
      <Text y={1208} size={35} color={C.muted}>
        A bigger number on your pay slip.
      </Text>
    </>
  );
};

const Prices = ({ t }: { t: number }) => {
  const rise = ramp(t, 6, 7.5);
  return (
    <>
      <Text y={325} size={88} serif>
        Same basket.
      </Text>
      <Text y={427} size={88} serif>
        Higher prices.
      </Text>
      <Basket x={232} y={620} scale={1.4} color={C.orange} />
      <Text x={495} y={995} size={114} anchor="middle" color={C.orange}>
        {dollars(100 + 8 * rise)}
      </Text>
      <Text x={495} y={1060} size={35} anchor="middle" color={C.muted}>
        {rise > 0 ? "This year" : "Last year"}
      </Text>
      <g opacity={ramp(t, 2.3, 2.8)}>
        <line
          x1="155"
          y1="1120"
          x2="835"
          y2="1120"
          stroke={C.line}
          strokeWidth="2"
        />
        <Text x={495} y={1195} size={49} anchor="middle" color={C.orange}>
          Prices +8% over the same year
        </Text>
      </g>
    </>
  );
};

const Real = ({ t }: { t: number }) => {
  const divide = ramp(t, 5.2, 6.5);
  const result = ramp(t, 7.5, 8.6);
  return (
    <>
      <Text y={325} size={90} serif>
        Real income
      </Text>
      <Text y={400} size={40} color={C.muted}>
        Your pay, adjusted for prices.
      </Text>
      <Text x={495} y={560} size={31} anchor="middle" color={C.teal}>
        THIS YEAR’S MONTHLY PAY
      </Text>
      <Text x={495} y={685} size={114} anchor="middle" color={C.teal}>
        $3,150
      </Text>
      <line
        x1={495 - 295 * divide}
        y1="730"
        x2={495 + 295 * divide}
        y2="730"
        stroke={C.ink}
        strokeWidth="5"
      />
      <g opacity={divide}>
        <Text x={495} y={830} size={82} anchor="middle">
          1.08
        </Text>
        <Text x={495} y={895} size={30} anchor="middle" color={C.muted}>
          PRICE FACTOR: 1 + 8%
        </Text>
      </g>
      <g opacity={result} transform={`translate(0 ${30 * (1 - result)})`}>
        <Text x={495} y={1060} size={118} anchor="middle" color={C.orange}>
          ≈ $2,917
        </Text>
        <Text x={495} y={1128} size={36} anchor="middle">
          in last year’s dollars
        </Text>
        <Text x={495} y={1205} size={31} anchor="middle" color={C.muted}>
          Compare with $3,000 last year.
        </Text>
      </g>
    </>
  );
};

const Reveal = ({ t }: { t: number }) => {
  const nominal = ramp(t, 1.3, 2.1);
  const real = ramp(t, 3.7, 5);
  const baseY = 1120;
  const unit = 4.6;
  return (
    <>
      <Text y={325} size={83} serif>
        More dollars.
      </Text>
      <Text y={425} size={78} serif>
        Less buying power.
      </Text>
      <Text y={500} size={30} color={C.muted}>
        Same period · Last year = 100
      </Text>
      <line
        x1="90"
        y1={baseY - 100 * unit}
        x2="900"
        y2={baseY - 100 * unit}
        stroke={C.muted}
        strokeWidth="3"
        strokeDasharray="10 12"
      />
      <rect
        x="175"
        y={baseY - (100 + 5 * nominal) * unit}
        width="240"
        height={(100 + 5 * nominal) * unit}
        fill={C.teal}
      />
      <rect
        x="580"
        y={baseY - (100 - (100 - (100 * 1.05) / 1.08) * real) * unit}
        width="240"
        height={(100 - (100 - (100 * 1.05) / 1.08) * real) * unit}
        fill={C.orange}
      />
      <Text x={295} y={615} size={67} anchor="middle" color={C.teal}>
        +{(5 * nominal).toFixed(0)}%
      </Text>
      <Text x={700} y={615} size={67} anchor="middle" color={C.orange}>
        {real > 0 ? "−" : ""}
        {(2.7777778 * real).toFixed(1)}%
      </Text>
      <Text x={295} y={905} size={66} anchor="middle" color="#FFFFFF">
        {(100 + 5 * nominal).toFixed(0)}
      </Text>
      <Text x={700} y={905} size={66} anchor="middle" color="#FFFFFF">
        {(100 - 2.7777778 * real).toFixed(1)}
      </Text>
      <Text x={295} y={1180} size={36} anchor="middle" color={C.teal}>
        NOMINAL
      </Text>
      <Text x={700} y={1180} size={36} anchor="middle" color={C.orange}>
        REAL
      </Text>
      <Text x={495} y={1250} size={29} anchor="middle" color={C.muted}>
        Exact change: (1.05 ÷ 1.08 − 1) × 100
      </Text>
    </>
  );
};

const Takeaway = ({ t }: { t: number }) => {
  const exchange = ramp(t, 1.9, 2.9);
  const cta = ramp(t, 4.7, 5.5);
  return (
    <>
      <Text y={320} size={32} color={C.teal}>
        NOMINAL
      </Text>
      <Text y={415} size={83} serif>
        What you earn.
      </Text>
      <Text y={565} size={32} color={C.orange}>
        REAL
      </Text>
      <Text y={660} size={83} serif>
        What it buys.
      </Text>
      {[0, 1, 2].map((i) => (
        <g
          key={i}
          opacity={1 - exchange}
          transform={`translate(${210 + i * 60 + 260 * exchange} ${815 - 60 * Math.sin(exchange * Math.PI)})`}
        >
          <circle r="53" fill={C.pale} stroke={C.teal} strokeWidth="4" />
          <Text x={0} y={20} size={58} anchor="middle" color={C.teal}>
            $
          </Text>
        </g>
      ))}
      <path
        d="M390 815 H480 M455 793 L481 815 L455 837"
        stroke={C.muted}
        strokeWidth="5"
        fill="none"
        opacity={1 - exchange}
      />
      <g opacity={0.25 + 0.75 * exchange}>
        <Basket x={520 - exchange * 80} y={795} scale={0.8 + 0.2 * exchange} />
      </g>
      <g opacity={cta}>
        <line
          x1="90"
          y1="1060"
          x2="900"
          y2="1060"
          stroke={C.line}
          strokeWidth="3"
        />
        <Text y={1130} size={48} color={C.teal}>
          Compare your raise with inflation.
        </Text>
        <Text y={1200} size={37} color={C.muted}>
          Always use the same time period.
        </Text>
      </g>
    </>
  );
};

const visuals: Record<string, (props: { t: number }) => ReactNode> = {
  hook: Hook,
  nominal: Nominal,
  prices: Prices,
  real: Real,
  reveal: Reveal,
  takeaway: Takeaway,
};

const IncomeScene = ({
  scene,
  voice,
  assetRoot,
  video,
  index,
}: {
  scene: VideoScene;
  voice: VoiceScene;
  assetRoot: string;
  video: VideoProps["video"];
  index: number;
}) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const Visual = visuals[scene.id];
  if (!Visual) throw new Error(`Unsupported income scene: ${scene.id}`);
  return (
    <AbsoluteFill
      style={{
        width: 1080,
        height: 1920,
        transform: `scale(${width / 1080})`,
        transformOrigin: "top left",
      }}
    >
      <Audio src={staticFile(`${assetRoot}/voice/${voice.file}`)} />
      <svg viewBox="0 0 1080 1920" width="1080" height="1920">
        <Text y={175} size={26} color={C.muted}>
          MONEY, EXPLAINED
        </Text>
        <Text x={900} y={175} size={26} color={C.muted} anchor="end">
          0{index + 1} / 06
        </Text>
        <line
          x1="90"
          y1="209"
          x2="900"
          y2="209"
          stroke={C.line}
          strokeWidth="2"
        />
        <Visual t={frame / fps} />
        <Text y={1570} size={23} color={C.muted}>
          {index === 0 || index === 5
            ? "NOMINAL VS REAL INCOME  /  SOURCES: BLS · ST. LOUIS FED"
            : "ILLUSTRATIVE EXAMPLE  /  NOT CURRENT INFLATION DATA"}
        </Text>
      </svg>
      <div
        style={{
          position: "absolute",
          left: 90,
          top: 1330,
          width: 810,
          minHeight: 143,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          fontSize: 44,
          lineHeight: 1.24,
          fontWeight: 700,
        }}
      >
        <KaraokeCaptions
          captions={voice.captions}
          words={voice.words ?? []}
          timeMs={(frame / fps) * 1000}
          highlight={C.teal}
          activeTextColor="#FFFFFF"
          textColor={C.ink}
          pendingColor={C.muted}
          mode={video.captions?.mode ?? "word-highlight"}
        />
      </div>
    </AbsoluteFill>
  );
};

export const IncomeVideo = ({
  video,
  voiceManifest,
  assetRoot,
}: VideoProps) => {
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
          if (!voice) throw new Error(`Missing voice for ${scene.id}`);
          return (
            <Series.Sequence
              key={scene.id}
              name={scene.id}
              durationInFrames={Math.ceil((voice.durationSec + 0.45) * fps)}
              premountFor={fps}
            >
              <IncomeScene
                scene={scene}
                voice={voice}
                assetRoot={assetRoot}
                video={video}
                index={index}
              />
            </Series.Sequence>
          );
        })}
      </Series>
    </AbsoluteFill>
  );
};
