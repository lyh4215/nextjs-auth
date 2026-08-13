"use client";

import Link from "next/link";
import { AlertCircle, LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { registerAction } from "@/app/actions/auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type RegisterFormValues = {
  displayName: string;
  email: string;
  password: string;
  passwordConfirmation: string;
};

export function RegisterForm() {
  const [serverError, setServerError] = useState<string>();
  const {
    register,
    control,
    handleSubmit,
    getValues,
    trigger,
    formState: { errors, isSubmitting, isValid, touchedFields },
  } = useForm<RegisterFormValues>({
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      displayName: "",
      email: "",
      password: "",
      passwordConfirmation: "",
    },
  });
  const password = useWatch({ control, name: "password" });

  useEffect(() => {
    if (touchedFields.passwordConfirmation) {
      void trigger("passwordConfirmation");
    }
  }, [password, touchedFields.passwordConfirmation, trigger]);

  const onSubmit = handleSubmit(async ({ displayName, email, password }) => {
    setServerError(undefined);
    const formData = new FormData();
    formData.set("displayName", displayName);
    formData.set("email", email);
    formData.set("password", password);

    const result = await registerAction(formData);
    if (result?.error) setServerError(result.error);
  });

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-5">
      <div className="grid gap-2">
        <Label htmlFor="register-display-name">이름</Label>
        <Input
          id="register-display-name"
          type="text"
          autoComplete="name"
          aria-invalid={Boolean(errors.displayName)}
          aria-describedby={errors.displayName ? "display-name-error" : undefined}
          {...register("displayName", {
            required: "이름을 입력해 주세요.",
            validate: (value) => value.trim().length > 0 || "공백만 입력할 수 없습니다.",
            maxLength: { value: 50, message: "이름은 50자 이하로 입력해 주세요." },
          })}
        />
        {errors.displayName && (
          <p id="display-name-error" className="text-xs text-destructive">
            {errors.displayName.message}
          </p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="register-email">이메일</Label>
        <Input
          id="register-email"
          type="email"
          autoComplete="email"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "email-error" : undefined}
          {...register("email", {
            required: "이메일을 입력해 주세요.",
            maxLength: { value: 254, message: "이메일은 254자 이하로 입력해 주세요." },
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: "올바른 이메일 주소를 입력해 주세요.",
            },
          })}
        />
        {errors.email && (
          <p id="email-error" className="text-xs text-destructive">
            {errors.email.message}
          </p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="register-password">비밀번호</Label>
        <Input
          id="register-password"
          type="password"
          autoComplete="new-password"
          aria-invalid={Boolean(errors.password)}
          aria-describedby={errors.password ? "password-error" : "password-help"}
          {...register("password", {
            required: "비밀번호를 입력해 주세요.",
            minLength: { value: 12, message: "비밀번호는 12자 이상이어야 합니다." },
            maxLength: { value: 128, message: "비밀번호는 128자 이하로 입력해 주세요." },
          })}
        />
        {errors.password ? (
          <p id="password-error" className="text-xs text-destructive">
            {errors.password.message}
          </p>
        ) : (
          <p id="password-help" className="text-xs text-muted-foreground">
            12~128자로 입력해 주세요.
          </p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="register-password-confirmation">비밀번호 확인</Label>
        <Input
          id="register-password-confirmation"
          type="password"
          autoComplete="new-password"
          aria-invalid={Boolean(errors.passwordConfirmation)}
          aria-describedby={errors.passwordConfirmation ? "password-confirmation-error" : undefined}
          {...register("passwordConfirmation", {
            required: "비밀번호를 한 번 더 입력해 주세요.",
            validate: (value) => value === getValues("password") || "비밀번호가 일치하지 않습니다.",
          })}
        />
        {errors.passwordConfirmation && (
          <p id="password-confirmation-error" className="text-xs text-destructive">
            {errors.passwordConfirmation.message}
          </p>
        )}
      </div>

      {serverError && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting || !isValid}>
        {isSubmitting && <LoaderCircle className="animate-spin" />}
        {isSubmitting ? "처리 중…" : "계정 만들기"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        이미 계정이 있나요?{" "}
        <Button asChild variant="link" className="h-auto p-0">
          <Link href="/login">로그인</Link>
        </Button>
      </p>
    </form>
  );
}
