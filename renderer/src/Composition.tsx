import {
  AbsoluteFill,
  CalculateMetadataFunction,
  Composition,
  useVideoConfig,
} from "remotion";
import defaultVideoFormat from "./video-format.json";
import { KubernetesVideo } from "./KubernetesVideo";
import { Kubernetes3DStudy } from "./Kubernetes3DStudy";
import type { VideoProps } from "./video-types";

const defaultProps: VideoProps = {
  renderMode: "preview",
  assetRoot: "",
  video: {
    meta: {
      title: "New video",
      ...defaultVideoFormat,
    },
    design: {
      palette: {
        background: "#071827",
        surface: "#102A43",
        text: "#F7FAFC",
        muted: "#9FB3C8",
        accent: "#2496ED",
        warning: "#FF8A3D",
        success: "#44E3C1",
      },
    },
    scenes: [],
  },
  voiceManifest: {
    scriptVersion: null,
    scenes: [],
  },
};

const calculateMetadata: CalculateMetadataFunction<VideoProps> = ({
  props,
}) => ({
  durationInFrames: Math.max(
    60,
    props.audioTimeline?.totalFrames ??
      props.voiceManifest.scenes.reduce(
        (total, scene) =>
          total + Math.ceil((scene.durationSec + 0.45) * props.video.meta.fps),
        0,
      ),
  ),
  fps: props.video.meta.fps,
  width: props.video.meta.width,
  height: props.video.meta.height,
  defaultOutName: "short-video.mp4",
});

export const MyComposition = () => {
  return (
    <>
      <Composition
        id="ShortVideo"
        component={ProjectVideo}
        durationInFrames={60}
        fps={defaultVideoFormat.fps}
        width={defaultVideoFormat.width}
        height={defaultVideoFormat.height}
        defaultProps={defaultProps}
        calculateMetadata={calculateMetadata}
      />
      <Composition
        id="Kubernetes3DStudy"
        component={Kubernetes3DStudy}
        durationInFrames={1711}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={defaultProps}
        calculateMetadata={calculateMetadata}
      />
    </>
  );
};

const ProjectVideo = (props: VideoProps) => {
  const { width, height } = useVideoConfig();
  const renderer = props.video.meta.renderer ?? "kubernetes";
  if (renderer !== "kubernetes")
    throw new Error(`Unsupported renderer: ${renderer}`);
  const scale = Math.min(width / 1080, height / 1920);
  return (
    <AbsoluteFill
      style={{ backgroundColor: props.video.design.palette.background }}
    >
      <div
        style={{
          position: "absolute",
          width: 1080,
          height: 1920,
          left: (width - 1080 * scale) / 2,
          top: (height - 1920 * scale) / 2,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        <KubernetesVideo {...props} />
      </div>
    </AbsoluteFill>
  );
};
