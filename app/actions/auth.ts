"use server";

import { Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { createSession, deleteCurrentSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import { DEFAULT_ROLE_KEY } from "@/lib/roles";

export type AuthActionState = {
  error?: string;
  sessionReplacementPromptId?: string;
};

const MIN_PASSWORD_LENGTH = 12;
const MAX_PASSWORD_LENGTH = 128;

function getCredentials(formData: FormData) {
  const emailValue = formData.get("email");
  const passwordValue = formData.get("password");
  const email = typeof emailValue === "string" ? emailValue.trim().toLowerCase() : "";
  const password = typeof passwordValue === "string" ? passwordValue : "";
  return { email, password };
}

function validEmail(email: string) {
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

let dummyHashPromise: Promise<string> | undefined;
function getDummyHash() {
  dummyHashPromise ??= hashPassword("dummy-password-used-to-equalize-login-work");
  return dummyHashPromise;
}

export async function loginAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const { email, password } = getCredentials(formData);
  if (!validEmail(email) || !password || password.length > MAX_PASSWORD_LENGTH) {
    return { error: "이메일 또는 비밀번호가 올바르지 않습니다." };
  }

  const user = await db.user.findUnique({ where: { email } });
  const passwordHash = user?.passwordHash ?? (await getDummyHash());
  const passwordMatches = await verifyPassword(password, passwordHash);

  if (!user || !passwordMatches) {
    return { error: "이메일 또는 비밀번호가 올바르지 않습니다." };
  }

  const replacementConfirmed = formData.get("replaceSession") === "yes";
  const activeSession = await db.session.findUnique({
    where: { userId: user.id },
    select: { expiresAt: true },
  });

  if (activeSession && activeSession.expiresAt > new Date() && !replacementConfirmed) {
    return { sessionReplacementPromptId: randomUUID() };
  }

  // Credentials were verified again on this request. The upsert invalidates
  // the other device's session only after the user confirms the warning.
  await createSession(user.id);
  redirect("/dashboard");
}

export async function registerAction(
  formData: FormData,
): Promise<AuthActionState> {
  const { email, password } = getCredentials(formData);
  const displayNameValue = formData.get("displayName");
  const displayName = typeof displayNameValue === "string" ? displayNameValue.trim() : "";

  if (!validEmail(email)) return { error: "올바른 이메일 주소를 입력해 주세요." };
  if (password.length < MIN_PASSWORD_LENGTH || password.length > MAX_PASSWORD_LENGTH) {
    return { error: `비밀번호는 ${MIN_PASSWORD_LENGTH}~${MAX_PASSWORD_LENGTH}자로 입력해 주세요.` };
  }
  if (displayName.length < 1 || displayName.length > 50) {
    return { error: "이름은 1~50자로 입력해 주세요." };
  }

  try {
    const user = await db.user.create({
      data: {
        email,
        displayName,
        passwordHash: await hashPassword(password),
        // Nested creation is atomic. Never accept role assignments from the form.
        roles: {
          create: { role: { connect: { key: DEFAULT_ROLE_KEY } } },
        },
      },
    });
    await createSession(user.id);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { error: "이미 가입된 이메일입니다." };
    }
    throw error;
  }

  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  await deleteCurrentSession();
  redirect("/login");
}
