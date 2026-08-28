import { CreateProjectForm } from "./CreateProjectForm";
import { ProjectTable } from "./ProjectTable";
import { SignOutButton } from "./SignOutButton";
import { ThemeToggle } from "./ThemeToggle";

interface ShellProps {
  name: string;
  email: string;
}

export function Shell({ name, email }: ShellProps) {
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <span className="text-sm font-semibold">{{ APP_TITLE }}</span>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:block">
              {name} · {email}
            </span>
            <ThemeToggle />
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-10">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Example feature: create and manage projects. Replace it with your own idea.
          </p>
        </div>
        <CreateProjectForm />
        <ProjectTable />
      </main>
    </div>
  );
}
