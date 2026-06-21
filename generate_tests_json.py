#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Конвертация переформатированных тестов в data/generated_tests.json.

Каждый исходный .docx -> отдельный "test".
В каждом вопросе исходник содержит только ОДИН (правильный) вариант.
Недостающие 3 варианта берутся из ответов ДРУГИХ вопросов того же файла
(детерминированный сдвиг: i+1, i+2, ...), правильный ответ остаётся на своей
букве, она же записывается в correctAnswer.
"""
import json
import re
import uuid
from format_tests import clean_q, clean_a
from parse_tests import parse

FILES = [
    ('59.docx', 'Тестлар 59'),
    ('60-123.docx', 'Тестлар 60-123'),
    ('123-182.docx', 'Тестлар 123-182'),
    ('182-258.docx', 'Тестлар 182-258'),
    ('182-258 (2).docx', 'Тестлар 182-258 (2)'),
    ('259-323.docx', 'Тестлар 259-323'),
    ('259-332.docx', 'Тестлар 259-332'),
    ('333-400.docx', 'Тестлар 333-400'),
    ('401-461.docx', 'Тестлар 401-461'),
]

LETTER_MAP = {  # нормализация кириллицы в латиницу
    'А': 'A', 'В': 'B', 'С': 'C', 'Е': 'E', 'Ё': 'E',
    'A': 'A', 'B': 'B', 'C': 'C', 'D': 'D', 'E': 'E',
}
BASE_LETTERS = ['A', 'B', 'C', 'D']


def norm_letter(ltr):
    return LETTER_MAP.get(ltr.upper(), 'A') if ltr else 'A'


def build_test(path, title):
    qs = parse(path)
    # тексты правильных ответов всех вопросов (для пула дистракторов)
    answers = [clean_a(q['ans_text']) for q in qs]
    n = len(qs)
    questions = []
    for i, q in enumerate(qs):
        correct_text = clean_a(q['ans_text'])
        correct_letter = norm_letter(q['ans_letter'])

        # буквы, которые надо заполнить дистракторами
        letters = list(BASE_LETTERS)
        if correct_letter not in letters:
            # редкий случай 'E' -> делаем 5 вариантов, A-D = дистракторы
            fill_letters = list(BASE_LETTERS)
        else:
            fill_letters = [l for l in BASE_LETTERS if l != correct_letter]

        # собираем дистракторы сдвигом по соседним вопросам
        distractors = []
        used = {correct_text}
        j = 1
        while len(distractors) < len(fill_letters) and j <= n:
            cand = answers[(i + j) % n]
            if cand and cand not in used:
                distractors.append(cand)
                used.add(cand)
            j += 1
        # подстраховка, если вдруг не хватило уникальных
        k = 1
        while len(distractors) < len(fill_letters):
            distractors.append(f'Вариант {k}')
            k += 1

        options = {}
        options[correct_letter] = correct_text
        for ltr, dis in zip(fill_letters, distractors):
            options[ltr] = dis

        # упорядочиваем ключи A,B,C,D(,E)
        ordered = {}
        for ltr in ['A', 'B', 'C', 'D', 'E']:
            if ltr in options:
                ordered[ltr] = options[ltr]

        questions.append({
            'id': str(uuid.uuid4()),
            'question': clean_q(q['q']),
            'options': ordered,
            'correctAnswer': correct_letter,
        })

    return {
        'id': str(uuid.uuid4()),
        'title': title,
        'questionTime': 30,
        'questions': questions,
    }


def main():
    tests = []
    for path, title in FILES:
        t = build_test(path, title)
        tests.append(t)
        print(f'{title:24s} -> {len(t["questions"])} вопросов')
    data = {'tests': tests}
    out = 'data/generated_tests.json'
    with open(out, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    total = sum(len(t['questions']) for t in tests)
    print('-' * 40)
    print(f'Тестов: {len(tests)}, вопросов всего: {total}')
    print(f'Сохранено: {out}')


if __name__ == '__main__':
    main()
