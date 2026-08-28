import { useSession } from "@repo/auth/client";
import { AuthForm } from "./components/AuthForm";
import { Shell } from "./components/Shell";

export default function App() {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <main className="flex min-h-dvh items-center justify-center text-sm text-muted-foreground">
        Loading…
      </main>
    );
  }

  if (!session) {
    return <AuthForm />;
  }

  return <Shell name={session.user.name} email={session.user.email} />;
}
