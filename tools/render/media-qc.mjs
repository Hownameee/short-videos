import { execFile } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify(execFile);
const level = (value) => value === "-inf" ? -Infinity : value === "inf" ? Infinity : Number(value);

/** Decode the complete media while measuring the actual encoded mix. */
export const measureAudio = async (file) => {
  const { stderr } = await exec("ffmpeg", [
    "-hide_banner", "-nostdin", "-xerror", "-i", file,
    "-af", "loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-",
  ], { maxBuffer: 4 * 1024 * 1024 });
  const match = stderr.match(/\{\s*"input_i"[\s\S]*?\}/);
  if (!match) throw new Error(`Audio measurement unavailable: ${file}`);
  const measurement = JSON.parse(match[0]);
  return {
    integratedLufs: level(measurement.input_i),
    truePeakDbtp: level(measurement.input_tp),
    loudnessRangeLu: Number(measurement.input_lra),
  };
};

export const checkRenderedAudio = async (file, hasAudio) => {
  if (!hasAudio) {
    await exec("ffmpeg", ["-v", "error", "-nostdin", "-xerror", "-i", file, "-f", "null", "-"], { maxBuffer: 4 * 1024 * 1024 });
    return { decode: "passed", audio: null };
  }
  const audio = await measureAudio(file);
  if (!Number.isFinite(audio.integratedLufs) || Math.abs(audio.integratedLufs + 16) > 1.5) {
    throw new Error(`Final loudness ${audio.integratedLufs} LUFS is outside -16 ± 1.5 LUFS.`);
  }
  if (!Number.isFinite(audio.truePeakDbtp) || audio.truePeakDbtp > -1) {
    throw new Error(`Final true peak ${audio.truePeakDbtp} dBTP exceeds the -1 dBTP check ceiling.`);
  }
  return { decode: "passed", audio };
};
