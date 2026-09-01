import zipfile, re

def decode_entities(s):
    return s.replace('&amp;','&').replace('&lt;','<').replace('&gt;','>').replace('&quot;','"').replace('&apos;',"'")

with zipfile.ZipFile('/home/erzy/projekKelompok/FormMaker/Testing_untuk_BE/soal-template.docx') as z:
    xml = z.read('word/document.xml').decode()

paras = re.findall(r'<w:p[ >][\s\S]*?</w:p>', xml)
for i, p in enumerate(paras[16:30], start=16):
    parts = re.findall(r'<w:t[^>]*>([^<]*)</w:t>', p)
    t = decode_entities(''.join(parts).strip())
    if t:
        tm = re.search(r'Tipe\s*:\s*(radio|checkbox|rating|text|file)', t, re.I)
        am = re.search(r'Kunci\s*:\s*([A-Z0-9]+(?:\s*,\s*[A-Z0-9]+)*)', t, re.I)
        is_manual_q = bool(re.match(r'^\d+[.\)]', t))
        is_manual_o = bool(re.match(r'^[a-hA-H][.\)]', t))
        print(f'[{i:02d}] text={repr(t[:60])} | Q={is_manual_q} O={is_manual_o} type={tm} kunci={am}')
