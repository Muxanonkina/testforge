// Серверное хранилище тестов в JSON-файле.
//
// По техническому заданию данные хранились в LocalStorage, однако по
// требованию заказчика вопросы хранятся в .json-файле (data/tests.json).
// Чтение и запись выполняются на сервере через Node.js fs внутри
// API Route Handlers. Это даёт постоянное хранение без БД и сервера приложений.

import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type {
  Test,
  TestsFile,
  Question,
  QuestionTime,
  AnswerOptions,
  AnswerKey,
} from "@/types/test";
import { QUESTION_TIMES, ANSWER_KEYS } from "@/types/test";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "tests.json");

// Простая очередь, чтобы избежать гонок при одновременной записи.
let writeChain: Promise<unknown> = Promise.resolve();

async function ensureFile(): Promise<void> {
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const empty: TestsFile = { tests: [] };
    await fs.writeFile(DATA_FILE, JSON.stringify(empty, null, 2) + "\n", "utf-8");
  }
}

async function readFileRaw(): Promise<TestsFile> {
  await ensureFile();
  const raw = await fs.readFile(DATA_FILE, "utf-8");
  try {
    const parsed = JSON.parse(raw) as Partial<TestsFile>;
    if (!parsed || !Array.isArray(parsed.tests)) {
      return { tests: [] };
    }
    return { tests: parsed.tests as Test[] };
  } catch {
    // Повреждённый файл — не падаем, возвращаем пустой список.
    return { tests: [] };
  }
}

async function writeFileRaw(data: TestsFile): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = DATA_FILE + ".tmp";
  const body = JSON.stringify(data, null, 2) + "\n";
  await fs.writeFile(tmp, body, "utf-8");
  await fs.rename(tmp, DATA_FILE); // атомарная замена
}

/** Сериализует операции записи, чтобы они не перекрывались. */
function enqueueWrite<T>(op: () => Promise<T>): Promise<T> {
  const run = writeChain.then(op, op);
  // Не даём ошибке оборвать цепочку для последующих операций.
  writeChain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

// ---------- Валидация / нормализация входных данных ----------

function clampQuestionTime(value: unknown): QuestionTime {
  const n = Number(value);
  return (QUESTION_TIMES as number[]).includes(n) ? (n as QuestionTime) : 30;
}

function normalizeOptions(input: unknown): AnswerOptions {
  const src = (input ?? {}) as Record<string, unknown>;
  const options: AnswerOptions = {
    A: typeof src.A === "string" ? src.A : "",
    B: typeof src.B === "string" ? src.B : "",
    C: typeof src.C === "string" ? src.C : "",
    D: typeof src.D === "string" ? src.D : "",
  };
  if (typeof src.E === "string" && src.E.trim() !== "") {
    options.E = src.E;
  }
  return options;
}

function normalizeCorrectAnswer(
  value: unknown,
  options: AnswerOptions,
): AnswerKey {
  const key = String(value).toUpperCase() as AnswerKey;
  if (ANSWER_KEYS.includes(key) && (key !== "E" || options.E !== undefined)) {
    return key;
  }
  return "A";
}

function normalizeQuestion(input: unknown): Question {
  const src = (input ?? {}) as Record<string, unknown>;
  const options = normalizeOptions(src.options);
  return {
    id: typeof src.id === "string" && src.id ? src.id : randomUUID(),
    question: typeof src.question === "string" ? src.question : "",
    options,
    correctAnswer: normalizeCorrectAnswer(src.correctAnswer, options),
  };
}

function normalizeQuestions(input: unknown): Question[] {
  if (!Array.isArray(input)) return [];
  return input.map(normalizeQuestion);
}

// ---------- Публичный API хранилища ----------

export async function getAllTests(): Promise<Test[]> {
  const data = await readFileRaw();
  return data.tests;
}

export async function getTestById(id: string): Promise<Test | null> {
  const data = await readFileRaw();
  return data.tests.find((t) => t.id === id) ?? null;
}

export interface CreateTestInput {
  title: string;
  questionTime: QuestionTime | number;
  questions?: unknown;
}

export async function createTest(input: CreateTestInput): Promise<Test> {
  return enqueueWrite(async () => {
    const data = await readFileRaw();
    const test: Test = {
      id: randomUUID(),
      title: (input.title ?? "").trim() || "Новый тест",
      questionTime: clampQuestionTime(input.questionTime),
      questions: normalizeQuestions(input.questions),
    };
    data.tests.push(test);
    await writeFileRaw(data);
    return test;
  });
}

export interface UpdateTestInput {
  title?: string;
  questionTime?: QuestionTime | number;
  questions?: unknown;
}

export async function updateTest(
  id: string,
  input: UpdateTestInput,
): Promise<Test | null> {
  return enqueueWrite(async () => {
    const data = await readFileRaw();
    const index = data.tests.findIndex((t) => t.id === id);
    if (index === -1) return null;

    const current = data.tests[index];
    const updated: Test = {
      ...current,
      title:
        input.title !== undefined
          ? input.title.trim() || current.title
          : current.title,
      questionTime:
        input.questionTime !== undefined
          ? clampQuestionTime(input.questionTime)
          : current.questionTime,
      questions:
        input.questions !== undefined
          ? normalizeQuestions(input.questions)
          : current.questions,
    };
    data.tests[index] = updated;
    await writeFileRaw(data);
    return updated;
  });
}

export async function deleteTest(id: string): Promise<boolean> {
  return enqueueWrite(async () => {
    const data = await readFileRaw();
    const next = data.tests.filter((t) => t.id !== id);
    if (next.length === data.tests.length) return false;
    await writeFileRaw({ tests: next });
    return true;
  });
}
