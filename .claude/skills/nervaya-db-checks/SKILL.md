---
name: nervaya-db-checks
description: MongoDB/Mongoose checklist for Nervaya — connection, model registration, index migrations, validators on updates, TTL, transactions, lean/bounded reads, atomic counters. Use when touching src/lib/models, writing queries in services, or changing any index.
---

# Nervaya DB Checks

Full rules: `FRONTEND_STANDARDS.md` §8. Read the docblock in `src/lib/db/mongodb.ts` before touching any index.

## Connection & registration

- Every DB touch goes through `connectDB()` (`src/lib/db/mongodb.ts`) first. Never call `mongoose.connect` anywhere else (serverless: one cached connection per lambda).
- Models export via the HMR-safe guard: `mongoose.models.X || mongoose.model<IX>('X', schema)`. Document interfaces use the house `I` prefix (`IOrder`, `IUser`).

## Index discipline — the #1 silent-failure trap

`autoIndex` is OFF in production. Mongoose cannot drop an index, and a same-name build with different options fails silently — **the constraint you think you shipped does not exist.**

- Any new/changed index ⇒ a migration script in `scripts/` (run with `npx tsx`) in the SAME PR, verified with `db.collection.getIndexes()`.
- Every `find`/`aggregate` filter or sort path needs a covering index. House shape: `schema.index({ scopeField: 1, createdAt: -1 })`.
- Uniqueness = a **unique index**, never a read-then-write check (reads race). Template: `slot-hold.service.ts` — atomic upsert + catch `E11000`.
- Expiring state = TTL index: `schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })` (`otpToken`, `pendingSignup`, `rateLimit`, `slotHold`).

## Writes

- Schemas declare `required`, `min`/`max`, `enum` (from `enums.ts` `*_VALUES` constants — never duplicated literals), `trim`/`lowercase`.
- `findOneAndUpdate`/`updateOne` MUST pass `{ runValidators: true }` — Mongoose skips validators on updates by default. (Documented exception: `otp-store.ts` `saveOtp`; see the docblock in `otpToken.model.ts`.)
- Multi-document money writes (payment + order + cart) run in `session.withTransaction()` — templates: `payment.service.ts`, `session.service.ts`, `driftOffPayment.service.ts`. External I/O NEVER inside the transaction; finalize after commit (`finalizeSessionBooking` is the standard).
- Monotonic ids (invoice numbers) come from the atomic counter: `nextSequence()` in `counter.model.ts` (`findOneAndUpdate` + `$inc` + upsert) — never `max(existing) + 1`.
- Amounts are integer paise / fixed-point — never float arithmetic.

## Reads

- Read-only queries chain `.lean()` and `.select()` only what the caller needs.
- List endpoints ALWAYS paginate with a clamped limit (≤100) and return `{ data, meta }` — never an unbounded `find()`.
- Never return OTP hashes/tokens in any response.

## Injection

- Filters are built from validated, typed values. User input never reaches `$where`, raw aggregation expressions, or an unescaped `new RegExp()`.
- Never spread a request body into `find()` — operator injection (`{ $gt: '' }`) rides in through unvalidated objects. Whitelist known filter keys.
