import { NextResponse } from "next/server";
import OpenAI, { toFile } from "openai";

const openai = new OpenAI();

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "音声ファイルを選択してください" },
        { status: 400 },
      );
    }

    if (!file.type.startsWith("audio/")) {
      return NextResponse.json(
        { error: "音声ファイルのみアップロードできます" },
        { status: 400 },
      );
    }

    const audioFile = await toFile(
      Buffer.from(await file.arrayBuffer()),
      file.name,
      {
        type: file.type,
      },
    );

    const transcription = await openai.audio.transcriptions.create({
      model: "gpt-4o-mini-transcribe",
      file: audioFile,
    });

    return NextResponse.json({
      text: transcription.text,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "音声の文字起こしに失敗しました" },
      { status: 500 },
    );
  }
}