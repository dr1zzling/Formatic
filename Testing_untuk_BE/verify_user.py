"""Simulasi parser importDocx dengan file user asli"""
import zipfile, re

PATH = '/home/erzy/Downloads/soal-templatetes.docx'

def decode(s):
    return (s.replace('&amp;','&').replace('&lt;','<')
             .replace('&gt;','>').replace('&quot;','"').replace('&apos;',"'"))

def get_text(xml):
    parts = re.findall(r'<w:t[^>]*>([^<]*)</w:t>', xml)
    return decode(''.join(parts).strip())

def is_code_para(xml):
    return bool(re.search(r'w:ascii="(?:Courier New|Courier|Consolas|Lucida Console|Monaco|Monospace)"', xml, re.I))

def get_numbering(xml):
    num  = re.search(r'<w:numId[^>]*w:val="(\d+)"', xml)
    ilvl = re.search(r'<w:ilvl[^>]*w:val="(\d+)"', xml)
    return (num.group(1) if num else None, ilvl.group(1) if ilvl else None)

with zipfile.ZipFile(PATH) as z:
    xml = z.read('word/document.xml').decode('utf-8', errors='replace')

paras = re.findall(r'<w:p[ >][\s\S]*?</w:p>', xml)

questions = []
current = None
code_buffer = []

def flush_code():
    global code_buffer
    # Trim trailing blanks
    while code_buffer and code_buffer[-1] == '':
        code_buffer.pop()
    if not code_buffer: return None
    block = '```\n' + '\n'.join(code_buffer) + '\n```'
    code_buffer = []
    return block

def finish_q():
    global current
    if not current: return
    answer_keys = [x.strip().upper() for x in (current['answer'] or '').split(',') if x.strip()]
    letters = list('ABCDEFGH')
    for i, opt in enumerate(current['options']):
        opt['is_correct'] = letters[i] in answer_keys if i < len(letters) else False
    if not current['type']:
        current['type'] = 'checkbox' if len(answer_keys) > 1 else ('radio' if current['options'] else 'text')
    questions.append(current)
    current = None

for p in paras:
    text    = get_text(p)
    is_code = is_code_para(p)
    numId, ilvl = get_numbering(p)
    has_img = 'r:embed=' in p

    # Kode → masuk buffer
    if is_code:
        code_buffer.append(text or '')
        continue

    # Blank line di tengah kode → tetap buffer, jangan flush
    if not text and not has_img and code_buffer:
        code_buffer.append('')
        continue

    # Flush code buffer (trim trailing blanks)
    if code_buffer:
        block = flush_code()
        if block and current:
            current['question'] += '\n' + block

    if not text and not has_img: continue

    am = re.search(r'Kunci\s*:\s*([A-Z0-9]+(?:\s*,\s*[A-Z0-9]+)*)', text, re.I)
    tm = re.search(r'Tipe\s*:\s*(radio|checkbox|rating|text|file)', text, re.I)
    if am: text = text.replace(am.group(0), '').strip()
    if tm: text = text.replace(tm.group(0), '').strip()

    if not text and not has_img:
        if current:
            if am: current['answer'] = am.group(1)
            if tm: current['type'] = tm.group(1).lower()
        continue

    is_explicit_q = numId == '1' and ilvl == '0'
    is_explicit_o = (numId == '1' and ilvl == '1') or numId == '2'
    is_manual_q   = bool(re.match(r'^\d+[.\)]', text))
    is_manual_o   = bool(re.match(r'^[a-hA-H][.\)]', text))

    # Soal baru
    if is_explicit_q or (is_manual_q and (not current or current['options'] or current.get('type') is not None)):
        finish_q()
        current = {
            'question': re.sub(r'^\d+[.\)]\s*', '', text),
            'type': tm.group(1).lower() if tm else None,
            'answer': am.group(1) if am else None,
            'options': []
        }
        continue

    if not current:
        current = {'question': text, 'type': tm.group(1).lower() if tm else None,
                   'answer': am.group(1) if am else None, 'options': []}
        continue

    if am: current['answer'] = am.group(1)
    if tm: current['type'] = tm.group(1).lower()

    # Opsi
    if is_explicit_o or is_manual_o:
        val = re.sub(r'^[a-hA-H][.\)]\s*', '', text) if is_manual_o else text
        current['options'].append({'value': val, 'is_correct': False})
        continue

    # Lanjutan teks / soal
    if current['options']:
        current['options'][-1]['value'] += '\n' + text if current['options'][-1]['value'] else text
    else:
        current['question'] += '\n' + text

# Flush sisa code buffer
if code_buffer:
    block = flush_code()
    if block and current:
        current['question'] += '\n' + block

finish_q()

print(f'Total soal ter-parse: {len(questions)}\n')
for i, q in enumerate(questions):
    q_preview = q['question'][:100].replace('\n', ' ↵ ')
    print(f'Soal {i+1:2d}: [{q["type"] or "?":8s}] {q_preview}')
    if '```' in q['question']:
        print(f'           ✅ CODE BLOCK')
    for j, o in enumerate(q['options']):
        c = '✓' if o.get('is_correct') else ' '
        val_preview = (o['value'] or '(kosong)')[:60]
        print(f'   [{c}] {chr(65+j)}: {val_preview}')
    print()
