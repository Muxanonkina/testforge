import zipfile
import xml.etree.ElementTree as ET
import re
import json
import uuid
import random

# Set random seed for deterministic test generation if needed, or leave it random.
# We'll use a fixed seed to make it reproducible if we run it multiple times.
random.seed(42)

def parse_docx_to_struct(filename):
    ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
    
    with zipfile.ZipFile(filename) as docx:
        xml_content = docx.read('word/document.xml')
        root = ET.fromstring(xml_content)
        
        paragraphs = root.findall('.//w:p', ns)
        
        parsed_paragraphs = []
        for idx, p in enumerate(paragraphs):
            p_text = []
            has_yellow_highlight = False
            for r in p.findall('.//w:r', ns):
                rPr = r.find('w:rPr', ns)
                if rPr is not None:
                    highlight = rPr.find('w:highlight', ns)
                    if highlight is not None:
                        val = highlight.get(f'{{{ns["w"]}}}val')
                        if val in ['yellow', 'darkCyan']:
                            has_yellow_highlight = True
                for t in r.findall('.//w:t', ns):
                    if t.text:
                        p_text.append(t.text)
            
            text = ''.join(p_text).strip()
            if text:
                parsed_paragraphs.append({
                    'idx': idx,
                    'text': text,
                    'is_highlighted': has_yellow_highlight
                })
    return parsed_paragraphs

def build_questions_improved(parsed_paragraphs):
    # Option prefixes: A), B), C), D), etc. Supporting Cyrillic & Latin
    option_regex = re.compile(r'^([АБСДЕГa-gа-яA-G])[\)\.\s]', re.IGNORECASE)
    # Question number pattern: e.g. "303.", "22.", "222."
    q_num_regex = re.compile(r'^(\d+)[\.\s]')
    
    questions = []
    current_q = None
    
    for item in parsed_paragraphs:
        text = item['text']
        is_opt = option_regex.match(text)
        is_q_num = q_num_regex.match(text)
        
        if is_opt:
            opt_letter = option_regex.match(text).group(1).upper()
            
            # Clean up the text: remove option prefix (e.g. "А) ")
            prefix_len = 0
            for idx, ch in enumerate(text):
                if ch in [')', '.'] or ch.isspace():
                    prefix_len = idx + 1
                    while prefix_len < len(text) and text[prefix_len].isspace():
                        prefix_len += 1
                    break
            opt_content = text[prefix_len:]
            
            if current_q is not None:
                current_q['options'].append({
                    'letter': opt_letter,
                    'text': opt_content,
                    'is_highlighted': item['is_highlighted']
                })
            else:
                print(f"Warning: Orphan option at paragraph {item['idx']}: {text}")
        else:
            # It's not an option
            if is_q_num:
                # Starts a new question even if highlighted, because it starts with a question number
                if current_q is not None:
                    questions.append(current_q)
                current_q = {
                    'idx': item['idx'],
                    'question_parts': [text],
                    'options': [],
                    'direct_answers': [],
                    'additional_info': []
                }
            elif item['is_highlighted']:
                # Highlighted paragraph that does not start with a question number or option prefix
                if current_q is not None:
                    current_q['direct_answers'].append(text)
                else:
                    print(f"Warning: Orphan highlighted text at paragraph {item['idx']}: {text}")
            else:
                # Unhighlighted paragraph, does not start with a question number
                is_new = False
                if current_q is None:
                    is_new = True
                elif current_q['options'] or current_q['direct_answers']:
                    is_new = True
                elif text == 'ххх':
                    is_new = True
                
                if is_new:
                    if current_q is not None:
                        questions.append(current_q)
                    current_q = {
                        'idx': item['idx'],
                        'question_parts': [text],
                        'options': [],
                        'direct_answers': [],
                        'additional_info': []
                    }
                else:
                    current_q['question_parts'].append(text)
                    
    if current_q is not None:
        questions.append(current_q)
        
    for q in questions:
        q['question'] = ' '.join(q['question_parts'])
        
    return questions

