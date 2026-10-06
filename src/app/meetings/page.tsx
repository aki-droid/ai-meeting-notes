"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Meeting = {
id: number;
title: string;
summary: string | null;
status: string;
createdAt: string;
};

export default function MeetingsPage() {
const { data: session, status } = useSession();
const router = useRouter();

const [meetings, setMeetings] = useState<Meeting[]>([]);
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState("");

useEffect(() => {
if (status === "unauthenticated") {
router.push("/login");
}

if (status === "authenticated") {
  const fetchMeetings = async () => {
    try {
      const response = await fetch("/api/meetings");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "議事録の取得に失敗しました");
      }

      setMeetings(data.meetings);
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

  fetchMeetings();
}

}, [status, router]);

if (status === "loading" || isLoading) {
return ( <main className="flex min-h-screen items-center justify-center bg-gray-50"> <p className="text-gray-600">読み込み中...</p> </main>
);
}

return ( <main className="min-h-screen bg-gray-50"> <header className="border-b bg-white"> <div className="mx-auto flex max-w-5xl flex-col gap-3 px-6 py-4 md:flex-row md:items-center md:justify-between"> <h1 className="text-xl font-bold text-gray-900">
AI Meeting Notes </h1>

      <div className="flex w-full items-center justify-end gap-4 md:w-auto">
        <span className="text-sm text-gray-700">
          {session?.user?.name} さん
        </span>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          新しい議事録を作成
        </button>
      </div>
    </div>
  </header>

  <section className="mx-auto max-w-5xl px-6 py-10">
    <div className="mb-6">
      <h2 className="text-2xl font-bold text-gray-900">
        議事録履歴
      </h2>
      <p className="mt-1 text-sm text-gray-500">
        保存した議事録を確認できます。
      </p>
    </div>

    {error ? (
      <p className="rounded-md bg-red-100 p-4 text-red-700">{error}</p>
    ) : meetings.length === 0 ? (
      <div className="rounded-lg border bg-white p-8 text-center">
        <p className="text-gray-600">保存された議事録はありません。</p>
      </div>
    ) : (
      <div className="space-y-4">
        {meetings.map((meeting) => (
          <Link
            key={meeting.id}
            href={`/meetings/${meeting.id}`}
            className="block rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition hover:border-blue-300 hover:shadow-md"
          >
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              {meeting.title}
            </h3>

            <p className="mb-3 text-sm text-gray-500">
              {new Date(meeting.createdAt).toLocaleString("ja-JP", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>

            {meeting.summary ? (
              <p className="line-clamp-2 text-gray-700">
                {meeting.summary}
              </p>
            ) : (
              <p className="text-sm text-gray-400">
                要約はありません。
              </p>
            )}
          </Link>
        ))}
      </div>
    )}
  </section>
</main>

);
}
