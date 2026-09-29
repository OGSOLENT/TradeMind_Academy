"use client";

import { Children, isValidElement, type CSSProperties } from "react";
import { cn } from "@/lib/utils";

export function Stagger({
  children,
  className,
  delay = 0,
  autoWrap = true,
  style,
  ...props
}: { delay?: number; autoWrap?: boolean } & React.HTMLAttributes<HTMLDivElement>) {
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
