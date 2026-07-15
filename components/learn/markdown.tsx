import { Fragment } from "react";

/**
 * Minimal markdown renderer for lesson blocks (headings, lists, bold, em).
 * Deliberately tiny and dependency-free; lesson copy is authored in-house so
 * the supported subset is a contract, not a limitation.
 */

function inline(text: string, key: number) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
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
        if (part.startsWith("*") && part.endsWith("*")) {
          return <em key={i}>{part.slice(1, -1)}</em>;
        }
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </Fragment>
  );
}

export function Markdown({ md }: { md: string }) {
  const lines = md.split("\n");
  const out: React.ReactNode[] = [];
  let list: string[] = [];
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
  const flushPara = () => {
    if (para.length) {
      out.push(<p key={key++}>{inline(para.join(" "), 0)}</p>);
      para = [];
    }
  };

  for (const line of lines) {
    const t = line.trim();
    if (t.startsWith("## ")) {
      flushList();
      flushPara();
      out.push(
        <h2 key={key++} className="pt-2 text-headline-md text-fg-primary">
          {t.slice(3)}
        </h2>,
      );
    } else if (t.startsWith("- ")) {
      flushPara();
      list.push(t.slice(2));
    } else if (t === "") {
      flushList();
      flushPara();
    } else {
      para.push(t);
    }
  }
  flushList();
  flushPara();

  return <div className="space-y-4 text-body-base leading-7 text-fg-secondary">{out}</div>;
}
