import React from 'react';

export interface IconProps {
  className?: string;
  size?: number;
  style?: React.CSSProperties;
}

function getIconDimension(size?: number, className?: string): number {
  if (typeof size === 'number') return size;
  if (className) {
    if (className.includes('w-3') || className.includes('h-3') || className.includes('size-3')) return 12;
    if (className.includes('w-4') || className.includes('h-4') || className.includes('size-4')) return 16;
    if (className.includes('w-5') || className.includes('h-5') || className.includes('size-5')) return 20;
    if (className.includes('w-6') || className.includes('h-6') || className.includes('size-6')) return 24;
    if (className.includes('w-7') || className.includes('h-7') || className.includes('size-7')) return 28;
    if (className.includes('w-8') || className.includes('h-8') || className.includes('size-8')) return 32;
  }
  return 20;
}

const BaseIcon: React.FC<IconProps & { children: React.ReactNode; viewBox?: string }> = ({
  className = '',
  size,
  style,
  children,
  viewBox = '0 0 24 24',
}) => {
  const dim = getIconDimension(size, className);
  return (
    <svg
      width={dim}
      height={dim}
      className={className}
      style={{
        width: `${dim}px`,
        height: `${dim}px`,
        minWidth: `${dim}px`,
        minHeight: `${dim}px`,
        maxWidth: `${dim}px`,
        maxHeight: `${dim}px`,
        flexShrink: 0,
        display: 'inline-block',
        verticalAlign: 'middle',
        ...style,
      }}
      viewBox={viewBox}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
};

export const IconStadium: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}>
    <path d="M2 10s3-3 10-3 10 3 10 3" />
    <path d="M2 14s3 3 10 3 10-3 10-3" />
    <path d="M4 10v4" />
    <path d="M8 8v8" />
    <path d="M12 7v10" />
    <path d="M16 8v8" />
    <path d="M20 10v4" />
  </BaseIcon>
);

export const IconBall: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="m4.93 4.93 4.24 4.24" />
    <path d="m14.83 9.17 4.24-4.24" />
    <path d="m14.83 14.83 4.24 4.24" />
    <path d="m9.17 14.83-4.24 4.24" />
    <circle cx="12" cy="12" r="3" />
  </BaseIcon>
);

export const IconTrophy: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}>
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.45 1-1 1H8c-.55 0-1 .45-1 1v1c0 .55.45 1 1 1h8c.55 0 1-.45 1-1v-1c0-.55-.45-1-1-1h-1c-.55 0-1-.45-1-1v-2.34" />
    <path d="M6 4h12v7a6 6 0 0 1-12 0V4Z" />
  </BaseIcon>
);

export const IconCalendar: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}>
    <path d="M8 2v4" />
    <path d="M16 2v4" />
    <rect width="18" height="18" x="3" y="4" rx="2" />
    <path d="M3 10h18" />
  </BaseIcon>
);

export const IconClipboard: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}>
    <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <path d="M9 12h6" />
    <path d="M9 16h6" />
  </BaseIcon>
);

export const IconChart: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}>
    <path d="M3 3v18h18" />
    <path d="m19 9-5 5-4-4-3 3" />
  </BaseIcon>
);

export const IconChartBar: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}>
    <path d="M12 20V10" />
    <path d="M18 20V4" />
    <path d="M6 20v-4" />
  </BaseIcon>
);

export const IconShield: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}>
    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
  </BaseIcon>
);

export const IconCrown: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}>
    <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
  </BaseIcon>
);

export const IconUsers: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </BaseIcon>
);

export const IconUserPlus: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <line x1="19" x2="19" y1="8" y2="14" />
    <line x1="22" x2="16" y1="11" y2="11" />
  </BaseIcon>
);

export const IconWhistle: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}>
    <path d="M11 5a6 6 0 1 0 6 6V7l5-2v4h-2" />
    <circle cx="11" cy="11" r="2" />
  </BaseIcon>
);

export const IconMail: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}>
    <rect width="20" height="16" x="2" y="4" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </BaseIcon>
);

export const IconLock: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}>
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </BaseIcon>
);

export const IconCheck: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}>
    <path d="M20 6 9 17l-5-5" />
  </BaseIcon>
);

export const IconAlert: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" x2="12" y1="8" y2="12" />
    <line x1="12" x2="12.01" y1="16" y2="16" />
  </BaseIcon>
);

export const IconPencil: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}>
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    <path d="m15 5 4 4" />
  </BaseIcon>
);

export const IconLogout: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" x2="9" y1="12" y2="12" />
  </BaseIcon>
);

export const IconBell: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}>
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </BaseIcon>
);

export const IconClock: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </BaseIcon>
);

export const IconPlus: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}>
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </BaseIcon>
);

export const IconEye: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}>
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </BaseIcon>
);

export const IconEyeOff: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}>
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
    <line x1="2" x2="22" y1="2" y2="22" />
  </BaseIcon>
);

