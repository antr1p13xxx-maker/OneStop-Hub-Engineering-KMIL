export type ShortcutType = 'web' | 'directory' | 'protocol' | 'file';

export interface ShortcutItem {
  id: string;
  title: string;
  url: string; // e.g. "https://mail.google.com" or "D:\Proyek_2026\ClientA" or "vscode://file/D:/Code"
  type: ShortcutType;
  groupId: string;
  description?: string;
  iconType: 'preset' | 'favicon' | 'custom' | 'drive';
  iconValue?: string; // lucide icon name, emoji, or image URL
  color?: string; // badge accent
  isPinned?: boolean;
  clickCount: number;
  lastOpened?: number; // timestamp
  tags?: string[];
  createdAt: number;
}

export interface ShortcutGroup {
  id: string;
  name: string;
  description?: string;
  color: 'indigo' | 'blue' | 'emerald' | 'amber' | 'rose' | 'purple' | 'cyan' | 'slate';
  icon: string; // Lucide icon identifier
  order: number;
}

export type ViewMode = 'grid' | 'list' | 'sections' | 'orbit';

export type CardDensity = 'small' | 'medium' | 'large';

export type UiStyle = 'claymorphism' | 'classic';

export type SortOption = 'clicks' | 'recent' | 'name';

export type LogoFitMode = 'cover' | 'contain';

export interface CustomLogoConfig {
  src: string;
  fit: LogoFitMode;
}

export type FilterType = 'all' | ShortcutType;

export interface AppNotification {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  message: string;
  details?: string;
}

export type UserRole = 'viewer' | 'lead' | 'manager';

export interface RoleConfig {
  role: UserRole;
  name: string;
  description: string;
  badgeColor: string;
  requiresPassword: boolean;
}

export interface RolePermissions {
  canAddShortcut: boolean;
  canEditShortcut: boolean;
  canDeleteShortcut: boolean;
  canManageGroups: boolean;
  canDeleteGroup: boolean;
  canImportBackup: boolean;
  canResetData: boolean;
}

