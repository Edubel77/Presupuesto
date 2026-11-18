# Security Specification (`Mi Presupuesto Mensual`)

## 1. Data Invariants
1. **Strict Account Isolation**: Every document in `/users/{userId}/budget/{configId}` and `/users/{userId}/movements/{movementId}` belongs exclusively to `userId` (`request.auth.uid == userId` and `data.uid == request.auth.uid`). No authenticated user can read, list, create, update, or delete another user's budget or movements.
2. **Valid Config Document**: Only `configId == 'config'` is allowed under `/users/{userId}/budget/{configId}` to prevent arbitrary shadow config documents.
3. **Positive Bounded Amounts**: `monthlyBudget` must be a number in `[0, 100000000]`; movement `amount` must be strictly `> 0` and `<= 100000000`.
4. **Strict Movement Type & Date**: `type` must be `'expense'` or `'income'`, `day` must be in `[1, 31]`, and `dateISO` must match `^\d{4}-\d{2}-\d{2}$` with exact length `10`.
5. **Immutable Ownership & Creation Time**: `uid` and `createdAt` can never change after creation; `createdAt` and `updatedAt` must equal `request.time`.
6. **Zero Shadow Fields**: `keys().hasAll(...)` + `keys().hasOnly(...)` on create and `affectedKeys().hasOnly(...)` on update block any unexpected keys.

## 2. The "Dirty Dozen" Attack Payloads (All Must Return PERMISSION_DENIED)
1. **Unauthenticated read/write**: `auth = null` attempting `get /users/u1/budget/config`.
2. **Cross-user get**: `auth.uid = 'u2'` attempting `get /users/u1/budget/config`.
3. **Cross-user list**: `auth.uid = 'u2'` attempting `list /users/u1/movements`.
4. **UID spoofing on create**: `auth.uid = 'u1'` writing `{ uid: 'u2', ... }` under `/users/u1/movements/m1`.
5. **Shadow field injection on create**: `auth.uid = 'u1'` writing `{ ..., isAdmin: true }` to `/users/u1/budget/config`.
6. **Shadow field injection on update**: `auth.uid = 'u1'` updating `monthlyBudget` while adding `role: 'admin'`.
7. **Immutable field tampering**: `auth.uid = 'u1'` modifying `createdAt` or `uid` on update.
8. **Fake client timestamp**: `auth.uid = 'u1'` setting `createdAt` or `updatedAt` to a client timestamp instead of `request.time`.
9. **Path ID poisoning**: `auth.uid = 'u1'` creating `/users/u1/movements/bad$id/with/chars` or >128-char ID.
10. **String size exhaustion**: `auth.uid = 'u1'` creating a movement with a 5,000-char `description` or 10,000-char `notes`.
11. **Invalid amount / negative budget**: `auth.uid = 'u1'` creating a movement with `amount: -5000` or `amount: 0`, or `monthlyBudget: -100`.
12. **Arbitrary budget config doc ID**: `auth.uid = 'u1'` creating `/users/u1/budget/shadow_doc` instead of `config`.
