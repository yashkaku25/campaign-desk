import "server-only";

import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

import { logError } from "@/lib/errors/log-error";

const scryptAsync = promisify(scrypt);
const filePath = path.join(process.cwd(), "data", "local-accounts.json");

interface LocalAccount {
  userId: string;
  email: string;
  passwordHash: string;
}

interface LocalAccountFile {
  accounts: LocalAccount[];
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("base64url");
  const derived = (await scryptAsync(password, salt, 32)) as Buffer;
  return `${salt}.${derived.toString("base64url")}`;
}

export async function passwordMatchesHash(password: string, stored: string): Promise<boolean> {
  const [salt, hash] = stored.split(".");
  if (!salt || !hash) return false;
  const derived = (await scryptAsync(password, salt, 32)) as Buffer;
  const expected = Buffer.from(hash, "base64url");
  if (derived.length !== expected.length) return false;
  return timingSafeEqual(derived, expected);
}

export async function findLocalAccount(email: string): Promise<LocalAccount | null> {
  const file = await readAccounts();
  return file.accounts.find((account) => account.email === email) ?? null;
}

export async function findLocalAccountByUserId(userId: string): Promise<LocalAccount | null> {
  const file = await readAccounts();
  return file.accounts.find((account) => account.userId === userId) ?? null;
}

export async function saveLocalAccount(account: LocalAccount): Promise<void> {
  const file = await readAccounts();
  const without = file.accounts.filter((item) => item.userId !== account.userId && item.email !== account.email);
  without.push(account);
  await writeAccounts({ accounts: without });
}

export async function deleteLocalAccount(userId: string): Promise<void> {
  const file = await readAccounts();
  await writeAccounts({ accounts: file.accounts.filter((account) => account.userId !== userId) });
}

async function writeAccounts(file: LocalAccountFile): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(file, null, 2), "utf8");
}

async function readAccounts(): Promise<LocalAccountFile> {
  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as LocalAccountFile;
    if (!Array.isArray(parsed.accounts)) return { accounts: [] };
    return parsed;
  } catch (error) {
    const missing = error instanceof Error && "code" in error && error.code === "ENOENT";
    if (missing) return { accounts: [] };
    logError({
      what: "Could not read local accounts.",
      why: "The account file is not valid JSON.",
      file: "src/features/auth/services/local-accounts.ts",
      connectedTo: "data/local-accounts.json",
      fix: "Delete data/local-accounts.json and create the account again.",
      cause: error,
    });
    return { accounts: [] };
  }
}
