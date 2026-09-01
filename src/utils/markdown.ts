// Custom Lightweight Markdown & Formatting Parser for notepadEZ

export interface MarkdownStats {
  words: number;
  chars: number;
  charsNoSpaces: number;
  lines: number;
  sentences: number;
  paragraphs: number;
  readingTimeMinutes: number;
}

export function calculateNoteStats(text: string): MarkdownStats {
  if (!text || text.trim() === '') {
    return { words: 0, chars: 0, charsNoSpaces: 0, lines: 0, sentences: 0, paragraphs: 0, readingTimeMinutes: 0 };
  }

  const chars = text.length;
  const charsNoSpaces = text.replace(/\s/g, '').length;
  const words = (text.trim().match(/\S+/g) || []).length;
  const lines = text.split(/\r\n|\r|\n/).length;
  const sentences = (text.match(/[^.!?]+[.!?]+/g) || []).length || (words > 0 ? 1 : 0);
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0).length;
  const readingTimeMinutes = Math.max(1, Math.ceil(words / 200));

  return { words, chars, charsNoSpaces, lines, sentences, paragraphs, readingTimeMinutes };
}

/**
 * Escapes HTML characters to prevent XSS in preview mode
 */
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Converts Markdown string into safe structured HTML string
 */
export function renderMarkdown(markdown: string): string {
  if (!markdown) return '';

  const lines = markdown.split('\n');
  let inCodeBlock = false;
  let codeBlockLang = '';
  let codeBuffer: string[] = [];
  let htmlResult: string[] = [];

  let i = 0;
  while (i < lines.length) {
    let line = lines[i];

    // Handle Fenced Code Blocks (```ts ... ```)
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        // End code block
        const codeText = escapeHtml(codeBuffer.join('\n'));
        const langBadge = codeBlockLang ? `<span class="code-lang-badge">${escapeHtml(codeBlockLang)}</span>` : '';
        htmlResult.push(
          `<div class="code-block-container"><div class="code-block-header">${langBadge}<button class="copy-code-btn" onclick="navigator.clipboard.writeText(this.parentElement.nextElementSibling.innerText)">Copy</button></div><pre><code>${codeText}</code></pre></div>`
        );
        codeBuffer = [];
        inCodeBlock = false;
        codeBlockLang = '';
      } else {
        // Start code block
        inCodeBlock = true;
        codeBlockLang = line.trim().slice(3).trim();
      }
      i++;
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      i++;
      continue;
    }

    // Handle Markdown Tables (| Header | Header |)
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
        tableLines.push(lines[i].trim());
        i++;
      }
      if (tableLines.length > 0) {
        htmlResult.push(renderTable(tableLines));
        continue;
      }
    }

    // Escape raw HTML for non-code lines
    line = escapeHtml(line);

    // Headers
    if (/^#{6}\s+/.test(line)) {
      htmlResult.push(`<h6>${parseInlineMarkdown(line.replace(/^#{6}\s+/, ''))}</h6>`);
      i++;
      continue;
    }
    if (/^#{5}\s+/.test(line)) {
      htmlResult.push(`<h5>${parseInlineMarkdown(line.replace(/^#{5}\s+/, ''))}</h5>`);
      i++;
      continue;
    }
    if (/^#{4}\s+/.test(line)) {
      htmlResult.push(`<h4>${parseInlineMarkdown(line.replace(/^#{4}\s+/, ''))}</h4>`);
      i++;
      continue;
    }
    if (/^#{3}\s+/.test(line)) {
      htmlResult.push(`<h3>${parseInlineMarkdown(line.replace(/^#{3}\s+/, ''))}</h3>`);
      i++;
      continue;
    }
    if (/^#{2}\s+/.test(line)) {
      htmlResult.push(`<h2>${parseInlineMarkdown(line.replace(/^#{2}\s+/, ''))}</h2>`);
      i++;
      continue;
    }
    if (/^#\s+/.test(line)) {
      htmlResult.push(`<h1>${parseInlineMarkdown(line.replace(/^#\s+/, ''))}</h1>`);
      i++;
      continue;
    }

    // Horizontal Rule
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      htmlResult.push('<hr />');
      i++;
      continue;
    }

    // Blockquote
    if (/^&gt;\s+/.test(line)) {
      htmlResult.push(`<blockquote>${parseInlineMarkdown(line.replace(/^&gt;\s+/, ''))}</blockquote>`);
      i++;
      continue;
    }

    // Interactive Checklist items
    if (/^-\s+\[(x|X|\s)\]\s+/.test(line)) {
      const isChecked = /^-\s+\[(x|X)\]\s+/.test(line);
      const text = line.replace(/^-\s+\[(x|X|\s)\]\s+/, '');
      const checkedAttr = isChecked ? 'checked' : '';
      const checkedClass = isChecked ? 'line-through opacity-70' : '';
      htmlResult.push(
        `<div class="task-item"><input type="checkbox" ${checkedAttr} disabled class="task-checkbox" /><span class="${checkedClass}">${parseInlineMarkdown(text)}</span></div>`
      );
      i++;
      continue;
    }

    // Bullet lists
    if (/^(\*|-|\+)\s+/.test(line)) {
      htmlResult.push(`<li class="bullet-item">${parseInlineMarkdown(line.replace(/^(\*|-|\+)\s+/, ''))}</li>`);
      i++;
      continue;
    }

    // Numbered list
    if (/^\d+\.\s+/.test(line)) {
      const numMatch = line.match(/^(\d+)\.\s+(.*)/);
      if (numMatch) {
        htmlResult.push(`<li class="number-item" value="${numMatch[1]}">${parseInlineMarkdown(numMatch[2])}</li>`);
        i++;
        continue;
      }
    }

    // Empty line / paragraph break
    if (line.trim() === '') {
      htmlResult.push('<div class="h-4"></div>');
      i++;
      continue;
    }

    // Default Paragraph
    htmlResult.push(`<p>${parseInlineMarkdown(line)}</p>`);
    i++;
  }

  // Handle unclosed code block
  if (inCodeBlock) {
    const codeText = escapeHtml(codeBuffer.join('\n'));
    htmlResult.push(`<pre><code>${codeText}</code></pre>`);
  }

  return htmlResult.join('\n');
}

