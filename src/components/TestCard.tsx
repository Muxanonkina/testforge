"use client";

import { useState } from "react";
import Link from "next/link";
import type { Test } from "@/types/test";
import { deleteTest } from "@/lib/api";

interface TestCardProps {
  test: Test;
  /** Вызывается после успешного удаления, чтобы родитель обновил список. */
  onDeleted?: (id: string) => void;
}

/** Карточка теста на главной странице. */
export default function TestCard({ test, onDeleted }: TestCardProps) {
  const [deleting, setDeleting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const questionCount = test.questions.length;
  const canStart = questionCount > 0;

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      await deleteTest(test.id);
      onDeleted?.(test.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось удалить тест");
      setDeleting(false);
      setConfirming(false);
    }
  }

  return (
    <div className="flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-gray-900 break-words">
          {test.title}
        </h3>
        <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-600">
          <div className="flex items-center gap-1.5">
            <dt className="text-gray-400">Вопросов:</dt>
            <dd className="font-medium text-gray-800">{questionCount}</dd>
          </div>
          <div className="flex items-center gap-1.5">
            <dt className="text-gray-400">Время на вопрос:</dt>
            <dd className="font-medium text-gray-800">
              {test.questionTime} сек
            </dd>
          </div>
        </dl>
      </div>

      {error && (
        <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {canStart ? (
          <Link
            href={`/test/${test.id}`}
            className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
          >
            Начать тест
          </Link>
        ) : (
          <span
            className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-400"
            title="Добавьте вопросы, чтобы начать тест"
          >
            Начать тест
          </span>
        )}

        <Link
          href={`/edit/${test.id}`}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          Редактировать
        </Link>

        <div className="ml-auto">
          {confirming ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-60"
              >
                {deleting ? "Удаление…" : "Удалить?"}
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                disabled={deleting}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                Отмена
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="rounded-lg border border-transparent px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
            >
              Удалить
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
