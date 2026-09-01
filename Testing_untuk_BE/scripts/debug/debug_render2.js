// Test parseTextToHtml logic (Node.js, tanpa browser)
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function parseTextToHtml(text) {
  if (!text) return '';
  const segments = [];
  let rest = text;

  while (rest.length > 0) {
    const fenceStart = rest.indexOf('```');
    const mathStart  = rest.indexOf('$$');
    const hasFence = fenceStart !== -1;
    const hasMath  = mathStart !== -1;

    if (!hasFence && !hasMath) {
      segments.push({ type: 'text', content: rest });
      rest = '';
      break;
    }

    const pickFence = hasFence && (!hasMath || fenceStart <= mathStart);

    if (pickFence) {
      if (fenceStart > 0) segments.push({ type: 'text', content: rest.slice(0, fenceStart) });
      const afterFence = rest.slice(fenceStart + 3);
      const newlineIdx = afterFence.indexOf('\n');
      const lang = newlineIdx !== -1 ? afterFence.slice(0, newlineIdx).trim() : '';
      const codeStart = newlineIdx !== -1 ? newlineIdx + 1 : 0;
      const endFence = afterFence.indexOf('\n```', codeStart);
      if (endFence === -1) {
        segments.push({ type: 'code', lang, content: afterFence.slice(codeStart) });
        rest = '';
      } else {
        const code = afterFence.slice(codeStart, endFence);
        segments.push({ type: 'code', lang, content: code });
        rest = afterFence.slice(endFence + 4);
      }
    } else {
      if (mathStart > 0) segments.push({ type: 'text', content: rest.slice(0, mathStart) });
      const afterMath = rest.slice(mathStart + 2);
      const endMath = afterMath.indexOf('$$');
      if (endMath === -1) {
        segments.push({ type: 'text', content: rest.slice(mathStart) });
        rest = '';
      } else {
        const expr = afterMath.slice(0, endMath);
        segments.push({ type: 'math', display: true, content: expr });
        rest = afterMath.slice(endMath + 2);
      }
    }
  }

  return segments.map(s => {
    if (s.type === 'code') return `[CODE:${s.lang}|${s.content.slice(0,30)}...]`;
    if (s.type === 'math') return `[MATH:${s.content}]`;
    return `[TEXT:${s.content.slice(0,40).replace(/\n/g,'↵')}]`;
  }).join('\n');
}

// Test cases
const tests = [
  // Code block
  'Perhatikan kode Python berikut:\n```\nx = 5\ny = 3\nprint(x ** y)\n```\nApakah output?',
  // Math block
  'Diketahui persamaan:\n$$2x² - 4x - 6 = 0$$\nMenggunakan rumus:\n$$x = (-b ± √(b² - 4ac)) / 2a$$\ndengan a=2',
  // Math from soal 9
  'Hitunglah hasil dari integral berikut:\n$$∫(3x² + 2x - 5) dx$$',
  // Combined code + continuation
  'Perhatikan kode JS berikut:\n```\nasync function fetchData() {\nconst res = await fetch(url);\n}\n\nfetchData().then(d => console.log(d));\n```\nManakah yang BENAR?',
];

for (let i = 0; i < tests.length; i++) {
  console.log(`\n=== Test ${i+1} ===`);
  console.log('Input:', JSON.stringify(tests[i].slice(0, 80)));
  console.log('Segments:');
  console.log(parseTextToHtml(tests[i]));
}
