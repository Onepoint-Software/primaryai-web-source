const store = new Map<string, unknown>();

export const cache = {
  get<T>(key: string) {
    return store.get(key) as T | undefined;
  },
  has(key: string) {
    return store.has(key);
  },
  set<T>(key: string, value: T) {
    store.set(key, value);
  },
};
