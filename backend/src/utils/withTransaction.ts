import mongoose, { ClientSession } from 'mongoose';

function isTxnUnsupported(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /Transaction numbers are only allowed on a replica set member or mongos/i.test(msg);
}

/** Runs fn in a transaction when supported (e.g. Atlas); falls back to non-transactional on standalone MongoDB. */
export async function withOptionalTransaction<T>(
  fn: (session?: ClientSession) => Promise<T>
): Promise<T> {
  const session = await mongoose.startSession();
  try {
    let result!: T;
    await session.withTransaction(async () => {
      result = await fn(session);
    });
    return result;
  } catch (err) {
    if (isTxnUnsupported(err)) {
      return fn();
    }
    throw err;
  } finally {
    await session.endSession();
  }
}
