"use client";

import { useActionState } from "react";
import { createRoleAction, changeUserRoleAction, type AdminActionState } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: AdminActionState = {};

function Feedback({ state }: { state: AdminActionState }) {
  return <div aria-live="polite" className="text-sm">
    {state.error && <p role="alert" className="text-destructive">{state.error}</p>}
    {state.success && <p className="text-emerald-700">{state.success}</p>}
  </div>;
}

export function CreateRoleForm() {
  const [state, action, pending] = useActionState(createRoleAction, initialState);
  return <form action={action} className="grid gap-4">
    <div className="grid gap-2">
      <Label htmlFor="role-key">역할 키</Label>
      <Input id="role-key" name="key" placeholder="예: editor" required maxLength={50} pattern="[a-z][a-z0-9_\-]{0,49}" />
      <p className="text-xs text-muted-foreground">영문 소문자로 시작하며 숫자, 하이픈, 밑줄을 사용할 수 있습니다.</p>
    </div>
    <div className="grid gap-2">
      <Label htmlFor="role-name">표시 이름</Label>
      <Input id="role-name" name="name" placeholder="예: 편집자" required maxLength={50} />
    </div>
    <div className="grid gap-2">
      <Label htmlFor="role-description">설명 (선택)</Label>
      <Input id="role-description" name="description" placeholder="역할의 용도를 입력하세요" maxLength={200} />
    </div>
    <Feedback state={state} />
    <Button type="submit" disabled={pending}>{pending ? "생성 중…" : "역할 만들기"}</Button>
  </form>;
}

type RoleOption = { id: string; key: string; name: string };

export function UserRoleForm({ userId, roles, assignedRoleIds, isSelf }: {
  userId: string;
  roles: RoleOption[];
  assignedRoleIds: string[];
  isSelf: boolean;
}) {
  const [state, action, pending] = useActionState(changeUserRoleAction, initialState);
  return <div className="grid gap-3">
    <div className="flex flex-wrap gap-2">
      {roles.map((role) => {
        const assigned = assignedRoleIds.includes(role.id);
        const locked = isSelf && role.key === "admin" && assigned;
        return <form key={role.id} action={action}>
          <input type="hidden" name="userId" value={userId} />
          <input type="hidden" name="roleId" value={role.id} />
          <input type="hidden" name="operation" value={assigned ? "revoke" : "grant"} />
          <Button type="submit" variant={assigned ? "default" : "outline"} disabled={pending || locked}
            aria-label={`${role.name} 역할 ${assigned ? "회수" : "부여"}`}
            title={locked ? "자신의 관리자 역할은 회수할 수 없습니다" : `${role.key}: 클릭하여 ${assigned ? "회수" : "부여"}`}>
            {assigned ? "✓" : "+"} {role.name}
          </Button>
        </form>;
      })}
    </div>
    <Feedback state={state} />
  </div>;
}
