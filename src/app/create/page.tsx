"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { QuestionTime } from "@/types/test";
import { QUESTION_TIMES } from "@/types/test";
import { createTest } from "@/lib/api";

export default function CreateTestPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [questionTime, setQuestionTime] = useState<QuestionTime>(30);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Введите название теста.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const test = await createTest({ title: title.trim(), questionTime });
      // После сохранения переходим в редактор вопросов.
      router.push(`/edit/${test.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось создать тест");
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <Link
        href="/"
        className="text-sm text-gray-500 transition-colors hover:text-gray-700"
      >
        ← Назад к тестам
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-gray-900">Создание теста</h1>

      <form
        onSubmit={handleSubmit}
        className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700"
          >
            Название теста
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            placeholder="Например: Тест по ПДД"
          />
        </div>

        <fieldset className="mt-5">
          <legend className="text-sm font-medium text-gray-700">
            Время на один вопрос
          </legend>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {QUESTION_TIMES.map((time) => {
              const active = questionTime === time;
              return (
                <button
                  key={time}
                  type="button"
                  onClick={() => setQuestionTime(time)}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "border-indigo-600 bg-indigo-600 text-white"
                      : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {time} секунд
                </button>
              );
            })}
          </div>
        </fieldset>

        {error && (
          <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-6 w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
        >
          {submitting ? "Создание…" : "Создать тест"}
        </button>
      </form>
    </div>
  );
}
