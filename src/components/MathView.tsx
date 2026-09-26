import React, { useMemo } from 'react';
import katex from 'katex';

interface MathViewProps {
  math: string;
  block?: boolean;
  className?: string;
}

/**
 * Pure LaTeX mathematical equation renderer using KaTeX.
 * Renders mathematical expressions clearly, crisply, and reliably.
 */
export const MathView: React.FC<MathViewProps> = ({ math, block = false, className = '' }) => {
  const html = useMemo(() => {
    try {
      return katex.renderToString(math, {
        displayMode: block,
        throwOnError: false,
        output: 'htmlAndMathml',
      });
    } catch {
      return math;
    }
  }, [math, block]);

  if (block) {
    return (
      <div
        className={`katex-block overflow-x-auto py-1 my-1 text-center select-text ${className}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  return (
    <span
      className={`katex-inline inline-flex items-baseline mx-0.5 select-text ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

interface LatexTextProps {
  text: string;
  className?: string;
}

/**
 * Renders mixed text containing LaTeX syntax:
 * - Block math: $$...$$ or \[...\]
 * - Inline math: $...$ or \(...\)
 * If no delimiters are present, standard text is returned.
 */
export const LatexText: React.FC<LatexTextProps> = ({ text, className = '' }) => {
  const parts = useMemo(() => {
    if (!text) return [];

    // Regex to match $$...$$, $...$, \[...\], \(...\)
    const regex = /(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\$[^\$\n]+?\$|\\\([\s\S]*?\\\))/g;
    const tokens: Array<{ type: 'text' | 'inline' | 'block'; content: string; key: number }> = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let counter = 0;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        tokens.push({
          type: 'text',
          content: text.slice(lastIndex, match.index),
          key: counter++,
        });
      }

      const raw = match[0];
      if (raw.startsWith('$$') && raw.endsWith('$$')) {
        tokens.push({
          type: 'block',
          content: raw.slice(2, -2).trim(),
          key: counter++,
        });
      } else if (raw.startsWith('\\[') && raw.endsWith('\\]')) {
        tokens.push({
          type: 'block',
          content: raw.slice(2, -2).trim(),
          key: counter++,
        });
      } else if (raw.startsWith('$') && raw.endsWith('$')) {
        tokens.push({
          type: 'inline',
          content: raw.slice(1, -1).trim(),
          key: counter++,
        });
      } else if (raw.startsWith('\\(') && raw.endsWith('\\)')) {
        tokens.push({
          type: 'inline',
          content: raw.slice(2, -2).trim(),
          key: counter++,
        });
      }

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      tokens.push({
        type: 'text',
        content: text.slice(lastIndex),
        key: counter++,
      });
    }

    return tokens;
  }, [text]);

  return (
    <span className={className}>
      {parts.map((p) => {
        if (p.type === 'block') {
          return <MathView key={p.key} math={p.content} block />;
        }
        if (p.type === 'inline') {
          return <MathView key={p.key} math={p.content} />;
        }
        return <React.Fragment key={p.key}>{p.content}</React.Fragment>;
      })}
    </span>
  );
};
