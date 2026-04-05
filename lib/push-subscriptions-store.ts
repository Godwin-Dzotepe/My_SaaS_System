import { promises as fs } from 'fs';
import path from 'path';

export interface StoredPushSubscription {
  userId: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  createdAt: string;
  updatedAt: string;
}

const DATA_DIR = path.join(process.cwd(), '.data');
const STORE_PATH = path.join(DATA_DIR, 'push-subscriptions.json');

async function ensureStoreFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(STORE_PATH);
  } catch {
    await fs.writeFile(STORE_PATH, '[]', 'utf-8');
  }
}

async function readStore() {
  await ensureStoreFile();
  try {
    const raw = await fs.readFile(STORE_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [] as StoredPushSubscription[];
    return parsed as StoredPushSubscription[];
  } catch {
    return [] as StoredPushSubscription[];
  }
}

async function writeStore(items: StoredPushSubscription[]) {
  await ensureStoreFile();
  await fs.writeFile(STORE_PATH, JSON.stringify(items, null, 2), 'utf-8');
}

export async function upsertPushSubscription(input: {
  userId: string;
  endpoint: string;
  keys: { p256dh: string; auth: string };
}) {
  const all = await readStore();
  const now = new Date().toISOString();
  const existingIdx = all.findIndex((item) => item.endpoint === input.endpoint);

  if (existingIdx >= 0) {
    all[existingIdx] = {
      ...all[existingIdx],
      userId: input.userId,
      keys: input.keys,
      updatedAt: now,
    };
  } else {
    all.push({
      userId: input.userId,
      endpoint: input.endpoint,
      keys: input.keys,
      createdAt: now,
      updatedAt: now,
    });
  }

  await writeStore(all);
}

export async function removePushSubscription(input: { userId?: string; endpoint?: string }) {
  const all = await readStore();
  const filtered = all.filter((item) => {
    if (input.endpoint && item.endpoint === input.endpoint) return false;
    if (input.userId && item.userId === input.userId && !input.endpoint) return false;
    return true;
  });
  await writeStore(filtered);
}

export async function listPushSubscriptionsByUserIds(userIds: string[]) {
  if (userIds.length === 0) return [] as StoredPushSubscription[];
  const all = await readStore();
  const wanted = new Set(userIds);
  return all.filter((item) => wanted.has(item.userId));
}

