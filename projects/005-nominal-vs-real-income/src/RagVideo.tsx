import {
  AbsoluteFill,
  Audio,
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
  bg: "#06090F",
  panel: "#0D1B2A",
  panelBorder: "#1B2D45",
  text: "#F0F4F8",
  muted: "#8DA2B5",
  purple: "#7C3AED",
  purpleGlow: "#A855F7",
  green: "#06D6A0",
  greenDark: "#059669",
  amber: "#FFB703",
  red: "#EF4444",
  blue: "#3B82F6",
  cyan: "#22D3EE",
};

const mono = "JetBrains Mono, Menlo, monospace";

// ─── Scene 1: Hook — Shattering verified badge ──────────────────────────
const HookScene = ({ seconds }: { seconds: number }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const intro = spring({ frame, fps, config: { damping: 14, stiffness: 100 } });
  const shatterStart = 3.5;
  const shattered = seconds > shatterStart;
  const shatterProgress = shattered
    ? Math.min(1, (seconds - shatterStart) / 0.8)
    : 0;
  const pulse = (Math.sin(seconds * 3) + 1) / 2;

  return (
    <g transform={`translate(0 ${(1 - intro) * 50})`} opacity={intro}>
      {/* AI Response Card */}
      <rect x="115" y="320" width="850" height="520" rx="24" fill={C.panel}
        stroke={shattered ? C.red : C.panelBorder} strokeWidth="2" />

      {/* Response header */}
      <g transform="translate(155 365)">
        <circle cx="18" cy="18" r="18" fill={`${C.purple}30`} />
        <text x="18" y="24" fill={C.purple} fontSize="18" fontWeight="bold"
          textAnchor="middle" fontFamily={mono}>AI</text>
        <text x="52" y="24" fill={C.text} fontSize="22" fontWeight="700">
          AI Assistant Response
        </text>
      </g>

      {/* Fake response text */}
      {[0, 1, 2, 3].map((i) => (
        <g key={i} transform={`translate(155 ${420 + i * 50})`}>
          <rect x="0" y="0" width={[700, 780, 650, 500][i]} height="32" rx="6"
            fill={shattered ? `${C.red}15` : "#1B2D4540"} />
          <text x="14" y="22" fill={shattered ? "#FCA5A5" : C.muted}
            fontSize="16" fontFamily={mono}>
            {[
              "The company was founded in 2019 by...",
              "Revenue grew 340% year-over-year driven by...",
              "Their proprietary algorithm processes...",
              "Studies confirm a 97% accuracy rate...",
            ][i]}
          </text>
        </g>
      ))}

      {/* Verified Badge — shatters */}
      {!shattered && (
        <g transform="translate(380 680)">
          <rect x="0" y="0" width="320" height="56" rx="28" fill={`${C.green}20`}
            stroke={C.green} strokeWidth="2" />
          <text x="55" y="37" fill={C.green} fontSize="22" fontWeight="800">
            ✓ Verified Response
          </text>
        </g>
      )}

      {/* Shatter fragments */}
      {shattered && (
        <>
          {[...Array(12)].map((_, i) => {
            const angle = (i / 12) * Math.PI * 2;
            const dist = shatterProgress * (60 + (i % 3) * 40);
            const cx = 540 + Math.cos(angle) * dist;
            const cy = 708 + Math.sin(angle) * dist;
            return (
              <g key={i} opacity={1 - shatterProgress * 0.8}>
                <rect x={cx - 12} y={cy - 8} width="24" height="16"
                  rx="3" fill={C.green}
                  transform={`rotate(${i * 30 + shatterProgress * 180} ${cx} ${cy})`} />
              </g>
            );
          })}
          {/* FABRICATED stamp */}
          <g transform="translate(315 676)" opacity={shatterProgress}>
            <rect x="0" y="0" width="450" height="64" rx="12"
              fill={`${C.red}25`} stroke={C.red} strokeWidth="3" />
            <text x="225" y="42" fill={C.red} fontSize="28" fontWeight="900"
              textAnchor="middle" fontFamily={mono} letterSpacing="4">
              ⚠ FABRICATED
            </text>
          </g>
        </>
      )}

      {/* Danger glow */}
      {shattered && (
        <rect x="115" y="320" width="850" height="520" rx="24"
          fill="none" stroke={C.red}
          strokeWidth={2 + pulse * 2}
          opacity={0.4 + pulse * 0.3} />
      )}
    </g>
  );
};

