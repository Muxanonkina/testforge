"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Test } from "@/types/test";
import { fetchTests } from "@/lib/api";
import TestCard from "@/components/TestCard";

export default function HomePage() {
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetchTests()
      .then((data) => {
        if (active) setTests(data);
      })
      .catch((e) => {
        if (active) setError(e instanceof Error ? e.message : "Ошибка загрузки");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  function handleDeleted(id: string) {
    setTests((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Мои тесты</h1>
        <Link
          href="/create"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
        >
          Создать новый тест
        </Link>
      </div>

      {loading && (
        <div className="mt-10 text-center text-gray-500">Загрузка тестов…</div>
      )}

      {error && !loading && (
        <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {!loading && !error && tests.length === 0 && (
        <div className="mt-10 rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
          <p className="text-gray-600">Пока нет ни одного теста.</p>
          <Link
            href="/create"
            className="mt-4 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
          >
            Создать первый тест
          </Link>
        </div>
      )}

      {!loading && !error && tests.length > 0 && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {tests.map((test) => (
            <TestCard key={test.id} test={test} onDeleted={handleDeleted} />
          ))}
        </div>
      )}
    </div>
  );
}
