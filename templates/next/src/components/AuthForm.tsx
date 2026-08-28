"use client";

import { signIn, signUp } from "@repo/auth/client";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  TextField,
} from "@repo/ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

interface AuthFormProps {
  mode: "login" | "register";
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isLogin = mode === "login";

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const name = String(formData.get("name") ?? "");

    startTransition(async () => {
      const result = isLogin
        ? await signIn.email({ email, password })
        : await signUp.email({ email, password, name });

      if (result.error) {
        setError(result.error.message ?? "Something went wrong.");
        return;
      }
      router.push("/dashboard");
    });
  }

  return (
    <main className="flex min-h-dvh items-center justify-center px-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{isLogin ? "Sign in" : "Create an account"}</CardTitle>
          <CardDescription>
            {isLogin ? "Welcome back to {{APP_TITLE}}." : "Get started with {{APP_TITLE}}."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {!isLogin && <TextField label="Name" name="name" isRequired autoComplete="name" />}
            <TextField label="Email" name="email" type="email" isRequired autoComplete="email" />
            <TextField
              label="Password"
              name="password"
              type="password"
              isRequired
              autoComplete={isLogin ? "current-password" : "new-password"}
            />
            {error ? <p className="text-sm text-danger">{error}</p> : null}
            <Button type="submit" isDisabled={isPending}>
              {isPending ? "One moment…" : isLogin ? "Sign in" : "Sign up"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            {isLogin ? (
              <>
                No account yet?{" "}
                <Link href="/register" className="font-medium text-primary hover:underline">
                  Sign up
                </Link>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <Link href="/login" className="font-medium text-primary hover:underline">
                  Sign in
                </Link>
              </>
            )}
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