// ─── Scene 2: Hallucination Problem — Brain with knowledge gaps ──────────
const HallucinationProblemScene = ({ seconds }: { seconds: number }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const intro = spring({ frame, fps, config: { damping: 12, stiffness: 80 } });
  const gapReveal = Math.min(1, Math.max(0, (seconds - 3) / 1.5));
  const fabricateReveal = Math.min(1, Math.max(0, (seconds - 6) / 1.5));
  const stampReveal = Math.min(1, Math.max(0, (seconds - 9) / 0.8));

  return (
    <g opacity={intro}>
      {/* Neural brain icon */}
      <g transform={`translate(390 310) scale(${0.8 + intro * 0.2})`}>
        <circle cx="150" cy="100" r="90" fill={`${C.purple}18`}
          stroke={C.purple} strokeWidth="2.5" />
        {/* Neural nodes */}
        {[
          [80, 60], [220, 60], [150, 30],
          [90, 140], [210, 140], [150, 170],
        ].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="10"
            fill={i < 3 ? C.purple : `${C.purple}60`} />
        ))}
        {/* Neural connections */}
        {[
          [80, 60, 150, 30], [220, 60, 150, 30],
          [80, 60, 90, 140], [220, 60, 210, 140],
          [90, 140, 150, 170], [210, 140, 150, 170],
        ].map(([x1, y1, x2, y2], i) => (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={`${C.purple}50`} strokeWidth="2" />
        ))}
        <text x="150" y="110" fill={C.text} fontSize="24" fontWeight="900"
          textAnchor="middle" fontFamily={mono}>LLM</text>
      </g>

      {/* Training data label */}
      <g transform="translate(315 540)">
        <rect x="0" y="0" width="450" height="44" rx="10" fill={`${C.panel}`}
          stroke={C.panelBorder} strokeWidth="1.5" />
        <text x="225" y="30" fill={C.muted} fontSize="18" fontWeight="600"
          textAnchor="middle" fontFamily={mono}>
          PATTERNS FROM TRAINING DATA
        </text>
      </g>

      {/* Knowledge blocks — some have gaps */}
      <g transform="translate(140 620)">
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const isGap = i === 2 || i === 4;
          const col = i % 3;
          const row = Math.floor(i / 3);
          const x = col * 280;
          const y = row * 110;
          const gapShow = isGap ? gapReveal : 1;
          return (
            <g key={i} transform={`translate(${x} ${y})`}>
              <rect x="0" y="0" width="250" height="80" rx="12"
                fill={isGap && gapShow > 0.5 ? `${C.amber}15` : C.panel}
                stroke={isGap && gapShow > 0.5 ? C.amber : C.panelBorder}
                strokeWidth="1.5" />
              {isGap && gapShow > 0.5 ? (
                <text x="125" y="48" fill={C.amber} fontSize="28" fontWeight="800"
                  textAnchor="middle" fontFamily={mono}>
                  ? ? ?
                </text>
              ) : (
                <>
                  <rect x="20" y="25" width={130 + i * 15} height="12" rx="4"
                    fill={`${C.muted}30`} />
                  <rect x="20" y="45" width={80 + i * 20} height="12" rx="4"
                    fill={`${C.muted}20`} />
                </>
              )}
            </g>
          );
        })}
      </g>

      {/* Fabrication arrow and output */}
      {fabricateReveal > 0 && (
        <g opacity={fabricateReveal}>
          <line x1="540" y1="880" x2="540" y2="940"
            stroke={C.red} strokeWidth="3" strokeDasharray="6 4" />
          <polygon points="530,940 550,940 540,960" fill={C.red} />

          <rect x="270" y="970" width="540" height="70" rx="14"
            fill={`${C.red}12`} stroke={C.red} strokeWidth="2" />
          <text x="310" y="1012" fill="#FCA5A5" fontSize="18" fontFamily={mono}>
            "Founded in 2019 with 97% accuracy..."
          </text>
          <rect x="700" y="985" width="80" height="36" rx="8"
            fill={`${C.red}30`} />
          <text x="740" y="1009" fill={C.red} fontSize="14" fontWeight="bold"
            textAnchor="middle" fontFamily={mono}>FAKE</text>
        </g>
      )}

      {/* HALLUCINATION label */}
      {stampReveal > 0 && (
        <g transform={`translate(255 1070) scale(${0.5 + stampReveal * 0.5})`}
          opacity={stampReveal}>
          <rect x="0" y="0" width="570" height="60" rx="12"
            fill={`${C.red}20`} stroke={C.red} strokeWidth="3" />
          <text x="285" y="41" fill={C.red} fontSize="26" fontWeight="900"
            textAnchor="middle" fontFamily={mono} letterSpacing="6">
            HALLUCINATION
          </text>
        </g>
      )}
    </g>
  );
};

