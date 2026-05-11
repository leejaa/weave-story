import Ionicons from '@expo/vector-icons/Ionicons';

export type IconName =
  | 'home'
  | 'library'
  | 'weave'
  | 'user'
  | 'bookmark'
  | 'chevron-right'
  | 'chevron-left'
  | 'more'
  | 'close'
  | 'plus'
  | 'search'
  | 'sparkle'
  | 'history'
  | 'settings';

const ICON_MAP: Record<IconName, { outline: string; filled: string }> = {
  home: { outline: 'home-outline', filled: 'home' },
  library: { outline: 'bookmarks-outline', filled: 'bookmarks' },
  weave: { outline: 'create-outline', filled: 'create' },
  user: { outline: 'person-outline', filled: 'person' },
  bookmark: { outline: 'bookmark-outline', filled: 'bookmark' },
  'chevron-right': { outline: 'chevron-forward', filled: 'chevron-forward' },
  'chevron-left': { outline: 'chevron-back', filled: 'chevron-back' },
  more: { outline: 'ellipsis-horizontal', filled: 'ellipsis-horizontal' },
  close: { outline: 'close', filled: 'close' },
  plus: { outline: 'add', filled: 'add' },
  search: { outline: 'search-outline', filled: 'search' },
  sparkle: { outline: 'sparkles-outline', filled: 'sparkles' },
  history: { outline: 'time-outline', filled: 'time' },
  settings: { outline: 'settings-outline', filled: 'settings' },
};

type Props = {
  name: IconName;
  size?: number;
  color: string;
  filled?: boolean;
};

export function Icon({ name, size = 22, color, filled = false }: Props) {
  const iconName = filled ? ICON_MAP[name].filled : ICON_MAP[name].outline;
  return <Ionicons name={iconName as any} size={size} color={color} />;
}
