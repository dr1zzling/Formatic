// Simulasi parseTextToHtml untuk debug
const text = 'Perhatikan kode Python berikut:\n```\nx = 5\ny = 3\nprint(x ** y)\n```\nApakah output dari kode di atas?';
console.log('=== Input string ===');
console.log(JSON.stringify(text));
console.log('\n=== Char by char around backtick ===');
const btIdx = text.indexOf('```');
console.log('First ``` at index:', btIdx);
console.log('Chars around it:', JSON.stringify(text.slice(btIdx-2, btIdx+10)));

// Test the exact regex from RichTextDisplay
const fenceCodeRe = /^```(\w*)\n([\s\S]*?)```/m;
let remaining = text;

// Simulate the loop
let step = 0;
while (remaining.length > 0 && step < 10) {
  step++;
  const fenceMatch = remaining.match(fenceCodeRe);
  if (fenceMatch) {
    const matchStart = remaining.indexOf(fenceMatch[0]);
    console.log(`\nStep ${step}: fenceMatch found`);
    console.log('  match[0]:', JSON.stringify(fenceMatch[0].slice(0, 50)));
    console.log('  matchStart:', matchStart);
    console.log('  isAtStart:', matchStart === 0);
    if (matchStart === 0) {
      console.log('  -> WOULD RENDER CODE BLOCK');
      remaining = remaining.slice(fenceMatch[0].length);
      continue;
    }
  }
  
  // nextSpecial check
  const nextSpecial = remaining.search(/`|\$|\n/);
  if (nextSpecial === -1) {
    console.log(`Step ${step}: no more specials, output rest`);
    break;
  } else if (nextSpecial === 0) {
    if (remaining[0] === '\n') {
      console.log(`Step ${step}: newline -> <br>`);
      remaining = remaining.slice(1);
    } else {
      console.log(`Step ${step}: literal char: ${JSON.stringify(remaining[0])}`);
      remaining = remaining.slice(1);
    }
  } else {
    console.log(`Step ${step}: output text until index ${nextSpecial}: ${JSON.stringify(remaining.slice(0,nextSpecial))}`);
    remaining = remaining.slice(nextSpecial);
  }
}
console.log('\nRemaining:', JSON.stringify(remaining.slice(0, 50)));
