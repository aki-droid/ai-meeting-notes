"use client";

import { useState } from "react";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [transcription, setTranscription] = useState("");
  const [segments, setSegments] = useState<
    { start: number; end: number; text: string }[]
  >([]);
  const [summary, setSummary] = useState("");
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [todos, setTodos] = useState<
    {
      task: string;
      assignee: string | null;
      dueDate: string | null;
    }[]
  >([]);
  const [isTodoLoading, setIsTodoLoading] = useState(false);
  const [todoExtracted, setTodoExtracted] = useState(false);

  const handleTranscription = async () => {
    if (!file) {
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/transcriptions", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "文字起こしに失敗しました");
      }

      setTranscription(data.text);
      setSegments(data.segments);
      setSummary("");
      setTodos([]);
      setTodoExtracted(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSummary = async () => {
    if (!transcription) {
      return;
    }

    setIsSummaryLoading(true);

    try {
      const response = await fetch("/api/summaries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: transcription,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "AI要約に失敗しました");
      }

      setSummary(data.summary);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSummaryLoading(false);
    }
  };

  const handleTodos = async () => {
    if (!transcription) {
      return;
    }

    setIsTodoLoading(true);

    try {
      const response = await fetch("/api/todos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: transcription,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "TODOの抽出に失敗しました");
      }

      setTodos(data.todos);
      setTodoExtracted(true);
    } catch (error) {
      console.error(error);
    } finally {
      setIsTodoLoading(false);
    }
  };

      const handleSaveMeeting = async () => {
        if (!title.trim() || !transcription) {
          alert("会議タイトルと文字起こし結果を入力してください");
          return;
        }

        try {
          const response = await fetch("/api/meetings", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              userId: 1,
              title: title.trim(),
              audioUrl: file ? `/uploads/${file.name}` : "",
              summary,
              status: "completed",
              transcription,
              segments,
              todos,
            }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || "議事録の保存に失敗しました");
          }

          alert("議事録を保存しました");
        } catch (error) {
          console.error(error);
          alert("議事録の保存に失敗しました");
        }
      };

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <h1 className="text-xl font-bold text-gray-900">
            AI Meeting Notes
          </h1>

          <nav className="flex gap-3">
            <button className="rounded-md border px-4 py-2 text-sm">
              ログイン
            </button>

            <button className="rounded-md bg-black px-4 py-2 text-sm text-white">
              新規登録
            </button>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h2 className="text-4xl font-bold tracking-tight text-gray-900">
          AIで、議事録作成をもっと簡単に。
        </h2>

        <p className="mt-5 text-lg text-gray-600">
          音声ファイルをアップロードするだけで、
          <br />
          AIが会議の内容を文字起こしします。
        </p>

        <div className="mt-10 rounded-xl border-2 border-dashed border-gray-300 bg-white p-10">
        <div className="mb-6 text-left">
          <label
            htmlFor="meeting-title"
            className="mb-2 block font-medium text-gray-700"
          >
            会議タイトル
          </label>
          <input
            id="meeting-title"
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="例：定例会議"
            className="w-full rounded-md border border-gray-300 px-4 py-2"
          />
        </div>  
          <p className="text-gray-600">
            音声ファイルをアップロードしてください
          </p>

          <input
            type="file"
            accept="audio/*"
            onChange={(event) => {
              const selectedFile = event.target.files?.[0] ?? null;
              setFile(selectedFile);
            }}
          />

          {file && (
            <p className="mt-4 text-sm text-gray-600">
              選択したファイル：{file.name}
            </p>
          )}

          <button
            onClick={handleTranscription}
            disabled={!file || isLoading}
            className="mt-6 rounded-md bg-black px-6 py-3 font-medium text-white disabled:opacity-50"
          >
            {isLoading ? "文字起こし中..." : "文字起こし開始"}
          </button>

          {segments.length > 0 && (
            <div className="mt-8 rounded-xl border bg-white p-6 text-left">
              <h3 className="text-lg font-bold text-gray-900">
                文字起こし結果
              </h3>

              <div className="mt-4 space-y-3">
                {segments.map((segment, index) => (
                  <div key={index} className="flex gap-4">
                    <span className="shrink-0 font-mono text-sm text-gray-500">
                      {Math.floor(segment.start / 60)
                        .toString()
                        .padStart(2, "0")}
                      :
                      {Math.floor(segment.start % 60)
                        .toString()
                        .padStart(2, "0")}
                    </span>

                    <p className="text-gray-700">
                      {segment.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {transcription && (
            <div className="mt-6 flex justify-center gap-3">
              <button
                onClick={handleSummary}
                disabled={isSummaryLoading}
                className="rounded-md bg-black px-6 py-3 font-medium text-white disabled:opacity-50"
              >
                {isSummaryLoading ? "要約中..." : "AI要約を生成"}
              </button>

              <button
                onClick={handleTodos}
                disabled={isTodoLoading}
                className="rounded-md bg-black px-6 py-3 font-medium text-white disabled:opacity-50"
              >
                {isTodoLoading ? "TODO抽出中..." : "TODOを抽出"}
              </button>
            </div>
          )}

          {summary && (
            <div className="mt-8 rounded-xl border bg-white p-6 text-left">
              <h3 className="text-lg font-bold text-gray-900">
                AI要約
              </h3>

              <p className="mt-4 whitespace-pre-wrap text-gray-700">
                {summary}
              </p>
            </div>
          )}
  
          {todoExtracted && todos.length === 0 && (
            <div className="mt-8 rounded-xl border bg-white p-6 text-left">
              <h3 className="text-lg font-bold text-gray-900">
                TODO
              </h3>

              <p className="mt-4 text-gray-600">
                TODOはありませんでした。
              </p>
            </div>
          )}
          
          {todos.length > 0 && (
            <div className="mt-8 rounded-xl border bg-white p-6 text-left">
              <h3 className="text-lg font-bold text-gray-900">
                TODO
              </h3>

              <div className="mt-4 space-y-4">
                {todos.map((todo, index) => (
                  <div
                    key={index}
                    className="rounded-lg border p-4"
                  >
                    <p className="font-medium text-gray-900">
                      {todo.task}
                    </p>

                    <div className="mt-2 text-sm text-gray-600">
                      <p>
                        担当：{todo.assignee ?? "未指定"}
                      </p>

                      <p>
                        期限：{todo.dueDate ?? "未指定"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {transcription && (
            <button
              onClick={handleSaveMeeting}
              className="mt-8 rounded-md bg-green-600 px-6 py-3 font-medium text-white hover:bg-green-700"
            >
              議事録を保存
            </button>
          )}
        </div>
      </section>
    </main>
  );
}
