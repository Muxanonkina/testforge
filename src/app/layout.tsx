import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Тестер с таймером",
  description:
    "Создавайте тесты, добавляйте вопросы и проходите их с таймером обратного отсчёта.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <header className="border-b border-gray-200 bg-white">
          <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-lg font-semibold text-gray-900"
            >
              <span
                aria-hidden
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white"
              >
                Т
              </span>
              Тестер с таймером
            </Link>
            <Link
              href="/create"
              className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
            >
              Создать тест
            </Link>
          </div>
        </header>
        <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
          {children}
        </main>
        <footer className="border-t border-gray-200 bg-white">
          <div className="mx-auto max-w-4xl px-4 py-4 text-center text-xs text-gray-500">
            Данные сохраняются локально в файле data/tests.json
          </div>
        </footer>
      </body>
    </html>
  );
}
