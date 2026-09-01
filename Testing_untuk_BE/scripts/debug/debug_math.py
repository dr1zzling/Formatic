import zipfile, re

PATH = '/home/erzy/Downloads/soal-templatetes.docx'

def decode(s):
    return (s.replace('&amp;','&').replace('&lt;','<')
             .replace('&gt;','>').replace('&quot;','"').replace('&apos;',"'"))

with zipfile.ZipFile(PATH) as z:
    xml = z.read('word/document.xml').decode('utf-8', errors='replace')

paras = re.findall(r'<w:p[ >][\s\S]*?</w:p>', xml)

# Soal 6-10 adalah soal rumus (index 30-71)
print("=== Paragraf soal rumus (6-10), cek font dan style ===\n")
for i in range(30, 72):
    p = paras[i]
    parts = re.findall(r'<w:t[^>]*>([^<]*)</w:t>', p)
    t = decode(''.join(parts).strip())
    if not t: continue
    
    # Cek semua font yang digunakan
    fonts = re.findall(r'<w:rFonts[^/]*/>', p)
    # Cek italic/bold
    is_italic = bool(re.search(r'<w:i/>', p))
    is_bold   = bool(re.search(r'<w:b/>', p))
    # Cek style paragraph
    pstyle = re.search(r'<w:pStyle[^>]*w:val="([^"]+)"', p)
    # Cek color
    colors = re.findall(r'<w:color[^>]*w:val="([^"]+)"', p)
    
    info = []
    if fonts: info.append(f"fonts={fonts}")
    if is_italic: info.append("italic")
    if is_bold: info.append("bold")
    if pstyle: info.append(f"style={pstyle.group(1)}")
    if colors: info.append(f"color={colors}")
    
    print(f"[{i:03d}] {repr(t[:70])}")
    if info: print(f"       -> {' | '.join(info)}")

print("\n=== Cek semua paragraf yang ada Symbol/Math/Cambria Math font ===")
for i, p in enumerate(paras):
    if re.search(r'Cambria Math|Symbol|MathType|Euclid|Times New Roman', p, re.I):
        parts = re.findall(r'<w:t[^>]*>([^<]*)</w:t>', p)
        t = decode(''.join(parts).strip())
        print(f"[{i:03d}] MATH-FONT: {repr(t[:80])}")
