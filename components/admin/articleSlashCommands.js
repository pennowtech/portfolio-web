import { acceptCompletion, autocompletion } from '@codemirror/autocomplete';
import { syntaxTree } from '@codemirror/language';
import { Prec } from '@codemirror/state';
import { keymap } from '@codemirror/view';
import styles from './ArticleStudio.module.css';

const presentation = {
  heading: ['H2', 'Give your section a title'],
  h3: ['H3', 'Add a smaller section heading'],
  bullet: ['•', 'Create a simple bulleted list'],
  numbered: ['1.', 'Keep steps in order'],
  task: ['☑', 'Track a checklist of tasks'],
  quote: ['“', 'Let a quotation stand out'],
  code: ['</>', 'Add a syntax-highlighted code block'],
  table: ['▦', 'Organize information in a data table'],
  note: ['≡', 'Highlight important context'],
  divider: ['—', 'Separate two sections'],
  image: ['▧', 'Add an image from a URL'],
  video: ['▷', 'Embed a YouTube video'],
  linkedin: ['in', 'Embed a LinkedIn post'],
  x: ['𝕏', 'Embed a post from X']
};

function commandRow(completion) {
  const name = completion.label.slice(1);
  const [symbol, description] = presentation[name];
  const row = document.createElement('span');
  row.className = styles.slashRow;
  const icon = document.createElement('span');
  icon.className = styles.slashIcon;
  icon.textContent = symbol;
  icon.setAttribute('aria-hidden', 'true');
  const copy = document.createElement('span');
  copy.className = styles.slashCopy;
  const title = document.createElement('span');
  title.className = styles.slashTitle;
  title.textContent = completion.detail;
  const hint = document.createElement('span');
  hint.className = styles.slashDescription;
  hint.textContent = description;
  copy.append(title, hint);
  const shortcut = document.createElement('kbd');
  shortcut.className = styles.slashKey;
  shortcut.textContent = name;
  shortcut.setAttribute('aria-hidden', 'true');
  row.append(icon, copy, shortcut);
  return row;
}

const commands = [
  ['heading', 'Heading 2', '## Heading', 'Heading'],
  ['h3', 'Heading 3', '### Heading', 'Heading'],
  ['bullet', 'Bulleted list', '- List item', 'List item'],
  ['numbered', 'Numbered list', '1. List item', 'List item'],
  ['task', 'Task list', '- [ ] Task', 'Task'],
  ['quote', 'Blockquote', '> Quote', 'Quote'],
  ['code', 'Code block', '```text\nCode here\n```', 'Code here'],
  ['table', 'Table', '| Column 1 | Column 2 |\n| --- | --- |\n| Value | Value |', 'Column 1'],
  ['note', 'Note callout', '<note heading="Design note">\nImportant context\n</note>', 'Important context'],
  ['divider', 'Horizontal divider', '---\n', ''],
  ['image', 'Image', '![Image description](https://example.com/image.jpg)', 'https://example.com/image.jpg'],
  ['video', 'YouTube video', '<youtube>VIDEO_ID</youtube>', 'VIDEO_ID'],
  [
    'linkedin',
    'LinkedIn post',
    '<linkedin>https://www.linkedin.com/embed/feed/update/urn:li:share:POST_ID</linkedin>',
    'POST_ID'
  ],
  ['x', 'X post', '<twitter>https://x.com/username/status/POST_ID</twitter>', 'POST_ID']
];

export function articleSlashSource(context) {
  const selection = context.state.selection.main;
  if (!selection.empty) return null;
  const line = context.state.doc.lineAt(context.pos);
  const match = context.state.sliceDoc(line.from, context.pos).match(/^\s*\/([a-z0-9]*)$/i);
  if (!match) return null;
  for (let node = syntaxTree(context.state).resolveInner(context.pos, -1); node; node = node.parent) {
    if (['FencedCode', 'CodeBlock', 'InlineCode', 'HTMLBlock'].includes(node.name)) return null;
  }
  const from = context.pos - match[1].length - 1;
  return {
    from,
    options: commands.map(([name, detail, text, placeholder]) => ({
      label: `/${name}`,
      detail,
      type: 'text',
      apply(view, completion, start, end) {
        const offset = placeholder ? text.indexOf(placeholder) : text.length;
        view.dispatch({
          changes: { from: start, to: end, insert: text },
          selection: { anchor: start + offset, head: start + offset + placeholder.length },
          userEvent: 'input.complete'
        });
        view.focus();
      }
    })),
    validFor: /^\/[a-z0-9]*$/i
  };
}

export const articleSlashCommands = [
  autocompletion({
    override: [articleSlashSource],
    activateOnTyping: true,
    icons: false,
    tooltipClass: () => styles.slashMenu,
    addToOptions: [{ render: commandRow, position: 10 }]
  }),
  Prec.highest(keymap.of([{ key: 'Tab', run: acceptCompletion }]))
];
