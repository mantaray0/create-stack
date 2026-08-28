import {
  Input as AriaInput,
  TextField as AriaTextField,
  type TextFieldProps as AriaTextFieldProps,
  FieldError,
  Label,
  Text,
} from "react-aria-components";
import { cn } from "./cn";

export interface TextFieldProps extends AriaTextFieldProps {
  label: string;
  description?: string;
  inputClassName?: string;
}

export const inputClasses =
  "h-9 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

export function TextField({
  label,
  description,
  className,
  inputClassName,
  ...props
}: TextFieldProps) {
  return (
    <AriaTextField className={cn("flex flex-col gap-1.5", className)} {...props}>
      <Label className="text-sm font-medium text-foreground">{label}</Label>
      <AriaInput className={cn(inputClasses, inputClassName)} />
      {description ? (
        <Text slot="description" className="text-xs text-muted-foreground">
          {description}
        </Text>
      ) : null}
      <FieldError className="text-xs text-danger" />
    </AriaTextField>
  );
}