/**
 * Parses markdown table lines into styled HTML table
 */
function renderTable(tableLines: string[]): string {
  if (tableLines.length === 0) return '';

  const parseRow = (rowStr: string) => {
    return rowStr
      .split('|')
      .slice(1, -1)
      .map((cell) => cell.trim());
  };

  const headerCells = parseRow(tableLines[0]);
  let startIndex = 1;

  // Check if second line is divider (| :--- | :--- |)
  if (tableLines.length > 1 && tableLines[1].includes('---')) {
    startIndex = 2;
  }

  const headerHtml = `<thead><tr>${headerCells
    .map((cell) => `<th class="md-th">${parseInlineMarkdown(escapeHtml(cell))}</th>`)
    .join('')}</tr></thead>`;

  const bodyRows: string[] = [];
  for (let r = startIndex; r < tableLines.length; r++) {
    const cells = parseRow(tableLines[r]);
    const rowHtml = `<tr>${cells
      .map((cell) => `<td class="md-td">${parseInlineMarkdown(escapeHtml(cell))}</td>`)
      .join('')}</tr>`;
    bodyRows.push(rowHtml);
  }

  const bodyHtml = `<tbody>${bodyRows.join('')}</tbody>`;

  return `<div class="table-container"><table class="md-table">${headerHtml}${bodyHtml}</table></div>`;
}

/**
 * Parses inline markdown: bold, italic, strikethrough, inline code, links, images
 */
function parseInlineMarkdown(text: string): string {
  return text
    // Inline code (`code`)
    .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
    // Images (![alt](url))
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="md-img" />')
    // Links ([text](url))
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="md-link">$1</a>')
    // Bold & Italic (***text***)
    .replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>')
    // Bold (**text** or __text__)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_]+)__/g, '<strong>$1</strong>')
    // Italic (*text* or _text_)
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/_([^_]+)_/g, '<em>$1</em>')
    // Strikethrough (~~text~~)
    .replace(/~~([^~]+)~~/g, '<del>$1</del>');
}
