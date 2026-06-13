// Вспомогательные функции для работы с вопросами и подсчётом результатов.
import type { Question, Test, AnswerKey, TestResult } from "@/types/test";
import { ANSWER_KEYS } from "@/types/test";

/** Возвращает пары [ключ, текст] только для существующих вариантов ответа. */
export function getOptionEntries(question: Question): [AnswerKey, string][] {
  return ANSWER_KEYS.filter(
    (key) => question.options[key] !== undefined,
  ).map((key) => [key, question.options[key] as string]);
}

/** Подсчёт результата по карте выбранных ответов (questionId -> ключ | null). */
export function calculateResult(
  test: Test,
  answers: Record<string, AnswerKey | null>,
): TestResult {
  const total = test.questions.length;
  let correct = 0;
  for (const q of test.questions) {
    if (answers[q.id] && answers[q.id] === q.correctAnswer) {
      correct += 1;
    }
  }
  const percent = total > 0 ? Math.round((correct / total) * 100) : 0;
  return { total, correct, percent };
}

/** Человекочитаемое описание времени на вопрос. */
export function formatSeconds(seconds: number): string {
  return `${seconds} сек`;
}
