import type { ReactNode } from "react";

type AppShellProps = {
  children: ReactNode;
};

/**
 * Phone-width column centered on larger screens.
 * Spec: min-h-screen bg-background max-w-md mx-auto px-4
 */
export function AppShell({ children }: AppShellProps) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background px-4 py-5">
      {children}
    </main>
  );
}
