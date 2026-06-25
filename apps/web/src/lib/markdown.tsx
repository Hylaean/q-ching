/**
 * A tiny, dependency-free Markdown → React renderer.
 *
 * It is deliberately *not* a full CommonMark implementation — it covers exactly
 * the constructs the repository's prose actually uses (so the Analysis page can
 * render `ANALYSIS.md` straight from the repo without pulling a heavy markdown
 * dependency into this otherwise lean PWA): ATX headings, paragraphs with soft
 * wraps, **bold** / *italic* / `inline code` / [links](…), blockquotes,
 * GitHub-flavoured tables, fenced code blocks, and unordered lists.
 *
 * Output is plain semantic HTML inside a single `.prose` wrapper; all styling
 * lives in markdown.module.css (element selectors scoped under that class).
 */
import { createElement, type ReactNode } from 'react';
import styles from './markdown.module.css';

// Earliest-match-wins inline tokens, in priority order: code (literal, no
// nesting), links, bold, then italic (* or _).
const INLINE =
  /(`[^`]+`)|(\[[^\]]+\]\([^)]+\))|(\*\*[^*]+\*\*)|(\*[^*]+\*)|(_[^_]+_)/;

function renderInline(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  let rest = text;
  let n = 0;
  while (rest.length) {
    const m = INLINE.exec(rest);
    if (!m) {
      out.push(rest);
      break;
    }
    if (m.index > 0) out.push(rest.slice(0, m.index));
    const tok = m[0];
    const key = `${keyBase}-${n++}`;
    if (tok.startsWith('`')) {
      out.push(<code key={key}>{tok.slice(1, -1)}</code>);
    } else if (tok.startsWith('[')) {
      const link = /\[([^\]]+)\]\(([^)]+)\)/.exec(tok)!;
      out.push(
        <a key={key} href={link[2]} target="_blank" rel="noreferrer">
          {renderInline(link[1], key)}
        </a>,
      );
    } else if (tok.startsWith('**')) {
      out.push(<strong key={key}>{renderInline(tok.slice(2, -2), key)}</strong>);
    } else {
      out.push(<em key={key}>{renderInline(tok.slice(1, -1), key)}</em>);
    }
    rest = rest.slice(m.index + tok.length);
  }
  return out;
}

/** Does this line open a new block (so a paragraph must stop)? */
function startsBlock(line: string): boolean {
  return (
    line.startsWith('```') ||
    /^#{1,6}\s/.test(line) ||
    line.startsWith('>') ||
    /^\s*[-*]\s+/.test(line) ||
    line.trim().startsWith('|')
  );
}

function splitRow(line: string): string[] {
  let s = line.trim();
  if (s.startsWith('|')) s = s.slice(1);
  if (s.endsWith('|')) s = s.slice(0, -1);
  return s.split('|').map((c) => c.trim());
}

const isTableSeparator = (line: string | undefined): boolean =>
  !!line && /^\s*\|?[\s:|-]+\|?\s*$/.test(line) && line.includes('-');

export function Markdown({ source }: { source: string }) {
  const lines = source.replace(/\r\n/g, '\n').split('\n');
  const blocks: ReactNode[] = [];
  let i = 0;
  let k = 0;

  while (i < lines.length) {
    const line = lines[i];

    // blank lines separate blocks
    if (!line.trim()) {
      i++;
      continue;
    }

    // fenced code block
    if (line.startsWith('```')) {
      const buf: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        buf.push(lines[i]);
        i++;
      }
      i++; // consume the closing fence
      blocks.push(
        <pre key={k++}>
          <code>{buf.join('\n')}</code>
        </pre>,
      );
      continue;
    }

    // ATX heading
    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    if (heading) {
      const level = heading[1].length;
      blocks.push(
        createElement(`h${level}`, { key: k++ }, renderInline(heading[2], `h${k}`)),
      );
      i++;
      continue;
    }

    // GFM table (header row immediately followed by a `---` separator)
    if (line.trim().startsWith('|') && isTableSeparator(lines[i + 1])) {
      const header = splitRow(line);
      i += 2; // skip header + separator
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        rows.push(splitRow(lines[i]));
        i++;
      }
      blocks.push(
        <table key={k++}>
          <thead>
            <tr>
              {header.map((cell, c) => (
                <th key={c}>{renderInline(cell, `th${k}-${c}`)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, r) => (
              <tr key={r}>
                {row.map((cell, c) => (
                  <td key={c}>{renderInline(cell, `td${k}-${r}-${c}`)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>,
      );
      continue;
    }

    // blockquote (one or more `>` lines, joined as a single paragraph)
    if (line.startsWith('>')) {
      const buf: string[] = [];
      while (i < lines.length && lines[i].startsWith('>')) {
        buf.push(lines[i].replace(/^>\s?/, ''));
        i++;
      }
      blocks.push(<blockquote key={k++}>{renderInline(buf.join(' '), `bq${k}`)}</blockquote>);
      continue;
    }

    // unordered list (bullets may wrap onto indented continuation lines)
    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length) {
        const bullet = /^\s*[-*]\s+(.*)$/.exec(lines[i]);
        if (!bullet) break;
        let text = bullet[1];
        i++;
        while (
          i < lines.length &&
          lines[i].trim() &&
          /^\s+/.test(lines[i]) &&
          !/^\s*[-*]\s+/.test(lines[i])
        ) {
          text += ' ' + lines[i].trim();
          i++;
        }
        items.push(text);
      }
      blocks.push(
        <ul key={k++}>
          {items.map((it, idx) => (
            <li key={idx}>{renderInline(it, `li${k}-${idx}`)}</li>
          ))}
        </ul>,
      );
      continue;
    }

    // paragraph (consecutive lines until a blank line or a new block)
    const buf = [line];
    i++;
    while (i < lines.length && lines[i].trim() && !startsBlock(lines[i])) {
      buf.push(lines[i]);
      i++;
    }
    blocks.push(<p key={k++}>{renderInline(buf.join(' '), `p${k}`)}</p>);
  }

  return <div className={styles.prose}>{blocks}</div>;
}
