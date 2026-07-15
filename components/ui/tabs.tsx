"use client";

import { useId, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/motion";

export interface TabItem {
  id: string;
  label: string;
  content: React.ReactNode;
}

export interface TabsProps {
  items: TabItem[];
  defaultTab?: string;
  className?: string;
}

/** Tab strip with a spring-animated underline (shared layout). */
export function Tabs({ items, defaultTab, className }: TabsProps) {
  const [active, setActive] = useState(defaultTab ?? items[0]?.id);
  const groupId = useId();
  const activeItem = items.find((t) => t.id === active) ?? items[0];

  return (
    <div className={className}>
      <div role="tablist" className="flex gap-1 border-b border-hair">
        {items.map((item) => {
          const selected = item.id === active;
          return (
            <button
              key={item.id}
              role="tab"
              id={`${groupId}-tab-${item.id}`}
              aria-selected={selected}
              aria-controls={`${groupId}-panel-${item.id}`}
              onClick={() => setActive(item.id)}
              className={cn(
                "relative px-4 py-2.5 text-sm font-medium transition-colors duration-200",
                selected ? "text-fg-primary" : "text-fg-secondary hover:text-fg-primary",
              )}
            >
              {item.label}
              {selected && (
                <motion.span
                  layoutId={`${groupId}-underline`}
                  transition={spring.ui}
                  className="absolute inset-x-2 -bottom-px h-0.5 rounded-pill bg-accent"
                />
              )}
            </button>
          );
        })}
      </div>
      <div
        role="tabpanel"
        id={`${groupId}-panel-${activeItem?.id}`}
        aria-labelledby={`${groupId}-tab-${activeItem?.id}`}
        className="pt-4"
      >
        {activeItem?.content}
      </div>
    </div>
  );
}
