// /api/tests/[id] — получение, обновление и удаление одного теста.
import { NextResponse } from "next/server";
import { getTestById, updateTest, deleteTest } from "@/lib/storage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const test = await getTestById(id);
  if (!test) {
    return NextResponse.json({ error: "Тест не найден" }, { status: 404 });
  }
  return NextResponse.json({ test });
}

export async function PUT(request: Request, context: RouteContext) {
  const { id } = await context.params;

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

  const updated = await updateTest(id, { title, questionTime, questions });
  if (!updated) {
    return NextResponse.json({ error: "Тест не найден" }, { status: 404 });
  }
  return NextResponse.json({ test: updated });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const ok = await deleteTest(id);
  if (!ok) {
    return NextResponse.json({ error: "Тест не найден" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
