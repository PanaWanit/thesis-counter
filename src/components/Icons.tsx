import type { ReactNode, SVGProps } from 'react';

export type IconName =
  | 'arrowRight'
  | 'book'
  | 'calendar'
  | 'categories'
  | 'check'
  | 'clock'
  | 'close'
  | 'download'
  | 'edit'
  | 'flask'
  | 'insights'
  | 'play'
  | 'plus'
  | 'sessions'
  | 'stop'
  | 'trash';

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName;
  size?: number;
  title?: string;
}

function paths(name: IconName): ReactNode {
  switch (name) {
    case 'arrowRight':
      return <><path d="M5 12h14" /><path d="m14 7 5 5-5 5" /></>;
    case 'book':
      return <><path d="M4 5.5A3.5 3.5 0 0 1 7.5 2H12v17H7.5A3.5 3.5 0 0 0 4 22Z" /><path d="M20 5.5A3.5 3.5 0 0 0 16.5 2H12v17h4.5A3.5 3.5 0 0 1 20 22Z" /></>;
    case 'calendar':
      return <><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3v4M16 3v4M4 10h16" /></>;
    case 'categories':
      return <><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><rect x="14" y="14" width="6" height="6" rx="1" /></>;
    case 'check':
      return <path d="m5 12 4 4L19 6" />;
    case 'clock':
      return <><circle cx="12" cy="12" r="8" /><path d="M12 8v5l3 2" /></>;
    case 'close':
      return <><path d="m6 6 12 12" /><path d="m18 6-12 12" /></>;
    case 'download':
      return <><path d="M12 4v11" /><path d="m8 11 4 4 4-4" /><path d="M5 19h14" /></>;
    case 'edit':
      return <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" /></>;
    case 'flask':
      return <><path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.7 3h10.6A2 2 0 0 0 19 18l-5-9V3" /><path d="M8 14h8" /></>;
    case 'insights':
      return <><path d="M5 19V9M12 19V5M19 19v-7" /><path d="M3 19h18" /></>;
    case 'plus':
      return <><path d="M12 5v14" /><path d="M5 12h14" /></>;
    case 'play':
      return <path d="m9 7 8 5-8 5Z" />;
    case 'sessions':
      return <><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3v4M16 3v4M4 10h16M8 14h3M8 17h6" /></>;
    case 'stop':
      return <rect x="7" y="7" width="10" height="10" rx="1.5" />;
    case 'trash':
      return <><path d="M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13" /><path d="M10 11v5M14 11v5" /></>;
  }
}

export function AppIcon({ name, size = 20, title, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      focusable="false"
      {...props}
    >
      {title && <title>{title}</title>}
      {paths(name)}
    </svg>
  );
}
