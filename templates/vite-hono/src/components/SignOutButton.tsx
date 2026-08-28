import { signOut } from "@repo/auth/client";
import { Button } from "@repo/ui";
import { LogOut } from "lucide-react";
import { useTransition } from "react";

export function SignOutButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="sm"
      isDisabled={isPending}
      onPress={() =>
        startTransition(async () => {
          await signOut();
        })
      }
    >
      <LogOut className="size-4" />
      Sign out
    </Button>
  );
}
