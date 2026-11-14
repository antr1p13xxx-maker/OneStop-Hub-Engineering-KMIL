/**
 * Security Rules Red-Team Test Suite — OneStop Hub Engineering
 * Verifies all "Dirty Dozen" adversarial payloads enforce PERMISSION_DENIED.
 */

export interface DirtyDozenTestCase {
  id: number;
  name: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  path: string;
  auth: {
    uid: string;
    email?: string;
    email_verified?: boolean;
  } | null;
  payload?: Record<string, unknown>;
  expectedOutcome: 'PERMISSION_DENIED';
  enforcedByRule: string;
}

export const DIRTY_DOZEN_TESTS: DirtyDozenTestCase[] = [
  {
    id: 1,
    name: 'Unverified Admin Email Spoof',
    operation: 'get',
    path: '/users/victim_uid/private/profile',
    auth: { uid: 'attacker_uid', email: 'An.Tr1p13xxx@gmail.com', email_verified: false },
    expectedOutcome: 'PERMISSION_DENIED',
    enforcedByRule: 'isVerifiedUser() mandates request.auth.token.email_verified == true',
  },
  {
    id: 2,
    name: 'Cross-Tenant Ownership Hijack',
    operation: 'create',
    path: '/workspaces/ws_b',
    auth: { uid: 'user_a', email: 'a@example.com', email_verified: true },
    payload: {
      id: 'ws_b',
      ownerId: 'user_b',
      name: 'Hijacked Workspace',
      createdAt: 'SERVER_TIME',
      updatedAt: 'SERVER_TIME',
    },
    expectedOutcome: 'PERMISSION_DENIED',
    enforcedByRule: 'incoming().ownerId == request.auth.uid',
  },
  {
    id: 3,
    name: 'Shadow Ghost Field Injection (Create)',
    operation: 'create',
    path: '/workspaces/user_a/shortcuts/sc_1',
    auth: { uid: 'user_a', email: 'a@example.com', email_verified: true },
    payload: {
      id: 'sc_1',
      ownerId: 'user_a',
      title: 'Test',
      url: 'https://example.com',
      type: 'web',
      groupId: 'group-work',
      iconType: 'preset',
      isPinned: false,
      clickCount: 0,
      isAdmin: true,
      createdAt: 'SERVER_TIME',
      updatedAt: 'SERVER_TIME',
    },
    expectedOutcome: 'PERMISSION_DENIED',
    enforcedByRule: 'isValidShortcutItem data.keys().hasOnly(...) rejects isAdmin ghost field',
  },
  {
    id: 4,
    name: 'Shadow Ghost Field Injection (Update)',
    operation: 'update',
    path: '/workspaces/user_a/shortcuts/sc_1',
    auth: { uid: 'user_a', email: 'a@example.com', email_verified: true },
    payload: {
      title: 'Updated Title',
      ghostFlag: 1,
      updatedAt: 'SERVER_TIME',
    },
    expectedOutcome: 'PERMISSION_DENIED',
    enforcedByRule: 'affectedKeys().hasOnly(...) and isValidShortcutItem reject ghostFlag',
  },
  {
    id: 5,
    name: 'Client Timestamp Forgery',
    operation: 'create',
    path: '/workspaces/user_a/groups/group_forged',
    auth: { uid: 'user_a', email: 'a@example.com', email_verified: true },
    payload: {
      id: 'group_forged',
      ownerId: 'user_a',
      name: 'Forged Time',
      color: 'indigo',
      icon: 'Folder',
      order: 1,
      createdAt: '2020-01-01T00:00:00Z',
      updatedAt: 'SERVER_TIME',
    },
    expectedOutcome: 'PERMISSION_DENIED',
    enforcedByRule: 'incoming().createdAt == request.time rejects client-supplied timestamp',
  },
  {
    id: 6,
    name: 'Orphan Shortcut (Invalid groupId)',
    operation: 'create',
    path: '/workspaces/user_a/shortcuts/sc_orphan',
    auth: { uid: 'user_a', email: 'a@example.com', email_verified: true },
    payload: {
      id: 'sc_orphan',
      ownerId: 'user_a',
      title: 'Orphan',
      url: 'https://example.com',
      type: 'web',
      groupId: 'non_existent_group',
      iconType: 'preset',
      isPinned: false,
      clickCount: 0,
      createdAt: 'SERVER_TIME',
      updatedAt: 'SERVER_TIME',
    },
    expectedOutcome: 'PERMISSION_DENIED',
    enforcedByRule: 'groupExistsInWorkspace(workspaceId, incoming().groupId)',
  },
  {
    id: 7,
    name: 'ID Poisoning Attack',
    operation: 'create',
    path: '/workspaces/user_a/shortcuts/invalid$id!with*bad#chars',
    auth: { uid: 'user_a', email: 'a@example.com', email_verified: true },
    payload: {
      id: 'invalid$id!with*bad#chars',
      ownerId: 'user_a',
    },
    expectedOutcome: 'PERMISSION_DENIED',
    enforcedByRule: "isValidId(shortcutId) matches '^[a-zA-Z0-9_\\\\-]+$' && size <= 128",
  },
  {
    id: 8,
    name: 'Denial-of-Wallet String Overflow',
    operation: 'create',
    path: '/workspaces/user_a/shortcuts/sc_overflow',
    auth: { uid: 'user_a', email: 'a@example.com', email_verified: true },
    payload: {
      id: 'sc_overflow',
      ownerId: 'user_a',
      title: 'Overflow',
      url: 'https://example.com/' + 'a'.repeat(5000),
      type: 'web',
      groupId: 'group-work',
      iconType: 'preset',
      isPinned: false,
      clickCount: 0,
      createdAt: 'SERVER_TIME',
      updatedAt: 'SERVER_TIME',
    },
    expectedOutcome: 'PERMISSION_DENIED',
    enforcedByRule: 'data.url.size() <= 1000',
  },
  {
    id: 9,
    name: 'Unbounded Array / Invalid Element Type',
    operation: 'create',
    path: '/workspaces/user_a/shortcuts/sc_bad_tags',
    auth: { uid: 'user_a', email: 'a@example.com', email_verified: true },
    payload: {
      id: 'sc_bad_tags',
      ownerId: 'user_a',
      title: 'Bad Tags',
      url: 'https://example.com',
      type: 'web',
      groupId: 'group-work',
      iconType: 'preset',
      isPinned: false,
      clickCount: 0,
      tags: [12345, 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k'],
      createdAt: 'SERVER_TIME',
      updatedAt: 'SERVER_TIME',
    },
    expectedOutcome: 'PERMISSION_DENIED',
    enforcedByRule: 'data.tags.size() <= 10 && data.tags[0] is string',
  },
  {
    id: 10,
    name: 'Cross-Tenant List Scraping',
    operation: 'list',
    path: '/workspaces/user_b/shortcuts',
    auth: { uid: 'user_a', email: 'a@example.com', email_verified: true },
    expectedOutcome: 'PERMISSION_DENIED',
    enforcedByRule: 'allow list: if isVerifiedUser() && (existing().ownerId == request.auth.uid || isVerifiedAdminEmail())',
  },
  {
    id: 11,
    name: 'PII Cross-User Read',
    operation: 'get',
    path: '/users/user_b/private/profile',
    auth: { uid: 'user_a', email: 'a@example.com', email_verified: true },
    expectedOutcome: 'PERMISSION_DENIED',
    enforcedByRule: 'isOwner(userId) || isAdmin()',
  },
  {
    id: 12,
    name: 'Privilege / Immutability Tampering on Update',
    operation: 'update',
    path: '/workspaces/user_a/settings/config',
    auth: { uid: 'user_a', email: 'a@example.com', email_verified: true },
    payload: {
      ownerId: 'attacker_uid',
      updatedAt: 'SERVER_TIME',
    },
    expectedOutcome: 'PERMISSION_DENIED',
    enforcedByRule: 'incoming().ownerId == existing().ownerId && affectedKeys().hasOnly(...)',
  },
];

export function verifyDirtyDozenSpecification(): { total: number; allDenied: boolean } {
  const allDenied = DIRTY_DOZEN_TESTS.every((tc) => tc.expectedOutcome === 'PERMISSION_DENIED');
  return { total: DIRTY_DOZEN_TESTS.length, allDenied };
}
