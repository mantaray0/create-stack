import { db, projects } from "@repo/db";
import { desc } from "drizzle-orm";
import { CreateProjectForm } from "@/components/CreateProjectForm";
import { ProjectTable } from "@/components/ProjectTable";

export const metadata = { title: "Dashboard – {{APP_TITLE}}" };

export default async function DashboardPage() {
  const allProjects = await db.query.projects.findMany({
    orderBy: desc(projects.createdAt),
  });

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Example feature: create and manage projects. Replace it with your own idea.
        </p>
      </div>
      <CreateProjectForm />
      <ProjectTable projects={allProjects} />
    </div>
  );
}
