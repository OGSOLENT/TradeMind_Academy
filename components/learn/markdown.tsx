import { Fragment } from "react";
import { slugify } from "@/lib/utils";

/**
 * A minimal markdown renderer for lesson blocks.
 *
 * It handles a fixed subset, and I think of that as a contract rather than a
 * limitation because I write the lesson copy myself: h2 and h3, paragraphs,
 * bullet and numbered lists, blockquotes (the definition callouts), pipe
 * tables, `code`, **bold** and *em*. Tables scroll sideways on their own so
 * the page body never has to.
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

/** One pipe-table row, split into trimmed cells. */
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
      // The definition callout. A teal spine, a small marker, and the text in
      // the primary colour so it stands out from the surrounding prose.
      out.push(
        <blockquote
          key={key++}
          className="relative rounded-control bg-mastery/[0.06] py-4 pl-5 pr-4 text-fg-primary shadow-[inset_0_0_0_1px_var(--mastery-glow)]"
        >
          <span aria-hidden="true" className="absolute inset-y-3 left-0 w-0.5 rounded-pill bg-mastery" />
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
        // Wide tables scroll sideways on a phone, so the wrapper is focusable
        // and keyboard users can scroll it with the arrow keys (WCAG 2.1.1).
        <div
          key={key++}
          className="-mx-1 overflow-x-auto rounded-control focus:outline-none focus-visible:shadow-[inset_0_0_0_1px_var(--accent)]"
          tabIndex={0}
          role="region"
          aria-label="Table, scrolls sideways on small screens"
        >
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
        <h3 key={key++} id={slugify(t.slice(4))} className="scroll-mt-32 pt-1 text-lg font-medium text-fg-primary">
          {t.slice(4)}
        </h3>,
      );
    } else if (t.startsWith("## ")) {
      flushAll();
      // Every h2 gets an id so the outline in the lesson rail can jump to it,
      // and a short teal rule above it to mark the section break.
      out.push(
        <h2 key={key++} id={slugify(t.slice(3))} className="group scroll-mt-32 pt-4 text-headline-md text-fg-primary">
          <span aria-hidden="true" className="mb-3 block h-px w-8 bg-gradient-to-r from-mastery to-transparent" />
          {t.slice(3)}
        </h2>,
      );
    } else if (t === "---") {
      flushAll();
      out.push(
        <hr key={key++} className="border-0 border-t border-hair" aria-hidden="true" />
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
    } else if (t === "") {
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

  return (
    <div data-prose className="space-y-4 text-body-base leading-7 text-fg-secondary">
      {out}
    </div>
  );
}
