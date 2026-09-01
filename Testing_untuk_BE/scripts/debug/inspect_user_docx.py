import zipfile, re, json

PATH = '/home/erzy/Downloads/soal-templatetes.docx'

def decode(s):
    return (s.replace('&amp;','&').replace('&lt;','<')
             .replace('&gt;','>').replace('&quot;','"').replace('&apos;',"'"))

with zipfile.ZipFile(PATH) as z:
    print("Files in zip:", [f for f in z.namelist() if not f.endswith('/')])
    xml = z.read('word/document.xml').decode('utf-8', errors='replace')
    
    # Check for images
    rels_raw = z.read('word/_rels/document.xml.rels').decode('utf-8', errors='replace')
    image_files = [f for f in z.namelist() if 'media/' in f or 'image' in f.lower()]
    print(f"\nImages in docx: {image_files}")
    
    # Check relationships
    rids = re.findall(r'Id="([^"]+)"[^>]*Target="([^"]+)"', rels_raw)
    image_rels = [(rid, tgt) for rid, tgt in rids if any(x in tgt.lower() for x in ['png','jpg','jpeg','gif','bmp','webp','svg'])]
    print(f"Image relationships: {image_rels}")
    
    # Check for r:embed in document
    embeds = re.findall(r'r:embed="([^"]+)"', xml)
    print(f"r:embed references: {embeds}")

print("\n=== All paragraphs with text ===")
with zipfile.ZipFile(PATH) as z:
    xml = z.read('word/document.xml').decode('utf-8', errors='replace')

paras = re.findall(r'<w:p[ >][\s\S]*?</w:p>', xml)
print(f"Total paragraphs: {len(paras)}\n")

for i, p in enumerate(paras):
    # Get text
    parts = re.findall(r'<w:t[^>]*>([^<]*)</w:t>', p)
    t = decode(''.join(parts).strip()  )
    
    # Check font
    is_code = bool(re.search(r'w:ascii="(?:Courier New|Courier|Consolas|Lucida Console|Monaco)"', p, re.I))
    
    # Check image
    has_img = 'r:embed=' in p
    
    if t or has_img:
        flags = []
        if is_code: flags.append('CODE')
        if has_img: flags.append('IMG')
        flag_str = f" [{','.join(flags)}]" if flags else ""
        print(f"[{i:03d}]{flag_str} {repr(t[:90])}")
