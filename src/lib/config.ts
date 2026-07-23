/**
 * Runtime config read from environment variables. `EXPO_PUBLIC_*` vars are
 * inlined at build time by Expo — no extra package needed. Never hardcode a
 * personal URL here: the donation link only appears in Settings when the
 * variable is set, so the app works (link just hidden) for anyone who clones
 * the repo without their own `.env`.
 */

/** Optional external donation link (e.g. Ko-fi). Unset = hidden in Settings. */
export const donationUrl: string | undefined =
  process.env.EXPO_PUBLIC_DONATION_URL;
