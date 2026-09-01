import zipfile, re

with zipfile.ZipFile('/home/erzy/projekKelompok/FormMaker/Testing_untuk_BE/soal-template.docx') as z:
    xml = z.read('word/document.xml').decode()
    print('OMML present:', '<m:oMath' in xml)
    print('Drawings present:', 'r:embed=' in xml)
    print('Total XML chars:', len(xml))
    
    paras = re.findall(r'<w:p[ >][\s\S]*?</w:p>', xml)
    print(f'Total paragraphs: {len(paras)}')
    print()
    
    # Print all paragraphs with content
    for i, p in enumerate(paras):
        t = re.sub(r'<[^>]+>', '', p).strip()
        if t:
            print(f'[{i:02d}] {repr(t[:120])}')
    
    print()
    print('=== Check for monospace font (code blocks) ===')
    for i, p in enumerate(paras):
        if 'Courier' in p or 'Consolas' in p or 'Mono' in p:
            print(f'[{i}] Para has monospace font:')
            t = re.sub(r'<[^>]+>', '', p).strip()
            print(f'     text: {repr(t[:80])}')
            # Print the rFonts tag
            fonts = re.findall(r'<w:rFonts[^/]*/>', p)
            print(f'     fonts: {fonts}')
