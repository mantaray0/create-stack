import { Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Trash2 } from "lucide-react";
import { api } from "../lib/api-client";

/**
 * Row shape as the API returns it after JSON serialization
 * (timestamps arrive as ISO strings, not as Date).
 */
export type ProjectRow = {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

const columnHelper = createColumnHelper<ProjectRow>();

export function ProjectTable() {
  const queryClient = useQueryClient();

  const projectsQuery = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const response = await api.projects.$get();
      if (!response.ok) {
        throw new Error("Could not load the projects.");
      }
      const data = await response.json();
      return data.items;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.projects[":id"].$delete({ param: { id } });
      if (!response.ok) {
        throw new Error("Could not delete the project.");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  const columns = [
    columnHelper.accessor("name", {
      header: "Name",
      cell: (info) => <span className="font-medium">{info.getValue()}</span>,
    }),
    columnHelper.accessor("description", {
      header: "Description",
      cell: (info) => <span className="text-muted-foreground">{info.getValue() ?? "—"}</span>,
    }),
    columnHelper.accessor("createdAt", {
      header: "Created",
      cell: (info) => (
        <span className="text-muted-foreground">
          {new Date(info.getValue()).toLocaleDateString("en-US")}
        </span>
      ),
    }),
    columnHelper.display({
      id: "actions",
      header: "",
      cell: (info) => (
        <Button
          variant="ghost"
          size="sm"
          isDisabled={deleteMutation.isPending}
          onPress={() => deleteMutation.mutate(info.row.original.id)}
          aria-label={`Delete project ${info.row.original.name}`}
        >
          <Trash2 className="size-4 text-danger" />
        </Button>
      ),
    }),
  ];

  const table = useReactTable({
    data: projectsQuery.data ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (projectsQuery.isPending) {
    return (
      <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        Loading projects…
      </p>
    );
  }

  if (projectsQuery.isError) {
    return (
      <p className="rounded-lg border border-dashed p-8 text-center text-sm text-danger">
        {projectsQuery.error.message}
      </p>
    );
  }

  if (projectsQuery.data.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        No projects yet. Create your first one above.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <TableHead key={header.id}>
                {flexRender(header.column.columnDef.header, header.getContext())}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.map((row) => (
          <TableRow key={row.id}>
            {row.getVisibleCells().map((cell) => (
              <TableCell key={cell.id}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
