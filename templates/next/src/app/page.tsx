import { Button } from "@repo/ui";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col items-center justify-center px-6 text-center">
      <span className="rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
        {{ APP_TITLE }}
      </span>
      <h1 className="mt-6 text-4xl font-bold tracking-tight text-balance sm:text-5xl">
        Your idea. Your prototype.
      </h1>
      <p className="mt-4 max-w-xl text-base text-muted-foreground">
        This is your prototype's landing page. Replace it with your pitch, your value proposition,
        or send visitors straight into the app.
      </p>
      <div className="mt-8 flex items-center gap-3">
        <Link href="/register">
          <Button size="lg">
            Get started
            <ArrowRight className="size-4" />
          </Button>
        </Link>
        <Link href="/login">
          <Button size="lg" variant="secondary">
            Sign in
          </Button>
        </Link>
      </div>
    </main>
  );
}
