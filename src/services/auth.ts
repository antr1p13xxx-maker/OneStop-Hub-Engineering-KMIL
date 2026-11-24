import { UserRole, RolePermissions, RoleConfig } from '../types';

export const ROLE_CONFIGS: Record<UserRole, RoleConfig> = {
  viewer: {
    role: 'viewer',
    name: 'Viewer',
    description: 'Hanya bisa melihat, mencari, dan membuka pintasan serta direktori folder.',
    badgeColor: 'text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700',
    requiresPassword: false,
  },
  lead: {
    role: 'lead',
    name: 'Lead Engineering',
    description: 'Dapat menambah dan mengedit pintasan/grup, tetapi tidak diizinkan menghapus.',
    badgeColor: 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
    requiresPassword: true,
  },
  manager: {
    role: 'manager',
    name: 'Manager Engineering',
    description: 'Akses penuh untuk melihat, menambah, mengubah, dan menghapus seluruh data.',
    badgeColor: 'text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800',
    requiresPassword: true,
  },
};

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  viewer: {
    canAddShortcut: false,
    canEditShortcut: false,
    canDeleteShortcut: false,
    canManageGroups: false,
    canDeleteGroup: false,
    canImportBackup: false,
    canResetData: false,
  },
  lead: {
    canAddShortcut: true,
    canEditShortcut: true,
    canDeleteShortcut: false,
    canManageGroups: true,
    canDeleteGroup: false,
    canImportBackup: true,
    canResetData: false,
  },
  manager: {
    canAddShortcut: true,
    canEditShortcut: true,
    canDeleteShortcut: true,
    canManageGroups: true,
    canDeleteGroup: true,
    canImportBackup: true,
    canResetData: true,
  },
};

// Hardcoded passwords per prompt requirement
export const ROLE_PASSWORDS: Record<'lead' | 'manager', string> = {
  lead: 'Eng123',
  manager: 'Eng999',
};

const SESSION_ROLE_KEY = 'onestop_hub_session_role_v1';
const LEGACY_STORAGE_ROLE_KEY = 'onestop_hub_current_role_v1';

export function getStoredRole(): UserRole {
  try {
    // Clean up legacy localStorage key so previous default 'manager' doesn't bypass initial viewer access
    if (localStorage.getItem(LEGACY_STORAGE_ROLE_KEY)) {
      localStorage.removeItem(LEGACY_STORAGE_ROLE_KEY);
    }
    const saved = sessionStorage.getItem(SESSION_ROLE_KEY) as UserRole | null;
    if (saved && (saved === 'viewer' || saved === 'lead' || saved === 'manager')) {
      return saved;
    }
    return 'viewer';
  } catch {
    return 'viewer';
  }
}

export function saveStoredRole(role: UserRole): void {
  try {
    sessionStorage.setItem(SESSION_ROLE_KEY, role);
  } catch {
    // Ignore
  }
}

export function verifyRolePassword(role: 'lead' | 'manager', inputPass: string): boolean {
  return inputPass === ROLE_PASSWORDS[role];
}
