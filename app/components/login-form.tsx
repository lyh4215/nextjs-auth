"use client";

import Link from "next/link";
import { AlertCircle, LoaderCircle } from "lucide-react";
import { useActionState, useRef, useState } from "react";
import { loginAction, type AuthActionState } from "@/app/actions/auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: AuthActionState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const replaceSessionRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [dismissedPromptId, setDismissedPromptId] = useState<string>();
  const promptId = state.sessionReplacementPromptId;
  const showReplacementPrompt = Boolean(promptId && promptId !== dismissedPromptId);

  const replaceExistingSession = () => {
    if (formRef.current && replaceSessionRef.current) {
      replaceSessionRef.current.value = "yes";
      formRef.current.requestSubmit();
    }
  };

  return (
    <>
      <form ref={formRef} action={formAction} className="grid gap-5">
        <input ref={replaceSessionRef} type="hidden" name="replaceSession" defaultValue="" />

        <div className="grid gap-2">
          <Label htmlFor="login-email">이메일</Label>
          <Input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="login-password">비밀번호</Label>
          <Input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            maxLength={128}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>

        {state.error && (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending && <LoaderCircle className="animate-spin" />}
          {pending ? "처리 중…" : "로그인"}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          처음이신가요?{" "}
          <Button asChild variant="link" className="h-auto p-0">
            <Link href="/register">회원가입</Link>
          </Button>
        </p>
      </form>

      <AlertDialog
        open={showReplacementPrompt}
        onOpenChange={(open) => {
          if (!open && promptId) setDismissedPromptId(promptId);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>이미 로그인 중인 계정입니다</AlertDialogTitle>
            <AlertDialogDescription>
              계속 로그인하면 기존 기기의 세션이 종료되고 이 기기에서만 로그인 상태가 유지됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={replaceExistingSession}>계속 로그인</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
