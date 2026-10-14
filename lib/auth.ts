import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { publishSessionReplacement } from "@/lib/session-events";
import { hasRole } from "@/lib/roles";

export const SESSION_COOKIE_NAME = "session_id";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function digestSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}

export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const id = digestSessionToken(token);
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);

  // userId is unique. Concurrent logins serialize through this DB constraint;
  // whichever upsert commits last replaces the previous session id.
  await db.session.upsert({
    where: { userId },
    create: { id, userId, expiresAt },
    update: { id, expiresAt, createdAt: new Date() },
  });

  // Notify connections that still belong to the session just replaced.
  publishSessionReplacement(userId, id);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, cookieOptions());
}

export async function deleteCurrentSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    await db.session.deleteMany({ where: { id: digestSessionToken(token) } });
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await db.session.findFirst({
    where: {
      id: digestSessionToken(token),
      expiresAt: { gt: new Date() },
    },
    select: {
      id: true,
      expiresAt: true,
      user: {
        select: {
          id: true,
          email: true,
          displayName: true,
          createdAt: true,
          updatedAt: true,
          roles: {
            select: { role: { select: { key: true } } },
          },
        },
      },
    },
  });

  if (!session) return null;

  return session;
}

export async function getCurrentUser() {
  return (await getCurrentSession())?.user ?? null;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** Guard each protected page, data operation, and Server Action independently. */
export async function requireRole(roleKey: string) {
  const user = await requireUser();
  if (!hasRole(user, roleKey)) redirect("/forbidden");
  return user;
}
