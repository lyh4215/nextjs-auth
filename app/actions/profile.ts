"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export type ProfileActionState = { error?: string; success?: string };

export async function updateProfileAction(
  _previousState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  // Never trust a client-supplied user id. Identity comes from the server session.
  const user = await requireUser();
  const value = formData.get("displayName");
  const displayName = typeof value === "string" ? value.trim() : "";

  if (displayName.length < 1 || displayName.length > 50) {
    return { error: "이름은 1~50자로 입력해 주세요." };
  }

  // The user id from requireUser is also the authorization boundary.
  const result = await db.user.updateMany({
    where: { id: user.id },
    data: { displayName },
  });
  if (result.count !== 1) return { error: "프로필을 수정할 수 없습니다." };

  revalidatePath("/dashboard");
  return { success: "프로필을 저장했습니다." };
}
