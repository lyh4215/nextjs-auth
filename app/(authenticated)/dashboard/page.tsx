import { logoutAction } from "@/app/actions/auth";
import { ProfileForm } from "@/app/components/profile-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { requireUser } from "@/lib/auth";
import Link from "next/link";
import { hasRole } from "@/lib/roles";

export default async function DashboardPage() {
  const user = await requireUser();

  return (
    <main className="flex min-h-svh items-center justify-center bg-slate-50 p-5 sm:p-8">
      <Card className="w-full max-w-3xl shadow-xl shadow-slate-950/5">
        <CardHeader className="gap-2 px-6 pt-2 sm:px-8">
          <p className="text-xs font-semibold tracking-[0.16em] text-primary">SIGNED IN</p>
          <CardTitle className="pr-24 text-2xl font-semibold tracking-tight sm:text-3xl">
            안녕하세요, {user.displayName ?? user.email}
          </CardTitle>
          <CardDescription>
            이 페이지는 서버에서 유효한 세션을 확인한 뒤 표시됩니다.
          </CardDescription>
          <CardAction>
          <form action={logoutAction}>
              <Button type="submit" variant="outline">로그아웃</Button>
          </form>
          </CardAction>
        </CardHeader>

        <CardContent className="grid gap-7 px-6 pb-2 sm:px-8">
          {hasRole(user, "admin") && (
            <Button asChild variant="outline" className="w-fit">
              <Link href="/admin">역할 및 사용자 관리</Link>
            </Button>
          )}
          <dl className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border bg-muted/40 p-4">
              <dt className="mb-1 text-xs font-medium text-muted-foreground">이메일</dt>
              <dd className="[overflow-wrap:anywhere] font-medium">{user.email}</dd>
            </div>
            <div className="rounded-lg border bg-muted/40 p-4">
              <dt className="mb-1 text-xs font-medium text-muted-foreground">가입일</dt>
              <dd className="font-medium">{user.createdAt.toLocaleDateString("ko-KR")}</dd>
            </div>
          </dl>

          <Separator />

          <section className="grid gap-4">
            <h2 className="text-lg font-semibold">프로필</h2>
          <ProfileForm displayName={user.displayName ?? ""} />
          </section>
        </CardContent>
      </Card>
    </main>
  );
}
