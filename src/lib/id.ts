/**
 * Generate a RFC-4122 version-4 UUID.
 *
 * These are local record ids, not security tokens, so `Math.random` is fine and
 * keeps us free of a native crypto dependency. The output matches the format
 * that `z.uuid()` validates.
 */
export function uuidv4(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0;
    const value = char === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}
