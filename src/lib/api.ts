// Клиентские помощники для работы с REST API (/api/tests).
// Используются в клиентских компонентах через fetch.

import type { Test, Question, QuestionTime } from "@/types/test";

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `Ошибка запроса (${res.status})`;
    try {
      const data = await res.json();
      if (data?.error) message = data.error;
    } catch {
      // тело без JSON — оставляем стандартное сообщение
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

/** Получить список всех тестов. */
export async function fetchTests(): Promise<Test[]> {
  const data = await handle<{ tests: Test[] }>(
    await fetch("/api/tests", { cache: "no-store" }),
  );
  return data.tests;
}

/** Получить один тест по id. */
export async function fetchTest(id: string): Promise<Test> {
  const data = await handle<{ test: Test }>(
    await fetch(`/api/tests/${id}`, { cache: "no-store" }),
  );
  return data.test;
}

export interface CreateTestPayload {
  title: string;
  questionTime: QuestionTime;
  questions?: Question[];
}

/** Создать новый тест. */
export async function createTest(payload: CreateTestPayload): Promise<Test> {
  const data = await handle<{ test: Test }>(
    await fetch("/api/tests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  );
  return data.test;
}

export interface UpdateTestPayload {
  title?: string;
  questionTime?: QuestionTime;
  questions?: Question[];
}

/** Обновить существующий тест. */
export async function updateTest(
  id: string,
  payload: UpdateTestPayload,
): Promise<Test> {
  const data = await handle<{ test: Test }>(
    await fetch(`/api/tests/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  );
  return data.test;
}

/** Удалить тест. */
export async function deleteTest(id: string): Promise<void> {
  await handle<{ ok: true }>(
    await fetch(`/api/tests/${id}`, { method: "DELETE" }),
  );
}
