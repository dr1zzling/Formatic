// ponytail: pure helper biar logika grup soal bisa dites tanpa render React
export function getNextGroupId(questions) {
  let max = 0;
  for (const q of questions ?? []) {
    if (q?.group_id != null && q.group_id > max) max = q.group_id;
  }
  return max + 1;
}

export function applyBulkGroup(questions, selectedIdxs) {
  const sorted = [...new Set(selectedIdxs ?? [])]
    .filter((i) => i >= 0 && i < questions.length)
    .sort((a, b) => a - b);
  if (sorted.length === 0) return { questions, newGroupId: null };
  const newGroupId = getNextGroupId(questions);
  const first = sorted[0];
  const out = questions.map((q, i) => {
    if (!sorted.includes(i)) return q;
    return {
      ...q,
      group_id: newGroupId,
      group_text: i === first ? (q.group_text ?? "") : null,
      ...(i === first ? { showGroup: true } : {}),
    };
  });
  return { questions: out, newGroupId };
}

export function removeBulkGroup(questions, selectedIdxs) {
  const sel = new Set(selectedIdxs ?? []);
  if (sel.size === 0) return questions;
  return questions.map((q, i) =>
    sel.has(i)
      ? { ...q, group_id: null, group_text: null, showGroup: false }
      : q
  );
}
