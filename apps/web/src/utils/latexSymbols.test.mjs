import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { LATEX_SYMBOLS, OPTION_LATEX_SYMBOLS } from "./latexSymbols.js";

// ponytail: kunci isi palette rumus option — cuma 10 simbol yang diminta
const ALLOWED = new Set([
  "x^{2}",
  "x^{n}",
  "\\sin",
  "\\cos",
  "\\tan",
  "\\sqrt{x}",
  "\\pi",
  "\\frac{a}{b}",
  "\\leq",
  "\\geq",
]);

describe("OPTION_LATEX_SYMBOLS", () => {
  it("hanya berisi pangkat, sin cos tan, akar kuadrat, pi, pecahan, ≤, ≥", () => {
    const got = OPTION_LATEX_SYMBOLS.flatMap((c) =>
      c.items.map((i) => i.latex)
    );
    assert.deepEqual(new Set(got), ALLOWED);
  });

  it("setiap item punya display + tip", () => {
    for (const c of OPTION_LATEX_SYMBOLS) {
      for (const i of c.items) {
        assert.ok(i.display, `display kosong untuk ${i.latex}`);
        assert.ok(i.tip, `tip kosong untuk ${i.latex}`);
      }
    }
  });

  it("semua item option tersedia juga di palette utama (soal)", () => {
    const main = new Set(
      LATEX_SYMBOLS.flatMap((c) => c.items.map((i) => i.latex))
    );
    for (const c of OPTION_LATEX_SYMBOLS) {
      for (const i of c.items) {
        assert.ok(main.has(i.latex), `${i.latex} tidak ada di palette utama`);
      }
    }
  });
});
