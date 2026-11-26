import { User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocFromServer,
  getDocs,
  getDocsFromServer,
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
  SortOption,
  UiStyle,
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

function buildFirestoreErrorInfo(
  error: unknown,
  operationType: OperationType,
  path: string | null
): FirestoreErrorInfo {
  return {
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
}

export function logFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): FirestoreErrorInfo {
  const errInfo = buildFirestoreErrorInfo(error, operationType, path);
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo = logFirestoreError(error, operationType, path);
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

export interface SnapshotSyncMeta {
  fromCache: boolean;
  hasPendingWrites: boolean;
}

export function isNotFoundError(error: unknown): boolean {
  const code = (error as { code?: string })?.code?.toLowerCase() || '';
  const msg = error instanceof Error ? error.message.toLowerCase() : String(error || '').toLowerCase();
  return (
    code === 'not-found' ||
    msg.includes('no document to update') ||
    msg.includes('not-found')
  );
}

export function formatFirestoreErrorForUser(error: unknown): {
  message: string;
  isQuota: boolean;
  code?: string;
} {
  if (isQuotaExceededError(error)) {
    return {
      message:
        'Kuota harian gratis Firestore telah terlampaui (Quota exceeded). Data lokal tetap tersimpan dan akan disinkronkan kembali setelah kuota direset.',
      isQuota: true,
    };
  }

  const rawCode = (error as { code?: string })?.code?.toLowerCase() || '';
  let rawMessage = error instanceof Error ? error.message : String(error || '');
  try {
    const parsed = JSON.parse(rawMessage) as Partial<FirestoreErrorInfo>;
    if (parsed && typeof parsed.error === 'string') {
      rawMessage = parsed.error;
    }
  } catch {
    // Plain error message
  }

  const lower = rawMessage.toLowerCase();
  const hostHint =
    typeof window !== 'undefined' && window.location?.hostname
      ? window.location.hostname
      : 'domain aplikasi ini';

  if (rawCode === 'auth/unauthorized-domain' || lower.includes('unauthorized-domain')) {
    return {
      message: `Domain "${hostHint}" belum diotorisasi di Firebase Authentication. Tambahkan "${hostHint}" di Firebase Console → Authentication → Settings → Authorized domains.`,
      isQuota: false,
      code: 'auth/unauthorized-domain',
    };
  }
  if (rawCode === 'auth/operation-not-allowed' || lower.includes('operation-not-allowed')) {
    return {
      message:
        'Metode login Google belum diaktifkan di Firebase Console → Authentication → Sign-in method.',
      isQuota: false,
      code: 'auth/operation-not-allowed',
    };
  }
  if (rawCode === 'auth/popup-blocked' || lower.includes('popup-blocked')) {
    return {
      message:
        'Jendela login Google diblokir oleh browser. Izinkan pop-up untuk situs ini atau buka aplikasi di tab baru lalu coba lagi.',
      isQuota: false,
      code: 'auth/popup-blocked',
    };
  }
  if (rawCode === 'auth/network-request-failed' || lower.includes('network-request-failed')) {
    return {
      message:
        'Permintaan autentikasi Google gagal karena gangguan jaringan. Periksa koneksi internet Anda lalu coba lagi.',
      isQuota: false,
      code: 'auth/network-request-failed',
    };
  }
  if (
    rawCode === 'permission-denied' ||
    lower.includes('permission-denied') ||
    lower.includes('missing or insufficient permissions')
  ) {
    return {
      message:
        'Izin akses Firestore ditolak. Pastikan Anda masuk dengan akun Google yang memiliki email terverifikasi.',
      isQuota: false,
      code: 'permission-denied',
    };
  }
  if (
    rawCode === 'unavailable' ||
    lower.includes('unavailable') ||
    lower.includes('the client is offline') ||
    lower.includes('network') ||
    lower.includes('offline')
  ) {
    return {
      message:
        'Koneksi ke server Firebase Firestore sedang terganggu. Perubahan tersimpan di cache lokal dan akan tersinkron otomatis saat online.',
      isQuota: false,
      code: 'unavailable',
    };
  }
  if (rawCode === 'failed-precondition' || lower.includes('failed-precondition') || lower.includes('index')) {
    return {
      message:
        'Database Firestore belum siap atau membutuhkan indeks. Silakan coba muat ulang halaman.',
      isQuota: false,
      code: 'failed-precondition',
    };
  }

  return {
    message: rawMessage || 'Gagal menyinkronkan data dengan Firebase Firestore.',
    isQuota: false,
    code: rawCode || undefined,
  };
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
  uiStyle: UiStyle;
  sortBy: SortOption;
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
    uiStyle: prefs.uiStyle === 'classic' ? 'classic' : 'claymorphism',
    sortBy: prefs.sortBy === 'recent' || prefs.sortBy === 'name' ? prefs.sortBy : 'clicks',
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

function parseGroupDoc(id: string, data: Record<string, unknown>): ShortcutGroup {
  return {
    id: String(data.id || id),
    name: String(data.name || ''),
    description: typeof data.description === 'string' ? data.description : undefined,
    color: VALID_GROUP_COLORS.has(data.color as ShortcutGroup['color'])
      ? (data.color as ShortcutGroup['color'])
      : 'indigo',
    icon: String(data.icon || 'Folder'),
    order: typeof data.order === 'number' ? data.order : 0,
  };
}

function parseShortcutDoc(id: string, data: Record<string, unknown>): ShortcutItem {
  return {
    id: String(data.id || id),
    title: String(data.title || ''),
    url: String(data.url || ''),
    type: VALID_SHORTCUT_TYPES.has(data.type as ShortcutItem['type'])
      ? (data.type as ShortcutItem['type'])
      : 'web',
    groupId: String(data.groupId || ''),
    description: typeof data.description === 'string' ? data.description : undefined,
    iconType: VALID_ICON_TYPES.has(data.iconType as ShortcutItem['iconType'])
      ? (data.iconType as ShortcutItem['iconType'])
      : 'preset',
    iconValue: typeof data.iconValue === 'string' ? data.iconValue : undefined,
    color: typeof data.color === 'string' ? data.color : undefined,
    isPinned: Boolean(data.isPinned),
    clickCount: typeof data.clickCount === 'number' ? data.clickCount : 0,
    lastOpened: typeof data.lastOpened === 'number' ? data.lastOpened : undefined,
    tags: Array.isArray(data.tags) ? data.tags.map((t) => String(t)) : undefined,
    createdAt: toTimestampMillis(data.createdAt),
  };
}

function parseSettingsDoc(data: Record<string, unknown>): WorkspacePreferencesPayload {
  const customLogoSrc = typeof data.customLogoSrc === 'string' ? data.customLogoSrc : '';
  const customLogo: CustomLogoConfig | null = customLogoSrc
    ? {
        src: customLogoSrc,
        fit: data.customLogoFit === 'contain' ? 'contain' : 'cover',
      }
    : null;

  return {
    cardDensity:
      data.cardDensity === 'small' || data.cardDensity === 'large' ? data.cardDensity : 'medium',
    viewMode:
      data.viewMode === 'list' || data.viewMode === 'sections' || data.viewMode === 'orbit'
        ? data.viewMode
        : 'grid',
    theme: data.theme === 'dark' ? 'dark' : 'light',
    uiStyle: data.uiStyle === 'classic' ? 'classic' : 'claymorphism',
    sortBy: data.sortBy === 'recent' || data.sortBy === 'name' ? data.sortBy : 'clicks',
    jarvisIntroEnabled: data.jarvisIntroEnabled !== false,
    jarvisAudioEnabled: data.jarvisAudioEnabled !== false,
    customLogo,
  };
}

// ============================================================================
// Real-Time Subscriptions (onSnapshot with Live Metadata Tracking)
// ============================================================================
export function subscribeToGroups(
  userId: string,
  onData: (groups: ShortcutGroup[], meta: SnapshotSyncMeta) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const uid = sanitizeId(userId, 'user');
  const path = `workspaces/${uid}/groups`;
  const q = query(collection(db, 'workspaces', uid, 'groups'), where('ownerId', '==', uid));

  return onSnapshot(
    q,
    { includeMetadataChanges: true },
    (snapshot) => {
      const parsed: ShortcutGroup[] = snapshot.docs.map((d) =>
        parseGroupDoc(d.id, d.data() as Record<string, unknown>)
      );
      parsed.sort((a, b) => a.order - b.order);
      onData(parsed, {
        fromCache: snapshot.metadata.fromCache,
        hasPendingWrites: snapshot.metadata.hasPendingWrites,
      });
    },
    (error) => {
      const info = logFirestoreError(error, OperationType.LIST, path);
      onError?.(new Error(JSON.stringify(info)));
    }
  );
}

export function subscribeToShortcuts(
  userId: string,
  onData: (shortcuts: ShortcutItem[], meta: SnapshotSyncMeta) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const uid = sanitizeId(userId, 'user');
  const path = `workspaces/${uid}/shortcuts`;
  const q = query(collection(db, 'workspaces', uid, 'shortcuts'), where('ownerId', '==', uid));

  return onSnapshot(
    q,
    { includeMetadataChanges: true },
    (snapshot) => {
      const parsed: ShortcutItem[] = snapshot.docs.map((d) =>
        parseShortcutDoc(d.id, d.data() as Record<string, unknown>)
      );
      onData(parsed, {
        fromCache: snapshot.metadata.fromCache,
        hasPendingWrites: snapshot.metadata.hasPendingWrites,
      });
    },
    (error) => {
      const info = logFirestoreError(error, OperationType.LIST, path);
      onError?.(new Error(JSON.stringify(info)));
    }
  );
}

export function subscribeToSettings(
  userId: string,
  onData: (settings: WorkspacePreferencesPayload, meta: SnapshotSyncMeta) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const uid = sanitizeId(userId, 'user');
  const path = `workspaces/${uid}/settings/config`;
  const ref = doc(db, 'workspaces', uid, 'settings', 'config');

  return onSnapshot(
    ref,
    { includeMetadataChanges: true },
    (snapshot) => {
      if (!snapshot.exists()) return;
      onData(parseSettingsDoc(snapshot.data() as Record<string, unknown>), {
        fromCache: snapshot.metadata.fromCache,
        hasPendingWrites: snapshot.metadata.hasPendingWrites,
      });
    },
    (error) => {
      const info = logFirestoreError(error, OperationType.GET, path);
      onError?.(new Error(JSON.stringify(info)));
    }
  );
}

export async function refreshWorkspaceFromServer(userId: string): Promise<{
  groups: ShortcutGroup[];
  shortcuts: ShortcutItem[];
  settings: WorkspacePreferencesPayload | null;
}> {
  const uid = sanitizeId(userId, 'user');
  const groupsQuery = query(collection(db, 'workspaces', uid, 'groups'), where('ownerId', '==', uid));
  const shortcutsQuery = query(collection(db, 'workspaces', uid, 'shortcuts'), where('ownerId', '==', uid));
  const settingsRef = doc(db, 'workspaces', uid, 'settings', 'config');

  try {
    const [groupsSnap, shortcutsSnap, settingsSnap] = await Promise.all([
      getDocsFromServer(groupsQuery),
      getDocsFromServer(shortcutsQuery),
      getDocFromServer(settingsRef),
    ]);

    const groups = groupsSnap.docs
      .map((d) => parseGroupDoc(d.id, d.data() as Record<string, unknown>))
      .sort((a, b) => a.order - b.order);

    const shortcuts = shortcutsSnap.docs.map((d) =>
      parseShortcutDoc(d.id, d.data() as Record<string, unknown>)
    );

    const settings = settingsSnap.exists()
      ? parseSettingsDoc(settingsSnap.data() as Record<string, unknown>)
      : null;

    return { groups, shortcuts, settings };
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, `workspaces/${uid}`);
  }
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
    if (isNotFoundError(error)) {
      await createShortcutInFirestore(uid, { ...shortcut, id: scId });
      return;
    }
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
    if (isNotFoundError(error)) {
      return;
    }
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
    if (isNotFoundError(error)) {
      return;
    }
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

function buildGroupUpdateDoc(group: ShortcutGroup, index: number): Record<string, unknown> {
  if (group.icon && group.icon.length > 250000) {
    throw new Error('Ukuran foto ikon grup terlalu besar (maksimal 250KB).');
  }
  return {
    name: clampString(group.name, 80, 'Grup Baru'),
    description: group.description?.trim() ? clampString(group.description, 240) : deleteField(),
    color: VALID_GROUP_COLORS.has(group.color) ? group.color : 'indigo',
    icon: clampString(group.icon, 250000, 'Folder'),
    order:
      typeof group.order === 'number' && Number.isFinite(group.order)
        ? Math.min(Math.max(0, group.order), 10000)
        : index + 1,
    updatedAt: serverTimestamp(),
  };
}

export async function syncGroupsToFirestore(
  userId: string,
  _prevGroups: ShortcutGroup[],
  nextGroups: ShortcutGroup[]
): Promise<void> {
  const uid = sanitizeId(userId, 'user');
  const groupsCol = collection(db, 'workspaces', uid, 'groups');
  const groupsPath = `workspaces/${uid}/groups`;

  // Validate all payloads in memory before touching Firestore
  const prepared = nextGroups.map((group, index) => {
    const gId = sanitizeId(group.id, `group-${index}`);
    const createDoc = buildGroupCreateDoc(uid, { ...group, id: gId }, index);
    const updatePayload = buildGroupUpdateDoc(group, index);
    return { gId, createPayload: createDoc.payload, updatePayload };
  });

  const existingSnap = await getDocs(query(groupsCol, where('ownerId', '==', uid)));
  const existingIds = new Set(existingSnap.docs.map((d) => d.id));
  const nextIds = new Set(prepared.map((p) => p.gId));

  const batch = writeBatch(db);
  const ops: { type: 'set' | 'update' | 'delete'; ref: ReturnType<typeof doc>; payload?: Record<string, unknown> }[] = [];

  for (const item of prepared) {
    const ref = doc(db, 'workspaces', uid, 'groups', item.gId);
    if (existingIds.has(item.gId)) {
      ops.push({ type: 'update', ref, payload: item.updatePayload });
    } else {
      ops.push({ type: 'set', ref, payload: item.createPayload });
    }
  }

  for (const oldDoc of existingSnap.docs) {
    if (!nextIds.has(oldDoc.id)) {
      ops.push({ type: 'delete', ref: oldDoc.ref });
    }
  }

  if (ops.length === 0) return;

  try {
    if (ops.length <= 400) {
      ops.forEach((op) => {
        if (op.type === 'set' && op.payload) batch.set(op.ref, op.payload);
        else if (op.type === 'update' && op.payload) batch.update(op.ref, op.payload);
        else if (op.type === 'delete') batch.delete(op.ref);
      });
      await batch.commit();
    } else {
      for (let i = 0; i < ops.length; i += 400) {
        const chunkBatch = writeBatch(db);
        ops.slice(i, i + 400).forEach((op) => {
          if (op.type === 'set' && op.payload) chunkBatch.set(op.ref, op.payload);
          else if (op.type === 'update' && op.payload) chunkBatch.update(op.ref, op.payload);
          else if (op.type === 'delete') chunkBatch.delete(op.ref);
        });
        await chunkBatch.commit();
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, groupsPath);
  }
}

export async function deleteGroupInFirestore(
  userId: string,
  groupId: string,
  mode: 'reassign' | 'purge',
  shortcutIds: string[],
  targetGroupId?: string
): Promise<void> {
  const uid = sanitizeId(userId, 'user');
  const gId = sanitizeId(groupId, 'group');

  if (shortcutIds.length > 0) {
    if (mode === 'reassign' && targetGroupId) {
      const safeTargetGroupId = sanitizeId(targetGroupId, 'group');
      for (let i = 0; i < shortcutIds.length; i += 400) {
        const batch = writeBatch(db);
        shortcutIds.slice(i, i + 400).forEach((rawId) => {
          const scId = sanitizeId(rawId, 'sc');
          batch.update(doc(db, 'workspaces', uid, 'shortcuts', scId), {
            groupId: safeTargetGroupId,
            updatedAt: serverTimestamp(),
          });
        });
        try {
          await batch.commit();
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, `workspaces/${uid}/shortcuts`);
        }
      }
    } else if (mode === 'purge') {
      for (let i = 0; i < shortcutIds.length; i += 400) {
        const batch = writeBatch(db);
        shortcutIds.slice(i, i + 400).forEach((rawId) => {
          const scId = sanitizeId(rawId, 'sc');
          batch.delete(doc(db, 'workspaces', uid, 'shortcuts', scId));
        });
        try {
          await batch.commit();
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, `workspaces/${uid}/shortcuts`);
        }
      }
    }
  }

  const groupPath = `workspaces/${uid}/groups/${gId}`;
  try {
    await deleteDoc(doc(db, 'workspaces', uid, 'groups', gId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, groupPath);
  }
}

export async function reassignShortcutsGroupInFirestore(
  userId: string,
  shortcutIds: string[],
  toGroupId: string
): Promise<void> {
  if (shortcutIds.length === 0) return;
  const uid = sanitizeId(userId, 'user');
  const targetGroupId = sanitizeId(toGroupId, 'group');
  const path = `workspaces/${uid}/shortcuts`;

  try {
    for (let i = 0; i < shortcutIds.length; i += 400) {
      const batch = writeBatch(db);
      shortcutIds.slice(i, i + 400).forEach((rawId) => {
        const scId = sanitizeId(rawId, 'sc');
        batch.update(doc(db, 'workspaces', uid, 'shortcuts', scId), {
          groupId: targetGroupId,
          updatedAt: serverTimestamp(),
        });
      });
      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
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
        uiStyle: prefs.uiStyle === 'classic' ? 'classic' : 'claymorphism',
        sortBy: prefs.sortBy === 'recent' || prefs.sortBy === 'name' ? prefs.sortBy : 'clicks',
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

  // 1. Pre-build & validate ALL payloads in memory BEFORE writing anything
  const preparedGroups = newGroups.map((group, idx) => {
    const { id, payload: createPayload } = buildGroupCreateDoc(uid, group, idx);
    const updatePayload = buildGroupUpdateDoc(group, idx);
    return { id, createPayload, updatePayload };
  });

  const validGroupIds = new Set(preparedGroups.map((g) => g.id));
  const fallbackGroupId = preparedGroups[0]?.id || 'group-general';

  const preparedShortcuts =
    validGroupIds.size > 0
      ? newShortcuts.map((sc) => {
          const { id, payload: createPayload } = buildShortcutCreateDoc(
            uid,
            sc,
            validGroupIds,
            fallbackGroupId
          );
          const trimmedIconValue = sc.iconValue?.trim();
          const updatePayload: Record<string, unknown> = {
            title: createPayload.title,
            url: createPayload.url,
            type: createPayload.type,
            groupId: createPayload.groupId,
            iconType: createPayload.iconType,
            isPinned: createPayload.isPinned,
            description: sc.description?.trim() ? clampString(sc.description, 500) : deleteField(),
            iconValue: trimmedIconValue ? clampString(trimmedIconValue, 250000) : deleteField(),
            color: sc.color?.trim() ? clampString(sc.color, 30) : deleteField(),
            tags: sanitizeTags(sc.tags) ?? deleteField(),
            updatedAt: serverTimestamp(),
          };
          return { id, createPayload, updatePayload };
        })
      : [];

  // 2. Fetch existing documents to compute safe diff without emptying active snapshots
  const [existingGrpSnap, existingScSnap] = await Promise.all([
    getDocs(query(groupsCol, where('ownerId', '==', uid))),
    getDocs(query(shortcutsCol, where('ownerId', '==', uid))),
  ]);

  const existingGroupIds = new Set(existingGrpSnap.docs.map((d) => d.id));
  const existingShortcutIds = new Set(existingScSnap.docs.map((d) => d.id));
  const nextShortcutIds = new Set(preparedShortcuts.map((s) => s.id));

  // 3. Upsert groups FIRST (required so groupExistsInWorkspace rules succeed for shortcuts)
  if (preparedGroups.length > 0) {
    try {
      for (let i = 0; i < preparedGroups.length; i += 400) {
        const batch = writeBatch(db);
        preparedGroups.slice(i, i + 400).forEach((item) => {
          const ref = doc(db, 'workspaces', uid, 'groups', item.id);
          if (existingGroupIds.has(item.id)) {
            batch.update(ref, item.updatePayload);
          } else {
            batch.set(ref, item.createPayload);
          }
        });
        await batch.commit();
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `workspaces/${uid}/groups`);
    }
  }

  // 4. Upsert shortcuts
  if (preparedShortcuts.length > 0) {
    try {
      for (let i = 0; i < preparedShortcuts.length; i += 400) {
        const batch = writeBatch(db);
        preparedShortcuts.slice(i, i + 400).forEach((item) => {
          const ref = doc(db, 'workspaces', uid, 'shortcuts', item.id);
          if (existingShortcutIds.has(item.id)) {
            batch.update(ref, item.updatePayload);
          } else {
            batch.set(ref, item.createPayload);
          }
        });
        await batch.commit();
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `workspaces/${uid}/shortcuts`);
    }
  }

  // 5. Delete stale shortcuts
  const staleShortcutDocs = existingScSnap.docs.filter((d) => !nextShortcutIds.has(d.id));
  if (staleShortcutDocs.length > 0) {
    try {
      for (let i = 0; i < staleShortcutDocs.length; i += 400) {
        const batch = writeBatch(db);
        staleShortcutDocs.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
        await batch.commit();
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `workspaces/${uid}/shortcuts`);
    }
  }

  // 6. Delete stale groups LAST
  const staleGroupDocs = existingGrpSnap.docs.filter((d) => !validGroupIds.has(d.id));
  if (staleGroupDocs.length > 0) {
    try {
      for (let i = 0; i < staleGroupDocs.length; i += 400) {
        const batch = writeBatch(db);
        staleGroupDocs.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
        await batch.commit();
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `workspaces/${uid}/groups`);
    }
  }
}
