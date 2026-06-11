"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { Test, AnswerKey } from "@/types/test";
import { fetchTest } from "@/lib/api";
import { getOptionEntries, calculateResult } from "@/lib/quiz";
import Timer from "@/components/Timer";

export default function TestRunnerPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [test, setTest] = useState<Test | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<AnswerKey | null>(null);
  const [answers, setAnswers] = useState<Record<string, AnswerKey | null>>({});
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    let active = true;
    fetchTest(id)
      .then((data) => {
        if (active) setTest(data);
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

  const total = test?.questions.length ?? 0;
  const currentQuestion = test?.questions[currentIndex] ?? null;
  const optionEntries = useMemo(
    () => (currentQuestion ? getOptionEntries(currentQuestion) : []),
    [currentQuestion],
  );

  /** Зафиксировать ответ на текущий вопрос и перейти дальше. */
  function commitAndAdvance(answer: AnswerKey | null) {
    if (!test || !currentQuestion) return;
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: answer }));
    setSelected(null);
    if (currentIndex + 1 >= total) {
      setFinished(true);
    } else {
      setCurrentIndex((i) => i + 1);
    }
  }

  function handleConfirm() {
    commitAndAdvance(selected);
  }

  function handleTimeout() {
    // Время вышло: засчитывается текущий выбор (или «нет ответа» = неверно).
    commitAndAdvance(selected);
  }

  function restart() {
    setCurrentIndex(0);
    setSelected(null);
    setAnswers({});
    setFinished(false);
  }

  // ---------- Состояния загрузки ----------
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

  if (total === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 text-center">
        <p className="text-gray-600">В этом тесте пока нет вопросов.</p>
        <Link
          href={`/edit/${test.id}`}
          className="mt-4 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Добавить вопросы
        </Link>
      </div>
    );
  }

  // ---------- Страница результатов ----------
  if (finished) {
    const result = calculateResult(test, answers);
    const tone =
      result.percent >= 80
        ? "text-green-600"
        : result.percent >= 50
          ? "text-amber-600"
          : "text-red-600";
    return (
      <div className="mx-auto max-w-md text-center">
        <h1 className="text-2xl font-bold text-gray-900">Результаты</h1>
        <p className="mt-1 text-gray-500">{test.title}</p>

        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className={`text-5xl font-bold ${tone}`}>{result.percent}%</div>
          <p className="mt-3 text-lg text-gray-800">
            Правильных ответов: {result.correct} из {result.total}
          </p>
          <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className={`h-full rounded-full ${
                result.percent >= 80
                  ? "bg-green-500"
                  : result.percent >= 50
                    ? "bg-amber-500"
                    : "bg-red-500"
              }`}
              style={{ width: `${result.percent}%` }}
            />
          </div>
        </div>

        <div className="mt-6 flex justify-center gap-3">
          <button
            type="button"
            onClick={restart}
            className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
          >
            Пройти заново
          </button>
          <Link
            href="/"
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Вернуться на главную
          </Link>
        </div>
      </div>
    );
  }

  // ---------- Прохождение теста ----------
  const progress = ((currentIndex + 1) / total) * 100;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="text-sm text-gray-500 transition-colors hover:text-gray-700"
        >
          ← Выйти
        </Link>
        <span className="text-sm font-medium text-gray-500">
          Вопрос {currentIndex + 1} из {total}
        </span>
      </div>

      {/* Прогресс прохождения */}
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full rounded-full bg-indigo-500 transition-[width] duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mt-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <Timer
          seconds={test.questionTime}
          resetSignal={currentIndex}
          onExpire={handleTimeout}
        />

        <h2 className="mt-5 text-lg font-semibold leading-relaxed text-gray-900">
          {currentQuestion?.question}
        </h2>

        <div className="mt-5 space-y-2.5">
          {optionEntries.map(([key, text]) => {
            const active = selected === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelected(key)}
                className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left text-sm transition-colors ${
                  active
                    ? "border-indigo-600 bg-indigo-50"
                    : "border-gray-200 bg-white hover:border-indigo-300 hover:bg-gray-50"
                }`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sm font-semibold ${
                    active
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {key}
                </span>
                <span className="pt-0.5 text-gray-800">{text}</span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleConfirm}
          disabled={selected === null}
          className="mt-6 w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {currentIndex + 1 >= total ? "Завершить тест" : "Подтвердить ответ"}
        </button>
      </div>
    </div>
  );
}
