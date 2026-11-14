
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

export type AudioChunk = {
  file: File;
  startTime: number;
};

export async function splitAudio(
  file: File,
  onProgress?: (progress: number) => void,
): Promise<AudioChunk[]> {
  const ffmpeg = new FFmpeg();

  try {
    ffmpeg.on("progress", ({ progress }) => {
      onProgress?.(Math.round(progress * 100));
    });

    const baseURL = window.location.origin;

    console.log("① FFmpegの読み込み開始");

    await ffmpeg.load({
      classWorkerURL: `${baseURL}/ffmpeg/worker.js`,
      coreURL: await toBlobURL(
        `${baseURL}/ffmpeg/ffmpeg-core.js`,
        "text/javascript",
      ),
      wasmURL: await toBlobURL(
        `${baseURL}/ffmpeg/ffmpeg-core.wasm`,
        "application/wasm",
      ),
    });

console.log("② FFmpegの読み込み完了");



    await ffmpeg.writeFile("input", await fetchFile(file));
    console.log("③ 音声ファイルの読み込み完了");

    // 音声を5分ごとのMP3に分割する
    const duration = await getDuration(file);
    const chunkDuration = 5 * 60;
    const chunks: AudioChunk[] = [];

    for (
      let startTime = 0, index = 0;
      startTime < duration;
      startTime += chunkDuration, index++
    ) {
      const outputName = `chunk-${index}.mp3`;

      await ffmpeg.exec([
        "-ss",
        String(startTime),
        "-i",
        "input",
        "-t",
        String(chunkDuration),
        "-vn",
        "-ac",
        "1",
        "-ar",
        "16000",
        "-b:a",
        "64k",
        outputName,
      ]);

      const data = await ffmpeg.readFile(outputName);

      if (typeof data === "string") {
        throw new Error("音声ファイルの分割に失敗しました");
      }

      const audioData = new Uint8Array(data);
      const blob = new Blob([audioData.buffer], { type: "audio/mpeg" });

      chunks.push({
        file: new File([blob], outputName, {
          type: "audio/mpeg",
        }),
        startTime,
      });
    }

    return chunks;
  } finally {
    await ffmpeg.terminate();
  }
}

async function getDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    const url = URL.createObjectURL(file);

    audio.preload = "metadata";

    audio.onloadedmetadata = () => {
      const duration = audio.duration;
      URL.revokeObjectURL(url);

      if (!Number.isFinite(duration) || duration <= 0) {
        reject(new Error("音声の長さを取得できませんでした"));
        return;
      }

      resolve(duration);
    };

    audio.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("音声ファイルの読み込みに失敗しました"));
    };

    audio.src = url;
  });
}
