/** Inline stroke icons for the shell navigation. No icon font, no extra dependency. */

type IconProps = React.SVGAttributes<SVGSVGElement>;

function base(props: IconProps): IconProps {
  return {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
    ...props,
  };
}

export function HomeIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
    </svg>
  );
}

export function ConstellationIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="5" cy="18" r="2" />
      <circle cx="12" cy="7" r="2" />
      <circle cx="19" cy="15" r="2" />
      <path d="M6.5 16.5 10.7 8.8M13.8 8.2l3.7 5.3" />
    </svg>
  );
}

export function TargetIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3.5" />
      <circle cx="12" cy="12" r="0.5" fill="currentColor" />
    </svg>
  );
}

export function CardsIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="7" y="5" width="13" height="16" rx="2" />
      <path d="M4 17V4a1.5 1.5 0 0 1 1.5-1.5H15" />
    </svg>
  );
}

export function UserIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 21c1.2-3.5 4-5.5 7.5-5.5s6.3 2 7.5 5.5" />
    </svg>
  );
}
