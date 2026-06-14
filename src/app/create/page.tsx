"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ChangeEvent } from "react";
import type { QuestionTime, Test } from "@/types/test";
import { QUESTION_TIMES } from "@/types/test";
import { createTest } from "@/lib/api";

type JsonPayload = {
  title?: unknown;
  questionTime?: unknown;
  questions?: unknown;
  tests?: unknown;
};

function parseJsonTests(payload: unknown): JsonPayload[] {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (payload && typeof payload === "object" && "tests" in payload) {
    const data = payload as JsonPayload;
    if (Array.isArray(data.tests)) {
      return data.tests;
    }
  }
  return [payload as JsonPayload];
}

function toCreatePayload(value: JsonPayload) {
  return {
    title: typeof value.title === "string" ? value.title : "",
    questionTime: value.questionTime,
    questions: value.questions,
  };
}

export default function CreateTestPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [questionTime, setQuestionTime] = useState<QuestionTime>(30);
  const [submitting, setSubmitting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSummary, setImportSummary] = useState<string | null>(null);

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
      router.push(`/edit/${test.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось создать тест");
      setSubmitting(false);
    }
  }

  async function handleJsonUpload(event: ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    setError(null);
    setImportError(null);
    setImportSummary(null);
    if (!files || files.length === 0) {
      return;
    }

    setImporting(true);
    try {
      const createdTests: Test[] = [];

      for (const file of Array.from(files)) {
        const text = await file.text();
        let parsed: unknown;

        try {
          parsed = JSON.parse(text);
        } catch {
          throw new Error(`Файл ${file.name} содержит некорректный JSON`);
        }

        const payloads = parseJsonTests(parsed);
        if (payloads.length === 0) {
          throw new Error(`Файл ${file.name} не содержит тестов`);
        }

        for (const payload of payloads) {
          const test = await createTest(toCreatePayload(payload));
          createdTests.push(test);
        }
      }

      if (createdTests.length === 0) {
        throw new Error("Не найдено ни одного теста для создания.");
      }

      setImportSummary(`Создано ${createdTests.length} тест${createdTests.length === 1 ? "" : "ов"}.`);
      if (createdTests.length === 1) {
        router.push(`/edit/${createdTests[0].id}`);
      } else {
        router.push("/");
      }
    } catch (e) {
      setImportError(e instanceof Error ? e.message : "Не удалось импортировать тесты из JSON");
    } finally {
      setImporting(false);
      event.target.value = "";
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

      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Импорт из JSON</h2>
        <p className="mt-2 text-sm text-gray-600">
          Загрузите JSON-файл с одним тестом или массивом тестов. Поддерживаются форматы:
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-gray-600">
          <li>{`{ title, questionTime, questions }`}</li>
          <li>{`{ tests: [ ... ] }`}</li>
          <li>{`[ { title, questionTime, questions }, ... ]`}</li>
        </ul>

        <label className="mt-4 flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 transition-colors hover:border-indigo-500 hover:text-indigo-700">
          <input
            type="file"
            accept=".json,application/json"
            onChange={handleJsonUpload}
            multiple
            className="hidden"
          />
          {importing ? "Импортирование…" : "Выберите JSON-файл(ы)"}
        </label>

        {importError && (
          <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {importError}
          </p>
        )}
        {importSummary && (
          <p className="mt-4 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
            {importSummary}
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
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
          <legend className="text-sm font-medium text-gray-700">Время на один вопрос</legend>
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
