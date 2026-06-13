// Генерация уникальных идентификаторов на клиенте.
// Использует crypto.randomUUID при наличии, иначе — запасной вариант.
export function newId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
