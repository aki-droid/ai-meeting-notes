import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "ログインしてください" },
        { status: 401 },
      );
    }

    const userId = session.user.id;
    const body = (await request.json()) as HandleUploadBody;
    const userPathPrefix = `users/${userId}/`;

    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (
          !pathname.startsWith(userPathPrefix) ||
          pathname.split("/").some((part) => part === "..")
        ) {
          throw new Error("アップロード先が正しくありません");
        }

        return {
          allowedContentTypes: [
            "audio/mpeg",
            "audio/mp4",
            "audio/wav",
            "audio/webm",
            "audio/ogg",
            "audio/aac",
            "audio/flac",
            "audio/x-m4a",
          ],
          maximumSizeInBytes: 500 * 1024 * 1024,
          addRandomSuffix: true,
        };
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error("音声アップロードエラー:", error);

    return NextResponse.json(
      { error: "音声ファイルのアップロードに失敗しました" },
      { status: 500 },
    );
  }
}
