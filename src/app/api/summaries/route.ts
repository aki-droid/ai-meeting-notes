
import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI();

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    if (typeof text !== "string" || !text.trim()) {
      return NextResponse.json(
        { error: "要約する文字起こし結果がありません" },
        { status: 400 },
      );
    }

    const response = await openai.responses.create({
      model: "gpt-4o-mini",
      input: `あなたは文章を要約するアシスタントです。
以下の文字起こしを読み、内容に沿って日本語で要約してください。

ルール：
- 会議、スピーチ、挨拶、説明、日常会話など、文章の種類を問わず要約してください。
- 文字起こしが短い場合は、発言の意味を簡潔にまとめてください。
- 文字起こしが長い場合は、主要な話題、重要なポイント、具体的な取り組みや決定事項を整理してください。
- 内容に応じて、簡潔な文章または箇条書きでまとめてください。
- 長い文章では、重要な情報を落としすぎないようにしてください。
- 元の文章にない情報や背景を推測して追加しないでください。
- 聞き取りの誤りと思われる箇所も、根拠がない限り勝手に補完しないでください。
- 要約以外の前置きや説明は出力しないでください。
- 内容が存在する場合、「要約できる内容がありません」と回答しないでください。

【文字起こし】
${text}`,
    });

    const summary = response.output_text.trim();

    if (
      !summary ||
      summary.includes("会議の内容を教えてください") ||
      summary.includes("文字起こしを提供してください")
    ) {
      return NextResponse.json(
        {
          error:
            "要約を作成できませんでした。もう一度お試しください。",
        },
        { status: 422 },
      );
    }

    return NextResponse.json({ summary });
  } catch (error) {
    console.error("AI要約エラー:", error);

    return NextResponse.json(
      { error: "AI要約に失敗しました" },
      { status: 500 },
    );
  }
}
