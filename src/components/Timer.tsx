"use client";

import { useEffect, useRef, useState } from "react";

interface TimerProps {
  /** Длительность отсчёта в секундах. */
  seconds: number;
  /** Сигнал сброса: при изменении таймер запускается заново (обычно индекс вопроса). */
  resetSignal: number;
  /** Вызывается один раз, когда время истекает. */
  onExpire: () => void;
  /** Поставить таймер на паузу (например, после ответа). */
  paused?: boolean;
}

/**
 * Таймер обратного отсчёта.
 * Запускается автоматически и при каждом изменении resetSignal начинает отсчёт заново.
 */
export default function Timer({
  seconds,
  resetSignal,
  onExpire,
  paused = false,
}: TimerProps) {
  const [remaining, setRemaining] = useState(seconds);
  const onExpireRef = useRef(onExpire);
  const firedRef = useRef(false);

  // Держим актуальную ссылку на колбэк, не перезапуская интервал.
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  // Сброс при смене вопроса.
  useEffect(() => {
    setRemaining(seconds);
    firedRef.current = false;
  }, [resetSignal, seconds]);

  // Тик каждую секунду.
  useEffect(() => {
    if (paused) return;
    if (remaining <= 0) return;

    const id = setInterval(() => {
      setRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [paused, remaining, resetSignal]);

  // Срабатывание по истечении времени (ровно один раз на вопрос).
  useEffect(() => {
    if (remaining === 0 && !firedRef.current && !paused) {
      firedRef.current = true;
      onExpireRef.current();
    }
  }, [remaining, paused]);

  const ratio = seconds > 0 ? remaining / seconds : 0;
  const isLow = remaining <= 5;

  return (
    <div className="w-full">
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="text-gray-500">Осталось времени</span>
        <span
          className={`font-mono text-base font-semibold tabular-nums ${
            isLow ? "text-red-600 animate-pulse-soft" : "text-gray-900"
          }`}
        >
          {remaining} сек
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className={`h-full rounded-full transition-[width] duration-1000 ease-linear ${
            isLow ? "bg-red-500" : "bg-indigo-600"
          }`}
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
    </div>
  );
}
