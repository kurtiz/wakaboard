import { Directory, File, Paths } from "expo-file-system";

const avatarDirectory = new Directory(Paths.document, "leader-avatars");
const pending = new Map<string, Promise<string | null>>();

function avatarFile(id: string): File | null {
  if (!/^[\w-]{1,80}$/.test(id)) return null;
  return new File(avatarDirectory, `${id}.image`);
}

export function cachedAvatarUri(id: string): string | null {
  if (process.env.EXPO_OS === "web") return null;
  const file = avatarFile(id);
  try { return file?.exists ? file.uri : null; }
  catch { return null; }
}

export async function cacheAvatar(id: string, url: string): Promise<string | null> {
  if (process.env.EXPO_OS === "web" || !url.startsWith("https://")) return null;
  const file = avatarFile(id);
  if (!file) return null;
  const existing = pending.get(id);
  if (existing) return existing;
  const download = (async () => {
    try {
      avatarDirectory.create({ idempotent: true, intermediates: true });
      const result = await File.downloadFileAsync(url, file, { idempotent: true });
      return result.uri;
    } catch { return cachedAvatarUri(id); }
  })();
  pending.set(id, download);
  try { return await download; }
  finally { pending.delete(id); }
}
