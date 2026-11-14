import { User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  Unsubscribe,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import {
  CardDensity,
  CustomLogoConfig,
  ShortcutGroup,
  ShortcutItem,
  ViewMode,
} from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function isQuotaExceededError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return (
    msg.includes('Quota exceeded') ||
    msg.includes('resource-exhausted') ||
    msg.includes('Free daily read units per project')
  );
}

// ============================================================================
// Blueprint Validation & Sanitization Helpers (Matches firebase-blueprint.json)
// ============================================================================
const VALID_ID_REGEX = /^[a-zA-Z0-9_\-]+$/;
const VALID_GROUP_COLORS = new Set<ShortcutGroup['color']>([
  'indigo',
  'blue',
  'emerald',
  'amber',
  'rose',
  'purple',
  'cyan',
  'slate',
]);
const VALID_SHORTCUT_TYPES = new Set<ShortcutItem['type']>([
  'web',
  'directory',
  'protocol',
  'file',
]);
const VALID_ICON_TYPES = new Set<ShortcutItem['iconType']>([
  'preset',
  'favicon',
  'custom',
  'drive',
]);

export function sanitizeId(raw: string, prefix = 'id'): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_\-]/g, '-').slice(0, 128);
  if (cleaned.length >= 1 && VALID_ID_REGEX.test(cleaned)) {
    return cleaned;
  }
  return `${prefix}-${Date.now()}`.slice(0, 128);
}

function clampString(value: string, maxLength: number, fallback = ''): string {
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  return trimmed.slice(0, maxLength);
}

function sanitizeTags(tags?: string[]): string[] | undefined {
  if (!Array.isArray(tags) || tags.length === 0) return undefined;
  const cleaned = tags
    .map((t) => String(t).trim().slice(0, 40))
    .filter((t) => t.length > 0)
    .slice(0, 10);
  return cleaned.length > 0 ? cleaned : undefined;
}

