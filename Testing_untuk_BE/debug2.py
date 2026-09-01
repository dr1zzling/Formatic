import zipfile, re

PATH = '/home/erzy/Downloads/soal-templatetes.docx'

def decode(s):
    return (s.replace('&amp;','&').replace('&lt;','<')
             .replace('&gt;','>').replace('&quot;','"').replace('&apos;',"'"))

with zipfile.ZipFile(PATH) as z:
    xml = z.read('word/document.xml').decode('utf-8', errors='replace')

paras = re.findall(r'<w:p[ >][\s\S]*?</w:p>', xml)

# Show paras 84-93 (JS code block with blank line)
for i in range(84, 94):
    p = paras[i]
    parts = re.findall(r'<w:t[^>]*>([^<]*)</w:t>', p)
    t = decode(''.join(parts).strip())
    is_code = bool(re.search(r'w:ascii="(?:Courier New|Courier|Consolas)"', p, re.I))
    has_img = 'r:embed=' in p
    numId = re.search(r'<w:numId[^>]*w:val="(\d+)"', p)
    print(f'[{i}] code={is_code} img={has_img} numId={numId.group(1) if numId else None} text={repr(t[:70])}')