// ─── Scene 3: RAG Solution — LLM connects to documents ──────────────────
const RagSolutionScene = ({ seconds }: { seconds: number }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const intro = spring({ frame, fps, config: { damping: 12, stiffness: 80 } });
  const connectionReveal = Math.min(1, Math.max(0, (seconds - 2) / 1.5));
  const docFlow = Math.min(1, Math.max(0, (seconds - 5) / 2));
  const verified = Math.min(1, Math.max(0, (seconds - 8) / 1));

  return (
    <g opacity={intro}>
      {/* LLM Node */}
      <g transform={`translate(390 290) scale(${intro})`}>
        <rect x="0" y="0" width="300" height="100" rx="20"
          fill={C.panel} stroke={C.purple} strokeWidth="2.5" />
        <circle cx="50" cy="50" r="28" fill={`${C.purple}25`} />
        <text x="50" y="57" fill={C.purpleGlow} fontSize="20" fontWeight="800"
          textAnchor="middle" fontFamily={mono}>🧠</text>
        <text x="170" y="42" fill={C.text} fontSize="22" fontWeight="800"
          textAnchor="middle">Large Language</text>
        <text x="170" y="72" fill={C.text} fontSize="22" fontWeight="800"
          textAnchor="middle">Model</text>
      </g>

      {/* Retrieval Connection Arrow */}
      {connectionReveal > 0 && (
        <g opacity={connectionReveal}>
          {/* Animated retrieval arrow */}
          <line x1="540" y1="400" x2="540" y2={400 + connectionReveal * 140}
            stroke={C.green} strokeWidth="4" />
          <polygon
            points={`530,${400 + connectionReveal * 140} 550,${400 + connectionReveal * 140} 540,${410 + connectionReveal * 140}`}
            fill={C.green} />
          <text x="600" y="475" fill={C.green} fontSize="18" fontWeight="700"
            fontFamily={mono}>RETRIEVE</text>
        </g>
      )}

      {/* Document Database */}
      <g transform={`translate(270 560) scale(${Math.min(1, connectionReveal * 1.5)})`}>
        <rect x="0" y="0" width="540" height="280" rx="20"
          fill={C.panel} stroke={C.panelBorder} strokeWidth="2" />
        <rect x="20" y="15" width="500" height="40" rx="8"
          fill={`${C.green}12`} />
        <text x="270" y="42" fill={C.green} fontSize="18" fontWeight="800"
          textAnchor="middle" fontFamily={mono}>
          📁 YOUR DOCUMENT DATABASE
        </text>

        {/* Document icons */}
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const col = i % 3;
          const row = Math.floor(i / 3);
          const isActive = docFlow > 0.3 && (i === 1 || i === 4);
          return (
            <g key={i} transform={`translate(${40 + col * 175} ${75 + row * 100})`}>
              <rect x="0" y="0" width="150" height="70" rx="10"
                fill={isActive ? `${C.green}20` : `${C.panelBorder}60`}
                stroke={isActive ? C.green : C.panelBorder}
                strokeWidth={isActive ? 2 : 1} />
              <text x="15" y="30" fill={isActive ? C.green : C.muted}
                fontSize="14" fontFamily={mono}>
                {["api-docs.md", "specs.pdf", "guide.md",
                  "schema.sql", "policy.md", "faq.json"][i]}
              </text>
              <rect x="15" y="42" width={80 + i * 8} height="8" rx="3"
                fill={isActive ? `${C.green}40` : `${C.muted}20`} />
              {isActive && (
                <text x="130" y="30" fill={C.green} fontSize="16"
                  fontWeight="bold" textAnchor="middle">✓</text>
              )}
            </g>
          );
        })}
      </g>

      {/* Documents flowing to prompt */}
      {docFlow > 0 && (
        <g opacity={docFlow}>
          <line x1="540" y1="855" x2="540" y2={855 + docFlow * 80}
            stroke={C.purple} strokeWidth="3" strokeDasharray="8 4" />
          <polygon
            points={`530,${855 + docFlow * 80} 550,${855 + docFlow * 80} 540,${865 + docFlow * 80}`}
            fill={C.purple} />

          {/* Prompt + Context window */}
          <rect x="220" y="960" width="640" height="120" rx="16"
            fill={C.panel} stroke={C.purple} strokeWidth="2" />
          <text x="250" y="995" fill={C.purpleGlow} fontSize="16" fontWeight="700"
            fontFamily={mono}>PROMPT + RETRIEVED CONTEXT</text>
          <rect x="250" y="1010" width="580" height="14" rx="4"
            fill={`${C.purple}20`} />
          <rect x="250" y="1032" width="420" height="14" rx="4"
            fill={`${C.green}20`} />
          <rect x="250" y="1054" width="500" height="14" rx="4"
            fill={`${C.green}20`} />
        </g>
      )}

      {/* Verified response */}
      {verified > 0 && (
        <g opacity={verified} transform={`translate(220 1110) scale(${0.8 + verified * 0.2})`}>
          <rect x="0" y="0" width="640" height="80" rx="16"
            fill={`${C.green}12`} stroke={C.green} strokeWidth="2.5" />
          <text x="60" y="48" fill={C.green} fontSize="22" fontWeight="800">
            ✓ Grounded Response
          </text>
          <text x="380" y="48" fill={C.muted} fontSize="16" fontFamily={mono}>
            Based on real documents
          </text>
        </g>
      )}
    </g>
  );
};

