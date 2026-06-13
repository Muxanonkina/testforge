"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { Test, Question, QuestionTime } from "@/types/test";
import { QUESTION_TIMES } from "@/types/test";
import { fetchTest, updateTest } from "@/lib/api";
import { newId } from "@/lib/id";
import QuestionForm, { type QuestionFormValue } from "@/components/QuestionForm";
import QuestionCard from "@/components/QuestionCard";

export default function EditTestPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [test, setTest] = useState<Test | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [questionTime, setQuestionTime] = useState<QuestionTime>(30);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  // Загрузка теста.
  useEffect(() => {
    let active = true;
    fetchTest(id)
      .then((data) => {
        if (!active) return;
        setTest(data);
        setTitle(data.title);
        setQuestionTime(data.questionTime);
      })
      .catch((e) => {
        if (active)
          setLoadError(e instanceof Error ? e.message : "Ошибка загрузки");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  const editingQuestion = useMemo(
    () => test?.questions.find((q) => q.id === editingId) ?? null,
    [test, editingId],
  );

  /** Сохранение теста на сервере (в data/tests.json). */
  async function persist(next: {
    title?: string;
    questionTime?: QuestionTime;
    questions?: Question[];
  }) {
    if (!test) return;
    setSaving(true);
    setSaveError(null);
    try {
      const updated = await updateTest(test.id, {
        title: next.title ?? title,
        questionTime: next.questionTime ?? questionTime,
        questions: next.questions ?? test.questions,
      });
      setTest(updated);
      setTitle(updated.title);
      setQuestionTime(updated.questionTime);
      setSavedAt(Date.now());
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Не удалось сохранить");
    } finally {
      setSaving(false);
    }
  }

  function handleAddOrUpdate(value: QuestionFormValue) {
    if (!test) return;
    if (editingId) {
      const questions = test.questions.map((q) =>
        q.id === editingId ? { ...q, ...value } : q,
      );
      setEditingId(null);
      void persist({ questions });
    } else {
      const question: Question = { id: newId(), ...value };
      void persist({ questions: [...test.questions, question] });
    }
  }

  function handleDeleteQuestion(qid: string) {
    if (!test) return;
    if (editingId === qid) setEditingId(null);
    void persist({ questions: test.questions.filter((q) => q.id !== qid) });
  }

  function handleSaveSettings() {
    void persist({ title, questionTime });
  }

  if (loading) {
    return <div className="text-center text-gray-500">Загрузка теста…</div>;
  }

  if (loadError || !test) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-red-700">{loadError ?? "Тест не найден"}</p>
        <Link
          href="/"
          className="mt-4 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          На главную
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/"
            className="text-sm text-gray-500 transition-colors hover:text-gray-700"
          >
            ← Назад к тестам
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">
            Редактор вопросов
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {saving && <span className="text-sm text-gray-400">Сохранение…</span>}
          {!saving && savedAt && (
            <span className="text-sm text-green-600">Сохранено ✓</span>
          )}
          {test.questions.length > 0 && (
            <Link
              href={`/test/${test.id}`}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
            >
              Начать тест
            </Link>
          )}
        </div>
      </div>

      {saveError && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {saveError}
        </p>
      )}

      {/* Настройки теста */}
      <section className="mt-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900">Настройки теста</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="edit-title"
              className="block text-sm font-medium text-gray-700"
            >
              Название теста
            </label>
            <input
              id="edit-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />
          </div>
          <div>
            <span className="block text-sm font-medium text-gray-700">
              Время на вопрос
            </span>
            <div className="mt-1 grid grid-cols-3 gap-2">
              {QUESTION_TIMES.map((time) => {
                const active = questionTime === time;
                return (
                  <button
                    key={time}
                    type="button"
                    onClick={() => setQuestionTime(time)}
                    className={`rounded-lg border px-2 py-2 text-sm font-medium transition-colors ${
                      active
                        ? "border-indigo-600 bg-indigo-600 text-white"
                        : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {time} сек
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={handleSaveSettings}
          disabled={saving}
          className="mt-4 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-60"
        >
          Сохранить настройки
        </button>
      </section>

      {/* Форма добавления/редактирования вопроса */}
      <section className="mt-6">
        <QuestionForm
          key={editingId ?? "new"}
          initial={editingQuestion}
          onSubmit={handleAddOrUpdate}
          onCancel={editingId ? () => setEditingId(null) : undefined}
        />
      </section>

      {/* Список вопросов */}
      <section className="mt-8">
        <h2 className="text-base font-semibold text-gray-900">
          Вопросы ({test.questions.length})
        </h2>
        {test.questions.length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-500">
            Пока нет вопросов. Добавьте первый вопрос выше.
          </p>
        ) : (
          <div className="mt-3 space-y-3">
            {test.questions.map((q, index) => (
              <QuestionCard
                key={q.id}
                question={q}
                index={index}
                onEdit={() => {
                  setEditingId(q.id);
                  if (typeof window !== "undefined") {
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }
                }}
                onDelete={() => handleDeleteQuestion(q.id)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
