import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { ProjectTable } from "./ProjectTable";

// The table imports a Server Action, which pulls in the Next request runtime.
// A component test has no request, so the action module is mocked away.
vi.mock("@/lib/actions/project-actions", () => ({ deleteProject: vi.fn() }));

test("renders the empty state when there are no projects", () => {
  render(<ProjectTable projects={[]} />);

  expect(screen.getByText(/no projects yet/i)).toBeInTheDocument();
});