// ─── Scene 4: Pipeline — Animated end-to-end flow ───────────────────────
const PipelineScene = ({ seconds }: { seconds: number }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const intro = spring({ frame, fps, config: { damping: 12, stiffness: 80 } });

  // Stage reveals timed to narration
  const stageChunk = Math.min(1, Math.max(0, (seconds - 1) / 1.5));
  const stageEmbed = Math.min(1, Math.max(0, (seconds - 4) / 1.5));
  const stageStore = Math.min(1, Math.max(0, (seconds - 6.5) / 1.5));
  const stageQuery = Math.min(1, Math.max(0, (seconds - 9) / 1.5));
  const stageSearch = Math.min(1, Math.max(0, (seconds - 11) / 1.5));
  const stageAugment = Math.min(1, Math.max(0, (seconds - 14) / 1.5));
  const stageGenerate = Math.min(1, Math.max(0, (seconds - 17) / 1.5));
  const pulse = (Math.sin(seconds * 2) + 1) / 2;

  const stageY = 300;
  const stageH = 95;
  const stageGap = 8;

  const renderStage = (
    label: string, icon: string, color: string,
    y: number, progress: number, sublabel?: string
  ) => (
    <g opacity={progress} transform={`translate(115 ${y})`}>
      <rect x="0" y="0" width="850" height={stageH} rx="16"
        fill={`${color}10`} stroke={color} strokeWidth="2" />
      <text x="60" y={sublabel ? 38 : 52} fill={color} fontSize="22" fontWeight="800"
        fontFamily={mono}>{icon} {label}</text>
      {sublabel && (
        <text x="60" y="68" fill={C.muted} fontSize="16" fontFamily={mono}>
          {sublabel}
        </text>
      )}
      {/* Animated data particles */}
      {progress > 0.5 && [0, 1, 2].map(i => {
        const px = 650 + Math.sin(seconds * 3 + i * 2) * 60;
        return (
          <circle key={i} cx={px} cy={stageH / 2} r={5 + pulse * 2}
            fill={color} opacity={0.4 + pulse * 0.3} />
        );
      })}
    </g>
  );

  // Arrow between stages
  const renderArrow = (y: number, progress: number, color: string) => (
    progress > 0.3 ? (
      <g opacity={progress}>
        <line x1="540" y1={y} x2="540" y2={y + stageGap}
          stroke={color} strokeWidth="2" strokeDasharray="4 3" />
      </g>
    ) : null
  );

  return (
    <g opacity={intro}>
      {/* Title: OFFLINE INGESTION */}
      <g transform="translate(115 270)">
        <text x="0" y="20" fill={C.amber} fontSize="16" fontWeight="800"
          fontFamily={mono} letterSpacing="3">▼ OFFLINE INGESTION</text>
      </g>

      {/* Stage 1: Chunk */}
      {renderStage("CHUNK", "📄", C.amber, stageY, stageChunk,
        "Split documents into smaller segments")}
      {renderArrow(stageY + stageH, stageEmbed, C.amber)}

      {/* Stage 2: Embed */}
      {renderStage("EMBED", "🔢", C.purple, stageY + stageH + stageGap, stageEmbed,
        "Convert chunks to vector embeddings")}
      {renderArrow(stageY + 2 * (stageH + stageGap) - stageGap, stageStore, C.purple)}

      {/* Stage 3: Store */}
      {renderStage("STORE", "🗄️", C.blue, stageY + 2 * (stageH + stageGap), stageStore,
        "Index vectors in a database")}

      {/* Divider */}
      {stageQuery > 0 && (
        <g opacity={stageQuery}>
          <line x1="140" y1={stageY + 3 * (stageH + stageGap) + 10}
            x2="940" y2={stageY + 3 * (stageH + stageGap) + 10}
            stroke={C.panelBorder} strokeWidth="1.5" strokeDasharray="8 6" />
          <text x="115" y={stageY + 3 * (stageH + stageGap) + 38}
            fill={C.cyan} fontSize="16" fontWeight="800"
            fontFamily={mono} letterSpacing="3">▼ ONLINE RETRIEVAL</text>
        </g>
      )}

      {/* Stage 4: Query */}
      {renderStage("QUERY", "❓", C.cyan, stageY + 3 * (stageH + stageGap) + 50, stageQuery,
        "User question → query embedding")}
      {renderArrow(stageY + 4 * (stageH + stageGap) + 50 - stageGap, stageSearch, C.cyan)}

      {/* Stage 5: Search */}
      {renderStage("SEARCH", "🔍", C.green, stageY + 4 * (stageH + stageGap) + 50, stageSearch,
        "Find most relevant chunks")}
      {renderArrow(stageY + 5 * (stageH + stageGap) + 50 - stageGap, stageAugment, C.green)}

      {/* Stage 6: Augment */}
      {renderStage("AUGMENT", "💉", C.purpleGlow, stageY + 5 * (stageH + stageGap) + 50, stageAugment,
        "Inject chunks into prompt context")}
      {renderArrow(stageY + 6 * (stageH + stageGap) + 50 - stageGap, stageGenerate, C.purpleGlow)}

      {/* Stage 7: Generate */}
      {stageGenerate > 0 && (
        <g opacity={stageGenerate} transform={`translate(115 ${stageY + 6 * (stageH + stageGap) + 50})`}>
          <rect x="0" y="0" width="850" height={stageH} rx="16"
            fill={`${C.green}15`} stroke={C.green} strokeWidth="3" />
          <text x="60" y="38" fill={C.green} fontSize="22" fontWeight="800"
            fontFamily={mono}>✅ GENERATE</text>
          <text x="60" y="68" fill={C.muted} fontSize="16" fontFamily={mono}>
            LLM answers from evidence only
          </text>
          {/* Success glow */}
          <rect x="0" y="0" width="850" height={stageH} rx="16"
            fill="none" stroke={C.green}
            strokeWidth={1 + pulse * 2} opacity={0.3 + pulse * 0.2} />
        </g>
      )}
    </g>
  );
};

