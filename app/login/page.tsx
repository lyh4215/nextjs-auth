import { redirect } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { AuthForm } from "@/app/components/auth-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  if (await getCurrentUser()) redirect("/dashboard");
  const { reason } = await searchParams;

  return (
    <main className="flex min-h-svh items-center justify-center bg-[radial-gradient(circle_at_15%_20%,rgba(96,165,250,.25),transparent_30%),radial-gradient(circle_at_85%_85%,rgba(129,140,248,.2),transparent_32%)] bg-slate-50 p-5">
      <Card className="w-full max-w-md shadow-xl shadow-blue-950/10">
        <CardHeader className="gap-2 px-6 pt-2">
          <p className="text-xs font-semibold tracking-[0.16em] text-primary">SERVER SESSION</p>
          <CardTitle className="text-2xl font-semibold tracking-tight">다시 만나 반가워요</CardTitle>
          <CardDescription>계정에 안전하게 로그인하세요.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 px-6 pb-2">
        {(reason === "session-ended" || reason === "session-replaced") && (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertDescription>
              {reason === "session-replaced"
                ? "다른 곳에서 이 계정으로 로그인하여 자동 로그아웃되었습니다."
                : "로그인 세션이 만료되어 자동 로그아웃되었습니다."}
            </AlertDescription>
          </Alert>
        )}
        <AuthForm mode="login" />
        </CardContent>
      </Card>
    </main>
  );
}
