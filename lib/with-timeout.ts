// Bounds how long the public demo waits on the live backend. Supabase
// calls have no built-in timeout, and a paused project can black-hole
// requests for seconds: without a cap, the menu, crew, and guest session
// would sit empty while the request hangs. On timeout the caller falls
// back to bundled sample data (or treats the visitor as a guest) instead
// of waiting. A healthy backend answers well inside the cap, so the live
// path is unaffected.
export async function withTimeout<T>(promise: PromiseLike<T> | Promise<T>, ms: number): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), ms);
  });
  try {
    return await Promise.race([Promise.resolve(promise), timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
