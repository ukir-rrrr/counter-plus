function isPromise(value: unknown): value is Promise<unknown> {
  return typeof value === 'object' && value != null && typeof (value as Promise<unknown>).then === 'function';
}

/** テスト中だけ EXPO_PUBLIC_* を差し替え、終わったら戻す */
export function withPublicEnv<T>(values: Record<string, string | undefined>, run: () => T): T {
  const previous: Record<string, string | undefined> = {};
  for (const key of Object.keys(values)) {
    previous[key] = process.env[key];
    const next = values[key];
    if (next === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = next;
    }
  }
  const restore = () => {
    for (const key of Object.keys(values)) {
      const restored = previous[key];
      if (restored === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = restored;
      }
    }
  };
  try {
    const result = run();
    if (isPromise(result)) {
      return result.finally(restore) as T;
    }
    restore();
    return result;
  } catch (e) {
    restore();
    throw e;
  }
}
