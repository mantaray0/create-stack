"use client";

import { signOut } from "@repo/auth/client";
import { Button } from "@repo/ui";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function SignOutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="sm"
      isDisabled={isPending}
      onPress={() =>
        startTransition(async () => {
          await signOut();
          router.push("/login");
        })
      }
    >
      <LogOut className="size-4" />
      Sign out
    </Button>
  );
}
