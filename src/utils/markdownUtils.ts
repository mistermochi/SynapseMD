export interface MarkdownParagraphBlock {
  id: string;
  type: 'heading' | 'paragraph' | 'callout' | 'list' | 'table' | 'divider' | 'code' | 'frontmatter' | 'other';
  rawText: string;
  cleanText: string;
  headingLevel?: number;
  calloutType?: string;
  calloutTitle?: string;
}

export function parseMarkdownBlocks(markdown: string): MarkdownParagraphBlock[] {
  const lines = markdown.split('\n');
  const blocks: MarkdownParagraphBlock[] = [];
  let inFrontmatter = false;
  let frontmatterLines: string[] = [];
  let currentBlockLines: string[] = [];
  let currentBlockType: MarkdownParagraphBlock['type'] = 'paragraph';
  let inCodeBlock = false;
  let codeBlockLines: string[] = [];

  const flushBlock = () => {
    if (currentBlockLines.length === 0) return;
    const raw = currentBlockLines.join('\n');
    const clean = raw.trim();
    if (clean) {
      if (currentBlockType === 'callout') {
        const firstLine = currentBlockLines[0] || '';
        const match = firstLine.match(/^>\s*\[!([a-zA-Z0-9_-]+)\]\s*(.*)$/);
        const calloutType = match ? match[1].toLowerCase() : 'note';
        const calloutTitle = match && match[2] ? match[2].trim() : (match ? match[1].toUpperCase() : 'NOTE');
        const contentLines = currentBlockLines.slice(1).map((l) => l.replace(/^>\s?/, ''));
        blocks.push({
          id: `blk-${blocks.length}-${Math.random().toString(36).substring(2, 7)}`,
          type: 'callout',
          rawText: raw,
          cleanText: contentLines.join('\n').trim(),
          calloutType,
          calloutTitle,
        });
      } else {
        blocks.push({
          id: `blk-${blocks.length}-${Math.random().toString(36).substring(2, 7)}`,
          type: currentBlockType,
          rawText: raw,
          cleanText: clean,
        });
      }
    }
    currentBlockLines = [];
    currentBlockType = 'paragraph';
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code block toggle (```)
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        codeBlockLines.push(line);
        blocks.push({
          id: `blk-code-${blocks.length}`,
          type: 'code',
          rawText: codeBlockLines.join('\n'),
          cleanText: codeBlockLines.slice(1, -1).join('\n'),
        });
        codeBlockLines = [];
        inCodeBlock = false;
      } else {
        flushBlock();
        inCodeBlock = true;
        codeBlockLines.push(line);
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      continue;
    }

    // Frontmatter detection
    if (i === 0 && line.trim() === '---') {
      inFrontmatter = true;
      frontmatterLines.push(line);
      continue;
    }
    if (inFrontmatter) {
      frontmatterLines.push(line);
      if (line.trim() === '---') {
        inFrontmatter = false;
        blocks.push({
          id: 'blk-frontmatter',
          type: 'frontmatter',
          rawText: frontmatterLines.join('\n'),
          cleanText: frontmatterLines.join('\n'),
        });
        frontmatterLines = [];
      }
      continue;
    }

    // Horizontal Rule divider (--- or ***) when not in frontmatter
    if (/^(\s*[-*_]\s*){3,}$/.test(line.trim())) {
      flushBlock();
      blocks.push({
        id: `blk-hr-${blocks.length}`,
        type: 'divider',
        rawText: line,
        cleanText: '---',
      });
      continue;
    }

    // Headings
    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      flushBlock();
      blocks.push({
        id: `blk-h-${blocks.length}`,
        type: 'heading',
        rawText: line,
        cleanText: headingMatch[2].trim(),
        headingLevel: headingMatch[1].length,
      });
      continue;
    }

    // Table rows starting with |
    if (line.trim().startsWith('|')) {
      if (currentBlockType !== 'table') {
        flushBlock();
        currentBlockType = 'table';
      }
      currentBlockLines.push(line);
      continue;
    } else if (currentBlockType === 'table') {
      flushBlock();
    }

    // List items starting with - , * , or 1.
    const isListItem = /^(\s*[-*]|\s*\d+\.)\s+/.test(line);
    if (isListItem) {
      if (currentBlockType !== 'list') {
        flushBlock();
        currentBlockType = 'list';
      }
      currentBlockLines.push(line);
      continue;
    } else if (currentBlockType === 'list' && line.trim() === '') {
      flushBlock();
      continue;
    }

    // Empty line separates paragraphs
    if (line.trim() === '') {
      flushBlock();
      continue;
    }

    // Callout box start: > [!type]
    if (line.trim().startsWith('> [!')) {
      flushBlock();
      currentBlockType = 'callout';
      currentBlockLines.push(line);
      continue;
    }

    if (currentBlockType === 'callout') {
      if (line.trim().startsWith('>')) {
        currentBlockLines.push(line);
        continue;
      } else {
        flushBlock();
      }
    }

    // Normal paragraph line
    currentBlockLines.push(line);
  }

  flushBlock();
  return blocks;
}

export function extractWikiLinks(text: string): string[] {
  const matches = text.match(/\[\[(.*?)\]\]/g) || [];
  return Array.from(
    new Set(
      matches.map((m) => {
        const inner = m.slice(2, -2);
        // Handle alias: [[Target Note|Display Text]]
        return inner.split('|')[0].trim();
      })
    )
  );
}

export function replaceBlockInMarkdown(
  originalMarkdown: string,
  targetRawText: string,
  replacementText: string
): string {
  if (originalMarkdown.includes(targetRawText)) {
    return originalMarkdown.replace(targetRawText, replacementText);
  }
  // Fallback: replace with normalized line breaks
  const normalizedOriginal = originalMarkdown.replace(/\r\n/g, '\n');
  const normalizedTarget = targetRawText.replace(/\r\n/g, '\n');
  if (normalizedOriginal.includes(normalizedTarget)) {
    return normalizedOriginal.replace(normalizedTarget, replacementText);
  }
  return originalMarkdown + '\n\n' + replacementText;
}

export function appendReferenceToMarkdown(originalMarkdown: string, citationText: string): string {
  // Check if ## References or ### References exists
  const refHeadingRegex = /(^#{1,3}\s+References.*$)/im;
  if (refHeadingRegex.test(originalMarkdown)) {
    return originalMarkdown.replace(refHeadingRegex, `$1\n${citationText}`);
  }
  return `${originalMarkdown.trim()}\n\n## References\n${citationText}\n`;
}
