"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

type Transcript = {
  id: number;
  speaker: string;
  startTime: number;
  endTime: number;
  text: string;
};

type Todo = {
  id: number;
  content: string;
  assignee: string | null;
  dueDate: string | null;
  completed: boolean;
};

type Meeting = {
  id: number;
  title: string;
  audioUrl: string;
  summary: string | null;
  status: string;
  createdAt: string;
  transcripts: Transcript[];
  todos: Todo[];
};

export default function MeetingDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { status } = useSession();

  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status !== "authenticated") {
      return;
    }

    const fetchMeeting = async () => {
      try {
        const response = await fetch(`/api/meetings/${params.id}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "議事録の取得に失敗しました");
        }

        setMeeting(data.meeting);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "議事録の取得に失敗しました",
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchMeeting();
  }, [params.id, router, status]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    return `${String(minutes).padStart(2, "0")}:${String(
      remainingSeconds,
    ).padStart(2, "0")}`;
  };

  if (status === "loading" || isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-600">読み込み中...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-5xl px-6 py-10">
          <p className="rounded-md bg-red-100 p-4 text-red-700">{error}</p>

          <button
            type="button"
            onClick={() => router.push("/meetings")}
            className="mt-4 rounded-md border bg-white px-4 py-2 text-sm"
          >
            議事録履歴に戻る
          </button>
        </div>
      </main>
    );
  }

  if (!meeting) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <h1 className="text-xl font-bold text-gray-900">
            AI Meeting Notes
          </h1>

          <button
            type="button"
            onClick={() => router.push("/meetings")}
            className="rounded-md border px-4 py-2 text-sm"
          >
            議事録履歴に戻る
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-5xl space-y-6 px-6 py-10">
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900">
            {meeting.title}
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            {new Date(meeting.createdAt).toLocaleString("ja-JP")}
          </p>

          <div className="mt-6">
            <h3 className="mb-3 text-lg font-semibold text-gray-900">
              要約
            </h3>

            {meeting.summary ? (
              <p className="whitespace-pre-wrap text-gray-700">
                {meeting.summary}
              </p>
            ) : (
              <p className="text-gray-400">要約はありません。</p>
            )}
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            文字起こし
          </h3>

          {meeting.transcripts.length === 0 ? (
            <p className="text-gray-400">
              文字起こしデータはありません。
            </p>
          ) : (
            <div className="space-y-4">
              {meeting.transcripts.map((transcript) => (
                <div
                  key={transcript.id}
                  className="border-b pb-4 last:border-b-0 last:pb-0"
                >
                  <div className="mb-1 flex items-center gap-3">
                    <span className="font-semibold text-gray-900">
                      {transcript.speaker}
                    </span>

                    <span className="text-sm text-gray-500">
                      {formatTime(transcript.startTime)} -{" "}
                      {formatTime(transcript.endTime)}
                    </span>
                  </div>

                  <p className="whitespace-pre-wrap text-gray-700">
                    {transcript.text}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            TODO
          </h3>

          {meeting.todos.length === 0 ? (
            <p className="text-gray-400">TODOはありません。</p>
          ) : (
            <div className="space-y-4">
              {meeting.todos.map((todo) => (
                <div
                  key={todo.id}
                  className="border-b pb-4 last:border-b-0 last:pb-0"
                >
                  <p className="font-medium text-gray-900">
                    {todo.content}
                  </p>

                  {todo.assignee && (
                    <p className="mt-1 text-sm text-gray-600">
                      担当者: {todo.assignee}
                    </p>
                  )}

                  {todo.dueDate && (
                    <p className="mt-1 text-sm text-gray-600">
                      期限:{" "}
                      {new Date(todo.dueDate).toLocaleDateString("ja-JP")}
                    </p>
                  )}

                  <p className="mt-1 text-sm text-gray-500">
                    状態: {todo.completed ? "完了" : "未完了"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}