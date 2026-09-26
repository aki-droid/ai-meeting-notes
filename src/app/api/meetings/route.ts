import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
try {
const {
userId,
title,
audioUrl,
summary,
status,
segments,
todos,
} = await request.json();

if (!userId || !title || !audioUrl) {
  return NextResponse.json(
    { error: "必要な項目が入力されていません" },
    { status: 400 },
  );
}

const meeting = await prisma.meeting.create({
  data: {
    userId,
    title,
    audioUrl,
    summary: summary ?? null,
    status: status ?? "completed",
    transcripts: {
      create: (segments ?? []).map(
        (segment: {
          start: number;
          end: number;
          text: string;
        }) => ({
          speaker: "未設定",
          startTime: segment.start,
          endTime: segment.end,
          text: segment.text,
        }),
      ),
    },
    todos: {
      create: (todos ?? []).map(
        (todo: {
          task: string;
          assignee: string | null;
          dueDate: string | null;
        }) => ({
          content: todo.task,
          assignee: todo.assignee,
          dueDate: null,
        }),
      ),
    },
  },
  include: {
    transcripts: true,
    todos: true,
  },
});

return NextResponse.json(
  {
    message: "議事録の保存に成功しました",
    meeting,
  },
  { status: 201 },
);

} catch (error) {
console.error(error);

return NextResponse.json(
  { error: "議事録の保存に失敗しました" },
  { status: 500 },
);

}
}
