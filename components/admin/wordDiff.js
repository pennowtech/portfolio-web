// Minimal word-level diff (no external dependency) -- an LCS over word
// tokens, good enough for showing what an AI rephrase changed in a
// paragraph or article without pulling in a full diffing library.
const tokenize = (text) => text.match(/\S+|\s+/g) || [];

export const diffWords = (before, after) => {
  const a = tokenize(before);
  const b = tokenize(after);
  const n = a.length;
  const m = b.length;

  // lcs[i][j] = length of the longest common subsequence of a[i:], b[j:]
  const lcs = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }

  const parts = [];
  let i = 0;
  let j = 0;
  const push = (type, value) => {
    const last = parts[parts.length - 1];
    if (last && last.type === type) {
      last.value += value;
    } else {
      parts.push({ type, value });
    }
  };
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      push('same', a[i]);
      i++;
      j++;
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
      push('removed', a[i]);
      i++;
    } else {
      push('added', b[j]);
      j++;
    }
  }
  while (i < n) {
    push('removed', a[i]);
    i++;
  }
  while (j < m) {
    push('added', b[j]);
    j++;
  }
  return parts;
};