function toTimestampMillis(value: unknown): number {
  if (value instanceof Timestamp) {
    return value.toMillis();
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (
    value &&
    typeof value === 'object' &&
    'toMillis' in value &&
    typeof (value as { toMillis: () => number }).toMillis === 'function'
  ) {
    return (value as { toMillis: () => number }).toMillis();
  }
  return Date.now();
}

export interface WorkspacePreferencesPayload {
  cardDensity: CardDensity;
  viewMode: ViewMode;
  theme: 'light' | 'dark';
  jarvisIntroEnabled: boolean;
  jarvisAudioEnabled: boolean;
  customLogo: CustomLogoConfig | null;
}

// ============================================================================
// User Profile & Workspace Bootstrapping
// ============================================================================
export async function syncUserProfileAndWorkspace(user: User): Promise<void> {
  const uid = sanitizeId(user.uid, 'user');
  const profilePath = `users/${uid}/private/profile`;
  const workspacePath = `workspaces/${uid}`;

  const email = clampString(user.email || `${uid}@google.user`, 254, `${uid}@google.user`);
  const displayName = clampString(user.displayName || email.split('@')[0] || 'Engineer', 120, 'Engineer');
  const photoURL = user.photoURL ? clampString(user.photoURL, 500) : '';

  try {
    const profileRef = doc(db, 'users', uid, 'private', 'profile');
    const profileSnap = await getDoc(profileRef);
    if (!profileSnap.exists()) {
      const payload: Record<string, unknown> = {
        uid,
        email,
        displayName,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      if (photoURL) {
        payload.photoURL = photoURL;
      }
      await setDoc(profileRef, payload);
    } else {
      const updatePayload: Record<string, unknown> = {
        email,
        displayName,
        updatedAt: serverTimestamp(),
      };
      if (photoURL) {
        updatePayload.photoURL = photoURL;
      } else {
        updatePayload.photoURL = deleteField();
      }
      await updateDoc(profileRef, updatePayload);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, profilePath);
  }

  try {
    const workspaceRef = doc(db, 'workspaces', uid);
    const workspaceSnap = await getDoc(workspaceRef);
    if (!workspaceSnap.exists()) {
      await setDoc(workspaceRef, {
        id: uid,
        ownerId: uid,
        name: 'OneStop Hub Engineering',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, workspacePath);
  }
}

function buildGroupCreateDoc(uid: string, group: ShortcutGroup, index: number) {
  const id = sanitizeId(group.id, `group-${index}`);
  const payload: Record<string, unknown> = {
    id,
    ownerId: uid,
    name: clampString(group.name, 80, 'Grup Baru'),
    color: VALID_GROUP_COLORS.has(group.color) ? group.color : 'indigo',
    icon: clampString(group.icon, 250000, 'Folder'),
    order: typeof group.order === 'number' && Number.isFinite(group.order) ? Math.min(Math.max(0, group.order), 10000) : index + 1,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  if (group.description && group.description.trim()) {
    payload.description = clampString(group.description, 240);
  }
  return { id, payload };
}

function buildShortcutCreateDoc(
  uid: string,
  shortcut: ShortcutItem,
  validGroupIds: Set<string>,
  fallbackGroupId: string
) {
  const id = sanitizeId(shortcut.id, 'sc');
  const rawGroupId = sanitizeId(shortcut.groupId, 'group');
  const groupId = validGroupIds.has(rawGroupId) ? rawGroupId : fallbackGroupId;

  const payload: Record<string, unknown> = {
    id,
    ownerId: uid,
    title: clampString(shortcut.title, 120, 'Pintasan Tanpa Nama'),
    url: clampString(shortcut.url, 1000, 'https://example.com'),
    type: VALID_SHORTCUT_TYPES.has(shortcut.type) ? shortcut.type : 'web',
    groupId,
    iconType: VALID_ICON_TYPES.has(shortcut.iconType) ? shortcut.iconType : 'preset',
    isPinned: Boolean(shortcut.isPinned),
    clickCount:
      typeof shortcut.clickCount === 'number' && Number.isFinite(shortcut.clickCount)
        ? Math.min(Math.max(0, Math.floor(shortcut.clickCount)), 100000000)
        : 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (shortcut.description && shortcut.description.trim()) {
    payload.description = clampString(shortcut.description, 500);
  }
  if (shortcut.iconValue && shortcut.iconValue.trim()) {
    const trimmedIcon = shortcut.iconValue.trim();
    if (trimmedIcon.length > 250000) {
      throw new Error('Ukuran foto ikon pintasan terlalu besar (maksimal 250KB).');
    }
    payload.iconValue = clampString(trimmedIcon, 250000);
  }
  if (shortcut.color && shortcut.color.trim()) {
    payload.color = clampString(shortcut.color, 30);
  }
  if (typeof shortcut.lastOpened === 'number' && Number.isFinite(shortcut.lastOpened) && shortcut.lastOpened >= 0) {
    payload.lastOpened = Math.floor(shortcut.lastOpened);
  }
  const cleanTags = sanitizeTags(shortcut.tags);
  if (cleanTags) {
    payload.tags = cleanTags;
  }

  return { id, payload };
}

function buildSettingsCreateDoc(uid: string, prefs: WorkspacePreferencesPayload) {
  const payload: Record<string, unknown> = {
    ownerId: uid,
    cardDensity: prefs.cardDensity,
    viewMode: prefs.viewMode,
    theme: prefs.theme,
    jarvisIntroEnabled: Boolean(prefs.jarvisIntroEnabled),
    jarvisAudioEnabled: Boolean(prefs.jarvisAudioEnabled),
    updatedAt: serverTimestamp(),
  };
  if (prefs.customLogo?.src && prefs.customLogo.src.trim().length > 0 && prefs.customLogo.src.length <= 250000) {
    payload.customLogoSrc = prefs.customLogo.src;
    payload.customLogoFit = prefs.customLogo.fit === 'contain' ? 'contain' : 'cover';
  }
  return payload;
}

export async function bootstrapInitialWorkspaceData(
  userId: string,
  localGroups: ShortcutGroup[],
  localShortcuts: ShortcutItem[],
  localPrefs: WorkspacePreferencesPayload
): Promise<boolean> {
  const uid = sanitizeId(userId, 'user');
  const groupsPath = `workspaces/${uid}/groups`;
  const settingsPath = `workspaces/${uid}/settings/config`;
  let migrated = false;

  let existingGroupsSnap;
  try {
    existingGroupsSnap = await getDocs(
      query(collection(db, 'workspaces', uid, 'groups'), where('ownerId', '==', uid), limit(1))
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, groupsPath);
  }

  if (existingGroupsSnap.empty && localGroups.length > 0) {
    migrated = true;
    const groupBatch = writeBatch(db);
    const validGroupIds = new Set<string>();

    localGroups.forEach((group, idx) => {
      const { id, payload } = buildGroupCreateDoc(uid, group, idx);
      validGroupIds.add(id);
      groupBatch.set(doc(db, 'workspaces', uid, 'groups', id), payload);
    });

    try {
      await groupBatch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, groupsPath);
    }

    if (localShortcuts.length > 0) {
      const fallbackGroupId = Array.from(validGroupIds)[0];
      const chunkSize = 400;
      for (let i = 0; i < localShortcuts.length; i += chunkSize) {
        const chunk = localShortcuts.slice(i, i + chunkSize);
        const shortcutBatch = writeBatch(db);
        chunk.forEach((sc) => {
          const { id, payload } = buildShortcutCreateDoc(uid, sc, validGroupIds, fallbackGroupId);
          shortcutBatch.set(doc(db, 'workspaces', uid, 'shortcuts', id), payload);
        });
        try {
          await shortcutBatch.commit();
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, `workspaces/${uid}/shortcuts`);
        }
      }
    }
  }

  try {
    const settingsRef = doc(db, 'workspaces', uid, 'settings', 'config');
    const settingsSnap = await getDoc(settingsRef);
    if (!settingsSnap.exists()) {
      await setDoc(settingsRef, buildSettingsCreateDoc(uid, localPrefs));
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, settingsPath);
  }

  return migrated;
}

// ============================================================================
// Real-Time Subscriptions (onSnapshot)
// ============================================================================
export function subscribeToGroups(
  userId: string,
  onData: (groups: ShortcutGroup[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const uid = sanitizeId(userId, 'user');
  const path = `workspaces/${uid}/groups`;
  const q = query(collection(db, 'workspaces', uid, 'groups'), where('ownerId', '==', uid));

  return onSnapshot(
    q,
    (snapshot) => {
      const parsed: ShortcutGroup[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: String(data.id || d.id),
          name: String(data.name || ''),
          description: typeof data.description === 'string' ? data.description : undefined,
          color: VALID_GROUP_COLORS.has(data.color) ? data.color : 'indigo',
          icon: String(data.icon || 'Folder'),
          order: typeof data.order === 'number' ? data.order : 0,
        };
      });
      parsed.sort((a, b) => a.order - b.order);
      onData(parsed);
    },
    (error) => {
      onError?.(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export function subscribeToShortcuts(
  userId: string,
  onData: (shortcuts: ShortcutItem[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const uid = sanitizeId(userId, 'user');
  const path = `workspaces/${uid}/shortcuts`;
  const q = query(collection(db, 'workspaces', uid, 'shortcuts'), where('ownerId', '==', uid));

  return onSnapshot(
    q,
    (snapshot) => {
      const parsed: ShortcutItem[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: String(data.id || d.id),
          title: String(data.title || ''),
          url: String(data.url || ''),
          type: VALID_SHORTCUT_TYPES.has(data.type) ? data.type : 'web',
          groupId: String(data.groupId || ''),
          description: typeof data.description === 'string' ? data.description : undefined,
          iconType: VALID_ICON_TYPES.has(data.iconType) ? data.iconType : 'preset',
          iconValue: typeof data.iconValue === 'string' ? data.iconValue : undefined,
          color: typeof data.color === 'string' ? data.color : undefined,
          isPinned: Boolean(data.isPinned),
          clickCount: typeof data.clickCount === 'number' ? data.clickCount : 0,
          lastOpened: typeof data.lastOpened === 'number' ? data.lastOpened : undefined,
          tags: Array.isArray(data.tags) ? data.tags.map((t) => String(t)) : undefined,
          createdAt: toTimestampMillis(data.createdAt),
        };
      });
      onData(parsed);
    },
    (error) => {
      onError?.(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export function subscribeToSettings(
  userId: string,
  onData: (settings: WorkspacePreferencesPayload) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const uid = sanitizeId(userId, 'user');
  const path = `workspaces/${uid}/settings/config`;
  const ref = doc(db, 'workspaces', uid, 'settings', 'config');

  return onSnapshot(
    ref,
    (snapshot) => {
      if (!snapshot.exists()) return;
      const data = snapshot.data();
      const customLogoSrc = typeof data.customLogoSrc === 'string' ? data.customLogoSrc : '';
      const customLogo: CustomLogoConfig | null = customLogoSrc
        ? {
            src: customLogoSrc,
            fit: data.customLogoFit === 'contain' ? 'contain' : 'cover',
          }
        : null;

      onData({
        cardDensity:
          data.cardDensity === 'small' || data.cardDensity === 'large' ? data.cardDensity : 'medium',
        viewMode:
          data.viewMode === 'list' || data.viewMode === 'sections' || data.viewMode === 'orbit'
            ? data.viewMode
            : 'grid',
        theme: data.theme === 'dark' ? 'dark' : 'light',
        jarvisIntroEnabled: data.jarvisIntroEnabled !== false,
        jarvisAudioEnabled: data.jarvisAudioEnabled !== false,
        customLogo,
      });
    },
    (error) => {
      onError?.(error);
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

// ============================================================================
// CRUD Operations (Shortcuts, Groups, Settings, Full Import/Reset)
// ============================================================================
export async function createShortcutInFirestore(
  userId: string,
  shortcut: ShortcutItem
): Promise<void> {
  const uid = sanitizeId(userId, 'user');
  const scId = sanitizeId(shortcut.id, 'sc');
  const path = `workspaces/${uid}/shortcuts/${scId}`;
  const validGroupId = sanitizeId(shortcut.groupId, 'group');
  const { payload } = buildShortcutCreateDoc(uid, { ...shortcut, id: scId }, new Set([validGroupId]), validGroupId);

  try {
    await setDoc(doc(db, 'workspaces', uid, 'shortcuts', scId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateShortcutInFirestore(
  userId: string,
  shortcut: ShortcutItem
): Promise<void> {
  const uid = sanitizeId(userId, 'user');
  const scId = sanitizeId(shortcut.id, 'sc');
  const path = `workspaces/${uid}/shortcuts/${scId}`;

  const trimmedIconValue = shortcut.iconValue?.trim();
  if (trimmedIconValue && trimmedIconValue.length > 250000) {
    throw new Error('Ukuran foto ikon pintasan terlalu besar (maksimal 250KB).');
  }

  const updatePayload: Record<string, unknown> = {
    title: clampString(shortcut.title, 120, 'Pintasan Tanpa Nama'),
    url: clampString(shortcut.url, 1000, 'https://example.com'),
    type: VALID_SHORTCUT_TYPES.has(shortcut.type) ? shortcut.type : 'web',
    groupId: sanitizeId(shortcut.groupId, 'group'),
    iconType: VALID_ICON_TYPES.has(shortcut.iconType) ? shortcut.iconType : 'preset',
    isPinned: Boolean(shortcut.isPinned),
    description: shortcut.description?.trim() ? clampString(shortcut.description, 500) : deleteField(),
    iconValue: trimmedIconValue ? clampString(trimmedIconValue, 250000) : deleteField(),
    color: shortcut.color?.trim() ? clampString(shortcut.color, 30) : deleteField(),
    tags: sanitizeTags(shortcut.tags) ?? deleteField(),
    updatedAt: serverTimestamp(),
  };

  try {
    await updateDoc(doc(db, 'workspaces', uid, 'shortcuts', scId), updatePayload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function recordShortcutLaunchInFirestore(
  userId: string,
  shortcutId: string,
  nextClickCount: number,
  lastOpened: number
): Promise<void> {
  const uid = sanitizeId(userId, 'user');
  const scId = sanitizeId(shortcutId, 'sc');
  const path = `workspaces/${uid}/shortcuts/${scId}`;
  try {
    await updateDoc(doc(db, 'workspaces', uid, 'shortcuts', scId), {
      clickCount: Math.min(Math.max(0, Math.floor(nextClickCount)), 100000000),
      lastOpened: Math.floor(lastOpened),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function toggleShortcutPinInFirestore(
  userId: string,
  shortcutId: string,
  isPinned: boolean
): Promise<void> {
  const uid = sanitizeId(userId, 'user');
  const scId = sanitizeId(shortcutId, 'sc');
  const path = `workspaces/${uid}/shortcuts/${scId}`;
  try {
    await updateDoc(doc(db, 'workspaces', uid, 'shortcuts', scId), {
      isPinned: Boolean(isPinned),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteShortcutFromFirestore(
  userId: string,
  shortcutId: string
): Promise<void> {
  const uid = sanitizeId(userId, 'user');
  const scId = sanitizeId(shortcutId, 'sc');
  const path = `workspaces/${uid}/shortcuts/${scId}`;
  try {
    await deleteDoc(doc(db, 'workspaces', uid, 'shortcuts', scId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function syncGroupsToFirestore(
  userId: string,
  prevGroups: ShortcutGroup[],
  nextGroups: ShortcutGroup[]
): Promise<void> {
  const uid = sanitizeId(userId, 'user');
  const prevMap = new Map(prevGroups.map((g) => [g.id, g]));
  const nextMap = new Map(nextGroups.map((g) => [g.id, g]));

  // Delete removed groups
  for (const oldGroup of prevGroups) {
    if (!nextMap.has(oldGroup.id)) {
      const gId = sanitizeId(oldGroup.id, 'group');
      const path = `workspaces/${uid}/groups/${gId}`;
      try {
        await deleteDoc(doc(db, 'workspaces', uid, 'groups', gId));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
      }
    }
  }

  // Create or update groups
  for (let i = 0; i < nextGroups.length; i++) {
    const group = nextGroups[i];
    const gId = sanitizeId(group.id, `group-${i}`);
    const path = `workspaces/${uid}/groups/${gId}`;

    if (!prevMap.has(group.id)) {
      const { payload } = buildGroupCreateDoc(uid, { ...group, id: gId }, i);
      try {
        await setDoc(doc(db, 'workspaces', uid, 'groups', gId), payload);
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, path);
      }
    } else {
      if (group.icon && group.icon.length > 250000) {
        throw new Error('Ukuran foto ikon grup terlalu besar (maksimal 250KB).');
      }
      const updatePayload: Record<string, unknown> = {
        name: clampString(group.name, 80, 'Grup Baru'),
        description: group.description?.trim() ? clampString(group.description, 240) : deleteField(),
        color: VALID_GROUP_COLORS.has(group.color) ? group.color : 'indigo',
        icon: clampString(group.icon, 250000, 'Folder'),
        order:
          typeof group.order === 'number' && Number.isFinite(group.order)
            ? Math.min(Math.max(0, group.order), 10000)
            : i + 1,
        updatedAt: serverTimestamp(),
      };
      try {
        await updateDoc(doc(db, 'workspaces', uid, 'groups', gId), updatePayload);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, path);
      }
    }
  }
}

export async function reassignShortcutsGroupInFirestore(
  userId: string,
  shortcutIds: string[],
  toGroupId: string
): Promise<void> {
  const uid = sanitizeId(userId, 'user');
  const targetGroupId = sanitizeId(toGroupId, 'group');

  for (const rawId of shortcutIds) {
    const scId = sanitizeId(rawId, 'sc');
    const path = `workspaces/${uid}/shortcuts/${scId}`;
    try {
      await updateDoc(doc(db, 'workspaces', uid, 'shortcuts', scId), {
        groupId: targetGroupId,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }
}

export async function savePreferencesToFirestore(
  userId: string,
  prefs: WorkspacePreferencesPayload
): Promise<void> {
  const uid = sanitizeId(userId, 'user');
  const path = `workspaces/${uid}/settings/config`;
  const ref = doc(db, 'workspaces', uid, 'settings', 'config');

  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, buildSettingsCreateDoc(uid, prefs));
    } else {
      await updateDoc(ref, {
        cardDensity: prefs.cardDensity,
        viewMode: prefs.viewMode,
        theme: prefs.theme,
        jarvisIntroEnabled: Boolean(prefs.jarvisIntroEnabled),
        jarvisAudioEnabled: Boolean(prefs.jarvisAudioEnabled),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function saveCustomLogoToFirestore(
  userId: string,
  customLogo: CustomLogoConfig | null,
  fallbackPrefs: WorkspacePreferencesPayload
): Promise<void> {
  if (customLogo?.src && customLogo.src.length > 250000) {
    throw new Error('Ukuran data logo terlalu besar untuk Firestore (maksimal 250KB).');
  }
  const uid = sanitizeId(userId, 'user');
  const path = `workspaces/${uid}/settings/config`;
  const ref = doc(db, 'workspaces', uid, 'settings', 'config');

  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, buildSettingsCreateDoc(uid, { ...fallbackPrefs, customLogo }));
    } else if (customLogo && customLogo.src.trim().length > 0) {
      await updateDoc(ref, {
        customLogoSrc: customLogo.src,
        customLogoFit: customLogo.fit === 'contain' ? 'contain' : 'cover',
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, {
        customLogoSrc: deleteField(),
        customLogoFit: deleteField(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function replaceWorkspaceDataInFirestore(
  userId: string,
  newGroups: ShortcutGroup[],
  newShortcuts: ShortcutItem[]
): Promise<void> {
  const uid = sanitizeId(userId, 'user');
  const shortcutsCol = collection(db, 'workspaces', uid, 'shortcuts');
  const groupsCol = collection(db, 'workspaces', uid, 'groups');

  // 1. Delete existing shortcuts first
  try {
    const existingScSnap = await getDocs(query(shortcutsCol, where('ownerId', '==', uid)));
    for (let i = 0; i < existingScSnap.docs.length; i += 400) {
      const batch = writeBatch(db);
      existingScSnap.docs.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `workspaces/${uid}/shortcuts`);
  }

  // 2. Delete existing groups
  try {
    const existingGrpSnap = await getDocs(query(groupsCol, where('ownerId', '==', uid)));
    for (let i = 0; i < existingGrpSnap.docs.length; i += 400) {
      const batch = writeBatch(db);
      existingGrpSnap.docs.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `workspaces/${uid}/groups`);
  }

  // 3. Create new groups
  const validGroupIds = new Set<string>();
  if (newGroups.length > 0) {
    try {
      for (let i = 0; i < newGroups.length; i += 400) {
        const batch = writeBatch(db);
        newGroups.slice(i, i + 400).forEach((group, idx) => {
          const { id, payload } = buildGroupCreateDoc(uid, group, i + idx);
          validGroupIds.add(id);
          batch.set(doc(db, 'workspaces', uid, 'groups', id), payload);
        });
        await batch.commit();
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `workspaces/${uid}/groups`);
    }
  }

  // 4. Create new shortcuts
  if (newShortcuts.length > 0 && validGroupIds.size > 0) {
    const fallbackGroupId = Array.from(validGroupIds)[0];
    try {
      for (let i = 0; i < newShortcuts.length; i += 400) {
        const batch = writeBatch(db);
        newShortcuts.slice(i, i + 400).forEach((sc) => {
          const { id, payload } = buildShortcutCreateDoc(uid, sc, validGroupIds, fallbackGroupId);
          batch.set(doc(db, 'workspaces', uid, 'shortcuts', id), payload);
        });
        await batch.commit();
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `workspaces/${uid}/shortcuts`);
    }
  }
}
