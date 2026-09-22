// ponytail: 1 sumber palette LaTeX — soal pakai lengkap, option pakai subset
// Pindah dari components/QuillEditor.jsx biar bisa di-unit-test via node.

export const LATEX_SYMBOLS = [
  {
    label: 'Dasar',
    items: [
      { display: 'x²',         latex: 'x^{2}',              tip: 'Pangkat' },
      { display: 'xₙ',         latex: 'x_{n}',              tip: 'Indeks bawah' },
      { display: '√x',         latex: '\\sqrt{x}',          tip: 'Akar kuadrat' },
      { display: '∛x',         latex: '\\sqrt[3]{x}',       tip: 'Akar pangkat 3' },
      { display: 'a/b',        latex: '\\frac{a}{b}',       tip: 'Pecahan' },
      { display: '|x|',        latex: '|x|',                tip: 'Nilai mutlak' },
      { display: 'xⁿ',         latex: 'x^{n}',              tip: 'Pangkat n' },
      { display: '√(a²+b²)',   latex: '\\sqrt{a^2+b^2}',   tip: 'Teorema Pythagoras' },
    ],
  },
  {
    label: 'Aljabar',
    items: [
      { display: '±',          latex: '\\pm',               tip: 'Plus minus' },
      { display: '×',          latex: '\\times',            tip: 'Kali' },
      { display: '÷',          latex: '\\div',              tip: 'Bagi' },
      { display: '≠',          latex: '\\neq',              tip: 'Tidak sama dengan' },
      { display: '≤',          latex: '\\leq',              tip: 'Kurang dari sama dengan' },
      { display: '≥',          latex: '\\geq',              tip: 'Lebih dari sama dengan' },
      { display: '≈',          latex: '\\approx',           tip: 'Hampir sama' },
      { display: '∝',          latex: '\\propto',           tip: 'Sebanding' },
      { display: 'abc formula', latex: '\\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}', tip: 'Rumus ABC' },
    ],
  },
  {
    label: 'Kalkulus',
    items: [
      { display: '∫',          latex: '\\int',                           tip: 'Integral' },
      { display: '∫ₐᵇ',       latex: '\\int_{a}^{b}',                   tip: 'Integral tentu' },
      { display: 'd/dx',       latex: '\\frac{d}{dx}',                   tip: 'Turunan' },
      { display: '∂/∂x',      latex: '\\frac{\\partial}{\\partial x}',  tip: 'Turunan parsial' },
      { display: 'lim',        latex: '\\lim_{x \\to \\infty}',          tip: 'Limit' },
      { display: '∑',          latex: '\\sum_{i=1}^{n}',                 tip: 'Sigma / Jumlah' },
      { display: '∏',          latex: '\\prod_{i=1}^{n}',               tip: 'Produk' },
      { display: '∞',          latex: '\\infty',                         tip: 'Tak hingga' },
    ],
  },
  {
    label: 'Trigonometri',
    items: [
      { display: 'sin',        latex: '\\sin',              tip: 'Sinus' },
      { display: 'cos',        latex: '\\cos',              tip: 'Kosinus' },
      { display: 'tan',        latex: '\\tan',              tip: 'Tangen' },
      { display: 'sin⁻¹',     latex: '\\sin^{-1}',         tip: 'Arcsin' },
      { display: 'cos⁻¹',     latex: '\\cos^{-1}',         tip: 'Arccos' },
      { display: 'tan⁻¹',     latex: '\\tan^{-1}',         tip: 'Arctan' },
      { display: 'π',          latex: '\\pi',               tip: 'Pi' },
      { display: 'θ',          latex: '\\theta',            tip: 'Theta' },
    ],
  },
  {
    label: 'Himpunan & Logika',
    items: [
      { display: '∈',          latex: '\\in',               tip: 'Elemen dari' },
      { display: '∉',          latex: '\\notin',            tip: 'Bukan elemen dari' },
      { display: '⊂',          latex: '\\subset',           tip: 'Himpunan bagian' },
      { display: '∪',          latex: '\\cup',              tip: 'Gabungan' },
      { display: '∩',          latex: '\\cap',              tip: 'Irisan' },
      { display: '∅',          latex: '\\emptyset',         tip: 'Himpunan kosong' },
      { display: '∀',          latex: '\\forall',           tip: 'Untuk semua' },
      { display: '∃',          latex: '\\exists',           tip: 'Ada/terdapat' },
    ],
  },
  {
    label: 'Huruf Yunani',
    items: [
      { display: 'α',          latex: '\\alpha',            tip: 'Alpha' },
      { display: 'β',          latex: '\\beta',             tip: 'Beta' },
      { display: 'γ',          latex: '\\gamma',            tip: 'Gamma' },
      { display: 'δ',          latex: '\\delta',            tip: 'Delta' },
      { display: 'λ',          latex: '\\lambda',           tip: 'Lambda' },
      { display: 'μ',          latex: '\\mu',               tip: 'Mu' },
      { display: 'σ',          latex: '\\sigma',            tip: 'Sigma' },
      { display: 'Δ',          latex: '\\Delta',            tip: 'Delta besar' },
    ],
  },
];

// Palette khusus option: pangkat, sin cos tan, akar kuadrat, pi,
// pecahan, ≤, ≥ — diambil dari entri palette utama biar konsisten.
const _byLatex = new Map(
  LATEX_SYMBOLS.flatMap((c) => c.items).map((i) => [i.latex, i])
);

function _pick(...latexes) {
  return latexes.map((l) => {
    const item = _byLatex.get(l);
    if (!item) throw new Error(`simbol ${l} tidak ada di LATEX_SYMBOLS`);
    return item;
  });
}

export const OPTION_LATEX_SYMBOLS = [
  {
    label: 'Rumus',
    items: _pick(
      'x^{2}',
      'x^{n}',
      '\\sin',
      '\\cos',
      '\\tan',
      '\\sqrt{x}',
      '\\pi',
      '\\frac{a}{b}',
      '\\leq',
      '\\geq'
    ),
  },
];
