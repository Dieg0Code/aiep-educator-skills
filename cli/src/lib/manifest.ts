import fs from "node:fs";
import path from "node:path";

export const LOCK_FILE = "aiep-skills-lock.json";

export interface LockEntry {
  hash: string;
  syncedAt: string;
}

export interface Lock {
  framework: string;
  generatedAt: string;
  items: Record<string, LockEntry>;
}

export function readLock(targetRoot: string): Lock | null {
  const file = path.join(targetRoot, LOCK_FILE);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8")) as Lock;
}

export function writeLock(targetRoot: string, lock: Lock): void {
  const file = path.join(targetRoot, LOCK_FILE);
  fs.writeFileSync(file, JSON.stringify(lock, null, 2) + "\n");
}
