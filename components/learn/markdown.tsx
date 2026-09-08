import { Fragment } from "react";

/**
 * Minimal markdown renderer for lesson blocks.
 *
 * Supported subset (a contract, not a limitation — lesson copy is authored
 * in-house): h2/h3, paragraphs, bullet and numbered lists, blockquotes
 * (used for the definition callouts), pipe tables, `code`, **bold**, *em*.
 * Tables scroll horizontally on their own so the page body never does.
 */

function inline(text: string, key: number) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return (
    <Fragment key={key}>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={i} className="font-semibold text-fg-primary">
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith("`") && part.endsWith("`")) {
          return (
            <code key={i} className="num rounded bg-white/5 px-1.5 py-0.5 text-[0.9em] text-accent-bright">
              {part.slice(1, -1)}
            </code>
          );
        }
        if (part.startsWith("*") && part.endsWith("*")) {
          return <em key={i}>{part.slice(1, -1)}</em>;
        }
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </Fragment>
  );
}

/** A pipe-table row split into trimmed cells. */
function cells(line: string): string[] {
  return line
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((c) => c.trim());
}

const isTableRow = (t: string) => t.startsWith("|") && t.endsWith("|");
const isTableDivider = (t: string) => /^\|[\s:|-]+\|$/.test(t);

export function Markdown({ md }: { md: string }) {
  const lines = md.split("\n");
  const out: React.ReactNode[] = [];
  let list: string[] = [];
  let ordered: string[] = [];
  let quote: string[] = [];
  let table: string[][] = [];
  let para: string[] = [];
  let key = 0;

  const flushList = () => {
    if (list.length) {
      out.push(
        <ul key={key++} className="list-disc space-y-1.5 pl-5">
          {list.map((item, i) => (
            <li key={i}>{inline(item, i)}</li>
          ))}
        </ul>,
      );
      list = [];
    }
  };
  const flushOrdered = () => {
    if (ordered.length) {
      out.push(
        <ol key={key++} className="list-decimal space-y-1.5 pl-5 marker:num marker:text-fg-muted">
          {ordered.map((item, i) => (
            <li key={i}>{inline(item, i)}</li>
          ))}
        </ol>,
      );
      ordered = [];
    }
  };
  const flushQuote = () => {
    if (quote.length) {
      out.push(
        <blockquote
          key={key++}
          className="rounded-control border-l-2 border-mastery bg-mastery/5 py-3 pl-4 pr-4 text-fg-primary"
        >
          {inline(quote.join(" "), 0)}
        </blockquote>,
      );
      quote = [];
    }
  };
  const flushTable = () => {
    if (table.length) {
      const [head, ...body] = table;
      out.push(
        <div key={key++} className="-mx-1 overflow-x-auto">
          <table className="w-full min-w-[28rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-hair">
                {(head ?? []).map((c, i) => (
                  <th
                    key={i}
                    scope="col"
                    className="px-3 py-2 text-left text-label-caps uppercase tracking-wider text-fg-secondary"
                  >
                    {inline(c, i)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {body.map((row, r) => (
                <tr key={r} className="border-b border-hair/60 last:border-0">
                  {row.map((c, i) => (
                    <td key={i} className="px-3 py-2 align-top text-fg-secondary">
                      {inline(c, i)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      table = [];
    }
  };
  const flushPara = () => {
    if (para.length) {
      out.push(<p key={key++}>{inline(para.join(" "), 0)}</p>);
      para = [];
    }
  };
  const flushAll = () => {
    flushList();
    flushOrdered();
    flushQuote();
    flushTable();
    flushPara();
  };

  for (const line of lines) {
    const t = line.trim();

    if (isTableRow(t)) {
      flushList();
      flushOrdered();
      flushQuote();
      flushPara();
      if (!isTableDivider(t)) table.push(cells(t));
      continue;
    }
    if (t.startsWith("### ")) {
      flushAll();
      out.push(
        <h3 key={key++} className="pt-1 text-lg font-medium text-fg-primary">
          {t.slice(4)}
        </h3>,
      );
    } else if (t.startsWith("## ")) {
      flushAll();
      out.push(
        <h2 key={key++} className="pt-2 text-headline-md text-fg-primary">
          {t.slice(3)}
        </h2>,
      );
    } else if (t.startsWith("> ")) {
      flushList();
      flushOrdered();
      flushTable();
      flushPara();
      quote.push(t.slice(2));
    } else if (t.startsWith("- ")) {
      flushOrdered();
      flushQuote();
      flushTable();
      flushPara();
      list.push(t.slice(2));
    } else if (/^\d+\.\s/.test(t)) {
      flushList();
      flushQuote();
      flushTable();
      flushPara();
      ordered.push(t.replace(/^\d+\.\s/, ""));
    } else if (t === "" || t === "---") {
      flushAll();
    } else {
      flushList();
      flushOrdered();
      flushQuote();
      flushTable();
      para.push(t);
    }
  }
  flushAll();

  return <div className="space-y-4 text-body-base leading-7 text-fg-secondary">{out}</div>;
}
