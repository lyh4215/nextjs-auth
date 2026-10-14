import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ForbiddenPage() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-2xl font-semibold">접근 권한이 없습니다</h1>
      <p className="text-muted-foreground">이 기능을 사용할 수 있는 역할이 필요합니다.</p>
      <Button asChild>
        <Link href="/dashboard">대시보드로 돌아가기</Link>
      </Button>
    </main>
  );
}
