import { forwardRef, type ComponentProps } from "react";

type InputProps = ComponentProps<"input">;

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className = "", ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      className={[
        "h-12 w-full rounded-2xl border border-border bg-surface px-4 text-base text-foreground placeholder:text-muted/80",
        "transition-[border-color,box-shadow] focus:border-accent focus:outline-none focus:ring-2 focus:ring-ring",
        "disabled:cursor-not-allowed disabled:opacity-60",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
});
