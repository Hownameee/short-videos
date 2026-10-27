import { AbsoluteFill, Composition } from "remotion";
import defaultVideoFormat from "./video-format.json";

// Studio remains usable before a topic-specific composition is implemented.
const EmptyWorkspace = () => (
  <AbsoluteFill style={{ backgroundColor: "#071827", color: "#F7FAFC", justifyContent: "center", alignItems: "center", fontFamily: "Arial, sans-serif", fontSize: 64 }}>
    No video project configured
  </AbsoluteFill>
);

export const MyComposition = () => (
  <Composition id="EmptyWorkspace" component={EmptyWorkspace} durationInFrames={60}
    fps={defaultVideoFormat.fps} width={defaultVideoFormat.width} height={defaultVideoFormat.height} />
);
