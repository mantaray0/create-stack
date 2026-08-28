import { Button, Card, CardContent, CardHeader, CardTitle, inputClasses } from "@repo/ui";
import type { CreateProjectInput } from "@repo/validators";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";
import { api } from "../lib/api-client";

export function CreateProjectForm() {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const mutation = useMutation({
    mutationFn: async (input: CreateProjectInput) => {
      const response = await api.projects.$post({ json: input });
      if (!response.ok) {
        throw new Error("Could not create the project.");
      }
      return response.json();
    },
    onSuccess: () => {
      setName("");
      setDescription("");
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    mutation.mutate({
      name,
      description: description.trim() === "" ? undefined : description,
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>New project</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Name"
            required
            minLength={2}
            className={inputClasses}
          />
          <input
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Description (optional)"
            className={inputClasses}
          />
          <Button type="submit" isDisabled={mutation.isPending}>
            <Plus className="size-4" />
            {mutation.isPending ? "Creating…" : "Create"}
          </Button>
        </form>
        {mutation.isError ? (
          <p className="mt-2 text-sm text-danger">{mutation.error.message}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
