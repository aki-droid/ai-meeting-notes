import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

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

    const uploadDir = path.join(process.cwd(), "public", "uploads");

    await mkdir(uploadDir, { recursive: true });

    const extension = path.extname(file.name);
    const fileName = `${crypto.randomUUID()}${extension}`;
    const filePath = path.join(uploadDir, fileName);

    const buffer = Buffer.from(await file.arrayBuffer());

    await writeFile(filePath, buffer);

    return NextResponse.json(
      {
        message: "音声ファイルのアップロードが完了しました",
        url: `/uploads/${fileName}`,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "音声ファイルのアップロードに失敗しました" },
      { status: 500 },
    );
  }
}