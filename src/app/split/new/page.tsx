import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { BackLink } from "@/components/BackLink";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";

export default function NewSplitPage() {
  return (
    <AppShell>
      <nav className="mb-4 animate-fade-up" aria-label="Back">
        <BackLink href="/" label="Back to home" />
      </nav>

      <PageHeader
        align="center"
        stepLabel="Step 1 of 3"
        title="Snap the receipt"
      />

      <section
        aria-label="Capture receipt"
        className="flex flex-1 flex-col gap-3 animate-fade-up-delay"
      >
        <label className="flex min-h-52 cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-surface px-6 py-10 text-center transition-colors hover:border-accent">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-accent">
            <CameraIcon />
          </span>
          <span className="font-medium text-foreground">Take a photo</span>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
          />
        </label>

        <label className="inline-flex h-12 w-full cursor-pointer items-center justify-center rounded-2xl border border-border bg-surface px-5 text-base font-medium text-foreground transition-colors hover:bg-background">
          Choose from gallery
          <input type="file" accept="image/*" className="sr-only" />
        </label>

        <footer className="mt-auto pt-8">
          <Link href="/split/demo/participants" className="block">
            <Button fullWidth size="lg">
              Next
            </Button>
          </Link>
        </footer>
      </section>
    </AppShell>
  );
}

function CameraIcon() {
  return (
    <svg
      aria-hidden
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}
