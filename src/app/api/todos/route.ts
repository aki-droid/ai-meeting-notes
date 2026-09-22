import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI();

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: "TODOを抽出する文字起こし結果がありません" },
        { status: 400 },
      );
    }

    const response = await openai.responses.create({
      model: "gpt-4o-mini",
      input: `以下の会議の文字起こしから、実行すべきTODOを抽出してください。

各TODOについて、以下の形式でJSONとして返してください。

[
  {
    "task": "実行する作業内容",
    "assignee": "担当者",
    "dueDate": "期限"
  }
]

担当者や期限が会議中に明確に述べられていない場合は、nullにしてください。
TODOが存在しない場合は空の配列を返してください。

JSON以外の文章は返さないでください。

会議の文字起こし:
${text}`,
    });

    const output = response.output_text
      .replace(/^```json\s*/, "")
      .replace(/\s*```$/, "");

    const todos = JSON.parse(output);

    return NextResponse.json({
      todos,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "TODOの抽出に失敗しました" },
      { status: 500 },
    );
  }
}