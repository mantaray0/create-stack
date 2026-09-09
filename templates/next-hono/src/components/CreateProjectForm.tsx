"use client";

import { Button, Card, CardContent, CardHeader, CardTitle, TextField } from "@repo/ui";
import { Plus } from "lucide-react";
import { useActionState } from "react";
import { type ActionResult, createProject } from "@/lib/actions/project-actions";

const initialState: ActionResult = {};

export function CreateProjectForm() {
  const [state, formAction, isPending] = useActionState<ActionResult, FormData>(
    async (_previous, formData) => {
      return createProject({
        name: formData.get("name"),
        description: formData.get("description") || undefined,
      });
    },
    initialState,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>New project</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <TextField label="Name" name="name" isRequired className="flex-1" />
          <TextField label="Description (optional)" name="description" className="flex-1" />
          <Button type="submit" isDisabled={isPending} className="sm:mb-6">
            <Plus className="size-4" />
            {isPending ? "Creating…" : "Create"}
          </Button>
        </form>
        {state.error ? <p className="mt-2 text-sm text-danger">{state.error}</p> : null}
      </CardContent>
    </Card>
  );
}
