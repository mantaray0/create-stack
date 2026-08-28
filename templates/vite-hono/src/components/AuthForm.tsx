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
import { useState, useTransition } from "react";
import { ThemeToggle } from "./ThemeToggle";

type Mode = "login" | "register";

export function AuthForm() {
  const [mode, setMode] = useState<Mode>("login");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

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
      }
    });
  }

  return (
    <main className="flex min-h-dvh items-center justify-center px-6">
      <div className="fixed top-4 right-4">
        <ThemeToggle />
      </div>
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
          <button
            type="button"
            onClick={() => {
              setMode(isLogin ? "register" : "login");
              setError(null);
            }}
            className="mt-4 w-full cursor-pointer text-center text-sm text-muted-foreground hover:text-foreground"
          >
            {isLogin ? "No account yet? Sign up" : "Already have an account? Sign in"}
          </button>
        </CardContent>
      </Card>
    </main>
  );
}
