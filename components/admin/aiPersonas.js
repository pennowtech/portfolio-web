// Single source of truth for AI writing personas -- used both as the
// "Writing Tone Persona" picker in AIConfigModal and as the rephrase
// directives in FrostedSelectionBubble's AI Rephrase popover, so the two
// stay in sync instead of drifting into two different option sets.
//
// `instruction` is the directive sent to the model when this persona is
// selected for a rephrase; `desc` is the short human-facing blurb shown in
// both pickers.
export const AI_PERSONAS = [
  {
    id: 'architecture',
    label: 'Architecture & Trade-offs',
    desc: 'Rigorous engineering depth with ADR style',
    instruction:
      'Add architectural rigor: surface trade-offs, constraints, and the reasoning behind decisions, in the style of an ADR.'
  },
  {
    id: 'concise',
    label: 'Crisp & Direct',
    desc: 'Short sentences, active voice, zero jargon',
    instruction: 'Make this crisp and direct: short sentences, active voice, no filler words or unexplained jargon.'
  },
  {
    id: 'tutorial',
    label: 'Step-by-Step Guide',
    desc: 'Educational progression with clear checkpoints',
    instruction:
      'Restructure as a step-by-step guide with clear educational progression and checkpoints the reader can follow.'
  },
  {
    id: 'deepdive',
    label: 'Systems Deep Dive',
    desc: 'Internal mechanics, memory, latency, and scale',
    instruction: 'Go deeper into systems internals: memory, latency, concurrency, and scale implications.'
  },
  {
    id: 'clarity',
    label: 'Improve Clarity',
    desc: 'Clearer and more professional, same meaning',
    instruction: 'Make this clearer and more professional without changing its meaning.'
  },
  {
    id: 'brevity',
    label: 'More Concise',
    desc: 'Trim it down without losing meaning',
    instruction: 'Make this more concise without losing meaning or dropping facts.'
  },
  {
    id: 'technical',
    label: 'Technical & Precise',
    desc: 'Architecturally precise terminology',
    instruction: 'Make the terminology architecturally precise and unambiguous for a senior engineering audience.'
  },
  {
    id: 'grammar',
    label: 'Fix Flow & Grammar',
    desc: 'Grammar, rhythm, and tone pass',
    instruction: 'Fix grammar, sentence rhythm, and tone consistency without changing the substance.'
  }
];

export const findPersonas = (ids = []) => AI_PERSONAS.filter((persona) => ids.includes(persona.id));

// Combines multiple selected personas into one coherent system directive --
// the "best possible way" to hand several simultaneous style constraints to
// a model: a numbered list plus explicit output-format constraints, rather
// than just concatenating instructions.
export const buildCombinedInstruction = (personaIds = [], customPrompt = '') => {
  const personas = findPersonas(personaIds);
  const lines = personas.map((persona, index) => `${index + 1}. ${persona.label}: ${persona.instruction}`);
  if (customPrompt.trim()) lines.push(`${lines.length + 1}. ${customPrompt.trim()}`);
  if (lines.length === 0) return 'Improve this text while preserving its meaning.';
  if (lines.length === 1) return personas[0]?.instruction || customPrompt.trim();
  return `Apply the following writing directives together, in harmony:\n${lines.join('\n')}`;
};

// Summarize is a separate action from the persona rewrites above: it condenses instead of restyling,
// so it has its own length choices rather than being another persona.
export const AI_SUMMARY_LENGTHS = [
  {
    id: 'sentence',
    label: 'One sentence',
    desc: 'The single most important point',
    instruction: 'Summarize in exactly one sentence of at most 30 words that captures the single most important point.'
  },
  {
    id: 'paragraph',
    label: 'Short paragraph',
    desc: '3-5 sentences',
    instruction: 'Summarize in one short paragraph of 3 to 5 sentences covering the main argument and conclusion.'
  },
  {
    id: 'bullets',
    label: 'Key points',
    desc: '4-6 bullet points',
    instruction: 'Summarize as 4 to 6 concise Markdown bullet points, each a complete, self-contained takeaway.'
  }
];

export const buildSummaryInstruction = (lengthId, customPrompt = '') => {
  const length = AI_SUMMARY_LENGTHS.find((entry) => entry.id === lengthId);
  if (!length) return '';
  return [length.instruction, customPrompt.trim()].filter(Boolean).join(' ');
};

// Target sizes for "Write article with AI". maxTokens is the output budget sent to the provider
// (about 1.5 tokens per word, plus headroom for headings and code).
export const AI_ARTICLE_LENGTHS = [
  {
    id: 'short',
    label: 'Short',
    desc: '~600 words',
    instruction: 'About 600 words: a focused piece on one idea.',
    maxTokens: 1800
  },
  {
    id: 'standard',
    label: 'Standard',
    desc: '~1,200 words',
    instruction: 'About 1,200 words with a clear introduction, 3 to 5 sections, and a conclusion.',
    maxTokens: 3600
  },
  {
    id: 'deep',
    label: 'In-depth',
    desc: '~2,000 words',
    instruction: 'About 2,000 words: thorough, with 5 or more sections, worked examples, and trade-offs.',
    maxTokens: 6000
  }
];
