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

    if (!Number.isInteger(meetingId) || meetingId <= 0) {
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

export async function PATCH(
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

    if (!Number.isInteger(meetingId) || meetingId <= 0) {
      return NextResponse.json(
        { error: "議事録が見つかりません" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const { summary, transcripts, todos } = body;

    if (
      (summary !== null && typeof summary !== "string") ||
      !Array.isArray(transcripts) ||
      !Array.isArray(todos)
    ) {
      return NextResponse.json(
        { error: "入力内容が正しくありません" },
        { status: 400 },
      );
    }

    const meeting = await prisma.meeting.findFirst({
      where: {
        id: meetingId,
        userId,
      },
      include: {
        transcripts: true,
        todos: true,
      },
    });

    if (!meeting) {
      return NextResponse.json(
        { error: "議事録が見つかりません" },
        { status: 404 },
      );
    }

    const validTranscripts =
      transcripts.length === meeting.transcripts.length &&
      transcripts.every((transcript) => {
        const original = meeting.transcripts.find(
          (item) => item.id === transcript.id,
        );

        return (
          original &&
          typeof transcript.speaker === "string" &&
          typeof transcript.text === "string" &&
          Number.isFinite(transcript.startTime) &&
          Number.isFinite(transcript.endTime) &&
          transcript.startTime >= 0 &&
          transcript.endTime >= transcript.startTime
        );
      });

    const validTodos =
      todos.length === meeting.todos.length &&
      todos.every((todo) => {
        const original = meeting.todos.find(
          (item) => item.id === todo.id,
        );

        return (
          original &&
          typeof todo.content === "string" &&
          (todo.assignee === null ||
            typeof todo.assignee === "string") &&
          (todo.dueDate === null ||
            (typeof todo.dueDate === "string" &&
              !Number.isNaN(Date.parse(todo.dueDate)))) &&
          typeof todo.completed === "boolean"
        );
      });

    if (!validTranscripts || !validTodos) {
      return NextResponse.json(
        { error: "文字起こしまたはTODOの入力内容が正しくありません" },
        { status: 400 },
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.meeting.update({
        where: {
          id: meetingId,
        },
        data: {
          summary,
        },
      });

      for (const transcript of transcripts) {
        await tx.transcript.update({
          where: {
            id: transcript.id,
          },
          data: {
            speaker: transcript.speaker,
            startTime: transcript.startTime,
            endTime: transcript.endTime,
            text: transcript.text,
          },
        });
      }

      for (const todo of todos) {
        await tx.todo.update({
          where: {
            id: todo.id,
          },
          data: {
            content: todo.content,
            assignee: todo.assignee,
            dueDate: todo.dueDate ? new Date(todo.dueDate) : null,
            completed: todo.completed,
          },
        });
      }
    });

    return NextResponse.json({ message: "議事録を更新しました" });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "議事録の更新に失敗しました" },
      { status: 500 },
    );
  }
}

export async function DELETE(
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

    if (!Number.isInteger(meetingId) || meetingId <= 0) {
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
    });

    if (!meeting) {
      return NextResponse.json(
        { error: "議事録が見つかりません" },
        { status: 404 },
      );
    }

    await prisma.meeting.delete({
      where: {
        id: meetingId,
      },
    });

    return NextResponse.json({
      message: "議事録を削除しました",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "議事録の削除に失敗しました" },
      { status: 500 },
    );
  }
}