import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { CreateProjectForm } from "@/components/CreateProjectForm";
import { ProjectTable } from "@/components/ProjectTable";
import { auth } from "@/lib/auth";
import { listProjects } from "@/lib/queries/projects";

export const metadata = { title: "Dashboard – {{APP_TITLE}}" };

export default async function DashboardPage() {
  // The layout redirects unauthenticated visitors, but layouts and pages render
  // in parallel — the page cannot rely on that guard having run before its own
  // query, and it needs the user id to scope the query anyway.
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/login");
  }

  // The Hono API's GET /api/projects calls this same function.
  const ownProjects = await listProjects(session.user.id);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Example feature: create and manage projects. Replace it with your own idea.
        </p>
      </div>
      <CreateProjectForm />
      <ProjectTable projects={ownProjects} />
    </div>
  );
}
