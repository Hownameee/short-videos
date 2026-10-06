import { CalculateMetadataFunction, Composition } from "remotion";
import { KubernetesVideo } from "./KubernetesVideo";
import { EclipseVideo } from "./EclipseVideo";
import { GrpcVideo } from "./GrpcVideo";
import { RagVideo } from "./RagVideo";
import type { VideoProps } from "./video-types";

const defaultProps: VideoProps = {
  renderMode: "preview",
  assetRoot: "",
  video: {
    meta: {
      title: "New video",
      width: 1080,
      height: 1920,
      fps: 30,
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
    <Composition
      id="ShortVideo"
      component={ProjectVideo}
      durationInFrames={60}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={defaultProps}
      calculateMetadata={calculateMetadata}
    />
  );
};

const ProjectVideo = (props: VideoProps) => {
  const renderer = props.video.meta.renderer ?? "kubernetes";
  if (renderer === "eclipses") return <EclipseVideo {...props} />;
  if (renderer === "kubernetes") return <KubernetesVideo {...props} />;
  if (renderer === "grpc") return <GrpcVideo {...props} />;
  if (renderer === "rag") return <RagVideo {...props} />;
  throw new Error(`Unsupported renderer: ${renderer}`);
};

