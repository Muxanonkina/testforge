"use client";

import type { Question } from "@/types/test";
import { getOptionEntries } from "@/lib/quiz";

interface QuestionCardProps {
  question: Question;
  index: number;
  onEdit?: () => void;
  onDelete?: () => void;
}

/** Карточка вопроса в списке редактора. */
export default function QuestionCard({
  question,
  index,
  onEdit,
  onDelete,
}: QuestionCardProps) {
  const entries = getOptionEntries(question);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-semibold text-gray-900">
          <span className="text-gray-400">№{index + 1}.</span> {question.question}
        </h3>
        <div className="flex shrink-0 gap-1">
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="rounded-md px-2 py-1 text-xs font-medium text-indigo-600 transition-colors hover:bg-indigo-50"
            >
              Изменить
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="rounded-md px-2 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
            >
              Удалить
            </button>
          )}
        </div>
      </div>

      <ul className="mt-3 space-y-1.5">
        {entries.map(([key, text]) => {
          const isCorrect = key === question.correctAnswer;
          return (
            <li
              key={key}
              className={`flex items-start gap-2 rounded-md px-2 py-1 text-sm ${
                isCorrect
                  ? "bg-green-50 text-green-800"
                  : "text-gray-700"
              }`}
            >
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded text-xs font-semibold ${
                  isCorrect
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {key}
              </span>
              <span className="break-words">{text}</span>
              {isCorrect && (
                <span className="ml-auto shrink-0 text-xs font-medium text-green-700">
                  ✓ верный
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
