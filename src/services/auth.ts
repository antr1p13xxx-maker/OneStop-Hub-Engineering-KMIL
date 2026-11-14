import { UserRole, RolePermissions, RoleConfig } from '../types';

const STORAGE_ROLE_KEY = 'onestop_hub_current_role_v1';

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
  manager: 'Eng159',
};

export function getStoredRole(): UserRole {
  try {
    const saved = localStorage.getItem(STORAGE_ROLE_KEY) as UserRole;
    if (saved && (saved === 'viewer' || saved === 'lead' || saved === 'manager')) {
      return saved;
    }
    // Default to manager or viewer?
    // Setting default to manager on first load or viewer with easy switch:
    // Starting as manager or viewer? The user specifically asked:
    // "tambahkan akses Viewer (hanya bisa lihat), Lead Engineering ( password Eng123) tidak bisa Menghapus, Manager Engineering full akses"
    // Let's default to Manager or Viewer. If default is viewer, user can test switching right away!
    // Or if default is manager, user is in full control and can switch to Lead / Viewer to test.
    return 'manager';
  } catch {
    return 'manager';
  }
}

export function saveStoredRole(role: UserRole): void {
  try {
    localStorage.setItem(STORAGE_ROLE_KEY, role);
  } catch {
    // Ignore
  }
}

export function verifyRolePassword(role: 'lead' | 'manager', inputPass: string): boolean {
  return inputPass === ROLE_PASSWORDS[role];
}