// ─── Scene 5: Grounded Answer — Citations and live updates ──────────────
const GroundedAnswerScene = ({ seconds }: { seconds: number }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const intro = spring({ frame, fps, config: { damping: 12, stiffness: 80 } });
  const citationReveal = Math.min(1, Math.max(0, (seconds - 2) / 1.5));
  const verifyReveal = Math.min(1, Math.max(0, (seconds - 5) / 1.5));
  const liveReveal = Math.min(1, Math.max(0, (seconds - 7.5) / 1.5));
  const pulse = (Math.sin(seconds * 2.5) + 1) / 2;

  return (
    <g opacity={intro}>
      {/* Response panel */}
      <rect x="115" y="290" width="850" height="400" rx="20"
        fill={C.panel} stroke={C.green} strokeWidth="2" />

      {/* Header */}
      <g transform="translate(145 320)">
        <rect x="0" y="0" width="190" height="40" rx="10"
          fill={`${C.green}20`} />
        <text x="95" y="27" fill={C.green} fontSize="18" fontWeight="800"
          textAnchor="middle" fontFamily={mono}>✓ GROUNDED</text>
      </g>

      {/* Response text with citation markers */}
      {[
        { text: "The API processes requests using a", y: 385, w: 560 },
        { text: "microservice architecture deployed on", y: 420, w: 580 },
        { text: "Kubernetes clusters across 3 regions.", y: 455, w: 540 },
      ].map(({ text, y, w }, i) => (
        <g key={i}>
          <text x="155" y={y} fill={C.text} fontSize="20">{text}</text>
          {citationReveal > 0 && (
            <g opacity={citationReveal}>
              <rect x={155 + w + 8} y={y - 18} width="36" height="24" rx="6"
                fill={`${C.purple}30`} />
              <text x={155 + w + 26} y={y} fill={C.purpleGlow} fontSize="14"
                fontWeight="bold" textAnchor="middle" fontFamily={mono}>
                [{i + 1}]
              </text>
            </g>
          )}
        </g>
      ))}

      {/* Source citations panel */}
      {citationReveal > 0 && (
        <g opacity={citationReveal} transform="translate(145 490)">
          <rect x="0" y="0" width="790" height="170" rx="12"
            fill={`${C.purple}08`} stroke={`${C.purple}40`} strokeWidth="1.5" />
          <text x="20" y="30" fill={C.purpleGlow} fontSize="16" fontWeight="700"
            fontFamily={mono}>SOURCES:</text>
          {[
            "[1] api-docs.md — Architecture Overview",
            "[2] deployment.yaml — Cluster Config",
            "[3] sla-report.pdf — Regional SLA Data",
          ].map((src, i) => (
            <text key={i} x="20" y={60 + i * 38} fill={C.muted} fontSize="16"
              fontFamily={mono}>{src}</text>
          ))}
        </g>
      )}

      {/* Verify trail */}
      {verifyReveal > 0 && (
        <g opacity={verifyReveal} transform="translate(115 720)">
          <rect x="0" y="0" width="850" height="110" rx="16"
            fill={C.panel} stroke={C.panelBorder} strokeWidth="1.5" />
          <text x="40" y="38" fill={C.green} fontSize="20" fontWeight="800"
            fontFamily={mono}>🔗 VERIFY EVERY CLAIM</text>
          <text x="40" y="72" fill={C.muted} fontSize="16" fontFamily={mono}>
            Every sentence traces back to a real document
          </text>

          {/* Check marks */}
          {[0, 1, 2].map(i => (
            <g key={i} transform={`translate(${580 + i * 85} 25)`}>
              <circle cx="25" cy="30" r="20" fill={`${C.green}20`}
                stroke={C.green} strokeWidth="2" />
              <text x="25" y="37" fill={C.green} fontSize="18" fontWeight="bold"
                textAnchor="middle">✓</text>
            </g>
          ))}
        </g>
      )}

      {/* Live update indicator */}
      {liveReveal > 0 && (
        <g opacity={liveReveal} transform="translate(115 860)">
          <rect x="0" y="0" width="850" height="100" rx="16"
            fill={`${C.cyan}08`} stroke={C.cyan} strokeWidth="2" />
          <text x="40" y="40" fill={C.cyan} fontSize="20" fontWeight="800"
            fontFamily={mono}>🔄 INSTANT UPDATES</text>
          <text x="40" y="72" fill={C.muted} fontSize="16" fontFamily={mono}>
            New data → Updated answers. No retraining.
          </text>

          {/* Pulsing "LIVE" indicator */}
          <rect x="680" y="20" width="120" height="42" rx="21"
            fill={`${C.green}${Math.round(20 + pulse * 15).toString(16)}`}
            stroke={C.green} strokeWidth="2" />
          <circle cx="710" cy="41" r={5 + pulse * 2}
            fill={C.green} opacity={0.6 + pulse * 0.4} />
          <text x="750" y="48" fill={C.green} fontSize="16" fontWeight="800"
            fontFamily={mono}>LIVE</text>
        </g>
      )}
    </g>
  );
};

