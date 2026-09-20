import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI();

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: "要約する文字起こし結果がありません" },
        { status: 400 },
      );
    }

    const response = await openai.responses.create({
      model: "gpt-4o-mini",
      input: `以下の会議の文字起こしを、重要なポイントが分かるように簡潔に要約してください。

${text}`,
    });

    return NextResponse.json({
      summary: response.output_text,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "AI要約に失敗しました" },
      { status: 500 },
    );
  }
}