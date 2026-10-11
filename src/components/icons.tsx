import Svg, { Circle, Path } from 'react-native-svg';

// docs/design/mockups のSVGをそのまま移植したアイコン

type IconProps = { color: string; size?: number };

function Icon({
  color,
  size,
  strokeWidth,
  children,
}: IconProps & { size: number; strokeWidth: number; children: React.ReactNode }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round">
      {children}
    </Svg>
  );
}

export function MenuIcon({ color, size = 22 }: IconProps) {
  return (
    <Icon color={color} size={size} strokeWidth={1.8}>
      <Path d="M4 6h16" />
      <Path d="M4 12h16" />
      <Path d="M4 18h10" />
    </Icon>
  );
}

export function ChevronDownIcon({ color, size = 16 }: IconProps) {
  return (
    <Icon color={color} size={size} strokeWidth={2}>
      <Path d="M6 9l6 6 6-6" />
    </Icon>
  );
}

export function ChevronRightIcon({ color, size = 16 }: IconProps) {
  return (
    <Icon color={color} size={size} strokeWidth={2}>
      <Path d="M9 6l6 6-6 6" />
    </Icon>
  );
}

export function SettingsIcon({ color, size = 22 }: IconProps) {
  return (
    <Icon color={color} size={size} strokeWidth={1.8}>
      <Circle cx="12" cy="12" r="3" />
      <Path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </Icon>
  );
}

export function PlusIcon({ color, size = 20, strokeWidth = 2.4 }: IconProps & { strokeWidth?: number }) {
  return (
    <Icon color={color} size={size} strokeWidth={strokeWidth}>
      <Path d="M12 5v14" />
      <Path d="M5 12h14" />
    </Icon>
  );
}

export function MinusIcon({ color, size = 18 }: IconProps) {
  return (
    <Icon color={color} size={size} strokeWidth={2.2}>
      <Path d="M6 12h12" />
    </Icon>
  );
}

export function CheckIcon({ color, size = 12 }: IconProps) {
  return (
    <Icon color={color} size={size} strokeWidth={2.4}>
      <Path d="M5 12l5 5 9-10" />
    </Icon>
  );
}

export function ClockIcon({ color, size = 16 }: IconProps) {
  return (
    <Icon color={color} size={size} strokeWidth={1.9}>
      <Circle cx="12" cy="12" r="8.5" />
      <Path d="M12 7.5V12l3 2" />
    </Icon>
  );
}

export function DownloadIcon({ color, size = 16 }: IconProps) {
  return (
    <Icon color={color} size={size} strokeWidth={1.9}>
      <Path d="M12 4v11" />
      <Path d="M7.5 10.5L12 15l4.5-4.5" />
      <Path d="M5 19h14" />
    </Icon>
  );
}

export function SortIcon({ color, size = 18 }: IconProps) {
  return (
    <Icon color={color} size={size} strokeWidth={1.9}>
      <Path d="M7 4v16" />
      <Path d="M3.5 16.5L7 20l3.5-3.5" />
      <Path d="M17 20V4" />
      <Path d="M13.5 7.5L17 4l3.5 3.5" />
    </Icon>
  );
}

export function CloseIcon({ color, size = 20 }: IconProps) {
  return (
    <Icon color={color} size={size} strokeWidth={2.2}>
      <Path d="M6 6l12 12" />
      <Path d="M18 6L6 18" />
    </Icon>
  );
}

export function FolderIcon({ color, size = 18 }: IconProps) {
  return (
    <Icon color={color} size={size} strokeWidth={1.9}>
      <Path d="M4 5h16v5H4z" />
      <Path d="M4 14h16v5H4z" />
    </Icon>
  );
}

export function DragHandleIcon({ color, size = 18 }: IconProps) {
  return (
    <Icon color={color} size={size} strokeWidth={2}>
      <Path d="M4 8h16" />
      <Path d="M4 12h16" />
      <Path d="M4 16h16" />
    </Icon>
  );
}

export function TrashIcon({ color, size = 18 }: IconProps) {
  return (
    <Icon color={color} size={size} strokeWidth={1.9}>
      <Path d="M3 6h18" />
      <Path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <Path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    </Icon>
  );
}

export function EditIcon({ color, size = 18 }: IconProps) {
  return (
    <Icon color={color} size={size} strokeWidth={1.9}>
      <Path d="M12 20h9" />
      <Path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </Icon>
  );
}

export function CheckCircleIcon({ color, size = 20 }: IconProps) {
  return (
    <Icon color={color} size={size} strokeWidth={2.6}>
      <Path d="M5 12l5 5 9-10" />
    </Icon>
  );
}
