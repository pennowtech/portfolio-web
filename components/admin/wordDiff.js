// Minimal word-level diff (no external dependency) -- an LCS over word tokens, good enough for showing what
// an AI rephrase changed. Whole articles are far larger than the paragraphs this was first written for, so:
//  - the common start and end are trimmed first (rewrites usually keep a lot of both),
//  - the LCS table is one flat typed array (a few MB, not gigabytes of nested arrays), and
//  - if the differing middle is still too big for a word-level table, it falls back to comparing whole lines
//    (paragraphs), so a very long article degrades to a coarser diff instead of freezing the tab.
const tokenize = (text) => text.match(/\S+|\s+/g) || [];
const MAX_CELLS = 8_000_000;

const lcsWalk = (a, b, push) => {
  const n = a.length;
  const m = b.length;
  const width = m + 1;
  // table[i * width + j] = length of the longest common subsequence of a[i:], b[j:]
  const table = new Uint32Array((n + 1) * width);
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      table[i * width + j] =
        a[i] === b[j]
          ? table[(i + 1) * width + j + 1] + 1
          : Math.max(table[(i + 1) * width + j], table[i * width + j + 1]);
    }
  }
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      push('same', a[i]);
      i++;
      j++;
    } else if (table[(i + 1) * width + j] >= table[i * width + j + 1]) {
      push('removed', a[i]);
      i++;
    } else {
      push('added', b[j]);
      j++;
    }
  }
  while (i < n) push('removed', a[i++]);
  while (j < m) push('added', b[j++]);
};

const splitLines = (text) => text.split(/(?<=\n)/);

export const diffWords = (before, after) => {
  const a = tokenize(before);
  const b = tokenize(after);

  const parts = [];
  const push = (type, value) => {
    if (!value) return;
    const last = parts[parts.length - 1];
    if (last && last.type === type) last.value += value;
    else parts.push({ type, value });
  };

  let start = 0;
  while (start < a.length && start < b.length && a[start] === b[start]) start++;
  let endA = a.length;
  let endB = b.length;
  while (endA > start && endB > start && a[endA - 1] === b[endB - 1]) {
    endA--;
    endB--;
  }

  push('same', a.slice(0, start).join(''));
  const midA = a.slice(start, endA);
  const midB = b.slice(start, endB);

  if (midA.length * midB.length <= MAX_CELLS) {
    lcsWalk(midA, midB, push);
  } else {
    const linesA = splitLines(midA.join(''));
    const linesB = splitLines(midB.join(''));
    if (linesA.length * linesB.length <= MAX_CELLS) {
      const lineParts = [];
      lcsWalk(linesA, linesB, (type, value) => lineParts.push({ type, value }));
      // A block of removed lines followed by added lines is a changed paragraph: refine it word by word
      // when that pair is small enough, otherwise show it as removed then added.
      for (let k = 0; k < lineParts.length; k++) {
        const part = lineParts[k];
        const next = lineParts[k + 1];
        if (part.type === 'removed' && next?.type === 'added') {
          const ta = tokenize(part.value);
          const tb = tokenize(next.value);
          if (ta.length * tb.length <= MAX_CELLS) lcsWalk(ta, tb, push);
          else {
            push('removed', part.value);
            push('added', next.value);
          }
          k++;
        } else push(part.type, part.value);
      }
    } else {
      push('removed', midA.join(''));
      push('added', midB.join(''));
    }
  }
  push('same', a.slice(endA).join(''));
  return parts;
};

const countWords = (text) => (text.match(/\S+/g) || []).length;

// { added, removed, changed } in words, for showing how much a rewrite actually altered the text.
export const summarizeDiff = (parts) => {
  const added = parts.filter((part) => part.type === 'added').reduce((sum, part) => sum + countWords(part.value), 0);
  const removed = parts
    .filter((part) => part.type === 'removed')
    .reduce((sum, part) => sum + countWords(part.value), 0);
  return { added, removed, changed: added > 0 || removed > 0 };
};