// ─── Scene 6: Takeaway — Clean RAG architecture summary ─────────────────
const TakeawayScene = ({ seconds }: { seconds: number }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const intro = spring({ frame, fps, config: { damping: 12, stiffness: 80 } });
  const ctaReveal = Math.min(1, Math.max(0, (seconds - 2.5) / 1));
  const pulse = (Math.sin(seconds * 2) + 1) / 2;

  return (
    <g opacity={intro}>
      {/* Central RAG architecture diagram */}
      <g transform={`translate(165 310) scale(${intro})`}>
        {/* Background glow */}
        <rect x="0" y="0" width="750" height="550" rx="24"
          fill={C.panel} stroke={C.panelBorder} strokeWidth="2" />

        {/* Title */}
        <text x="375" y="55" fill={C.text} fontSize="30" fontWeight="900"
          textAnchor="middle">RAG Architecture</text>

        {/* User query → Embed */}
        <rect x="260" y="90" width="230" height="55" rx="14"
          fill={`${C.cyan}15`} stroke={C.cyan} strokeWidth="2" />
        <text x="375" y="125" fill={C.cyan} fontSize="18" fontWeight="700"
          textAnchor="middle" fontFamily={mono}>User Query</text>

        {/* Arrow down */}
        <line x1="375" y1="145" x2="375" y2="175" stroke={C.muted} strokeWidth="2" />
        <polygon points="370,175 380,175 375,185" fill={C.muted} />

        {/* Vector DB */}
        <rect x="200" y="190" width="350" height="55" rx="14"
          fill={`${C.purple}15`} stroke={C.purple} strokeWidth="2" />
        <text x="375" y="225" fill={C.purpleGlow} fontSize="18" fontWeight="700"
          textAnchor="middle" fontFamily={mono}>🔍 Vector Search</text>

        {/* Arrow down */}
        <line x1="375" y1="245" x2="375" y2="275" stroke={C.muted} strokeWidth="2" />
        <polygon points="370,275 380,275 375,285" fill={C.muted} />

        {/* Documents */}
        <rect x="40" y="195" width="130" height="45" rx="10"
          fill={`${C.green}10`} stroke={C.green} strokeWidth="1.5" />
        <text x="105" y="223" fill={C.green} fontSize="14" fontWeight="600"
          textAnchor="middle" fontFamily={mono}>📁 Docs</text>
        <line x1="170" y1="217" x2="200" y2="217"
          stroke={C.green} strokeWidth="1.5" strokeDasharray="4 3" />

        {/* Prompt + Context */}
        <rect x="140" y="290" width="470" height="55" rx="14"
          fill={`${C.amber}15`} stroke={C.amber} strokeWidth="2" />
        <text x="375" y="325" fill={C.amber} fontSize="18" fontWeight="700"
          textAnchor="middle" fontFamily={mono}>📝 Prompt + Context</text>

        {/* Arrow down */}
        <line x1="375" y1="345" x2="375" y2="375" stroke={C.muted} strokeWidth="2" />
        <polygon points="370,375 380,375 375,385" fill={C.muted} />

        {/* LLM → Grounded Response */}
        <rect x="200" y="390" width="350" height="55" rx="14"
          fill={`${C.green}15`} stroke={C.green} strokeWidth="2.5" />
        <text x="375" y="425" fill={C.green} fontSize="18" fontWeight="800"
          textAnchor="middle" fontFamily={mono}>✅ Grounded Answer</text>

        {/* Loop arrow */}
        <text x="625" y="430" fill={C.muted} fontSize="16">🔄</text>

        {/* Highlight pulse */}
        <rect x="200" y="390" width="350" height="55" rx="14"
          fill="none" stroke={C.green}
          strokeWidth={1 + pulse * 2} opacity={0.2 + pulse * 0.3} />
      </g>

      {/* Tagline */}
      <g transform={`translate(165 910) scale(${intro})`}>
        <text x="375" y="0" fill={C.text} fontSize="32" fontWeight="900"
          textAnchor="middle">
          Stop Guessing. Start Reading.
        </text>
      </g>

      {/* CTA */}
      {ctaReveal > 0 && (
        <g opacity={ctaReveal} transform="translate(240 960)">
          <rect x="0" y="0" width="600" height="70" rx="35"
            fill={`${C.purple}20`} stroke={C.purple} strokeWidth="2.5" />
          <text x="300" y="44" fill={C.purpleGlow} fontSize="24" fontWeight="800"
            textAnchor="middle">
            What will you build with it?
          </text>
        </g>
      )}
    </g>
  );
};

