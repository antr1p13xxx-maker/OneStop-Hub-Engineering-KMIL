# Security Specification — OneStop Hub Engineering (Firestore)

## 1. Data Invariants
1. **Identity & Ownership Binding**: Every user profile (`/users/{userId}/private/profile`), workspace (`/workspaces/{workspaceId}`), group (`/workspaces/{workspaceId}/groups/{groupId}`), shortcut (`/workspaces/{workspaceId}/shortcuts/{shortcutId}`), and settings document (`/workspaces/{workspaceId}/settings/config`) is strictly owned by a verified Google-authenticated user (`request.auth.uid`) whose `email_verified == true`.
2. **Master Gate Relational Integrity**: Subcollections under `/workspaces/{workspaceId}` (`groups`, `shortcuts`, `settings`) MUST verify the parent `/workspaces/{workspaceId}` document exists and its `ownerId == request.auth.uid` (using `get()` / `existsAfter()` for atomic batch creation).
3. **Referential Integrity for Shortcuts**: Creating or reassigning a `ShortcutItem` MUST verify that `groupId` exists inside `/workspaces/{workspaceId}/groups/{groupId}` (via `exists()` or `existsAfter()`).
4. **Immutable Ownership & Timestamps**: `ownerId`, `uid`, `id`, and `createdAt` cannot be modified after creation. All `createdAt` and `updatedAt` timestamps MUST equal `request.time`.
5. **Strict Key & Size Guards**: Every document write validates `hasAll()` and `hasOnly()` on creation, `affectedKeys().hasOnly()` on update, regex `^[a-zA-Z0-9_-]+$` on IDs, and bounded `.size()` checks on every string and array (`tags.size() <= 10`, `customLogoSrc.size() <= 250000`).
6. **PII Isolation**: User email and profile metadata are isolated inside `/users/{userId}/private/profile` and readable/writable only by `userId == request.auth.uid` or verified bootstrapped admin (`An.Tr1p13xxx@gmail.com` with `email_verified == true`).

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Unverified Admin Email Spoof**: `{ auth: { uid: 'attacker', token: { email: 'An.Tr1p13xxx@gmail.com', email_verified: false } } }` reading `/users/victim/private/profile`. -> **DENIED**
2. **Cross-Tenant Ownership Hijack**: User A creates `/workspaces/ws_b` with `ownerId: 'user_b'`. -> **DENIED**
3. **Shadow Ghost Field Injection (Create)**: Create `ShortcutItem` with valid fields plus `{ isAdmin: true }`. -> **DENIED**
4. **Shadow Ghost Field Injection (Update)**: Update `ShortcutItem` `title` while sneaking `{ ownerId: 'attacker' }` or `{ ghostFlag: 1 }`. -> **DENIED**
5. **Client Timestamp Forgery**: Create `ShortcutGroup` with `createdAt: Timestamp(2020-01-01)` instead of server `request.time`. -> **DENIED**
6. **Orphan Shortcut (Invalid `groupId`)**: Create `ShortcutItem` referencing `groupId: 'non_existent_group'`. -> **DENIED**
7. **ID Poisoning Attack**: Target path `/workspaces/ws_1/shortcuts/invalid$id!with*bad#chars` or 1.5KB ID string. -> **DENIED**
8. **Denial-of-Wallet String Overflow**: Create `ShortcutItem` with 5,000-char `url` or 1MB `customLogoSrc`. -> **DENIED**
9. **Unbounded Array / Invalid Element Type**: Create `ShortcutItem` with `tags: ['ok', ...15 items]` or `tags: [12345]`. -> **DENIED**
10. **Cross-Tenant List Scraping**: User A runs `list` query on `/workspaces/ws_b/shortcuts` without matching `resource.data.ownerId == request.auth.uid`. -> **DENIED**
11. **PII Cross-User Read**: User A runs `get` on `/users/user_b/private/profile`. -> **DENIED**
12. **Privilege / Immutability Tampering on Update**: Update `WorkspaceSettings` attempting to change `ownerId` or update `ShortcutItem` attempting to alter `createdAt` or `id`. -> **DENIED**
