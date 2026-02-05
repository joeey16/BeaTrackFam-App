import AsyncStorage from "@react-native-async-storage/async-storage";

export type SocialProvider = "google" | "facebook" | "apple";

type SocialPasswordStore = Record<
  string,
  {
    password: string;
    provider: SocialProvider;
    updatedAt: string;
  }
>;

const SOCIAL_PASSWORDS_KEY = "@beatrackfam:social_passwords";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function getSocialPassword(email: string): Promise<string | null> {
  const raw = await AsyncStorage.getItem(SOCIAL_PASSWORDS_KEY);
  if (!raw) return null;
  try {
    const store = JSON.parse(raw) as SocialPasswordStore;
    return store[normalizeEmail(email)]?.password ?? null;
  } catch {
    return null;
  }
}

export async function setSocialPassword(
  email: string,
  password: string,
  provider: SocialProvider,
): Promise<void> {
  const raw = await AsyncStorage.getItem(SOCIAL_PASSWORDS_KEY);
  let store: SocialPasswordStore = {};
  if (raw) {
    try {
      store = JSON.parse(raw) as SocialPasswordStore;
    } catch {
      store = {};
    }
  }
  store[normalizeEmail(email)] = { password, provider, updatedAt: new Date().toISOString() };
  await AsyncStorage.setItem(SOCIAL_PASSWORDS_KEY, JSON.stringify(store));
}

export function generateSocialPassword(seed: string): string {
  const cleanSeed = seed.toLowerCase().replace(/[^a-z0-9]/g, "");
  const rand = Math.random().toString(36).slice(2, 10);
  const time = Date.now().toString(36);
  const base = `Btf!${rand}${time}${cleanSeed.slice(0, 3)}`;
  return base.length >= 12 ? base : `${base}9X!`;
}