def generate_json_file(docx_path, output_path):
    parsed_paras = parse_docx_to_struct(docx_path)
    raw_questions = build_questions_improved(parsed_paras)
    
    processed_questions = []
    
    # Pool for direct Q&A answers to be used as distractors
    qa_answers_pool = []
    for rq in raw_questions:
        # Filter out headers and invalid placeholders
        if rq['question'] == 'Тест' or rq['question'] == 'ххх':
            continue
        # If it's a direct Q&A question
        if not rq['options'] and rq['direct_answers']:
            qa_answers_pool.extend(rq['direct_answers'])
            
    # Remove duplicates from the distractor pool
    qa_answers_pool = list(set(qa_answers_pool))
    
    # Map from Cyrillic options to Latin A, B, C, D
    option_map = {
        'А': 'A', 'A': 'A',
        'Б': 'B', 'B': 'B',
        'С': 'C', 'C': 'C',
        'Д': 'D', 'D': 'D',
        'Г': 'D', 'D': 'D', # Map G/Г to D as well
    }
    
    for rq in raw_questions:
        # Clean question text (remove leading number if present, e.g. "246. ")
        q_text = rq['question']
        q_text = re.sub(r'^\d+[\.\s]+', '', q_text).strip()
        
        if q_text == 'Тест' or q_text == 'ххх' or not q_text:
            continue
            
        q_id = str(uuid.uuid4())
        
        # Scenario 1: Multiple Choice Question (already has 4 options)
        if len(rq['options']) >= 4:
            options_dict = {}
            correct_ans = None
            
            # Special case for question 222
            is_q222 = "номақбул далилларга асосланиш мумкин эмас" in q_text
            
            for opt in rq['options'][:4]:
                letter = option_map.get(opt['letter'], 'A')
                options_dict[letter] = opt['text']
                if opt['is_highlighted']:
                    correct_ans = letter
            
            # Special case fallback for question 222
            if is_q222:
                for letter, text in options_dict.items():
                    if "Ҳар қандай қарор" in text:
                        correct_ans = letter
                        break
            
            if not correct_ans:
                # If no highlighted option found, default to A
                correct_ans = 'A'
                
            processed_questions.append({
                'id': q_id,
                'question': q_text,
                'options': {
                    'A': options_dict.get('A', '-'),
                    'B': options_dict.get('B', '-'),
                    'C': options_dict.get('C', '-'),
                    'D': options_dict.get('D', '-')
                },
                'correctAnswer': correct_ans
            })
            
        # Scenario 2: Direct Q&A or Question with 1 option
        else:
            # Get correct answer text
            if rq['direct_answers']:
                correct_answer_text = rq['direct_answers'][0]
            elif rq['options']:
                correct_answer_text = rq['options'][0]['text']
            else:
                # No answer found in docx, skip
                continue
                
            # Pick 3 random distractors from the pool
            distractors = [ans for ans in qa_answers_pool if ans != correct_answer_text]
            if len(distractors) < 3:
                distractors = ["Нотўғри жавоб 1", "Нотўғри жавоб 2", "Нотўғри жавоб 3"]
            else:
                distractors = random.sample(distractors, 3)
                
            # Create list of 4 choices, shuffle them
            choices = [correct_answer_text] + distractors
            random.shuffle(choices)
            
            # Find the new index of the correct answer
            correct_index = choices.index(correct_answer_text)
            correct_letter = ['A', 'B', 'C', 'D'][correct_index]
            
            processed_questions.append({
                'id': q_id,
                'question': q_text,
                'options': {
                    'A': choices[0],
                    'B': choices[1],
                    'C': choices[2],
                    'D': choices[3]
                },
                'correctAnswer': correct_letter
            })
            
    # Create final Test structure
    test_id = str(uuid.uuid4())
    test_data = {
        'tests': [
            {
                'id': test_id,
                'title': 'Энг сўнгги тестлар',
                'questionTime': 30,
                'questions': processed_questions
            }
        ]
    }
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(test_data, f, ensure_ascii=False, indent=2)
        
    print(f"Successfully processed {len(processed_questions)} questions.")
    print(f"Output saved to {output_path}")

if __name__ == '__main__':
    docx_path = '/home/muxa/Desktop/testforge/Энг Сўнгиси1.docx'
    output_json_path = '/home/muxa/Desktop/testforge/data/test.json'
    generate_json_file(docx_path, output_json_path)
