// Доменные типы приложения "Тестер с таймером".
// Соответствуют структуре данных из технического задания:
//   Test     -> { id, title, questionTime, questions }
//   Question -> { id, question, options, correctAnswer }
//   Options  -> { A, B, C, D (, E) }

/** Ключ варианта ответа. По ТЗ это A–D, плюс опциональный E
 *  для импортированных вопросов, где встречается 5 вариантов. */
export type AnswerKey = "A" | "B" | "C" | "D" | "E";

/** Допустимое время на один вопрос (в секундах). */
export type QuestionTime = 10 | 20 | 30;

/** Варианты ответов. A–D обязательны, E — опционален. */
export interface AnswerOptions {
  A: string;
  B: string;
  C: string;
  D: string;
  E?: string;
}

/** Один вопрос теста. */
export interface Question {
  id: string;
  question: string;
  options: AnswerOptions;
  correctAnswer: AnswerKey;
}

/** Тестовый блок. */
export interface Test {
  id: string;
  title: string;
  questionTime: QuestionTime;
  questions: Question[];
}

/** Формат файла хранилища data/tests.json. */
export interface TestsFile {
  tests: Test[];
}

/** Полный список ключей ответов по порядку. */
export const ANSWER_KEYS: AnswerKey[] = ["A", "B", "C", "D", "E"];

/** Допустимые значения времени на вопрос. */
export const QUESTION_TIMES: QuestionTime[] = [10, 20, 30];

/** Результат прохождения теста. */
export interface TestResult {
  total: number;
  correct: number;
  percent: number;
}

export interface failedQuestion {
  testId: string | null;
  id: string;
  failedAt: string; // ISO дата-время
  questionId: string;
  selectedAnswer: AnswerKey;
  correctAnswer: AnswerKey;
};