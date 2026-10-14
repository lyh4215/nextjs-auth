"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";

export type AdminActionState = { error?: string; success?: string };

function field(form: FormData, key: string) {
  const value = form.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function createRoleAction(
  _state: AdminActionState,
  form: FormData,
): Promise<AdminActionState> {
  await requireRole("admin");
  const key = field(form, "key");
  const name = field(form, "name");
  const description = field(form, "description");
  if (!/^[a-z][a-z0-9_-]{0,49}$/.test(key)) {
    return { error: "역할 키는 영문 소문자로 시작하는 1~50자의 소문자, 숫자, 하이픈, 밑줄로 입력해 주세요." };
  }
  if (!name || name.length > 50 || description.length > 200) {
    return { error: "이름은 1~50자, 설명은 200자 이하로 입력해 주세요." };
  }
  try {
    await db.role.create({ data: { key, name, description: description || null } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { error: "이미 존재하는 역할 키입니다." };
    }
    throw error;
  }
  revalidatePath("/admin");
  return { success: `${name} 역할을 만들었습니다.` };
}

export async function changeUserRoleAction(
  _state: AdminActionState,
  form: FormData,
): Promise<AdminActionState> {
  const actor = await requireRole("admin");
  const userId = field(form, "userId");
  const roleId = field(form, "roleId");
  const operation = field(form, "operation");
  if (!userId || !roleId || !["grant", "revoke"].includes(operation)) {
    return { error: "사용자와 역할을 선택해 주세요." };
  }
  const [user, role] = await Promise.all([
    db.user.findUnique({ where: { id: userId }, select: { id: true } }),
    db.role.findUnique({ where: { id: roleId }, select: { id: true, key: true, name: true } }),
  ]);
  if (!user || !role) return { error: "사용자 또는 역할을 찾을 수 없습니다." };
  // Keep the current administrator from locking themselves out.
  if (operation === "revoke" && userId === actor.id && role.key === "admin") {
    return { error: "자신의 관리자 역할은 회수할 수 없습니다." };
  }
  try {
    if (operation === "grant") {
      await db.userRole.upsert({
        where: { userId_roleId: { userId, roleId } },
        create: { userId, roleId },
        update: {},
      });
    } else {
      await db.userRole.deleteMany({ where: { userId, roleId } });
    }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return { error: "사용자 또는 역할이 변경되었습니다. 새로고침 후 다시 시도해 주세요." };
    }
    throw error;
  }
  revalidatePath("/admin");
  revalidatePath("/dashboard");
  return { success: `${role.name} 역할을 ${operation === "grant" ? "부여" : "회수"}했습니다.` };
}
