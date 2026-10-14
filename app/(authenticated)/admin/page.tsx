import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { CreateRoleForm, UserRoleForm } from "@/app/components/admin-forms";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default async function AdminPage() {
  const actor = await requireRole("admin");
  const [roles, users] = await Promise.all([
    db.role.findMany({ orderBy: { key: "asc" }, select: { id: true, key: true, name: true, description: true, _count: { select: { users: true } } } }),
    db.user.findMany({ orderBy: { createdAt: "asc" }, select: { id: true, email: true, displayName: true, roles: { select: { roleId: true } } } }),
  ]);
  return <main className="min-h-svh bg-slate-50 px-5 py-10 sm:px-8">
    <div className="mx-auto grid max-w-6xl gap-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="grid gap-2">
          <p className="flex items-center gap-2 text-sm font-semibold text-primary"><ShieldCheck className="size-4" /> 계정 관리</p>
          <h1 className="text-3xl font-semibold tracking-tight">역할 및 사용자 관리</h1>
          <p className="text-muted-foreground">역할을 만들고 사용자에게 필요한 권한을 부여하세요.</p>
        </div>
        <Button asChild variant="outline"><Link href="/dashboard">대시보드로 돌아가기</Link></Button>
      </header>
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="grid content-start gap-6">
          <Card>
            <CardHeader><CardTitle>새 역할</CardTitle><CardDescription>사용자에게 부여할 역할을 추가합니다.</CardDescription></CardHeader>
            <CardContent><CreateRoleForm /></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>등록된 역할 · {roles.length}</CardTitle></CardHeader>
            <CardContent><ul className="grid gap-4">
              {roles.map((role) => <li key={role.id} className="grid gap-1 border-b pb-3 last:border-0 last:pb-0">
                <div className="flex justify-between gap-2"><span className="font-medium">{role.name}</span><span className="text-sm text-muted-foreground">{role._count.users}명</span></div>
                <code className="text-xs text-muted-foreground">{role.key}</code>
                {role.description && <p className="break-words text-sm text-muted-foreground">{role.description}</p>}
              </li>)}
            </ul></CardContent>
          </Card>
        </div>
        <Card className="self-start">
          <CardHeader><CardTitle>사용자 · {users.length}</CardTitle><CardDescription>역할 버튼을 눌러 부여하거나 회수할 수 있습니다. 체크된 역할은 현재 부여된 역할입니다.</CardDescription></CardHeader>
          <CardContent className="grid gap-5">
            {users.map((user) => <section key={user.id} aria-label={`${user.email} 역할 관리`} className="grid gap-4 rounded-xl border p-4">
              <div><h2 className="font-semibold">{user.displayName || "이름 없음"} {actor.id === user.id && <span className="text-xs font-normal text-muted-foreground">(나)</span>}</h2><p className="break-all text-sm text-muted-foreground">{user.email}</p></div>
              {user.roles.length === 0 && <p className="text-sm text-muted-foreground">부여된 역할이 없습니다.</p>}
              <UserRoleForm userId={user.id} roles={roles.map(({ id, key, name }) => ({ id, key, name }))} assignedRoleIds={user.roles.map(({ roleId }) => roleId)} isSelf={actor.id === user.id} />
            </section>)}
          </CardContent>
        </Card>
      </div>
    </div>
  </main>;
}
