"use client";

import { Children, isValidElement, type CSSProperties } from "react";
import { cn } from "@/lib/utils";

/**
 * Page entrance choreography.
 *
 * The design system says entrances are "fade plus a 12 to 24px rise, stagger
 * 0.06, max 8 children" (section 3). This is that rule made reusable, so
 * every page opens the same way instead of snapping into place.
 *
 * It used to be Framer Motion. That rendered every item with an inline
 * opacity:0 in the server HTML, so nothing on a page was visible until the
 * JavaScript had downloaded, parsed and hydrated, which on a throttled
 * phone put the largest contentful paint five seconds after the HTML
 * arrived. Now it's a CSS animation: the server HTML paints straight away,
 * the rise runs from the first frame, and the stagger comes from nth-child
 * delays (globals.css, "Entrances"). Under reduced motion the global rule
 * clamps it to a 150ms fade with no rise and no stagger. Content still
 * arrives, nothing travels.
 */

export function Stagger({
  children,
  className,
  delay = 0,
  autoWrap = true,
  style,
  ...props
}: { delay?: number; autoWrap?: boolean } & React.HTMLAttributes<HTMLDivElement>) {
  // By default I wrap each direct child in a StaggerItem. Callers that
  // already wrap their own children (the dashboard, which needs layout
  // classes on the items) pass autoWrap={false}.
  const content = autoWrap
    ? Children.map(children, (child) =>
        isValidElement(child) ? <StaggerItem>{child}</StaggerItem> : child,
      )
    : children;

  return (
    <div
      className={cn("tm-stagger", className)}
      style={{ ...style, "--tm-base": `${Math.round(delay * 1000)}ms` } as CSSProperties}
      {...props}
    >
      {content}
    </div>
  );
}

export function StaggerItem({
  children,
  className,
  rise = 18,
  style,
  ...props
}: { rise?: number } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("tm-rise", className)}
      style={{ ...style, "--tm-rise": `${rise}px` } as CSSProperties}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * A scroll-triggered reveal for long reading columns (lessons, legal, the
 * landing page). Where the browser supports scroll-driven animations the
 * block settles up into place as it enters the viewport, driven by the
 * scroll position and needing no JavaScript; anywhere else it's simply
 * there. It moves but never fades: a paragraph at half opacity across the
 * bottom of the screen is text at reduced contrast, and the audit said so.
 * Either way the server HTML is never hidden, which is what keeps the
 * first paint honest on slow connections.
 */
export function Reveal({
  children,
  className,
  rise = 16,
  style,
  ...props
}: { rise?: number } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("tm-reveal", className)}
      style={{ ...style, "--tm-rise": `${rise}px` } as CSSProperties}
      {...props}
    >
      {children}
    </div>
  );
}
