import {
  Menu as AriaMenu,
  MenuItem as AriaMenuItem,
  type MenuItemProps as AriaMenuItemProps,
  type MenuProps as AriaMenuProps,
  MenuTrigger,
  Popover,
} from "react-aria-components";
import { cn } from "./cn";

export { MenuTrigger };

export function Menu(props: AriaMenuProps<object>) {
  return (
    <Popover className="z-50 min-w-[10rem] rounded-lg border bg-card p-1 shadow-md">
      <AriaMenu className="flex flex-col gap-0.5 outline-none" {...props} />
    </Popover>
  );
}

export function MenuItem({
  className,
  variant = "default",
  ...props
}: AriaMenuItemProps & {
  variant?: "default" | "danger";
}) {
  return (
    <AriaMenuItem
      className={cn(
        "flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-sm outline-none data-focused:bg-muted data-disabled:opacity-50",
        variant === "danger" ? "text-danger" : "text-foreground",
        className,
      )}
      {...props}
    />
  );
}
