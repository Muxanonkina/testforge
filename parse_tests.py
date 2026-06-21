#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Парсер docx с тестами: вытаскивает вопросы и варианты ответов."""
import re
import sys
import docx

# маркер начала вопроса: 1-3 цифры, затем . или )
Q_RE = re.compile(r'^\s*(\d{1,3})\s*[.\)]\s*(.*)$')
# маркер варианта ответа: одна буква (лат/кир) затем ) или .
A_RE = re.compile(r'^\s*([A-EА-ЕЁ])\s*[\)\.]\s*(.*)$', re.IGNORECASE)


def extract_lines(path):
    doc = docx.Document(path)
    lines = []
    for p in doc.paragraphs:
        # каждый абзац может содержать внутренние \n
        for raw in p.text.split('\n'):
            s = raw.strip()
            lines.append(s)
    return lines


def new_q(questions, num, text):
    cur = {'num': num, 'q': text.strip(), 'ans_letter': '', 'ans_text': ''}
    questions.append(cur)
    return cur


def parse(path):
    lines = extract_lines(path)
    questions = []  # список словарей {num, q, ans_letter, ans_text}
    cur = None
    mode = None          # 'q' или 'a'
    answer_done = False  # после ответа встретилась пустая строка -> ответ завершён
    for s in lines:
        if not s:
            # пустая строка: если мы внутри ответа — помечаем, что ответ завершён
            if mode == 'a' and cur is not None and cur['ans_text']:
                answer_done = True
            continue
        mq = Q_RE.match(s)
        ma = A_RE.match(s)
        # маркер ответа (одна буква + ) или .)
        if ma and ma.group(1):
            if cur is None:
                continue
            # если у текущего вопроса уже есть ответ — значит это ответ нового
            # (безномерного) вопроса, текст которого накопился после пустой строки
            cur['ans_letter'] = ma.group(1).upper()
            cur['ans_text'] = ma.group(2).strip()
            mode = 'a'
            answer_done = False
            continue
        if mq:
            cur = new_q(questions, int(mq.group(1)), mq.group(2))
            mode = 'q'
            answer_done = False
            continue
        # обычный текст
        if cur is None:
            # текст в самом начале файла — это первый безномерный вопрос
            cur = new_q(questions, None, s)
            mode = 'q'
            continue
        if mode == 'q':
            cur['q'] = (cur['q'] + ' ' + s).strip()
        elif mode == 'a':
            if answer_done:
                # ответ уже завершён пустой строкой -> начинается новый безномерный вопрос
                cur = new_q(questions, None, s)
                mode = 'q'
                answer_done = False
            else:
                cur['ans_text'] = (cur['ans_text'] + ' ' + s).strip()
    # убираем вопросы без ответа и без текста
    questions = [q for q in questions if q['q'] and q['ans_text']]
    return questions


if __name__ == '__main__':
    path = sys.argv[1]
    qs = parse(path)
    print(f'Файл: {path}  — найдено вопросов: {len(qs)}')
    print('=' * 70)
    for i, q in enumerate(qs, 1):
        print(f"{i}. {q['q']}")
        print(f"   [{q['ans_letter']}] {q['ans_text']}")
        print(f"   (orig#={q['num']})")
        print('-' * 40)
