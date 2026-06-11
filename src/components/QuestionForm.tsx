"use client";

import { useEffect, useState } from "react";
import type { AnswerKey, AnswerOptions, Question } from "@/types/test";

export interface QuestionFormValue {
  question: string;
  options: AnswerOptions;
  correctAnswer: AnswerKey;
}

interface QuestionFormProps {
  /** Если задан — форма работает в режиме редактирования. */
  initial?: Question | null;
  onSubmit: (value: QuestionFormValue) => void;
  onCancel?: () => void;
}

const BASE_KEYS: AnswerKey[] = ["A", "B", "C", "D"];

function emptyOptions(): Record<AnswerKey, string> {
  return { A: "", B: "", C: "", D: "", E: "" };
}

/** Форма создания и редактирования вопроса. */
export default function QuestionForm({
  initial,
  onSubmit,
  onCancel,
}: QuestionFormProps) {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<Record<AnswerKey, string>>(
    emptyOptions(),
  );
  const [hasE, setHasE] = useState(false);
  const [correctAnswer, setCorrectAnswer] = useState<AnswerKey>("A");
  const [error, setError] = useState<string | null>(null);

  // Загрузка значений при редактировании / сброс при создании.
  useEffect(() => {
    if (initial) {
      setQuestion(initial.question);
      setOptions({
        A: initial.options.A ?? "",
        B: initial.options.B ?? "",
        C: initial.options.C ?? "",
        D: initial.options.D ?? "",
        E: initial.options.E ?? "",
      });
      setHasE(initial.options.E !== undefined);
      setCorrectAnswer(initial.correctAnswer);
    } else {
      setQuestion("");
      setOptions(emptyOptions());
      setHasE(false);
      setCorrectAnswer("A");
    }
    setError(null);
  }, [initial]);

  const activeKeys: AnswerKey[] = hasE ? [...BASE_KEYS, "E"] : BASE_KEYS;

  function setOption(key: AnswerKey, value: string) {
    setOptions((prev) => ({ ...prev, [key]: value }));
  }

  function handleToggleE() {
    if (hasE) {
      // Снимаем вариант E; если он был правильным — переносим на A.
      setHasE(false);
      setOption("E", "");
      if (correctAnswer === "E") setCorrectAnswer("A");
    } else {
      setHasE(true);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!question.trim()) {
      setError("Введите текст вопроса.");
      return;
    }
    for (const key of activeKeys) {
      if (!options[key].trim()) {
        setError(`Заполните вариант ответа ${key}.`);
        return;
      }
    }

    const result: AnswerOptions = {
      A: options.A.trim(),
      B: options.B.trim(),
      C: options.C.trim(),
      D: options.D.trim(),
    };
    if (hasE && options.E.trim()) {
      result.E = options.E.trim();
    }

    onSubmit({
      question: question.trim(),
      options: result,
      correctAnswer,
    });

    // После сохранения в режиме создания очищаем форму.
    if (!initial) {
      setQuestion("");
      setOptions(emptyOptions());
      setHasE(false);
      setCorrectAnswer("A");
    }
    setError(null);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
    >
      <h2 className="text-base font-semibold text-gray-900">
        {initial ? "Редактирование вопроса" : "Новый вопрос"}
      </h2>

      <div className="mt-4">
        <label
          htmlFor="question-text"
          className="block text-sm font-medium text-gray-700"
        >
          Текст вопроса
        </label>
        <textarea
          id="question-text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={3}
          className="mt-1 w-full resize-y rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          placeholder="Введите вопрос…"
        />
      </div>

      <fieldset className="mt-4">
        <legend className="text-sm font-medium text-gray-700">
          Варианты ответов
        </legend>
        <p className="mt-1 text-xs text-gray-500">
          Отметьте кружком правильный вариант.
        </p>
        <div className="mt-2 space-y-2">
          {activeKeys.map((key) => (
            <div key={key} className="flex items-center gap-2">
              <input
                type="radio"
                name="correctAnswer"
                aria-label={`Отметить вариант ${key} правильным`}
                checked={correctAnswer === key}
                onChange={() => setCorrectAnswer(key)}
                className="h-4 w-4 shrink-0 accent-indigo-600"
              />
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gray-100 text-sm font-semibold text-gray-700">
                {key}
              </span>
              <input
                type="text"
                value={options[key]}
                onChange={(e) => setOption(key, e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                placeholder={`Ответ ${key}`}
              />
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={handleToggleE}
          className="mt-3 text-sm font-medium text-indigo-600 hover:text-indigo-700"
        >
          {hasE ? "− Убрать вариант E" : "+ Добавить вариант E"}
        </button>
      </fieldset>

      {error && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mt-5 flex items-center gap-2">
        <button
          type="submit"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
        >
          Сохранить вопрос
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Отмена
          </button>
        )}
      </div>
    </form>
  );
}
