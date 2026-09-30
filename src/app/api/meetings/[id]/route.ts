import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "ログインしてください" },
        { status: 401 },
      );
    }

    const userId = Number(session.user.id);
    const { id } = await params;
    const meetingId = Number(id);

    if (Number.isNaN(meetingId)) {
      return NextResponse.json(
        { error: "議事録が見つかりません" },
        { status: 404 },
      );
    }

    const meeting = await prisma.meeting.findFirst({
      where: {
        id: meetingId,
        userId,
      },
      include: {
        transcripts: {
          orderBy: {
            startTime: "asc",
          },
        },
        todos: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!meeting) {
      return NextResponse.json(
        { error: "議事録が見つかりません" },
        { status: 404 },
      );
    }

    return NextResponse.json({ meeting });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "議事録の取得に失敗しました" },
      { status: 500 },
    );
  }
}