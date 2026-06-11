// /api/tests — список тестов и создание нового теста.
import { NextResponse } from "next/server";
import { getAllTests, createTest } from "@/lib/storage";

// Данные читаются/пишутся из файла на каждом запросе — отключаем кэш.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const tests = await getAllTests();
  return NextResponse.json({ tests });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный JSON" }, { status: 400 });
  }

  const { title, questionTime, questions } = (body ?? {}) as {
    title?: string;
    questionTime?: number;
    questions?: unknown;
  };

  if (!title || typeof title !== "string" || !title.trim()) {
    return NextResponse.json(
      { error: "Название теста обязательно" },
      { status: 400 },
    );
  }

  const test = await createTest({
    title,
    questionTime: questionTime ?? 30,
    questions,
  });
  return NextResponse.json({ test }, { status: 201 });
}
