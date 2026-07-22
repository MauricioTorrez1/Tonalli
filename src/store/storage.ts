/**
 * Typed, validated wrapper around AsyncStorage.
 *
 * Anything read back from storage is an untrusted string: it may come from an
 * older app version or be corrupt. Every read is parsed against a Zod schema at
 * the boundary, so the rest of the app only ever sees well-formed data. On any
 * failure we return `null` and let the caller start clean instead of crashing.
 * See docs/adr/0003-zod-validation-at-the-boundary.md.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { z } from "zod";

/**
 * Read and validate a JSON value. The generic `T` is inferred from the schema,
 * so `load(key, blockSchema)` returns `Block | null` with no manual annotation.
 */
export async function load<T>(
  key: string,
  schema: z.ZodType<T>,
): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw === null) {
      return null;
    }
    const parsed: unknown = JSON.parse(raw);
    const result = schema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    // Malformed JSON or a storage error — treat as "no usable data".
    return null;
  }
}

/** Serialize and persist a value under `key`. */
export async function save<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

/** Remove a stored value. Used by tests and the future "reset" action. */
export async function remove(key: string): Promise<void> {
  await AsyncStorage.removeItem(key);
}
