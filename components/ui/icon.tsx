import Ionicons from '@expo/vector-icons/Ionicons';
import FeatherIcons from '@expo/vector-icons/Feather';

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
  | 'settings'
  | 'alert'
  | 'wifi-off'
  | 'refresh'
  | 'feather'
  | 'close-circle';

type IconDef =
  | { source: 'ionicons'; outline: string; filled: string }
  | { source: 'feather'; name: string };

const ICON_MAP: Record<IconName, IconDef> = {
  home: { source: 'ionicons', outline: 'home-outline', filled: 'home' },
  library: { source: 'ionicons', outline: 'bookmarks-outline', filled: 'bookmarks' },
  weave: { source: 'ionicons', outline: 'create-outline', filled: 'create' },
  user: { source: 'ionicons', outline: 'person-outline', filled: 'person' },
  bookmark: { source: 'ionicons', outline: 'bookmark-outline', filled: 'bookmark' },
  'chevron-right': { source: 'ionicons', outline: 'chevron-forward', filled: 'chevron-forward' },
  'chevron-left': { source: 'ionicons', outline: 'chevron-back', filled: 'chevron-back' },
  more: { source: 'ionicons', outline: 'ellipsis-horizontal', filled: 'ellipsis-horizontal' },
  close: { source: 'ionicons', outline: 'close', filled: 'close' },
  plus: { source: 'ionicons', outline: 'add', filled: 'add' },
  search: { source: 'ionicons', outline: 'search-outline', filled: 'search' },
  sparkle: { source: 'ionicons', outline: 'sparkles-outline', filled: 'sparkles' },
  history: { source: 'ionicons', outline: 'time-outline', filled: 'time' },
  settings: { source: 'ionicons', outline: 'settings-outline', filled: 'settings' },
  alert: { source: 'ionicons', outline: 'alert-circle-outline', filled: 'alert-circle' },
  'wifi-off': { source: 'ionicons', outline: 'cloud-offline-outline', filled: 'cloud-offline' },
  refresh: { source: 'ionicons', outline: 'refresh-outline', filled: 'refresh' },
  feather: { source: 'feather', name: 'feather' },
  'close-circle': { source: 'ionicons', outline: 'close-circle-outline', filled: 'close-circle' },
};

type Props = {
  name: IconName;
  size?: number;
  color: string;
  filled?: boolean;
};

export function Icon({ name, size = 22, color, filled = false }: Props) {
  const def = ICON_MAP[name];
  if (def.source === 'feather') {
    return <FeatherIcons name={def.name as any} size={size} color={color} />;
  }
  const iconName = filled ? def.filled : def.outline;
  return <Ionicons name={iconName as any} size={size} color={color} />;
}
