import { NextResponse } from "next/server";
import OpenAI, { toFile } from "openai";
import { get } from "@vercel/blob";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";

const openai = new OpenAI();
const MAX_FILE_SIZE = 25 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "ログインしてください" },
        { status: 401 },
      );
    }

    const body: { pathname?: string } = await request.json();
    const pathname = body.pathname;
    const userPathPrefix = `users/${session.user.id}/`;

    if (
      typeof pathname !== "string" ||
      !pathname.startsWith(userPathPrefix) ||
      pathname.split("/").some((part) => part === "..")
    ) {
      return NextResponse.json(
        { error: "音声ファイルの保存先が正しくありません" },
        { status: 400 },
      );
    }

    const blob = await get(pathname, { access: "private" });

    if (!blob) {
      return NextResponse.json(
        { error: "音声ファイルが見つかりません" },
        { status: 404 },
      );
    }

    if (
      blob.statusCode === 200 &&
      blob.blob.size > MAX_FILE_SIZE
    ) {
      return NextResponse.json(
        {
          error:
            "音声ファイルが25MBを超えています。音声を圧縮または分割してお試しください。",
        },
        { status: 413 },
      );
    }

    const contentType =
      blob.headers.get("content-type") || "application/octet-stream";

    if (!contentType.startsWith("audio/")) {
      return NextResponse.json(
        { error: "音声ファイルのみ文字起こしできます" },
        { status: 400 },
      );
    }

    const audioBuffer = Buffer.from(
      await new Response(blob.stream).arrayBuffer(),
    );

    const filename = pathname.split("/").pop() || "audio";

    const audioFile = await toFile(audioBuffer, filename, {
      type: contentType,
    });

    const transcription = await openai.audio.transcriptions.create({
      model: "whisper-1",
      file: audioFile,
      response_format: "verbose_json",
      timestamp_granularities: ["segment"],
    });

    return NextResponse.json({
      text: transcription.text,
      segments: transcription.segments,
    });
  } catch (error) {
    console.error("音声の文字起こしエラー:", error);

    return NextResponse.json(
      { error: "音声の文字起こしに失敗しました" },
      { status: 500 },
    );
  }
}