// ─── Shared scene wrapper ───────────────────────────────────────────────
const RagScene = ({
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
            backgroundColor: `${C.purple}25`,
            border: `1.5px solid ${C.purple}`,
            color: C.purpleGlow,
            fontFamily: mono,
            fontSize: 18,
            fontWeight: 800,
            padding: "6px 14px",
            borderRadius: 8,
            letterSpacing: 1.5,
          }}
        >
          AI ARCHITECTURE
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

      {/* Main Visual */}
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
        {scene.id === "hallucination-problem" && <HallucinationProblemScene seconds={seconds} />}
        {scene.id === "rag-solution" && <RagSolutionScene seconds={seconds} />}
        {scene.id === "pipeline" && <PipelineScene seconds={seconds} />}
        {scene.id === "grounded-answer" && <GroundedAnswerScene seconds={seconds} />}
        {scene.id === "takeaway" && <TakeawayScene seconds={seconds} />}
      </svg>

      {/* Karaoke Captions */}
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
        SOURCE: IBM / DATABRICKS / BIGDATA BOUTIQUE
      </div>
    </AbsoluteFill>
  );
};

// ─── Main RAG Video Component ───────────────────────────────────────────
export const RagVideo = ({
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
          background: `linear-gradient(180deg, ${C.purple} 0%, ${C.green} 100%)`,
        }}
      />

      {/* Progress Bar */}
      <div
        style={{
          position: "absolute",
          left: 90,
          top: 1610,
          height: 5,
          width: 810,
          backgroundColor: "#1B2D45",
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${(frame / durationInFrames) * 100}%`,
            background: `linear-gradient(90deg, ${C.purple} 0%, ${C.green} 100%)`,
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
              <RagScene
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
