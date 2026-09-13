"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Kbd } from "@/components/ui/kbd";

/**
 * The keyboard shortcuts sheet. Press ? anywhere in the app (outside a text
 * field) and it opens; Escape closes it. Everything listed here is a real
 * binding somewhere in the app, so if a shortcut gets added or removed the
 * list has to change with it.
 */

const GROUPS: { heading: string; rows: [string[], string][] }[] = [
  {
    heading: "Anywhere",
    rows: [
      [["⌘", "K"], "Jump to a page, module or lesson (Ctrl K on Windows)"],
      [["?"], "Open this sheet"],
      [["Esc"], "Close a menu, dialog or panel"],
      [["Tab"], "Move between controls. Shift Tab goes back"],
    ],
  },
  {
    heading: "In a question",
    rows: [
      [["1", "…", "9"], "Pick an option. In a multi-select it toggles"],
      [["1"], "True, in a true/false question"],
      [["2"], "False, in a true/false question"],
      [["Enter"], "Check the answer, then continue to the next one"],
    ],
  },
  {
    heading: "In a lesson check",
    rows: [
      [["Enter"], "Check the answer, try the similar question, or continue"],
    ],
  },
];

export function useShortcutsSheet() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "?" || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      e.preventDefault();
      setOpen((o) => !o);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return { open, setOpen };
}

export function ShortcutsSheet({ open, onClose }: { open: boolean; onClose(): void }) {
  return (
    <Modal open={open} onClose={onClose} title="Keyboard shortcuts" className="max-w-lg">
      <div className="space-y-6">
        {GROUPS.map((g) => (
          <section key={g.heading}>
            <h3 className="text-label-caps uppercase tracking-[0.18em] text-fg-muted">{g.heading}</h3>
            <dl className="mt-3 divide-y divide-white/5">
              {g.rows.map(([keys, what]) => (
                <div key={what} className="flex items-center justify-between gap-6 py-2.5">
                  <dd className="text-sm text-fg-secondary">{what}</dd>
                  <dt className="flex shrink-0 items-center gap-1">
                    {keys.map((k, i) => (
                      <Kbd key={`${k}-${i}`}>{k}</Kbd>
                    ))}
                  </dt>
                </div>
              ))}
            </dl>
          </section>
        ))}
        <p className="text-xs text-fg-muted">
          Every control also works with a mouse or touch. The shortcuts are there for people who
          prefer the keyboard, and for screen reader users who move by control.
        </p>
      </div>
    </Modal>
  );
}
