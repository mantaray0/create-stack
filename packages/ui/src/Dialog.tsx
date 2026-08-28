import type { ReactNode } from "react";
import {
  Dialog as AriaDialog,
  type DialogProps as AriaDialogProps,
  DialogTrigger,
  Heading,
  Modal,
  ModalOverlay,
} from "react-aria-components";
import { cn } from "./cn";

export { DialogTrigger };

export interface DialogProps extends Omit<AriaDialogProps, "children"> {
  title: string;
  children: ReactNode;
  className?: string;
}

export function Dialog({ title, children, className, ...props }: DialogProps) {
  return (
    <ModalOverlay
      isDismissable
      className="fixed inset-0 z-50 flex min-h-dvh items-center justify-center bg-black/50 p-4"
    >
      <Modal className="w-full max-w-md">
        <AriaDialog
          className={cn("rounded-xl border bg-card p-6 shadow-lg outline-none", className)}
          {...props}
        >
          <Heading slot="title" className="text-base font-semibold text-foreground">
            {title}
          </Heading>
          <div className="mt-3">{children}</div>
        </AriaDialog>
      </Modal>
    </ModalOverlay>
  );
}
